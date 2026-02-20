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
  Card,
  CardContent,
  Grid,
  Avatar
} from '@mui/material';
import {
  Search as SearchIcon,
  Visibility as VisibilityIcon,
  CheckCircle as CheckCircleIcon,
  Pending as PendingIcon,
  Cancel as CancelIcon,
  FilterList as FilterIcon,
  Refresh as RefreshIcon,
  Business as BusinessIcon
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import AdminSidebar from './AdminSidebar';

const StyledCard = styled(Card)(({ theme }) => ({
  height: '100%',
  borderRadius: '16px',
  boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)',
  transition: 'all 0.3s',
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: '0 15px 35px rgba(21, 228, 32, 0.15)'
  }
}));

const AdminOrganizations = ({ filter = 'all' }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [organizations, setOrganizations] = useState([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState(filter);
  const [alert, setAlert] = useState({ open: false, type: 'success', message: '' });
  const [stats, setStats] = useState({
    total: 0,
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
        .select('*, payments(*)', { count: 'exact' });

      // Apply status filter
      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

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

      setOrganizations(data || []);
      setTotalCount(count || 0);
    } catch (error) {
      console.error('Error fetching organizations:', error);
      showAlert('error', 'Failed to load organizations');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const { count: total } = await supabase
        .from('organizations')
        .select('*', { count: 'exact', head: true });

      const { count: pending } = await supabase
        .from('organizations')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');

      const { count: approved } = await supabase
        .from('organizations')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'approved');

      const { count: rejected } = await supabase
        .from('organizations')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'rejected');

      setStats({
        total: total || 0,
        pending: pending || 0,
        approved: approved || 0,
        rejected: rejected || 0
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
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

  const handleStatusFilter = (event) => {
    setStatusFilter(event.target.value);
    setPage(0);
  };

  const handleViewOrganization = (id) => {
    navigate(`/admin/organizations/${id}`);
  };

  const getStatusChip = (status) => {
    const config = {
      pending: { color: 'warning', icon: <PendingIcon />, label: 'Pending' },
      approved: { color: 'success', icon: <CheckCircleIcon />, label: 'Approved' },
      rejected: { color: 'error', icon: <CancelIcon />, label: 'Rejected' }
    };
    const statusConfig = config[status] || config.pending;

    return (
      <Chip
        icon={statusConfig.icon}
        label={statusConfig.label}
        size="small"
        color={statusConfig.color}
        sx={{ fontFamily: '"Inter", sans-serif' }}
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
                Organizations Management
              </Typography>
              <Typography 
                variant="body1" 
                sx={{ 
                  fontFamily: '"Inter", sans-serif',
                  color: '#666'
                }}
              >
                Review and manage all registered organizations
              </Typography>
            </Box>

            {/* Stats Cards */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
              <Grid item xs={12} sm={6} md={3}>
                <StyledCard>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Avatar sx={{ bgcolor: '#15e420', width: 48, height: 48 }}>
                        <BusinessIcon />
                      </Avatar>
                      <Box>
                        <Typography variant="body2" sx={{ color: '#666' }}>
                          Total Organizations
                        </Typography>
                        <Typography variant="h4" sx={{ fontWeight: 700 }}>
                          {stats.total}
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </StyledCard>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <StyledCard>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Avatar sx={{ bgcolor: '#ffc107', width: 48, height: 48 }}>
                        <PendingIcon />
                      </Avatar>
                      <Box>
                        <Typography variant="body2" sx={{ color: '#666' }}>
                          Pending Review
                        </Typography>
                        <Typography variant="h4" sx={{ fontWeight: 700 }}>
                          {stats.pending}
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </StyledCard>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <StyledCard>
                  <CardContent>
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
                  </CardContent>
                </StyledCard>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <StyledCard>
                  <CardContent>
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
                  </CardContent>
                </StyledCard>
              </Grid>
            </Grid>

            {/* Filters */}
            <Paper sx={{ p: 2, mb: 3, borderRadius: '12px' }}>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    placeholder="Search by company, email, or CAC..."
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
                <Grid item xs={12} md={3}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Status Filter</InputLabel>
                    <Select
                      value={statusFilter}
                      onChange={handleStatusFilter}
                      label="Status Filter"
                    >
                      <MenuItem value="all">All Status</MenuItem>
                      <MenuItem value="pending">Pending</MenuItem>
                      <MenuItem value="approved">Approved</MenuItem>
                      <MenuItem value="rejected">Rejected</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={5} sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                  <Button
                    variant="outlined"
                    startIcon={<RefreshIcon />}
                    onClick={fetchOrganizations}
                    sx={{ borderColor: '#15e420', color: '#15e420' }}
                  >
                    Refresh
                  </Button>
                </Grid>
              </Grid>
            </Paper>

            {/* Table */}
            <Paper sx={{ borderRadius: '12px', overflow: 'hidden' }}>
              <TableContainer>
                <Table>
                  <TableHead sx={{ backgroundColor: '#f8f9fa' }}>
                    <TableRow>
                      <TableCell sx={{ fontFamily: '"Inter", sans-serif', fontWeight: 600 }}>Company</TableCell>
                      <TableCell sx={{ fontFamily: '"Inter", sans-serif', fontWeight: 600 }}>Email</TableCell>
                      <TableCell sx={{ fontFamily: '"Inter", sans-serif', fontWeight: 600 }}>CAC Number</TableCell>
                      <TableCell sx={{ fontFamily: '"Inter", sans-serif', fontWeight: 600 }}>Registration Date</TableCell>
                      <TableCell sx={{ fontFamily: '"Inter", sans-serif', fontWeight: 600 }}>Status</TableCell>
                      <TableCell sx={{ fontFamily: '"Inter", sans-serif', fontWeight: 600 }}>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {organizations.map((org) => (
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
                        <TableCell sx={{ fontFamily: '"Inter", sans-serif' }}>
                          {new Date(org.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          {getStatusChip(org.status)}
                        </TableCell>
                        <TableCell>
                          <IconButton
                            size="small"
                            onClick={() => handleViewOrganization(org.id)}
                            sx={{ color: '#15e420' }}
                          >
                            <VisibilityIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                    {organizations.length === 0 && (
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

export default AdminOrganizations;