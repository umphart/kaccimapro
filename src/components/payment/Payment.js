import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '../../supabaseClient';
import PaymentSummary from './PaymentSummary';
import PaymentHeader from './PaymentHeader';
import PaymentStatusCard from './PaymentStatusCard';
import PaymentStepper from './PaymentStepper';
import BankDetailsCard from './BankDetailsCard';
import FileUploadArea from './FileUploadArea';
import PaymentHistory from './PaymentHistory';
import ReceiptModal from './ReceiptModal';
import {
  Box,
  CircularProgress,
  Container,
  Paper,
  Typography,
  Alert as MuiAlert,
  Snackbar,
  Button,
  useMediaQuery,
  useTheme
} from '@mui/material';
import { Verified as VerifiedIcon } from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import Sidebar from '../Sidebar';
import { sendAdminPaymentNotification } from '../../utils/emailService';
import {
  PAYMENT_CONSTANTS,
  PAYMENT_STEPS,
  PAYMENT_TYPES,
  PAYMENT_STATUS,
  FILE_CONSTANTS
} from './paymentConstants';
import {
  validateFile,
  formatCurrency,
  getStatusIcon,
  getStatusColor,
  calculatePaymentDetails
} from '../../utils/paymentUtils';
import './Payment.css';

// Styled Components
const PaymentContainer = styled(motion.div)({
  maxWidth: '1200px',
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

const Payment = () => {
  console.log('🗄️ Using table: organizations_registry');
  console.log('📁 Using storage bucket: documents');
  console.log('📝 Payment processing for organization registration');
  
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
    console.log('📋 Loading organization data from organizations_registry');
    
    try {
      let orgData;

      // First check if we have an organization ID from location state
      if (location.state?.organizationId) {
        console.log(`🔍 Looking up organization by ID: ${location.state.organizationId}`);
        
        const { data, error } = await supabase
          .from('organizations_registry')  // ✅ Using correct table
          .select('*')
          .eq('id', location.state.organizationId)
          .maybeSingle();  // ✅ Using maybeSingle() to avoid 406 error

        if (error) {
          console.error('❌ Error fetching organization:', error);
          throw error;
        }
        
        if (data) {
          orgData = data;
          console.log(`✅ Organization found: ${orgData.company_name} (${orgData.registration_number})`);
        } else {
          console.warn('⚠️ Organization not found with ID:', location.state.organizationId);
        }
      }
      
      // If not found by ID, try by user_id
      if (!orgData && user) {
        console.log(`🔍 Looking up organization by user_id: ${user.id}`);
        
        const { data, error } = await supabase
          .from('organizations_registry')  // ✅ Using correct table
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();  // ✅ Using maybeSingle()

        if (error) {
          console.error('❌ Error fetching organization by user:', error);
          throw error;
        }
        
        if (data) {
          orgData = data;
          console.log(`✅ Organization found by user: ${orgData.company_name} (${orgData.registration_number})`);
        } else {
          console.warn('⚠️ No organization found for user');
        }
      }

      if (orgData) {
        setOrganization(orgData);
        await checkPaymentHistory(orgData.id);
      } else {
        // Try to find organization from registration state
        const orgId = location.state?.organizationId;
        if (orgId) {
          showAlert('error', 'Organization not found. Please complete registration first.');
        } else {
          showAlert('error', 'Organization not found. Please register first.');
        }
        setTimeout(() => navigate('/organization-registration'), 3000);
      }
    } catch (error) {
      console.error('❌ Error loading organization:', error);
      showAlert('error', 'Failed to load organization data: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const checkPaymentHistory = async (orgId) => {
    console.log(`💳 Checking payment history for organization: ${orgId}`);
    
    try {
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .eq('organization_id', orgId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setPreviousPayments(data || []);
      console.log(`✅ Found ${data?.length || 0} payment records`);

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
          console.log('📅 Renewal payment due');
        } else {
          setPaymentType(PAYMENT_TYPES.NOT_DUE);
          setPaymentAmount(0);
          console.log('✅ Membership active, no payment due');
        }
      } else {
        // No approved payments found - first time registration
        setPaymentType(PAYMENT_TYPES.FIRST);
        setPaymentAmount(PAYMENT_CONSTANTS.FIRST_PAYMENT);
        setIsRenewalDue(false);
        console.log('🆕 First time registration - payment required');
      }
      
      setActiveStep(0);
    } catch (error) {
      console.error('❌ Error checking payment history:', error);
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
      console.log('💳 Submitting payment for organization:', organization.id);
      
      // Upload receipt to Supabase Storage
      const timestamp = Date.now();
      const cleanFileName = receiptFile.name.replace(/[^a-zA-Z0-9.]/g, '_');
      const fileName = `${timestamp}_${cleanFileName}`;
      const filePath = `${user.id}/receipts/${fileName}`;
      
      console.log('📤 Uploading receipt to:', filePath);
      
      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, receiptFile);

      if (uploadError) {
        throw new Error(`Upload failed: ${uploadError.message}`);
      }

      console.log('✅ Receipt uploaded successfully');

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

      console.log('💾 Saving payment record:', paymentData);

      const { error: paymentError, data: insertedPayment } = await supabase
        .from('payments')
        .insert([paymentData])
        .select()
        .single();

      if (paymentError) {
        throw new Error(paymentError.message);
      }

      console.log('✅ Payment record saved successfully');

      // Send admin notification email
      try {
        await sendAdminPaymentNotification(insertedPayment, organization);
        console.log('📧 Admin notification sent');
      } catch (emailError) {
        console.warn('⚠️ Email notification failed:', emailError);
        // Don't block payment submission if email fails
      }

      showAlert('success', 'Payment submitted successfully! Redirecting to dashboard...');
      
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);

    } catch (error) {
      console.error('❌ Payment process error:', error);
      showAlert('error', error.message || 'Failed to process payment');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress style={{ color: '#15e420' }} />
      </Box>
    );
  }

  if (!organization) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px" flexDirection="column">
        <CircularProgress style={{ color: '#15e420' }} />
        <p style={{ marginTop: '20px', color: '#666' }}>Loading organization data...</p>
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

      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', gap: 3 }}>
          <Sidebar />
          
          <Box sx={{ flex: 1, backgroundColor: '#f8fafc', borderRadius: '12px', border: '1px solid #eaeef2' }}>
            <PaymentContainer
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              {/* Header */}
              <PaymentHeader
                paymentType={paymentType}
                companyName={organization.company_name}
                onBack={() => navigate('/dashboard')}
              />

              {/* Status Card */}
              <PaymentStatusCard
                paymentType={paymentType}
                paymentAmount={paymentAmount}
                isFirstPayment={isFirstPayment}
                isRenewal={isRenewal}
                isNotDue={isNotDue}
              />

              {/* Payment Summary */}
              <PaymentSummary 
                organization={organization} 
                amount={paymentAmount} 
                paymentType={paymentType}
                previousPayments={previousPayments}
                lastPaymentDate={lastPaymentDate}
                nextRenewalDate={nextRenewalDate}
                isRenewalDue={isRenewalDue}
              />

              {/* Payment Process Stepper */}
              {!isNotDue && (
                <PaymentStepper
                  activeStep={activeStep}
                  steps={PAYMENT_STEPS}
                  isMobile={isMobile}
                />
              )}
              
              {/* Payment Form or Active Membership View */}
              {!isNotDue ? (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  {/* Bank Details */}
                  <BankDetailsCard
                    bankName="Jaiz Bank"
                    accountName="KANO CHAMBER OF COMMERCE, INDUSTRY, MINES AND AGRICULTURE"
                    accountNumber="0000374891"
                    amount={paymentAmount}
                  />
                  
                  <form onSubmit={handleSubmit}>
                    <FileUploadArea
                      fileName={fileName}
                      filePreview={filePreview}
                      onFileChange={handleFileChange}
                    />
                    
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
                      Your membership is active until {
                        nextRenewalDate?.toLocaleDateString('en-NG', { 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })
                      }
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#999', mb: 3 }}>
                      Your next renewal will be due on January 1, {(nextRenewalDate?.getFullYear() || new Date().getFullYear() + 1)}.
                      You will receive a reminder 30 days before.
                    </Typography>
                    <ActionButton
                      onClick={() => navigate('/dashboard')}
                      className="primary"
                    >
                      Return to Dashboard
                    </ActionButton>
                  </Paper>
                </motion.div>
              )}

              {/* Payment History */}
              {previousPayments.length > 0 && (
                <PaymentHistory
                  payments={previousPayments}
                  onViewReceipt={handleViewReceipt}
                  onDownloadReceipt={handleDownloadReceipt}
                />
              )}
            </PaymentContainer>
          </Box>
        </Box>
      </Container>

      {/* Receipt Modal */}
      <ReceiptModal
        open={historyModalOpen}
        onClose={() => setHistoryModalOpen(false)}
        payment={selectedHistoryPayment}
        onDownload={handleDownloadReceipt}
      />
    </>
  );
};

export default Payment;