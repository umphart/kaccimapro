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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tooltip,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Collapse,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Link,
  Badge,
  Stepper,
  Step,
  StepLabel,
  StepContent
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
  ExpandMore as ExpandMoreIcon,
  Description as DescriptionIcon,
  PictureAsPdf as PdfIcon,
  Image as ImageIcon,
  LocationOn as LocationOnIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  Person as PersonIcon,
  Verified as VerifiedIcon,
  ContactMail as ContactMailIcon,
  Download as DownloadIcon,
  Warning as WarningIcon,
  Approval as ApprovalIcon,
  Payment as PaymentIcon,
  Check as CheckIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import AdminSidebar from './AdminSidebar';
import { 
  documentFields, 
  areAllRequiredDocumentsApproved, 
  getDocumentSummary,
  getDocumentStatus,
  getDocumentStatusLabel,
  requiredDocumentKeys
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
    status === 'rejected' ? '#ffebee' :
    status === 'pending_review' ? '#fff3e0' :
    '#fff3e0',
  color: 
    status === 'approved' || status === 'active' ? '#2e7d32' :
    status === 'rejected' ? '#c62828' :
    status === 'pending_review' ? '#e65100' :
    '#e65100',
  '& .MuiChip-icon': {
    fontSize: '14px'
  }
}));

const DetailRow = styled(Box)(({ theme }) => ({
  display: 'flex',
  padding: theme.spacing(1, 0),
  borderBottom: '1px solid #f0f0f0',
  '&:last-child': {
    borderBottom: 'none'
  }
}));

const DetailLabel = styled(Typography)(({ theme }) => ({
  fontWeight: 600,
  color: '#666',
  minWidth: '140px',
  fontSize: '0.85rem'
}));

const DetailValue = styled(Typography)(({ theme }) => ({
  color: '#333',
  fontSize: '0.85rem',
  flex: 1
}));

