import React, { useState, useEffect, useRef } from 'react';
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
  Autocomplete,
  Tooltip,
  LinearProgress
} from '@mui/material';
import {
  Search as SearchIcon,
  Visibility as VisibilityIcon,
  CheckCircle as CheckCircleIcon,
  Pending as PendingIcon,
  Cancel as CancelIcon,
  Refresh as RefreshIcon,
  Payment as PaymentIcon,
  Receipt as ReceiptIcon,
  Add as AddIcon,
  Upload as UploadIcon,
  Download as DownloadIcon,
  Close as CloseIcon,
  Business as BusinessIcon
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import AdminSidebar from './AdminSidebar';

const VisuallyHiddenInput = styled('input')({
  clip: 'rect(0 0 0 0)',
  clipPath: 'inset(50%)',
  height: 1,
  overflow: 'hidden',
  position: 'absolute',
  bottom: 0,
  left: 0,
  whiteSpace: 'nowrap',
  width: 1,
});

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

const AdminPayments = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [payments, setPayments] = useState([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [paymentTypeFilter, setPaymentTypeFilter] = useState('all');
  const [alert, setAlert] = useState({ open: false, type: 'success', message: '' });
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    totalAmount: 0
  });
  
  // Payment Form Dialog
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [organizations, setOrganizations] = useState([]);
  const [orgSearchLoading, setOrgSearchLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [paymentForm, setPaymentForm] = useState({
    organization_id: '',
    amount: '',
    payment_method: 'Bank Transfer',
    payment_reference: '',
    payment_type: 'registration',
    payment_year: new Date().getFullYear(),
    payment_date: new Date().toISOString().split('T')[0],
    receipt_file: null
  });
  const [formErrors, setFormErrors] = useState({});
  
  // View Payment Dialog
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);

  // Status Update Dialog
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [newStatus, setNewStatus] = useState('');

  useEffect(() => {
    fetchPayments();
    fetchStats();
  }, [page, rowsPerPage, searchTerm, statusFilter, paymentTypeFilter]);

  const showAlert = (type, message) => {
    setAlert({ open: true, type, message });
  };

  const handleCloseAlert = () => {
    setAlert({ ...alert, open: false });
  };

  const fetchPayments = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('admin_organization_payments')
        .select('*, organizations:organizations_registry(company_name, email, registration_number)', { count: 'exact' });

      // Apply status filter
      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      // Apply payment type filter
      if (paymentTypeFilter !== 'all') {
        query = query.eq('payment_type', paymentTypeFilter);
      }

      // Apply search
      if (searchTerm) {
        query = query.or(
          `organizations_registry.company_name.ilike.%${searchTerm}%,` +
          `organizations_registry.email.ilike.%${searchTerm}%,` +
          `payment_reference.ilike.%${searchTerm}%,` +
          `organizations_registry.registration_number.ilike.%${searchTerm}%`
        );
      }

      // Apply pagination
      const from = page * rowsPerPage;
      const to = from + rowsPerPage - 1;

      const { data, error, count } = await query
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) throw error;

      setPayments(data || []);
      setTotalCount(count || 0);
    } catch (error) {
      console.error('Error fetching payments:', error);
      showAlert('error', 'Failed to load payments');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const { count: total } = await supabase
        .from('admin_organization_payments')
        .select('*', { count: 'exact', head: true });

      const { count: pending } = await supabase
        .from('admin_organization_payments')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');

      const { count: approved } = await supabase
        .from('admin_organization_payments')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'approved');

      const { count: rejected } = await supabase
        .from('admin_organization_payments')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'rejected');

      const { data: approvedPayments } = await supabase
        .from('admin_organization_payments')
        .select('amount')
        .eq('status', 'approved');

      const totalAmount = approvedPayments?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0;

      setStats({
        total: total || 0,
        pending: pending || 0,
        approved: approved || 0,
        rejected: rejected || 0,
        totalAmount
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchOrganizations = async (search = '') => {
    setOrgSearchLoading(true);
    try {
      let query = supabase
        .from('organizations_registry')
        .select('id, company_name, registration_number, email')
        .order('company_name', { ascending: true })
        .limit(50);

      if (search) {
        query = query.or(
          `company_name.ilike.%${search}%,registration_number.ilike.%${search}%,email.ilike.%${search}%`
        );
      }

      const { data, error } = await query;

      if (error) throw error;
      setOrganizations(data || []);
    } catch (error) {
      console.error('Error fetching organizations:', error);
    } finally {
      setOrgSearchLoading(false);
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

  const handlePaymentTypeFilter = (event) => {
    setPaymentTypeFilter(event.target.value);
    setPage(0);
  };

  // Payment Form Handlers
  const handleOpenPaymentDialog = () => {
    setPaymentForm({
      organization_id: '',
      amount: '',
      payment_method: 'Bank Transfer',
      payment_reference: '',
      payment_type: 'registration',
      payment_year: new Date().getFullYear(),
      payment_date: new Date().toISOString().split('T')[0],
      receipt_file: null
    });
    setFormErrors({});
    setPaymentDialogOpen(true);
    fetchOrganizations();
  };

  const handleClosePaymentDialog = () => {
    setPaymentDialogOpen(false);
    setPaymentForm({
      organization_id: '',
      amount: '',
      payment_method: 'Bank Transfer',
      payment_reference: '',
      payment_type: 'registration',
      payment_year: new Date().getFullYear(),
      payment_date: new Date().toISOString().split('T')[0],
      receipt_file: null
    });
    setFormErrors({});
  };

  const handlePaymentFormChange = (field, value) => {
    setPaymentForm(prev => ({ ...prev, [field]: value }));
    // Clear error for the field
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'];
      if (!allowedTypes.includes(file.type)) {
        showAlert('error', 'Please upload a valid image (JPEG, PNG, GIF) or PDF file');
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        showAlert('error', 'File size must be less than 5MB');
        return;
      }

      setPaymentForm(prev => ({ ...prev, receipt_file: file }));
    }
  };

  const validatePaymentForm = () => {
    const errors = {};
    
    if (!paymentForm.organization_id) {
      errors.organization_id = 'Please select an organization';
    }
    if (!paymentForm.amount || parseFloat(paymentForm.amount) <= 0) {
      errors.amount = 'Please enter a valid amount';
    }
    if (!paymentForm.payment_method) {
      errors.payment_method = 'Please select a payment method';
    }
    if (!paymentForm.payment_type) {
      errors.payment_type = 'Please select a payment type';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmitPayment = async () => {
    if (!validatePaymentForm()) return;

    setUploading(true);
    setUploadProgress(0);
    
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        showAlert('error', 'You must be logged in');
        return;
      }

      let receiptPath = null;
      let receiptFilename = null;

      // Upload receipt if file is provided
      if (paymentForm.receipt_file) {
        const fileExt = paymentForm.receipt_file.name.split('.').pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `payment_receipts/${paymentForm.organization_id}/${fileName}`;

        // Simulate upload progress
        const progressInterval = setInterval(() => {
          setUploadProgress(prev => {
            if (prev >= 90) {
              clearInterval(progressInterval);
              return 90;
            }
            return prev + 10;
          });
        }, 200);

        const { error: uploadError } = await supabase.storage
          .from('organization-docs')
          .upload(filePath, paymentForm.receipt_file, {
            cacheControl: '3600',
            upsert: false
          });

        clearInterval(progressInterval);

        if (uploadError) throw uploadError;

        setUploadProgress(100);
        receiptPath = filePath;
        receiptFilename = paymentForm.receipt_file.name;
      }

      // Generate payment reference if not provided
      const paymentReference = paymentForm.payment_reference || 
        `PAY-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

      // Insert payment record
      const { error: insertError } = await supabase
        .from('admin_organization_payments')
        .insert({
          organization_id: paymentForm.organization_id,
          user_id: user.id,
          amount: parseFloat(paymentForm.amount),
          payment_method: paymentForm.payment_method,
          payment_reference: paymentReference,
          receipt_path: receiptPath,
          receipt_filename: receiptFilename,
          status: 'pending',
          payment_type: paymentForm.payment_type,
          payment_year: paymentForm.payment_type === 'registration' ? null : paymentForm.payment_year,
          payment_date: paymentForm.payment_date ? new Date(paymentForm.payment_date).toISOString() : new Date().toISOString()
        });

      if (insertError) throw insertError;

      showAlert('success', 'Payment recorded successfully');
      handleClosePaymentDialog();
      fetchPayments();
      fetchStats();
    } catch (error) {
      console.error('Error recording payment:', error);
      if (error.message?.includes('duplicate key') || error.code === '23505') {
        showAlert('error', 'A payment with this reference already exists. Please use a unique reference.');
      } else {
        showAlert('error', 'Failed to record payment: ' + (error.message || 'Unknown error'));
      }
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  // View Payment Handlers
  const handleViewPayment = async (payment) => {
    setSelectedPayment(payment);
    setViewDialogOpen(true);
  };

  const handleCloseViewDialog = () => {
    setViewDialogOpen(false);
    setSelectedPayment(null);
  };

  // Status Update Handlers
  const handleOpenStatusDialog = (payment, status) => {
    setSelectedPayment(payment);
    setNewStatus(status);
    setStatusDialogOpen(true);
  };

  const handleCloseStatusDialog = () => {
    setStatusDialogOpen(false);
    setSelectedPayment(null);
    setNewStatus('');
  };

  const handleUpdateStatus = async () => {
    if (!selectedPayment || !newStatus) return;

    try {
      const { error } = await supabase
        .from('admin_organization_payments')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedPayment.id);

      if (error) throw error;

      showAlert('success', `Payment ${newStatus} successfully`);
      handleCloseStatusDialog();
      fetchPayments();
      fetchStats();
    } catch (error) {
      console.error('Error updating payment status:', error);
      showAlert('error', 'Failed to update payment status');
    }
  };

  // Download Receipt
  const handleDownloadReceipt = async (payment) => {
    if (!payment.receipt_path) {
      showAlert('error', 'No receipt available for download');
      return;
    }

    try {
      const { data, error } = await supabase.storage
        .from('organization-docs')
        .download(payment.receipt_path);

      if (error) throw error;

      // Create download link
      const url = URL.createObjectURL(data);
      const link = document.createElement('a');
      link.href = url;
      link.download = payment.receipt_filename || 'receipt';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading receipt:', error);
      showAlert('error', 'Failed to download receipt');
    }
  };

  const getStatusChip = (status) => {
    const config = {
      pending: { color: 'warning', icon: <PendingIcon />, label: 'Pending' },
      approved: { color: 'success', icon: <CheckCircleIcon />, label: 'Approved' },
      rejected: { color: 'error', icon: <CancelIcon />, label: 'Rejected' },
      refunded: { color: 'default', icon: <CancelIcon />, label: 'Refunded' }
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

  const getPaymentTypeLabel = (type) => {
    const types = {
      registration: 'Registration',
      renewal: 'Renewal',
      annual_subscription: 'Annual Subscription',
      other: 'Other'
    };
    return types[type] || type;
  };

  if (loading && payments.length === 0) {
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
            <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2 }}>
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
                  Payments Management
                </Typography>
                <Typography 
                  variant="body1" 
                  sx={{ 
                    fontFamily: '"Inter", sans-serif',
                    color: '#666'
                  }}
                >
                  Record and manage organization payments
                </Typography>
              </Box>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleOpenPaymentDialog}
                sx={{
                  backgroundColor: '#15e420',
                  color: '#fff',
                  borderRadius: '8px',
                  textTransform: 'none',
                  fontWeight: 600,
                  fontFamily: '"Inter", sans-serif',
                  '&:hover': {
                    backgroundColor: '#12c21e'
                  }
                }}
              >
                Record Payment
              </Button>
            </Box>

            {/* Stats Cards */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
              <Grid item xs={12} sm={6} md={2.4}>
                <StyledCard>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Avatar sx={{ bgcolor: '#15e420', width: 48, height: 48 }}>
                        <PaymentIcon />
                      </Avatar>
                      <Box>
                        <Typography variant="body2" sx={{ color: '#666' }}>
                          Total Payments
                        </Typography>
                        <Typography variant="h4" sx={{ fontWeight: 700 }}>
                          {stats.total}
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </StyledCard>
              </Grid>
              <Grid item xs={12} sm={6} md={2.4}>
                <StyledCard>
                  <CardContent>
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
                  </CardContent>
                </StyledCard>
              </Grid>
              <Grid item xs={12} sm={6} md={2.4}>
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
              <Grid item xs={12} sm={6} md={2.4}>
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
              <Grid item xs={12} sm={6} md={2.4}>
                <StyledCard>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Avatar sx={{ bgcolor: '#6f42c1', width: 48, height: 48 }}>
                        <ReceiptIcon />
                      </Avatar>
                      <Box>
                        <Typography variant="body2" sx={{ color: '#666' }}>
                          Total Amount
                        </Typography>
                        <Typography variant="h4" sx={{ fontWeight: 700 }}>
                          ₦{stats.totalAmount.toLocaleString()}
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
                    placeholder="Search by company, email, reference or reg number..."
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
                <Grid item xs={12} md={2.5}>
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
                      <MenuItem value="refunded">Refunded</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={2.5}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Payment Type</InputLabel>
                    <Select
                      value={paymentTypeFilter}
                      onChange={handlePaymentTypeFilter}
                      label="Payment Type"
                    >
                      <MenuItem value="all">All Types</MenuItem>
                      <MenuItem value="registration">Registration</MenuItem>
                      <MenuItem value="renewal">Renewal</MenuItem>
                      <MenuItem value="annual_subscription">Annual Subscription</MenuItem>
                      <MenuItem value="other">Other</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={3} sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                  <Button
                    variant="outlined"
                    startIcon={<RefreshIcon />}
                    onClick={fetchPayments}
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
                      <TableCell sx={{ fontFamily: '"Inter", sans-serif', fontWeight: 600 }}>Reference</TableCell>
                      <TableCell sx={{ fontFamily: '"Inter", sans-serif', fontWeight: 600 }}>Organization</TableCell>
                      <TableCell sx={{ fontFamily: '"Inter", sans-serif', fontWeight: 600 }}>Amount</TableCell>
                      <TableCell sx={{ fontFamily: '"Inter", sans-serif', fontWeight: 600 }}>Type</TableCell>
                      <TableCell sx={{ fontFamily: '"Inter", sans-serif', fontWeight: 600 }}>Method</TableCell>
                      <TableCell sx={{ fontFamily: '"Inter", sans-serif', fontWeight: 600 }}>Date</TableCell>
                      <TableCell sx={{ fontFamily: '"Inter", sans-serif', fontWeight: 600 }}>Status</TableCell>
                      <TableCell sx={{ fontFamily: '"Inter", sans-serif', fontWeight: 600 }}>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {payments.map((payment) => (
                      <TableRow key={payment.id} hover>
                        <TableCell sx={{ fontFamily: '"Inter", sans-serif' }}>
                          <Chip
                            label={payment.payment_reference}
                            size="small"
                            sx={{ 
                              fontFamily: '"Inter", sans-serif',
                              fontSize: '0.75rem',
                              backgroundColor: '#f0f0f0'
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Avatar sx={{ width: 32, height: 32, bgcolor: '#15e420', fontSize: '0.8rem' }}>
                              <BusinessIcon sx={{ fontSize: 18 }} />
                            </Avatar>
                            <Box>
                              <Typography sx={{ fontFamily: '"Inter", sans-serif', fontWeight: 600, fontSize: '0.85rem' }}>
                                {payment.organizations?.company_name || 'N/A'}
                              </Typography>
                              {payment.organizations?.registration_number && (
                                <Typography variant="caption" sx={{ color: '#666', fontFamily: '"Inter", sans-serif' }}>
                                  {payment.organizations.registration_number}
                                </Typography>
                              )}
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell sx={{ fontFamily: '"Inter", sans-serif', fontWeight: 600 }}>
                          ₦{payment.amount?.toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={getPaymentTypeLabel(payment.payment_type)}
                            size="small"
                            sx={{ backgroundColor: '#e8f5e9', color: '#15e420', fontFamily: '"Inter", sans-serif' }}
                          />
                        </TableCell>
                        <TableCell sx={{ fontFamily: '"Inter", sans-serif' }}>
                          {payment.payment_method}
                        </TableCell>
                        <TableCell sx={{ fontFamily: '"Inter", sans-serif' }}>
                          {new Date(payment.payment_date || payment.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          {getStatusChip(payment.status)}
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', gap: 0.5 }}>
                            <Tooltip title="View Details">
                              <IconButton
                                size="small"
                                onClick={() => handleViewPayment(payment)}
                                sx={{ color: '#15e420' }}
                              >
                                <VisibilityIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            {payment.receipt_path && (
                              <Tooltip title="Download Receipt">
                                <IconButton
                                  size="small"
                                  onClick={() => handleDownloadReceipt(payment)}
                                  sx={{ color: '#2196f3' }}
                                >
                                  <DownloadIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            )}
                            {payment.status === 'pending' && (
                              <>
                                <Tooltip title="Approve">
                                  <IconButton
                                    size="small"
                                    onClick={() => handleOpenStatusDialog(payment, 'approved')}
                                    sx={{ color: '#28a745' }}
                                  >
                                    <CheckCircleIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title="Reject">
                                  <IconButton
                                    size="small"
                                    onClick={() => handleOpenStatusDialog(payment, 'rejected')}
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
                    ))}
                    {payments.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                            <ReceiptIcon sx={{ fontSize: 48, color: '#ccc' }} />
                            <Typography sx={{ color: '#666', fontFamily: '"Inter", sans-serif' }}>
                              No payments found
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
                sx={{
                  '.MuiTablePagination-toolbar': { 
                    fontFamily: '"Inter", sans-serif',
                    fontSize: '0.85rem'
                  }
                }}
              />
            </Paper>
          </Box>
        </Box>
      </Container>

      {/* Record Payment Dialog */}
      <Dialog 
        open={paymentDialogOpen} 
        onClose={handleClosePaymentDialog}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '16px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.2)'
          }
        }}
      >
        <DialogTitle sx={{ 
          fontFamily: '"Poppins", sans-serif',
          fontWeight: 600,
          fontSize: '1.5rem',
          borderBottom: '1px solid #f0f0f0',
          pb: 2
        }}>
          Record Organization Payment
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          {uploading && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" sx={{ mb: 1, fontFamily: '"Inter", sans-serif' }}>
                Uploading receipt... {uploadProgress}%
              </Typography>
              <LinearProgress 
                variant="determinate" 
                value={uploadProgress} 
                sx={{ 
                  height: 8, 
                  borderRadius: 4,
                  backgroundColor: '#f0f0f0',
                  '& .MuiLinearProgress-bar': {
                    backgroundColor: '#15e420'
                  }
                }}
              />
            </Box>
          )}
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Autocomplete
                options={organizations}
                getOptionLabel={(option) => `${option.company_name} (${option.registration_number})`}
                loading={orgSearchLoading}
                onInputChange={(event, value) => fetchOrganizations(value)}
                onChange={(event, value) => handlePaymentFormChange('organization_id', value?.id || '')}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Select Organization"
                    required
                    error={!!formErrors.organization_id}
                    helperText={formErrors.organization_id}
                    sx={{ fontFamily: '"Inter", sans-serif' }}
                    InputProps={{
                      ...params.InputProps,
                      endAdornment: (
                        <>
                          {orgSearchLoading ? <CircularProgress color="inherit" size={20} /> : null}
                          {params.InputProps.endAdornment}
                        </>
                      ),
                    }}
                  />
                )}
                renderOption={(props, option) => (
                  <Box component="li" {...props} sx={{ fontFamily: '"Inter", sans-serif' }}>
                    <Box>
                      <Typography variant="body1" sx={{ fontWeight: 600 }}>
                        {option.company_name}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#666' }}>
                        {option.registration_number} | {option.email}
                      </Typography>
                    </Box>
                  </Box>
                )}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Amount (₦)"
                type="number"
                required
                value={paymentForm.amount}
                onChange={(e) => handlePaymentFormChange('amount', e.target.value)}
                error={!!formErrors.amount}
                helperText={formErrors.amount}
                InputProps={{ startAdornment: <InputAdornment position="start">₦</InputAdornment> }}
                sx={{ fontFamily: '"Inter", sans-serif' }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth required error={!!formErrors.payment_type}>
                <InputLabel>Payment Type</InputLabel>
                <Select
                  value={paymentForm.payment_type}
                  onChange={(e) => handlePaymentFormChange('payment_type', e.target.value)}
                  label="Payment Type"
                  sx={{ fontFamily: '"Inter", sans-serif' }}
                >
                  <MenuItem value="registration">Registration</MenuItem>
                  <MenuItem value="renewal">Renewal</MenuItem>
                  <MenuItem value="annual_subscription">Annual Subscription</MenuItem>
                  <MenuItem value="other">Other</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            {(paymentForm.payment_type === 'renewal' || paymentForm.payment_type === 'annual_subscription') && (
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Payment Year"
                  type="number"
                  value={paymentForm.payment_year}
                  onChange={(e) => handlePaymentFormChange('payment_year', e.target.value)}
                  InputProps={{ inputProps: { min: 2020, max: 2030 } }}
                  sx={{ fontFamily: '"Inter", sans-serif' }}
                />
              </Grid>
            )}
            <Grid item xs={12} md={6}>
              <FormControl fullWidth required error={!!formErrors.payment_method}>
                <InputLabel>Payment Method</InputLabel>
                <Select
                  value={paymentForm.payment_method}
                  onChange={(e) => handlePaymentFormChange('payment_method', e.target.value)}
                  label="Payment Method"
                  sx={{ fontFamily: '"Inter", sans-serif' }}
                >
                  <MenuItem value="Bank Transfer">Bank Transfer</MenuItem>
                  <MenuItem value="Cash">Cash</MenuItem>
                  <MenuItem value="Cheque">Cheque</MenuItem>
                  <MenuItem value="POS">POS</MenuItem>
                  <MenuItem value="Online Transfer">Online Transfer</MenuItem>
                  <MenuItem value="Direct Deposit">Direct Deposit</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Payment Reference (Optional)"
                value={paymentForm.payment_reference}
                onChange={(e) => handlePaymentFormChange('payment_reference', e.target.value)}
                placeholder="Leave empty for auto-generation"
                sx={{ fontFamily: '"Inter", sans-serif' }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Payment Date"
                type="date"
                value={paymentForm.payment_date}
                onChange={(e) => handlePaymentFormChange('payment_date', e.target.value)}
                InputLabelProps={{ shrink: true }}
                sx={{ fontFamily: '"Inter", sans-serif' }}
              />
            </Grid>
            <Grid item xs={12}>
              <Box sx={{ border: '2px dashed #e0e0e0', borderRadius: '12px', p: 3, textAlign: 'center' }}>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  accept="image/*,.pdf"
                  style={{ display: 'none' }}
                />
                <UploadIcon sx={{ fontSize: 48, color: '#15e420', mb: 1 }} />
                <Typography variant="body1" sx={{ mb: 1, fontFamily: '"Inter", sans-serif', fontWeight: 500 }}>
                  Upload Payment Receipt (Optional)
                </Typography>
                <Typography variant="body2" sx={{ mb: 2, color: '#666', fontFamily: '"Inter", sans-serif' }}>
                  {paymentForm.receipt_file 
                    ? `Selected: ${paymentForm.receipt_file.name}`
                    : 'Supported formats: JPEG, PNG, GIF, PDF (Max 5MB)'
                  }
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                  <Button
                    variant="outlined"
                    onClick={() => fileInputRef.current?.click()}
                    sx={{ borderColor: '#15e420', color: '#15e420', fontFamily: '"Inter", sans-serif' }}
                  >
                    Choose File
                  </Button>
                  {paymentForm.receipt_file && (
                    <Button
                      variant="outlined"
                      onClick={() => handlePaymentFormChange('receipt_file', null)}
                      sx={{ borderColor: '#dc3545', color: '#dc3545', fontFamily: '"Inter", sans-serif' }}
                    >
                      Remove
                    </Button>
                  )}
                </Box>
              </Box>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 3, borderTop: '1px solid #f0f0f0' }}>
          <Button 
            onClick={handleClosePaymentDialog}
            sx={{ 
              color: '#666',
              fontFamily: '"Inter", sans-serif',
              textTransform: 'none'
            }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSubmitPayment}
            disabled={uploading}
            sx={{
              backgroundColor: '#15e420',
              color: '#fff',
              fontFamily: '"Inter", sans-serif',
              textTransform: 'none',
              fontWeight: 600,
              borderRadius: '8px',
              px: 4,
              '&:hover': {
                backgroundColor: '#12c21e'
              }
            }}
          >
            {uploading ? 'Uploading...' : 'Record Payment'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* View Payment Dialog */}
      <Dialog 
        open={viewDialogOpen} 
        onClose={handleCloseViewDialog}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '16px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.2)'
          }
        }}
      >
        {selectedPayment && (
          <>
            <DialogTitle sx={{ 
              fontFamily: '"Poppins", sans-serif',
              fontWeight: 600,
              fontSize: '1.5rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderBottom: '1px solid #f0f0f0',
              pb: 2
            }}>
              Payment Details
              <IconButton onClick={handleCloseViewDialog} size="small">
                <CloseIcon />
              </IconButton>
            </DialogTitle>
            <DialogContent sx={{ pt: 3 }}>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Typography variant="overline" sx={{ color: '#666', fontFamily: '"Inter", sans-serif' }}>
                    Payment Reference
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600, fontFamily: '"Inter", sans-serif', mb: 2 }}>
                    {selectedPayment.payment_reference}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="overline" sx={{ color: '#666', fontFamily: '"Inter", sans-serif' }}>
                    Status
                  </Typography>
                  <Box sx={{ mt: 0.5, mb: 2 }}>
                    {getStatusChip(selectedPayment.status)}
                  </Box>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="overline" sx={{ color: '#666', fontFamily: '"Inter", sans-serif' }}>
                    Organization
                  </Typography>
                  <Typography variant="body1" sx={{ fontFamily: '"Inter", sans-serif', mb: 2 }}>
                    {selectedPayment.organizations?.company_name || 'N/A'}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="overline" sx={{ color: '#666', fontFamily: '"Inter", sans-serif' }}>
                    Registration Number
                  </Typography>
                  <Typography variant="body1" sx={{ fontFamily: '"Inter", sans-serif', mb: 2 }}>
                    {selectedPayment.organizations?.registration_number || 'N/A'}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="overline" sx={{ color: '#666', fontFamily: '"Inter", sans-serif' }}>
                    Amount
                  </Typography>
                  <Typography variant="h6" sx={{ fontFamily: '"Inter", sans-serif', color: '#15e420', mb: 2 }}>
                    ₦{selectedPayment.amount?.toLocaleString()}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="overline" sx={{ color: '#666', fontFamily: '"Inter", sans-serif' }}>
                    Payment Type
                  </Typography>
                  <Box sx={{ mt: 0.5, mb: 2 }}>
                    <Chip
                      label={getPaymentTypeLabel(selectedPayment.payment_type)}
                      size="small"
                      sx={{ backgroundColor: '#e8f5e9', color: '#15e420', fontFamily: '"Inter", sans-serif' }}
                    />
                  </Box>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="overline" sx={{ color: '#666', fontFamily: '"Inter", sans-serif' }}>
                    Payment Method
                  </Typography>
                  <Typography variant="body1" sx={{ fontFamily: '"Inter", sans-serif', mb: 2 }}>
                    {selectedPayment.payment_method}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="overline" sx={{ color: '#666', fontFamily: '"Inter", sans-serif' }}>
                    Payment Date
                  </Typography>
                  <Typography variant="body1" sx={{ fontFamily: '"Inter", sans-serif', mb: 2 }}>
                    {new Date(selectedPayment.payment_date || selectedPayment.created_at).toLocaleDateString()}
                  </Typography>
                </Grid>
                {selectedPayment.payment_year && (
                  <Grid item xs={12} md={6}>
                    <Typography variant="overline" sx={{ color: '#666', fontFamily: '"Inter", sans-serif' }}>
                      Payment Year
                    </Typography>
                    <Typography variant="body1" sx={{ fontFamily: '"Inter", sans-serif', mb: 2 }}>
                      {selectedPayment.payment_year}
                    </Typography>
                  </Grid>
                )}
                <Grid item xs={12} md={6}>
                  <Typography variant="overline" sx={{ color: '#666', fontFamily: '"Inter", sans-serif' }}>
                    Created At
                  </Typography>
                  <Typography variant="body1" sx={{ fontFamily: '"Inter", sans-serif', mb: 2 }}>
                    {new Date(selectedPayment.created_at).toLocaleString()}
                  </Typography>
                </Grid>
                {selectedPayment.receipt_path && (
                  <Grid item xs={12}>
                    <Typography variant="overline" sx={{ color: '#666', fontFamily: '"Inter", sans-serif' }}>
                      Receipt
                    </Typography>
                    <Box sx={{ mt: 1, display: 'flex', gap: 1 }}>
                      <Button
                        variant="outlined"
                        startIcon={<DownloadIcon />}
                        onClick={() => handleDownloadReceipt(selectedPayment)}
                        sx={{ borderColor: '#15e420', color: '#15e420', fontFamily: '"Inter", sans-serif' }}
                      >
                        Download Receipt
                      </Button>
                    </Box>
                  </Grid>
                )}
              </Grid>
            </DialogContent>
            <DialogActions sx={{ p: 3, borderTop: '1px solid #f0f0f0' }}>
              {selectedPayment.status === 'pending' && (
                <>
                  <Button
                    variant="contained"
                    onClick={() => {
                      handleCloseViewDialog();
                      handleOpenStatusDialog(selectedPayment, 'approved');
                    }}
                    sx={{
                      backgroundColor: '#28a745',
                      color: '#fff',
                      fontFamily: '"Inter", sans-serif',
                      textTransform: 'none',
                      fontWeight: 600,
                      borderRadius: '8px',
                      '&:hover': {
                        backgroundColor: '#218838'
                      }
                    }}
                  >
                    Approve Payment
                  </Button>
                  <Button
                    variant="contained"
                    onClick={() => {
                      handleCloseViewDialog();
                      handleOpenStatusDialog(selectedPayment, 'rejected');
                    }}
                    sx={{
                      backgroundColor: '#dc3545',
                      color: '#fff',
                      fontFamily: '"Inter", sans-serif',
                      textTransform: 'none',
                      fontWeight: 600,
                      borderRadius: '8px',
                      '&:hover': {
                        backgroundColor: '#c82333'
                      }
                    }}
                  >
                    Reject Payment
                  </Button>
                </>
              )}
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Status Update Confirmation Dialog */}
      <Dialog
        open={statusDialogOpen}
        onClose={handleCloseStatusDialog}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '16px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.2)'
          }
        }}
      >
        <DialogTitle sx={{ 
          fontFamily: '"Poppins", sans-serif',
          fontWeight: 600,
          fontSize: '1.25rem'
        }}>
          Confirm Status Update
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ fontFamily: '"Inter", sans-serif', color: '#666' }}>
            Are you sure you want to mark this payment as{' '}
            <strong style={{ color: newStatus === 'approved' ? '#28a745' : '#dc3545' }}>
              {newStatus}
            </strong>?
          </Typography>
          {selectedPayment && (
            <Box sx={{ mt: 2, p: 2, backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
              <Typography variant="body2" sx={{ fontFamily: '"Inter", sans-serif' }}>
                Reference: {selectedPayment.payment_reference}
              </Typography>
              <Typography variant="body2" sx={{ fontFamily: '"Inter", sans-serif' }}>
                Amount: ₦{selectedPayment.amount?.toLocaleString()}
              </Typography>
              <Typography variant="body2" sx={{ fontFamily: '"Inter", sans-serif' }}>
                Organization: {selectedPayment.organizations?.company_name || 'N/A'}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button 
            onClick={handleCloseStatusDialog}
            sx={{ 
              color: '#666',
              fontFamily: '"Inter", sans-serif',
              textTransform: 'none'
            }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleUpdateStatus}
            sx={{
              backgroundColor: newStatus === 'approved' ? '#28a745' : '#dc3545',
              color: '#fff',
              fontFamily: '"Inter", sans-serif',
              textTransform: 'none',
              fontWeight: 600,
              borderRadius: '8px',
              px: 4,
              '&:hover': {
                backgroundColor: newStatus === 'approved' ? '#218838' : '#c82333'
              }
            }}
          >
            Confirm {newStatus === 'approved' ? 'Approval' : 'Rejection'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default AdminPayments;