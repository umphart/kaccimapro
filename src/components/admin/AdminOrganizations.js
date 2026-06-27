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
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  Checkbox,
  Tabs,
  Tab,
  Badge,
  LinearProgress
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
  Person as PersonIcon,
  Description as DescriptionIcon,
  Payment as PaymentIcon,
  Verified as VerifiedIcon,
  Download as DownloadIcon,
  Close as CloseIcon,
  ThumbUp as ThumbUpIcon,
  ThumbDown as ThumbDownIcon,
  Receipt as ReceiptIcon,
  SelectAll as SelectAllIcon,
  ClearAll as ClearAllIcon
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
  const [stats, setStats] = useState({ 
    total: 0, 
    pending: 0, 
    pendingReferee: 0, 
    pendingReview: 0, 
    approved: 0, 
    rejected: 0 
  });
  
  // Approval Dialog
  const [approvalDialogOpen, setApprovalDialogOpen] = useState(false);
  const [approvalLoading, setApprovalLoading] = useState(false);
  const [approvalNote, setApprovalNote] = useState('');
  const [approvalStep, setApprovalStep] = useState(0);
  const [documentsData, setDocumentsData] = useState([]);
  const [paymentData, setPaymentData] = useState(null);
  const [selectedDocs, setSelectedDocs] = useState([]);
  
  // Multi Document Verification Dialog
  const [docVerificationOpen, setDocVerificationOpen] = useState(false);
  const [docVerificationLoading, setDocVerificationLoading] = useState(false);
  const [selectAllDocs, setSelectAllDocs] = useState(false);

  // Payment Verification Dialog
  const [paymentVerificationOpen, setPaymentVerificationOpen] = useState(false);
  const [paymentVerificationLoading, setPaymentVerificationLoading] = useState(false);

  useEffect(() => {
    if (filter === 'pending') setStatusFilter('pending');
    else if (filter === 'pending_referee') setStatusFilter('pending_referee');
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

      // Fetch documents and payments for each organization
      const orgsWithData = await Promise.all(
        (data || []).map(async (org) => {
          // Fetch documents
          const { data: docData, error: docError } = await supabase
            .from('organization_documents')
            .select('*')
            .eq('organization_id', org.id);

          if (docError) {
            return { ...org, documents: [], payments: [] };
          }

          // Fetch payments from BOTH tables
          let payments = [];
          
          // 1. From admin_organization_payments
          const { data: adminPayments, error: adminPayError } = await supabase
            .from('admin_organization_payments')
            .select('*')
            .eq('organization_id', org.id);

          if (!adminPayError && adminPayments) {
            payments = [...payments, ...adminPayments.map(p => ({ ...p, source: 'admin' }))];
          }

          // 2. From payments (self registrations)
          const { data: selfPayments, error: selfPayError } = await supabase
            .from('payments')
            .select('*')
            .eq('organization_id', org.id);

          if (!selfPayError && selfPayments) {
            payments = [...payments, ...selfPayments.map(p => ({ ...p, source: 'self' }))];
          }

          // Sort payments by created_at descending
          payments.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

          return { 
            ...org, 
            documents: docData || [], 
            payments: payments || []
          };
        })
      );

      setOrganizations(orgsWithData);
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

      const { data: pendingRefereeData } = await supabase
        .from('organizations_registry')
        .select('id', { count: 'exact', head: false })
        .eq('status', 'pending')
        .eq('registration_type', 'self')
        .eq('referee_confirmed', false);

      const pendingRefereeCount = pendingRefereeData?.length || 0;

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
        pendingReferee: pendingRefereeCount || 0,
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
  // MULTI DOCUMENT VERIFICATION
  // ============================================================
  
  const handleOpenDocVerification = (org) => {
    setSelectedOrg(org);
    setDocumentsData(org.documents || []);
    setSelectedDocs(org.documents?.filter(d => d.is_verified).map(d => d.id) || []);
    setSelectAllDocs(org.documents?.every(d => d.is_verified) || false);
    setDocVerificationOpen(true);
  };

  const handleCloseDocVerification = () => {
    setDocVerificationOpen(false);
    setSelectedOrg(null);
    setDocumentsData([]);
    setSelectedDocs([]);
    setSelectAllDocs(false);
  };

  const handleDocToggle = (docId) => {
    setSelectedDocs(prev => 
      prev.includes(docId) 
        ? prev.filter(id => id !== docId)
        : [...prev, docId]
    );
  };

  const handleSelectAllDocs = () => {
    if (selectAllDocs) {
      setSelectedDocs([]);
    } else {
      setSelectedDocs(documentsData.map(d => d.id));
    }
    setSelectAllDocs(!selectAllDocs);
  };

  const handleVerifySelectedDocs = async () => {
    if (selectedDocs.length === 0) {
      showAlert('warning', 'Please select at least one document to verify');
      return;
    }

    setDocVerificationLoading(true);
    try {
      let verifiedCount = 0;
      let errorCount = 0;

      for (const docId of selectedDocs) {
        const { error } = await supabase
          .from('organization_documents')
          .update({ 
            is_verified: true,
            status: 'verified',
            updated_at: new Date().toISOString()
          })
          .eq('id', docId);

        if (error) {
          errorCount++;
          console.error(`Error verifying doc ${docId}:`, error);
        } else {
          verifiedCount++;
        }
      }

      if (errorCount > 0) {
        showAlert('warning', `${verifiedCount} document(s) verified, ${errorCount} failed`);
      } else {
        showAlert('success', `${verifiedCount} document(s) verified successfully`);
      }

      handleCloseDocVerification();
      fetchOrganizations();
    } catch (error) {
      console.error('Error verifying documents:', error);
      showAlert('error', 'Failed to verify documents: ' + error.message);
    } finally {
      setDocVerificationLoading(false);
    }
  };

  const handleRejectSelectedDocs = async () => {
    if (selectedDocs.length === 0) {
      showAlert('warning', 'Please select at least one document to reject');
      return;
    }

    setDocVerificationLoading(true);
    try {
      let rejectedCount = 0;
      let errorCount = 0;

      for (const docId of selectedDocs) {
        const { error } = await supabase
          .from('organization_documents')
          .update({ 
            is_verified: false,
            status: 'rejected',
            updated_at: new Date().toISOString()
          })
          .eq('id', docId);

        if (error) {
          errorCount++;
          console.error(`Error rejecting doc ${docId}:`, error);
        } else {
          rejectedCount++;
        }
      }

      if (errorCount > 0) {
        showAlert('warning', `${rejectedCount} document(s) rejected, ${errorCount} failed`);
      } else {
        showAlert('success', `${rejectedCount} document(s) rejected successfully`);
      }

      handleCloseDocVerification();
      fetchOrganizations();
    } catch (error) {
      console.error('Error rejecting documents:', error);
      showAlert('error', 'Failed to reject documents: ' + error.message);
    } finally {
      setDocVerificationLoading(false);
    }
  };

  // ============================================================
  // PAYMENT VERIFICATION - BOTH TABLES
  // ============================================================
  
  const handleOpenPaymentVerification = (org) => {
    setSelectedOrg(org);
    // Find the first pending payment from either table
    const pendingPayment = org.payments?.find(p => p.status === 'pending');
    if (pendingPayment) {
      setPaymentData(pendingPayment);
      setPaymentVerificationOpen(true);
    } else {
      showAlert('info', 'No pending payment found for this organization');
    }
  };

  const handleClosePaymentVerification = () => {
    setPaymentVerificationOpen(false);
    setSelectedOrg(null);
    setPaymentData(null);
  };

  const handleVerifyPayment = async (paymentId, isApproved) => {
    setPaymentVerificationLoading(true);
    try {
      const table = paymentData?.source === 'admin' ? 'admin_organization_payments' : 'payments';
      // Map status correctly for each table
      let status;
      if (table === 'payments') {
        status = isApproved ? 'completed' : 'failed';
      } else {
        status = isApproved ? 'approved' : 'rejected';
      }

      const { error } = await supabase
        .from(table)
        .update({ 
          status: status,
          updated_at: new Date().toISOString()
        })
        .eq('id', paymentId);

      if (error) throw error;

      showAlert('success', `Payment ${isApproved ? 'approved' : 'rejected'} successfully`);
      handleClosePaymentVerification();
      fetchOrganizations();
    } catch (error) {
      console.error('Error verifying payment:', error);
      showAlert('error', 'Failed to verify payment: ' + error.message);
    } finally {
      setPaymentVerificationLoading(false);
    }
  };

  const getPaymentSourceLabel = (source) => {
    return source === 'admin' ? 'Admin Created' : 'Self Registration';
  };

  const getPaymentStatusColor = (status) => {
    if (status === 'approved' || status === 'completed') return 'success';
    if (status === 'pending') return 'warning';
    if (status === 'rejected' || status === 'failed') return 'error';
    return 'default';
  };

  const getPaymentStatusLabel = (status) => {
    if (status === 'approved') return 'Approved';
    if (status === 'completed') return 'Completed';
    if (status === 'pending') return 'Pending';
    if (status === 'rejected') return 'Rejected';
    if (status === 'failed') return 'Failed';
    return status;
  };

  // ============================================================
  // ORGANIZATION APPROVAL
  // ============================================================
  
  const handleOpenApproval = (org) => {
    // Check if organization is ready for approval
    if (org.registration_type === 'self' && !org.referee_confirmed) {
      showAlert('error', 'Cannot approve: Referee confirmation is still pending.');
      return;
    }

    // Check if all documents are verified
    const allDocsVerified = org.documents && org.documents.length > 0 && 
      org.documents.every(d => d.is_verified === true);

    if (!allDocsVerified) {
      showAlert('error', 'Cannot approve: All documents must be verified first.');
      return;
    }

    // Check if payment is verified
    const paymentVerified = org.payments && org.payments.some(p => 
      p.status === 'approved' || p.status === 'completed'
    );

    if (!paymentVerified) {
      showAlert('error', 'Cannot approve: Payment verification is required.');
      return;
    }

    setSelectedOrg(org);
    setDocumentsData(org.documents || []);
    setPaymentData(org.payments?.find(p => p.status === 'approved' || p.status === 'completed') || null);
    setApprovalStep(0);
    setApprovalNote('');
    setApprovalDialogOpen(true);
  };

  const handleCloseApproval = () => {
    setApprovalDialogOpen(false);
    setSelectedOrg(null);
    setApprovalNote('');
    setApprovalStep(0);
    setDocumentsData([]);
    setPaymentData(null);
  };

  const getApprovalSteps = () => {
    if (!selectedOrg) return [];
    
    const allDocsVerified = documentsData.length > 0 && 
      documentsData.every(d => d.is_verified === true);
    const hasPayment = paymentData !== null;
    const isRefereeConfirmed = selectedOrg.registration_type === 'admin' || selectedOrg.referee_confirmed;
    
    return [
      {
        label: 'Review Organization Details',
        description: 'Verify company information and contact details',
        completed: true
      },
      {
        label: 'Referee Confirmation',
        description: isRefereeConfirmed ? 'Referee confirmed ✓' : 'Awaiting referee confirmation',
        completed: isRefereeConfirmed
      },
      {
        label: 'Document Verification',
        description: allDocsVerified ? `${documentsData.length} documents verified` : 'Pending document verification',
        completed: allDocsVerified
      },
      {
        label: 'Payment Verification',
        description: hasPayment ? 'Payment verified ✓' : 'Payment pending verification',
        completed: hasPayment
      }
    ];
  };

  const handleApproveOrganization = async () => {
    if (!selectedOrg) return;

    setApprovalLoading(true);
    try {
      // Verify all conditions
      const allDocsVerified = documentsData.length > 0 && 
        documentsData.every(d => d.is_verified === true);
      const hasPayment = paymentData !== null;
      const isRefereeConfirmed = selectedOrg.registration_type === 'admin' || selectedOrg.referee_confirmed;

      if (!allDocsVerified) {
        showAlert('error', 'Cannot approve: All documents must be verified.');
        setApprovalLoading(false);
        return;
      }

      if (!hasPayment) {
        showAlert('error', 'Cannot approve: Payment verification is required.');
        setApprovalLoading(false);
        return;
      }

      if (!isRefereeConfirmed) {
        showAlert('error', 'Cannot approve: Referee confirmation is pending.');
        setApprovalLoading(false);
        return;
      }

      // ✅ All conditions met - approve
      const { error: updateError } = await supabase
        .from('organizations_registry')
        .update({ 
          status: 'approved',
          approved_date: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedOrg.id);

      if (updateError) throw updateError;

      // Log approval
      const { data: { user } } = await supabase.auth.getUser();
      await supabase
        .from('registration_audit_log')
        .insert([{
          organization_id: selectedOrg.id,
          action: 'organization_approved',
          new_data: { 
            status: 'approved',
            approved_by: user?.id,
            note: approvalNote || 'No additional notes',
            documents_verified: documentsData.length,
            payment_verified: true,
            referee_confirmed: isRefereeConfirmed,
            payment_reference: paymentData?.payment_reference
          },
          created_at: new Date().toISOString()
        }]);

      showAlert('success', 'Organization approved successfully! All conditions met.');
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

  // ============================================================
  // RENDER FUNCTIONS
  // ============================================================
  
  const getStatusChip = (org) => {
    const status = org.status;
    let label = '';
    let icon = null;
    let color = '';

    if (status === 'approved') {
      label = 'Approved';
      icon = <CheckCircleIcon />;
      color = '#2e7d32';
    } else if (status === 'pending_review') {
      label = 'Pending Review';
      icon = <ApprovalIcon />;
      color = '#e65100';
    } else if (status === 'rejected') {
      label = 'Rejected';
      icon = <CancelIcon />;
      color = '#c62828';
    } else if (status === 'pending') {
      if (org.registration_type === 'self' && !org.referee_confirmed) {
        label = 'Awaiting Referee';
        icon = <PersonIcon />;
        color = '#0d47a1';
      } else {
        label = 'Pending';
        icon = <PendingIcon />;
        color = '#e65100';
      }
    } else {
      label = 'Pending';
      icon = <PendingIcon />;
      color = '#e65100';
    }

    return (
      <Chip 
        icon={icon} 
        label={label} 
        size="small"
        sx={{ 
          borderRadius: '20px',
          height: '24px',
          fontSize: '0.7rem',
          fontWeight: 500,
          backgroundColor: 
            label === 'Approved' ? '#e8f5e9' :
            label === 'Pending Review' ? '#fff3e0' :
            label === 'Awaiting Referee' ? '#e3f2fd' :
            label === 'Rejected' ? '#ffebee' :
            '#fff3e0',
          color: color,
          '& .MuiChip-icon': {
            fontSize: '14px'
          }
        }}
      />
    );
  };

  const getRefereeStatusChip = (org) => {
    if (org.registration_type === 'admin') {
      return <Chip label="N/A" size="small" color="default" sx={{ height: '20px', fontSize: '0.65rem' }} />;
    }
    
    if (org.referee_confirmed) {
      return <Chip 
        icon={<CheckCircleIcon />} 
        label="Confirmed" 
        size="small" 
        color="success" 
        sx={{ height: '20px', fontSize: '0.65rem' }} 
      />;
    }
    
    if (org.status === 'pending' && org.registration_type === 'self') {
      return <Chip 
        icon={<PendingIcon />} 
        label="Awaiting" 
        size="small" 
        color="warning" 
        sx={{ height: '20px', fontSize: '0.65rem' }} 
      />;
    }
    
    return <Chip 
      icon={<CancelIcon />} 
      label="Not Required" 
      size="small" 
      color="default" 
      sx={{ height: '20px', fontSize: '0.65rem' }} 
    />;
  };

  const getDocumentChips = (documents) => {
    if (!documents || documents.length === 0) {
      return <Chip size="small" label="No documents" color="default" sx={{ height: '20px', fontSize: '0.65rem' }} />;
    }

    const verified = documents.filter(d => d.is_verified).length;
    const pending = documents.filter(d => !d.is_verified && d.status !== 'rejected').length;
    const rejected = documents.filter(d => d.status === 'rejected').length;
    
    const chips = [];
    
    if (verified > 0) {
      chips.push(
        <Chip key="verified" size="small" label={`${verified} verified`} color="success" sx={{ height: '20px', fontSize: '0.65rem' }} />
      );
    }
    
    if (pending > 0) {
      chips.push(
        <Chip key="pending" size="small" label={`${pending} pending`} color="warning" sx={{ height: '20px', fontSize: '0.65rem' }} />
      );
    }
    
    if (rejected > 0) {
      chips.push(
        <Chip key="rejected" size="small" label={`${rejected} rejected`} color="error" sx={{ height: '20px', fontSize: '0.65rem' }} />
      );
    }
    
    if (chips.length === 0 && documents.length > 0) {
      return <Chip size="small" label={`${documents.length} uploaded`} color="info" sx={{ height: '20px', fontSize: '0.65rem' }} />;
    }
    
    return chips;
  };

  const getPaymentStatusChip = (payments) => {
    if (!payments || payments.length === 0) {
      return <Chip size="small" label="No payment" color="default" sx={{ height: '20px', fontSize: '0.65rem' }} />;
    }
    
    const approved = payments.some(p => p.status === 'approved' || p.status === 'completed');
    const pending = payments.some(p => p.status === 'pending');
    
    if (approved) {
      return <Chip size="small" label="Paid ✓" color="success" sx={{ height: '20px', fontSize: '0.65rem' }} />;
    }
    
    if (pending) {
      return <Chip size="small" label="Pending" color="warning" sx={{ height: '20px', fontSize: '0.65rem' }} />;
    }
    
    return <Chip size="small" label="Failed" color="error" sx={{ height: '20px', fontSize: '0.65rem' }} />;
  };

  const getPaymentSourceChip = (source) => {
    const label = source === 'admin' ? 'Admin' : 'Self';
    const color = source === 'admin' ? '#15e420' : '#1976d2';
    return (
      <Chip 
        size="small" 
        label={label} 
        sx={{ 
          height: '18px', 
          fontSize: '0.55rem',
          backgroundColor: color + '20',
          color: color,
          fontWeight: 600
        }} 
      />
    );
  };

  const canApprove = (org) => {
    if (org.registration_type === 'admin') return true;
    if (org.registration_type === 'self') {
      return org.referee_confirmed === true;
    }
    return false;
  };

  const isReadyForApproval = (org) => {
    const allDocsVerified = org.documents && org.documents.length > 0 && 
      org.documents.every(d => d.is_verified === true);
    const paymentApproved = org.payments && org.payments.some(p => 
      p.status === 'approved' || p.status === 'completed'
    );
    const refereeOk = org.registration_type === 'admin' || org.referee_confirmed;
    return allDocsVerified && paymentApproved && refereeOk;
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
                      <Avatar sx={{ bgcolor: '#1976d2', width: 40, height: 40 }}>
                        <PersonIcon />
                      </Avatar>
                      <Box>
                        <Typography variant="body2" sx={{ color: '#666', fontWeight: 500 }}>Awaiting Referee</Typography>
                        <Typography variant="h6" sx={{ fontWeight: 700 }}>{stats.pendingReferee}</Typography>
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
                    <MenuItem value="pending_referee">Awaiting Referee</MenuItem>
                    <MenuItem value="pending_review">Pending Review</MenuItem>
                    <MenuItem value="approved">Approved</MenuItem>
                    <MenuItem value="rejected">Rejected</MenuItem>
                  </Select>
                </FormControl>
                <Button
                  variant="outlined"
                  startIcon={<RefreshIcon />}
                  onClick={() => { fetchOrganizations(); fetchStats(); }}
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
                      <TableCell sx={{ fontWeight: 600, fontSize: '0.8rem' }}>Status</TableCell>
                      <TableCell sx={{ fontWeight: 600, fontSize: '0.8rem' }}>Referee</TableCell>
                      <TableCell sx={{ fontWeight: 600, fontSize: '0.8rem' }}>Documents</TableCell>
                      <TableCell sx={{ fontWeight: 600, fontSize: '0.8rem' }}>Payment</TableCell>
                      <TableCell sx={{ fontWeight: 600, fontSize: '0.8rem' }}>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {organizations.length > 0 ? (
                      organizations.map((org, index) => {
                        const isPending = org.status === 'pending' || org.status === 'pending_review' || org.status === 'pending_referee';
                        const canApproveOrg = canApprove(org);
                        const readyForApproval = isReadyForApproval(org);
                        const allDocsVerified = org.documents && org.documents.length > 0 && 
                          org.documents.every(d => d.is_verified === true);
                        const paymentApproved = org.payments && org.payments.some(p => 
                          p.status === 'approved' || p.status === 'completed'
                        );
                        
                        return (
                          <TableRow key={org.id} hover>
                            <TableCell sx={{ fontSize: '0.8rem', color: '#999' }}>
                              {page * rowsPerPage + index + 1}
                            </TableCell>
                            <TableCell sx={{ fontSize: '0.85rem', fontWeight: 500 }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                                {org.company_name}
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
                                {isPending && !allDocsVerified && org.documents.length > 0 && (
                                  <Tooltip title="Some documents need verification">
                                    <WarningIcon sx={{ color: '#ff9800', fontSize: '16px' }} />
                                  </Tooltip>
                                )}
                                {isPending && !paymentApproved && org.payments.length > 0 && (
                                  <Tooltip title="Payment needs verification">
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
                            <TableCell>{getStatusChip(org)}</TableCell>
                            <TableCell>{getRefereeStatusChip(org)}</TableCell>
                            <TableCell>
                              <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                                {getDocumentChips(org.documents)}
                              </Box>
                            </TableCell>
                            <TableCell>
                              <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                                {getPaymentStatusChip(org.payments)}
                                {org.payments && org.payments.length > 0 && (
                                  <Tooltip title={`Source: ${getPaymentSourceLabel(org.payments[0]?.source)}`}>
                                    {getPaymentSourceChip(org.payments[0]?.source)}
                                  </Tooltip>
                                )}
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
                                {isPending && (
                                  <>
                                    {org.documents && org.documents.length > 0 && (
                                      <Tooltip title="Verify Documents (Multi-select)">
                                        <IconButton
                                          size="small"
                                          onClick={() => handleOpenDocVerification(org)}
                                          sx={{ color: '#2196f3' }}
                                        >
                                          <DescriptionIcon fontSize="small" />
                                        </IconButton>
                                      </Tooltip>
                                    )}
                                    {org.payments && org.payments.length > 0 && (
                                      <Tooltip title="Verify Payment">
                                        <IconButton
                                          size="small"
                                          onClick={() => handleOpenPaymentVerification(org)}
                                          sx={{ color: '#ff9800' }}
                                        >
                                          <PaymentIcon fontSize="small" />
                                        </IconButton>
                                      </Tooltip>
                                    )}
                                    <Tooltip title={canApproveOrg && readyForApproval ? "Approve Organization" : 
                                      !canApproveOrg ? "Awaiting Referee Confirmation" : "Missing requirements"}>
                                      <span>
                                        <IconButton
                                          size="small"
                                          onClick={() => handleOpenApproval(org)}
                                          disabled={!canApproveOrg || !readyForApproval}
                                          sx={{ color: (canApproveOrg && readyForApproval) ? '#28a745' : '#999' }}
                                        >
                                          <CheckCircleIcon fontSize="small" />
                                        </IconButton>
                                      </span>
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

      {/* Organization Details Dialog */}
      <OrganizationDetailsDialog
        open={detailsDialogOpen}
        onClose={handleCloseDetails}
        organization={selectedOrg}
        navigate={navigate}
      />

      {/* Multi Document Verification Dialog */}
      <Dialog
        open={docVerificationOpen}
        onClose={handleCloseDocVerification}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: '16px' } }}
      >
        <DialogTitle sx={{ bgcolor: '#f8f9fa', borderBottom: '1px solid #e0e0e0' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Document Verification
            </Typography>
            <IconButton onClick={handleCloseDocVerification} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          {selectedOrg && (
            <>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                {selectedOrg.company_name}
              </Typography>
              <Typography variant="caption" sx={{ color: '#666', display: 'block', mb: 2 }}>
                Select documents to verify or reject. {selectedDocs.length} selected
              </Typography>
              
              <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                <Button
                  size="small"
                  startIcon={<SelectAllIcon />}
                  onClick={handleSelectAllDocs}
                  variant="outlined"
                  sx={{ textTransform: 'none' }}
                >
                  {selectAllDocs ? 'Deselect All' : 'Select All'}
                </Button>
                <Button
                  size="small"
                  startIcon={<ThumbUpIcon />}
                  onClick={handleVerifySelectedDocs}
                  disabled={selectedDocs.length === 0 || docVerificationLoading}
                  variant="contained"
                  sx={{ 
                    backgroundColor: '#28a745',
                    textTransform: 'none',
                    '&:hover': { backgroundColor: '#218838' }
                  }}
                >
                  Verify Selected
                </Button>
                <Button
                  size="small"
                  startIcon={<ThumbDownIcon />}
                  onClick={handleRejectSelectedDocs}
                  disabled={selectedDocs.length === 0 || docVerificationLoading}
                  variant="contained"
                  sx={{ 
                    backgroundColor: '#dc3545',
                    textTransform: 'none',
                    '&:hover': { backgroundColor: '#c82333' }
                  }}
                >
                  Reject Selected
                </Button>
              </Box>

              {docVerificationLoading && (
                <LinearProgress sx={{ mb: 2, height: 6, borderRadius: 3 }} />
              )}

              <List>
                {documentsData.map((doc) => (
                  <ListItem 
                    key={doc.id}
                    sx={{ 
                      border: '1px solid #f0f0f0', 
                      borderRadius: '8px', 
                      mb: 1,
                      backgroundColor: doc.is_verified ? '#e8f5e9' : 
                                      doc.status === 'rejected' ? '#ffebee' : '#fff',
                      opacity: doc.status === 'rejected' ? 0.7 : 1
                    }}
                  >
                    <ListItemIcon>
                      <Checkbox
                        checked={selectedDocs.includes(doc.id)}
                        onChange={() => handleDocToggle(doc.id)}
                        disabled={doc.is_verified || doc.status === 'rejected'}
                      />
                      <DescriptionIcon />
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {doc.document_type?.replace(/_/g, ' ').toUpperCase()}
                          </Typography>
                          <Chip 
                            size="small"
                            label={doc.is_verified ? 'Verified' : doc.status === 'rejected' ? 'Rejected' : 'Pending'}
                            color={doc.is_verified ? 'success' : doc.status === 'rejected' ? 'error' : 'warning'}
                            sx={{ height: '20px', fontSize: '0.6rem' }}
                          />
                        </Box>
                      }
                      secondary={
                        <Box>
                          <Typography variant="caption" sx={{ display: 'block', color: '#666' }}>
                            {doc.file_name}
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#999' }}>
                            Uploaded: {new Date(doc.uploaded_at).toLocaleDateString()}
                          </Typography>
                        </Box>
                      }
                    />
                    <ListItemSecondaryAction>
                      {doc.file_url && (
                        <Tooltip title="View Document">
                          <IconButton
                            size="small"
                            onClick={() => window.open(doc.file_url, '_blank')}
                            sx={{ color: '#15e420' }}
                          >
                            <VisibilityIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
              </List>
              
              {documentsData.length === 0 && (
                <Alert severity="info">
                  <Typography variant="body2">No documents uploaded for this organization.</Typography>
                </Alert>
              )}
            </>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3, borderTop: '1px solid #e0e0e0' }}>
          <Button onClick={handleCloseDocVerification} variant="outlined" sx={{ textTransform: 'none' }}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Payment Verification Dialog */}
      <Dialog
        open={paymentVerificationOpen}
        onClose={handleClosePaymentVerification}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: '16px' } }}
      >
        <DialogTitle sx={{ bgcolor: '#f8f9fa', borderBottom: '1px solid #e0e0e0' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Payment Verification
            </Typography>
            <IconButton onClick={handleClosePaymentVerification} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          {selectedOrg && paymentData && (
            <>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
                {selectedOrg.company_name}
              </Typography>
              
              <Box sx={{ mb: 2 }}>
                <Chip 
                  label={`Source: ${getPaymentSourceLabel(paymentData.source)}`}
                  size="small"
                  sx={{ 
                    backgroundColor: paymentData.source === 'admin' ? '#e8f5e9' : '#e3f2fd',
                    color: paymentData.source === 'admin' ? '#2e7d32' : '#0d47a1'
                  }}
                />
              </Box>

              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" sx={{ color: '#666', fontWeight: 600 }}>
                    Payment Reference
                  </Typography>
                  <Typography variant="body1" sx={{ mb: 2 }}>
                    <Chip
                      label={paymentData.payment_reference || 'N/A'}
                      size="small"
                      sx={{ backgroundColor: '#f0f0f0' }}
                    />
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" sx={{ color: '#666', fontWeight: 600 }}>
                    Amount
                  </Typography>
                  <Typography variant="h6" sx={{ mb: 2, color: '#15e420' }}>
                    ₦{Number(paymentData.amount)?.toLocaleString()}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" sx={{ color: '#666', fontWeight: 600 }}>
                    Payment Method
                  </Typography>
                  <Typography variant="body1" sx={{ mb: 2 }}>
                    {paymentData.payment_method || 'N/A'}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" sx={{ color: '#666', fontWeight: 600 }}>
                    Payment Type
                  </Typography>
                  <Typography variant="body1" sx={{ mb: 2 }}>
                    {paymentData.payment_type || 'N/A'}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" sx={{ color: '#666', fontWeight: 600 }}>
                    Payment Date
                  </Typography>
                  <Typography variant="body1" sx={{ mb: 2 }}>
                    {paymentData.payment_date ? new Date(paymentData.payment_date).toLocaleDateString() : 'N/A'}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" sx={{ color: '#666', fontWeight: 600 }}>
                    Status
                  </Typography>
                  <Box sx={{ mt: 0.5 }}>
                    <Chip
                      label={getPaymentStatusLabel(paymentData.status)}
                      color={getPaymentStatusColor(paymentData.status)}
                      size="small"
                    />
                  </Box>
                </Grid>
                {paymentData.receipt_path && (
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" sx={{ color: '#666', fontWeight: 600 }}>
                      Receipt
                    </Typography>
                    <Button
                      variant="outlined"
                      startIcon={<DownloadIcon />}
                      onClick={() => {
                        const { data: { publicUrl } } = supabase.storage
                          .from('organization-docs')
                          .getPublicUrl(paymentData.receipt_path);
                        window.open(publicUrl, '_blank');
                      }}
                      sx={{ mt: 1, borderColor: '#15e420', color: '#15e420' }}
                    >
                      View Receipt
                    </Button>
                  </Grid>
                )}
              </Grid>
              
              <Alert severity="info" sx={{ mt: 2 }}>
                <Typography variant="body2">
                  Payment must be verified before the organization can be approved.
                </Typography>
              </Alert>
            </>
          )}
          {selectedOrg && !paymentData && (
            <Alert severity="warning">
              <Typography variant="body2">No pending payment found for this organization.</Typography>
            </Alert>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3, borderTop: '1px solid #e0e0e0' }}>
          <Button onClick={handleClosePaymentVerification} variant="outlined" sx={{ textTransform: 'none' }}>
            Close
          </Button>
          {paymentData && paymentData.status === 'pending' && (
            <>
              <Button
                variant="contained"
                onClick={() => handleVerifyPayment(paymentData.id, true)}
                disabled={paymentVerificationLoading}
                sx={{
                  backgroundColor: '#28a745',
                  textTransform: 'none',
                  '&:hover': { backgroundColor: '#218838' }
                }}
              >
                {paymentVerificationLoading ? 'Processing...' : 'Approve Payment'}
              </Button>
              <Button
                variant="contained"
                onClick={() => handleVerifyPayment(paymentData.id, false)}
                disabled={paymentVerificationLoading}
                sx={{
                  backgroundColor: '#dc3545',
                  textTransform: 'none',
                  '&:hover': { backgroundColor: '#c82333' }
                }}
              >
                Reject Payment
              </Button>
            </>
          )}
        </DialogActions>
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

              {/* Summary of requirements */}
              <Alert 
                severity={documentsData.every(d => d.is_verified) && paymentData !== null ? 'success' : 'warning'} 
                sx={{ mb: 2 }}
              >
                <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
                  Approval Requirements Status:
                </Typography>
                <ul style={{ margin: '4px 0', paddingLeft: '20px' }}>
                  <li>
                    {selectedOrg.registration_type === 'admin' ? '✅ Admin created' : 
                     selectedOrg.referee_confirmed ? '✅ Referee confirmed' : '❌ Referee pending'}
                  </li>
                  <li>
                    {documentsData.length > 0 && documentsData.every(d => d.is_verified) 
                      ? `✅ ${documentsData.length} documents verified` 
                      : `❌ ${documentsData.filter(d => d.is_verified).length}/${documentsData.length} documents verified`}
                  </li>
                  <li>
                    {paymentData !== null 
                      ? `✅ Payment verified (${paymentData.payment_reference})` 
                      : '❌ Payment not verified'}
                  </li>
                </ul>
              </Alert>

              {paymentData && (
                <Box sx={{ mb: 2, p: 2, backgroundColor: '#f5f5f5', borderRadius: '8px' }}>
                  <Typography variant="caption" sx={{ color: '#666' }}>
                    Payment Source: {getPaymentSourceLabel(paymentData.source)}
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    Reference: {paymentData.payment_reference} | Amount: ₦{Number(paymentData.amount)?.toLocaleString()}
                  </Typography>
                </Box>
              )}

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
                  <li>All required documents have been verified ✓</li>
                  <li>Payment has been verified ✓</li>
                  {selectedOrg.registration_type === 'self' && (
                    <li>{selectedOrg.referee_confirmed ? '✅ Referee has confirmed' : '⚠️ Referee confirmation pending'}</li>
                  )}
                  <li>The organization meets all membership requirements</li>
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