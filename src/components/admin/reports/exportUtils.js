import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

// Helper to safely format currency for PDF (replaces ₦ with NGN)
const safeCurrency = (amount) => {
  const num = parseFloat(amount) || 0;
  return `NGN ${num.toLocaleString('en-NG', { minimumFractionDigits: 2 })}`;
};

// Helper to sanitize text for PDF (removes unsupported characters)
const sanitizeForPDF = (text) => {
  if (text === null || text === undefined) return 'N/A';
  return String(text)
    .replace(/₦/g, 'NGN ')  // Replace Naira symbol
    .replace(/[^\x20-\x7E]/g, '') // Remove other non-ASCII chars
    .trim();
};

// Helper to truncate text to fit in column
const truncate = (text, maxLen) => {
  const str = String(text || 'N/A');
  return str.length > maxLen ? str.substring(0, maxLen - 3) + '...' : str;
};

const getTableHeaders = (reportType) => {
  switch(reportType) {
    case 'payments':
      return ['S/N', 'Company', 'Amount', 'Status', 'Date', 'Reference'];
    default:
      return [
        'S/N', 'Company Name', 'Email', 'Phone', 'Address', 'Business',
        'CAC No.', 'Contact', 'Rep', 'NG Dir', 'Non-NG Dir',
        'NG Emp', 'Non-NG Emp', 'Bankers', 'Ref1 Name', 'Ref1 Biz',
        'Ref1 Phone', 'Ref1 Reg', 'Ref2 Name', 'Ref2 Biz',
        'Ref2 Phone', 'Ref2 Reg', 'ID', 'Status', 'Reg Date'
      ];
  }
};

const getColumnWidths = (reportType) => {
  switch(reportType) {
    case 'payments':
      return [30, 100, 70, 55, 65, 90];
    default:
      return [
        30, 80, 100, 70, 80, 70, 55, 65, 55, 40, 45,
        40, 45, 70, 65, 65, 60, 55, 65, 65, 60, 55, 40, 55, 60
      ];
  }
};