const DocumentCard = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2),
  marginBottom: theme.spacing(1),
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  borderRadius: '8px',
  border: '1px solid #e0e0e0',
  backgroundColor: '#fafafa',
  '&:hover': {
    backgroundColor: '#f5f5f5',
    borderColor: '#15e420'
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
  const [stats, setStats] = useState({ total: 0, pending: 0, approved: 0, rejected: 0, pendingReview: 0 });
  
  // Approval Dialog
  const [approvalDialogOpen, setApprovalDialogOpen] = useState(false);
  const [approvalLoading, setApprovalLoading] = useState(false);
  const [approvalStep, setApprovalStep] = useState(0);
  const [approvalNote, setApprovalNote] = useState('');

  useEffect(() => {
    if (filter === 'pending') setStatusFilter('pending');
    else if (filter === 'approved') setStatusFilter('approved');
    else if (filter === 'rejected') setStatusFilter('rejected');
    else if (filter === 'pending_review') setStatusFilter('pending_review');
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

      // Fetch documents for each organization
      const orgsWithDocs = await Promise.all(
        (data || []).map(async (org) => {
          const { data: docData, error: docError } = await supabase
            .from('organization_documents')
            .select('*')
            .eq('organization_id', org.id);

          if (docError) {
            console.error('Error fetching documents for org:', org.id, docError);
            return { ...org, documents: [] };
          }

          // Fetch payment info
          const { data: paymentData, error: paymentError } = await supabase
            .from('payments')
            .select('*')
            .eq('organization_id', org.id)
            .order('created_at', { ascending: false })
            .limit(1);

          if (paymentError) {
            console.error('Error fetching payments for org:', org.id, paymentError);
            return { ...org, documents: docData || [], payments: [] };
          }

          return { 
            ...org, 
            documents: docData || [],
            payments: paymentData || []
          };
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

  // Approval Handlers
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

  const handleApproveOrganization = async () => {
    if (!selectedOrg) return;

    setApprovalLoading(true);
    try {
      // Check if all required documents are uploaded
      const uploadedKeys = selectedOrg.documents?.map(d => d.document_type) || [];
      const missingDocs = requiredDocumentKeys.filter(key => !uploadedKeys.includes(key));

      let newStatus = 'approved';
      if (missingDocs.length > 0) {
        newStatus = 'pending_review';
        showAlert('warning', `Organization approved but ${missingDocs.length} documents are missing. They need to upload: ${missingDocs.join(', ')}`);
      } else {
        showAlert('success', 'Organization approved successfully! All documents are uploaded.');
      }

      // Update organization status
      const { error: updateError } = await supabase
        .from('organizations_registry')
        .update({ 
          status: newStatus,
          approved_date: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedOrg.id);

      if (updateError) throw updateError;

      // Log the approval
      const { error: logError } = await supabase
        .from('registration_audit_log')
        .insert([{
          organization_id: selectedOrg.id,
          action: 'organization_approved',
          new_data: { 
            status: newStatus,
            approved_by: (await supabase.auth.getUser()).data.user?.id,
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
    if (!window.confirm('Are you sure you want to reject this organization?')) return;

    try {
      const { error } = await supabase
        .from('organizations_registry')
        .update({ 
          status: 'rejected',
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
      pending: { label: 'Pending Registration', icon: <PendingIcon /> },
      pending_review: { label: 'Pending Review', icon: <PendingIcon /> },
      approved: { label: 'Approved', icon: <CheckCircleIcon /> },
      rejected: { label: 'Rejected', icon: <CancelIcon /> },
      active: { label: 'Active', icon: <CheckCircleIcon /> }
    };
    const config = statusMap[status?.toLowerCase()] || statusMap.pending;
    
    return <StatusChip icon={config.icon} label={config.label} status={status?.toLowerCase()} />;
  };

  const getDocumentIcon = (docType) => {
    const pdfTypes = ['cover_letter', 'memorandum', 'registration_cert', 'incorporation_cert', 'premises_cert', 'form_c07'];
    if (pdfTypes.includes(docType)) {
      return <PdfIcon sx={{ color: '#f44336' }} />;
    }
    return <ImageIcon sx={{ color: '#4caf50' }} />;
  };

  const getDocumentLabel = (docType) => {
    const labels = {
      cover_letter: 'Covering Letter',
      memorandum: 'Memorandum & Articles',
      registration_cert: 'Registration Certificate',
      incorporation_cert: 'Incorporation Certificate',
      premises_cert: 'Business Premises Certificate',
      company_logo: 'Company Logo',
      form_c07: 'Form C07',
      id_document: 'ID Document'
    };
    return labels[docType] || docType;
  };

  const getDocumentStatusChip = (status) => {
    const configs = {
      approved: { label: 'Approved', color: 'success' },
      pending: { label: 'Pending', color: 'warning' },
      rejected: { label: 'Rejected', color: 'error' },
      missing: { label: 'Missing', color: 'default' }
    };
    const config = configs[status] || configs.pending;
    return <Chip label={config.label} color={config.color} size="small" />;
  };

  const getDocumentChips = (documents) => {
    if (!documents || documents.length === 0) {
      return <Chip size="small" label="No documents" color="default" sx={{ height: '20px', fontSize: '0.65rem' }} />;
    }

    const summary = getDocumentSummary(documents);
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
    
    return chips.length > 0 ? chips : <Chip size="small" label="No documents" color="default" sx={{ height: '20px', fontSize: '0.65rem' }} />;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-NG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
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

  const getApprovalSteps = () => {
    const hasDocuments = selectedOrg?.documents && selectedOrg.documents.length > 0;
    const hasPayments = selectedOrg?.payments && selectedOrg.payments.length > 0;
    const hasApprovedPayment = selectedOrg?.payments?.some(p => p.status === 'approved');

    return [
      {
        label: 'Review Organization Details',
        description: 'Verify company information and contact details',
        completed: true
      },
      {
        label: 'Check Documents',
        description: hasDocuments ? 'Documents uploaded and verified' : 'No documents uploaded yet',
        completed: hasDocuments
      },
      {
        label: 'Verify Payment',
        description: hasApprovedPayment ? 'Payment approved' : hasPayments ? 'Payment pending verification' : 'No payment recorded',
        completed: hasApprovedPayment
      }
    ];
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
                      <TableCell sx={{ fontWeight: 600, fontSize: '0.8rem' }}>Payment</TableCell>
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
                        const hasPayment = org.payments && org.payments.length > 0;
                        const hasApprovedPayment = org.payments?.some(p => p.status === 'approved');
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
                                {!hasPayment && isPending && (
                                  <Tooltip title="No payment recorded">
                                    <PaymentIcon sx={{ color: '#ff9800', fontSize: '16px' }} />
                                  </Tooltip>
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
                              {hasApprovedPayment ? (
                                <Chip 
                                  icon={<CheckCircleIcon />} 
                                  label="Paid" 
                                  size="small" 
                                  color="success"
                                  sx={{ height: '20px', fontSize: '0.65rem' }}
                                />
                              ) : hasPayment ? (
                                <Chip 
                                  icon={<PendingIcon />} 
                                  label="Pending" 
                                  size="small" 
                                  color="warning"
                                  sx={{ height: '20px', fontSize: '0.65rem' }}
                                />
                              ) : (
                                <Chip 
                                  icon={<CancelIcon />} 
                                  label="No Payment" 
                                  size="small" 
                                  color="default"
                                  sx={{ height: '20px', fontSize: '0.65rem' }}
                                />
                              )}
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
                                {org.status === 'approved' && (
                                  <Tooltip title="Manage Payments">
                                    <IconButton
                                      size="small"
                                      onClick={() => navigate(`/admin/payments?org=${org.id}`)}
                                      sx={{ color: '#15e420' }}
                                    >
                                      <PaymentIcon fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                )}
                              </Box>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    ) : (
                      <TableRow>
                        <TableCell colSpan={9} align="center" sx={{ py: 4 }}>
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

      {/* Details Dialog */}
      <Dialog
        open={detailsDialogOpen}
        onClose={handleCloseDetails}
        maxWidth="lg"
        fullWidth
        PaperProps={{ sx: { borderRadius: '16px', maxHeight: '90vh' } }}
      >
        {selectedOrg && (
          <>
            <DialogTitle sx={{ bgcolor: '#f8f9fa', borderBottom: '1px solid #e0e0e0' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    {selectedOrg.company_name}
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#666' }}>
                    Registration: {selectedOrg.registration_number}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  {getStatusChip(selectedOrg.status)}
                  <IconButton onClick={handleCloseDetails} size="small">
                    <CancelIcon />
                  </IconButton>
                </Box>
              </Box>
            </DialogTitle>
            
            <DialogContent sx={{ p: 0 }}>
              <Box sx={{ p: 3 }}>
                {/* Basic Information */}
                <Accordion defaultExpanded>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
                      <BusinessIcon sx={{ color: '#15e420' }} /> Company Information
                    </Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={6}>
                        <DetailRow>
                          <DetailLabel>Company Name</DetailLabel>
                          <DetailValue>{selectedOrg.company_name}</DetailValue>
                        </DetailRow>
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <DetailRow>
                          <DetailLabel>Registration Number</DetailLabel>
                          <DetailValue>{selectedOrg.registration_number}</DetailValue>
                        </DetailRow>
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <DetailRow>
                          <DetailLabel>CAC Number</DetailLabel>
                          <DetailValue>{selectedOrg.cac_number || 'N/A'}</DetailValue>
                        </DetailRow>
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <DetailRow>
                          <DetailLabel>Registration Date</DetailLabel>
                          <DetailValue>{formatDate(selectedOrg.registration_date)}</DetailValue>
                        </DetailRow>
                      </Grid>
                      <Grid item xs={12}>
                        <DetailRow>
                          <DetailLabel>Business Nature</DetailLabel>
                          <DetailValue>
                            {(() => {
                              let nature = selectedOrg.business_nature || [];
                              if (typeof nature === 'string') {
                                try { nature = JSON.parse(nature); } catch (e) { nature = []; }
                              }
                              return Array.isArray(nature) ? nature.join(', ') : 'N/A';
                            })()}
                          </DetailValue>
                        </DetailRow>
                      </Grid>
                    </Grid>
                  </AccordionDetails>
                </Accordion>

                {/* Address Information */}
                <Accordion>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
                      <LocationOnIcon sx={{ color: '#15e420' }} /> Address Information
                    </Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={6}>
                        <DetailRow>
                          <DetailLabel>House Number</DetailLabel>
                          <DetailValue>{selectedOrg.house_number || 'N/A'}</DetailValue>
                        </DetailRow>
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <DetailRow>
                          <DetailLabel>Street</DetailLabel>
                          <DetailValue>{selectedOrg.street || 'N/A'}</DetailValue>
                        </DetailRow>
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <DetailRow>
                          <DetailLabel>LGA</DetailLabel>
                          <DetailValue>{selectedOrg.lga || 'N/A'}</DetailValue>
                        </DetailRow>
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <DetailRow>
                          <DetailLabel>State</DetailLabel>
                          <DetailValue>{selectedOrg.state || 'N/A'}</DetailValue>
                        </DetailRow>
                      </Grid>
                      <Grid item xs={12}>
                        <DetailRow>
                          <DetailLabel>Landmark</DetailLabel>
                          <DetailValue>{selectedOrg.landmark || 'N/A'}</DetailValue>
                        </DetailRow>
                      </Grid>
                    </Grid>
                  </AccordionDetails>
                </Accordion>

                {/* Contact Information */}
                <Accordion>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
                      <PersonIcon sx={{ color: '#15e420' }} /> Contact Information
                    </Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={6}>
                        <DetailRow>
                          <DetailLabel>Contact Person</DetailLabel>
                          <DetailValue>{selectedOrg.contact_person || 'N/A'}</DetailValue>
                        </DetailRow>
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <DetailRow>
                          <DetailLabel>Representative</DetailLabel>
                          <DetailValue>{selectedOrg.representative || 'N/A'}</DetailValue>
                        </DetailRow>
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <DetailRow>
                          <DetailLabel><PhoneIcon fontSize="small" sx={{ mr: 0.5 }} /> Phone 1</DetailLabel>
                          <DetailValue>{selectedOrg.phone_number1 || 'N/A'}</DetailValue>
                        </DetailRow>
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <DetailRow>
                          <DetailLabel><PhoneIcon fontSize="small" sx={{ mr: 0.5 }} /> Phone 2</DetailLabel>
                          <DetailValue>{selectedOrg.phone_number2 || 'N/A'}</DetailValue>
                        </DetailRow>
                      </Grid>
                      <Grid item xs={12}>
                        <DetailRow>
                          <DetailLabel><EmailIcon fontSize="small" sx={{ mr: 0.5 }} /> Email</DetailLabel>
                          <DetailValue>{selectedOrg.email || 'N/A'}</DetailValue>
                        </DetailRow>
                      </Grid>
                    </Grid>
                  </AccordionDetails>
                </Accordion>

                {/* Staff Information */}
                <Accordion>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
                      <PeopleIcon sx={{ color: '#15e420' }} /> Staff Information
                    </Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Grid container spacing={2}>
                      <Grid item xs={6} md={3}>
                        <DetailRow>
                          <DetailLabel>Nigerian Directors</DetailLabel>
                          <DetailValue>{selectedOrg.nigerian_directors || 0}</DetailValue>
                        </DetailRow>
                      </Grid>
                      <Grid item xs={6} md={3}>
                        <DetailRow>
                          <DetailLabel>Non-Nigerian Directors</DetailLabel>
                          <DetailValue>{selectedOrg.non_nigerian_directors || 0}</DetailValue>
                        </DetailRow>
                      </Grid>
                      <Grid item xs={6} md={3}>
                        <DetailRow>
                          <DetailLabel>Nigerian Employees</DetailLabel>
                          <DetailValue>{selectedOrg.nigerian_employees || 0}</DetailValue>
                        </DetailRow>
                      </Grid>
                      <Grid item xs={6} md={3}>
                        <DetailRow>
                          <DetailLabel>Non-Nigerian Employees</DetailLabel>
                          <DetailValue>{selectedOrg.non_nigerian_employees || 0}</DetailValue>
                        </DetailRow>
                      </Grid>
                    </Grid>
                  </AccordionDetails>
                </Accordion>

                {/* Referee Information */}
                <Accordion>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
                      <ContactMailIcon sx={{ color: '#15e420' }} /> Referee Information
                    </Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>Referee</Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={6}>
                        <DetailRow>
                          <DetailLabel>Full Name</DetailLabel>
                          <DetailValue>{selectedOrg.referee_name || 'N/A'}</DetailValue>
                        </DetailRow>
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <DetailRow>
                          <DetailLabel>Business Name</DetailLabel>
                          <DetailValue>{selectedOrg.referee_business || 'N/A'}</DetailValue>
                        </DetailRow>
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <DetailRow>
                          <DetailLabel>Phone Number</DetailLabel>
                          <DetailValue>{selectedOrg.referee_phone || 'N/A'}</DetailValue>
                        </DetailRow>
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <DetailRow>
                          <DetailLabel>Registration Number</DetailLabel>
                          <DetailValue>{selectedOrg.referee_reg_number || 'N/A'}</DetailValue>
                        </DetailRow>
                      </Grid>
                    </Grid>
                  </AccordionDetails>
                </Accordion>

                {/* Documents */}
                <Accordion defaultExpanded>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
                      <DescriptionIcon sx={{ color: '#15e420' }} /> Documents ({selectedOrg.documents?.length || 0})
                    </Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    {selectedOrg.documents && selectedOrg.documents.length > 0 ? (
                      <Box>
                        {documentFields.map((field) => {
                          const doc = selectedOrg.documents.find(d => d.document_type === field.key);
                          const status = doc ? (doc.is_verified ? 'approved' : 'pending') : 'missing';
                          
                          return (
                            <DocumentCard key={field.key}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                {doc ? getDocumentIcon(field.key) : <WarningIcon sx={{ color: '#ff9800' }} />}
                                <Box>
                                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                    {field.name}
                                    {field.required && (
                                      <Chip 
                                        label="Required" 
                                        size="small" 
                                        sx={{ ml: 1, height: '16px', fontSize: '0.55rem', backgroundColor: '#ffebee', color: '#c62828' }} 
                                      />
                                    )}
                                  </Typography>
                                  <Typography variant="caption" sx={{ color: '#666' }}>
                                    {doc ? `${doc.file_name} • ${formatDate(doc.uploaded_at)}` : 'Not uploaded'}
                                  </Typography>
                                </Box>
                              </Box>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                {getDocumentStatusChip(status)}
                                {doc && (
                                  <>
                                    <Tooltip title="View Document">
                                      <IconButton
                                        size="small"
                                        href={doc.file_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        sx={{ color: '#15e420' }}
                                      >
                                        <VisibilityIcon fontSize="small" />
                                      </IconButton>
                                    </Tooltip>
                                    <Tooltip title="Download">
                                      <IconButton
                                        size="small"
                                        href={doc.file_url}
                                        download
                                        sx={{ color: '#2196f3' }}
                                      >
                                        <DownloadIcon fontSize="small" />
                                      </IconButton>
                                    </Tooltip>
                                  </>
                                )}
                              </Box>
                            </DocumentCard>
                          );
                        })}
                      </Box>
                    ) : (
                      <Typography variant="body2" sx={{ color: '#666', textAlign: 'center', py: 2 }}>
                        No documents uploaded
                      </Typography>
                    )}
                  </AccordionDetails>
                </Accordion>

                {/* Payments */}
                <Accordion>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
                      <PaymentIcon sx={{ color: '#15e420' }} /> Payment History ({selectedOrg.payments?.length || 0})
                    </Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    {selectedOrg.payments && selectedOrg.payments.length > 0 ? (
                      <Box>
                        {selectedOrg.payments.map((payment, index) => (
                          <DocumentCard key={payment.id}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                              <PaymentIcon sx={{ color: payment.status === 'approved' ? '#28a745' : '#ffc107' }} />
                              <Box>
                                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                  ₦{payment.amount?.toLocaleString()}
                                </Typography>
                                <Typography variant="caption" sx={{ color: '#666' }}>
                                  {formatDate(payment.created_at)} • {payment.payment_method || 'N/A'}
                                </Typography>
                              </Box>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Chip 
                                label={payment.status || 'pending'} 
                                size="small"
                                color={payment.status === 'approved' ? 'success' : payment.status === 'rejected' ? 'error' : 'warning'}
                              />
                            </Box>
                          </DocumentCard>
                        ))}
                      </Box>
                    ) : (
                      <Typography variant="body2" sx={{ color: '#666', textAlign: 'center', py: 2 }}>
                        No payments recorded
                      </Typography>
                    )}
                  </AccordionDetails>
                </Accordion>
              </Box>
            </DialogContent>

            <DialogActions sx={{ p: 3, borderTop: '1px solid #e0e0e0' }}>
              <Button onClick={handleCloseDetails} variant="outlined" sx={{ textTransform: 'none' }}>
                Close
              </Button>
              {(selectedOrg.status === 'pending' || selectedOrg.status === 'pending_review') && (
                <>
                  <Button
                    variant="contained"
                    startIcon={<CheckCircleIcon />}
                    onClick={() => handleOpenApproval(selectedOrg)}
                    sx={{
                      bgcolor: '#28a745',
                      textTransform: 'none',
                      '&:hover': { bgcolor: '#218838' }
                    }}
                  >
                    Approve Organization
                  </Button>
                  <Button
                    variant="contained"
                    startIcon={<CancelIcon />}
                    onClick={() => handleRejectOrganization(selectedOrg.id)}
                    sx={{
                      bgcolor: '#dc3545',
                      textTransform: 'none',
                      '&:hover': { bgcolor: '#c82333' }
                    }}
                  >
                    Reject
                  </Button>
                </>
              )}
              {selectedOrg.status === 'approved' && (
                <Button
                  variant="contained"
                  startIcon={<PaymentIcon />}
                  onClick={() => navigate(`/admin/payments?org=${selectedOrg.id}`)}
                  sx={{
                    bgcolor: '#15e420',
                    textTransform: 'none',
                    '&:hover': { bgcolor: '#12c21e' }
                  }}
                >
                  Manage Payments
                </Button>
              )}
            </DialogActions>
          </>
        )}
      </Dialog>

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
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>

        <DialogContent sx={{ pt: 3 }}>
          {selectedOrg && (
            <>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
                {selectedOrg.company_name}
              </Typography>
              <Typography variant="body2" sx={{ color: '#666', mb: 3 }}>
                Registration: {selectedOrg.registration_number}
              </Typography>

              {/* Approval Steps */}
              <Stepper activeStep={approvalStep} orientation="vertical" sx={{ mb: 3 }}>
                {getApprovalSteps().map((step, index) => (
                  <Step key={index}>
                    <StepLabel
                      StepIconComponent={() => (
                        step.completed ? (
                          <CheckIcon sx={{ color: '#28a745' }} />
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
                  : 'No documents uploaded yet'}
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
                  <li>All required documents are submitted (if any are missing, status will be set to "Pending Review")</li>
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