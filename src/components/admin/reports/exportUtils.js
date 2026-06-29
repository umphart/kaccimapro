// src/components/admin/reports/exportUtils.js
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
    .replace(/₦/g, 'NGN ')
    .replace(/[^\x20-\x7E]/g, '')
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
      return ['S/N', 'Organization', 'Reg Number', 'Amount', 'Payment Type', 'Date', 'Source'];
    case 'organizations':
    default:
      return [
        'S/N', 'Company Name', 'Reg Number', 'CAC Number', 'Email', 'Phone', 
        'Address', 'LGA', 'State', 'Business Nature', 'Contact Person', 
        'Rep', 'NG Dir', 'Non-NG Dir', 'NG Emp', 'Non-NG Emp', 'Registration Date'
      ];
  }
};

const getColumnWidths = (reportType, isA2 = false) => {
  if (isA2) {
    // A2 paper column widths (landscape 1684 x 1190 points)
    return [
      35, 140, 100, 90, 150, 90, 180, 100, 100, 140, 110, 110, 55, 60, 55, 60, 85
    ];
  }
  
  switch(reportType) {
    case 'payments':
      return [30, 140, 90, 80, 70, 75, 65];
    case 'organizations':
    default:
      return [30, 120, 80, 70, 100, 60, 100, 60, 60, 100, 80, 80, 45, 50, 45, 50, 65];
  }
};

const getRowData = (item, reportType, sn) => {
  switch(reportType) {
    case 'payments':
      return [
        sn.toString(),
        truncate(sanitizeForPDF(item.organization_name || item.organizations?.company_name || 'N/A'), 25),
        truncate(sanitizeForPDF(item.organization_reg_number || item.organizations?.registration_number || 'N/A'), 14),
        safeCurrency(item.amount),
        sanitizeForPDF(item.payment_type || 'registration'),
        item.created_at ? new Date(item.created_at).toLocaleDateString() : 'N/A',
        sanitizeForPDF(item.source_table || 'payments')
      ];
    case 'organizations':
    default:
      return [
        sn.toString(),
        truncate(sanitizeForPDF(item.company_name), 25),
        truncate(sanitizeForPDF(item.registration_number), 16),
        truncate(sanitizeForPDF(item.cac_number), 14),
        truncate(sanitizeForPDF(item.email), 25),
        truncate(sanitizeForPDF(item.phone_number1 || item.phone_number), 14),
        truncate(sanitizeForPDF(item.office_address), 30),
        truncate(sanitizeForPDF(item.lga), 16),
        truncate(sanitizeForPDF(item.state), 16),
        truncate(sanitizeForPDF(item.business_nature_text || item.business_nature || 'N/A'), 22),
        truncate(sanitizeForPDF(item.contact_person || item.representative), 16),
        truncate(sanitizeForPDF(item.representative), 14),
        (item.nigerian_directors || 0).toString(),
        (item.non_nigerian_directors || 0).toString(),
        (item.nigerian_employees || 0).toString(),
        (item.non_nigerian_employees || 0).toString(),
        item.created_at ? new Date(item.created_at).toLocaleDateString() : 'N/A'
      ];
  }
};

