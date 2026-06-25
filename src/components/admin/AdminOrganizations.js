import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
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
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stepper,
  Step,
  StepLabel,
  Divider
} from '@mui/material';
import {
  Search as SearchIcon,
  Visibility as VisibilityIcon,
  CheckCircle as CheckCircleIcon,
  Pending as PendingIcon,
  Cancel as CancelIcon,
  Refresh as RefreshIcon,
  Business as BusinessIcon,
  People as PeopleIcon,
  Warning as WarningIcon,
  Approval as ApprovalIcon,
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import AdminSidebar from './AdminSidebar';
import OrganizationDetailsDialog from './OrganizationDetailsDialog';
import { 
  getDocumentSummary,
  requiredDocumentKeys,
  getDocumentStatus,
  getDocumentStatusLabel
} from './organizationConstants';

const StyledCard = styled(Card)(({ theme }) => ({
  height: '100%',
  borderRadius: '12px',
  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
  border: '1px solid #f0f0f0',
  transition: 'all 0.2s ease',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: '0 8px 16px rgba(21, 228, 32, 0.1)'
  }
}));

const StatusChip = styled(Chip)(({ status }) => ({
  borderRadius: '20px',
  height: '24px',
  fontSize: '0.7rem',
  fontWeight: 500,
  backgroundColor: 
    status === 'approved' || status === 'active' ? '#e8f5e9' :
    status === 'pending_review' ? '#fff3e0' :
    status === 'rejected' ? '#ffebee' :
    '#fff3e0',
  color: 
    status === 'approved' || status === 'active' ? '#2e7d32' :
    status === 'pending_review' ? '#e65100' :
    status === 'rejected' ? '#c62828' :
    '#e65100',
  '& .MuiChip-icon': {
    fontSize: '14px'
  }
}));

