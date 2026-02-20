import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
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
  TextField
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
  Visibility as VisibilityIcon
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

  useEffect(() => {
    fetchPaymentDetails();
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
      // Fetch payment with organization details
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
            status
          )
        `)
        .eq('id', id)
        .single();

      if (paymentError) throw paymentError;

      setPayment(paymentData);
      setOrganization(paymentData.organizations);

      // Get receipt URL if exists
      if (paymentData.receipt_path) {
        const bucket = paymentData.receipt_path.includes('receipts') ? 'documents' : 'receipts';
        const { data } = supabase.storage
          .from(bucket)
          .getPublicUrl(paymentData.receipt_path);
        setReceiptUrl(data.publicUrl);
      }

    } catch (error) {
      console.error('Error fetching payment details:', error);
      showAlert('error', 'Failed to load payment details');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    try {
      const { error } = await supabase
        .from('payments')
        .update({ 
          status: 'approved',
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;

      showAlert('success', 'Payment approved successfully');
      
      // Update organization status if this is the first approved payment
      if (organization && organization.status === 'pending') {
        await supabase
          .from('organizations')
          .update({ status: 'approved' })
          .eq('id', organization.id);
      }

      setTimeout(() => {
        navigate('/admin/payments');
      }, 2000);
    } catch (error) {
      console.error('Error approving payment:', error);
      showAlert('error', 'Failed to approve payment');
    }
  };

  const handleReject = async () => {
    try {
      const { error } = await supabase
        .from('payments')
        .update({ 
          status: 'rejected',
          rejection_reason: rejectReason,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;

      showAlert('success', 'Payment rejected');
      setRejectDialogOpen(false);
      
      setTimeout(() => {
        navigate('/admin/payments');
      }, 2000);
    } catch (error) {
      console.error('Error rejecting payment:', error);
      showAlert('error', 'Failed to reject payment');
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
        sx={{ fontFamily: '"Inter", sans-serif' }}
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
        <Typography>Payment not found</Typography>
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
                      >
                        Reject Payment
                      </Button>
                      <Button
                        variant="contained"
                        startIcon={<CheckCircleIcon />}
                        onClick={handleApprove}
                        sx={{ bgcolor: '#15e420', '&:hover': { bgcolor: '#12c21e' } }}
                      >
                        Approve Payment
                      </Button>
                    </Box>
                  </Paper>
                </Grid>
              )}
            </Grid>
          </Box>
        </Box>
      </Container>

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onClose={() => setRejectDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontFamily: '"Poppins", sans-serif' }}>
          Reject Payment
        </DialogTitle>
        <DialogContent>
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
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRejectDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleReject} 
            color="error" 
            variant="contained"
            disabled={!rejectReason.trim()}
          >
            Reject Payment
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
          Payment Receipt
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