import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Paper,
  Typography,
  Grid,
  Button,
  TextField,
  Tab,
  Tabs,
  CircularProgress,
  Alert,
  Snackbar
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  PictureAsPdf as PdfIcon,
  TableChart as ExcelIcon
} from '@mui/icons-material'; // Add these imports
import AdminSidebar from './AdminSidebar';
import ReportFilters from './reports/ReportFilters';
import PaymentsTable from './reports/PaymentsTable';
import OrganizationsTable from './reports/OrganizationsTable';
import { fetchPayments, fetchOrganizations, fetchStats } from './reports/reportService';
import { exportToPDF, exportToExcel } from './reports/exportUtils';

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
  const [filteredOrganizations, setFilteredOrganizations] = useState([]);
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });
  const [filters, setFilters] = useState({
    search: ''
  });
  const [reportType, setReportType] = useState('payments');
  const [stats, setStats] = useState({
    payments: { total: 0, amount: 0, pending: 0 },
    organizations: { total: 0, approved: 0, pending: 0 }
  });
  const [alert, setAlert] = useState({ open: false, type: 'success', message: '' });
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchData();
  }, [dateRange, tabValue]);

  useEffect(() => {
    // Apply filters whenever organizations or filters change
    if (organizations.length > 0) {
      applyFilters();
    } else {
      setFilteredOrganizations([]);
    }
  }, [organizations, filters]);

  const showAlert = (type, message) => {
    setAlert({ open: true, type, message });
  };

  const handleCloseAlert = () => {
    setAlert({ ...alert, open: false });
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
    setReportType(newValue === 0 ? 'payments' : 'organizations');
    setError(null);
  };

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('Fetching data for tab:', tabValue);
      
      if (tabValue === 0) {
        const paymentsData = await fetchPayments(dateRange);
        setPayments(paymentsData);
      } else {
        const orgsData = await fetchOrganizations(dateRange);
        setOrganizations(orgsData);
        setFilteredOrganizations(orgsData);
      }
      
      const statsData = await fetchStats();
      setStats(statsData);
      
    } catch (error) {
      console.error('Error in fetchData:', error);
      setError(error.message || 'Failed to load data');
      showAlert('error', 'Failed to load data: ' + (error.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    console.log('Applying search filter:', filters.search);
    
    let filtered = [...organizations];
    
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(org => {
        return (
          (org.company_name?.toLowerCase().includes(searchLower)) ||
          (org.business_nature?.toLowerCase().includes(searchLower)) ||
          (org.phone_number?.toLowerCase().includes(searchLower)) ||
          (org.office_address?.toLowerCase().includes(searchLower)) ||
          (org.contact_person?.toLowerCase().includes(searchLower)) ||
          (org.representative?.toLowerCase().includes(searchLower)) ||
          (org.email?.toLowerCase().includes(searchLower)) ||
          (org.cac_number?.toLowerCase().includes(searchLower))
        );
      });
    }
    
    console.log('Organizations after filter:', filtered.length);
    setFilteredOrganizations(filtered);
  };

  const handleFilterChange = (name, value) => {
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleRefresh = () => {
    setFilters({ search: '' });
    fetchData();
  };

  const handlePDFExport = async () => {
    await exportToPDF(
      reportType, 
      reportType === 'payments' ? payments : filteredOrganizations, 
      dateRange, 
      filters, 
      setExporting, 
      showAlert
    );
  };

  const handleExcelExport = async () => {
    await exportToExcel(
      reportType, 
      reportType === 'payments' ? payments : filteredOrganizations, 
      dateRange, 
      filters, 
      setExporting, 
      showAlert
    );
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

            {/* Error Display */}
            {error && (
              <Alert severity="error" sx={{ mb: 3, borderRadius: '8px' }}>
                {error}
              </Alert>
            )}

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

              {/* Date Range and Filters */}
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
                  
                  {/* Filters for Organizations tab */}
                  {tabValue === 1 && (
                    <ReportFilters 
                      filters={filters}
                      onFilterChange={handleFilterChange}
                      onRefresh={handleRefresh}
                      exporting={exporting}
                      onPDFExport={handlePDFExport}
                      onExcelExport={handleExcelExport}
                      recordCount={filteredOrganizations.length}
                    />
                  )}
                  
                  {/* For Payments tab, still show export buttons */}
                  {tabValue === 0 && (
                    <Grid item xs={12} md={6}>
                      <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                        <Button
                          variant="outlined"
                          startIcon={<RefreshIcon />}
                          onClick={handleRefresh}
                          sx={{ borderColor: '#15e420', color: '#15e420' }}
                        >
                          Refresh
                        </Button>
                        <Button
                          variant="contained"
                          startIcon={exporting ? <CircularProgress size={20} color="inherit" /> : <PdfIcon />}
                          onClick={handlePDFExport}
                          disabled={exporting || payments.length === 0}
                          sx={{
                            background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                            color: 'white',
                            '&:hover': { transform: 'translateY(-2px)' }
                          }}
                        >
                          PDF
                        </Button>
                        <Button
                          variant="contained"
                          startIcon={exporting ? <CircularProgress size={20} color="inherit" /> : <ExcelIcon />}
                          onClick={handleExcelExport}
                          disabled={exporting || payments.length === 0}
                          sx={{
                            background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                            color: 'white',
                            '&:hover': { transform: 'translateY(-2px)' }
                          }}
                        >
                          Excel
                        </Button>
                      </Box>
                    </Grid>
                  )}
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
                      <PaymentsTable payments={payments} />
                    </TabPanel>

                    <TabPanel value={tabValue} index={1}>
                      <OrganizationsTable 
                        organizations={filteredOrganizations}
                        searchTerm={filters.search}
                      />
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