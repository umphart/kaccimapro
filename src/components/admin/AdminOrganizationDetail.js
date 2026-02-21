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
  Tooltip,
  Badge
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
  Verified as VerifiedIcon,
  Pending as PendingIcon,
  Visibility as VisibilityIcon,
  Download as DownloadIcon,
  PictureAsPdf as PdfIcon,
  Image as ImageIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import AdminSidebar from './AdminSidebar';

const StyledCard = styled(Card)(({ theme }) => ({
  borderRadius: '16px',
  boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)',
  height: '100%'
}));

const DocumentCard = styled(Paper)(({ theme, status }) => ({
  padding: theme.spacing(2),
  borderRadius: '12px',
  border: status === 'rejected' ? '2px solid #dc3545' : 
          status === 'approved' ? '2px solid #28a745' : 
          '2px solid #ffc107',
  backgroundColor: status === 'rejected' ? '#ffebee' : 
                  status === 'approved' ? '#e8f5e9' : 
                  '#fff3e0',
  transition: 'all 0.3s',
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: '0 10px 30px rgba(0, 0, 0, 0.15)'
  }
}));

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

const getFileIcon = (fileName) => {
  const ext = fileName?.split('.').pop()?.toLowerCase();
  if (ext === 'pdf') return <PdfIcon sx={{ fontSize: 40, color: '#dc3545' }} />;
  if (['jpg', 'jpeg', 'png', 'gif'].includes(ext)) return <ImageIcon sx={{ fontSize: 40, color: '#15e420' }} />;
  return <DescriptionIcon sx={{ fontSize: 40, color: '#17a2b8' }} />;
};

