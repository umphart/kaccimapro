import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import {
  Box,
  Container,
  Paper,
  Typography,
  Grid,
  Button,
  Dialog,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  IconButton,
  Alert,
  Snackbar,
  CircularProgress,
  Avatar,
  Tooltip,
  Card,
  CardContent,
  useTheme,
  useMediaQuery,
  TextField,  
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Business as BusinessIcon,
  Refresh as RefreshIcon,
  Search as SearchIcon,
  Print as PrintIcon,
  CheckCircle as CheckCircleIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import AdminSidebar from './AdminSidebar';
import OrganizationForm from './OrganizationForm';

// Professional Styled Components
const PageContainer = styled(Box)(({ theme }) => ({
  flex: 1,
  p: theme.spacing(2),
  [theme.breakpoints.down('sm')]: {
    p: theme.spacing(1)
  }
}));

const HeaderSection = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: theme.spacing(3),
  flexWrap: 'wrap',
  gap: theme.spacing(1),
  [theme.breakpoints.down('sm')]: {
    flexDirection: 'column',
    alignItems: 'stretch'
  }
}));

const StatCard = styled(Card)(({ theme }) => ({
  height: '100%',
  borderRadius: '12px',
  boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
  border: '1px solid #f0f0f0',
  transition: 'all 0.2s ease',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: '0 8px 16px rgba(21, 228, 32, 0.1)'
  }
}));

const StyledChip = styled(Chip)(({ status }) => ({
  borderRadius: '20px',
  height: '24px',
  fontSize: '0.7rem',
  fontWeight: 600,
  backgroundColor: 
    status === 'active' ? '#e8f5e9' :
    status === 'pending' ? '#fff3e0' :
    status === 'approved' ? '#e3f2fd' :
    '#ffebee',
  color: 
    status === 'active' ? '#2e7d32' :
    status === 'pending' ? '#e65100' :
    status === 'approved' ? '#1565c0' :
    '#c62828'
}));

const SearchContainer = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2),
  marginBottom: theme.spacing(3),
  borderRadius: '12px',
  display: 'flex',
  gap: theme.spacing(2),
  alignItems: 'center',
  flexWrap: 'wrap'
}));

const ActionButton = styled(Button)(({ theme, variant }) => ({
  borderRadius: '8px',
  textTransform: 'none',
  fontWeight: 600,
  padding: theme.spacing(1, 3),
  ...(variant === 'primary' && {
    backgroundColor: '#15e420',
    color: '#fff',
    '&:hover': {
      backgroundColor: '#12c21e'
    }
  }),
  ...(variant === 'outline' && {
    borderColor: '#15e420',
    color: '#15e420',
    '&:hover': {
      backgroundColor: 'rgba(21, 228, 32, 0.05)'
    }
  }),
  ...(variant === 'danger' && {
    backgroundColor: '#dc3545',
    color: '#fff',
    '&:hover': {
      backgroundColor: '#c82333'
    }
  })
}));

