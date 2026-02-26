import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

// Helper functions for table formatting
const getTableHeaders = (reportType) => {
  switch(reportType) {
    case 'payments':
      return ['S/N', 'Company', 'Amount', 'Status', 'Date', 'Reference'];
    default: // organizations - ALL FIELDS FROM THE TABLE
      return [
        'S/N', 
        'Company Name', 
        'Email', 
        'Phone', 
        'Office Address', 
        'Business Nature',
        'CAC Number',
        'Contact Person',
        'Representative',
        'Nigerian Directors',
        'Non-Nigerian Directors',
        'Nigerian Employees',
        'Non-Nigerian Employees',
        'Bankers',
        'Referee 1 Name',
        'Referee 1 Business',
        'Referee 1 Phone',
        'Referee 1 Reg Number',
        'Referee 2 Name',
        'Referee 2 Business',
        'Referee 2 Phone',
        'Referee 2 Reg Number',
        'ID Type',
        'Status',
        'Registration Date',
        'Last Updated',
        'Re-upload Count',
        'Last Re-upload'
      ];
  }
};

const getColumnWidths = (reportType) => {
  switch(reportType) {
    case 'payments':
      return [35, 115, 85, 65, 75, 105];
    default: // organizations - adjusted widths for all fields
      return [
        35,   // S/N
        100,  // Company Name
        120,  // Email
        80,   // Phone
        120,  // Office Address
        100,  // Business Nature
        70,   // CAC Number
        80,   // Contact Person
        80,   // Representative
        60,   // Nigerian Directors
        70,   // Non-Nigerian Directors
        70,   // Nigerian Employees
        75,   // Non-Nigerian Employees
        80,   // Bankers
        80,   // Referee 1 Name
        80,   // Referee 1 Business
        70,   // Referee 1 Phone
        80,   // Referee 1 Reg Number
        80,   // Referee 2 Name
        80,   // Referee 2 Business
        70,   // Referee 2 Phone
        80,   // Referee 2 Reg Number
        60,   // ID Type
        60,   // Status
        70,   // Registration Date
        70,   // Last Updated
        50,   // Re-upload Count
        70    // Last Re-upload
      ];
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
    default: // organizations - ALL FIELDS FROM THE TABLE EXCEPT DOCUMENT PATHS
      return [
        sn.toString(),
        (item.company_name || 'N/A'),
        (item.email || 'N/A'),
        (item.phone_number || 'N/A'),
        (item.office_address || 'N/A'),
        (item.business_nature || 'N/A'),
        (item.cac_number || 'N/A'),
        (item.contact_person || 'N/A'),
        (item.representative || 'N/A'),
        (item.nigerian_directors?.toString() || '0'),
        (item.non_nigerian_directors?.toString() || '0'),
        (item.nigerian_employees?.toString() || '0'),
        (item.non_nigerian_employees?.toString() || '0'),
        (item.bankers || 'N/A'),
        (item.referee1_name || 'N/A'),
        (item.referee1_business || 'N/A'),
        (item.referee1_phone || 'N/A'),
        (item.referee1_reg_number || 'N/A'),
        (item.referee2_name || 'N/A'),
        (item.referee2_business || 'N/A'),
        (item.referee2_phone || 'N/A'),
        (item.referee2_reg_number || 'N/A'),
        (item.id_type || 'N/A'),
        (item.status || 'N/A'),
        item.created_at ? new Date(item.created_at).toLocaleDateString() : 'N/A',
        item.updated_at ? new Date(item.updated_at).toLocaleDateString() : 'N/A',
        (item.re_upload_count?.toString() || '0'),
        item.last_re_upload_at ? new Date(item.last_re_upload_at).toLocaleDateString() : 'N/A'
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
    
    const page = pdfDoc.addPage([612, 792]); // Letter size
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
        size: 8, // Smaller font to fit more columns
        font: helvBold
      });
      xPosition += columnWidths[index];
    });

    yPosition -= 20;

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
            size: 8,
            font: helvBold
          });
          xPosition += columnWidths[i];
        });
        yPosition -= 20;
      }

      if (index % 2 === 0) {
        page.drawRectangle({
          x: 45,
          y: yPosition - 4,
          width: width - 90,
          height: 14,
          color: rgb(0.95, 0.95, 0.95)
        });
      }

      xPosition = 50;
      const rowData = getRowData(item, reportType, index + 1);
      
      rowData.forEach((cell, i) => {
        page.drawText(cell.toString().substring(0, 15), { // Truncate long text
          x: xPosition,
          y: yPosition,
          size: 7,
          font: helv
        });
        xPosition += columnWidths[i];
      });

      yPosition -= 14;
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
      if (reportType === 'organizations' && filters?.search) {
        page.drawText(`Search Filter: "${filters.search}"`, {
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
        'Amount (₦)': item.amount || 0,
        'Status': item.status || 'N/A',
        'Payment Date': new Date(item.created_at).toLocaleDateString(),
        'Reference': item.reference || 'N/A',
        'Payment Type': item.payment_type || 'N/A',
        'Payment Year': item.payment_year || 'N/A'
      }));
    } else {
      // Organizations - ALL FIELDS EXCEPT DOCUMENT PATHS
      excelData = filteredData.map((item, index) => ({
        'S/N': index + 1,
        'Company Name': item.company_name || 'N/A',
        'Email': item.email || 'N/A',
        'Phone': item.phone_number || 'N/A',
        'Office Address': item.office_address || 'N/A',
        'Business Nature': item.business_nature || 'N/A',
        'CAC Number': item.cac_number || 'N/A',
        'Contact Person': item.contact_person || 'N/A',
        'Representative': item.representative || 'N/A',
        'Nigerian Directors': item.nigerian_directors || 0,
        'Non-Nigerian Directors': item.non_nigerian_directors || 0,
        'Nigerian Employees': item.nigerian_employees || 0,
        'Non-Nigerian Employees': item.non_nigerian_employees || 0,
        'Bankers': item.bankers || 'N/A',
        'Referee 1 Name': item.referee1_name || 'N/A',
        'Referee 1 Business': item.referee1_business || 'N/A',
        'Referee 1 Phone': item.referee1_phone || 'N/A',
        'Referee 1 Reg Number': item.referee1_reg_number || 'N/A',
        'Referee 2 Name': item.referee2_name || 'N/A',
        'Referee 2 Business': item.referee2_business || 'N/A',
        'Referee 2 Phone': item.referee2_phone || 'N/A',
        'Referee 2 Reg Number': item.referee2_reg_number || 'N/A',
        'ID Type': item.id_type || 'N/A',
        'Status': item.status || 'N/A',
        'Registration Date': item.created_at ? new Date(item.created_at).toLocaleDateString() : 'N/A',
        'Last Updated': item.updated_at ? new Date(item.updated_at).toLocaleDateString() : 'N/A',
        'Re-upload Count': item.re_upload_count || 0,
        'Last Re-upload': item.last_re_upload_at ? new Date(item.last_re_upload_at).toLocaleDateString() : 'N/A'
      }));
    }

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(excelData);

    // Add title and metadata
    const titleText = `KANO CHAMBER OF COMMERCE, INDUSTRY, MINES & AGRICULTURE (KACCIMA)`;
    const reportTitle = reportType === 'payments' ? 'PAYMENTS REPORT' : 'ORGANIZATIONS REPORT';
    const subtitle = reportType === 'payments' 
      ? 'Payment Transactions Report' 
      : 'Complete Organization Details Report (Excluding Documents)';
    
    XLSX.utils.sheet_add_aoa(ws, [
      [titleText],
      [reportTitle],
      [subtitle],
      [`Period: ${new Date(dateRange.start).toLocaleDateString()} to ${new Date(dateRange.end).toLocaleDateString()}`],
      [`Generated: ${new Date().toLocaleString()}`],
      [`Total Records: ${filteredData.length}`],
      []
    ], { origin: 'A1' });

    // Add filter information
    if (filters?.search) {
      XLSX.utils.sheet_add_aoa(ws, [
        [`Search Filter: "${filters.search}"`],
        []
      ], { origin: `A${excelData.length + 8}` });
    }

    // Define column widths
    let colWidths;
    if (reportType === 'payments') {
      colWidths = [
        { wch: 5 },  // S/N
        { wch: 30 }, // Company
        { wch: 15 }, // Amount
        { wch: 12 }, // Status
        { wch: 15 }, // Payment Date
        { wch: 20 }, // Reference
        { wch: 15 }, // Payment Type
        { wch: 10 }  // Payment Year
      ];
    } else {
      colWidths = [
        { wch: 5 },   // S/N
        { wch: 30 },  // Company Name
        { wch: 30 },  // Email
        { wch: 15 },  // Phone
        { wch: 35 },  // Office Address
        { wch: 25 },  // Business Nature
        { wch: 15 },  // CAC Number
        { wch: 20 },  // Contact Person
        { wch: 20 },  // Representative
        { wch: 12 },  // Nigerian Directors
        { wch: 15 },  // Non-Nigerian Directors
        { wch: 15 },  // Nigerian Employees
        { wch: 15 },  // Non-Nigerian Employees
        { wch: 20 },  // Bankers
        { wch: 20 },  // Referee 1 Name
        { wch: 20 },  // Referee 1 Business
        { wch: 15 },  // Referee 1 Phone
        { wch: 18 },  // Referee 1 Reg Number
        { wch: 20 },  // Referee 2 Name
        { wch: 20 },  // Referee 2 Business
        { wch: 15 },  // Referee 2 Phone
        { wch: 18 },  // Referee 2 Reg Number
        { wch: 12 },  // ID Type
        { wch: 12 },  // Status
        { wch: 15 },  // Registration Date
        { wch: 15 },  // Last Updated
        { wch: 10 },  // Re-upload Count
        { wch: 15 }   // Last Re-upload
      ];
    }
    
    ws['!cols'] = colWidths;

    // Freeze header row
    ws['!freeze'] = { xSplit: 0, ySplit: 7 }; // Freeze after metadata rows

    XLSX.utils.book_append_sheet(wb, ws, reportType.toUpperCase());

    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    
    const fileName = `${reportType}_complete_report_${new Date().toISOString().split('T')[0]}.xlsx`;
    saveAs(blob, fileName);
    
    showAlert('success', `${reportType} report exported successfully with ${filteredData.length} records`);
  } catch (error) {
    console.error('Excel Export Error:', error);
    showAlert('error', 'Failed to export Excel report: ' + error.message);
  } finally {
    setExporting(false);
  }
};