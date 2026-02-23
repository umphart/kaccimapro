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
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tooltip
} from '@mui/material';
import {
  Search as SearchIcon,
  Visibility as VisibilityIcon,
  CheckCircle as CheckCircleIcon,
  Pending as PendingIcon,
  Cancel as CancelIcon,
  Refresh as RefreshIcon,
  Business as BusinessIcon,
  Verified as VerifiedIcon,
  Warning as WarningIcon,
  Description as DescriptionIcon
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

const documentFields = [
  { key: 'cover_letter_path', name: 'Cover Letter', required: true },
  { key: 'memorandum_path', name: 'Memorandum', required: true },
  { key: 'registration_cert_path', name: 'Registration Certificate', required: true },
  { key: 'incorporation_cert_path', name: 'Incorporation Certificate', required: true },
  { key: 'premises_cert_path', name: 'Premises Certificate', required: true },
  { key: 'company_logo_path', name: 'Company Logo', required: true },
  { key: 'form_c07_path', name: 'Form C07', required: true },
  { key: 'id_document_path', name: 'ID Document', required: true }
];

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
  const [approveDialog, setApproveDialog] = useState({ open: false, org: null, documentStatus: {} });
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

      // Fetch document rejection notifications for each organization
      const orgsWithDocStatus = await Promise.all(
        (data || []).map(async (org) => {
          const docStatus = await checkDocumentStatus(org.id);
          return { ...org, documentStatus: docStatus };
        })
      );

      setOrganizations(orgsWithDocStatus || []);
      setTotalCount(count || 0);
    } catch (error) {
      console.error('Error fetching organizations:', error);
      showAlert('error', 'Failed to load organizations');
    } finally {
      setLoading(false);
    }
  };

  const checkDocumentStatus = async (organizationId) => {
    try {
      // Fetch the organization's documents
      const { data: org, error } = await supabase
        .from('organizations')
        .select(documentFields.map(f => f.key).join(','))
        .eq('id', organizationId)
        .single();

      if (error) throw error;

      // Fetch rejection notifications for this organization
      const { data: notifications } = await supabase
        .from('organization_notifications')
        .select('*')
        .eq('organization_id', organizationId)
        .in('type', ['document_rejected', 'document_approved'])
        .order('created_at', { ascending: false });

      const documentStatus = {};

      documentFields.forEach(field => {
        const hasDocument = !!org[field.key];
        
        // Check if document was recently rejected
        const rejectedNotification = notifications?.find(n => 
          n.type === 'document_rejected' && n.title?.includes(field.name)
        );

        // Check if document was recently approved
        const approvedNotification = notifications?.find(n => 
          n.type === 'document_approved' && n.title?.includes(field.name)
        );

        if (!hasDocument) {
          documentStatus[field.key] = 'missing';
        } else if (rejectedNotification && (!approvedNotification || new Date(rejectedNotification.created_at) > new Date(approvedNotification.created_at))) {
          documentStatus[field.key] = 'rejected';
        } else if (approvedNotification) {
          documentStatus[field.key] = 'approved';
        } else {
          documentStatus[field.key] = 'pending';
        }
      });

      return documentStatus;
    } catch (error) {
      console.error('Error checking document status:', error);
      return {};
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

  const checkAllDocumentsApproved = (documentStatus) => {
    if (!documentStatus) return false;
    
    // Check if all required documents are approved
    const allApproved = documentFields.every(field => 
      documentStatus[field.key] === 'approved'
    );
    
    return allApproved;
  };

  const handleApproveClick = (org) => {
    const allApproved = checkAllDocumentsApproved(org.documentStatus);
    
    if (!allApproved) {
      // Show warning dialog with document status
      setApproveDialog({ open: true, org, documentStatus: org.documentStatus });
    } else {
      // Proceed with approval
      confirmApproveOrganization(org);
    }
  };

  const confirmApproveOrganization = async (org) => {
    try {
      const { error } = await supabase
        .from('organizations')
        .update({ status: 'approved', updated_at: new Date().toISOString() })
        .eq('id', org.id);

      if (error) throw error;

      // Create notification for the organization
      await supabase
        .from('organization_notifications')
        .insert([{
          organization_id: org.id,
          type: 'success',
          title: 'Organization Approved',
          message: 'Your organization has been fully approved! You can now access all features.',
          category: 'registration',
          action_url: '/dashboard',
          read: false
        }]);

      showAlert('success', `${org.company_name} has been approved successfully`);
      fetchOrganizations(); // Refresh the list
      fetchStats(); // Refresh stats
    } catch (error) {
      console.error('Error approving organization:', error);
      showAlert('error', 'Failed to approve organization');
    }
  };

  const handleRejectOrganization = async (org) => {
    try {
      const { error } = await supabase
        .from('organizations')
        .update({ status: 'rejected', updated_at: new Date().toISOString() })
        .eq('id', org.id);

      if (error) throw error;

      // Create notification for the organization
      await supabase
        .from('organization_notifications')
        .insert([{
          organization_id: org.id,
          type: 'error',
          title: 'Organization Rejected',
          message: 'Your organization registration has been rejected. Please contact support for more information.',
          category: 'registration',
          action_url: '/contact',
          read: false
        }]);

      showAlert('success', `${org.company_name} has been rejected`);
      fetchOrganizations(); // Refresh the list
      fetchStats(); // Refresh stats
      setApproveDialog({ open: false, org: null, documentStatus: {} });
    } catch (error) {
      console.error('Error rejecting organization:', error);
      showAlert('error', 'Failed to reject organization');
    }
  };

  const getDocumentStatusSummary = (documentStatus) => {
    if (!documentStatus) return { approved: 0, pending: 0, rejected: 0, missing: 0 };
    
    const counts = { approved: 0, pending: 0, rejected: 0, missing: 0 };
    
    Object.values(documentStatus).forEach(status => {
      counts[status]++;
    });
    
    return counts;
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

      {/* Approval Warning Dialog */}
      <Dialog 
        open={approveDialog.open} 
        onClose={() => setApproveDialog({ open: false, org: null, documentStatus: {} })}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ fontFamily: '"Poppins", sans-serif', fontWeight: 600 }}>
          Cannot Approve Organization
        </DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 3 }}>
            All documents must be approved before approving the organization.
          </Alert>
          
          <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600 }}>
            Document Status for {approveDialog.org?.company_name}:
          </Typography>
          
          <Box sx={{ mt: 2 }}>
            {documentFields.map(field => {
              const status = approveDialog.documentStatus?.[field.key] || 'missing';
              return (
                <Box 
                  key={field.key}
                  sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between',
                    mb: 1,
                    p: 1,
                    bgcolor: status === 'approved' ? '#e8f5e9' : 
                            status === 'rejected' ? '#ffebee' : 
                            status === 'missing' ? '#f5f5f5' : '#fff3e0',
                    borderRadius: 1
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <DescriptionIcon fontSize="small" />
                    <Typography variant="body2">{field.name}</Typography>
                  </Box>
                  <Chip
                    size="small"
                    label={status}
                    icon={
                      status === 'approved' ? <CheckCircleIcon /> :
                      status === 'rejected' ? <CancelIcon /> :
                      status === 'missing' ? <WarningIcon /> :
                      <PendingIcon />
                    }
                    color={
                      status === 'approved' ? 'success' :
                      status === 'rejected' ? 'error' :
                      status === 'missing' ? 'default' :
                      'warning'
                    }
                    sx={{ textTransform: 'capitalize' }}
                  />
                </Box>
              );
            })}
          </Box>

          {approveDialog.org?.status === 'pending' && (
            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
              <Button 
                variant="outlined" 
                color="error"
                onClick={() => handleRejectOrganization(approveDialog.org)}
              >
                Reject Organization
              </Button>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setApproveDialog({ open: false, org: null, documentStatus: {} })}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

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
    <Table size="small">
      <TableHead sx={{ backgroundColor: '#f8f9fa' }}>
        <TableRow>
          <TableCell sx={{ fontFamily: '"Inter", sans-serif', fontWeight: 600, py: 1, px: 1, width: '15%' }}>Company</TableCell>
          <TableCell sx={{ fontFamily: '"Inter", sans-serif', fontWeight: 600, py: 1, px: 1, width: '18%' }}>Email</TableCell>
          <TableCell sx={{ fontFamily: '"Inter", sans-serif', fontWeight: 600, py: 1, px: 1, width: '10%' }}>CAC</TableCell>
          <TableCell sx={{ fontFamily: '"Inter", sans-serif', fontWeight: 600, py: 1, px: 1, width: '12%' }}>Reg Date</TableCell>
          <TableCell sx={{ fontFamily: '"Inter", sans-serif', fontWeight: 600, py: 1, px: 1, width: '20%' }}>Documents</TableCell>
          <TableCell sx={{ fontFamily: '"Inter", sans-serif', fontWeight: 600, py: 1, px: 1, width: '10%' }}>Status</TableCell>
          <TableCell sx={{ fontFamily: '"Inter", sans-serif', fontWeight: 600, py: 1, px: 1, width: '15%' }}>Actions</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {organizations.map((org) => {
          const docSummary = getDocumentStatusSummary(org.documentStatus);
          const allApproved = checkAllDocumentsApproved(org.documentStatus);
          
          return (
            <TableRow key={org.id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
              <TableCell sx={{ fontFamily: '"Inter", sans-serif', py: 0.75, px: 1 }}>
                <Tooltip title={org.company_name} arrow>
                  <Typography variant="body2" noWrap sx={{ maxWidth: 120, fontSize: '0.8rem' }}>
                    {org.company_name}
                  </Typography>
                </Tooltip>
              </TableCell>
              <TableCell sx={{ fontFamily: '"Inter", sans-serif', py: 0.75, px: 1 }}>
                <Tooltip title={org.email} arrow>
                  <Typography variant="body2" noWrap sx={{ maxWidth: 140, fontSize: '0.8rem' }}>
                    {org.email}
                  </Typography>
                </Tooltip>
              </TableCell>
              <TableCell sx={{ fontFamily: '"Inter", sans-serif', py: 0.75, px: 1 }}>
                <Typography variant="body2" noWrap sx={{ fontSize: '0.8rem' }}>
                  {org.cac_number ? org.cac_number.substring(0, 8) + '...' : 'N/A'}
                </Typography>
              </TableCell>
              <TableCell sx={{ fontFamily: '"Inter", sans-serif', py: 0.75, px: 1 }}>
                <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>
                  {new Date(org.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: '2-digit' })}
                </Typography>
              </TableCell>
              <TableCell sx={{ py: 0.75, px: 1 }}>
                <Tooltip title={
                  <Box sx={{ p: 0.5 }}>
                    <Typography variant="caption" display="block" sx={{ fontSize: '10px', whiteSpace: 'nowrap' }}>
                      ✅ Approved: {docSummary.approved}
                    </Typography>
                    <Typography variant="caption" display="block" sx={{ fontSize: '10px', whiteSpace: 'nowrap' }}>
                      ⏳ Pending: {docSummary.pending}
                    </Typography>
                    <Typography variant="caption" display="block" sx={{ fontSize: '10px', whiteSpace: 'nowrap' }}>
                      ❌ Rejected: {docSummary.rejected}
                    </Typography>
                    <Typography variant="caption" display="block" sx={{ fontSize: '10px', whiteSpace: 'nowrap' }}>
                      📄 Missing: {docSummary.missing}
                    </Typography>
                  </Box>
                } arrow>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.3, flexWrap: 'wrap' }}>
                    {docSummary.rejected > 0 && (
                      <Chip
                        size="small"
                        icon={<CancelIcon sx={{ fontSize: '10px !important' }} />}
                        label={docSummary.rejected}
                        color="error"
                        sx={{ height: 18, fontSize: '9px', '& .MuiChip-icon': { ml: 0.3, mr: -0.3 } }}
                      />
                    )}
                    {docSummary.missing > 0 && (
                      <Chip
                        size="small"
                        icon={<WarningIcon sx={{ fontSize: '10px !important' }} />}
                        label={docSummary.missing}
                        color="default"
                        sx={{ height: 18, fontSize: '9px', '& .MuiChip-icon': { ml: 0.3, mr: -0.3 } }}
                      />
                    )}
                    {docSummary.pending > 0 && (
                      <Chip
                        size="small"
                        icon={<PendingIcon sx={{ fontSize: '10px !important' }} />}
                        label={docSummary.pending}
                        color="warning"
                        sx={{ height: 18, fontSize: '9px', '& .MuiChip-icon': { ml: 0.3, mr: -0.3 } }}
                      />
                    )}
                    {allApproved && (
                      <Chip
                        size="small"
                        icon={<VerifiedIcon sx={{ fontSize: '10px !important' }} />}
                        label="✓"
                        color="success"
                        sx={{ height: 18, fontSize: '9px', '& .MuiChip-icon': { ml: 0.3, mr: -0.3 } }}
                      />
                    )}
                    {!allApproved && docSummary.approved > 0 && (
                      <Chip
                        size="small"
                        icon={<CheckCircleIcon sx={{ fontSize: '10px !important' }} />}
                        label={docSummary.approved}
                        color="success"
                        sx={{ height: 18, fontSize: '9px', '& .MuiChip-icon': { ml: 0.3, mr: -0.3 } }}
                      />
                    )}
                  </Box>
                </Tooltip>
              </TableCell>
              <TableCell sx={{ py: 0.75, px: 1 }}>
                {org.status === 'pending' && (
                  <Chip
                    icon={<PendingIcon sx={{ fontSize: '12px !important' }} />}
                    label="Pending"
                    size="small"
                    color="warning"
                    sx={{ height: 22, fontSize: '10px' }}
                  />
                )}
                {org.status === 'approved' && (
                  <Chip
                    icon={<CheckCircleIcon sx={{ fontSize: '12px !important' }} />}
                    label="Approved"
                    size="small"
                    color="success"
                    sx={{ height: 22, fontSize: '10px' }}
                  />
                )}
                {org.status === 'rejected' && (
                  <Chip
                    icon={<CancelIcon sx={{ fontSize: '12px !important' }} />}
                    label="Rejected"
                    size="small"
                    color="error"
                    sx={{ height: 22, fontSize: '10px' }}
                  />
                )}
              </TableCell>
              <TableCell sx={{ py: 0.75, px: 1 }}>
                <Box sx={{ display: 'flex', gap: 0.3, justifyContent: 'flex-start' }}>
                  <Tooltip title="View Details" arrow>
                    <IconButton
                      size="small"
                      onClick={() => handleViewOrganization(org.id)}
                      sx={{ color: '#15e420', p: 0.3 }}
                    >
                      <VisibilityIcon sx={{ fontSize: 16 }} />
                    </IconButton>
                  </Tooltip>
                  {org.status === 'pending' && (
                    <>
                      <Tooltip title={allApproved ? "Approve Organization" : "Check Documents First"} arrow>
                        <span>
                          <IconButton
                            size="small"
                            onClick={() => handleApproveClick(org)}
                            sx={{ 
                              color: allApproved ? '#28a745' : '#ffc107', 
                              p: 0.3,
                              opacity: allApproved ? 1 : 0.7
                            }}
                          >
                            <CheckCircleIcon sx={{ fontSize: 16 }} />
                          </IconButton>
                        </span>
                      </Tooltip>
                      <Tooltip title="Reject Organization" arrow>
                        <IconButton
                          size="small"
                          onClick={() => handleRejectOrganization(org)}
                          sx={{ color: '#dc3545', p: 0.3 }}
                        >
                          <CancelIcon sx={{ fontSize: 16 }} />
                        </IconButton>
                      </Tooltip>
                    </>
                  )}
                </Box>
              </TableCell>
            </TableRow>
          );
        })}
        {organizations.length === 0 && (
          <TableRow>
            <TableCell colSpan={7} align="center" sx={{ py: 3 }}>
              <Typography sx={{ color: '#666', fontSize: '0.9rem' }}>
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
    sx={{ 
      '.MuiTablePagination-toolbar': { minHeight: 40, px: 1 },
      '.MuiTablePagination-selectLabel, .MuiTablePagination-input': { my: 0, fontSize: '0.8rem' },
      '.MuiTablePagination-displayedRows': { fontSize: '0.8rem', m: 0 }
    }}
  />
</Paper>
          </Box>
        </Box>
      </Container>
    </>
  );
};

export default AdminOrganizations;