const AdminOrganizationDetail = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [organization, setOrganization] = useState(null);
  const [payments, setPayments] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [documentStatus, setDocumentStatus] = useState({});
  const [rejectionReasons, setRejectionReasons] = useState({});
  const [alert, setAlert] = useState({ open: false, type: 'success', message: '' });
  
  // Dialogs
  const [rejectDialog, setRejectDialog] = useState({ open: false, doc: null });
  const [rejectReason, setRejectReason] = useState('');
  const [approveOrgDialog, setApproveOrgDialog] = useState(false);
  const [rejectOrgDialog, setRejectOrgDialog] = useState(false);
  const [orgRejectReason, setOrgRejectReason] = useState('');
  const [viewDocument, setViewDocument] = useState(null);
  const [documentUrl, setDocumentUrl] = useState(null);

  useEffect(() => {
    fetchOrganizationDetails();
  }, [id]);

  const showAlert = (type, message) => {
    setAlert({ open: true, type, message });
  };

  const handleCloseAlert = () => {
    setAlert({ ...alert, open: false });
  };

  const fetchOrganizationDetails = async () => {
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
        .in('type', ['document_approved', 'document_rejected'])
        .order('created_at', { ascending: false });

      if (notifError) throw notifError;

      // Build documents list with status
      const docs = [];
      const status = {};
      const reasons = {};

      documentFields.forEach(field => {
        if (orgData[field.key]) {
          docs.push({
            key: field.key,
            name: field.name,
            path: orgData[field.key]
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
              // Extract rejection reason from message
              const reason = latest.message.split('Reason: ')[1] || 'No reason provided';
              reasons[field.key] = reason;
            }
          } else {
            status[field.key] = 'pending';
          }
        }
      });

      setDocuments(docs);
      setDocumentStatus(status);
      setRejectionReasons(reasons);
    } catch (error) {
      console.error('Error fetching organization:', error);
      showAlert('error', 'Failed to load organization details');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDocument = async (doc) => {
    try {
      setViewDocument(doc);
      
      // Determine which bucket to use
      const bucket = doc.key === 'company_logo_path' ? 'logos' : 'documents';
      
      // Get the public URL
      const { data } = supabase.storage
        .from(bucket)
        .getPublicUrl(doc.path);
      
      setDocumentUrl(data.publicUrl);
    } catch (error) {
      console.error('Error getting document URL:', error);
      showAlert('error', 'Could not load document');
    }
  };

  const handleDownloadDocument = async (doc) => {
    try {
      const bucket = doc.key === 'company_logo_path' ? 'logos' : 'documents';
      const { data, error } = await supabase.storage
        .from(bucket)
        .download(doc.path);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${organization?.company_name}_${doc.name}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading document:', error);
      showAlert('error', 'Failed to download document');
    }
  };

  const handleApproveDocument = async (doc) => {
    try {
      // Create approval notification
      const { error: notifError } = await supabase
        .from('organization_notifications')
        .insert([{
          organization_id: id,
          type: 'document_approved',
          title: `${doc.name} Approved`,
          message: `Your ${doc.name} has been approved.`,
          category: 'document',
          action_url: '/documents',
          read: false
        }]);

      if (notifError) throw notifError;

      // Update local state
      setDocumentStatus(prev => ({ ...prev, [doc.key]: 'approved' }));
      
      showAlert('success', `${doc.name} approved successfully`);
    } catch (error) {
      console.error('Error approving document:', error);
      showAlert('error', 'Failed to approve document');
    }
  };

  const handleRejectDocument = async () => {
    if (!rejectDialog.doc || !rejectReason.trim()) return;

    try {
      const doc = rejectDialog.doc;

      // Create rejection notification
      const { error: notifError } = await supabase
        .from('organization_notifications')
        .insert([{
          organization_id: id,
          type: 'document_rejected',
          title: `${doc.name} Rejected`,
          message: `Your ${doc.name} has been rejected. Reason: ${rejectReason}`,
          category: 'document',
          action_url: '/documents',
          read: false
        }]);

      if (notifError) throw notifError;

      // Update local state
      setDocumentStatus(prev => ({ ...prev, [doc.key]: 'rejected' }));
      setRejectionReasons(prev => ({ ...prev, [doc.key]: rejectReason }));
      
      showAlert('success', `${doc.name} rejected`);
      setRejectDialog({ open: false, doc: null });
      setRejectReason('');
    } catch (error) {
      console.error('Error rejecting document:', error);
      showAlert('error', 'Failed to reject document');
    }
  };

  const handleApproveOrganization = async () => {
    try {
      // Check if all documents are approved
      const allApproved = documents.every(doc => documentStatus[doc.key] === 'approved');
      
      if (!allApproved) {
        showAlert('error', 'All documents must be approved before approving the organization');
        setApproveOrgDialog(false);
        return;
      }

      // Update organization status
      const { error: orgError } = await supabase
        .from('organizations')
        .update({ 
          status: 'approved',
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (orgError) throw orgError;

      // Create notification for organization
      await supabase
        .from('organization_notifications')
        .insert([{
          organization_id: id,
          type: 'success',
          title: 'Organization Approved',
          message: 'Your organization has been fully approved! You can now access all features.',
          category: 'registration',
          action_url: '/dashboard',
          read: false
        }]);

      showAlert('success', 'Organization approved successfully');
      setApproveOrgDialog(false);
      fetchOrganizationDetails(); // Refresh data
    } catch (error) {
      console.error('Error approving organization:', error);
      showAlert('error', 'Failed to approve organization');
    }
  };

  const handleRejectOrganization = async () => {
    if (!orgRejectReason.trim()) return;

    try {
      // Update organization status
      const { error: orgError } = await supabase
        .from('organizations')
        .update({ 
          status: 'rejected',
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (orgError) throw orgError;

      // Create notification for organization
      await supabase
        .from('organization_notifications')
        .insert([{
          organization_id: id,
          type: 'error',
          title: 'Organization Rejected',
          message: `Your organization registration has been rejected. Reason: ${orgRejectReason}`,
          category: 'registration',
          action_url: '/contact',
          read: false
        }]);

      showAlert('success', 'Organization rejected');
      setRejectOrgDialog(false);
      setOrgRejectReason('');
      fetchOrganizationDetails(); // Refresh data
    } catch (error) {
      console.error('Error rejecting organization:', error);
      showAlert('error', 'Failed to reject organization');
    }
  };

  const checkAllDocumentsApproved = () => {
    return documents.every(doc => documentStatus[doc.key] === 'approved');
  };

  const getDocumentStatusChip = (status) => {
    switch(status) {
      case 'approved':
        return <Chip size="small" icon={<CheckCircleIcon />} label="Approved" color="success" />;
      case 'rejected':
        return <Chip size="small" icon={<CancelIcon />} label="Rejected" color="error" />;
      default:
        return <Chip size="small" icon={<PendingIcon />} label="Pending" color="warning" />;
    }
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

      {/* Document Viewer Modal */}
      <Dialog
        open={!!viewDocument}
        onClose={() => {
          setViewDocument(null);
          setDocumentUrl(null);
        }}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          fontFamily: '"Poppins", sans-serif'
        }}>
          {viewDocument?.name} - {organization?.company_name}
          <IconButton onClick={() => {
            setViewDocument(null);
            setDocumentUrl(null);
          }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <Box sx={{ position: 'relative', minHeight: 600 }}>
            <Box
              sx={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                opacity: 0.1,
                pointerEvents: 'none',
                zIndex: 0
              }}
            >
              <img src="/static/logo.png" alt="Watermark" width={200} />
            </Box>
            {documentUrl ? (
              viewDocument?.key === 'company_logo_path' ? (
                // For images (like company logo)
                <Box sx={{ 
                  display: 'flex', 
                  justifyContent: 'center', 
                  alignItems: 'center', 
                  height: 600,
                  position: 'relative',
                  zIndex: 1
                }}>
                  <img 
                    src={documentUrl} 
                    alt={viewDocument.name}
                    style={{ 
                      maxWidth: '100%', 
                      maxHeight: '100%', 
                      objectFit: 'contain' 
                    }} 
                  />
                </Box>
              ) : (
                // For PDFs and other documents
                <iframe
                  src={documentUrl}
                  title={viewDocument.name}
                  width="100%"
                  height="600px"
                  style={{ border: 'none', position: 'relative', zIndex: 1 }}
                />
              )
            ) : (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 600 }}>
                <Typography>Loading document...</Typography>
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => handleDownloadDocument(viewDocument)}
            startIcon={<DownloadIcon />}
            sx={{ color: '#15e420' }}
          >
            Download
          </Button>
          <Button onClick={() => {
            setViewDocument(null);
            setDocumentUrl(null);
          }}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Document Reject Dialog */}
      <Dialog open={rejectDialog.open} onClose={() => setRejectDialog({ open: false, doc: null })} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontFamily: '"Poppins", sans-serif' }}>
          Reject {rejectDialog.doc?.name}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2, color: '#666' }}>
            Please provide a reason for rejecting this document:
          </Typography>
          <TextField
            autoFocus
            multiline
            rows={4}
            fullWidth
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="Enter rejection reason..."
            variant="outlined"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRejectDialog({ open: false, doc: null })}>Cancel</Button>
          <Button 
            onClick={handleRejectDocument} 
            color="error" 
            variant="contained"
            disabled={!rejectReason.trim()}
          >
            Reject Document
          </Button>
        </DialogActions>
      </Dialog>

      {/* Organization Reject Dialog */}
      <Dialog open={rejectOrgDialog} onClose={() => setRejectOrgDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontFamily: '"Poppins", sans-serif' }}>
          Reject Organization
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2, color: '#666' }}>
            Please provide a reason for rejecting this organization:
          </Typography>
          <TextField
            autoFocus
            multiline
            rows={4}
            fullWidth
            value={orgRejectReason}
            onChange={(e) => setOrgRejectReason(e.target.value)}
            placeholder="Enter rejection reason..."
            variant="outlined"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRejectOrgDialog(false)}>Cancel</Button>
          <Button 
            onClick={handleRejectOrganization} 
            color="error" 
            variant="contained"
            disabled={!orgRejectReason.trim()}
          >
            Reject Organization
          </Button>
        </DialogActions>
      </Dialog>

      {/* Organization Approve Confirmation Dialog */}
      <Dialog open={approveOrgDialog} onClose={() => setApproveOrgDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontFamily: '"Poppins", sans-serif' }}>
          Approve Organization
        </DialogTitle>
        <DialogContent>
          {allDocumentsApproved ? (
            <Alert severity="success" sx={{ mb: 2 }}>
              All documents are approved. Ready to approve organization.
            </Alert>
          ) : (
            <Alert severity="warning" sx={{ mb: 2 }}>
              Not all documents are approved yet. Please approve all documents first.
            </Alert>
          )}
          <Typography variant="body2" sx={{ color: '#666' }}>
            Are you sure you want to approve {organization.company_name}?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setApproveOrgDialog(false)}>Cancel</Button>
          <Button 
            onClick={handleApproveOrganization} 
            color="success" 
            variant="contained"
            disabled={!allDocumentsApproved}
          >
            Approve Organization
          </Button>
        </DialogActions>
      </Dialog>

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
              <Box sx={{ ml: 'auto' }}>
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
                            Approve all documents before approving organization
                          </Typography>
                        )}
                      </Box>
                    </Box>

                    <Divider sx={{ mb: 3 }} />

                    <Grid container spacing={3}>
                      {documents.map((doc) => (
                        <Grid item xs={12} sm={6} md={4} key={doc.key}>
                          <DocumentCard status={documentStatus[doc.key]}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                {getFileIcon(doc.path)}
                                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                                  {doc.name}
                                </Typography>
                              </Box>
                              <Badge
                                color={
                                  documentStatus[doc.key] === 'approved' ? 'success' :
                                  documentStatus[doc.key] === 'rejected' ? 'error' : 'warning'
                                }
                                variant="dot"
                              />
                            </Box>

                            <Box sx={{ mb: 2 }}>
                              {getDocumentStatusChip(documentStatus[doc.key])}
                            </Box>

                            {rejectionReasons[doc.key] && (
                              <Tooltip title={rejectionReasons[doc.key]}>
                                <Typography variant="caption" color="error" sx={{ display: 'block', mb: 1 }}>
                                  <InfoIcon fontSize="inherit" /> {rejectionReasons[doc.key].substring(0, 50)}...
                                </Typography>
                              </Tooltip>
                            )}

                            <Box sx={{ display: 'flex', gap: 1, justifyContent: 'space-between', alignItems: 'center' }}>
                              <Box>
                                <IconButton 
                                  size="small" 
                                  onClick={() => handleViewDocument(doc)} 
                                  sx={{ color: '#15e420' }}
                                  title="View Document"
                                >
                                  <VisibilityIcon />
                                </IconButton>
                                <IconButton 
                                  size="small" 
                                  onClick={() => handleDownloadDocument(doc)} 
                                  sx={{ color: '#15e420' }}
                                  title="Download Document"
                                >
                                  <DownloadIcon />
                                </IconButton>
                              </Box>
                              
                              {organization.status === 'pending' && documentStatus[doc.key] !== 'approved' && (
                                <Box>
                                  {documentStatus[doc.key] !== 'rejected' && (
                                    <IconButton 
                                      size="small" 
                                      onClick={() => setRejectDialog({ open: true, doc })}
                                      sx={{ color: '#dc3545' }}
                                      title="Reject Document"
                                    >
                                      <CancelIcon />
                                    </IconButton>
                                  )}
                                  <IconButton 
                                    size="small" 
                                    onClick={() => handleApproveDocument(doc)}
                                    sx={{ color: '#28a745' }}
                                    title="Approve Document"
                                  >
                                    <CheckCircleIcon />
                                  </IconButton>
                                </Box>
                              )}
                            </Box>
                          </DocumentCard>
                        </Grid>
                      ))}
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
                      >
                        Reject Organization
                      </Button>
                      <Button
                        variant="contained"
                        startIcon={<CheckCircleIcon />}
                        onClick={() => setApproveOrgDialog(true)}
                        disabled={!allDocumentsApproved}
                        sx={{ 
                          bgcolor: allDocumentsApproved ? '#15e420' : '#ccc',
                          '&:hover': { bgcolor: allDocumentsApproved ? '#12c21e' : '#ccc' }
                        }}
                      >
                        {allDocumentsApproved ? 'Approve Organization' : 'Documents Pending'}
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