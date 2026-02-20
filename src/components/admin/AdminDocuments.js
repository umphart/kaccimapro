import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import {
  Box,
  Container,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  IconButton,
  Button,
  TextField,
  InputAdornment,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Alert,
  Snackbar,
  CircularProgress,
  Avatar,
  Grid
} from '@mui/material';
import {
  Search as SearchIcon,
  Visibility as VisibilityIcon,
  CheckCircle as CheckCircleIcon,
  Pending as PendingIcon,
  Cancel as CancelIcon,
  Refresh as RefreshIcon,
  Business as BusinessIcon,
  Description as DescriptionIcon
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import AdminSidebar from './AdminSidebar';

const StyledCard = styled(Paper)(({ theme }) => ({
  height: '100%',
  borderRadius: '16px',
  boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)',
  transition: 'all 0.3s',
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: '0 15px 35px rgba(21, 228, 32, 0.15)'
  }
}));

const AdminDocuments = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [organizations, setOrganizations] = useState([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [alert, setAlert] = useState({ open: false, type: 'success', message: '' });
  const [stats, setStats] = useState({
    total: 0,
    withDocuments: 0,
    pending: 0,
    approved: 0,
    rejected: 0
  });

  useEffect(() => {
    fetchOrganizations();
    fetchStats();
  }, [page, rowsPerPage, searchTerm, statusFilter]);

  const showAlert = (type, message) => {
    setAlert({ open: true, type, message });
  };

  const handleCloseAlert = () => {
    setAlert({ ...alert, open: false });
  };

  const fetchOrganizations = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('organizations')
        .select('*', { count: 'exact' });

      // Apply search
      if (searchTerm) {
        query = query.or(`company_name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,cac_number.ilike.%${searchTerm}%`);
      }

      // Apply pagination
      const from = page * rowsPerPage;
      const to = from + rowsPerPage - 1;

      const { data, error, count } = await query
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) throw error;

      // For each organization, count their documents
      const orgsWithDocCount = data?.map(org => {
        const docFields = [
          org.cover_letter_path,
          org.memorandum_path,
          org.registration_cert_path,
          org.incorporation_cert_path,
          org.premises_cert_path,
          org.company_logo_path,
          org.form_c07_path,
          org.id_document_path
        ];
        
        const uploadedDocs = docFields.filter(Boolean).length;
        const totalDocs = 8; // Total possible documents
        
        return {
          ...org,
          uploadedDocs,
          totalDocs,
          documentStatus: uploadedDocs === totalDocs ? 'complete' : 
                         uploadedDocs > 0 ? 'partial' : 'none'
        };
      }) || [];

      setOrganizations(orgsWithDocCount);
      setTotalCount(count || 0);
    } catch (error) {
      console.error('Error fetching organizations:', error);
      showAlert('error', 'Failed to load organizations');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchStats = async () => {
    try {
      const { data: allOrgs, error } = await supabase
        .from('organizations')
        .select('*');

      if (error) throw error;

      const total = allOrgs?.length || 0;
      
      let withDocuments = 0;
      let pending = 0;
      let approved = 0;
      let rejected = 0;

      allOrgs?.forEach(org => {
        const docFields = [
          org.cover_letter_path,
          org.memorandum_path,
          org.registration_cert_path,
          org.incorporation_cert_path,
          org.premises_cert_path,
          org.company_logo_path,
          org.form_c07_path,
          org.id_document_path
        ];
        
        const uploadedCount = docFields.filter(Boolean).length;
        if (uploadedCount > 0) {
          withDocuments++;
          // You would need actual document status from a documents table
          // For now, we'll use organization status as proxy
          if (org.status?.toLowerCase() === 'approved') approved++;
          else if (org.status?.toLowerCase() === 'rejected') rejected++;
          else pending++;
        }
      });

      setStats({
        total,
        withDocuments,
        pending,
        approved,
        rejected
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    Promise.all([fetchOrganizations(), fetchStats()]).then(() => {
      showAlert('success', 'Data refreshed successfully');
    });
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleSearch = (event) => {
    setSearchTerm(event.target.value);
    setPage(0);
  };

  const handleViewDocuments = (orgId) => {
    navigate(`/admin/organizations/${orgId}/documents`);
  };

  const getDocumentStatusChip = (org) => {
    if (org.uploadedDocs === 0) {
      return <Chip label="No Documents" size="small" color="default" />;
    }
    
    if (org.uploadedDocs === org.totalDocs) {
      return (
        <Chip
          icon={<CheckCircleIcon />}
          label="Complete"
          size="small"
          color="success"
        />
      );
    }
    
    return (
      <Chip
        icon={<PendingIcon />}
        label={`${org.uploadedDocs}/${org.totalDocs} Uploaded`}
        size="small"
        color="warning"
      />
    );
  };

  if (loading && organizations.length === 0) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress style={{ color: '#15e420' }} />
      </Box>
    );
  }

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
            {/* Header with Refresh Button */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
              <Box>
                <Typography 
                  variant="h4" 
                  sx={{ 
                    fontFamily: '"Poppins", sans-serif',
                    fontWeight: 700,
                    color: '#333',
                    mb: 1
                  }}
                >
                  Document Management
                </Typography>
                <Typography 
                  variant="body1" 
                  sx={{ 
                    fontFamily: '"Inter", sans-serif',
                    color: '#666'
                  }}
                >
                  Review and verify documents for all organizations
                </Typography>
              </Box>
              <Button
                variant="outlined"
                startIcon={<RefreshIcon />}
                onClick={handleRefresh}
                disabled={refreshing}
                sx={{
                  borderColor: '#15e420',
                  color: '#15e420',
                  bgcolor: 'white',
                  '&:hover': {
                    borderColor: '#12c21e',
                    backgroundColor: '#e8f5e9'
                  }
                }}
              >
                {refreshing ? 'Refreshing...' : 'Refresh'}
              </Button>
            </Box>

            {/* Stats Cards */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
              <Grid item xs={12} sm={6} md={2.4}>
                <StyledCard sx={{ p: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar sx={{ bgcolor: '#15e420', width: 48, height: 48 }}>
                      <BusinessIcon />
                    </Avatar>
                    <Box>
                      <Typography variant="body2" sx={{ color: '#666' }}>
                        Total Orgs
                      </Typography>
                      <Typography variant="h4" sx={{ fontWeight: 700 }}>
                        {stats.total}
                      </Typography>
                    </Box>
                  </Box>
                </StyledCard>
              </Grid>
              <Grid item xs={12} sm={6} md={2.4}>
                <StyledCard sx={{ p: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar sx={{ bgcolor: '#17a2b8', width: 48, height: 48 }}>
                      <DescriptionIcon />
                    </Avatar>
                    <Box>
                      <Typography variant="body2" sx={{ color: '#666' }}>
                        With Docs
                      </Typography>
                      <Typography variant="h4" sx={{ fontWeight: 700 }}>
                        {stats.withDocuments}
                      </Typography>
                    </Box>
                  </Box>
                </StyledCard>
              </Grid>
              <Grid item xs={12} sm={6} md={2.4}>
                <StyledCard sx={{ p: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar sx={{ bgcolor: '#ffc107', width: 48, height: 48 }}>
                      <PendingIcon />
                    </Avatar>
                    <Box>
                      <Typography variant="body2" sx={{ color: '#666' }}>
                        Pending
                      </Typography>
                      <Typography variant="h4" sx={{ fontWeight: 700 }}>
                        {stats.pending}
                      </Typography>
                    </Box>
                  </Box>
                </StyledCard>
              </Grid>
              <Grid item xs={12} sm={6} md={2.4}>
                <StyledCard sx={{ p: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar sx={{ bgcolor: '#28a745', width: 48, height: 48 }}>
                      <CheckCircleIcon />
                    </Avatar>
                    <Box>
                      <Typography variant="body2" sx={{ color: '#666' }}>
                        Approved
                      </Typography>
                      <Typography variant="h4" sx={{ fontWeight: 700 }}>
                        {stats.approved}
                      </Typography>
                    </Box>
                  </Box>
                </StyledCard>
              </Grid>
              <Grid item xs={12} sm={6} md={2.4}>
                <StyledCard sx={{ p: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar sx={{ bgcolor: '#dc3545', width: 48, height: 48 }}>
                      <CancelIcon />
                    </Avatar>
                    <Box>
                      <Typography variant="body2" sx={{ color: '#666' }}>
                        Rejected
                      </Typography>
                      <Typography variant="h4" sx={{ fontWeight: 700 }}>
                        {stats.rejected}
                      </Typography>
                    </Box>
                  </Box>
                </StyledCard>
              </Grid>
            </Grid>

            {/* Search Filter */}
            <Paper sx={{ p: 2, mb: 3, borderRadius: '12px', bgcolor: 'white' }}>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    placeholder="Search by company name, email, or CAC..."
                    value={searchTerm}
                    onChange={handleSearch}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon sx={{ color: '#15e420' }} />
                        </InputAdornment>
                      ),
                    }}
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} md={6} sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <Typography variant="body2" sx={{ color: '#666' }}>
                    {totalCount} organizations found
                  </Typography>
                </Grid>
              </Grid>
            </Paper>

            {/* Organizations Table */}
            <Paper sx={{ borderRadius: '12px', overflow: 'hidden', bgcolor: 'white' }}>
              <TableContainer>
                <Table>
                  <TableHead sx={{ backgroundColor: '#f8f9fa' }}>
                    <TableRow>
                      <TableCell sx={{ fontFamily: '"Inter", sans-serif', fontWeight: 600 }}>Company</TableCell>
                      <TableCell sx={{ fontFamily: '"Inter", sans-serif', fontWeight: 600 }}>Email</TableCell>
                      <TableCell sx={{ fontFamily: '"Inter", sans-serif', fontWeight: 600 }}>CAC Number</TableCell>
                      <TableCell sx={{ fontFamily: '"Inter", sans-serif', fontWeight: 600 }}>Documents</TableCell>
                      <TableCell sx={{ fontFamily: '"Inter", sans-serif', fontWeight: 600 }}>Status</TableCell>
                      <TableCell sx={{ fontFamily: '"Inter", sans-serif', fontWeight: 600 }}>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {organizations.length > 0 ? (
                      organizations.map((org) => (
                        <TableRow key={org.id} hover>
                          <TableCell sx={{ fontFamily: '"Inter", sans-serif' }}>
                            {org.company_name}
                          </TableCell>
                          <TableCell sx={{ fontFamily: '"Inter", sans-serif' }}>
                            {org.email}
                          </TableCell>
                          <TableCell sx={{ fontFamily: '"Inter", sans-serif' }}>
                            {org.cac_number || 'N/A'}
                          </TableCell>
                          <TableCell>
                            {getDocumentStatusChip(org)}
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={org.status}
                              size="small"
                              color={
                                org.status?.toLowerCase() === 'approved' ? 'success' :
                                org.status?.toLowerCase() === 'pending' ? 'warning' : 'error'
                              }
                            />
                          </TableCell>
                          <TableCell>
                            <IconButton
                              size="small"
                              onClick={() => handleViewDocuments(org.id)}
                              sx={{ color: '#15e420' }}
                              title="View Documents"
                            >
                              <VisibilityIcon />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                          <Typography sx={{ color: '#666' }}>
                            No organizations found
                          </Typography>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
              <TablePagination
                rowsPerPageOptions={[5, 10, 25, 50]}
                component="div"
                count={totalCount}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
              />
            </Paper>
          </Box>
        </Box>
      </Container>
    </>
  );
};

export default AdminDocuments;