const AdminOrganizations = () => {
  const navigate = useNavigate();
  const { filter } = useParams();
  const [loading, setLoading] = useState(true);
  const [organizations, setOrganizations] = useState([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [alert, setAlert] = useState({ open: false, type: 'success', message: '' });
  const [selectedOrg, setSelectedOrg] = useState(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [stats, setStats] = useState({ total: 0, pending: 0, pendingReview: 0, approved: 0, rejected: 0 });
  
  // Approval Dialog
  const [approvalDialogOpen, setApprovalDialogOpen] = useState(false);
  const [approvalLoading, setApprovalLoading] = useState(false);
  const [approvalNote, setApprovalNote] = useState('');
  const [approvalStep, setApprovalStep] = useState(0);

  useEffect(() => {
    if (filter === 'pending') setStatusFilter('pending');
    else if (filter === 'pending_review') setStatusFilter('pending_review');
    else if (filter === 'approved') setStatusFilter('approved');
    else if (filter === 'rejected') setStatusFilter('rejected');
    else setStatusFilter('all');
    setPage(0);
  }, [filter]);

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
        .from('organizations_registry')
        .select('*', { count: 'exact' });

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      if (searchTerm) {
        query = query.or(
          `company_name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,cac_number.ilike.%${searchTerm}%,registration_number.ilike.%${searchTerm}%`
        );
      }

      const from = page * rowsPerPage;
      const to = from + rowsPerPage - 1;

      const { data, error, count } = await query
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) throw error;

      const orgsWithDocs = await Promise.all(
        (data || []).map(async (org) => {
          const { data: docData, error: docError } = await supabase
            .from('organization_documents')
            .select('*')
            .eq('organization_id', org.id);

          if (docError) {
            return { ...org, documents: [] };
          }

          return { ...org, documents: docData || [] };
        })
      );

      setOrganizations(orgsWithDocs);
      setTotalCount(count || 0);
    } catch (error) {
      console.error('Error fetching organizations:', error);
      showAlert('error', 'Failed to load organizations: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const { count: total } = await supabase
        .from('organizations_registry')
        .select('*', { count: 'exact', head: true });

      const { count: pending } = await supabase
        .from('organizations_registry')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');

      const { count: pendingReview } = await supabase
        .from('organizations_registry')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending_review');

      const { count: approved } = await supabase
        .from('organizations_registry')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'approved');

      const { count: rejected } = await supabase
        .from('organizations_registry')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'rejected');

      setStats({
        total: total || 0,
        pending: pending || 0,
        pendingReview: pendingReview || 0,
        approved: approved || 0,
        rejected: rejected || 0
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
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

  const handleStatusFilter = (event) => {
    const newFilter = event.target.value;
    setStatusFilter(newFilter);
    setPage(0);
    navigate(newFilter === 'all' ? '/admin/organizations' : `/admin/organizations/filter/${newFilter}`);
  };

  const handleViewDetails = (org) => {
    setSelectedOrg(org);
    setDetailsDialogOpen(true);
  };

  const handleCloseDetails = () => {
    setDetailsDialogOpen(false);
    setSelectedOrg(null);
  };

  // ============================================================
  // APPROVAL HANDLERS
  // ============================================================
  
  const handleOpenApproval = (org) => {
    setSelectedOrg(org);
    setApprovalStep(0);
    setApprovalNote('');
    setApprovalDialogOpen(true);
  };

  const handleCloseApproval = () => {
    setApprovalDialogOpen(false);
    setSelectedOrg(null);
    setApprovalNote('');
    setApprovalStep(0);
  };

  const getApprovalSteps = () => {
    if (!selectedOrg) return [];
    
    const hasDocuments = selectedOrg.documents && selectedOrg.documents.length > 0;
    const hasPayment = selectedOrg.payment_status === 'paid' || selectedOrg.payment_status === 'completed';
    
    return [
      {
        label: 'Review Organization Details',
        description: 'Verify company information and contact details',
        completed: true
      },
      {
        label: 'Check Documents',
        description: hasDocuments ? `${selectedOrg.documents.length} document(s) uploaded` : 'No documents uploaded yet',
        completed: hasDocuments
      },
      {
        label: 'Verify Payment',
        description: hasPayment ? 'Payment verified' : 'Payment pending verification',
        completed: hasPayment
      }
    ];
  };

  const handleApproveOrganization = async () => {
    if (!selectedOrg) return;

    setApprovalLoading(true);
    try {
      const hasDocuments = selectedOrg.documents && selectedOrg.documents.length > 0;
      
      let newStatus = 'approved';
      if (!hasDocuments) {
        newStatus = 'pending_review';
        showAlert('warning', `Organization approved but no documents uploaded. Status set to "Pending Review".`);
      } else {
        showAlert('success', 'Organization approved successfully!');
      }

      const { error: updateError } = await supabase
        .from('organizations_registry')
        .update({ 
          status: newStatus,
          approved_date: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedOrg.id);

      if (updateError) throw updateError;

      const { data: { user } } = await supabase.auth.getUser();
      const { error: logError } = await supabase
        .from('registration_audit_log')
        .insert([{
          organization_id: selectedOrg.id,
          action: 'organization_approved',
          new_data: { 
            status: newStatus,
            approved_by: user?.id,
            note: approvalNote || 'No additional notes'
          },
          created_at: new Date().toISOString()
        }]);

      if (logError) {
        console.warn('Failed to log approval:', logError);
      }

      handleCloseApproval();
      fetchOrganizations();
      fetchStats();

    } catch (error) {
      console.error('Error approving organization:', error);
      showAlert('error', 'Failed to approve organization: ' + error.message);
    } finally {
      setApprovalLoading(false);
    }
  };

  const handleRejectOrganization = async (orgId) => {
    const reason = window.prompt('Please provide a reason for rejection:');
    if (reason === null) return;

    try {
      const { error } = await supabase
        .from('organizations_registry')
        .update({ 
          status: 'rejected',
          rejection_reason: reason || 'No reason provided',
          updated_at: new Date().toISOString()
        })
        .eq('id', orgId);

      if (error) throw error;

      showAlert('success', 'Organization rejected successfully');
      fetchOrganizations();
      fetchStats();
    } catch (error) {
      console.error('Error rejecting organization:', error);
      showAlert('error', 'Failed to reject organization');
    }
  };

  const getStatusChip = (status) => {
    const statusMap = {
      pending: { label: 'Pending', icon: <PendingIcon /> },
      pending_review: { label: 'Pending Review', icon: <ApprovalIcon /> },
      approved: { label: 'Approved', icon: <CheckCircleIcon /> },
      rejected: { label: 'Rejected', icon: <CancelIcon /> },
      active: { label: 'Active', icon: <CheckCircleIcon /> }
    };
    const config = statusMap[status?.toLowerCase()] || statusMap.pending;
    
    return <StatusChip icon={config.icon} label={config.label} status={status?.toLowerCase()} />;
  };

  const getDocumentChips = (documents) => {
    const summary = getDocumentSummary(documents || []);
    const chips = [];
    
    if (summary.approved > 0) {
      chips.push(
        <Chip key="approved" size="small" label={`${summary.approved} approved`} color="success" sx={{ height: '20px', fontSize: '0.65rem' }} />
      );
    }
    
    if (summary.pending > 0) {
      chips.push(
        <Chip key="pending" size="small" label={`${summary.pending} pending`} color="warning" sx={{ height: '20px', fontSize: '0.65rem' }} />
      );
    }
    
    if (summary.missing > 0) {
      chips.push(
        <Chip key="missing" size="small" label={`${summary.missing} missing`} color="default" sx={{ height: '20px', fontSize: '0.65rem' }} />
      );
    }
    
    if (summary.approved === requiredDocumentKeys.length && summary.missing === 0 && summary.pending === 0) {
      return <Chip size="small" label="All documents approved" color="success" sx={{ height: '20px', fontSize: '0.65rem' }} />;
    }
    
    if (summary.missing === 0 && summary.pending > 0 && summary.approved === 0) {
      return <Chip size="small" label="All documents uploaded" color="info" sx={{ height: '20px', fontSize: '0.65rem' }} />;
    }
    
    if (chips.length === 0) {
      return <Chip size="small" label="No documents" color="default" sx={{ height: '20px', fontSize: '0.65rem' }} />;
    }
    
    return chips;
  };

  const getRequiredDocsStatus = (documents) => {
    if (!documents || documents.length === 0) {
      return { allUploaded: false, missing: requiredDocumentKeys };
    }

    const uploadedKeys = documents.map(d => d.document_type);
    const missing = requiredDocumentKeys.filter(key => !uploadedKeys.includes(key));
    const allUploaded = missing.length === 0;

    return { allUploaded, missing };
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

      <Box sx={{ display: 'flex', bgcolor: '#f8f9fa', minHeight: '100vh' }}>
        <AdminSidebar />

        <Box sx={{ flex: 1, p: { xs: 2, md: 3 } }}>
          <Container maxWidth="xl" sx={{ py: { xs: 1, md: 2 } }}>
            {/* Stats Cards */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={6} sm={2.4}>
                <StyledCard>
                  <CardContent sx={{ p: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Avatar sx={{ bgcolor: '#15e420', width: 40, height: 40 }}>
                        <BusinessIcon />
                      </Avatar>
                      <Box>
                        <Typography variant="body2" sx={{ color: '#666', fontWeight: 500 }}>Total</Typography>
                        <Typography variant="h6" sx={{ fontWeight: 700 }}>{stats.total}</Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </StyledCard>
              </Grid>
              <Grid item xs={6} sm={2.4}>
                <StyledCard>
                  <CardContent sx={{ p: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Avatar sx={{ bgcolor: '#ffc107', width: 40, height: 40 }}>
                        <PendingIcon />
                      </Avatar>
                      <Box>
                        <Typography variant="body2" sx={{ color: '#666', fontWeight: 500 }}>Pending</Typography>
                        <Typography variant="h6" sx={{ fontWeight: 700 }}>{stats.pending}</Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </StyledCard>
              </Grid>
              <Grid item xs={6} sm={2.4}>
                <StyledCard>
                  <CardContent sx={{ p: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Avatar sx={{ bgcolor: '#ff9800', width: 40, height: 40 }}>
                        <ApprovalIcon />
                      </Avatar>
                      <Box>
                        <Typography variant="body2" sx={{ color: '#666', fontWeight: 500 }}>Pending Review</Typography>
                        <Typography variant="h6" sx={{ fontWeight: 700 }}>{stats.pendingReview}</Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </StyledCard>
              </Grid>
              <Grid item xs={6} sm={2.4}>
                <StyledCard>
                  <CardContent sx={{ p: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Avatar sx={{ bgcolor: '#28a745', width: 40, height: 40 }}>
                        <CheckCircleIcon />
                      </Avatar>
                      <Box>
                        <Typography variant="body2" sx={{ color: '#666', fontWeight: 500 }}>Approved</Typography>
                        <Typography variant="h6" sx={{ fontWeight: 700 }}>{stats.approved}</Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </StyledCard>
              </Grid>
              <Grid item xs={6} sm={2.4}>
                <StyledCard>
                  <CardContent sx={{ p: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Avatar sx={{ bgcolor: '#dc3545', width: 40, height: 40 }}>
                        <CancelIcon />
                      </Avatar>
                      <Box>
                        <Typography variant="body2" sx={{ color: '#666', fontWeight: 500 }}>Rejected</Typography>
                        <Typography variant="h6" sx={{ fontWeight: 700 }}>{stats.rejected}</Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </StyledCard>
              </Grid>
            </Grid>

            {/* Search and Filter */}
            <Paper sx={{ p: 2, mb: 3, borderRadius: '12px' }}>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
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
                <FormControl size="small" sx={{ minWidth: 150 }}>
                  <InputLabel>Status</InputLabel>
                  <Select value={statusFilter} onChange={handleStatusFilter} label="Status">
                    <MenuItem value="all">All</MenuItem>
                    <MenuItem value="pending">Pending</MenuItem>
                    <MenuItem value="pending_review">Pending Review</MenuItem>
                    <MenuItem value="approved">Approved</MenuItem>
                    <MenuItem value="rejected">Rejected</MenuItem>
                  </Select>
                </FormControl>
                <Button
                  variant="outlined"
                  startIcon={<RefreshIcon />}
                  onClick={fetchOrganizations}
                  size="small"
                  sx={{ textTransform: 'none' }}
                >
                  Refresh
                </Button>
              </Box>
            </Paper>

            {/* Organizations Table */}
            <Paper sx={{ borderRadius: '12px', overflow: 'hidden' }}>
              <TableContainer>
                <Table size="small">
                  <TableHead sx={{ bgcolor: '#f8f9fa' }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600, fontSize: '0.8rem' }}>#</TableCell>
                      <TableCell sx={{ fontWeight: 600, fontSize: '0.8rem' }}>Company</TableCell>
                      <TableCell sx={{ fontWeight: 600, fontSize: '0.8rem' }}>Reg. Number</TableCell>
                      <TableCell sx={{ fontWeight: 600, fontSize: '0.8rem' }}>CAC</TableCell>
                      <TableCell sx={{ fontWeight: 600, fontSize: '0.8rem' }}>Phone</TableCell>
                      <TableCell sx={{ fontWeight: 600, fontSize: '0.8rem' }}>Status</TableCell>
                      <TableCell sx={{ fontWeight: 600, fontSize: '0.8rem' }}>Documents</TableCell>
                      <TableCell sx={{ fontWeight: 600, fontSize: '0.8rem' }}>Actions</TableCell>
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
                        
                        const requiredDocsStatus = getRequiredDocsStatus(org.documents);
                        const isFullyUploaded = requiredDocsStatus.allUploaded;
                        const isPending = org.status === 'pending' || org.status === 'pending_review';
                        
                        return (
                          <TableRow key={org.id} hover>
                            <TableCell sx={{ fontSize: '0.8rem', color: '#999' }}>
                              {page * rowsPerPage + index + 1}
                            </TableCell>
                            <TableCell sx={{ fontSize: '0.85rem', fontWeight: 500 }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                {org.company_name}
                                {!isFullyUploaded && isPending && (
                                  <Tooltip title="Missing required documents">
                                    <WarningIcon sx={{ color: '#ff9800', fontSize: '16px' }} />
                                  </Tooltip>
                                )}
                                {org.registration_type === 'self' && (
                                  <Chip 
                                    label="Self" 
                                    size="small" 
                                    sx={{ 
                                      ml: 1, 
                                      height: '18px', 
                                      fontSize: '0.55rem',
                                      backgroundColor: '#e3f2fd',
                                      color: '#1565c0'
                                    }} 
                                  />
                                )}
                                {businessNature.length > 0 && (
                                  <Chip 
                                    label={businessNature[0]} 
                                    size="small" 
                                    sx={{ 
                                      ml: 1, 
                                      height: '18px', 
                                      fontSize: '0.6rem',
                                      backgroundColor: '#e3f2fd',
                                      color: '#1565c0'
                                    }} 
                                  />
                                )}
                                {businessNature.length > 1 && (
                                  <Chip 
                                    label={`+${businessNature.length - 1}`} 
                                    size="small" 
                                    sx={{ 
                                      ml: 0.5, 
                                      height: '18px', 
                                      fontSize: '0.6rem',
                                      backgroundColor: '#f5f5f5'
                                    }} 
                                  />
                                )}
                              </Box>
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
                            <TableCell sx={{ fontSize: '0.8rem' }}>{org.phone_number1 || 'N/A'}</TableCell>
                            <TableCell>{getStatusChip(org.status)}</TableCell>
                            <TableCell>
                              <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                                {getDocumentChips(org.documents)}
                              </Box>
                            </TableCell>
                            <TableCell>
                              <Box sx={{ display: 'flex', gap: 0.5 }}>
                                <Tooltip title="View Full Details">
                                  <IconButton
                                    size="small"
                                    onClick={() => handleViewDetails(org)}
                                    sx={{ color: '#15e420' }}
                                  >
                                    <VisibilityIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                                {(org.status === 'pending' || org.status === 'pending_review') && (
                                  <>
                                    <Tooltip title="Approve Organization">
                                      <IconButton
                                        size="small"
                                        onClick={() => handleOpenApproval(org)}
                                        sx={{ color: '#28a745' }}
                                      >
                                        <CheckCircleIcon fontSize="small" />
                                      </IconButton>
                                    </Tooltip>
                                    <Tooltip title="Reject Organization">
                                      <IconButton
                                        size="small"
                                        onClick={() => handleRejectOrganization(org.id)}
                                        sx={{ color: '#dc3545' }}
                                      >
                                        <CancelIcon fontSize="small" />
                                      </IconButton>
                                    </Tooltip>
                                  </>
                                )}
                              </Box>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    ) : (
                      <TableRow>
                        <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                          <Typography sx={{ color: '#666' }}>No organizations found</Typography>
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
        </Box>
      </Box>

      {/* Organization Details Dialog */}
      <OrganizationDetailsDialog
        open={detailsDialogOpen}
        onClose={handleCloseDetails}
        organization={selectedOrg}
        navigate={navigate}
      />

      {/* Approval Dialog */}
      <Dialog
        open={approvalDialogOpen}
        onClose={handleCloseApproval}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: '16px' } }}
      >
        <DialogTitle sx={{ bgcolor: '#f8f9fa', borderBottom: '1px solid #e0e0e0' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6" sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
              <ApprovalIcon sx={{ color: '#28a745' }} /> Approve Organization
            </Typography>
            <IconButton onClick={handleCloseApproval} size="small">
              <CancelIcon />
            </IconButton>
          </Box>
        </DialogTitle>

        <DialogContent sx={{ pt: 3 }}>
          {selectedOrg && (
            <>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                {selectedOrg.company_name}
              </Typography>
              <Typography variant="body2" sx={{ color: '#666', mb: 3 }}>
                Registration: {selectedOrg.registration_number}
              </Typography>

              <Stepper activeStep={approvalStep} orientation="vertical" sx={{ mb: 3 }}>
                {getApprovalSteps().map((step, index) => (
                  <Step key={index}>
                    <StepLabel
                      StepIconComponent={() => (
                        step.completed ? (
                          <CheckCircleIcon sx={{ color: '#28a745' }} />
                        ) : (
                          <PendingIcon sx={{ color: '#ffc107' }} />
                        )
                      )}
                    >
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {step.label}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#666' }}>
                          {step.description}
                        </Typography>
                      </Box>
                    </StepLabel>
                  </Step>
                ))}
              </Stepper>

              <Divider sx={{ my: 2 }} />

              <Typography variant="body2" sx={{ color: '#666', mb: 2 }}>
                {selectedOrg.documents && selectedOrg.documents.length > 0 
                  ? `Documents uploaded: ${selectedOrg.documents.length} file(s)` 
                  : '⚠️ No documents uploaded yet'}
              </Typography>

              <TextField
                fullWidth
                multiline
                rows={3}
                label="Approval Notes (Optional)"
                placeholder="Add any notes about this approval..."
                value={approvalNote}
                onChange={(e) => setApprovalNote(e.target.value)}
                sx={{ mb: 2 }}
              />

              <Alert severity="info" sx={{ mb: 2 }}>
                <Typography variant="body2">
                  By approving this organization, you confirm that:
                </Typography>
                <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
                  <li>All provided information is verified and accurate</li>
                  <li>The organization meets all membership requirements</li>
                  <li>{selectedOrg.documents && selectedOrg.documents.length > 0 
                    ? 'All required documents are submitted' 
                    : '⚠️ No documents are uploaded - status will be set to "Pending Review"'}</li>
                </ul>
              </Alert>
            </>
          )}
        </DialogContent>

        <DialogActions sx={{ p: 3, borderTop: '1px solid #e0e0e0' }}>
          <Button onClick={handleCloseApproval} variant="outlined" sx={{ textTransform: 'none' }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleApproveOrganization}
            disabled={approvalLoading}
            startIcon={approvalLoading ? <CircularProgress size={20} /> : <CheckCircleIcon />}
            sx={{
              bgcolor: '#28a745',
              textTransform: 'none',
              '&:hover': { bgcolor: '#218838' }
            }}
          >
            {approvalLoading ? 'Processing...' : 'Confirm Approval'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default AdminOrganizations;