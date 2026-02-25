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
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Description as DescriptionIcon,
  Payment as PaymentIcon,
  Business as BusinessIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  LocationOn as LocationIcon,
  Pending as PendingIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';

import AdminSidebar from './AdminSidebar';
import DocumentViewerDialog from './DocumentViewerDialog';
import DocumentRejectDialog from './DocumentRejectDialog';
import OrganizationActionDialogs from './OrganizationActionDialogs';
import DocumentCard from './DocumentCard'; // Your existing DocumentCard
import { StyledCard, documentFields } from './OrganizationDetailUtils';
import { useDocumentManagement } from '../hooks/useDocumentManagement';
import { useOrganizationActions } from '../hooks/useOrganizationActions';

const AdminOrganizationDetail = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [organization, setOrganization] = useState(null);
  const [payments, setPayments] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [alert, setAlert] = useState({ open: false, type: 'success', message: '' });
  const [reuploadHistory, setReuploadHistory] = useState([]);

  const showAlert = (type, message) => {
    setAlert({ open: true, type, message });
  };

  const handleCloseAlert = () => {
    setAlert({ ...alert, open: false });
  };
  
  const {
    documentStatus,
    rejectionReasons,
    processing: docProcessing,
    setDocumentStatus,
    setRejectionReasons,
    handleApproveDocument,
    handleRejectDocument,
    handleViewDocument,
    handleDownloadDocument,
    viewDocument,
    documentUrl,
    setViewDocument,
    setDocumentUrl,
    rejectDialog,
    setRejectDialog,
    rejectReason,
    setRejectReason
  } = useDocumentManagement(id, showAlert);

  const {
    processing: orgProcessing,
    approveOrgDialog,
    rejectOrgDialog,
    orgRejectReason,
    setApproveOrgDialog,
    setRejectOrgDialog,
    setOrgRejectReason,
    handleApproveOrganization,
    handleRejectOrganization
  } = useOrganizationActions(id, organization, documents, documentStatus, showAlert, fetchOrganizationDetails);

  useEffect(() => {
    fetchOrganizationDetails();
  }, [id]);