const loadLogoImage = async (pdfDoc) => {
  try {
    const logoUrl = '/static/logo.png';
    const logoResponse = await fetch(logoUrl);
    if (!logoResponse.ok) return null;
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

const drawHeader = async (page, pdfDoc, helvBold, helv, width, height, reportType, dateRange, logoImage, isA2 = false) => {
  let yPosition = height - 50;

  if (logoImage) {
    const logoWidth = isA2 ? 70 : 50;
    const logoHeight = (logoImage.height / logoImage.width) * logoWidth;
    page.drawImage(logoImage, {
      x: isA2 ? 60 : 50,
      y: yPosition - logoHeight + 10,
      width: logoWidth,
      height: logoHeight
    });
  }

  const titleSize = isA2 ? 18 : 12;
  const title = 'KANO CHAMBER OF COMMERCE, INDUSTRY, MINES & AGRICULTURE (KACCIMA)';
  const titleWidth = helvBold.widthOfTextAtSize(title, titleSize);
  page.drawText(title, {
    x: (width - titleWidth) / 2,
    y: yPosition,
    size: titleSize,
    font: helvBold,
    color: rgb(0, 0.4, 0)
  });

  yPosition -= isA2 ? 30 : 22;

  const reportTitleSize = isA2 ? 20 : 16;
  const reportTitle = reportType === 'organizations' ? 'ORGANIZATIONS REPORT' : 'PAYMENTS REPORT';
  const reportTitleWidth = helvBold.widthOfTextAtSize(reportTitle, reportTitleSize);
  page.drawText(reportTitle, {
    x: (width - reportTitleWidth) / 2,
    y: yPosition,
    size: reportTitleSize,
    font: helvBold
  });

  yPosition -= isA2 ? 25 : 20;

  const dateText = `Period: ${new Date(dateRange.start).toLocaleDateString()} - ${new Date(dateRange.end).toLocaleDateString()}`;
  const dateTextX = isA2 ? 60 : 50;
  page.drawText(dateText, {
    x: dateTextX,
    y: yPosition,
    size: isA2 ? 10 : 9,
    font: helv
  });

  const generatedText = `Generated: ${new Date().toLocaleString()}`;
  const generatedTextX = width - (isA2 ? 250 : 200);
  page.drawText(generatedText, {
    x: generatedTextX,
    y: yPosition,
    size: isA2 ? 10 : 9,
    font: helv
  });

  return yPosition - (isA2 ? 30 : 25);
};

// A4 PDF Export for Payments
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
    const columnWidths = getColumnWidths(reportType, false);
    
    const totalTableWidth = columnWidths.reduce((sum, w) => sum + w, 0);
    const startX = (612 - totalTableWidth) / 2;
    
    const ROWS_PER_PAGE = 35;
    const totalPages = Math.ceil(filteredData.length / ROWS_PER_PAGE);

    for (let pageNum = 0; pageNum < totalPages; pageNum++) {
      const page = pdfDoc.addPage([612, 792]);
      const { width, height } = page.getSize();
      
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
      
      let yPosition = await drawHeader(page, pdfDoc, helvBold, helv, width, height, reportType, dateRange, logoImage, false);

      page.drawRectangle({
        x: startX - 5,
        y: yPosition - 5,
        width: totalTableWidth + 10,
        height: 16,
        color: rgb(0.9, 0.95, 0.9)
      });

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

      const startRow = pageNum * ROWS_PER_PAGE;
      const endRow = Math.min(startRow + ROWS_PER_PAGE, filteredData.length);

      for (let i = startRow; i < endRow; i++) {
        if (yPosition < 50) break;

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

// A2 PDF Export for Organizations
export const exportToPDFA2 = async (reportType, data, dateRange, filters, setExporting, showAlert) => {
  setExporting(true);
  try {
    if (!data || data.length === 0) {
      showAlert('warning', 'No data to export');
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
      showAlert('warning', 'No organizations found in selected date range');
      setExporting(false);
      return;
    }

    const pdfDoc = await PDFDocument.create();
    const helv = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const helvBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const logoImage = await loadLogoImage(pdfDoc);
    
    // A2 paper size: 420 x 594 mm (landscape: 594 x 420)
    const pageWidth = 1684; // 594mm in points (landscape width)
    const pageHeight = 1190; // 420mm in points (landscape height)
    
    const headers = [
      'S/N', 'Company Name', 'Reg Number', 'CAC Number', 'Email', 'Phone',
      'Address', 'LGA', 'State', 'Business Nature', 'Contact Person',
      'Rep', 'NG Dir', 'Non-NG Dir', 'NG Emp', 'Non-NG Emp', 'Reg Date'
    ];
    
    const colWidths = getColumnWidths('organizations', true);
    
    const totalTableWidth = colWidths.reduce((sum, w) => sum + w, 0);
    const startX = (pageWidth - totalTableWidth) / 2;
    
    const ROWS_PER_PAGE = 30;
    const totalPages = Math.ceil(filteredData.length / ROWS_PER_PAGE);

    for (let pageNum = 0; pageNum < totalPages; pageNum++) {
      const page = pdfDoc.addPage([pageWidth, pageHeight]);
      const { width, height } = page.getSize();
      
      // Watermark
      if (logoImage) {
        const wmWidth = 500;
        const wmHeight = (logoImage.height / logoImage.width) * wmWidth;
        page.drawImage(logoImage, {
          x: (width - wmWidth) / 2,
          y: (height - wmHeight) / 2,
          width: wmWidth,
          height: wmHeight,
          opacity: 0.04
        });
      }

      let yPosition = await drawHeader(page, pdfDoc, helvBold, helv, width, height, reportType, dateRange, logoImage, true);

      // Draw header background
      page.drawRectangle({
        x: startX - 5,
        y: yPosition - 5,
        width: totalTableWidth + 10,
        height: 18,
        color: rgb(0.9, 0.95, 0.9)
      });

      // Draw headers
      let xPosition = startX;
      headers.forEach((header, i) => {
        page.drawText(header, {
          x: xPosition,
          y: yPosition,
          size: 8,
          font: helvBold,
          color: rgb(0, 0.3, 0)
        });
        xPosition += colWidths[i];
      });

      yPosition -= 20;

      // Draw rows
      const startRow = pageNum * ROWS_PER_PAGE;
      const endRow = Math.min(startRow + ROWS_PER_PAGE, filteredData.length);

      for (let i = startRow; i < endRow; i++) {
        if (yPosition < 50) break;

        if (i % 2 === 0) {
          page.drawRectangle({
            x: startX - 5,
            y: yPosition - 3,
            width: totalTableWidth + 10,
            height: 15,
            color: rgb(0.97, 0.97, 0.97)
          });
        }

        const item = filteredData[i];
        const rowData = [
          (i + 1).toString(),
          truncate(sanitizeForPDF(item.company_name), 25),
          truncate(sanitizeForPDF(item.registration_number), 16),
          truncate(sanitizeForPDF(item.cac_number), 14),
          truncate(sanitizeForPDF(item.email), 25),
          truncate(sanitizeForPDF(item.phone_number1 || item.phone_number), 14),
          truncate(sanitizeForPDF(item.office_address), 30),
          truncate(sanitizeForPDF(item.lga), 16),
          truncate(sanitizeForPDF(item.state), 16),
          truncate(sanitizeForPDF(item.business_nature_text || item.business_nature || 'N/A'), 22),
          truncate(sanitizeForPDF(item.contact_person || item.representative), 16),
          truncate(sanitizeForPDF(item.representative), 14),
          (item.nigerian_directors || 0).toString(),
          (item.non_nigerian_directors || 0).toString(),
          (item.nigerian_employees || 0).toString(),
          (item.non_nigerian_employees || 0).toString(),
          item.created_at ? new Date(item.created_at).toLocaleDateString() : 'N/A'
        ];

        xPosition = startX;
        rowData.forEach((cell, j) => {
          page.drawText(String(cell), {
            x: xPosition,
            y: yPosition,
            size: 7.5,
            font: helv
          });
          xPosition += colWidths[j];
        });

        yPosition -= 15;
      }

      // Summary on last page
      if (pageNum === totalPages - 1) {
        yPosition -= 20;
        
        page.drawRectangle({
          x: startX - 5,
          y: yPosition - 5,
          width: totalTableWidth + 10,
          height: 30,
          color: rgb(0.95, 0.95, 0.95),
          borderColor: rgb(0.7, 0.7, 0.7),
          borderWidth: 0.5
        });

        page.drawText('SUMMARY', {
          x: startX,
          y: yPosition + 8,
          size: 12,
          font: helvBold
        });

        page.drawText(`Total Organizations: ${filteredData.length}`, {
          x: startX,
          y: yPosition - 10,
          size: 10,
          font: helv
        });

        if (filters?.search) {
          page.drawText(`Filter: "${filters.search}"`, {
            x: startX,
            y: yPosition - 25,
            size: 9,
            font: helv
          });
        }
      }

      // Page number
      page.drawText(`Page ${pageNum + 1} of ${totalPages}`, {
        x: width - 150,
        y: 30,
        size: 9,
        font: helv
      });
    }

    const pdfBytes = await pdfDoc.save();
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `KACCIMA_Organizations_Report_A2_${new Date().toISOString().split('T')[0]}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    showAlert('success', `A2 PDF exported with ${filteredData.length} organizations`);
  } catch (error) {
    console.error('A2 PDF Export Error:', error);
    showAlert('error', 'Failed to export A2 PDF: ' + error.message);
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

    if (filteredData.length === 0) {
      showAlert('warning', `No ${reportType} found in selected date range`);
      setExporting(false);
      return;
    }

    let excelData;
    
    if (reportType === 'payments') {
      excelData = filteredData.map((item, index) => ({
        'S/N': index + 1,
        'Organization': item.organization_name || item.organizations?.company_name || 'N/A',
        'Registration Number': item.organization_reg_number || item.organizations?.registration_number || 'N/A',
        'Amount (NGN)': parseFloat(item.amount) || 0,
        'Payment Type': item.payment_type || 'registration',
        'Date': item.created_at ? new Date(item.created_at).toLocaleDateString() : 'N/A',
        'Source': item.source_table || 'payments'
      }));
    } else {
      excelData = filteredData.map((item, index) => ({
        'S/N': index + 1,
        'Company Name': item.company_name || 'N/A',
        'Registration Number': item.registration_number || 'N/A',
        'CAC Number': item.cac_number || 'N/A',
        'Email': item.email || 'N/A',
        'Phone': item.phone_number1 || item.phone_number || 'N/A',
        'Office Address': item.office_address || `${item.house_number || ''} ${item.street || ''} ${item.lga || ''} ${item.state || ''}`.trim() || 'N/A',
        'LGA': item.lga || 'N/A',
        'State': item.state || 'N/A',
        'Business Nature': item.business_nature_text || item.business_nature || 'N/A',
        'Contact Person': item.contact_person || 'N/A',
        'Rep': item.representative || 'N/A',
        'NG Dir': item.nigerian_directors || 0,
        'Non-NG Dir': item.non_nigerian_directors || 0,
        'NG Emp': item.nigerian_employees || 0,
        'Non-NG Emp': item.non_nigerian_employees || 0,
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