import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

// Helper functions for table formatting
const getTableHeaders = (reportType) => {
  switch(reportType) {
    case 'payments':
      return ['S/N', 'Company', 'Amount', 'Status', 'Date', 'Reference'];
    default: // organizations
      return ['S/N', 'Company Name', 'Phone', 'Address', 'Contact Person', 'Rep.', 'Business Nature'];
  }
};

const getColumnWidths = (reportType) => {
  switch(reportType) {
    case 'payments':
      return [35, 115, 85, 65, 75, 105];
    default: // organizations
      return [35, 100, 80, 100, 80, 60, 80];
  }
};

const getRowData = (item, reportType, sn) => {
  switch(reportType) {
    case 'payments':
      return [
        sn.toString(),
        (item.organizations?.company_name || 'N/A').substring(0, 16),
        `₦${(item.amount || 0).toLocaleString()}`,
        (item.status || 'N/A'),
        new Date(item.created_at).toLocaleDateString(),
        (item.reference || 'N/A').substring(0, 10)
      ];
    default: // organizations
      return [
        sn.toString(),
        (item.company_name || 'N/A').substring(0, 16),
        (item.phone_number || 'N/A'),
        (item.office_address || 'N/A').substring(0, 20),
        (item.contact_person || 'N/A').substring(0, 15),
        (item.representative || 'N/A').substring(0, 10),
        (item.business_nature || 'N/A').substring(0, 15)
      ];
  }
};

const loadLogoImage = async (pdfDoc) => {
  try {
    const logoUrl = '/static/logo.png';
    const logoResponse = await fetch(logoUrl);
    const logoArrayBuffer = await logoResponse.arrayBuffer();
    
    if (logoUrl.toLowerCase().endsWith('.png')) {
      return await pdfDoc.embedPng(logoArrayBuffer);
    } else if (logoUrl.toLowerCase().endsWith('.jpg') || logoUrl.toLowerCase().endsWith('.jpeg')) {
      return await pdfDoc.embedJpg(logoArrayBuffer);
    }
  } catch (logoError) {
    console.error('Error loading logo:', logoError);
  }
  return null;
};

const drawHeader = async (page, pdfDoc, helvBold, helv, width, height, reportType, dateRange, logoImage) => {
  let yPosition = height - 50;

  // Logo at top left
  if (logoImage) {
    const logoWidth = 60;
    const logoHeight = (logoImage.height / logoImage.width) * logoWidth;
    page.drawImage(logoImage, {
      x: 50,
      y: yPosition - logoHeight + 10,
      width: logoWidth,
      height: logoHeight
    });
  }

  // KACCIMA header
  const kaccimaLine1 = 'KANO CHAMBER OF COMMERCE, INDUSTRY,';
  const kaccimaLine2 = 'MINES & AGRICULTURE (KACCIMA)';
  
  const line1Width = helvBold.widthOfTextAtSize(kaccimaLine1, 14);
  const line2Width = helvBold.widthOfTextAtSize(kaccimaLine2, 14);
  
  page.drawText(kaccimaLine1, {
    x: (width - line1Width) / 2,
    y: yPosition,
    size: 14,
    font: helvBold,
    color: rgb(0, 0.5, 0)
  });
  
  yPosition -= 18;
  
  page.drawText(kaccimaLine2, {
    x: (width - line2Width) / 2,
    y: yPosition,
    size: 14,
    font: helvBold,
    color: rgb(0, 0.5, 0)
  });

  yPosition -= 25;

  // Report title
  const reportTitle = reportType === 'organizations' ? 'ORGANIZATIONS LIST' : 'PAYMENTS LIST';
  const titleWidth = helvBold.widthOfTextAtSize(reportTitle, 20);
  page.drawText(reportTitle, {
    x: (width - titleWidth) / 2,
    y: yPosition,
    size: 20,
    font: helvBold
  });

  yPosition -= 25;

  // Date range
  const dateRangeText = `Period: ${new Date(dateRange.start).toLocaleDateString()} to ${new Date(dateRange.end).toLocaleDateString()}`;
  const dateRangeWidth = helv.widthOfTextAtSize(dateRangeText, 10);
  page.drawText(dateRangeText, {
    x: (width - dateRangeWidth) / 2,
    y: yPosition,
    size: 10,
    font: helv
  });

  yPosition -= 18;
  
  // Generation date
  const generatedText = `Generated on: ${new Date().toLocaleString()}`;
  const generatedWidth = helv.widthOfTextAtSize(generatedText, 8);
  page.drawText(generatedText, {
    x: (width - generatedWidth) / 2,
    y: yPosition,
    size: 8,
    font: helv
  });

  return yPosition - 30;
};

