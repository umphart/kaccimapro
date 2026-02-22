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
  TextField,
  FormControlLabel,
  Switch,
  Tooltip,
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

import AdminSidebar from './AdminSidebar';
import DocumentStatusDialog from './DocumentStatusDialog';
import RejectPaymentDialog from './RejectPaymentDialog';
import ReceiptViewerDialog from './ReceiptViewerDialog';
import { usePaymentActions } from '../hooks/usePaymentActions'
import { useDocumentStatus } from '../hooks/useDocumentStatus';
import { StyledCard } from './PaymentDetailStyles';
import { getStatusChip, documentFields } from './PaymentDetailUtils';

const AdminPaymentDetail = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [payment, setPayment] = useState(null);
  const [organization, setOrganization] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [alert, setAlert] = useState({ open: false, type: 'success', message: '' });
  const [receiptModalOpen, setReceiptModalOpen] = useState(false);
  const [receiptUrl, setReceiptUrl] = useState(null);
  const [documentCheckDialog, setDocumentCheckDialog] = useState(false);

  const { 
    documentStatus, 
    allDocumentsApproved, 
    documentsWithIssues,
    documentSummary,
    checkDocumentApprovalStatus 
  } = useDocumentStatus(organization);

  const {
    processing,
    rejectDialogOpen,
    rejectReason,
    sendRejectionEmail,
    setRejectDialogOpen,
    setRejectReason,
    setSendRejectionEmail,
    handleApprove,
    handleReject
  } = usePaymentActions(payment, organization, id, showAlert, navigate);

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

      if (paymentData.organizations) {
        const docs = documentFields
          .filter(field => paymentData.organizations[field.key])
          .map(field => ({
            key: field.key,
            name: field.name,
            path: paymentData.organizations[field.key]
          }));
        setDocuments(docs);
        await checkDocumentApprovalStatus(paymentData.organizations.id, docs);
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

  const handleApproveClick = () => {
    if (!allDocumentsApproved) {
      setDocumentCheckDialog(true);
      return;
    }
    handleApprove();
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

      <DocumentStatusDialog
        open={documentCheckDialog}
        onClose={() => setDocumentCheckDialog(false)}
        documents={documents}
        documentStatus={documentStatus}
        documentsWithIssues={documentsWithIssues}
        onReviewDocuments={navigateToOrganizationDocuments}
      />

      <RejectPaymentDialog
        open={rejectDialogOpen}
        onClose={() => setRejectDialogOpen(false)}
        onReject={handleReject}
        rejectReason={rejectReason}
        setRejectReason={setRejectReason}
        sendRejectionEmail={sendRejectionEmail}
        setSendRejectionEmail={setSendRejectionEmail}
        processing={processing}
      />

      <ReceiptViewerDialog
        open={receiptModalOpen}
        onClose={() => setReceiptModalOpen(false)}
        receiptUrl={receiptUrl}
        companyName={organization?.company_name}
      />

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
    </>
  );
};

export default AdminPaymentDetail;