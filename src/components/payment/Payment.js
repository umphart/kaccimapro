import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import PaymentSummary from './PaymentSummary';
import { Box, CircularProgress, Container, Paper, Typography, Alert as MuiAlert, Snackbar } from '@mui/material';
import Sidebar from '../Sidebar';
import './Payment.css';

const Payment = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [organization, setOrganization] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [alert, setAlert] = useState({ open: false, type: 'success', message: '' });
  const [receiptFile, setReceiptFile] = useState(null);
  const [fileName, setFileName] = useState('');
  const [paymentType, setPaymentType] = useState('first'); // 'first' or 'renewal'
  const [paymentAmount, setPaymentAmount] = useState(25000); // Default to first payment
  const [previousPayments, setPreviousPayments] = useState([]);
  const [lastPaymentDate, setLastPaymentDate] = useState(null);
  const [nextRenewalDate, setNextRenewalDate] = useState(null);
  const [isRenewalDue, setIsRenewalDue] = useState(false);

  const FIRST_PAYMENT_AMOUNT = 25000;
  const RENEWAL_AMOUNT = 15000;

  useEffect(() => {
    checkUser();
  }, []);

  useEffect(() => {
    if (user) {
      loadOrganizationData();
    }
  }, [user, location.state]);

  const checkUser = async () => {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) throw error;
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
      // First check if organization ID was passed in state
      if (location.state?.organizationId) {
        const { data, error } = await supabase
          .from('organizations')
          .select('*')
          .eq('id', location.state.organizationId)
          .single();

        if (!error && data) {
          setOrganization(data);
          await checkPaymentHistory(data.id);
          return;
        }
      }

      // If no ID in state or fetch failed, try to get by user_id
      if (user) {
        const { data, error } = await supabase
          .from('organizations')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (error) {
          console.error('Error fetching organization:', error);
          showAlert('error', 'Organization not found. Please complete registration first.');
          setTimeout(() => navigate('/organization-registration'), 2000);
          return;
        }

        if (data) {
          setOrganization(data);
          await checkPaymentHistory(data.id);
        }
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
      // Fetch all payments for this organization
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .eq('organization_id', orgId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setPreviousPayments(data || []);

      // Find the last approved payment
      const approvedPayments = data?.filter(p => p.status === 'approved' || p.status === 'accepted') || [];
      const lastApproved = approvedPayments[0]; // Most recent approved payment

      if (lastApproved) {
        setLastPaymentDate(new Date(lastApproved.created_at));
        
        // Calculate next renewal date (January 1st of the next year)
        const paymentYear = new Date(lastApproved.created_at).getFullYear();
        const renewalDate = new Date(paymentYear + 1, 0, 1); // January 1st of next year
        setNextRenewalDate(renewalDate);

        // Check if renewal is due (current date is on or after January 1st of renewal year)
        const now = new Date();
        const isDue = now >= renewalDate;
        setIsRenewalDue(isDue);

        if (isDue) {
          // Renewal is due
          setPaymentType('renewal');
          setPaymentAmount(RENEWAL_AMOUNT);
        } else {
          // Not yet time for renewal
          setPaymentType('not_due');
          setPaymentAmount(0);
        }
      } else if (data && data.length > 0) {
        // Has pending/rejected payments but no approved ones
        setPaymentType('first');
        setPaymentAmount(FIRST_PAYMENT_AMOUNT);
        setIsRenewalDue(false);
      } else {
        // No payment history - first payment
        setPaymentType('first');
        setPaymentAmount(FIRST_PAYMENT_AMOUNT);
        setIsRenewalDue(false);
      }
    } catch (error) {
      console.error('Error checking payment history:', error);
    }
  };

  const showAlert = (type, message) => {
    setAlert({ open: true, type, message });
  };

  const handleCloseAlert = () => {
    setAlert({ ...alert, open: false });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        showAlert('error', 'File size must be less than 5MB');
        e.target.value = null;
        return;
      }

      const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
      if (!allowedTypes.includes(file.type)) {
        showAlert('error', 'Please upload JPG, PNG, or PDF files only');
        e.target.value = null;
        return;
      }

      setReceiptFile(file);
      setFileName(file.name);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!user) {
      showAlert('error', 'Please login first');
      navigate('/login');
      return;
    }

    if (!organization) {
      showAlert('error', 'Organization not found');
      return;
    }

    if (!receiptFile) {
      showAlert('error', 'Please select a receipt file');
      return;
    }

    if (paymentType === 'not_due') {
      showAlert('error', 'No payment is due at this time');
      return;
    }

    setSubmitting(true);

    try {
      // Upload receipt
      const timestamp = Date.now();
      const cleanFileName = receiptFile.name.replace(/[^a-zA-Z0-9.]/g, '_');
      const fileName = `${timestamp}_${cleanFileName}`;
      const filePath = `${user.id}/receipts/${fileName}`;
      
      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, receiptFile);

      if (uploadError) {
        throw new Error(`Upload failed: ${uploadError.message}`);
      }

      // Determine payment period (year)
      const currentYear = new Date().getFullYear();
      const paymentYear = paymentType === 'renewal' ? currentYear : currentYear;

      // Create payment record with payment type
      const paymentData = {
        organization_id: organization.id,
        user_id: user.id,
        amount: paymentAmount,
        payment_type: paymentType, // 'first' or 'renewal'
        payment_method: 'Bank Transfer',
        receipt_path: filePath,
        status: 'pending',
        payment_year: paymentYear, // Track which year this payment covers
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { error: paymentError } = await supabase
        .from('payments')
        .insert([paymentData]);

      if (paymentError) {
        console.error('Payment insert error:', paymentError);
        throw new Error(paymentError.message);
      }

      showAlert('success', 'Payment submitted successfully! Redirecting to dashboard...');
      
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);

    } catch (error) {
      console.error('Payment process error:', error);
      showAlert('error', error.message || 'Failed to process payment');
    } finally {
      setSubmitting(false);
    }
  };

  // Consistent loading state with other components
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

      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', gap: 3 }}>
          {/* Sidebar */}
          <Sidebar />

          {/* Main Content */}
          <Box sx={{ flex: 1 }}>
            <Paper sx={{ p: 4, borderRadius: '16px', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}>
              <PaymentSummary 
                organization={organization} 
                amount={paymentAmount} 
                paymentType={paymentType}
                previousPayments={previousPayments}
                lastPaymentDate={lastPaymentDate}
                nextRenewalDate={nextRenewalDate}
                isRenewalDue={isRenewalDue}
              />
              
              {paymentType !== 'not_due' ? (
                <Box sx={{ mt: 4 }}>
                  <Typography variant="h5" sx={{ color: '#15e420', fontWeight: 600, mb: 3 }}>
                    {paymentType === 'first' ? 'First Time Payment' : 'Annual Renewal Payment'}
                  </Typography>
                  
                  <Paper sx={{ p: 3, bgcolor: '#f8f9fa', borderRadius: '12px', mb: 4 }}>
                    <Typography variant="h6" sx={{ color: '#333', mb: 2 }}>
                      KACCIMA Bank Details
                    </Typography>
                    <Box sx={{ display: 'grid', gap: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Typography sx={{ minWidth: 120, fontWeight: 600, color: '#666' }}>Bank Name:</Typography>
                        <Typography sx={{ color: '#333' }}>Jaiz Bank</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Typography sx={{ minWidth: 120, fontWeight: 600, color: '#666' }}>Account Name:</Typography>
                        <Typography sx={{ color: '#333' }}>KANO CHAMBER OF COMMERCE, INDUSTRY, MINES AND AGRICULTURE</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Typography sx={{ minWidth: 120, fontWeight: 600, color: '#666' }}>Account Number:</Typography>
                        <Typography sx={{ color: '#333' }}>0000374891</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Typography sx={{ minWidth: 120, fontWeight: 600, color: '#666' }}>Amount:</Typography>
                        <Typography sx={{ color: '#15e420', fontWeight: 700, fontSize: '1.2rem' }}>
                          ₦{paymentAmount.toLocaleString()}
                        </Typography>
                      </Box>
                    </Box>
                  </Paper>
                  
                  <form onSubmit={handleSubmit}>
                    <Box sx={{ mb: 3 }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                        Upload Payment Receipt <span style={{ color: '#dc3545' }}>*</span>
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#666', mb: 2 }}>
                        After making the transfer, upload your payment receipt here.
                        <br />
                        <small>Accepted formats: JPG, PNG, PDF (Max size: 5MB)</small>
                      </Typography>
                      
                      <Box sx={{ 
                        border: '2px dashed #ccc', 
                        borderRadius: '8px', 
                        p: 3, 
                        textAlign: 'center',
                        bgcolor: '#fafafa',
                        cursor: 'pointer',
                        transition: 'all 0.3s',
                        '&:hover': {
                          borderColor: '#15e420',
                          bgcolor: '#e8f5e9'
                        }
                      }}>
                        <input
                          type="file"
                          id="paymentReceipt"
                          accept=".jpg,.jpeg,.png,.pdf"
                          onChange={handleFileChange}
                          required
                          style={{ display: 'none' }}
                        />
                        <label htmlFor="paymentReceipt" style={{ cursor: 'pointer', width: '100%', display: 'block' }}>
                          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <Box component="span" sx={{ fontSize: '48px', mb: 1 }}>📎</Box>
                            <Typography variant="body1" sx={{ fontWeight: 500, mb: 1 }}>
                              Click to select file
                            </Typography>
                            {fileName && (
                              <Typography variant="body2" sx={{ color: '#15e420', mt: 1 }}>
                                Selected: {fileName}
                              </Typography>
                            )}
                          </Box>
                        </label>
                      </Box>
                    </Box>
                    
                    <Box sx={{ mt: 3 }}>
                      <button 
                        type="submit" 
                        className="btn btn-primary"
                        disabled={submitting || !receiptFile}
                        style={{
                          width: '100%',
                          padding: '12px',
                          backgroundColor: '#15e420',
                          color: 'white',
                          border: 'none',
                          borderRadius: '8px',
                          fontSize: '16px',
                          fontWeight: 600,
                          cursor: submitting || !receiptFile ? 'not-allowed' : 'pointer',
                          opacity: submitting || !receiptFile ? 0.7 : 1,
                          transition: 'all 0.3s'
                        }}
                      >
                        {submitting ? 'Processing...' : 'Submit Payment Proof'}
                      </button>
                    </Box>
                  </form>
                </Box>
              ) : (
                <Box sx={{ mt: 4, textAlign: 'center', p: 4 }}>
                  <Typography variant="h5" sx={{ color: '#15e420', fontWeight: 600, mb: 2 }}>
                    No Payment Due
                  </Typography>
                  <Typography variant="body1" sx={{ color: '#666', mb: 3 }}>
                    Your membership is active until {nextRenewalDate?.toLocaleDateString('en-NG', { 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}.
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#999' }}>
                    Your next renewal will be due on January 1, {(nextRenewalDate?.getFullYear() || new Date().getFullYear() + 1)}.
                  </Typography>
                  <button 
                    onClick={() => navigate('/dashboard')}
                    className="btn btn-primary"
                    style={{
                      marginTop: '20px',
                      padding: '12px 30px',
                      backgroundColor: '#15e420',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '16px',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    Return to Dashboard
                  </button>
                </Box>
              )}
            </Paper>
          </Box>
        </Box>
      </Container>
    </>
  );
};

export default Payment;