async function fetchOrganizationDetails() {
  setLoading(true);
  try {
    // Fetch organization data
    const { data: orgData, error: orgError } = await supabase
      .from('organizations')
      .select('*')
      .eq('id', id)
      .single();

    if (orgError) throw orgError;
    setOrganization(orgData);

    // Fetch payments
    const { data: paymentData, error: paymentError } = await supabase
      .from('payments')
      .select('*')
      .eq('organization_id', id)
      .order('created_at', { ascending: false });

    if (paymentError) throw paymentError;
    setPayments(paymentData || []);

    // Fetch document status from notifications
    const { data: notifications, error: notifError } = await supabase
      .from('organization_notifications')
      .select('*')
      .eq('organization_id', id)
      .in('type', ['document_approved', 'document_rejected', 'document_reuploaded'])
      .order('created_at', { ascending: false });

    if (notifError) throw notifError;

    // Fetch re-upload history
    const { data: history } = await supabase
      .from('organization_notifications')
      .select('*')
      .eq('organization_id', id)
      .eq('type', 'document_reuploaded')
      .order('created_at', { ascending: false });

    setReuploadHistory(history || []);

    // Build documents list with status
    const docs = [];
    const status = {};
    const reasons = {};

    // Create a map of latest notification for each document
    const latestNotifications = {};
    
    notifications?.forEach(notif => {
      const docField = documentFields.find(field => 
        notif.title?.includes(field.name) || notif.message?.includes(field.name)
      );

      if (docField) {
        const key = docField.key;
        if (!latestNotifications[key] || 
            new Date(notif.created_at) > new Date(latestNotifications[key].created_at)) {
          latestNotifications[key] = notif;
        }
      }
    });

    documentFields.forEach(field => {
      if (orgData[field.key]) {
        // Parse the URL to extract bucket and path
        let bucket = field.bucket; // Default from documentFields
        let path = orgData[field.key];
        
        // If it's a full Supabase URL, parse it
        if (path && path.includes('supabase.co/storage/v1/object/public/')) {
          // Example: https://pmsqenjyqdjdozabvirj.supabase.co/storage/v1/object/public/documents/d9933011-e019-4bb9-b3f8-f932dd39fd09/registration_cert_path_1771985170250.jpg
          
          // Extract the part after '/object/public/'
          const urlParts = path.split('/object/public/');
          if (urlParts.length > 1) {
            const bucketAndPath = urlParts[1];
            // First part is bucket name, rest is path
            const bucketEndIndex = bucketAndPath.indexOf('/');
            if (bucketEndIndex > -1) {
              bucket = bucketAndPath.substring(0, bucketEndIndex);
              path = bucketAndPath.substring(bucketEndIndex + 1);
            }
          }
        }

        console.log(`Document ${field.name}:`, {
          originalPath: orgData[field.key],
          extractedBucket: bucket,
          extractedPath: path,
          fieldBucket: field.bucket
        });

        docs.push({
          key: field.key,
          name: field.name,
          path: path, // Clean path without bucket
          fullUrl: orgData[field.key], // Keep full URL as fallback
          required: field.required,
          bucket: bucket // Use extracted bucket
        });

        const latestNotif = latestNotifications[field.key];
        
        if (latestNotif) {
          if (latestNotif.type === 'document_approved') {
            status[field.key] = 'approved';
          } else if (latestNotif.type === 'document_rejected') {
            status[field.key] = 'rejected';
            const reason = latestNotif.message.split('Reason: ')[1] || 'No reason provided';
            reasons[field.key] = reason;
          } else if (latestNotif.type === 'document_reuploaded') {
            status[field.key] = 'pending';
            reasons[field.key] = null;
          }
        } else {
          status[field.key] = 'pending';
        }

        // Check rejection reason in organization table
        const rejectionField = `${field.key.replace('_path', '_rejection_reason')}`;
        if (orgData[rejectionField] && status[field.key] === 'rejected') {
          reasons[field.key] = orgData[rejectionField];
        }
      }
    });

    setDocuments(docs);
    setDocumentStatus(status);
    setRejectionReasons(reasons);
    
    console.log('Final documents with buckets:', docs);
    
  } catch (error) {
    console.error('Error fetching organization:', error);
    showAlert('error', 'Failed to load organization details');
  } finally {
    setLoading(false);
  }
}
  const checkAllDocumentsApproved = () => {
    return documents.every(doc => documentStatus[doc.key] === 'approved');
  };

  const getStatusChip = (status) => {
    const config = {
      pending: { color: 'warning', icon: <PendingIcon />, label: 'Pending' },
      approved: { color: 'success', icon: <CheckCircleIcon />, label: 'Approved' },
      rejected: { color: 'error', icon: <CancelIcon />, label: 'Rejected' }
    };
    const statusConfig = config[status] || config.pending;

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

  if (!organization) {
    return (
      <Container>
        <Typography>Organization not found</Typography>
      </Container>
    );
  }

  const allDocumentsApproved = checkAllDocumentsApproved();
  const processing = docProcessing || orgProcessing;

  // Count documents by status for summary
  const documentSummary = {
    approved: Object.values(documentStatus).filter(s => s === 'approved').length,
    pending: Object.values(documentStatus).filter(s => s === 'pending').length,
    rejected: Object.values(documentStatus).filter(s => s === 'rejected').length,
    total: documents.length
  };

  // Check if any document was re-uploaded
  const hasReuploaded = reuploadHistory.length > 0;

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

      <DocumentViewerDialog
        open={!!viewDocument}
        onClose={() => {
          setViewDocument(null);
          setDocumentUrl(null);
        }}
        document={viewDocument}
        documentUrl={documentUrl}
        companyName={organization?.company_name}
        onDownload={handleDownloadDocument}
      />

      <DocumentRejectDialog
        open={rejectDialog.open}
        onClose={() => setRejectDialog({ open: false, doc: null })}
        onReject={handleRejectDocument}
        document={rejectDialog.doc}
        rejectReason={rejectReason}
        setRejectReason={setRejectReason}
        processing={processing}
      />

      <OrganizationActionDialogs
        approveOpen={approveOrgDialog}
        rejectOpen={rejectOrgDialog}
        onApproveClose={() => setApproveOrgDialog(false)}
        onRejectClose={() => setRejectOrgDialog(false)}
        onApproveConfirm={handleApproveOrganization}
        onRejectConfirm={handleRejectOrganization}
        allDocumentsApproved={allDocumentsApproved}
        orgRejectReason={orgRejectReason}
        setOrgRejectReason={setOrgRejectReason}
        processing={processing}
      />

      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', gap: 3 }}>
          <AdminSidebar />
          
          <Box sx={{ flex: 1, bgcolor: '#f8f9fa', p: 3, borderRadius: '16px' }}>
            {/* Header */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
              <IconButton onClick={() => navigate('/admin/organizations')} sx={{ color: '#15e420' }}>
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
                Organization Details
              </Typography>
              <Box sx={{ ml: 'auto', display: 'flex', gap: 2, alignItems: 'center' }}>
                {/* Document Summary */}
                <Box sx={{ display: 'flex', gap: 1 }}>
                  {documentSummary.rejected > 0 && (
                    <Chip
                      size="small"
                      icon={<CancelIcon />}
                      label={`${documentSummary.rejected} Rejected`}
                      color="error"
                      variant="outlined"
                    />
                  )}
                  {documentSummary.pending > 0 && (
                    <Chip
                      size="small"
                      icon={<PendingIcon />}
                      label={`${documentSummary.pending} Pending`}
                      color="warning"
                      variant="outlined"
                    />
                  )}
                  {documentSummary.approved > 0 && (
                    <Chip
                      size="small"
                      icon={<CheckCircleIcon />}
                      label={`${documentSummary.approved} Approved`}
                      color="success"
                      variant="outlined"
                    />
                  )}
                </Box>
                {getStatusChip(organization.status)}
              </Box>
            </Box>

            <Grid container spacing={3}>
              {/* Basic Information */}
              <Grid item xs={12} md={6}>
                <StyledCard>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                      <Avatar sx={{ bgcolor: '#15e420', width: 56, height: 56 }}>
                        <BusinessIcon />
                      </Avatar>
                      <Box>
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                          {organization.company_name}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          {organization.cac_number || 'No CAC Number'}
                        </Typography>
                      </Box>
                    </Box>

                    <Divider sx={{ mb: 3 }} />

                    <List>
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
                          <PhoneIcon sx={{ color: '#15e420' }} />
                        </ListItemIcon>
                        <ListItemText 
                          primary="Phone"
                          secondary={organization.phone_number || 'N/A'}
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon>
                          <LocationIcon sx={{ color: '#15e420' }} />
                        </ListItemIcon>
                        <ListItemText 
                          primary="Address"
                          secondary={organization.office_address || 'N/A'}
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon>
                          <BusinessIcon sx={{ color: '#15e420' }} />
                        </ListItemIcon>
                        <ListItemText 
                          primary="Nature of Business"
                          secondary={organization.business_nature || 'N/A'}
                        />
                      </ListItem>
                    </List>

                    {/* Re-upload Info */}
                    {hasReuploaded && (
                      <Box sx={{ mt: 2 }}>
                        <Divider sx={{ my: 2 }} />
                        <Typography variant="subtitle2" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <RefreshIcon fontSize="small" sx={{ color: '#15e420' }} />
                          Last Re-upload: {new Date(organization.last_re_upload_at || reuploadHistory[0]?.created_at).toLocaleDateString()}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          Total re-uploads: {organization.re_upload_count || reuploadHistory.length}
                        </Typography>
                      </Box>
                    )}
                  </CardContent>
                </StyledCard>
              </Grid>

              {/* Payment Information */}
              <Grid item xs={12} md={6}>
                <StyledCard>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                      <Avatar sx={{ bgcolor: '#15e420', width: 56, height: 56 }}>
                        <PaymentIcon />
                      </Avatar>
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        Payment History
                      </Typography>
                    </Box>

                    <Divider sx={{ mb: 3 }} />

                    {payments.length > 0 ? (
                      payments.map((payment, index) => (
                        <Paper key={index} sx={{ p: 2, mb: 2, bgcolor: '#f8f9fa' }}>
                          <Grid container spacing={2}>
                            <Grid item xs={6}>
                              <Typography variant="caption" color="textSecondary">
                                Amount
                              </Typography>
                              <Typography variant="body1" sx={{ fontWeight: 600 }}>
                                ₦{payment.amount?.toLocaleString()}
                              </Typography>
                            </Grid>
                            <Grid item xs={6}>
                              <Typography variant="caption" color="textSecondary">
                                Status
                              </Typography>
                              <Box>
                                <Chip
                                  label={payment.status}
                                  size="small"
                                  color={payment.status === 'approved' ? 'success' : 'warning'}
                                />
                              </Box>
                            </Grid>
                            <Grid item xs={6}>
                              <Typography variant="caption" color="textSecondary">
                                Type
                              </Typography>
                              <Typography variant="body2">
                                {payment.payment_type === 'first' ? 'First Payment' : 'Renewal'}
                              </Typography>
                            </Grid>
                            <Grid item xs={6}>
                              <Typography variant="caption" color="textSecondary">
                                Date
                              </Typography>
                              <Typography variant="body2">
                                {new Date(payment.created_at).toLocaleDateString()}
                              </Typography>
                            </Grid>
                          </Grid>
                        </Paper>
                      ))
                    ) : (
                      <Typography color="textSecondary">No payments found</Typography>
                    )}
                  </CardContent>
                </StyledCard>
              </Grid>

              {/* Documents */}
              <Grid item xs={12}>
                <StyledCard>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                      <Avatar sx={{ bgcolor: '#15e420', width: 56, height: 56 }}>
                        <DescriptionIcon />
                      </Avatar>
                      <Box>
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                          Uploaded Documents
                        </Typography>
                        {!allDocumentsApproved && organization.status === 'pending' && (
                          <Typography variant="caption" color="warning.main">
                            {documentSummary.rejected > 0 
                              ? `${documentSummary.rejected} document(s) need re-upload` 
                              : 'Approve all documents before approving organization'}
                          </Typography>
                        )}
                      </Box>
                    </Box>

                    <Divider sx={{ mb: 3 }} />

                    <Grid container spacing={3}>
                      {documents.map((doc) => {
                        // Check if this document was re-uploaded
                        const wasReuploaded = reuploadHistory.some(
                          h => h.title?.includes(doc.name) || h.message?.includes(doc.name)
                        );
                        
                        return (
                          <Grid item xs={12} sm={6} md={4} key={doc.key}>
                            <DocumentCard
                              document={doc}
                              status={documentStatus[doc.key]}
                              rejectionReason={rejectionReasons[doc.key]}
                              isReuploaded={wasReuploaded && documentStatus[doc.key] === 'pending'}
                              organizationStatus={organization.status}
                              processing={processing}
                              onView={handleViewDocument}
                              onDownload={handleDownloadDocument}
                              onApprove={handleApproveDocument}
                              onReject={(doc) => setRejectDialog({ open: true, doc })}
                            />
                          </Grid>
                        );
                      })}
                    </Grid>

                    {documents.length === 0 && (
                      <Typography color="textSecondary" align="center" sx={{ py: 4 }}>
                        No documents uploaded yet
                      </Typography>
                    )}
                  </CardContent>
                </StyledCard>
              </Grid>

              {/* Actions */}
              {organization.status === 'pending' && (
                <Grid item xs={12}>
                  <Paper sx={{ p: 3, borderRadius: '16px' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                      <Button
                        variant="outlined"
                        color="error"
                        startIcon={<CancelIcon />}
                        onClick={() => setRejectOrgDialog(true)}
                        disabled={processing}
                      >
                        Reject Organization
                      </Button>
                      <Button
                        variant="contained"
                        startIcon={<CheckCircleIcon />}
                        onClick={() => setApproveOrgDialog(true)}
                        disabled={!allDocumentsApproved || processing || documentSummary.rejected > 0}
                        sx={{ 
                          bgcolor: allDocumentsApproved && documentSummary.rejected === 0 ? '#15e420' : '#ccc',
                          '&:hover': { 
                            bgcolor: allDocumentsApproved && documentSummary.rejected === 0 ? '#12c21e' : '#ccc' 
                          }
                        }}
                      >
                        {processing 
                          ? 'Processing...' 
                          : documentSummary.rejected > 0 
                            ? `${documentSummary.rejected} Document(s) Need Re-upload` 
                            : allDocumentsApproved 
                              ? 'Approve Organization' 
                              : `${documentSummary.pending} Document(s) Pending`}
                      </Button>
                    </Box>
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

export default AdminOrganizationDetail;