export const exportToPDF = async (reportType, data, dateRange, filters, setExporting, showAlert) => {
  setExporting(true);
  try {
    if (!data || data.length === 0) {
      showAlert('error', `No ${reportType} data available to export`);
      setExporting(false);
      return;
    }

    const filteredData = data.filter(item => {
      const itemDate = new Date(item.created_at);
      const start = new Date(dateRange.start);
      const end = new Date(dateRange.end);
      end.setHours(23, 59, 59);
      return itemDate >= start && itemDate <= end;
    });

    if (filteredData.length === 0) {
      showAlert('error', `No ${reportType} found in selected date range`);
      setExporting(false);
      return;
    }

    const pdfDoc = await PDFDocument.create();
    const helv = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const helvBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    
    const logoImage = await loadLogoImage(pdfDoc);
    
    const page = pdfDoc.addPage([612, 792]);
    const { width, height } = page.getSize();
    
    // Add watermark
    if (logoImage) {
      const watermarkWidth = 400;
      const watermarkHeight = (logoImage.height / logoImage.width) * watermarkWidth;
      page.drawImage(logoImage, {
        x: (width - watermarkWidth) / 2,
        y: (height - watermarkHeight) / 2,
        width: watermarkWidth,
        height: watermarkHeight,
        opacity: 0.1
      });
    }
    
    let yPosition = await drawHeader(page, pdfDoc, helvBold, helv, width, height, reportType, dateRange, logoImage);

    // Draw table headers
    const headers = getTableHeaders(reportType);
    const columnWidths = getColumnWidths(reportType);
    
    page.drawRectangle({
      x: 45,
      y: yPosition - 5,
      width: width - 90,
      height: 18,
      color: rgb(0.9, 0.9, 0.9)
    });
    
    let xPosition = 50;
    headers.forEach((header, index) => {
      page.drawText(header, {
        x: xPosition,
        y: yPosition,
        size: 10,
        font: helvBold
      });
      xPosition += columnWidths[index];
    });

    yPosition -= 22;

    // Draw table rows
    filteredData.forEach((item, index) => {
      if (yPosition < 70) {
        // Add new page
        const newPage = pdfDoc.addPage([612, 792]);
        yPosition = height - 50;
        
        xPosition = 50;
        headers.forEach((header, i) => {
          newPage.drawText(header, {
            x: xPosition,
            y: yPosition,
            size: 10,
            font: helvBold
          });
          xPosition += columnWidths[i];
        });
        yPosition -= 22;
      }

      if (index % 2 === 0) {
        page.drawRectangle({
          x: 45,
          y: yPosition - 4,
          width: width - 90,
          height: 16,
          color: rgb(0.95, 0.95, 0.95)
        });
      }

      xPosition = 50;
      const rowData = getRowData(item, reportType, index + 1);
      
      rowData.forEach((cell, i) => {
        page.drawText(cell, {
          x: xPosition,
          y: yPosition,
          size: 9,
          font: helv
        });
        xPosition += columnWidths[i];
      });

      yPosition -= 16;
    });

    // Summary section
    if (yPosition > 80) {
      yPosition -= 25;
      
      page.drawRectangle({
        x: 45,
        y: yPosition - 5,
        width: width - 90,
        height: 35,
        color: rgb(0.95, 0.95, 0.95),
        borderColor: rgb(0.8, 0.8, 0.8),
        borderWidth: 1
      });
      
      const summaryTitle = reportType === 'organizations' ? 'ORGANIZATIONS' : 'PAYMENTS';
      
      page.drawText('SUMMARY', {
        x: 50,
        y: yPosition + 10,
        size: 11,
        font: helvBold
      });
      
      page.drawText(`Total ${summaryTitle}: ${filteredData.length}`, {
        x: 50,
        y: yPosition - 10,
        size: 11,
        font: helv
      });
      
      if (reportType === 'payments') {
        const totalAmount = filteredData.reduce((sum, item) => sum + (item.amount || 0), 0);
        page.drawText(`Total Amount: ₦${totalAmount.toLocaleString()}`, {
          x: 220,
          y: yPosition - 10,
          size: 11,
          font: helvBold
        });
      }

      // Add filter information if any filters were applied
      if (reportType === 'organizations' && (filters.businessNature || filters.companyName)) {
        let filterText = 'Filters: ';
        if (filters.businessNature) filterText += `Business: ${filters.businessNature} `;
        if (filters.companyName) filterText += `Company: ${filters.companyName}`;
        
        page.drawText(filterText, {
          x: 50,
          y: yPosition - 30,
          size: 8,
          font: helv
        });
      }
    }

    // Add page numbers
    const pageCount = pdfDoc.getPageCount();
    for (let i = 0; i < pageCount; i++) {
      const currentPage = pdfDoc.getPage(i);
      currentPage.drawText(`Page ${i + 1} of ${pageCount}`, {
        x: width - 100,
        y: 30,
        size: 9,
        font: helv
      });
    }

    const pdfBytes = await pdfDoc.save();
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${reportType}_report_${new Date().toISOString().split('T')[0]}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    
    showAlert('success', `${reportType} report exported successfully`);
  } catch (error) {
    console.error('PDF Export Error:', error);
    showAlert('error', 'Failed to export PDF report: ' + error.message);
  } finally {
    setExporting(false);
  }
};