const getRowData = (item, reportType, sn) => {
  switch(reportType) {
    case 'payments':
      return [
        sn.toString(),
        truncate(sanitizeForPDF(item.organizations?.company_name || 'N/A'), 14),
        safeCurrency(item.amount),
        sanitizeForPDF(item.status || 'N/A'),
        new Date(item.created_at).toLocaleDateString(),
        truncate(sanitizeForPDF(item.reference || 'N/A'), 12)
      ];
    default:
      return [
        sn.toString(),
        truncate(sanitizeForPDF(item.company_name), 16),
        truncate(sanitizeForPDF(item.email), 20),
        truncate(sanitizeForPDF(item.phone_number), 12),
        truncate(sanitizeForPDF(item.office_address), 18),
        truncate(sanitizeForPDF(item.business_nature), 15),
        truncate(sanitizeForPDF(item.cac_number), 10),
        truncate(sanitizeForPDF(item.contact_person), 12),
        truncate(sanitizeForPDF(item.representative), 12),
        (item.nigerian_directors || 0).toString(),
        (item.non_nigerian_directors || 0).toString(),
        (item.nigerian_employees || 0).toString(),
        (item.non_nigerian_employees || 0).toString(),
        truncate(sanitizeForPDF(item.bankers), 12),
        truncate(sanitizeForPDF(item.referee1_name), 12),
        truncate(sanitizeForPDF(item.referee1_business), 12),
        truncate(sanitizeForPDF(item.referee1_phone), 10),
        truncate(sanitizeForPDF(item.referee1_reg_number), 10),
        truncate(sanitizeForPDF(item.referee2_name), 12),
        truncate(sanitizeForPDF(item.referee2_business), 12),
        truncate(sanitizeForPDF(item.referee2_phone), 10),
        truncate(sanitizeForPDF(item.referee2_reg_number), 10),
        sanitizeForPDF(item.id_type || 'N/A'),
        sanitizeForPDF(item.status || 'N/A'),
        item.created_at ? new Date(item.created_at).toLocaleDateString() : 'N/A'
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

  if (logoImage) {
    const logoWidth = 50;
    const logoHeight = (logoImage.height / logoImage.width) * logoWidth;
    page.drawImage(logoImage, {
      x: 50,
      y: yPosition - logoHeight + 10,
      width: logoWidth,
      height: logoHeight
    });
  }

  const title = 'KANO CHAMBER OF COMMERCE, INDUSTRY, MINES & AGRICULTURE (KACCIMA)';
  const titleWidth = helvBold.widthOfTextAtSize(title, 12);
  page.drawText(title, {
    x: (width - titleWidth) / 2,
    y: yPosition,
    size: 12,
    font: helvBold,
    color: rgb(0, 0.4, 0)
  });

  yPosition -= 22;

  const reportTitle = reportType === 'organizations' ? 'ORGANIZATIONS REPORT' : 'PAYMENTS REPORT';
  const reportTitleWidth = helvBold.widthOfTextAtSize(reportTitle, 16);
  page.drawText(reportTitle, {
    x: (width - reportTitleWidth) / 2,
    y: yPosition,
    size: 16,
    font: helvBold
  });

  yPosition -= 20;

  const dateText = `Period: ${new Date(dateRange.start).toLocaleDateString()} - ${new Date(dateRange.end).toLocaleDateString()}`;
  page.drawText(dateText, {
    x: 50,
    y: yPosition,
    size: 9,
    font: helv
  });

  const generatedText = `Generated: ${new Date().toLocaleString()}`;
  page.drawText(generatedText, {
    x: width - 200,
    y: yPosition,
    size: 9,
    font: helv
  });

  return yPosition - 25;
};

export const exportToPDF = async (reportType, data, dateRange, filters, setExporting, showAlert) => {
  setExporting(true);
  try {
    if (!data || data.length === 0) {
      showAlert('warning', `No ${reportType} data available to export`);
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
      showAlert('warning', `No ${reportType} found in selected date range`);
      setExporting(false);
      return;
    }

    const pdfDoc = await PDFDocument.create();
    const helv = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const helvBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const logoImage = await loadLogoImage(pdfDoc);
    
    const headers = getTableHeaders(reportType);
    const columnWidths = getColumnWidths(reportType);
    
    // Calculate total table width
    const totalTableWidth = columnWidths.reduce((sum, w) => sum + w, 0);
    const startX = (612 - totalTableWidth) / 2; // Center table on page
    
    const ROWS_PER_PAGE = 35;
    const totalPages = Math.ceil(filteredData.length / ROWS_PER_PAGE);

    for (let pageNum = 0; pageNum < totalPages; pageNum++) {
      const page = pdfDoc.addPage([612, 792]);
      const { width, height } = page.getSize();
      
      // Watermark
      if (logoImage) {
        const wmWidth = 350;
        const wmHeight = (logoImage.height / logoImage.width) * wmWidth;
        page.drawImage(logoImage, {
          x: (width - wmWidth) / 2,
          y: (height - wmHeight) / 2,
          width: wmWidth,
          height: wmHeight,
          opacity: 0.06
        });
      }
      
      let yPosition = await drawHeader(page, pdfDoc, helvBold, helv, width, height, reportType, dateRange, logoImage);

      // Draw table header background
      page.drawRectangle({
        x: startX - 5,
        y: yPosition - 5,
        width: totalTableWidth + 10,
        height: 16,
        color: rgb(0.9, 0.95, 0.9)
      });

      // Draw headers
      let xPosition = startX;
      headers.forEach((header, i) => {
        page.drawText(header, {
          x: xPosition,
          y: yPosition,
          size: 7,
          font: helvBold,
          color: rgb(0, 0.3, 0)
        });
        xPosition += columnWidths[i];
      });

      yPosition -= 18;

      // Draw rows for this page
      const startRow = pageNum * ROWS_PER_PAGE;
      const endRow = Math.min(startRow + ROWS_PER_PAGE, filteredData.length);

      for (let i = startRow; i < endRow; i++) {
        if (yPosition < 50) break;

        // Alternating row background
        if (i % 2 === 0) {
          page.drawRectangle({
            x: startX - 5,
            y: yPosition - 3,
            width: totalTableWidth + 10,
            height: 13,
            color: rgb(0.97, 0.97, 0.97)
          });
        }

        xPosition = startX;
        const rowData = getRowData(filteredData[i], reportType, i + 1);
        
        rowData.forEach((cell, j) => {
          page.drawText(String(cell), {
            x: xPosition,
            y: yPosition,
            size: 6.5,
            font: helv
          });
          xPosition += columnWidths[j];
        });

        yPosition -= 13;
      }

      // Summary on last page
      if (pageNum === totalPages - 1) {
        yPosition -= 15;
        
        page.drawRectangle({
          x: startX - 5,
          y: yPosition - 5,
          width: totalTableWidth + 10,
          height: 25,
          color: rgb(0.95, 0.95, 0.95),
          borderColor: rgb(0.7, 0.7, 0.7),
          borderWidth: 0.5
        });

        page.drawText('SUMMARY', {
          x: startX,
          y: yPosition + 5,
          size: 10,
          font: helvBold
        });

        page.drawText(`Total Records: ${filteredData.length}`, {
          x: startX,
          y: yPosition - 10,
          size: 9,
          font: helv
        });

        if (reportType === 'payments') {
          const totalAmount = filteredData.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
          page.drawText(`Total Amount: ${safeCurrency(totalAmount)}`, {
            x: startX + 200,
            y: yPosition - 10,
            size: 9,
            font: helvBold
          });
        }

        if (filters?.search) {
          page.drawText(`Filter: "${filters.search}"`, {
            x: startX,
            y: yPosition - 25,
            size: 8,
            font: helv
          });
        }
      }

      // Page number
      page.drawText(`Page ${pageNum + 1} of ${totalPages}`, {
        x: width - 120,
        y: 25,
        size: 8,
        font: helv
      });
    }

    const pdfBytes = await pdfDoc.save();
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `KACCIMA_${reportType}_report_${new Date().toISOString().split('T')[0]}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    showAlert('success', `${reportType} report exported successfully`);
  } catch (error) {
    console.error('PDF Export Error:', error);
    showAlert('error', 'Failed to export PDF: ' + error.message);
  } finally {
    setExporting(false);
  }
};
// A2 PDF Export with FULL details
export const exportToPDFA2 = async (reportType, data, dateRange, filters, setExporting, showAlert) => {
  setExporting(true);
  try {
    if (!data || data.length === 0) {
      showAlert('warning', `No data to export`);
      setExporting(false);
      return;
    }

    const pdfDoc = await PDFDocument.create();
    const helv = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const helvBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const logoImage = await loadLogoImage(pdfDoc);
    
    // A2 paper size: 420 x 594 mm (landscape: 594 x 420)
    const pageWidth = 1684; // 594mm in points
    const pageHeight = 1190; // 420mm in points
    
    const ROWS_PER_PAGE = 30;
    const totalPages = Math.ceil(data.length / ROWS_PER_PAGE);

    for (let pageNum = 0; pageNum < totalPages; pageNum++) {
      const page = pdfDoc.addPage([pageWidth, pageHeight]);
      
      // Watermark
      if (logoImage) {
        const wmWidth = 500;
        const wmHeight = (logoImage.height / logoImage.width) * wmWidth;
        page.drawImage(logoImage, {
          x: (pageWidth - wmWidth) / 2,
          y: (pageHeight - wmHeight) / 2,
          width: wmWidth,
          height: wmHeight,
          opacity: 0.04
        });
      }

      let yPos = pageHeight - 60;

      // Header
      if (logoImage) {
        page.drawImage(logoImage, { x: 40, y: yPos - 25, width: 60, height: 50 });
      }
      
      const title = 'KANO CHAMBER OF COMMERCE, INDUSTRY, MINES & AGRICULTURE (KACCIMA)';
      page.drawText(title, { x: (pageWidth - helvBold.widthOfTextAtSize(title, 16)) / 2, y: yPos, size: 16, font: helvBold, color: rgb(0, 0.4, 0) });
      
      yPos -= 25;
      const subtitle = 'APPROVED ORGANIZATIONS - COMPLETE DETAILS REPORT';
      page.drawText(subtitle, { x: (pageWidth - helvBold.widthOfTextAtSize(subtitle, 14)) / 2, y: yPos, size: 14, font: helvBold });
      
      yPos -= 22;
      page.drawText(`Generated: ${new Date().toLocaleString()} | Total Records: ${data.length} | Page ${pageNum + 1} of ${totalPages}`, {
        x: 40, y: yPos, size: 9, font: helv
      });

      yPos -= 30;

      // Table headers - All columns
      const headers = [
        'S/N', 'Company Name', 'Email', 'Phone', 'Office Address', 'Business Nature',
        'CAC No.', 'Contact Person', 'Representative', 'NG Directors', 'Non-NG Directors',
        'NG Employees', 'Non-NG Employees', 'Bankers',
        'Referee 1 Name', 'Referee 1 Business', 'Referee 1 Phone', 'Referee 1 Reg No.',
        'Referee 2 Name', 'Referee 2 Business', 'Referee 2 Phone', 'Referee 2 Reg No.',
        'ID Type', 'Registration Date', 'Last Updated'
      ];

      // Column widths for A2
      const colWidths = [
        35, 120, 140, 80, 130, 110, 70, 90, 90, 45, 50, 50, 50, 80,
        85, 85, 75, 70, 85, 85, 75, 70, 55, 75, 75
      ];

      // Draw header background
      page.drawRectangle({ x: 35, y: yPos - 5, width: pageWidth - 70, height: 18, color: rgb(0.9, 0.95, 0.9) });

      let xPos = 38;
      headers.forEach((header, i) => {
        page.drawText(header, { x: xPos, y: yPos, size: 7, font: helvBold, color: rgb(0, 0.3, 0) });
        xPos += colWidths[i];
      });

      yPos -= 20;

      // Data rows
      const startRow = pageNum * ROWS_PER_PAGE;
      const endRow = Math.min(startRow + ROWS_PER_PAGE, data.length);

      for (let i = startRow; i < endRow; i++) {
        if (yPos < 40) break;

        if (i % 2 === 0) {
          page.drawRectangle({ x: 35, y: yPos - 3, width: pageWidth - 70, height: 14, color: rgb(0.97, 0.97, 0.97) });
        }

        const item = data[i];
        const rowData = [
          (i + 1).toString(),
          item.company_name || '',
          item.email || '',
          item.phone_number || '',
          item.office_address || '',
          item.business_nature || '',
          item.cac_number || '',
          item.contact_person || '',
          item.representative || '',
          (item.nigerian_directors || 0).toString(),
          (item.non_nigerian_directors || 0).toString(),
          (item.nigerian_employees || 0).toString(),
          (item.non_nigerian_employees || 0).toString(),
          item.bankers || '',
          item.referee1_name || '',
          item.referee1_business || '',
          item.referee1_phone || '',
          item.referee1_reg_number || '',
          item.referee2_name || '',
          item.referee2_business || '',
          item.referee2_phone || '',
          item.referee2_reg_number || '',
          item.id_type || '',
          item.created_at ? new Date(item.created_at).toLocaleDateString() : '',
          item.updated_at ? new Date(item.updated_at).toLocaleDateString() : ''
        ];

        xPos = 38;
        rowData.forEach((cell, j) => {
          const text = String(cell || '').substring(0, Math.floor(colWidths[j] / 4));
          page.drawText(text, { x: xPos, y: yPos, size: 6.5, font: helv });
          xPos += colWidths[j];
        });

        yPos -= 14;
      }
    }

    const pdfBytes = await pdfDoc.save();
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `KACCIMA_Organizations_Full_Report_A2_${new Date().toISOString().split('T')[0]}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    showAlert('success', `A2 PDF exported with ${data.length} records`);
  } catch (error) {
    console.error('PDF Export Error:', error);
    showAlert('error', 'Failed to export PDF: ' + error.message);
  } finally {
    setExporting(false);
  }
};
export const exportToExcel = async (reportType, data, dateRange, filters, setExporting, showAlert) => {
  setExporting(true);
  try {
    if (!data || data.length === 0) {
      showAlert('warning', `No ${reportType} data available to export`);
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

    let excelData;
    
    if (reportType === 'payments') {
      excelData = filteredData.map((item, index) => ({
        'S/N': index + 1,
        'Company': item.organizations?.company_name || 'N/A',
        'Amount (₦)': parseFloat(item.amount) || 0,
        'Status': item.status || 'N/A',
        'Date': new Date(item.created_at).toLocaleDateString(),
        'Reference': item.reference || 'N/A',
        'Payment Type': item.payment_type || 'N/A'
      }));
    } else {
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
        'Registration Date': item.created_at ? new Date(item.created_at).toLocaleDateString() : 'N/A'
      }));
    }

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(excelData);

    // Add metadata rows at top
    XLSX.utils.sheet_add_aoa(ws, [
      ['KACCIMA - ' + (reportType === 'payments' ? 'PAYMENTS REPORT' : 'ORGANIZATIONS REPORT')],
      [`Period: ${new Date(dateRange.start).toLocaleDateString()} - ${new Date(dateRange.end).toLocaleDateString()}`],
      [`Generated: ${new Date().toLocaleString()}`],
      [`Total Records: ${filteredData.length}`],
      []
    ], { origin: 'A1' });

    // Auto-size columns
    const range = XLSX.utils.decode_range(ws['!ref']);
    const colWidths = [];
    for (let C = range.s.c; C <= range.e.c; ++C) {
      let maxLen = 10;
      for (let R = range.s.r; R <= range.e.r; ++R) {
        const cell = ws[XLSX.utils.encode_cell({ r: R, c: C })];
        if (cell && cell.v) {
          maxLen = Math.max(maxLen, String(cell.v).length + 2);
        }
      }
      colWidths.push({ wch: Math.min(maxLen, 40) });
    }
    ws['!cols'] = colWidths;

    // Freeze header
    ws['!freeze'] = { xSplit: 0, ySplit: 5 };

    XLSX.utils.book_append_sheet(wb, ws, reportType.toUpperCase());

    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, `KACCIMA_${reportType}_report_${new Date().toISOString().split('T')[0]}.xlsx`);
    
    showAlert('success', `${reportType} report exported successfully`);
  } catch (error) {
    console.error('Excel Export Error:', error);
    showAlert('error', 'Failed to export Excel: ' + error.message);
  } finally {
    setExporting(false);
  }
};