// components/referees/RefereesManagement.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import {
  Box,
  Container,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  Chip,
  Button,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Avatar,
  Alert,
  Snackbar,
  CircularProgress,
  TextField,
  InputAdornment,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  Tab,
  Tabs,
  Badge
} from '@mui/material';
import {
  Search as SearchIcon,
  Refresh as RefreshIcon,
  Person as PersonIcon,
  CheckCircle as CheckCircleIcon,
  Pending as PendingIcon,
  Cancel as CancelIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Business as BusinessIcon,
  ThumbUp as ThumbUpIcon,
  ThumbDown as ThumbDownIcon,
  Assignment as AssignmentIcon,
  Visibility as VisibilityIcon
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import Sidebar from '../Sidebar';
import { sendRefereeConfirmationEmail } from '../../utils/emailService';

const StyledCard = styled(Card)(({ theme }) => ({
  borderRadius: '16px',
  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
  border: '1px solid #f0f0f0',
  transition: 'all 0.2s ease',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: '0 8px 16px rgba(21, 228, 32, 0.1)'
  }
}));

const RefereesManagement = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [organizations, setOrganizations] = useState([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [alert, setAlert] = useState({ open: false, type: 'success', message: '' });
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({ total: 0, confirmed: 0, pending: 0, rejected: 0 });
  const [error, setError] = useState(null);
  const [tabValue, setTabValue] = useState(0);

  // Details Dialog
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [selectedOrg, setSelectedOrg] = useState(null);

  // Confirmation Modal
  const [confirmModal, setConfirmModal] = useState({
    open: false,
    title: '',
    message: '',
    type: 'info',
    confirmText: 'Confirm',
    cancelText: 'Cancel',
    onConfirm: null
  });

  useEffect(() => {
    checkUser();
  }, []);

  useEffect(() => {
    if (user) {
      fetchRefereeRequests();
    }
  }, [user, page, rowsPerPage, searchTerm]);

  const showAlert = (type, message) => {
    setAlert({ open: true, type, message });
  };

  const handleCloseAlert = () => {
    setAlert({ ...alert, open: false });
  };

  const checkUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/login');
        return;
      }
      setUser(user);
    } catch (error) {
      console.error('Error checking user:', error);
      navigate('/login');
    }
  };

  const fetchRefereeRequests = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Query ALL organizations where user is the referee
      let query = supabase
        .from('organizations_registry')
        .select('*')
        .eq('referee_email', user.email);

      if (searchTerm) {
        query = query.or(
          `company_name.ilike.%${searchTerm}%,registration_number.ilike.%${searchTerm}%,referee_name.ilike.%${searchTerm}%`
        );
      }

      const from = page * rowsPerPage;
      const to = from + rowsPerPage - 1;

      const { data, error, count } = await query
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) throw error;

      // Filter to only self-registered organizations (not admin created)
      const allOrgs = data?.filter(org => 
        org.referee_email === user.email && 
        org.registration_type === 'self'
      ) || [];

      setOrganizations(allOrgs);
      setTotalCount(count || 0);
      
      // Calculate stats
      const confirmed = allOrgs.filter(org => 
        org.referee_confirmed === true
      ).length;
      
      // Pending = not confirmed and status is 'pending' (not rejected)
      const pending = allOrgs.filter(org => 
        !org.referee_confirmed && 
        org.status !== 'rejected' &&
        org.status !== 'approved'
      ).length;
      
      const rejected = allOrgs.filter(org => 
        org.status === 'rejected'
      ).length;
      
      setStats({
        total: allOrgs.length,
        confirmed: confirmed,
        pending: pending,
        rejected: rejected
      });
    } catch (error) {
      console.error('Error fetching referee requests:', error);
      setError('Failed to load referee requests: ' + (error.message || 'Unknown error'));
      setOrganizations([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
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

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
    setPage(0);
  };

  // ============================================================
  // ACCEPT INVITATION - ONLY update referee_confirmed
  // Status remains 'pending' - admin will approve later
  // ============================================================
  const handleAcceptInvitation = async (organization) => {
    // Show confirmation modal
    setConfirmModal({
      open: true,
      title: 'Confirm as Referee',
      message: `Are you sure you want to confirm as a referee for ${organization.company_name}? This action cannot be undone.`,
      type: 'warning',
      confirmText: 'Yes, Confirm',
      cancelText: 'Cancel',
      onConfirm: async () => {
        try {
          const { error } = await supabase
            .from('organizations_registry')
            .update({ 
              referee_confirmed: true,
              referee_confirmation_date: new Date().toISOString()
              // ✅ DO NOT change status - keep it as 'pending'
            })
            .eq('id', organization.id);

          if (error) throw error;

          showAlert('success', `✅ You have confirmed as a referee for ${organization.company_name}. The organization is now pending admin approval.`);
          fetchRefereeRequests();
        } catch (error) {
          console.error('Error accepting invitation:', error);
          showAlert('error', 'Failed to accept invitation: ' + error.message);
        }
        setConfirmModal({ ...confirmModal, open: false });
      }
    });
  };

  // Handle rejecting a referee invitation
  const handleRejectInvitation = async (organization) => {
    setConfirmModal({
      open: true,
      title: 'Reject Referee Request',
      message: `Are you sure you want to reject the referee request from ${organization.company_name}?`,
      type: 'error',
      confirmText: 'Yes, Reject',
      cancelText: 'Cancel',
      onConfirm: async () => {
        try {
          const { error } = await supabase
            .from('organizations_registry')
            .update({ 
              referee_confirmed: false,
              status: 'rejected'
            })
            .eq('id', organization.id);

          if (error) throw error;

          showAlert('info', `You have declined the referee request from ${organization.company_name}`);
          fetchRefereeRequests();
        } catch (error) {
          console.error('Error rejecting invitation:', error);
          showAlert('error', 'Failed to reject invitation: ' + error.message);
        }
        setConfirmModal({ ...confirmModal, open: false });
      }
    });
  };

  // Handle viewing organization details
  const handleViewDetails = (org) => {
    setSelectedOrg(org);
    setDetailsDialogOpen(true);
  };

  const handleCloseDetails = () => {
    setDetailsDialogOpen(false);
    setSelectedOrg(null);
  };

  const getStatusChip = (org) => {
    // If referee confirmed
    if (org.referee_confirmed === true) {
      return (
        <Chip 
          icon={<CheckCircleIcon />} 
          label="Confirmed" 
          size="small"
          sx={{
            borderRadius: '20px',
            height: '24px',
            fontSize: '0.7rem',
            fontWeight: 500,
            backgroundColor: '#e8f5e9',
            color: '#2e7d32'
          }}
        />
      );
    }
    
    // If rejected
    if (org.status === 'rejected') {
      return (
        <Chip 
          icon={<CancelIcon />} 
          label="Rejected" 
          size="small"
          sx={{
            borderRadius: '20px',
            height: '24px',
            fontSize: '0.7rem',
            fontWeight: 500,
            backgroundColor: '#ffebee',
            color: '#c62828'
          }}
        />
      );
    }
    
    // If already approved
    if (org.status === 'approved') {
      return (
        <Chip 
          icon={<CheckCircleIcon />} 
          label="Approved" 
          size="small"
          sx={{
            borderRadius: '20px',
            height: '24px',
            fontSize: '0.7rem',
            fontWeight: 500,
            backgroundColor: '#e8f5e9',
            color: '#2e7d32'
          }}
        />
      );
    }
    
    // Pending/awaiting confirmation
    return (
      <Chip 
        icon={<PendingIcon />} 
        label="Awaiting Confirmation" 
        size="small"
        sx={{
          borderRadius: '20px',
          height: '24px',
          fontSize: '0.7rem',
          fontWeight: 500,
          backgroundColor: '#e3f2fd',
          color: '#0d47a1'
        }}
      />
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-NG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Filter organizations based on tab
  const getFilteredOrganizations = () => {
    if (tabValue === 0) {
      // Pending - not confirmed and not rejected
      return organizations.filter(org => 
        !org.referee_confirmed && 
        org.status !== 'rejected' &&
        org.status !== 'approved'
      );
    }
    if (tabValue === 1) {
      // Confirmed
      return organizations.filter(org => 
        org.referee_confirmed === true
      );
    }
    if (tabValue === 2) {
      // Rejected
      return organizations.filter(org => org.status === 'rejected');
    }
    return organizations;
  };

  // Check if organization is actionable (can accept/reject)
  const isActionable = (org) => {
    return !org.referee_confirmed && 
           org.status !== 'rejected' && 
           org.status !== 'approved' &&
           org.registration_type === 'self';
  };

  // Show loading state
  if (loading && !error) {
    return (
      <Box sx={{ display: 'flex', bgcolor: '#f8f9fa', minHeight: '100vh' }}>
        <Sidebar />
        <Box sx={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <CircularProgress style={{ color: '#15e420' }} />
        </Box>
      </Box>
    );
  }

  // Show error state
  if (error) {
    return (
      <Box sx={{ display: 'flex', bgcolor: '#f8f9fa', minHeight: '100vh' }}>
        <Sidebar />
        <Box sx={{ flex: 1, p: 3 }}>
          <Container maxWidth="md">
            <Paper sx={{ p: 4, textAlign: 'center', borderRadius: '16px' }}>
              <BusinessIcon sx={{ fontSize: 64, color: '#ff9800', mb: 2 }} />
              <Typography variant="h5" sx={{ fontWeight: 600, mb: 2, color: '#333' }}>
                Error Loading Referee Requests
              </Typography>
              <Typography variant="body1" sx={{ color: '#666', mb: 3 }}>
                {error}
              </Typography>
              <Button
                variant="contained"
                onClick={() => { setError(null); fetchRefereeRequests(); }}
                sx={{
                  backgroundColor: '#15e420',
                  '&:hover': { backgroundColor: '#12c21e' },
                  textTransform: 'none'
                }}
              >
                Try Again
              </Button>
            </Paper>
          </Container>
        </Box>
      </Box>
    );
  }

  const filteredOrgs = getFilteredOrganizations();

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

      <Box sx={{ display: 'flex', bgcolor: '#f8f9fa', minHeight: '100vh' }}>
        <Sidebar />

        <Box sx={{ flex: 1, p: { xs: 2, md: 3 } }}>
          <Container maxWidth="xl" sx={{ py: { xs: 1, md: 2 } }}>
            {/* Header */}
            <Box sx={{ mb: 4 }}>
              <Typography variant="h4" sx={{ fontWeight: 700, fontFamily: '"Poppins", sans-serif', color: '#333' }}>
                Referee Management
              </Typography>
              <Typography variant="body1" sx={{ color: '#666', fontFamily: '"Inter", sans-serif' }}>
                Organizations where you serve as a referee
              </Typography>
              <Typography variant="caption" sx={{ color: '#999', display: 'block', mt: 0.5 }}>
                Note: Admin-created organizations do not require referee confirmation
              </Typography>
            </Box>

            {/* Stats Cards */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={12} sm={3}>
                <StyledCard>
                  <CardContent sx={{ p: 2.5 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Avatar sx={{ bgcolor: '#15e420', width: 40, height: 40 }}>
                        <PersonIcon />
                      </Avatar>
                      <Box>
                        <Typography variant="body2" sx={{ color: '#666', fontWeight: 500 }}>Total</Typography>
                        <Typography variant="h5" sx={{ fontWeight: 700 }}>{stats.total}</Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </StyledCard>
              </Grid>
              <Grid item xs={12} sm={3}>
                <StyledCard>
                  <CardContent sx={{ p: 2.5 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Avatar sx={{ bgcolor: '#1976d2', width: 40, height: 40 }}>
                        <PendingIcon />
                      </Avatar>
                      <Box>
                        <Typography variant="body2" sx={{ color: '#666', fontWeight: 500 }}>Pending</Typography>
                        <Typography variant="h5" sx={{ fontWeight: 700 }}>{stats.pending}</Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </StyledCard>
              </Grid>
              <Grid item xs={12} sm={3}>
                <StyledCard>
                  <CardContent sx={{ p: 2.5 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Avatar sx={{ bgcolor: '#28a745', width: 40, height: 40 }}>
                        <CheckCircleIcon />
                      </Avatar>
                      <Box>
                        <Typography variant="body2" sx={{ color: '#666', fontWeight: 500 }}>Confirmed</Typography>
                        <Typography variant="h5" sx={{ fontWeight: 700 }}>{stats.confirmed}</Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </StyledCard>
              </Grid>
              <Grid item xs={12} sm={3}>
                <StyledCard>
                  <CardContent sx={{ p: 2.5 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Avatar sx={{ bgcolor: '#dc3545', width: 40, height: 40 }}>
                        <CancelIcon />
                      </Avatar>
                      <Box>
                        <Typography variant="body2" sx={{ color: '#666', fontWeight: 500 }}>Rejected</Typography>
                        <Typography variant="h5" sx={{ fontWeight: 700 }}>{stats.rejected}</Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </StyledCard>
              </Grid>
            </Grid>

            {/* Tabs */}
            <Paper sx={{ mb: 3, borderRadius: '12px', overflow: 'hidden' }}>
              <Tabs
                value={tabValue}
                onChange={handleTabChange}
                sx={{ borderBottom: 1, borderColor: 'divider', px: 2 }}
              >
                <Tab 
                  label={
                    <Badge 
                      badgeContent={stats.pending} 
                      color="primary"
                      invisible={stats.pending === 0}
                    >
                      Pending
                    </Badge>
                  } 
                />
                <Tab 
                  label={
                    <Badge 
                      badgeContent={stats.confirmed} 
                      color="success"
                      invisible={stats.confirmed === 0}
                    >
                      Confirmed
                    </Badge>
                  } 
                />
                <Tab 
                  label={
                    <Badge 
                      badgeContent={stats.rejected} 
                      color="error"
                      invisible={stats.rejected === 0}
                    >
                      Rejected
                    </Badge>
                  } 
                />
              </Tabs>

              {/* Search */}
              <Box sx={{ p: 2 }}>
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 2 }}>
                  <TextField
                    placeholder="Search organizations..."
                    value={searchTerm}
                    onChange={handleSearch}
                    size="small"
                    sx={{ flex: 1, minWidth: 200 }}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon fontSize="small" />
                        </InputAdornment>
                      ),
                    }}
                  />
                  <Button
                    variant="outlined"
                    startIcon={<RefreshIcon />}
                    onClick={fetchRefereeRequests}
                    size="small"
                    sx={{ textTransform: 'none' }}
                  >
                    Refresh
                  </Button>
                </Box>

                <TableContainer>
                  <Table size="small">
                    <TableHead sx={{ bgcolor: '#f8f9fa' }}>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem' }}>#</TableCell>
                        <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem' }}>Organization</TableCell>
                        <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem' }}>Registration Number</TableCell>
                        <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem' }}>Referee Name</TableCell>
                        <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem' }}>Status</TableCell>
                        <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem' }}>Request Date</TableCell>
                        <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem' }}>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {filteredOrgs.length > 0 ? (
                        filteredOrgs.map((org, index) => {
                          const actionable = isActionable(org);
                          return (
                            <TableRow key={org.id} hover>
                              <TableCell sx={{ fontSize: '0.8rem', color: '#999' }}>
                                {page * rowsPerPage + index + 1}
                              </TableCell>
                              <TableCell sx={{ fontSize: '0.85rem', fontWeight: 500 }}>
                                {org.company_name}
                                {org.registration_type === 'admin' && (
                                  <Chip 
                                    label="Admin" 
                                    size="small" 
                                    sx={{ 
                                      ml: 1, 
                                      height: '18px', 
                                      fontSize: '0.55rem',
                                      backgroundColor: '#e8f5e9',
                                      color: '#2e7d32'
                                    }} 
                                  />
                                )}
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
                              <TableCell sx={{ fontSize: '0.85rem' }}>
                                {org.referee_name || 'N/A'}
                              </TableCell>
                              <TableCell>
                                {getStatusChip(org)}
                              </TableCell>
                              <TableCell sx={{ fontSize: '0.8rem' }}>
                                {formatDate(org.created_at)}
                              </TableCell>
                              <TableCell>
                                <Box sx={{ display: 'flex', gap: 0.5 }}>
                                  <Tooltip title="View Details">
                                    <IconButton
                                      size="small"
                                      onClick={() => handleViewDetails(org)}
                                      sx={{ color: '#15e420' }}
                                    >
                                      <VisibilityIcon fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                  {actionable && (
                                    <>
                                      <Tooltip title="Accept & Confirm as Referee">
                                        <IconButton
                                          size="small"
                                          onClick={() => handleAcceptInvitation(org)}
                                          sx={{ color: '#28a745' }}
                                        >
                                          <ThumbUpIcon fontSize="small" />
                                        </IconButton>
                                      </Tooltip>
                                      <Tooltip title="Reject Request">
                                        <IconButton
                                          size="small"
                                          onClick={() => handleRejectInvitation(org)}
                                          sx={{ color: '#dc3545' }}
                                        >
                                          <ThumbDownIcon fontSize="small" />
                                        </IconButton>
                                      </Tooltip>
                                    </>
                                  )}
                                  {org.referee_confirmed && (
                                    <Chip 
                                      icon={<CheckCircleIcon />} 
                                      label="Confirmed" 
                                      size="small" 
                                      color="success"
                                      sx={{ height: '24px', fontSize: '0.7rem' }}
                                    />
                                  )}
                                  {org.status === 'rejected' && (
                                    <Chip 
                                      icon={<CancelIcon />} 
                                      label="Rejected" 
                                      size="small" 
                                      color="error"
                                      sx={{ height: '24px', fontSize: '0.7rem' }}
                                    />
                                  )}
                                  {org.status === 'approved' && (
                                    <Chip 
                                      icon={<CheckCircleIcon />} 
                                      label="Approved" 
                                      size="small" 
                                      color="success"
                                      sx={{ height: '24px', fontSize: '0.7rem' }}
                                    />
                                  )}
                                  {org.registration_type === 'admin' && (
                                    <Chip 
                                      label="No Referee Needed" 
                                      size="small" 
                                      color="default"
                                      sx={{ height: '24px', fontSize: '0.65rem' }}
                                    />
                                  )}
                                </Box>
                              </TableCell>
                            </TableRow>
                          );
                        })
                      ) : (
                        <TableRow>
                          <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                              <PersonIcon sx={{ fontSize: 48, color: '#ccc' }} />
                              <Typography sx={{ color: '#666' }}>
                                {tabValue === 0 ? 'No pending referee requests' :
                                 tabValue === 1 ? 'No confirmed referee requests' :
                                 'No rejected referee requests'}
                              </Typography>
                              <Typography variant="caption" sx={{ color: '#999' }}>
                                {tabValue === 0 ? 'Organizations will appear here when they request you as a referee' : ''}
                              </Typography>
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
                />
              </Box>
            </Paper>
          </Container>
        </Box>
      </Box>

      {/* Organization Details Dialog */}
      <Dialog
        open={detailsDialogOpen}
        onClose={handleCloseDetails}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: '16px' } }}
      >
        {selectedOrg && (
          <>
            <DialogTitle sx={{ bgcolor: '#f8f9fa', borderBottom: '1px solid #e0e0e0' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  Organization Details
                </Typography>
                <IconButton onClick={handleCloseDetails} size="small">
                  <CancelIcon />
                </IconButton>
              </Box>
            </DialogTitle>
            <DialogContent sx={{ pt: 3 }}>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#666' }}>Company Name</Typography>
                  <Typography variant="body1" sx={{ mb: 2 }}>{selectedOrg.company_name}</Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#666' }}>Registration Number</Typography>
                  <Typography variant="body1" sx={{ mb: 2 }}>{selectedOrg.registration_number}</Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#666' }}>CAC Number</Typography>
                  <Typography variant="body1" sx={{ mb: 2 }}>{selectedOrg.cac_number || 'N/A'}</Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#666' }}>Email</Typography>
                  <Typography variant="body1" sx={{ mb: 2 }}>{selectedOrg.email || 'N/A'}</Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#666' }}>Phone</Typography>
                  <Typography variant="body1" sx={{ mb: 2 }}>{selectedOrg.phone_number1 || 'N/A'}</Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#666' }}>Address</Typography>
                  <Typography variant="body1" sx={{ mb: 2 }}>
                    {selectedOrg.house_number ? `${selectedOrg.house_number}, ` : ''}
                    {selectedOrg.street || ''}
                    {selectedOrg.lga ? `, ${selectedOrg.lga}` : ''}
                    {selectedOrg.state ? `, ${selectedOrg.state}` : ''}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#666' }}>Referee Name</Typography>
                  <Typography variant="body1" sx={{ mb: 2 }}>{selectedOrg.referee_name || 'N/A'}</Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#666' }}>Referee Status</Typography>
                  <Box sx={{ mt: 0.5 }}>{getStatusChip(selectedOrg)}</Box>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#666' }}>Registration Type</Typography>
                  <Typography variant="body1" sx={{ mb: 2 }}>
                    {selectedOrg.registration_type === 'admin' ? 'Admin Created' : 'Self Registration'}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#666' }}>Request Date</Typography>
                  <Typography variant="body1" sx={{ mb: 2 }}>{formatDate(selectedOrg.created_at)}</Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#666' }}>Business Nature</Typography>
                  <Typography variant="body1" sx={{ mb: 2 }}>
                    {(() => {
                      let nature = selectedOrg.business_nature || [];
                      if (typeof nature === 'string') {
                        try { nature = JSON.parse(nature); } catch (e) { nature = []; }
                      }
                      return Array.isArray(nature) ? nature.join(', ') : 'N/A';
                    })()}
                  </Typography>
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions sx={{ p: 3, borderTop: '1px solid #e0e0e0' }}>
              <Button onClick={handleCloseDetails} sx={{ textTransform: 'none' }}>
                Close
              </Button>
              {isActionable(selectedOrg) && (
                <>
                  <Button
                    variant="contained"
                    startIcon={<ThumbUpIcon />}
                    onClick={() => {
                      handleCloseDetails();
                      handleAcceptInvitation(selectedOrg);
                    }}
                    sx={{
                      backgroundColor: '#28a745',
                      '&:hover': { backgroundColor: '#218838' },
                      textTransform: 'none'
                    }}
                  >
                    Accept & Confirm
                  </Button>
                  <Button
                    variant="contained"
                    startIcon={<ThumbDownIcon />}
                    onClick={() => {
                      handleCloseDetails();
                      handleRejectInvitation(selectedOrg);
                    }}
                    sx={{
                      backgroundColor: '#dc3545',
                      '&:hover': { backgroundColor: '#c82333' },
                      textTransform: 'none'
                    }}
                  >
                    Reject
                  </Button>
                </>
              )}
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Custom Confirmation Modal */}
      {confirmModal.open && (
        <Box
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
          }}
          onClick={() => setConfirmModal({ ...confirmModal, open: false })}
        >
          <Paper
            sx={{
              maxWidth: 420,
              width: '90%',
              borderRadius: '16px',
              overflow: 'hidden',
              animation: 'slideUp 0.3s ease',
              '@keyframes slideUp': {
                from: { opacity: 0, transform: 'translateY(20px) scale(0.95)' },
                to: { opacity: 1, transform: 'translateY(0) scale(1)' }
              }
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                p: 2,
                borderBottom: '1px solid #f0f0f0',
                backgroundColor: confirmModal.type === 'error' ? '#ffebee' : 
                                  confirmModal.type === 'warning' ? '#fff3e0' : '#e3f2fd'
              }}
            >
              <Typography variant="h6" sx={{ flex: 1, fontWeight: 600 }}>
                {confirmModal.title}
              </Typography>
              <IconButton 
                size="small" 
                onClick={() => setConfirmModal({ ...confirmModal, open: false })}
              >
                <CancelIcon />
              </IconButton>
            </Box>
            <Box sx={{ p: 3 }}>
              <Typography variant="body1" sx={{ color: '#444' }}>
                {confirmModal.message}
              </Typography>
            </Box>
            <Box sx={{ p: 2, display: 'flex', justifyContent: 'flex-end', gap: 1, borderTop: '1px solid #f0f0f0' }}>
              <Button 
                variant="outlined" 
                onClick={() => setConfirmModal({ ...confirmModal, open: false })}
                sx={{ textTransform: 'none' }}
              >
                {confirmModal.cancelText}
              </Button>
              <Button 
                variant="contained"
                onClick={confirmModal.onConfirm}
                sx={{
                  backgroundColor: confirmModal.type === 'error' ? '#dc3545' : 
                                   confirmModal.type === 'warning' ? '#ff9800' : '#28a745',
                  '&:hover': {
                    backgroundColor: confirmModal.type === 'error' ? '#c82333' : 
                                     confirmModal.type === 'warning' ? '#e65100' : '#218838'
                  },
                  textTransform: 'none'
                }}
              >
                {confirmModal.confirmText}
              </Button>
            </Box>
          </Paper>
        </Box>
      )}
    </>
  );
};

export default RefereesManagement;