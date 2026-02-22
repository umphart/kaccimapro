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
  Switch,
  Tooltip,
  Badge,
  LinearProgress
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
  Warning as WarningIcon,
  Info as InfoIcon,
  Error as ErrorIcon
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
  const [documents, setDocuments] = useState([]);
  const [documentStatus, setDocumentStatus] = useState({});
  const [allDocumentsApproved, setAllDocumentsApproved] = useState(false);
  const [documentsWithIssues, setDocumentsWithIssues] = useState([]);
  const [alert, setAlert] = useState({ open: false, type: 'success', message: '' });
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [receiptUrl, setReceiptUrl] = useState(null);
  const [receiptModalOpen, setReceiptModalOpen] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [sendRejectionEmail, setSendRejectionEmail] = useState(false);
  const [documentCheckDialog, setDocumentCheckDialog] = useState(false);

  const documentFields = [
    { key: 'cover_letter_path', name: 'Cover Letter', required: true },
    { key: 'memorandum_path', name: 'Memorandum', required: true },
    { key: 'registration_cert_path', name: 'Registration Certificate', required: true },
    { key: 'incorporation_cert_path', name: 'Incorporation Certificate', required: true },
    { key: 'premises_cert_path', name: 'Premises Certificate', required: true },
    { key: 'company_logo_path', name: 'Company Logo', required: true },
    { key: 'form_c07_path', name: 'Form C07', required: true },
    { key: 'id_document_path', name: 'ID Document', required: true }
  ];

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

      // Fetch payment data with organization
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
            business_nature,
            office_address,
            cover_letter_path,
            memorandum_path,
            registration_cert_path,
            incorporation_cert_path,
            premises_cert_path,
            company_logo_path,
            form_c07_path,
            id_document_path
          )
        `)
        .eq('id', id)
        .single();

      if (paymentError) throw paymentError;
      if (!paymentData) throw new Error('Payment not found');

      setPayment(paymentData);
      setOrganization(paymentData.organizations);

      // Check document approval status
      if (paymentData.organizations) {
        await checkDocumentApprovalStatus(paymentData.organizations.id);
      }

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

  const checkDocumentApprovalStatus = async (organizationId) => {
    try {
      // Fetch document approval/rejection notifications
      const { data: notifications, error: notifError } = await supabase
        .from('organization_notifications')
        .select('*')
        .eq('organization_id', organizationId)
        .in('type', ['document_approved', 'document_rejected'])
        .order('created_at', { ascending: false });

      if (notifError) throw notifError;

      // Build documents list with status
      const docs = [];
      const status = {};
      const issues = [];

      documentFields.forEach(field => {
        if (organization[field.key]) {
          docs.push({
            key: field.key,
            name: field.name,
            path: organization[field.key]
          });

          // Check latest notification for this document
          const docNotifications = notifications?.filter(n => 
            n.title?.includes(field.name)
          );

          if (docNotifications && docNotifications.length > 0) {
            const latest = docNotifications[0];
            if (latest.type === 'document_approved') {
              status[field.key] = 'approved';
            } else if (latest.type === 'document_rejected') {
              status[field.key] = 'rejected';
              // Extract reason if available
              const reason = latest.message?.split('Reason: ')[1] || 'Document was rejected';
              issues.push({ name: field.name, reason });
            } else {
              status[field.key] = 'pending';
              issues.push({ name: field.name, reason: 'Pending review' });
            }
          } else {
            status[field.key] = 'pending';
            issues.push({ name: field.name, reason: 'Not yet reviewed' });
          }
        }
      });

      setDocuments(docs);
      setDocumentStatus(status);
      setDocumentsWithIssues(issues);

      // Check if all documents are approved
      const allApproved = docs.every(doc => status[doc.key] === 'approved');
      setAllDocumentsApproved(allApproved);

    } catch (error) {
      console.error('Error checking document status:', error);
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

  const handleApproveClick = () => {
    // Check if all documents are approved
    if (!allDocumentsApproved) {
      setDocumentCheckDialog(true);
      return;
    }
    
    // If all documents are approved, proceed with payment approval
    handleApprove();
  };

  const handleApprove = async () => {
    if (processing) return;
    
    try {
      setProcessing(true);
      
      if (!id || id === 'undefined') {
        throw new Error('Invalid payment ID');
      }

      // Double-check document approval status before proceeding
      const allDocsApproved = documents.every(doc => documentStatus[doc.key] === 'approved');
      
      if (!allDocsApproved) {
        showAlert('error', 'Cannot approve payment: Not all documents are approved');
        setProcessing(false);
        return;
      }

      // Update payment status
      const { error: paymentError } = await supabase
        .from('payments')
        .update({ 
          status: 'approved',
          approved_at: new Date().toISOString(),
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
          rejected_at: new Date().toISOString(),
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

      // Send rejection email only if enabled in UI
      if (sendRejectionEmail && organization) {
        try {
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
            'service_hoj7fzf',
            'template_orimz2f',
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

  const getDocumentStatusSummary = () => {
    const approved = Object.values(documentStatus).filter(s => s === 'approved').length;
    const pending = Object.values(documentStatus).filter(s => s === 'pending').length;
    const rejected = Object.values(documentStatus).filter(s => s === 'rejected').length;
    return { approved, pending, rejected };
  };

  const navigateToOrganizationDocuments = () => {
    navigate(`/admin/organizations/${organization?.id}`);
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

  const documentSummary = getDocumentStatusSummary();

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

      {/* Document Check Dialog */}
      <Dialog open={documentCheckDialog} onClose={() => setDocumentCheckDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ 
          fontFamily: '"Poppins", sans-serif', 
          display: 'flex', 
          alignItems: 'center', 
          gap: 1, 
          color: documentsWithIssues.some(d => d.reason.includes('rejected')) ? '#d32f2f' : '#ed6c02'
        }}>
          {documentsWithIssues.some(d => d.reason.includes('rejected')) ? (
            <ErrorIcon color="error" />
          ) : (
            <WarningIcon color="warning" />
          )}
          {documentsWithIssues.some(d => d.reason.includes('rejected')) 
            ? 'Documents Need Attention' 
            : 'Documents Not Fully Approved'}
        </DialogTitle>
        <DialogContent>
          <Alert 
            severity={documentsWithIssues.some(d => d.reason.includes('rejected')) ? 'error' : 'warning'} 
            sx={{ mb: 2 }}
          >
            {documentsWithIssues.some(d => d.reason.includes('rejected')) 
              ? 'Some documents have been rejected and need to be re-uploaded before payment can be approved.'
              : 'All organization documents must be approved before payment can be approved.'}
          </Alert>
          
          <Typography variant="body2" sx={{ mb: 2, fontWeight: 600 }}>
            Document Status:
          </Typography>
          
          <List dense>
            {documents.map((doc) => (
              <ListItem key={doc.key}>
                <ListItemIcon>
                  {documentStatus[doc.key] === 'approved' ? (
                    <CheckCircleIcon sx={{ color: '#28a745' }} fontSize="small" />
                  ) : documentStatus[doc.key] === 'rejected' ? (
                    <CancelIcon sx={{ color: '#dc3545' }} fontSize="small" />
                  ) : (
                    <PendingIcon sx={{ color: '#ffc107' }} fontSize="small" />
                  )}
                </ListItemIcon>
                <ListItemText 
                  primary={doc.name}
                  secondary={
                    documentStatus[doc.key] === 'approved' ? 'Approved' : 
                    documentStatus[doc.key] === 'rejected' ? 'Rejected - Needs re-upload' : 'Pending Review'
                  }
                  secondaryTypographyProps={{
                    color: documentStatus[doc.key] === 'approved' ? 'success' :
                           documentStatus[doc.key] === 'rejected' ? 'error' : 'warning'
                  }}
                />
              </ListItem>
            ))}
          </List>

          {documentsWithIssues.length > 0 && (
            <Box sx={{ mt: 2, p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
              <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <InfoIcon fontSize="small" color="info" />
                Details:
              </Typography>
              {documentsWithIssues.map((issue, index) => (
                <Typography key={index} variant="body2" sx={{ ml: 3, mb: 0.5 }}>
                  • {issue.name}: {issue.reason}
                </Typography>
              ))}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDocumentCheckDialog(false)}>
            Close
          </Button>
          <Button 
            onClick={navigateToOrganizationDocuments}
            variant="contained"
            sx={{ bgcolor: '#15e420', '&:hover': { bgcolor: '#12c21e' } }}
          >
            Review Documents
          </Button>
        </DialogActions>
      </Dialog>

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
                        
                        {/* Document Status Summary */}
                        <ListItem>
                          <ListItemIcon>
                            <DescriptionIcon sx={{ color: '#15e420' }} />
                          </ListItemIcon>
                          <ListItemText 
                            primary="Documents Status"
                            secondary={
                              <Box sx={{ mt: 1 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                  <Chip
                                    size="small"
                                    icon={<CheckCircleIcon />}
                                    label={`${documentSummary.approved} Approved`}
                                    color="success"
                                    variant="outlined"
                                  />
                                  <Chip
                                    size="small"
                                    icon={<PendingIcon />}
                                    label={`${documentSummary.pending} Pending`}
                                    color="warning"
                                    variant="outlined"
                                  />
                                  <Chip
                                    size="small"
                                    icon={<CancelIcon />}
                                    label={`${documentSummary.rejected} Rejected`}
                                    color="error"
                                    variant="outlined"
                                  />
                                </Box>
                                
                                {/* Progress bar */}
                                <LinearProgress 
                                  variant="determinate" 
                                  value={(documentSummary.approved / documents.length) * 100}
                                  sx={{ 
                                    height: 8, 
                                    borderRadius: 4,
                                    bgcolor: '#e0e0e0',
                                    '& .MuiLinearProgress-bar': {
                                      bgcolor: documentSummary.rejected > 0 ? '#dc3545' : '#15e420'
                                    }
                                  }}
                                />
                                
                                <Typography variant="caption" color="textSecondary" sx={{ mt: 0.5, display: 'block' }}>
                                  {documentSummary.approved} of {documents.length} documents approved
                                </Typography>
                              </Box>
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
                      
                      <Tooltip 
                        title={
                          !allDocumentsApproved 
                            ? documentSummary.rejected > 0
                              ? `${documentSummary.rejected} document(s) are rejected and need to be re-uploaded`
                              : `${documentSummary.pending} document(s) are pending approval`
                            : "Approve payment and automatically activate organization"
                        }
                      >
                        <span>
                          <Button
                            variant="contained"
                            startIcon={<CheckCircleIcon />}
                            onClick={handleApproveClick}
                            disabled={processing || !allDocumentsApproved}
                            sx={{ 
                              bgcolor: allDocumentsApproved ? '#15e420' : 
                                      documentSummary.rejected > 0 ? '#dc3545' : '#ccc',
                              '&:hover': { 
                                bgcolor: allDocumentsApproved ? '#12c21e' : 
                                        documentSummary.rejected > 0 ? '#bb2d3b' : '#ccc' 
                              },
                              '&.Mui-disabled': { 
                                bgcolor: documentSummary.rejected > 0 ? '#dc3545' : '#ccc',
                                color: '#fff',
                                opacity: documentSummary.rejected > 0 ? 0.7 : 0.5
                              }
                            }}
                          >
                            {processing ? 'Processing...' : 
                             documentSummary.rejected > 0 ? 'Documents Need Attention' :
                             !allDocumentsApproved ? 'Documents Pending' : 
                             'Approve Payment & Activate Organization'}
                          </Button>
                        </span>
                      </Tooltip>
                    </Box>
                    
                    {!allDocumentsApproved && (
                      <Alert 
                        severity={documentSummary.rejected > 0 ? "error" : "warning"} 
                        sx={{ mt: 2 }}
                        action={
                          <Button 
                            color="inherit" 
                            size="small"
                            onClick={() => navigate(`/admin/organizations/${organization?.id}`)}
                          >
                            Review Documents
                          </Button>
                        }
                      >
                        {documentSummary.rejected > 0 ? (
                          <>
                            <strong>Action required:</strong> {documentSummary.rejected} document(s) have been rejected 
                            and need to be re-uploaded before payment can be approved.
                          </>
                        ) : documentSummary.pending > 0 ? (
                          <>
                            <strong>Pending:</strong> {documentSummary.pending} document(s) are still pending review. 
                            Please review all documents before approving payment.
                          </>
                        ) : (
                          'Cannot approve payment until all organization documents are approved.'
                        )}
                      </Alert>
                    )}
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