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
  CardActions,
  IconButton,
  Chip,
  Button,
  Alert,
  Snackbar,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Avatar,
  TextField
 
} from '@mui/material';
import {
  
  Pending as PendingIcon,
  ArrowBack as ArrowBackIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Description as DescriptionIcon,
  PictureAsPdf as PdfIcon,
  Image as ImageIcon,
  Visibility as VisibilityIcon,
  Download as DownloadIcon,
  Business as BusinessIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import AdminSidebar from './AdminSidebar';

const StyledCard = styled(Card)(({ theme }) => ({
  height: '100%',
  borderRadius: '16px',
  boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)',
  transition: 'all 0.3s',
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: '0 15px 35px rgba(21, 228, 32, 0.15)'
  }
}));

const getFileIcon = (type) => {
  if (type?.includes('pdf')) return <PdfIcon sx={{ fontSize: 40, color: '#dc3545' }} />;
  if (type?.includes('image')) return <ImageIcon sx={{ fontSize: 40, color: '#15e420' }} />;
  return <DescriptionIcon sx={{ fontSize: 40, color: '#17a2b8' }} />;
};

const AdminOrganizationDocuments = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [organization, setOrganization] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [alert, setAlert] = useState({ open: false, type: 'success', message: '' });
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [currentDoc, setCurrentDoc] = useState(null);

  useEffect(() => {
    fetchOrganizationData();
  }, [id]);

  const showAlert = (type, message) => {
    setAlert({ open: true, type, message });
  };

  const handleCloseAlert = () => {
    setAlert({ ...alert, open: false });
  };

 const fetchOrganizationData = async () => {
  setLoading(true);
  try {
    // Fetch organization details
    const { data: orgData, error: orgError } = await supabase
      .from('organizations')
      .select('*')
      .eq('id', id)
      .single();

    if (orgError) throw orgError;
    setOrganization(orgData);

    // Fetch rejection notifications for this organization
    const { data: notifications, error: notifError } = await supabase
      .from('organization_notifications')
      .select('*')
      .eq('organization_id', id)
      .in('type', ['document_rejected', 'document_approved'])
      .order('created_at', { ascending: false });

    if (notifError) throw notifError;

    // Build documents list from organization fields
    const docFields = [
      { name: 'Cover Letter', path: orgData.cover_letter_path, field: 'cover_letter_path' },
      { name: 'Memorandum', path: orgData.memorandum_path, field: 'memorandum_path' },
      { name: 'Registration Certificate', path: orgData.registration_cert_path, field: 'registration_cert_path' },
      { name: 'Incorporation Certificate', path: orgData.incorporation_cert_path, field: 'incorporation_cert_path' },
      { name: 'Premises Certificate', path: orgData.premises_cert_path, field: 'premises_cert_path' },
      { name: 'Company Logo', path: orgData.company_logo_path, field: 'company_logo_path' },
      { name: 'Form C07', path: orgData.form_c07_path, field: 'form_c07_path' },
      { name: 'ID Document', path: orgData.id_document_path, field: 'id_document_path' }
    ];

    // Filter only documents that have been uploaded
    const uploadedDocs = docFields
      .filter(doc => doc.path)
      .map((doc) => {
        // Check if this document was rejected
        const rejectedNotif = notifications?.find(n => 
          n.type === 'document_rejected' && n.title.includes(doc.name)
        );
        
        const approvedNotif = notifications?.find(n => 
          n.type === 'document_approved' && n.title.includes(doc.name)
        );

        let status = 'pending';
        if (rejectedNotif && (!approvedNotif || new Date(rejectedNotif.created_at) > new Date(approvedNotif.created_at))) {
          status = 'rejected';
        } else if (approvedNotif) {
          status = 'approved';
        }

        return {
          id: `${id}_${doc.field}`,
          name: doc.name,
          path: doc.path,
          field: doc.field,
          type: doc.name === 'Company Logo' ? 'image' : 'document',
          status: status,
          rejectionReason: rejectedNotif ? rejectedNotif.message.replace(`Your ${doc.name} has been rejected. Reason: `, '') : null,
          uploadedAt: new Date().toISOString()
        };
      });

    setDocuments(uploadedDocs);
  } catch (error) {
    console.error('Error fetching organization:', error);
    showAlert('error', 'Failed to load organization data');
  } finally {
    setLoading(false);
  }
};

  const handleViewDocument = async (doc) => {
    try {
      const bucket = doc.path.includes('companyLogo') ? 'logos' : 'documents';
      const { data } = supabase.storage
        .from(bucket)
        .getPublicUrl(doc.path);
      
      setSelectedDocument({ ...doc, url: data.publicUrl });
      setModalOpen(true);
    } catch (error) {
      console.error('Error getting document URL:', error);
      showAlert('error', 'Could not load document');
    }
  };

  const handleDownloadDocument = async (doc) => {
    try {
      const bucket = doc.path.includes('companyLogo') ? 'logos' : 'documents';
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
    // Update local state
    setDocuments(prev => prev.map(d => 
      d.id === doc.id ? { ...d, status: 'approved' } : d
    ));

    // Create a notification for the organization
    const { error: notificationError } = await supabase
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

    if (notificationError) {
      console.error('Error creating notification:', notificationError);
    }

    showAlert('success', `${doc.name} approved successfully`);
  } catch (error) {
    console.error('Error approving document:', error);
    showAlert('error', 'Failed to approve document');
  }
};
const handleRejectDocument = async () => {
  if (!currentDoc || !rejectReason) return;

  try {
    const docFieldMap = {
      'Cover Letter': 'cover_letter_path',
      'Memorandum': 'memorandum_path',
      'Registration Certificate': 'registration_cert_path',
      'Incorporation Certificate': 'incorporation_cert_path',
      'Premises Certificate': 'premises_cert_path',
      'Company Logo': 'company_logo_path',
      'Form C07': 'form_c07_path',
      'ID Document': 'id_document_path'
    };

    const rejectionFieldMap = {
      'Cover Letter': 'cover_letter_rejection_reason',
      'Memorandum': 'memorandum_rejection_reason',
      'Registration Certificate': 'registration_cert_rejection_reason',
      'Incorporation Certificate': 'incorporation_cert_rejection_reason',
      'Premises Certificate': 'premises_cert_rejection_reason',
      'Company Logo': 'company_logo_rejection_reason',
      'Form C07': 'form_c07_rejection_reason',
      'ID Document': 'id_document_rejection_reason'
    };

    const documentField = docFieldMap[currentDoc.name];
    const rejectionField = rejectionFieldMap[currentDoc.name];

    // Update the organization with rejection reason
    const updateData = {
      [rejectionField]: rejectReason
    };

    const { error: updateError } = await supabase
      .from('organizations')
      .update(updateData)
      .eq('id', id);

    if (updateError) throw updateError;

    // Create notification for the organization
    const { error: notificationError } = await supabase
      .from('organization_notifications')
      .insert([{
        organization_id: id,
        type: 'document_rejected',
        title: `${currentDoc.name} Rejected`,
        message: `Your ${currentDoc.name} has been rejected. Reason: ${rejectReason}`,
        category: 'document',
        action_url: '/documents',
        read: false
      }]);

    if (notificationError) throw notificationError;

    // Update local state
    setDocuments(prev => prev.map(d => 
      d.id === currentDoc.id ? { ...d, status: 'rejected', rejectionReason: rejectReason } : d
    ));
    
    showAlert('success', `${currentDoc.name} rejected successfully`);
    setRejectDialogOpen(false);
    setRejectReason('');
    setCurrentDoc(null);
  } catch (error) {
    console.error('Error rejecting document:', error);
    showAlert('error', 'Failed to reject document: ' + error.message);
  }
};

  const openRejectDialog = (doc) => {
    setCurrentDoc(doc);
    setRejectDialogOpen(true);
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
        size="small"
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
          
          <Box sx={{ flex: 1, bgcolor: '#f8f9fa', p: 3, borderRadius: '16px' }}>
            {/* Header with Back Button */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
              <IconButton 
                onClick={() => navigate('/admin/documents')} 
                sx={{ color: '#15e420', bgcolor: 'white' }}
              >
                <ArrowBackIcon />
              </IconButton>
              <Box>
                <Typography 
                  variant="h4" 
                  sx={{ 
                    fontFamily: '"Poppins", sans-serif',
                    fontWeight: 700,
                    color: '#333',
                    mb: 1
                  }}
                >
                  {organization.company_name} - Documents
                </Typography>
                <Typography 
                  variant="body1" 
                  sx={{ 
                    fontFamily: '"Inter", sans-serif',
                    color: '#666'
                  }}
                >
                  
                </Typography>
              </Box>
            </Box>

            {/* Organization Info Card */}
            <Paper sx={{ p: 3, mb: 4, borderRadius: '16px', bgcolor: 'white' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ bgcolor: '#15e420', width: 56, height: 56 }}>
                  <BusinessIcon />
                </Avatar>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    {organization.company_name}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    {organization.email} | {organization.phone_number}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    CAC: {organization.cac_number}
                  </Typography>
                </Box>
                <Box sx={{ ml: 'auto' }}>
                  <Chip
                    label={organization.status}
                    color={
                      organization.status === 'approved' ? 'success' :
                      organization.status === 'pending' ? 'warning' : 'error'
                    }
                  />
                </Box>
              </Box>
            </Paper>

            {/* Documents Grid */}
            <Grid container spacing={3}>
              {documents.map((doc) => (
                <Grid item xs={12} sm={6} md={4} key={doc.id}>
                  <StyledCard>
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        {getFileIcon(doc.type)}
                        <Box sx={{ ml: 2, flex: 1 }}>
                          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                            {doc.name}
                          </Typography>
                        </Box>
                      </Box>
                      <Box sx={{ mb: 2 }}>
                        {getStatusChip(doc.status)}
                      </Box>
                      {doc.rejectionReason && (
                        <Typography variant="caption" color="error" sx={{ display: 'block', mb: 1 }}>
                          Reason: {doc.rejectionReason}
                        </Typography>
                      )}
                    </CardContent>
                    <CardActions sx={{ justifyContent: 'space-between', p: 2, pt: 0 }}>
                      <Box>
                        <IconButton 
                          onClick={() => handleViewDocument(doc)} 
                          size="small" 
                          sx={{ color: '#15e420' }}
                        >
                          <VisibilityIcon />
                        </IconButton>
                        <IconButton 
                          onClick={() => handleDownloadDocument(doc)} 
                          size="small" 
                          sx={{ color: '#15e420' }}
                        >
                          <DownloadIcon />
                        </IconButton>
                      </Box>
                      {doc.status === 'pending' && (
                        <Box>
                          <IconButton 
                            onClick={() => openRejectDialog(doc)} 
                            size="small" 
                            sx={{ color: '#dc3545' }}
                          >
                            <CancelIcon />
                          </IconButton>
                          <IconButton 
                            onClick={() => handleApproveDocument(doc)} 
                            size="small" 
                            sx={{ color: '#28a745' }}
                          >
                            <CheckCircleIcon />
                          </IconButton>
                        </Box>
                      )}
                    </CardActions>
                  </StyledCard>
                </Grid>
              ))}
              {documents.length === 0 && (
                <Grid item xs={12}>
                  <Paper sx={{ p: 4, textAlign: 'center' }}>
                    <DescriptionIcon sx={{ fontSize: 64, color: '#ccc', mb: 2 }} />
                    <Typography variant="h6" sx={{ color: '#666' }}>
                      No documents uploaded for this organization
                    </Typography>
                  </Paper>
                </Grid>
              )}
            </Grid>
          </Box>
        </Box>
      </Container>

      {/* Document Viewer Modal */}
      <Dialog
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          fontFamily: '"Poppins", sans-serif'
        }}>
          {selectedDocument?.name} - {organization?.company_name}
          <IconButton onClick={() => setModalOpen(false)}>
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
                pointerEvents: 'none'
              }}
            >
              <img src="/static/logo.png" alt="Watermark" width={200} />
            </Box>
            {selectedDocument?.url ? (
              <iframe
                src={selectedDocument.url}
                title={selectedDocument.name}
                width="100%"
                height="600px"
                style={{ border: 'none', position: 'relative', zIndex: 1 }}
              />
            ) : (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 600 }}>
                <Typography>Document preview not available</Typography>
              </Box>
            )}
          </Box>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onClose={() => setRejectDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontFamily: '"Poppins", sans-serif' }}>
          Reject Document
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2, color: '#666' }}>
            Please provide a reason for rejecting {currentDoc?.name}
          </Typography>
          <TextField
            autoFocus
            margin="dense"
            label="Rejection Reason"
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
            onClick={handleRejectDocument} 
            color="error" 
            variant="contained"
            disabled={!rejectReason.trim()}
          >
            Reject Document
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default AdminOrganizationDocuments;