const AdminManageOrganizations = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const [loading, setLoading] = useState(true);
  const [organizations, setOrganizations] = useState([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [alert, setAlert] = useState({ open: false, type: 'success', message: '' });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingOrg, setEditingOrg] = useState(null);
  const [adminData, setAdminData] = useState(null);

  useEffect(() => {
    checkAdmin();
    fetchOrganizations();
  }, [page, rowsPerPage, searchTerm]);

  const checkAdmin = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from('admin_users')
          .select('*')
          .eq('user_id', user.id)
          .single();
        setAdminData(data);
        if (data?.admin_type !== 'super_admin') {
          showAlert('error', 'Only Super Admin can manage organizations');
          navigate('/admin/dashboard');
        }
      }
    } catch (error) {
      console.error('Error checking admin:', error);
    }
  };

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
        .from('organizations_registry')
        .select('*', { count: 'exact' })
        .order('sn', { ascending: true });

      if (searchTerm) {
        query = query.or(
          `company_name.ilike.%${searchTerm}%,registration_number.ilike.%${searchTerm}%,cac_number.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`
        );
      }

      const from = page * rowsPerPage;
      const to = from + rowsPerPage - 1;

      const { data, error, count } = await query.range(from, to);

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

  const handleOpenDialog = (org = null) => {
    setEditingOrg(org);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingOrg(null);
  };

  const handleSaveSuccess = () => {
    handleCloseDialog();
    fetchOrganizations();
    showAlert('success', editingOrg ? 'Organization updated successfully' : 'Organization created successfully');
  };

  const handleDeleteOrganization = async (org) => {
    if (!window.confirm(`Are you sure you want to delete "${org.company_name}"?`)) return;

    try {
      const { data: docs } = await supabase
        .from('organization_documents')
        .select('file_path')
        .eq('organization_id', org.id);

      if (docs && docs.length > 0) {
        for (const doc of docs) {
          await supabase.storage
            .from('organization-docs')
            .remove([doc.file_path]);
        }
      }

      await supabase
        .from('organization_documents')
        .delete()
        .eq('organization_id', org.id);

      const { error } = await supabase
        .from('organizations_registry')
        .delete()
        .eq('id', org.id);

      if (error) throw error;
      showAlert('success', 'Organization deleted successfully');
      fetchOrganizations();
    } catch (error) {
      console.error('Error deleting organization:', error);
      showAlert('error', 'Failed to delete organization');
    }
  };

  const handleChangePage = (event, newPage) => setPage(newPage);
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleSearch = (event) => {
    setSearchTerm(event.target.value);
    setPage(0);
  };

  const handleRefresh = () => {
    fetchOrganizations();
    showAlert('info', 'Data refreshed');
  };

  const handlePrint = () => {
    window.print();
  };

  const getStatusChip = (status) => {
    return (
      <StyledChip 
        label={status?.toUpperCase() || 'ACTIVE'} 
        status={status || 'active'} 
        size="small"
      />
    );
  };

  const getSectorColor = (sector) => {
    const colors = {
      'Agricultural and Agro-Allied Products': '#4caf50',
      'Manufacturing and Small-Scale/Cottage Industries': '#2196f3',
      'Banking, Insurance, and Financial Institutions': '#ff9800',
      'Distributive Trade and Commerce': '#9c27b0',
      'Construction, Engineering, Real Estate, Furniture, and Contractors': '#f44336',
      'Medical, Pharmaceuticals, and Allied Products': '#00bcd4',
      'Automobile, Transport, Oil & Gas, and Allied Products': '#607d8b',
      'Hotel, Trade Agencies, Tourism, Clearing & Forwarding, Air Courier Services': '#e91e63',
      'Solid Minerals and Natural Resources': '#795548',
      'Interrelationship, Business Promotion, Printing, and Publicity': '#3f51b5',
      'Women/Youth Development and Entrepreneurship Associations': '#8bc34a',
      'ICT, Telecommunications, and Digital Innovation': '#00acc1'
    };
    return colors[sector] || '#757575';
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
        <Alert onClose={handleCloseAlert} severity={alert.type} sx={{ width: '100%', borderRadius: '8px' }}>
          {alert.message}
        </Alert>
      </Snackbar>

      <Box sx={{ display: 'flex', bgcolor: '#f8f9fa', minHeight: '100vh' }}>
        <AdminSidebar />

        <PageContainer>
          <Container maxWidth="xl" sx={{ py: { xs: 1, md: 2 } }}>
            {/* Header */}
            <HeaderSection>
              <Box>
                <Typography variant="h5" sx={{ fontWeight: 700, color: '#333', fontFamily: '"Inter", sans-serif' }}>
                  Manage Organizations
                </Typography>
                <Typography variant="body2" sx={{ color: '#666', fontFamily: '"Inter", sans-serif' }}>
                  Super Admin: Create and manage registered organizations
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <ActionButton variant="outline" startIcon={<RefreshIcon />} onClick={handleRefresh} size="small">
                  Refresh
                </ActionButton>
                <ActionButton variant="outline" startIcon={<PrintIcon />} onClick={handlePrint} size="small">
                  Print
                </ActionButton>
                <ActionButton variant="primary" startIcon={<AddIcon />} onClick={() => handleOpenDialog()}>
                  New Organization
                </ActionButton>
              </Box>
            </HeaderSection>

            {/* Stats */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={12} sm={4}>
                <StatCard>
                  <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Avatar sx={{ bgcolor: '#15e420', width: 44, height: 44 }}>
                        <BusinessIcon />
                      </Avatar>
                      <Box>
                        <Typography variant="body2" sx={{ color: '#666', fontWeight: 500 }}>Total Organizations</Typography>
                        <Typography variant="h5" sx={{ fontWeight: 700 }}>{totalCount}</Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </StatCard>
              </Grid>
              <Grid item xs={12} sm={4}>
                <StatCard>
                  <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Avatar sx={{ bgcolor: '#ffc107', width: 44, height: 44 }}>
                        <AddIcon />
                      </Avatar>
                      <Box>
                        <Typography variant="body2" sx={{ color: '#666', fontWeight: 500 }}>Registered This Year</Typography>
                        <Typography variant="h5" sx={{ fontWeight: 700 }}>
                          {organizations.filter(o => new Date(o.created_at).getFullYear() === new Date().getFullYear()).length}
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </StatCard>
              </Grid>
              <Grid item xs={12} sm={4}>
                <StatCard>
                  <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Avatar sx={{ bgcolor: '#28a745', width: 44, height: 44 }}>
                        <CheckCircleIcon />
                      </Avatar>
                      <Box>
                        <Typography variant="body2" sx={{ color: '#666', fontWeight: 500 }}>Active</Typography>
                        <Typography variant="h5" sx={{ fontWeight: 700 }}>
                          {organizations.filter(o => o.status === 'active').length}
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </StatCard>
              </Grid>
            </Grid>

            {/* Search */}
            <SearchContainer>
              <TextField
                fullWidth
                size="small"
                placeholder="Search by company name, registration number, CAC, or email..."
                value={searchTerm}
                onChange={handleSearch}
                InputProps={{
                  startAdornment: <SearchIcon sx={{ color: '#999', mr: 1, fontSize: 20 }} />,
                  sx: { bgcolor: 'white', borderRadius: '8px' }
                }}
                sx={{ flex: 1, minWidth: 200 }}
              />
            </SearchContainer>

            {/* Table */}
            <Paper sx={{ borderRadius: '12px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
              <TableContainer>
                <Table size="small">
                  <TableHead sx={{ bgcolor: '#f8f9fa' }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem', py: 1.5 }}>#</TableCell>
                      <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem', py: 1.5 }}>Company</TableCell>
                      <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem', py: 1.5 }}>Reg. Number</TableCell>
                      <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem', py: 1.5 }}>CAC</TableCell>
                      <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem', py: 1.5 }}>Business Nature</TableCell>
                      <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem', py: 1.5 }}>NIN</TableCell>
                      <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem', py: 1.5 }}>Contact</TableCell>
                      <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem', py: 1.5 }}>Status</TableCell>
                      <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem', py: 1.5 }}>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {organizations.length > 0 ? (
                      organizations.map((org, index) => {
                        let businessNature = org.business_nature || [];
                        if (typeof businessNature === 'string') {
                          try {
                            businessNature = JSON.parse(businessNature);
                          } catch (e) {
                            businessNature = [];
                          }
                        }
                        const displayNature = Array.isArray(businessNature) ? businessNature[0] || 'N/A' : 'N/A';
                        
                        return (
                          <TableRow 
                            key={org.id} 
                            hover
                            sx={{ '&:hover': { bgcolor: '#f5f5f5' } }}
                          >
                            <TableCell sx={{ fontSize: '0.8rem', color: '#999' }}>
                              {page * rowsPerPage + index + 1}
                            </TableCell>
                            <TableCell sx={{ fontSize: '0.85rem', fontWeight: 500 }}>
                              <Tooltip title={org.company_name} arrow>
                                <span>{org.company_name}</span>
                              </Tooltip>
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={org.registration_number}
                                size="small"
                                sx={{ 
                                  fontWeight: 600, 
                                  fontSize: '0.65rem', 
                                  bgcolor: '#e3f2fd', 
                                  color: '#1565c0',
                                  height: 22
                                }}
                              />
                            </TableCell>
                            <TableCell sx={{ fontSize: '0.8rem' }}>{org.cac_number || 'N/A'}</TableCell>
                            <TableCell>
                              <Chip
                                label={displayNature.substring(0, 20) + (displayNature.length > 20 ? '...' : '')}
                                size="small"
                                sx={{ 
                                  fontSize: '0.6rem',
                                  bgcolor: getSectorColor(displayNature) + '20',
                                  color: getSectorColor(displayNature),
                                  maxWidth: 120,
                                  height: 22
                                }}
                              />
                              {Array.isArray(businessNature) && businessNature.length > 1 && (
                                <Chip
                                  label={`+${businessNature.length - 1}`}
                                  size="small"
                                  sx={{ fontSize: '0.6rem', height: 22, ml: 0.5 }}
                                />
                              )}
                            </TableCell>
                            <TableCell>
                              {org.nin ? (
                                <Chip
                                  label={org.nin}
                                  size="small"
                                  sx={{ 
                                    fontSize: '0.65rem',
                                    bgcolor: '#e8f5e9',
                                    color: '#2e7d32',
                                    height: 22,
                                    fontFamily: 'monospace'
                                  }}
                                />
                              ) : (
                                <Chip
                                  label="Not provided"
                                  size="small"
                                  sx={{ 
                                    fontSize: '0.6rem',
                                    bgcolor: '#f5f5f5',
                                    color: '#999',
                                    height: 22
                                  }}
                                />
                              )}
                            </TableCell>
                            <TableCell sx={{ fontSize: '0.75rem' }}>
                              {org.contact_person || org.phone_number1 || 'N/A'}
                            </TableCell>
                            <TableCell>{getStatusChip(org.status)}</TableCell>
                            <TableCell>
                              <Box sx={{ display: 'flex', gap: 0.5 }}>
                                <Tooltip title="Edit">
                                  <IconButton
                                    size="small"
                                    onClick={() => handleOpenDialog(org)}
                                    sx={{ color: '#15e420' }}
                                  >
                                    <EditIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title="Delete">
                                  <IconButton
                                    size="small"
                                    onClick={() => handleDeleteOrganization(org)}
                                    sx={{ color: '#dc3545' }}
                                  >
                                    <DeleteIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              </Box>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    ) : (
                      <TableRow>
                        <TableCell colSpan={9} align="center" sx={{ py: 4 }}>
                          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                            <BusinessIcon sx={{ fontSize: 48, color: '#ccc' }} />
                            <Typography sx={{ color: '#666' }}>No organizations found</Typography>
                          </Box>
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
                sx={{
                  '.MuiTablePagination-toolbar': { minHeight: 40 },
                  '.MuiTablePagination-selectLabel, .MuiTablePagination-input': { fontSize: '0.8rem' },
                  '.MuiTablePagination-displayedRows': { fontSize: '0.8rem' }
                }}
              />
            </Paper>
          </Container>
        </PageContainer>
      </Box>

      {/* Organization Form Dialog */}
      <OrganizationForm
        open={dialogOpen}
        onClose={handleCloseDialog}
        editingOrg={editingOrg}
        onSaveSuccess={handleSaveSuccess}
        showAlert={showAlert}
      />
    </>
  );
};

export default AdminManageOrganizations;