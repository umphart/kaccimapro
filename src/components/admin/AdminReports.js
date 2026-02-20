import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  TextField,
  Chip,
  CircularProgress,
  Alert,
  Snackbar,
  Tab,
  Tabs,
  Avatar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material';
import {
  PictureAsPdf as PdfIcon,
  TableChart as ExcelIcon,
  Refresh as RefreshIcon,
  People as PeopleIcon,
  Payment as PaymentIcon,
  Assessment as AssessmentIcon,
  Business as BusinessIcon
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import AdminSidebar from './AdminSidebar';
import { supabase } from '../../supabaseClient';



const ExportButton = styled(Button)(({ theme, exporttype }) => ({
  padding: '12px 24px',
  borderRadius: '12px',
  fontSize: '16px',
  fontWeight: 600,
  textTransform: 'none',
  fontFamily: '"Inter", sans-serif',
  background: exporttype === 'pdf' 
    ? 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'
    : 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
  color: 'white',
  '&:hover': {
    transform: 'scale(1.05)',
    boxShadow: '0 10px 30px rgba(0, 0, 0, 0.2)'
  },
  transition: 'all 0.3s ease'
}));

const TabPanel = ({ children, value, index, ...other }) => (
  <div
    role="tabpanel"
    hidden={value !== index}
    id={`report-tabpanel-${index}`}
    aria-labelledby={`report-tab-${index}`}
    {...other}
  >
    {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
  </div>
);

const AdminReports = () => {
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [payments, setPayments] = useState([]);
  const [organizations, setOrganizations] = useState([]);
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });
  const [reportType, setReportType] = useState('payments');
  const [stats, setStats] = useState({
    payments: { total: 0, amount: 0, pending: 0 },
    organizations: { total: 0, approved: 0, pending: 0 }
  });
  const [alert, setAlert] = useState({ open: false, type: 'success', message: '' });

  useEffect(() => {
    fetchData();
  }, [dateRange, tabValue]);

  const showAlert = (type, message) => {
    setAlert({ open: true, type, message });
  };

  const handleCloseAlert = () => {
    setAlert({ ...alert, open: false });
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
    setReportType(newValue === 0 ? 'payments' : 'organizations');
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      if (tabValue === 0) {
        await fetchPayments();
      } else {
        await fetchOrganizations();
      }
      await fetchStats();
    } catch (error) {
      console.error('Error fetching data:', error);
      showAlert('error', 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const fetchPayments = async () => {
    try {
      console.log('Fetching payments...');
      let query = supabase
        .from('payments')
        .select('*, organizations(company_name)');

      if (dateRange.start && dateRange.end) {
        query = query
          .gte('created_at', dateRange.start)
          .lte('created_at', `${dateRange.end}T23:59:59`);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      console.log('Payments fetched:', data);
      setPayments(data || []);
    } catch (error) {
      console.error('Error fetching payments:', error);
      showAlert('error', 'Failed to load payments');
    }
  };

  const fetchOrganizations = async () => {
    try {
      console.log('Fetching organizations...');
      let query = supabase
        .from('organizations')
        .select('*');

      if (dateRange.start && dateRange.end) {
        query = query
          .gte('created_at', dateRange.start)
          .lte('created_at', `${dateRange.end}T23:59:59`);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      console.log('Organizations fetched:', data);
      setOrganizations(data || []);
    } catch (error) {
      console.error('Error fetching organizations:', error);
      showAlert('error', 'Failed to load organizations');
    }
  };

  const fetchStats = async () => {
    try {
      // Payment stats
      const { data: paymentData } = await supabase
        .from('payments')
        .select('amount, status');

      const totalPayments = paymentData?.length || 0;
      const totalAmount = paymentData?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0;
      const pendingPayments = paymentData?.filter(p => p.status === 'pending').length || 0;

      // Organization stats
      const { count: totalOrgs } = await supabase
        .from('organizations')
        .select('*', { count: 'exact', head: true });

      const { count: approvedOrgs } = await supabase
        .from('organizations')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'approved');

      setStats({
        payments: {
          total: totalPayments,
          amount: totalAmount,
          pending: pendingPayments
        },
        organizations: {
          total: totalOrgs || 0,
          approved: approvedOrgs || 0,
          pending: (totalOrgs || 0) - (approvedOrgs || 0)
        }
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const tryEmbedImage = async (pdfDoc, imagePath) => {
    try {
      // Try to fetch the image from public URL
      const imageUrl = `${window.location.origin}${imagePath}`;
      console.log('Attempting to load logo from:', imageUrl);
      const response = await fetch(imageUrl);
      
      if (response.ok) {
        const imageBytes = await response.arrayBuffer();
        const mimeType = response.headers.get('content-type');
        
        if (mimeType?.includes('png')) {
          return await pdfDoc.embedPng(imageBytes);
        } else if (mimeType?.includes('jpg') || mimeType?.includes('jpeg')) {
          return await pdfDoc.embedJpg(imageBytes);
        }
      }
    } catch (error) {
      console.log('Could not embed image, continuing without logo:', error);
    }
    return null;
  };

const exportToPDF = async () => {
  setExporting(true);
  try {
    console.log(`Starting PDF export with ${reportType}:`, 
      reportType === 'payments' ? payments.length : organizations.length);

    const data = reportType === 'payments' ? payments : organizations;

    if (!data || data.length === 0) {
      showAlert('error', `No ${reportType} data available to export`);
      setExporting(false);
      return;
    }

    const pdfDoc = await PDFDocument.create();
    const helv = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const helvBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    
    // Load and embed the logo image
    let logoImage;
    try {
      const logoUrl = '/static/logo.png';
      const logoResponse = await fetch(logoUrl);
      const logoArrayBuffer = await logoResponse.arrayBuffer();
      
      // Detect image format and embed accordingly
      if (logoUrl.toLowerCase().endsWith('.png')) {
        logoImage = await pdfDoc.embedPng(logoArrayBuffer);
      } else if (logoUrl.toLowerCase().endsWith('.jpg') || logoUrl.toLowerCase().endsWith('.jpeg')) {
        logoImage = await pdfDoc.embedJpg(logoArrayBuffer);
      }
    } catch (logoError) {
      console.error('Error loading logo:', logoError);
      // Continue without logo if it fails to load
    }

    // Filter data based on date range
    const filteredData = data.filter(item => {
      const itemDate = new Date(item.created_at);
      const start = new Date(dateRange.start);
      const end = new Date(dateRange.end);
      end.setHours(23, 59, 59);
      return itemDate >= start && itemDate <= end;
    });

    console.log('Filtered data:', filteredData.length);

    if (filteredData.length === 0) {
      showAlert('error', `No ${reportType} found in selected date range`);
      setExporting(false);
      return;
    }

    // Create a single page
    const page = pdfDoc.addPage([612, 792]); // Letter size portrait
    const { width, height } = page.getSize();
    
    // Add watermark logo (if logo loaded successfully)
    if (logoImage) {
      // Calculate watermark size (large but semi-transparent)
      const watermarkWidth = 400;
      const watermarkHeight = (logoImage.height / logoImage.width) * watermarkWidth;
      
      // Center the watermark
      page.drawImage(logoImage, {
        x: (width - watermarkWidth) / 2,
        y: (height - watermarkHeight) / 2,
        width: watermarkWidth,
        height: watermarkHeight,
        opacity: 0.1 // Very light opacity for watermark effect
      });
    }
    
    let yPosition = height - 50;

    // Logo at top left (small size)
    if (logoImage) {
      const logoWidth = 60; // Small logo
      const logoHeight = (logoImage.height / logoImage.width) * logoWidth;
      
      page.drawImage(logoImage, {
        x: 50,
        y: yPosition - logoHeight + 10,
        width: logoWidth,
        height: logoHeight
      });
    }

    // KACCIMA header (centered)
    const kaccimaLine1 = 'KANO CHAMBER OF COMMERCE, INDUSTRY,';
    const kaccimaLine2 = 'MINES & AGRICULTURE (KACCIMA)';
    
    // Calculate widths for centering
    const line1Width = helvBold.widthOfTextAtSize(kaccimaLine1, 14);
    const line2Width = helvBold.widthOfTextAtSize(kaccimaLine2, 14);
    
    // Draw first line centered and green
    page.drawText(kaccimaLine1, {
      x: (width - line1Width) / 2,
      y: yPosition,
      size: 14,
      font: helvBold,
      color: rgb(0, 0.5, 0) // Green color
    });
    
    yPosition -= 18;
    
    // Draw second line centered and green
    page.drawText(kaccimaLine2, {
      x: (width - line2Width) / 2,
      y: yPosition,
      size: 14,
      font: helvBold,
      color: rgb(0, 0.5, 0) // Green color
    });

    yPosition -= 25;

    // Report title - with increased font size
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

    yPosition -= 30;

    // Draw table headers with background
    const headers = getTableHeaders(reportType);
    const columnWidths = getColumnWidths(reportType);
    
    // Draw header background
    page.drawRectangle({
      x: 45,
      y: yPosition - 5,
      width: width - 90,
      height: 18, // Increased height for larger font
      color: rgb(0.9, 0.9, 0.9) // Light gray background
    });
    
    // Draw header text with larger font
    let xPosition = 50;
    headers.forEach((header, index) => {
      page.drawText(header, {
        x: xPosition,
        y: yPosition,
        size: 10, // Increased from 8 to 10
        font: helvBold
      });
      xPosition += columnWidths[index];
    });

    yPosition -= 22; // Increased spacing for larger font

    // Draw table rows with larger font
    filteredData.forEach((item, index) => {
      if (yPosition < 70) {
        // Add new page if we run out of space
        const newPage = pdfDoc.addPage([612, 792]);
        yPosition = height - 50;
        
        // Repeat headers on new page
        xPosition = 50;
        headers.forEach((header, i) => {
          newPage.drawText(header, {
            x: xPosition,
            y: yPosition,
            size: 10, // Larger font for headers on new page
            font: helvBold
          });
          xPosition += columnWidths[i];
        });
        yPosition -= 22;
      }

      // Alternate row background for better readability
      if (index % 2 === 0) {
        page.drawRectangle({
          x: 45,
          y: yPosition - 4,
          width: width - 90,
          height: 16, // Increased height for larger font
          color: rgb(0.95, 0.95, 0.95) // Very light gray for alternate rows
        });
      }

      // Draw row data with larger font (9 instead of 7)
      xPosition = 50;
      const rowData = getRowData(item, reportType, index + 1);
      
      rowData.forEach((cell, i) => {
        page.drawText(cell, {
          x: xPosition,
          y: yPosition,
          size: 9, // Increased from 7 to 9
          font: helv
        });
        xPosition += columnWidths[i];
      });

      yPosition -= 16; // Increased spacing for larger font
    });

    // Summary section
    if (yPosition > 80) {
      yPosition -= 25;
      
      // Draw summary box
      page.drawRectangle({
        x: 45,
        y: yPosition - 5,
        width: width - 90,
        height: 35, // Increased height for larger font
        color: rgb(0.95, 0.95, 0.95),
        borderColor: rgb(0.8, 0.8, 0.8),
        borderWidth: 1
      });
      
      // Summary content with larger font
      const summaryTitle = reportType === 'organizations' ? 'ORGANIZATIONS' : 'PAYMENTS';
      
      page.drawText('SUMMARY', {
        x: 50,
        y: yPosition + 10,
        size: 11, // Increased from 9 to 11
        font: helvBold
      });
      
      page.drawText(`Total ${summaryTitle}: ${filteredData.length}`, {
        x: 50,
        y: yPosition - 10,
        size: 11, // Increased from 9 to 11
        font: helv
      });
      
      // Add total amount for payments
      if (reportType === 'payments') {
        const totalAmount = filteredData.reduce((sum, item) => sum + (item.amount || 0), 0);
        page.drawText(`Total Amount: ₦${totalAmount.toLocaleString()}`, {
          x: 220,
          y: yPosition - 10,
          size: 11, // Increased from 9 to 11
          font: helvBold
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
        size: 9, // Increased from 8 to 9
        font: helv
      });
    }

    // Save the PDF
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
    console.error('Error exporting to PDF:', error);
    showAlert('error', 'Failed to export PDF report: ' + error.message);
  } finally {
    setExporting(false);
  }
};

// Helper functions for table formatting
const getTableHeaders = (reportType) => {
  switch(reportType) {
    case 'payments':
      return ['S/N', 'Company', 'Amount', 'Status', 'Date', 'Reference'];
    default: // organizations
      return ['S/N', 'Company Name', 'CAC Number', 'Email', 'Status', 'Date'];
  }
};

const getColumnWidths = (reportType) => {
  switch(reportType) {
    case 'payments':
      return [35, 115, 85, 65, 75, 105]; // Slightly adjusted for larger font
    default: // organizations
      return [35, 115, 85, 145, 55, 75]; // Slightly adjusted for larger font
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
        (item.cac_number || 'N/A').substring(0, 10),
        (item.email || 'N/A').substring(0, 20),
        (item.status || 'N/A'),
        new Date(item.created_at).toLocaleDateString()
      ];
  }
};

const exportToExcel = async () => {
  setExporting(true);
  try {
    const data = reportType === 'payments' ? payments : organizations;

    if (!data || data.length === 0) {
      showAlert('error', `No ${reportType} data available to export`);
      setExporting(false);
      return;
    }

    // Filter data based on date range
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
        'CAC Number': item.cac_number || 'N/A',
        'Email': item.email || 'N/A',
        'Phone': item.phone || 'N/A',
        'Address': item.address || 'N/A',
        'Status': item.status || 'N/A',
        'Registration Date': new Date(item.created_at).toLocaleDateString()
      }));
    }

    // Create workbook and worksheet
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(excelData);

    // Add title and metadata with proper formatting
    const titleText = `KANO CHAMBER OF COMMERCE, INDUSTRY, MINES & AGRICULTURE (KACCIMA)`;
    const reportTitle = reportType === 'payments' ? 'PAYMENTS List' : 'ORGANIZATIONS List';
    
    XLSX.utils.sheet_add_aoa(ws, [
      [titleText],
      [reportTitle],
      [`Period: ${new Date(dateRange.start).toLocaleDateString()} to ${new Date(dateRange.end).toLocaleDateString()}`],
      [`Generated: ${new Date().toLocaleString()}`],
      []
    ], { origin: 'A1' });

    // Define column widths based on report type (using let instead of const)
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
        { wch: 20 }, // CAC Number
        { wch: 30 }, // Email
        { wch: 15 }, // Phone
        { wch: 40 }, // Address
        { wch: 10 }, // Status
        { wch: 15 }  // Registration Date
      ];
    }
    
    ws['!cols'] = colWidths;

    // Add the worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, reportType.toUpperCase());

    // Generate Excel file
    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    
    // Use FileSaver.js saveAs function
    saveAs(blob, `${reportType}_report_${new Date().toISOString().split('T')[0]}.xlsx`);
    
    showAlert('success', `${reportType} report exported successfully`);
  } catch (error) {
    console.error('Error exporting to Excel:', error);
    showAlert('error', 'Failed to export Excel report: ' + error.message);
  } finally {
    setExporting(false);
  }
};

  return (
    <>
      <Snackbar
        open={alert.open}
        autoHideDuration={6000}
        onClose={handleCloseAlert}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert onClose={handleCloseAlert} severity={alert.type} sx={{ width: '100%' }}>
          {alert.message}
        </Alert>
      </Snackbar>

      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', gap: 3 }}>
          <AdminSidebar />
          
          <Box sx={{ flex: 1, bgcolor: '#f8f9fa', p: 3, borderRadius: '16px' }}>
            {/* Header */}
            <Box sx={{ mb: 4 }}>
              <Typography 
                variant="h4" 
                sx={{ 
                  fontFamily: '"Poppins", sans-serif',
                  fontWeight: 700,
                  color: '#333',
                  mb: 1
                }}
              >
                Reports & Analytics
              </Typography>
              <Typography 
                variant="body1" 
                sx={{ 
                  fontFamily: '"Inter", sans-serif',
                  color: '#666'
                }}
              >
                Generate and export comprehensive reports
              </Typography>
            </Box>



            {/* Tabs */}
            <Paper sx={{ borderRadius: '16px', overflow: 'hidden' }}>
              <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <Tabs 
                  value={tabValue} 
                  onChange={handleTabChange}
                  sx={{
                    '& .MuiTab-root': {
                      fontFamily: '"Inter", sans-serif',
                      fontWeight: 600,
                      textTransform: 'none',
                      fontSize: '16px',
                      minWidth: '200px'
                    },
                    '& .Mui-selected': {
                      color: '#15e420 !important'
                    },
                    '& .MuiTabs-indicator': {
                      backgroundColor: '#15e420'
                    }
                  }}
                >
                  <Tab label="Payments Report" />
                  <Tab label="Organizations Report" />
                </Tabs>
              </Box>

              {/* Date Range and Export Controls */}
              <Box sx={{ p: 3, bgcolor: '#f8f9fa' }}>
                <Grid container spacing={2} alignItems="center">
                  <Grid item xs={12} md={3}>
                    <TextField
                      fullWidth
                      type="date"
                      label="Start Date"
                      value={dateRange.start}
                      onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                      InputLabelProps={{ shrink: true }}
                      size="small"
                    />
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <TextField
                      fullWidth
                      type="date"
                      label="End Date"
                      value={dateRange.end}
                      onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                      InputLabelProps={{ shrink: true }}
                      size="small"
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                      <Button
                        variant="outlined"
                        startIcon={<RefreshIcon />}
                        onClick={fetchData}
                        sx={{ borderColor: '#15e420', color: '#15e420' }}
                      >
                        Refresh
                      </Button>
                      <ExportButton
                        exporttype="pdf"
                        startIcon={exporting ? <CircularProgress size={20} color="inherit" /> : <PdfIcon />}
                        onClick={exportToPDF}
                        disabled={exporting}
                      >
                        Export PDF
                      </ExportButton>
                      <ExportButton
                        exporttype="excel"
                        startIcon={exporting ? <CircularProgress size={20} color="inherit" /> : <ExcelIcon />}
                        onClick={exportToExcel}
                        disabled={exporting}
                      >
                        Export Excel
                      </ExportButton>
                    </Box>
                  </Grid>
                </Grid>
              </Box>

              {/* Report Content */}
              <Box sx={{ p: 3 }}>
                {loading ? (
                  <Box display="flex" justifyContent="center" p={4}>
                    <CircularProgress style={{ color: '#15e420' }} />
                  </Box>
                ) : (
                  <>
                    <TabPanel value={tabValue} index={0}>
                      {payments.length > 0 ? (
                        <TableContainer>
                          <Table>
                            <TableHead>
                              <TableRow>
                                <TableCell>S/N</TableCell>
                                <TableCell>Company</TableCell>
                                <TableCell>Amount</TableCell>
                                <TableCell>Status</TableCell>
                                <TableCell>Date</TableCell>
                                <TableCell>Reference</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {payments.slice(0, 10).map((payment, index) => (
                                <TableRow key={payment.id}>
                                  <TableCell>{index + 1}</TableCell>
                                  <TableCell>{payment.organizations?.company_name}</TableCell>
                                  <TableCell>₦{payment.amount?.toLocaleString()}</TableCell>
                                  <TableCell>
                                    <Chip
                                      label={payment.status}
                                      size="small"
                                      color={payment.status === 'approved' ? 'success' : 
                                             payment.status === 'pending' ? 'warning' : 'error'}
                                    />
                                  </TableCell>
                                  <TableCell>{new Date(payment.created_at).toLocaleDateString()}</TableCell>
                                  <TableCell>{payment.reference?.substring(0, 8)}...</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </TableContainer>
                      ) : (
                        <Typography align="center" sx={{ py: 4, color: '#666' }}>
                          No payments data available
                        </Typography>
                      )}
                    </TabPanel>

                    <TabPanel value={tabValue} index={1}>
                      {organizations.length > 0 ? (
                        <TableContainer>
                          <Table>
                            <TableHead>
                              <TableRow>
                                <TableCell>S/N</TableCell>
                                <TableCell>Company Name</TableCell>
                                <TableCell>CAC Number</TableCell>
                                <TableCell>Email</TableCell>
                                <TableCell>Phone</TableCell>
                                <TableCell>Status</TableCell>
                                <TableCell>Date</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {organizations.slice(0, 10).map((org, index) => (
                                <TableRow key={org.id}>
                                  <TableCell>{index + 1}</TableCell>
                                  <TableCell>{org.company_name}</TableCell>
                                  <TableCell>{org.cac_number}</TableCell>
                                  <TableCell>{org.email}</TableCell>
                                  <TableCell>{org.phone}</TableCell>
                                  <TableCell>
                                    <Chip
                                      label={org.status}
                                      size="small"
                                      color={org.status === 'approved' ? 'success' : 
                                             org.status === 'pending' ? 'warning' : 'error'}
                                    />
                                  </TableCell>
                                  <TableCell>{new Date(org.created_at).toLocaleDateString()}</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </TableContainer>
                      ) : (
                        <Typography align="center" sx={{ py: 4, color: '#666' }}>
                          No organizations data available
                        </Typography>
                      )}
                    </TabPanel>
                  </>
                )}
              </Box>
            </Paper>
          </Box>
        </Box>
      </Container>
    </>
  );
};

export default AdminReports;