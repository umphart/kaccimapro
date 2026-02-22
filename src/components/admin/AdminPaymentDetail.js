import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import { 
  sendPaymentApprovedEmail,
  sendPaymentRejectedEmail 
} from '../../utils/emailService';
import emailjs from '@emailjs/browser';

import {
  Box,
  Container,
  Paper,
  Typography,
  Grid,
  Chip,
  Button,
  IconButton,
  Divider,
  Alert,
  Snackbar,
  CircularProgress,
  Card,
  CardContent,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControlLabel,
  Switch
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Payment as PaymentIcon,
  Business as BusinessIcon,
  Email as EmailIcon,
  Description as DescriptionIcon,
  Receipt as ReceiptIcon,
  Verified as VerifiedIcon,
  Pending as PendingIcon,
  Visibility as VisibilityIcon,
  Warning as WarningIcon
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import AdminSidebar from './AdminSidebar';

const StyledCard = styled(Card)(({ theme }) => ({
  borderRadius: '16px',
  boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)',
  height: '100%'
}));

const AdminPaymentDetail = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [payment, setPayment] = useState(null);
  const [organization, setOrganization] = useState(null);
  const [alert, setAlert] = useState({ open: false, type: 'success', message: '' });
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [receiptUrl, setReceiptUrl] = useState(null);
  const [receiptModalOpen, setReceiptModalOpen] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [sendRejectionEmail, setSendRejectionEmail] = useState(false);

  useEffect(() => {
    if (id && id !== 'undefined') {
      fetchPaymentDetails();
    } else {
      console.error('Invalid payment ID:', id);
      showAlert('error', 'Invalid payment ID');
      setLoading(false);
    }
  }, [id]);

  const showAlert = (type, message) => {
    setAlert({ open: true, type, message });
  };

  const handleCloseAlert = () => {
    setAlert({ ...alert, open: false });
  };

  const fetchPaymentDetails = async () => {
    setLoading(true);
    try {
      if (!id || id === 'undefined') {
        throw new Error('Invalid payment ID');
      }

      const { data: paymentData, error: paymentError } = await supabase
        .from('payments')
        .select(`
          *,
          organizations (
            id,
            company_name,
            email,
            phone_number,
            cac_number,
            status,
            business_nature
          )
        `)
        .eq('id', id)
        .single();

      if (paymentError) throw paymentError;
      if (!paymentData) throw new Error('Payment not found');

      setPayment(paymentData);
      setOrganization(paymentData.organizations);

      if (paymentData.receipt_path) {
        const bucket = paymentData.receipt_path.includes('receipts') ? 'documents' : 'receipts';
        const { data } = supabase.storage
          .from(bucket)
          .getPublicUrl(paymentData.receipt_path);
        setReceiptUrl(data.publicUrl);
      }

    } catch (error) {
      console.error('Error fetching payment details:', error);
      showAlert('error', error.message || 'Failed to load payment details');
    } finally {
      setLoading(false);
    }
  };

  const logEmailToDatabase = async (orgId, emailType, recipient, status, metadata = {}, error = null) => {
    try {
      await supabase
        .from('email_logs')
        .insert([{
          organization_id: orgId,
          email_type: emailType,
          recipient: recipient,
          status: status,
          error: error,
          metadata: metadata,
          created_at: new Date().toISOString()
        }]);
    } catch (dbError) {
      console.warn('Failed to log email:', dbError);
    }
  };

  const handleApprove = async () => {
    if (processing) return;
    
    try {
      setProcessing(true);
      
      if (!id || id === 'undefined') {
        throw new Error('Invalid payment ID');
      }

      // Update payment status
      const { error: paymentError } = await supabase
        .from('payments')
        .update({ 
          status: 'approved',
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (paymentError) throw paymentError;

      // Create notification for payment approval
      if (organization) {
        await supabase
          .from('organization_notifications')
          .insert([{
            organization_id: organization.id,
            type: 'payment_approved',
            title: 'Payment Approved',
            message: `Your payment of ₦${payment.amount?.toLocaleString()} has been approved.`,
            category: 'payment',
            read: false,
            created_at: new Date().toISOString()
          }]);
      }

      // IMPORTANT: When payment is approved, automatically approve the organization
      if (organization) {
        const wasPending = organization.status === 'pending' || organization.status === 'pending_approval';
        
        if (wasPending) {
          // Update organization status
          const { error: orgError } = await supabase
            .from('organizations')
            .update({ 
              status: 'approved',
              updated_at: new Date().toISOString()
            })
            .eq('id', organization.id);

          if (orgError) throw orgError;

          // Create notification for organization approval
          await supabase
            .from('organization_notifications')
            .insert([{
              organization_id: organization.id,
              type: 'success',
              title: 'Organization Fully Approved',
              message: 'Congratulations! Your organization has been fully approved and activated. You can now access all features.',
              category: 'registration',
              action_url: '/dashboard',
              read: false,
              created_at: new Date().toISOString()
            }]);
        }

        // Send enhanced PAYMENT APPROVAL EMAIL
        try {
          const emailResult = await sendPaymentApprovedEmail(
            organization.email,
            organization.company_name,
            payment.amount,
            organization.status // Pass current status for conditional messaging
          );
          
          if (emailResult.success) {
          
            
            // Log email sent to database
            await logEmailToDatabase(
              organization.id,
              'payment_approved',
              organization.email,
              'sent',
              { 
                amount: payment.amount, 
                wasPending,
                payment_id: payment.id
              }
            );

            showAlert('success', 'Payment approved and notification email sent successfully');
          } else {
            // Log email failure but don't stop the process
            await logEmailToDatabase(
              organization.id,
              'payment_approved',
              organization.email,
              'failed',
              { amount: payment.amount, payment_id: payment.id },
              emailResult.error
            );
            
            showAlert('warning', 'Payment approved but email notification failed');
          }
        } catch (emailError) {
          console.warn('Email notification failed:', emailError);
          
          // Log email failure
          await logEmailToDatabase(
            organization.id,
            'payment_approved',
            organization.email,
            'failed',
            { amount: payment.amount, payment_id: payment.id },
            emailError.message
          );
          
          showAlert('warning', 'Payment approved but email notification failed');
        }
      } else {
        showAlert('success', 'Payment approved successfully');
      }
      
      setTimeout(() => {
        navigate('/admin/payments');
      }, 3000);
    } catch (error) {
      console.error('Error approving payment:', error);
      showAlert('error', error.message || 'Failed to approve payment');
    } finally {
      setProcessing(false);
    }
  };

const handleReject = async () => {
  if (!rejectReason.trim()) return;
  if (processing) return;

  try {
    setProcessing(true);
    
    if (!id || id === 'undefined') {
      throw new Error('Invalid payment ID');
    }

    // Update payment status to rejected
    const { error: paymentError } = await supabase
      .from('payments')
      .update({ 
        status: 'rejected',
        rejection_reason: rejectReason,
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    if (paymentError) throw paymentError;

    // Create notification in Supabase
    if (organization) {
      await supabase
        .from('organization_notifications')
        .insert([{
          organization_id: organization.id,
          type: 'payment_rejected',
          title: 'Payment Rejected',
          message: `Your payment of ₦${payment.amount?.toLocaleString()} was rejected. Reason: ${rejectReason}`,
          category: 'payment',
          read: false,
          created_at: new Date().toISOString()
        }]);
    }

    // Send rejection email only if enabled in UI - BYPASS GLOBAL CONFIG
    if (sendRejectionEmail && organization) {
      try {
        // Direct email send without checking global config
        const templateParams = {
          to_email: organization.email,
          company_name: organization.company_name,
          main_message: `Update regarding your payment of ₦${payment.amount?.toLocaleString()}`,
          details: `We regret to inform you that your payment has been rejected. 
          
Reason for rejection: ${rejectReason}

Please contact our support team for assistance or to resolve any issues with your payment.`,
          action_url: `${window.location.origin}/support`,
          action_text: 'Contact Support',
          reply_to: 'support@pharouq900.com'
        };

      

        const response = await emailjs.send(
          'service_hoj7fzf', // Your service ID
          'template_orimz2f', // Your template ID
          templateParams
        );

        if (response) {
          
          
          // Log email sent
          await supabase
            .from('email_logs')
            .insert([{
              organization_id: organization.id,
              email_type: 'payment_rejected',
              recipient: organization.email,
              status: 'sent',
              metadata: { 
                amount: payment.amount, 
                reason: rejectReason,
                payment_id: payment.id
              },
              created_at: new Date().toISOString()
            }]);
        }
      } catch (emailError) {
        console.warn('Failed to send rejection email:', emailError);
        
        // Log email failure
        await supabase
          .from('email_logs')
          .insert([{
            organization_id: organization.id,
            email_type: 'payment_rejected',
            recipient: organization.email,
            status: 'failed',
            error: emailError.message,
            metadata: { amount: payment.amount, reason: rejectReason, payment_id: payment.id },
            created_at: new Date().toISOString()
          }]);
      }
    }

    showAlert('success', 'Payment rejected successfully');
    setRejectDialogOpen(false);
    setRejectReason('');
    setSendRejectionEmail(false);
    
    setTimeout(() => {
      navigate('/admin/payments');
    }, 3000);
  } catch (error) {
    console.error('Error rejecting payment:', error);
    showAlert('error', error.message || 'Failed to reject payment');
  } finally {
    setProcessing(false);
  }
};

  const getStatusChip = (status) => {
    const config = {
      pending: { color: 'warning', icon: <PendingIcon />, label: 'Pending' },
      approved: { color: 'success', icon: <CheckCircleIcon />, label: 'Approved' },
      rejected: { color: 'error', icon: <CancelIcon />, label: 'Rejected' }
    };
    const statusConfig = config[status?.toLowerCase()] || config.pending;

    return (
      <Chip
        icon={statusConfig.icon}
        label={statusConfig.label}
        color={statusConfig.color}
        sx={{ fontFamily: '"Inter", sans-serif', fontWeight: 500 }}
      />
    );
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress style={{ color: '#15e420' }} />
      </Box>
    );
  }

  if (!payment) {
    return (
      <Container>
        <Typography variant="h6" color="error">Payment not found</Typography>
        <Button 
          variant="contained" 
          onClick={() => navigate('/admin/payments')}
          sx={{ mt: 2, bgcolor: '#15e420', '&:hover': { bgcolor: '#12c21e' } }}
        >
          Back to Payments
        </Button>
      </Container>
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
          
          <Box sx={{ flex: 1 }}>
            {/* Header */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
              <IconButton onClick={() => navigate('/admin/payments')} sx={{ color: '#15e420' }}>
                <ArrowBackIcon />
              </IconButton>
              <Typography 
                variant="h4" 
                sx={{ 
                  fontFamily: '"Poppins", sans-serif',
                  fontWeight: 700,
                  color: '#333'
                }}
              >
                Payment Details
              </Typography>
              <Box sx={{ ml: 'auto' }}>
                {getStatusChip(payment.status)}
              </Box>
            </Box>

            <Grid container spacing={3}>
              {/* Payment Information */}
              <Grid item xs={12} md={6}>
                <StyledCard>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                      <Avatar sx={{ bgcolor: '#15e420', width: 56, height: 56 }}>
                        <PaymentIcon />
                      </Avatar>
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        Payment Information
                      </Typography>
                    </Box>

                    <Divider sx={{ mb: 3 }} />

                    <List>
                      <ListItem>
                        <ListItemIcon>
                          <PaymentIcon sx={{ color: '#15e420' }} />
                        </ListItemIcon>
                        <ListItemText 
                          primary="Amount"
                          secondary={`₦${payment.amount?.toLocaleString()}`}
                          secondaryTypographyProps={{ fontWeight: 600, fontSize: '1.1rem' }}
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon>
                          <ReceiptIcon sx={{ color: '#15e420' }} />
                        </ListItemIcon>
                        <ListItemText 
                          primary="Payment Type"
                          secondary={payment.payment_type === 'first' ? 'First Payment' : 'Annual Renewal'}
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon>
                          <DescriptionIcon sx={{ color: '#15e420' }} />
                        </ListItemIcon>
                        <ListItemText 
                          primary="Payment Method"
                          secondary={payment.payment_method || 'Bank Transfer'}
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon>
                          <EmailIcon sx={{ color: '#15e420' }} />
                        </ListItemIcon>
                        <ListItemText 
                          primary="Payment Date"
                          secondary={new Date(payment.created_at).toLocaleString()}
                        />
                      </ListItem>
                      {payment.payment_year && (
                        <ListItem>
                          <ListItemIcon>
                            <VerifiedIcon sx={{ color: '#15e420' }} />
                          </ListItemIcon>
                          <ListItemText 
                            primary="Payment Year"
                            secondary={payment.payment_year}
                          />
                        </ListItem>
                      )}
                    </List>

                    {payment.receipt_path && (
                      <Box sx={{ mt: 2 }}>
                        <Button
                          variant="outlined"
                          startIcon={<VisibilityIcon />}
                          onClick={() => setReceiptModalOpen(true)}
                          sx={{ borderColor: '#15e420', color: '#15e420' }}
                        >
                          View Receipt
                        </Button>
                      </Box>
                    )}
                  </CardContent>
                </StyledCard>
              </Grid>

              {/* Organization Information */}
              <Grid item xs={12} md={6}>
                <StyledCard>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                      <Avatar sx={{ bgcolor: '#15e420', width: 56, height: 56 }}>
                        <BusinessIcon />
                      </Avatar>
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        Organization Details
                      </Typography>
                    </Box>

                    <Divider sx={{ mb: 3 }} />

                    {organization ? (
                      <List>
                        <ListItem>
                          <ListItemIcon>
                            <BusinessIcon sx={{ color: '#15e420' }} />
                          </ListItemIcon>
                          <ListItemText 
                            primary="Company Name"
                            secondary={organization.company_name}
                          />
                        </ListItem>
                        <ListItem>
                          <ListItemIcon>
                            <EmailIcon sx={{ color: '#15e420' }} />
                          </ListItemIcon>
                          <ListItemText 
                            primary="Email"
                            secondary={organization.email}
                          />
                        </ListItem>
                        <ListItem>
                          <ListItemIcon>
                            <DescriptionIcon sx={{ color: '#15e420' }} />
                          </ListItemIcon>
                          <ListItemText 
                            primary="CAC Number"
                            secondary={organization.cac_number || 'N/A'}
                          />
                        </ListItem>
                        <ListItem>
                          <ListItemIcon>
                            <VerifiedIcon sx={{ color: '#15e420' }} />
                          </ListItemIcon>
                          <ListItemText 
                            primary="Business Nature"
                            secondary={organization.business_nature || 'N/A'}
                          />
                        </ListItem>
                        <ListItem>
                          <ListItemIcon>
                            {getStatusChip(organization.status).props.icon}
                          </ListItemIcon>
                          <ListItemText 
                            primary="Organization Status"
                            secondary={
                              <Chip
                                label={organization.status}
                                size="small"
                                color={
                                  organization.status === 'approved' ? 'success' :
                                  organization.status === 'pending' ? 'warning' : 'error'
                                }
                              />
                            }
                          />
                        </ListItem>
                      </List>
                    ) : (
                      <Typography color="textSecondary">Organization details not available</Typography>
                    )}
                  </CardContent>
                </StyledCard>
              </Grid>

              {/* Actions */}
              {payment.status?.toLowerCase() === 'pending' && (
                <Grid item xs={12}>
                  <Paper sx={{ p: 3, borderRadius: '16px' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                      <Button
                        variant="outlined"
                        color="error"
                        startIcon={<CancelIcon />}
                        onClick={() => setRejectDialogOpen(true)}
                        disabled={processing}
                      >
                        Reject Payment
                      </Button>
                      <Button
                        variant="contained"
                        startIcon={<CheckCircleIcon />}
                        onClick={handleApprove}
                        disabled={processing}
                        sx={{ 
                          bgcolor: '#15e420', 
                          '&:hover': { bgcolor: '#12c21e' },
                          '&.Mui-disabled': { bgcolor: '#ccc' }
                        }}
                      >
                        {processing ? 'Processing...' : 'Approve Payment & Activate Organization'}
                      </Button>
                    </Box>
                  </Paper>
                </Grid>
              )}
            </Grid>
          </Box>
        </Box>
      </Container>

      {/* Reject Dialog with Email Option */}
      <Dialog open={rejectDialogOpen} onClose={() => !processing && setRejectDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontFamily: '"Poppins", sans-serif', display: 'flex', alignItems: 'center', gap: 1 }}>
          <WarningIcon color="error" />
          Reject Payment
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2, color: '#666' }}>
            Please provide a reason for rejecting this payment:
          </Typography>
          <TextField
            autoFocus
            margin="dense"
            label="Reason for Rejection"
            fullWidth
            multiline
            rows={4}
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            variant="outlined"
            placeholder="Explain why this payment is being rejected..."
            disabled={processing}
            error={!rejectReason.trim()}
            helperText={!rejectReason.trim() ? 'Reason is required' : ''}
          />
          
          <Box sx={{ mt: 3, p: 2, bgcolor: '#f5f5f5', borderRadius: 2 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={sendRejectionEmail}
                  onChange={(e) => setSendRejectionEmail(e.target.checked)}
                  color="primary"
                  disabled={processing}
                />
              }
              label={
                <Box>
                  <Typography variant="body2" fontWeight={600}>Send rejection email to organization</Typography>
                  <Typography variant="caption" color="textSecondary">
                    When enabled, the organization will receive an email notification about the rejection
                  </Typography>
                </Box>
              }
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setRejectDialogOpen(false)} disabled={processing}>
            Cancel
          </Button>
          <Button 
            onClick={handleReject} 
            color="error" 
            variant="contained"
            disabled={!rejectReason.trim() || processing}
            startIcon={<CancelIcon />}
          >
            {processing ? 'Processing...' : 'Reject Payment'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Receipt Modal */}
      <Dialog
        open={receiptModalOpen}
        onClose={() => setReceiptModalOpen(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          Payment Receipt - {organization?.company_name}
          <IconButton onClick={() => setReceiptModalOpen(false)}>
            <CancelIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <Box sx={{ minHeight: 500 }}>
            {receiptUrl ? (
              receiptUrl.includes('.pdf') ? (
                <iframe
                  src={receiptUrl}
                  title="Payment Receipt"
                  width="100%"
                  height="600px"
                  style={{ border: 'none' }}
                />
              ) : (
                <img 
                  src={receiptUrl} 
                  alt="Payment Receipt" 
                  style={{ width: '100%', height: 'auto' }} 
                />
              )
            ) : (
              <Typography>Receipt not available</Typography>
            )}
          </Box>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AdminPaymentDetail;