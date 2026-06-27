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
  LinearProgress,
  Tabs,
  Tab,
  Badge,
  Divider,
  Stepper,
  Step,
  StepLabel
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
  Business as BusinessIcon,
  AdminPanelSettings as AdminIcon,
  Person as PersonIcon,
  AttachFile as AttachFileIcon,
  Check as CheckIcon,
  Clear as ClearIcon,
  FilePresent as FilePresentIcon
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

const DropZone = styled(Box)(({ theme }) => ({
  border: '2px dashed #e0e0e0',
  borderRadius: '12px',
  padding: theme.spacing(4),
  textAlign: 'center',
  cursor: 'pointer',
  transition: 'all 0.3s ease',
  '&:hover': {
    borderColor: '#15e420',
    backgroundColor: 'rgba(21, 228, 32, 0.04)'
  },
  '&.dragging': {
    borderColor: '#15e420',
    backgroundColor: 'rgba(21, 228, 32, 0.08)'
  }
}));

const AdminPayments = () => {
  console.log('🗄️ Fetching payments from: admin_organization_payments and payments tables');
  console.log('📁 Using storage bucket: organization-docs');
  
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
  const [sourceFilter, setSourceFilter] = useState('all');
  const [alert, setAlert] = useState({ open: false, type: 'success', message: '' });
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    refunded: 0,
    totalAmount: 0,
    adminPayments: 0,
    selfPayments: 0
  });
  
  // Payment Form Dialog
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [organizations, setOrganizations] = useState([]);
  const [orgSearchLoading, setOrgSearchLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
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
  const [statusUpdateLoading, setStatusUpdateLoading] = useState(false);

  useEffect(() => {
    fetchAllPayments();
    fetchStats();
  }, [page, rowsPerPage, searchTerm, statusFilter, paymentTypeFilter, sourceFilter]);

  const showAlert = (type, message) => {
    setAlert({ open: true, type, message });
  };

  const handleCloseAlert = () => {
    setAlert({ ...alert, open: false });
  };

  // Helper function to fetch organization data for a payment
  const fetchOrganizationForPayment = async (organizationId) => {
    if (!organizationId) return null;
    try {
      const { data, error } = await supabase
        .from('organizations_registry')
        .select('company_name, email, registration_number, status')
        .eq('id', organizationId)
        .maybeSingle();
      
      if (error) {
        console.error('Error fetching organization:', error);
        return null;
      }
      return data;
    } catch (error) {
      console.error('Error fetching organization:', error);
      return null;
    }
  };

  const fetchAllPayments = async () => {
    setLoading(true);
    try {
      console.log('📊 Fetching payments from both tables...');
      
      // Fetch from admin_organization_payments with join
      let adminQuery = supabase
        .from('admin_organization_payments')
        .select('*, organizations:organizations_registry(company_name, email, registration_number, status)');

      // Fetch from payments without join (we'll fetch org data separately)
      let selfQuery = supabase
        .from('payments')
        .select('*');

      // Apply filters for admin payments
      if (statusFilter !== 'all') {
        if (statusFilter === 'approved' || statusFilter === 'rejected' || statusFilter === 'refunded') {
          adminQuery = adminQuery.eq('status', statusFilter);
        } else if (statusFilter === 'pending') {
          adminQuery = adminQuery.eq('status', 'pending');
        }
        // Map status filter for self payments
        let selfStatusFilter = statusFilter;
        if (statusFilter === 'approved') selfStatusFilter = 'completed';
        else if (statusFilter === 'rejected') selfStatusFilter = 'failed';
        else if (statusFilter === 'refunded') selfStatusFilter = 'refunded';
        else if (statusFilter === 'pending') selfStatusFilter = 'pending';
        selfQuery = selfQuery.eq('status', selfStatusFilter);
      }

      if (paymentTypeFilter !== 'all') {
        adminQuery = adminQuery.eq('payment_type', paymentTypeFilter);
        // self payments table might not have payment_type, so skip filter
      }

      // Execute both queries
      const [adminResult, selfResult] = await Promise.all([
        adminQuery.order('created_at', { ascending: false }),
        selfQuery.order('created_at', { ascending: false })
      ]);

      if (adminResult.error) {
        console.error('❌ Error fetching admin payments:', adminResult.error);
        throw adminResult.error;
      }
      if (selfResult.error) {
        console.error('❌ Error fetching self payments:', selfResult.error);
        throw selfResult.error;
      }

      // Process admin payments
      let adminPayments = [];
      if (adminResult.data) {
        adminPayments = adminResult.data.map(p => ({
          ...p,
          source: 'admin',
          source_label: 'Admin Created',
          display_status: p.status // admin status: pending, approved, rejected, refunded
        }));
      }

      // Process self payments - fetch organization data for each
      let selfPayments = [];
      if (selfResult.data) {
        console.log(`📊 Processing ${selfResult.data.length} self payments...`);
        
        for (const payment of selfResult.data) {
          let orgData = null;
          if (payment.organization_id) {
            orgData = await fetchOrganizationForPayment(payment.organization_id);
          }
          
          selfPayments.push({
            ...payment,
            source: 'self',
            source_label: 'Self Registration',
            organizations: orgData,
            display_status: payment.status // self status: pending, completed, failed, refunded
          });
        }
      }

      // Combine all payments
      let allPayments = [...adminPayments, ...selfPayments];

      // Apply source filter
      if (sourceFilter !== 'all') {
        allPayments = allPayments.filter(p => p.source === sourceFilter);
      }

      // Apply search filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        allPayments = allPayments.filter(p => {
          const companyName = p.organizations?.company_name?.toLowerCase() || '';
          const email = p.organizations?.email?.toLowerCase() || '';
          const regNumber = p.organizations?.registration_number?.toLowerCase() || '';
          const reference = p.payment_reference?.toLowerCase() || '';
          
          return companyName.includes(searchLower) ||
                 email.includes(searchLower) ||
                 regNumber.includes(searchLower) ||
                 reference.includes(searchLower);
        });
      }

      // Sort by created_at descending
      allPayments.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

      // Set total count and paginate
      setTotalCount(allPayments.length);
      
      const from = page * rowsPerPage;
      const to = from + rowsPerPage;
      const paginatedPayments = allPayments.slice(from, to);
      
      setPayments(paginatedPayments);
      
      console.log(`✅ Found ${allPayments.length} total payments (${adminPayments.length} admin, ${selfPayments.length} self)`);

    } catch (error) {
      console.error('❌ Error fetching payments:', error);
      showAlert('error', 'Failed to load payments: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      console.log('📊 Fetching payment stats...');
      
      // Get admin payments stats
      const { count: adminTotal } = await supabase
        .from('admin_organization_payments')
        .select('*', { count: 'exact', head: true });

      const { count: adminPending } = await supabase
        .from('admin_organization_payments')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');

      const { count: adminApproved } = await supabase
        .from('admin_organization_payments')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'approved');

      const { count: adminRejected } = await supabase
        .from('admin_organization_payments')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'rejected');

      const { count: adminRefunded } = await supabase
        .from('admin_organization_payments')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'refunded');

      // Get self payments stats
      const { count: selfTotal } = await supabase
        .from('payments')
        .select('*', { count: 'exact', head: true });

      const { count: selfPending } = await supabase
        .from('payments')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');

      const { count: selfCompleted } = await supabase
        .from('payments')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'completed');

      const { count: selfFailed } = await supabase
        .from('payments')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'failed');

      const { count: selfRefunded } = await supabase
        .from('payments')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'refunded');

      // Get total amount from approved/completed payments
      const { data: adminApprovedData } = await supabase
        .from('admin_organization_payments')
        .select('amount')
        .eq('status', 'approved');

      const { data: selfCompletedData } = await supabase
        .from('payments')
        .select('amount')
        .eq('status', 'completed');

      const adminTotalAmount = adminApprovedData?.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0) || 0;
      const selfTotalAmount = selfCompletedData?.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0) || 0;

      const totalPending = (adminPending || 0) + (selfPending || 0);
      const totalApproved = (adminApproved || 0) + (selfCompleted || 0);
      const totalRejected = (adminRejected || 0) + (selfFailed || 0);
      const totalRefunded = (adminRefunded || 0) + (selfRefunded || 0);
      const totalPayments = (adminTotal || 0) + (selfTotal || 0);

      setStats({
        total: totalPayments,
        pending: totalPending,
        approved: totalApproved,
        rejected: totalRejected,
        refunded: totalRefunded,
        totalAmount: adminTotalAmount + selfTotalAmount,
        adminPayments: adminTotal || 0,
        selfPayments: selfTotal || 0
      });

      console.log(`📊 Stats: ${totalPayments} total payments (${adminTotal || 0} admin, ${selfTotal || 0} self)`);

    } catch (error) {
      console.error('❌ Error fetching stats:', error);
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

  const handleSourceFilter = (event, newValue) => {
    setSourceFilter(newValue);
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
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      processFile(file);
    }
  };

  const processFile = (file) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      showAlert('error', 'Please upload a valid image (JPEG, PNG, GIF) or PDF file');
      return;
    }
    
    if (file.size > 5 * 1024 * 1024) {
      showAlert('error', 'File size must be less than 5MB');
      return;
    }

    setPaymentForm(prev => ({ ...prev, receipt_file: file }));
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      processFile(file);
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
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        showAlert('error', 'You must be logged in');
        return;
      }

      let receiptPath = null;
      let receiptFilename = null;

      if (paymentForm.receipt_file) {
        const fileExt = paymentForm.receipt_file.name.split('.').pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `payment_receipts/${paymentForm.organization_id}/${fileName}`;

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

      const paymentReference = paymentForm.payment_reference || 
        `PAY-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

      // Insert into admin_organization_payments with status 'approved'
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
          status: 'approved', // Auto-approved for admin created
          payment_type: paymentForm.payment_type,
          payment_year: paymentForm.payment_type === 'registration' ? null : paymentForm.payment_year,
          payment_date: paymentForm.payment_date ? new Date(paymentForm.payment_date).toISOString() : new Date().toISOString()
        });

      if (insertError) throw insertError;

      showAlert('success', 'Payment recorded and approved successfully');
      handleClosePaymentDialog();
      fetchAllPayments();
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
    // If payment is from self and doesn't have organization data, fetch it
    if (payment.source === 'self' && !payment.organizations && payment.organization_id) {
      const orgData = await fetchOrganizationForPayment(payment.organization_id);
      payment.organizations = orgData;
    }
    setSelectedPayment(payment);
    setViewDialogOpen(true);
  };

  const handleCloseViewDialog = () => {
    setViewDialogOpen(false);
    setSelectedPayment(null);
  };

  // ============================================================
  // STATUS UPDATE HANDLERS
  // ============================================================
  
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

    setStatusUpdateLoading(true);
    try {
      let table, statusToUpdate;
      
      if (selectedPayment.source === 'admin') {
        // Admin table: pending, approved, rejected, refunded
        table = 'admin_organization_payments';
        if (newStatus === 'approved') statusToUpdate = 'approved';
        else if (newStatus === 'rejected') statusToUpdate = 'rejected';
        else if (newStatus === 'refunded') statusToUpdate = 'refunded';
        else statusToUpdate = 'pending';
      } else {
        // Self table: pending, completed, failed, refunded
        table = 'payments';
        if (newStatus === 'approved') statusToUpdate = 'completed';
        else if (newStatus === 'rejected') statusToUpdate = 'failed';
        else if (newStatus === 'refunded') statusToUpdate = 'refunded';
        else statusToUpdate = 'pending';
      }
      
      console.log(`🔄 Updating payment in ${table} (ID: ${selectedPayment.id}) from "${selectedPayment.status}" to "${statusToUpdate}"`);
      
      const { error } = await supabase
        .from(table)
        .update({ 
          status: statusToUpdate,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedPayment.id);

      if (error) throw error;

      const displayStatus = statusToUpdate === 'approved' || statusToUpdate === 'completed' ? 'Approved' : 
                           statusToUpdate === 'rejected' || statusToUpdate === 'failed' ? 'Rejected' : 
                           statusToUpdate === 'refunded' ? 'Refunded' : 'Pending';
      
      showAlert('success', `Payment ${displayStatus} successfully`);
      handleCloseStatusDialog();
      fetchAllPayments();
      fetchStats();
    } catch (error) {
      console.error('❌ Error updating payment status:', error);
      showAlert('error', 'Failed to update payment status: ' + (error.message || 'Unknown error'));
    } finally {
      setStatusUpdateLoading(false);
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

  // Display status chip
  const getStatusChip = (payment) => {
    const status = payment.display_status || payment.status;
    const source = payment.source;
    let displayLabel = status;
    let color = 'default';
    let icon = <PendingIcon />;
    
    if (source === 'admin') {
      if (status === 'approved') {
        displayLabel = 'Approved';
        color = 'success';
        icon = <CheckCircleIcon />;
      } else if (status === 'rejected') {
        displayLabel = 'Rejected';
        color = 'error';
        icon = <CancelIcon />;
      } else if (status === 'pending') {
        displayLabel = 'Pending';
        color = 'warning';
        icon = <PendingIcon />;
      } else if (status === 'refunded') {
        displayLabel = 'Refunded';
        color = 'default';
        icon = <CancelIcon />;
      }
    } else {
      // Self payments
      if (status === 'completed') {
        displayLabel = 'Approved';
        color = 'success';
        icon = <CheckCircleIcon />;
      } else if (status === 'failed') {
        displayLabel = 'Rejected';
        color = 'error';
        icon = <CancelIcon />;
      } else if (status === 'pending') {
        displayLabel = 'Pending';
        color = 'warning';
        icon = <PendingIcon />;
      } else if (status === 'refunded') {
        displayLabel = 'Refunded';
        color = 'default';
        icon = <CancelIcon />;
      }
    }

    return (
      <Chip
        icon={icon}
        label={displayLabel}
        size="small"
        color={color}
        sx={{ fontFamily: '"Inter", sans-serif' }}
      />
    );
  };

  const getPaymentTypeLabel = (type) => {
    const types = {
      registration: 'Registration',
      renewal: 'Renewal',
      annual_subscription: 'Annual Subscription',
      first: 'First Payment',
      other: 'Other'
    };
    return types[type] || type;
  };

  const getSourceChip = (source) => {
    const config = {
      admin: { icon: <AdminIcon />, label: 'Admin Created', color: '#15e420' },
      self: { icon: <PersonIcon />, label: 'Self Registration', color: '#1976d2' }
    };
    const sourceConfig = config[source] || config.admin;
    return (
      <Chip
        icon={sourceConfig.icon}
        label={sourceConfig.label}
        size="small"
        sx={{ 
          fontFamily: '"Inter", sans-serif',
          backgroundColor: sourceConfig.color + '20',
          color: sourceConfig.color,
          fontWeight: 500
        }}
      />
    );
  };

  const isPaymentPending = (payment) => {
    return payment.display_status === 'pending' || payment.status === 'pending';
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

      <Box sx={{ display: 'flex', bgcolor: '#f8f9fa', minHeight: '100vh' }}>
        <AdminSidebar />
        
        <Box sx={{ flex: 1, p: { xs: 2, md: 3 } }}>
          <Container maxWidth="xl" sx={{ py: { xs: 1, md: 2 } }}>
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
                  Manage all payments from admin-created and self-registered organizations
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
                          Total Revenue
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

            {/* Source Filter Tabs */}
            <Paper sx={{ p: 2, mb: 3, borderRadius: '12px' }}>
              <Tabs
                value={sourceFilter}
                onChange={handleSourceFilter}
                sx={{ mb: 2 }}
              >
                <Tab label="All Payments" value="all" />
                <Tab 
                  label={
                    <Badge 
                      badgeContent={stats.adminPayments} 
                      color="primary"
                      invisible={stats.adminPayments === 0}
                    >
                      Admin Created
                    </Badge>
                  } 
                  value="admin" 
                />
                <Tab 
                  label={
                    <Badge 
                      badgeContent={stats.selfPayments} 
                      color="secondary"
                      invisible={stats.selfPayments === 0}
                    >
                      Self Registered
                    </Badge>
                  } 
                  value="self" 
                />
              </Tabs>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <TextField
                  placeholder="Search by company, email, reference or reg number..."
                  value={searchTerm}
                  onChange={handleSearch}
                  size="small"
                  sx={{ flex: 1, minWidth: 200 }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon sx={{ color: '#15e420' }} />
                      </InputAdornment>
                    ),
                  }}
                />
                <FormControl size="small" sx={{ minWidth: 150 }}>
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={statusFilter}
                    onChange={handleStatusFilter}
                    label="Status"
                  >
                    <MenuItem value="all">All Status</MenuItem>
                    <MenuItem value="pending">Pending</MenuItem>
                    <MenuItem value="approved">Approved</MenuItem>
                    <MenuItem value="rejected">Rejected</MenuItem>
                    <MenuItem value="refunded">Refunded</MenuItem>
                  </Select>
                </FormControl>
                <FormControl size="small" sx={{ minWidth: 150 }}>
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
                    <MenuItem value="first">First Payment</MenuItem>
                    <MenuItem value="other">Other</MenuItem>
                  </Select>
                </FormControl>
                <Button
                  variant="outlined"
                  startIcon={<RefreshIcon />}
                  onClick={() => { fetchAllPayments(); fetchStats(); }}
                  sx={{ borderColor: '#15e420', color: '#15e420' }}
                >
                  Refresh
                </Button>
              </Box>
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
                      <TableCell sx={{ fontFamily: '"Inter", sans-serif', fontWeight: 600 }}>Source</TableCell>
                      <TableCell sx={{ fontFamily: '"Inter", sans-serif', fontWeight: 600 }}>Date</TableCell>
                      <TableCell sx={{ fontFamily: '"Inter", sans-serif', fontWeight: 600 }}>Status</TableCell>
                      <TableCell sx={{ fontFamily: '"Inter", sans-serif', fontWeight: 600 }}>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {payments.map((payment) => {
                      const isPending = isPaymentPending(payment);
                      const isAdmin = payment.source === 'admin';
                      
                      return (
                        <TableRow key={`${payment.source}-${payment.id}`} hover>
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
                            ₦{parseFloat(payment.amount)?.toLocaleString()}
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={getPaymentTypeLabel(payment.payment_type)}
                              size="small"
                              sx={{ backgroundColor: '#e8f5e9', color: '#15e420', fontFamily: '"Inter", sans-serif' }}
                            />
                          </TableCell>
                          <TableCell>
                            {getSourceChip(payment.source)}
                          </TableCell>
                          <TableCell sx={{ fontFamily: '"Inter", sans-serif' }}>
                            {new Date(payment.payment_date || payment.created_at).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            {getStatusChip(payment)}
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
                              {/* Only show approve/reject for self payments that are pending */}
                              {!isAdmin && isPending && (
                                <>
                                  <Tooltip title="Approve Payment">
                                    <IconButton
                                      size="small"
                                      onClick={() => handleOpenStatusDialog(payment, 'approved')}
                                      sx={{ color: '#28a745' }}
                                    >
                                      <CheckCircleIcon fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                  <Tooltip title="Reject Payment">
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
                              {isAdmin && (
                                <Tooltip title="Admin Payment - Auto Approved">
                                  <Chip
                                    size="small"
                                    label="Auto"
                                    sx={{ 
                                      height: '20px', 
                                      fontSize: '0.6rem',
                                      backgroundColor: '#e8f5e9',
                                      color: '#2e7d32'
                                    }}
                                  />
                                </Tooltip>
                              )}
                            </Box>
                          </TableCell>
                        </TableRow>
                      );
                    })}
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
          </Container>
        </Box>
      </Box>

      {/* Record Payment Dialog - Professional Design */}
      <Dialog 
        open={paymentDialogOpen} 
        onClose={handleClosePaymentDialog}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '16px',
            boxShadow: '0 20px 60px rgba(0,0,0,0.15)'
          }
        }}
      >
        <DialogTitle sx={{ 
          fontFamily: '"Poppins", sans-serif',
          fontWeight: 600,
          fontSize: '1.5rem',
          borderBottom: '1px solid #f0f0f0',
          pb: 2,
          display: 'flex',
          alignItems: 'center',
          gap: 2
        }}>
          <Avatar sx={{ bgcolor: '#15e420', width: 40, height: 40 }}>
            <PaymentIcon />
          </Avatar>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Record Payment
            </Typography>
            <Typography variant="caption" sx={{ color: '#666' }}>
              Record a payment for an organization (Auto-approved)
            </Typography>
          </Box>
          <IconButton onClick={handleClosePaymentDialog} sx={{ ml: 'auto' }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          {uploading && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="body2" sx={{ mb: 1, fontFamily: '"Inter", sans-serif', color: '#666' }}>
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
          
          <Alert severity="info" sx={{ mb: 3, borderRadius: '8px' }}>
            <Typography variant="body2">
              <strong>Note:</strong> Admin payments are automatically approved. No further verification is needed.
            </Typography>
          </Alert>

          <Grid container spacing={3}>
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
                      startAdornment: (
                        <>
                          <InputAdornment position="start">
                            <BusinessIcon sx={{ color: '#15e420' }} />
                          </InputAdornment>
                          {params.InputProps.startAdornment}
                        </>
                      ),
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
                label="Amount"
                type="number"
                required
                value={paymentForm.amount}
                onChange={(e) => handlePaymentFormChange('amount', e.target.value)}
                error={!!formErrors.amount}
                helperText={formErrors.amount}
                InputProps={{ 
                  startAdornment: <InputAdornment position="start">₦</InputAdornment>,
                  inputProps: { min: 0, step: 0.01 }
                }}
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
                  <MenuItem value="first">First Payment</MenuItem>
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
                label="Payment Reference"
                value={paymentForm.payment_reference}
                onChange={(e) => handlePaymentFormChange('payment_reference', e.target.value)}
                placeholder="Leave empty for auto-generation"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <ReceiptIcon sx={{ color: '#666' }} />
                    </InputAdornment>
                  ),
                }}
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
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, fontFamily: '"Inter", sans-serif' }}>
                Payment Receipt (Optional)
              </Typography>
              <DropZone
                className={isDragging ? 'dragging' : ''}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  accept="image/*,.pdf"
                  style={{ display: 'none' }}
                />
                {paymentForm.receipt_file ? (
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
                    <FilePresentIcon sx={{ fontSize: 40, color: '#15e420' }} />
                    <Box sx={{ textAlign: 'left' }}>
                      <Typography variant="body1" sx={{ fontWeight: 500, fontFamily: '"Inter", sans-serif' }}>
                        {paymentForm.receipt_file.name}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#666', fontFamily: '"Inter", sans-serif' }}>
                        {(paymentForm.receipt_file.size / 1024).toFixed(1)} KB
                      </Typography>
                      <Button
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePaymentFormChange('receipt_file', null);
                        }}
                        sx={{ ml: 2, color: '#dc3545' }}
                      >
                        Remove
                      </Button>
                    </Box>
                  </Box>
                ) : (
                  <Box>
                    <UploadIcon sx={{ fontSize: 48, color: '#15e420', mb: 1 }} />
                    <Typography variant="body1" sx={{ fontWeight: 500, fontFamily: '"Inter", sans-serif' }}>
                      Drop file here or click to browse
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#666', fontFamily: '"Inter", sans-serif' }}>
                      Supported formats: JPEG, PNG, GIF, PDF (Max 5MB)
                    </Typography>
                  </Box>
                )}
              </DropZone>
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
            startIcon={uploading ? <CircularProgress size={20} color="inherit" /> : <CheckIcon />}
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
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ bgcolor: '#15e420', width: 40, height: 40 }}>
                  <ReceiptIcon />
                </Avatar>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  Payment Details
                </Typography>
              </Box>
              <IconButton onClick={handleCloseViewDialog} size="small">
                <CloseIcon />
              </IconButton>
            </DialogTitle>
            <DialogContent sx={{ pt: 3 }}>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                    {getSourceChip(selectedPayment.source)}
                    {getStatusChip(selectedPayment)}
                    {selectedPayment.source === 'admin' && (
                      <Chip
                        size="small"
                        label="Auto-Approved"
                        icon={<CheckIcon />}
                        sx={{ backgroundColor: '#e8f5e9', color: '#2e7d32' }}
                      />
                    )}
                  </Box>
                </Grid>

                <Grid item xs={12}>
                  <Divider />
                </Grid>

                <Grid item xs={12} md={6}>
                  <Typography variant="overline" sx={{ color: '#666', fontFamily: '"Inter", sans-serif' }}>
                    Payment Reference
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600, fontFamily: '"Inter", sans-serif' }}>
                    {selectedPayment.payment_reference}
                  </Typography>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Typography variant="overline" sx={{ color: '#666', fontFamily: '"Inter", sans-serif' }}>
                    Amount
                  </Typography>
                  <Typography variant="h5" sx={{ fontFamily: '"Inter", sans-serif', color: '#15e420', fontWeight: 700 }}>
                    ₦{parseFloat(selectedPayment.amount)?.toLocaleString()}
                  </Typography>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Typography variant="overline" sx={{ color: '#666', fontFamily: '"Inter", sans-serif' }}>
                    Organization
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500, fontFamily: '"Inter", sans-serif' }}>
                    {selectedPayment.organizations?.company_name || 'N/A'}
                  </Typography>
                  {selectedPayment.organizations?.registration_number && (
                    <Typography variant="caption" sx={{ color: '#666' }}>
                      Reg: {selectedPayment.organizations.registration_number}
                    </Typography>
                  )}
                </Grid>

                <Grid item xs={12} md={6}>
                  <Typography variant="overline" sx={{ color: '#666', fontFamily: '"Inter", sans-serif' }}>
                    Payment Type
                  </Typography>
                  <Chip
                    label={getPaymentTypeLabel(selectedPayment.payment_type)}
                    size="small"
                    sx={{ backgroundColor: '#e8f5e9', color: '#15e420', fontFamily: '"Inter", sans-serif' }}
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <Typography variant="overline" sx={{ color: '#666', fontFamily: '"Inter", sans-serif' }}>
                    Payment Method
                  </Typography>
                  <Typography variant="body1" sx={{ fontFamily: '"Inter", sans-serif' }}>
                    {selectedPayment.payment_method || 'N/A'}
                  </Typography>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Typography variant="overline" sx={{ color: '#666', fontFamily: '"Inter", sans-serif' }}>
                    Payment Date
                  </Typography>
                  <Typography variant="body1" sx={{ fontFamily: '"Inter", sans-serif' }}>
                    {new Date(selectedPayment.payment_date || selectedPayment.created_at).toLocaleDateString()}
                  </Typography>
                </Grid>

                {selectedPayment.payment_year && (
                  <Grid item xs={12} md={6}>
                    <Typography variant="overline" sx={{ color: '#666', fontFamily: '"Inter", sans-serif' }}>
                      Payment Year
                    </Typography>
                    <Typography variant="body1" sx={{ fontFamily: '"Inter", sans-serif' }}>
                      {selectedPayment.payment_year}
                    </Typography>
                  </Grid>
                )}

                <Grid item xs={12} md={6}>
                  <Typography variant="overline" sx={{ color: '#666', fontFamily: '"Inter", sans-serif' }}>
                    Created At
                  </Typography>
                  <Typography variant="body1" sx={{ fontFamily: '"Inter", sans-serif' }}>
                    {new Date(selectedPayment.created_at).toLocaleString()}
                  </Typography>
                </Grid>

                {selectedPayment.receipt_path && (
                  <Grid item xs={12}>
                    <Divider sx={{ mb: 2 }} />
                    <Typography variant="overline" sx={{ color: '#666', fontFamily: '"Inter", sans-serif' }}>
                      Receipt
                    </Typography>
                    <Box sx={{ mt: 1, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                      <Button
                        variant="contained"
                        startIcon={<DownloadIcon />}
                        onClick={() => handleDownloadReceipt(selectedPayment)}
                        sx={{
                          backgroundColor: '#15e420',
                          textTransform: 'none',
                          '&:hover': { backgroundColor: '#12c21e' }
                        }}
                      >
                        Download Receipt
                      </Button>
                      <Button
                        variant="outlined"
                        startIcon={<VisibilityIcon />}
                        onClick={() => {
                          const { data: { publicUrl } } = supabase.storage
                            .from('organization-docs')
                            .getPublicUrl(selectedPayment.receipt_path);
                          window.open(publicUrl, '_blank');
                        }}
                        sx={{ borderColor: '#15e420', color: '#15e420', textTransform: 'none' }}
                      >
                        View Receipt
                      </Button>
                    </Box>
                  </Grid>
                )}

                {/* Show approve/reject actions for pending self payments */}
                {selectedPayment.source === 'self' && isPaymentPending(selectedPayment) && (
                  <Grid item xs={12}>
                    <Divider sx={{ mb: 2 }} />
                    <Alert severity="warning" sx={{ mb: 2 }}>
                      <Typography variant="body2">
                        This payment needs your approval before it can be finalized.
                      </Typography>
                    </Alert>
                    <Box sx={{ display: 'flex', gap: 2 }}>
                      <Button
                        variant="contained"
                        startIcon={<CheckCircleIcon />}
                        onClick={() => {
                          handleCloseViewDialog();
                          handleOpenStatusDialog(selectedPayment, 'approved');
                        }}
                        sx={{
                          backgroundColor: '#28a745',
                          textTransform: 'none',
                          '&:hover': { backgroundColor: '#218838' }
                        }}
                      >
                        Approve Payment
                      </Button>
                      <Button
                        variant="contained"
                        startIcon={<CancelIcon />}
                        onClick={() => {
                          handleCloseViewDialog();
                          handleOpenStatusDialog(selectedPayment, 'rejected');
                        }}
                        sx={{
                          backgroundColor: '#dc3545',
                          textTransform: 'none',
                          '&:hover': { backgroundColor: '#c82333' }
                        }}
                      >
                        Reject Payment
                      </Button>
                    </Box>
                  </Grid>
                )}

                {selectedPayment.source === 'admin' && (
                  <Grid item xs={12}>
                    <Divider sx={{ mb: 2 }} />
                    <Alert severity="success">
                      <Typography variant="body2">
                        <strong>Admin Payment:</strong> This payment was created by an admin and is automatically approved.
                      </Typography>
                    </Alert>
                  </Grid>
                )}
              </Grid>
            </DialogContent>
            <DialogActions sx={{ p: 3, borderTop: '1px solid #f0f0f0' }}>
              <Button 
                onClick={handleCloseViewDialog}
                sx={{ 
                  color: '#666',
                  fontFamily: '"Inter", sans-serif',
                  textTransform: 'none'
                }}
              >
                Close
              </Button>
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
          fontSize: '1.25rem',
          display: 'flex',
          alignItems: 'center',
          gap: 2
        }}>
          <Avatar sx={{ 
            bgcolor: newStatus === 'approved' ? '#28a745' : 
                     newStatus === 'rejected' ? '#dc3545' : 
                     '#ffc107',
            width: 40,
            height: 40
          }}>
            {newStatus === 'approved' ? <CheckIcon /> : 
             newStatus === 'rejected' ? <ClearIcon /> : 
             <PendingIcon />}
          </Avatar>
          Confirm Status Update
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ fontFamily: '"Inter", sans-serif', color: '#666', mb: 2 }}>
            Are you sure you want to mark this payment as{' '}
            <strong style={{ 
              color: newStatus === 'approved' ? '#28a745' : 
                     newStatus === 'rejected' ? '#dc3545' : 
                     '#ffc107' 
            }}>
              {newStatus === 'approved' ? 'Approved' : 
               newStatus === 'rejected' ? 'Rejected' : 
               newStatus === 'refunded' ? 'Refunded' : 'Pending'}
            </strong>?
          </Typography>
          {selectedPayment && (
            <Box sx={{ p: 2, backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2" sx={{ color: '#666' }}>Reference</Typography>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>{selectedPayment.payment_reference}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2" sx={{ color: '#666' }}>Amount</Typography>
                <Typography variant="body2" sx={{ fontWeight: 600, color: '#15e420' }}>
                  ₦{parseFloat(selectedPayment.amount)?.toLocaleString()}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2" sx={{ color: '#666' }}>Organization</Typography>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  {selectedPayment.organizations?.company_name || 'N/A'}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" sx={{ color: '#666' }}>Source</Typography>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  {selectedPayment.source_label || selectedPayment.source}
                </Typography>
              </Box>
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
            disabled={statusUpdateLoading}
            startIcon={statusUpdateLoading ? <CircularProgress size={20} color="inherit" /> : 
              newStatus === 'approved' ? <CheckIcon /> : 
              newStatus === 'rejected' ? <ClearIcon /> : 
              <PendingIcon />}
            sx={{
              backgroundColor: newStatus === 'approved' ? '#28a745' : 
                             newStatus === 'rejected' ? '#dc3545' : 
                             '#ffc107',
              color: newStatus === 'pending' ? '#333' : '#fff',
              fontFamily: '"Inter", sans-serif',
              textTransform: 'none',
              fontWeight: 600,
              borderRadius: '8px',
              px: 4,
              '&:hover': {
                backgroundColor: newStatus === 'approved' ? '#218838' : 
                               newStatus === 'rejected' ? '#c82333' : 
                               '#e0a800'
              }
            }}
          >
            {statusUpdateLoading ? 'Processing...' : `Confirm ${newStatus === 'approved' ? 'Approval' : 
                     newStatus === 'rejected' ? 'Rejection' : 
                     newStatus === 'refunded' ? 'Refund' : 'Pending'}`}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default AdminPayments;