export const exportToExcel = async (reportType, data, dateRange, filters, setExporting, showAlert) => {
  setExporting(true);
  try {
    if (!data || data.length === 0) {
      showAlert('error', `No ${reportType} data available to export`);
      setExporting(false);
      return;
    }

    const filteredData = data.filter(item => {
      const itemDate = new Date(item.created_at);
      const start = new Date(dateRange.start);
      const end = new Date(dateRange.end);
      end.setHours(23, 59, 59);
      return itemDate >= start && itemDate <= end;
    });

    if (filteredData.length === 0) {
      showAlert('error', `No ${reportType} found in selected date range`);
      setExporting(false);
      return;
    }

    // Prepare data for Excel
    let excelData = [];
    
    if (reportType === 'payments') {
      excelData = filteredData.map((item, index) => ({
        'S/N': index + 1,
        'Company': item.organizations?.company_name || 'N/A',
        'Amount': item.amount || 0,
        'Status': item.status || 'N/A',
        'Payment Date': new Date(item.created_at).toLocaleDateString(),
        'Reference': item.reference || 'N/A'
      }));
    } else {
      excelData = filteredData.map((item, index) => ({
        'S/N': index + 1,
        'Company Name': item.company_name || 'N/A',
        'Phone': item.phone_number || 'N/A',
        'Address': item.office_address || 'N/A',
        'Contact Person': item.contact_person || 'N/A',
        'Representative': item.representative || 'N/A',
        'Business Nature': item.business_nature || 'N/A'
      }));
    }

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(excelData);

    // Add title and metadata
    const titleText = `KANO CHAMBER OF COMMERCE, INDUSTRY, MINES & AGRICULTURE (KACCIMA)`;
    const reportTitle = reportType === 'payments' ? 'PAYMENTS List' : 'ORGANIZATIONS List';
    
    XLSX.utils.sheet_add_aoa(ws, [
      [titleText],
      [reportTitle],
      [`Period: ${new Date(dateRange.start).toLocaleDateString()} to ${new Date(dateRange.end).toLocaleDateString()}`],
      [`Generated: ${new Date().toLocaleString()}`],
      []
    ], { origin: 'A1' });

    // Add filter information
    if (reportType === 'organizations' && (filters.businessNature || filters.companyName)) {
      let filterText = 'Filters Applied:';
      if (filters.businessNature) filterText += ` Business Nature contains "${filters.businessNature}"`;
      if (filters.companyName) filterText += ` Company Name contains "${filters.companyName}"`;
      
      XLSX.utils.sheet_add_aoa(ws, [
        [filterText],
        []
      ], { origin: `A${excelData.length + 6}` });
    }

    // Define column widths
    let colWidths;
    if (reportType === 'payments') {
      colWidths = [
        { wch: 5 },  // S/N
        { wch: 30 }, // Company
        { wch: 15 }, // Amount
        { wch: 10 }, // Status
        { wch: 15 }, // Payment Date
        { wch: 20 }  // Reference
      ];
    } else {
      colWidths = [
        { wch: 5 },  // S/N
        { wch: 30 }, // Company Name
        { wch: 15 }, // Phone
        { wch: 30 }, // Address
        { wch: 20 }, // Contact Person
        { wch: 15 }, // Representative
        { wch: 20 }  // Business Nature
      ];
    }
    
    ws['!cols'] = colWidths;

    XLSX.utils.book_append_sheet(wb, ws, reportType.toUpperCase());

    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    
    saveAs(blob, `${reportType}_report_${new Date().toISOString().split('T')[0]}.xlsx`);
    
    showAlert('success', `${reportType} report exported successfully`);
  } catch (error) {
    console.error('Excel Export Error:', error);
    showAlert('error', 'Failed to export Excel report: ' + error.message);
  } finally {
    setExporting(false);
  }
};