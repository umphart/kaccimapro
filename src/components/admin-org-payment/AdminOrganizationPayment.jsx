// components/admin-org-payment/AdminOrganizationPayment.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '../../supabaseClient';
import {
  Box,
  CircularProgress,
  Container,
  Paper,
  Typography,
  Alert as MuiAlert,
  Snackbar,
  Button,
  IconButton,
  Chip,
  Stepper,
  Step,
  StepLabel,
  useMediaQuery,
  useTheme,
  Card,
  CardContent,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  Divider
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Payment as PaymentIcon,
  CloudUpload as CloudUploadIcon,
  CheckCircle as CheckCircleIcon,
  Verified as VerifiedIcon,
  Pending as PendingIcon,
  Visibility as VisibilityIcon,
  Download as DownloadIcon,
  AccountBalance as AccountBalanceIcon,
  Receipt as ReceiptIcon,
  Schedule as ScheduleIcon
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import AdminOrgSidebar from '../admin-org-dashboard/AdminOrgSidebar';
import { sendAdminPaymentNotification } from '../../utils/emailService';

// Constants
const PAYMENT_CONSTANTS = {
  FIRST_PAYMENT: 25000,
  RENEWAL_AMOUNT: 15000,
  REGISTRATION_FEE: 10000,
  SUBSCRIPTION_FEE: 15000,
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_FILE_TYPES: ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf']
};

const PAYMENT_TYPES = {
  FIRST: 'first',
  RENEWAL: 'renewal',
  NOT_DUE: 'not_due'
};

const PAYMENT_STATUS = {
  APPROVED: 'approved',
  ACCEPTED: 'accepted',
  PENDING: 'pending',
  REJECTED: 'rejected'
};

const PAYMENT_STEPS = [
  { label: 'Review Payment Summary', description: 'Confirm your payment details and amount' },
  { label: 'Make Bank Transfer', description: 'Transfer the exact amount to the provided bank account' },
  { label: 'Upload Payment Receipt', description: 'Upload your payment receipt for verification' },
  { label: 'Submit for Verification', description: 'Our team will verify your payment within 24-48 hours' }
];

// Styled Components
const PaymentContainer = styled(motion.div)({
  maxWidth: '100%',
  margin: '0 auto',
  padding: '2rem',
  fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif"
});

const ActionButton = styled(Button)({
  padding: '0.75rem 1.5rem',
  borderRadius: '8px',
  fontWeight: 600,
  textTransform: 'none',
  fontSize: '1rem',
  transition: 'all 0.3s ease',
  '&.primary': {
    background: 'linear-gradient(135deg, #15e420 0%, #0fa819 100%)',
    color: 'white',
    '&:hover': {
      transform: 'translateY(-2px)',
      boxShadow: '0 10px 30px rgba(21, 228, 32, 0.3)'
    }
  },
  '&.outline': {
    border: '2px solid #15e420',
    color: '#15e420',
    background: 'transparent',
    '&:hover': {
      background: 'rgba(21, 228, 32, 0.05)',
      transform: 'translateY(-2px)'
    }
  }
});

const StatusChip = styled(Chip)(({ status }) => ({
  backgroundColor: status === 'approved' || status === 'accepted' ? '#d4edda' :
                  status === 'pending' ? '#fff3e0' :
                  status === 'rejected' ? '#ffebee' : '#f0f0f0',
  color: status === 'approved' || status === 'accepted' ? '#28a745' :
         status === 'pending' ? '#ff9800' :
         status === 'rejected' ? '#dc3545' : '#666',
  fontWeight: 600
}));

const UploadArea = styled(Box)({
  border: '2px dashed #ccc',
  borderRadius: '16px',
  padding: '2rem',
  textAlign: 'center',
  background: '#fafafa',
  cursor: 'pointer',
  transition: 'all 0.3s ease',
  '&:hover': {
    borderColor: '#15e420',
    background: '#e8f5e9'
  }
});

const AdminOrganizationPayment = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  // State
  const [user, setUser] = useState(null);
  const [organization, setOrganization] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [alert, setAlert] = useState({ open: false, type: 'success', message: '' });
  
  // Payment state
  const [receiptFile, setReceiptFile] = useState(null);
  const [fileName, setFileName] = useState('');
  const [filePreview, setFilePreview] = useState(null);
  const [paymentType, setPaymentType] = useState(PAYMENT_TYPES.FIRST);
  const [paymentAmount, setPaymentAmount] = useState(PAYMENT_CONSTANTS.FIRST_PAYMENT);
  const [previousPayments, setPreviousPayments] = useState([]);
  const [lastPaymentDate, setLastPaymentDate] = useState(null);
  const [nextRenewalDate, setNextRenewalDate] = useState(null);
  const [isRenewalDue, setIsRenewalDue] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [membershipStatus, setMembershipStatus] = useState('pending');
  
  // Modal state
  const [selectedHistoryPayment, setSelectedHistoryPayment] = useState(null);
  const [historyModalOpen, setHistoryModalOpen] = useState(false);

  // Computed values
  const isNotDue = paymentType === PAYMENT_TYPES.NOT_DUE;
  const isFirstPayment = paymentType === PAYMENT_TYPES.FIRST;
  const isRenewal = paymentType === PAYMENT_TYPES.RENEWAL;

  // Effects
  useEffect(() => {
    checkUser();
  }, []);

  useEffect(() => {
    if (user) {
      loadOrganizationData();
    }
  }, [user, location.state]);

  // Helper functions
  const showAlert = useCallback((type, message) => {
    setAlert({ open: true, type, message });
  }, []);

  const handleCloseAlert = useCallback(() => {
    setAlert(prev => ({ ...prev, open: false }));
  }, []);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN'
    }).format(amount);
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-NG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const validateFile = (file) => {
    if (!file) return { valid: false, error: 'No file selected' };
    
    if (file.size > PAYMENT_CONSTANTS.MAX_FILE_SIZE) {
      return { valid: false, error: 'File size must be less than 5MB' };
    }
    
    if (!PAYMENT_CONSTANTS.ALLOWED_FILE_TYPES.includes(file.type)) {
      return { valid: false, error: 'Please upload a JPG, PNG, or PDF file' };
    }
    
    return { valid: true, error: null };
  };

  const checkUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/login');
      } else {
        setUser(user);
      }
    } catch (error) {
      console.error('Error checking user:', error);
      navigate('/login');
    }
  };

  const loadOrganizationData = async () => {
    try {
      let orgData = null;

      // Check by organization_id in metadata
      if (user.user_metadata?.organization_id) {
        const { data } = await supabase
          .from('organizations_registry')
          .select('*')
          .eq('id', user.user_metadata.organization_id)
          .maybeSingle();
        if (data) orgData = data;
      }

      // Check by created_by
      if (!orgData) {
        const { data } = await supabase
          .from('organizations_registry')
          .select('*')
          .eq('created_by', user.id)
          .maybeSingle();
        if (data) orgData = data;
      }

      // Check by email
      if (!orgData && user.email) {
        const { data } = await supabase
          .from('organizations_registry')
          .select('*')
          .eq('email', user.email)
          .maybeSingle();
        if (data) orgData = data;
      }

      if (orgData) {
        setOrganization(orgData);
        setMembershipStatus(orgData.status || 'pending');
        await checkPaymentHistory(orgData.id);
      } else {
        showAlert('error', 'Organization not found. Please contact admin.');
        setTimeout(() => navigate('/admin-org-dashboard'), 2000);
      }
    } catch (error) {
      console.error('Error:', error);
      showAlert('error', 'Failed to load organization data');
    } finally {
      setLoading(false);
    }
  };

  const checkPaymentHistory = async (orgId) => {
    try {
      const { data, error } = await supabase
        .from('admin_organization_payments')
        .select('*')
        .eq('organization_id', orgId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setPreviousPayments(data || []);

      // Check for approved/active payments
      const approvedPayments = data?.filter(p => 
        p.status === PAYMENT_STATUS.APPROVED || p.status === PAYMENT_STATUS.ACCEPTED
      ) || [];
      
      const lastApproved = approvedPayments[0];

      if (lastApproved) {
        const lastPaymentDate = new Date(lastApproved.created_at);
        setLastPaymentDate(lastPaymentDate);
        
        // Calculate renewal date (1 year from last payment)
        const paymentYear = lastPaymentDate.getFullYear();
        const renewalDate = new Date(paymentYear + 1, 0, 1);
        setNextRenewalDate(renewalDate);

        const now = new Date();
        const isDue = now >= renewalDate;
        setIsRenewalDue(isDue);

        if (isDue) {
          setPaymentType(PAYMENT_TYPES.RENEWAL);
          setPaymentAmount(PAYMENT_CONSTANTS.RENEWAL_AMOUNT);
        } else {
          setPaymentType(PAYMENT_TYPES.NOT_DUE);
          setPaymentAmount(0);
        }
      } else {
        // No approved payments found - first time payment
        setPaymentType(PAYMENT_TYPES.FIRST);
        setPaymentAmount(PAYMENT_CONSTANTS.FIRST_PAYMENT);
        setIsRenewalDue(false);
      }
      
      setActiveStep(0);
    } catch (error) {
      console.error('Error checking payment history:', error);
    }
  };

  const handleFileChange = (file) => {
    if (!file) return;

    const validation = validateFile(file);
    if (!validation.valid) {
      showAlert('error', validation.error);
      return;
    }

    setReceiptFile(file);
    setFileName(file.name);
    
    // Create preview for images
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFilePreview(reader.result);
      };
      reader.readAsDataURL(file);
    } else {
      setFilePreview(null);
    }
    
    setActiveStep(3);
  };

  const handleViewReceipt = async (payment) => {
    try {
      const { data } = supabase.storage
        .from('documents')
        .getPublicUrl(payment.receipt_path);
      
      setSelectedHistoryPayment({
        ...payment,
        url: data.publicUrl
      });
      setHistoryModalOpen(true);
    } catch (error) {
      console.error('Error getting receipt URL:', error);
      showAlert('error', 'Could not load receipt');
    }
  };

  const handleDownloadReceipt = async (payment) => {
    try {
      const { data, error } = await supabase.storage
        .from('documents')
        .download(payment.receipt_path);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = `payment_receipt_${payment.id}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading receipt:', error);
      showAlert('error', 'Failed to download receipt');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!user || !organization) {
      showAlert('error', 'Please login first');
      navigate('/login');
      return;
    }

    if (!receiptFile) {
      showAlert('error', 'Please select a receipt file');
      return;
    }

    if (isNotDue) {
      showAlert('error', 'No payment is due at this time');
      return;
    }

    setSubmitting(true);

    try {
      // Upload receipt to Supabase Storage
      const timestamp = Date.now();
      const cleanFileName = receiptFile.name.replace(/[^a-zA-Z0-9.]/g, '_');
      const filePath = `${user.id}/receipts/${timestamp}_${cleanFileName}`;
      
      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, receiptFile);

      if (uploadError) {
        throw new Error(`Upload failed: ${uploadError.message}`);
      }

      // Create payment record in admin_organization_payments
      const paymentData = {
        organization_id: organization.id,
        user_id: user.id,
        amount: paymentAmount,
        payment_method: 'Bank Transfer',
        receipt_path: filePath,
        receipt_filename: receiptFile.name,
        status: PAYMENT_STATUS.PENDING,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { error: paymentError } = await supabase
        .from('admin_organization_payments')
        .insert([paymentData]);

      if (paymentError) {
        throw new Error(paymentError.message);
      }

      // Send admin notification email
      try {
        await sendAdminPaymentNotification(paymentData, organization);
      } catch (emailError) {
        console.warn('Email notification failed:', emailError);
      }

      showAlert('success', 'Payment submitted successfully! Redirecting to dashboard...');
      
      setTimeout(() => {
        navigate('/admin-org-dashboard');
      }, 2000);

    } catch (error) {
      console.error('Payment process error:', error);
      showAlert('error', error.message || 'Failed to process payment');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress style={{ color: '#15e420' }} />
      </Box>
    );
  }

  if (!organization) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px" flexDirection="column">
        <CircularProgress style={{ color: '#15e420' }} />
        <Typography sx={{ mt: 2, color: '#666' }}>Loading organization data...</Typography>
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
        <MuiAlert onClose={handleCloseAlert} severity={alert.type} sx={{ width: '100%' }}>
          {alert.message}
        </MuiAlert>
      </Snackbar>

      <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#f5f7fa' }}>
        <AdminOrgSidebar organization={organization} membershipStatus={membershipStatus} />
        
        <Box sx={{ flex: 1, overflow: 'auto' }}>
          <Container maxWidth="xl" sx={{ py: 4 }}>
            <PaymentContainer
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              {/* Header */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
                <IconButton 
                  onClick={() => navigate('/admin-org-dashboard')}
                  sx={{ 
                    color: '#15e420', 
                    bgcolor: 'white',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                    '&:hover': { bgcolor: '#f0f0f0' }
                  }}
                >
                  <ArrowBackIcon />
                </IconButton>
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 700, color: '#333', mb: 0.5 }}>
                    {isNotDue ? 'Membership Status' : isRenewal ? 'Annual Renewal' : 'First Time Payment'}
                  </Typography>
                  <Typography variant="body1" sx={{ color: '#666' }}>
                    {organization?.company_name}
                  </Typography>
                </Box>
              </Box>

              {/* Status Card */}
              <motion.div
                initial={{ scale: 0.95 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2 }}
              >
                <Paper sx={{ p: 4, borderRadius: '24px', mb: 4, textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
                  <Box sx={{ 
                    position: 'absolute', top: 0, left: 0, right: 0, height: '4px',
                    background: isNotDue ? 'linear-gradient(90deg, #15e420, #0fa819)' : 'linear-gradient(90deg, #ffc107, #ff9800)'
                  }} />
                  
                  <Box sx={{ 
                    width: 100, height: 100, borderRadius: '50%', 
                    bgcolor: isNotDue ? 'rgba(21,228,32,0.1)' : 'rgba(255,193,7,0.1)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    margin: '0 auto 1.5rem'
                  }}>
                    {isNotDue ? (
                      <VerifiedIcon sx={{ fontSize: '3.5rem', color: '#15e420' }} />
                    ) : isFirstPayment ? (
                      <PaymentIcon sx={{ fontSize: '3.5rem', color: '#ffc107' }} />
                    ) : (
                      <PendingIcon sx={{ fontSize: '3.5rem', color: '#ffc107' }} />
                    )}
                  </Box>
                  
                  <Typography variant="h5" sx={{ fontWeight: 700, color: '#333', mb: 1 }}>
                    {isFirstPayment ? 'First Time Payment Required' : 
                     isRenewal ? 'Annual Renewal Due' : 'Membership Active'}
                  </Typography>
                  
                  <Typography variant="body1" sx={{ color: '#666', mb: 2, maxWidth: 600, mx: 'auto' }}>
                    {isFirstPayment ? 'Complete your registration by making your first payment.' :
                     isRenewal ? 'Your annual renewal is due. Please complete payment to maintain your active membership status.' :
                     'Your membership is in good standing. No payment is required at this time.'}
                  </Typography>

                  {!isNotDue && (
                    <Chip
                      icon={isFirstPayment ? <PaymentIcon /> : <PendingIcon />}
                      label={`Amount Due: ${formatCurrency(paymentAmount)}`}
                      sx={{
                        bgcolor: 'rgba(21,228,32,0.1)',
                        color: '#15e420',
                        fontWeight: 600,
                        fontSize: '1rem',
                        p: 2
                      }}
                    />
                  )}
                </Paper>
              </motion.div>

              {/* Payment Summary */}
              <Paper sx={{ p: 4, borderRadius: '16px', mb: 4 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                  {isNotDue ? 'Membership Status' : isRenewal ? 'Annual Renewal Summary' : 'New Membership Summary'}
                </Typography>
                
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography color="textSecondary">Membership Type:</Typography>
                    <Typography fontWeight={500}>
                      {isNotDue ? 'Active Member' : isRenewal ? 'Annual Renewal' : 'New Member Registration'}
                    </Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography color="textSecondary">Company Name:</Typography>
                    <Typography fontWeight={500}>{organization?.company_name}</Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography color="textSecondary">Registration Number:</Typography>
                    <Typography fontWeight={500}>{organization?.registration_number || 'N/A'}</Typography>
                  </Box>
                  
                  {!isNotDue && (
                    <>
                      {!isRenewal && (
                        <>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Typography color="textSecondary">Registration Fee:</Typography>
                            <Typography fontWeight={500}>{formatCurrency(10000)}</Typography>
                          </Box>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Typography color="textSecondary">Subscription Fee:</Typography>
                            <Typography fontWeight={500}>{formatCurrency(15000)}</Typography>
                          </Box>
                        </>
                      )}
                      
                      <Divider />
                      
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography fontWeight={600}>Total Amount Due:</Typography>
                        <Typography fontWeight={700} color="#15e420" fontSize="1.2rem">
                          {formatCurrency(paymentAmount)}
                        </Typography>
                      </Box>
                    </>
                  )}
                </Box>
              </Paper>

              {/* Payment Process Stepper */}
              {!isNotDue && (
                <Paper sx={{ p: 3, borderRadius: '16px', mb: 4 }}>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <PaymentIcon sx={{ color: '#15e420' }} /> Payment Process
                  </Typography>
                  
                  <Stepper activeStep={activeStep} orientation={isMobile ? 'vertical' : 'horizontal'}>
                    {PAYMENT_STEPS.map((step) => (
                      <Step key={step.label}>
                        <StepLabel>
                          <Typography sx={{ fontWeight: 600 }}>{step.label}</Typography>
                        </StepLabel>
                      </Step>
                    ))}
                  </Stepper>
                </Paper>
              )}

              {/* Payment Form or Active Membership View */}
              {!isNotDue ? (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  {/* Bank Details */}
                  <Paper sx={{ p: 4, borderRadius: '16px', mb: 4 }}>
                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                      <AccountBalanceIcon sx={{ color: '#15e420' }} /> Bank Transfer Details
                    </Typography>
                    
                    <Box sx={{ bgcolor: '#f8f9fa', p: 3, borderRadius: '12px' }}>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography color="textSecondary">Bank:</Typography>
                          <Typography fontWeight={600}>Jaiz Bank</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography color="textSecondary">Account Name:</Typography>
                          <Typography fontWeight={600}>KANO CHAMBER OF COMMERCE, INDUSTRY, MINES AND AGRICULTURE</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography color="textSecondary">Account Number:</Typography>
                          <Typography fontWeight={600} color="#15e420" fontSize="1.2rem">0000374891</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography color="textSecondary">Amount to Transfer:</Typography>
                          <Typography fontWeight={700} color="#15e420">{formatCurrency(paymentAmount)}</Typography>
                        </Box>
                      </Box>
                    </Box>
                  </Paper>

                  {/* File Upload */}
                  <form onSubmit={handleSubmit}>
                    <Paper sx={{ p: 4, borderRadius: '16px', mb: 4 }}>
                      <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                        <CloudUploadIcon sx={{ color: '#15e420' }} /> Upload Payment Receipt
                      </Typography>
                      
                      <Typography variant="body2" sx={{ color: '#666', mb: 2 }}>
                        After making the transfer, upload your payment receipt here.
                        <br />
                        <small>Accepted formats: JPG, PNG, PDF (Max size: 5MB)</small>
                      </Typography>
                      
                      <input
                        type="file"
                        accept=".jpg,.jpeg,.png,.pdf"
                        onChange={(e) => handleFileChange(e.target.files[0])}
                        style={{ display: 'none' }}
                        id="receipt-file-input"
                      />
                      <label htmlFor="receipt-file-input">
                        <UploadArea>
                          {fileName ? (
                            <Box>
                              <CheckCircleIcon sx={{ fontSize: 48, color: '#15e420', mb: 1 }} />
                              <Typography variant="body1" sx={{ fontWeight: 600, color: '#15e420' }}>
                                {fileName}
                              </Typography>
                              <Typography variant="caption" color="textSecondary">
                                Click to change file
                              </Typography>
                              {filePreview && (
                                <Box sx={{ mt: 2, maxWidth: 200, mx: 'auto' }}>
                                  <img src={filePreview} alt="Preview" style={{ maxWidth: '100%', borderRadius: 8 }} />
                                </Box>
                              )}
                            </Box>
                          ) : (
                            <Box>
                              <CloudUploadIcon sx={{ fontSize: 48, color: '#15e420', mb: 1 }} />
                              <Typography variant="body1" sx={{ fontWeight: 500, mb: 1 }}>
                                Click to select file
                              </Typography>
                              <Typography variant="caption" color="textSecondary">
                                or drag and drop
                              </Typography>
                            </Box>
                          )}
                        </UploadArea>
                      </label>
                    </Paper>
                    
                    <ActionButton
                      type="submit"
                      className="primary"
                      disabled={submitting || !receiptFile}
                      fullWidth
                      size="large"
                      startIcon={submitting ? <CircularProgress size={20} color="inherit" /> : null}
                    >
                      {submitting ? 'Processing...' : 'Submit Payment Proof'}
                    </ActionButton>
                  </form>
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <Paper sx={{ p: 4, textAlign: 'center', borderRadius: '16px' }}>
                    <VerifiedIcon sx={{ fontSize: 80, color: '#15e420', mb: 2 }} />
                    <Typography variant="h5" sx={{ fontWeight: 700, color: '#333', mb: 2 }}>
                      Membership Active
                    </Typography>
                    <Typography variant="body1" sx={{ color: '#666', mb: 3 }}>
                      Your membership is active until {nextRenewalDate?.toLocaleDateString('en-NG', { 
                        year: 'numeric', month: 'long', day: 'numeric' 
                      })}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#999', mb: 3 }}>
                      Your next renewal will be due on January 1, {(nextRenewalDate?.getFullYear() || new Date().getFullYear() + 1)}.
                      You will receive a reminder 30 days before.
                    </Typography>
                    <ActionButton
                      onClick={() => navigate('/admin-org-dashboard')}
                      className="primary"
                    >
                      Return to Dashboard
                    </ActionButton>
                  </Paper>
                </motion.div>
              )}

              {/* Payment History */}
              {previousPayments.length > 0 && (
                <Paper sx={{ p: 4, borderRadius: '16px', mt: 4 }}>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <ReceiptIcon sx={{ color: '#15e420' }} /> Payment History
                  </Typography>
                  
                  <List>
                    {previousPayments.map((payment, index) => (
                      <React.Fragment key={payment.id}>
                        <ListItem
                          secondaryAction={
                            <Box sx={{ display: 'flex', gap: 1 }}>
                              <IconButton
                                size="small"
                                onClick={() => handleViewReceipt(payment)}
                                sx={{ color: '#15e420' }}
                              >
                                <VisibilityIcon />
                              </IconButton>
                              <IconButton
                                size="small"
                                onClick={() => handleDownloadReceipt(payment)}
                                sx={{ color: '#2196f3' }}
                              >
                                <DownloadIcon />
                              </IconButton>
                            </Box>
                          }
                        >
                          <ListItemText
                            primary={
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Typography variant="body2" fontWeight={600}>
                                  {formatCurrency(payment.amount)}
                                </Typography>
                                <StatusChip
                                  status={payment.status}
                                  label={payment.status}
                                  size="small"
                                />
                              </Box>
                            }
                            secondary={
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                                <ScheduleIcon sx={{ fontSize: 14 }} />
                                <Typography variant="caption">
                                  {formatDate(payment.created_at)}
                                </Typography>
                              </Box>
                            }
                          />
                        </ListItem>
                        {index < previousPayments.length - 1 && <Divider />}
                      </React.Fragment>
                    ))}
                  </List>
                </Paper>
              )}
            </PaymentContainer>
          </Container>
        </Box>
      </Box>

      {/* Receipt Modal */}
      <Dialog
        open={historyModalOpen}
        onClose={() => setHistoryModalOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Payment Receipt</DialogTitle>
        <DialogContent>
          {selectedHistoryPayment && (
            <Box>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="textSecondary">Amount</Typography>
                <Typography variant="h6">{formatCurrency(selectedHistoryPayment.amount)}</Typography>
              </Box>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="textSecondary">Status</Typography>
                <StatusChip status={selectedHistoryPayment.status} label={selectedHistoryPayment.status} />
              </Box>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="textSecondary">Date</Typography>
                <Typography>{formatDate(selectedHistoryPayment.created_at)}</Typography>
              </Box>
              {selectedHistoryPayment.url && (
                <Box sx={{ mt: 2 }}>
                  <img
                    src={selectedHistoryPayment.url}
                    alt="Receipt"
                    style={{ maxWidth: '100%', borderRadius: '8px' }}
                  />
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setHistoryModalOpen(false)}>Close</Button>
          {selectedHistoryPayment && (
            <Button
              onClick={() => handleDownloadReceipt(selectedHistoryPayment)}
              startIcon={<DownloadIcon />}
              sx={{ color: '#15e420' }}
            >
              Download
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </>
  );
};

export default AdminOrganizationPayment;