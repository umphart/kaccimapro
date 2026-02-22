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
  TextField,
  Divider,
  LinearProgress,
  Tooltip,
  useMediaQuery,
  useTheme
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
  Close as CloseIcon,
  Info as InfoIcon,
  Verified as VerifiedIcon,
  Warning as WarningIcon,
  ViewModule as ViewModuleIcon,
  ViewList as ViewListIcon
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import AdminSidebar from './AdminSidebar';

// Styled Components
const StyledCard = styled(Card)(({ theme, status }) => ({
  height: '100%',
  borderRadius: '16px',
  boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)',
  transition: 'all 0.3s ease',
  display: 'flex',
  flexDirection: 'column',
  position: 'relative',
  overflow: 'visible',
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: '0 15px 35px rgba(21, 228, 32, 0.15)'
  },
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '4px',
    background: status === 'approved' ? '#28a745' : 
                status === 'rejected' ? '#dc3545' : 
                '#ffc107',
    borderTopLeftRadius: '16px',
    borderTopRightRadius: '16px'
  }
}));

const DocumentIconWrapper = styled(Box)(({ theme, status }) => ({
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  width: '70px',
  height: '70px',
  borderRadius: '50%',
  margin: '0 auto 12px auto',
  background: status === 'approved' ? 'rgba(40, 167, 69, 0.1)' : 
              status === 'rejected' ? 'rgba(220, 53, 69, 0.1)' : 
              'rgba(255, 193, 7, 0.1)',
  border: `2px solid ${status === 'approved' ? '#28a745' : 
                      status === 'rejected' ? '#dc3545' : 
                      '#ffc107'}`,
  transition: 'all 0.3s ease',
  [theme.breakpoints.down('sm')]: {
    width: '60px',
    height: '60px',
    '& svg': {
      fontSize: '32px'
    }
  },
  '& svg': {
    fontSize: '36px',
    [theme.breakpoints.down('sm')]: {
      fontSize: '30px'
    }
  }
}));

const StatusBadge = styled(Box)(({ theme }) => ({
  position: 'absolute',
  top: '12px',
  right: '12px',
  zIndex: 1,
  [theme.breakpoints.down('sm')]: {
    top: '8px',
    right: '8px'
  }
}));

const DocumentStats = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: theme.spacing(0.75, 1.5),
  backgroundColor: '#f8f9fa',
  borderRadius: '8px',
  marginTop: theme.spacing(1)
}));

const DocumentMeta = styled(Typography)(({ theme }) => ({
  fontSize: '0.7rem',
  color: '#666',
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(0.5),
  marginTop: theme.spacing(0.5)
}));

const ActionButton = styled(IconButton)(({ theme, actioncolor }) => ({
  backgroundColor: '#fff',
  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
  margin: theme.spacing(0, 0.25),
  transition: 'all 0.2s ease',
  padding: theme.spacing(0.75),
  [theme.breakpoints.down('sm')]: {
    padding: theme.spacing(0.5),
    '& svg': {
      fontSize: '1rem'
    }
  },
  '&:hover': {
    backgroundColor: actioncolor === 'approve' ? '#28a745' :
                     actioncolor === 'reject' ? '#dc3545' :
                     '#15e420',
    transform: 'scale(1.1)',
    '& svg': {
      color: '#fff'
    }
  },
  '& svg': {
    fontSize: '1.1rem',
    color: actioncolor === 'approve' ? '#28a745' :
           actioncolor === 'reject' ? '#dc3545' :
           '#15e420'
  }
}));

const ViewToggleButton = styled(IconButton)(({ theme, active }) => ({
  backgroundColor: active ? '#15e420' : '#fff',
  color: active ? '#fff' : '#666',
  marginLeft: theme.spacing(1),
  '&:hover': {
    backgroundColor: active ? '#12c21e' : '#f0f0f0'
  }
}));

const getFileIcon = (type, status) => {
  const iconColor = status === 'approved' ? '#28a745' : 
                    status === 'rejected' ? '#dc3545' : 
                    '#ffc107';
  
  if (type?.includes('pdf')) return <PdfIcon sx={{ fontSize: 'inherit', color: iconColor }} />;
  if (type?.includes('image')) return <ImageIcon sx={{ fontSize: 'inherit', color: iconColor }} />;
  return <DescriptionIcon sx={{ fontSize: 'inherit', color: iconColor }} />;
};

// List View Component
const DocumentListItem = ({ doc, onView, onDownload, onApprove, onReject, openRejectDialog, getStatusChip }) => {
  return (
    <Paper sx={{ 
      p: 2, 
      mb: 1, 
      borderRadius: '12px',
      border: '1px solid #e0e0e0',
      '&:hover': {
        bgcolor: '#f5f5f5'
      }
    }}>
      <Grid container spacing={2} alignItems="center">
        <Grid item xs={12} sm={4} md={3}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{ 
              width: 40, 
              height: 40, 
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: doc.status === 'approved' ? 'rgba(40, 167, 69, 0.1)' : 
                       doc.status === 'rejected' ? 'rgba(220, 53, 69, 0.1)' : 
                       'rgba(255, 193, 7, 0.1)'
            }}>
              {doc.type === 'image' ? <ImageIcon sx={{ color: doc.status === 'approved' ? '#28a745' : doc.status === 'rejected' ? '#dc3545' : '#ffc107' }} /> :
               doc.fileType === 'pdf' ? <PdfIcon sx={{ color: doc.status === 'approved' ? '#28a745' : doc.status === 'rejected' ? '#dc3545' : '#ffc107' }} /> :
               <DescriptionIcon sx={{ color: doc.status === 'approved' ? '#28a745' : doc.status === 'rejected' ? '#dc3545' : '#ffc107' }} />}
            </Box>
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                {doc.name}
              </Typography>
              <Typography variant="caption" color="textSecondary">
                {doc.fileType?.toUpperCase()} • {new Date(doc.uploadedAt).toLocaleDateString()}
              </Typography>
            </Box>
          </Box>
        </Grid>
        <Grid item xs={6} sm={2}>
          {getStatusChip(doc.status)}
        </Grid>
        <Grid item xs={6} sm={3}>
          {doc.rejectionReason && (
            <Tooltip title={doc.rejectionReason} arrow>
              <Typography variant="caption" color="error" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <WarningIcon sx={{ fontSize: '0.875rem' }} />
                {doc.rejectionReason.substring(0, 30)}...
              </Typography>
            </Tooltip>
          )}
        </Grid>
        <Grid item xs={12} sm={3}>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5 }}>
            <Tooltip title="View">
              <IconButton size="small" onClick={() => onView(doc)} sx={{ color: '#15e420' }}>
                <VisibilityIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Download">
              <IconButton size="small" onClick={() => onDownload(doc)} sx={{ color: '#15e420' }}>
                <DownloadIcon />
              </IconButton>
            </Tooltip>
            {doc.status === 'pending' && (
              <>
                <Tooltip title="Reject">
                  <IconButton size="small" onClick={() => openRejectDialog(doc)} sx={{ color: '#dc3545' }}>
                    <CancelIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Approve">
                  <IconButton size="small" onClick={() => onApprove(doc)} sx={{ color: '#28a745' }}>
                    <CheckCircleIcon />
                  </IconButton>
                </Tooltip>
              </>
            )}
          </Box>
        </Grid>
      </Grid>
    </Paper>
  );
};

const AdminOrganizationDocuments = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));
  
  const [loading, setLoading] = useState(true);
  const [organization, setOrganization] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [alert, setAlert] = useState({ open: false, type: 'success', message: '' });
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [currentDoc, setCurrentDoc] = useState(null);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [stats, setStats] = useState({
    total: 0,
    approved: 0,
    pending: 0,
    rejected: 0
  });

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
        .map((doc, index) => {
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
            id: `${id}_${doc.field}_${index}`,
            name: doc.name,
            path: doc.path,
            field: doc.field,
            type: doc.name === 'Company Logo' ? 'image' : 'document',
            status: status,
            rejectionReason: rejectedNotif ? rejectedNotif.message.replace(`Your ${doc.name} has been rejected. Reason: `, '') : null,
            uploadedAt: new Date().toISOString(),
            fileType: doc.path.split('.').pop().toLowerCase()
          };
        });

      setDocuments(uploadedDocs);
      
      // Calculate stats
      const approved = uploadedDocs.filter(d => d.status === 'approved').length;
      const pending = uploadedDocs.filter(d => d.status === 'pending').length;
      const rejected = uploadedDocs.filter(d => d.status === 'rejected').length;
      
      setStats({
        total: uploadedDocs.length,
        approved,
        pending,
        rejected
      });
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
      a.download = `${organization?.company_name}_${doc.name}.${doc.fileType || 'pdf'}`;
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

      // Update stats
      setStats(prev => ({
        ...prev,
        approved: prev.approved + 1,
        pending: prev.pending - 1
      }));

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
      
      // Update stats
      setStats(prev => ({
        ...prev,
        rejected: prev.rejected + 1,
        pending: prev.pending - 1
      }));
      
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
        sx={{ 
          fontFamily: '"Inter", sans-serif',
          fontWeight: 500,
          height: '24px',
          '& .MuiChip-icon': {
            fontSize: '16px'
          }
        }}
      />
    );
  };

  // Responsive grid columns
  const getGridColumns = () => {
    if (isMobile) return 12; // 1 card per row on mobile
    if (isTablet) return 6;  // 2 cards per row on tablet
    return 3;                 // 4 cards per row on desktop
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

  const approvalProgress = stats.total > 0 ? (stats.approved / stats.total) * 100 : 0;

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

      <Container maxWidth="xl" sx={{ py: 4, px: { xs: 2, sm: 3 } }}>
        <Box sx={{ display: 'flex', gap: 3 }}>
          <AdminSidebar />
          
          <Box sx={{ flex: 1, bgcolor: '#f8f9fa', p: { xs: 2, sm: 3 }, borderRadius: '16px' }}>
            {/* Header with Back Button and View Toggle */}
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 2, 
              mb: 4,
              flexDirection: { xs: 'column', sm: 'row' },
              alignItems: { xs: 'flex-start', sm: 'center' }
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: { xs: '100%', sm: 'auto' } }}>
                <IconButton 
                  onClick={() => navigate('/admin/documents')} 
                  sx={{ 
                    color: '#15e420', 
                    bgcolor: 'white',
                    '&:hover': { bgcolor: '#f0f0f0' }
                  }}
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
                      mb: 0.5,
                      fontSize: { xs: '1.5rem', sm: '2rem', md: '2.125rem' }
                    }}
                  >
                    {organization.company_name}
                  </Typography>
                  <Typography 
                    variant="body1" 
                    sx={{ 
                      fontFamily: '"Inter", sans-serif',
                      color: '#666',
                      fontSize: { xs: '0.875rem', sm: '1rem' }
                    }}
                  >
                    Document Management
                  </Typography>
                </Box>
              </Box>
              
              {/* View Toggle */}
              <Box sx={{ 
                ml: { xs: 0, sm: 'auto' }, 
                display: 'flex', 
                gap: 1,
                width: { xs: '100%', sm: 'auto' },
                justifyContent: { xs: 'flex-end', sm: 'flex-end' }
              }}>
                <Tooltip title="Grid View">
                  <ViewToggleButton 
                    active={viewMode === 'grid' ? 1 : 0}
                    onClick={() => setViewMode('grid')}
                    size="small"
                  >
                    <ViewModuleIcon />
                  </ViewToggleButton>
                </Tooltip>
                <Tooltip title="List View">
                  <ViewToggleButton 
                    active={viewMode === 'list' ? 1 : 0}
                    onClick={() => setViewMode('list')}
                    size="small"
                  >
                    <ViewListIcon />
                  </ViewToggleButton>
                </Tooltip>
              </Box>
            </Box>

            {/* Organization Info Card */}
            <Paper sx={{ p: { xs: 2, sm: 3 }, mb: 4, borderRadius: '16px', bgcolor: 'white' }}>
              <Grid container spacing={2}>
                <Grid item xs={12} md={8}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar sx={{ bgcolor: '#15e420', width: { xs: 48, sm: 56 }, height: { xs: 48, sm: 56 } }}>
                      <BusinessIcon />
                    </Avatar>
                    <Box>
                      <Typography variant="h6" sx={{ fontWeight: 600, fontSize: { xs: '1rem', sm: '1.25rem' } }}>
                        {organization.company_name}
                      </Typography>
                      <Typography variant="body2" color="textSecondary" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                        {organization.email} | {organization.phone_number || 'No phone'}
                      </Typography>
                      <Typography variant="body2" color="textSecondary" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                        CAC: {organization.cac_number || 'N/A'}
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Box sx={{ 
                    display: 'flex', 
                    flexDirection: { xs: 'row', md: 'column' }, 
                    alignItems: { xs: 'center', md: 'flex-end' }, 
                    justifyContent: { xs: 'space-between', md: 'flex-start' },
                    gap: 1,
                    mt: { xs: 1, md: 0 }
                  }}>
                    <Chip
                      label={`Status: ${organization.status}`}
                      color={
                        organization.status === 'approved' ? 'success' :
                        organization.status === 'pending' ? 'warning' : 'error'
                      }
                      sx={{ fontWeight: 500, fontSize: { xs: '0.7rem', sm: '0.75rem' } }}
                    />
                    <Typography variant="caption" color="textSecondary" sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}>
                      Documents: {stats.approved}/{stats.total} Approved
                    </Typography>
                  </Box>
                </Grid>
              </Grid>

              {/* Progress Bar */}
              <Box sx={{ mt: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600, fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                    Document Approval Progress
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: '#15e420', fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                    {Math.round(approvalProgress)}%
                  </Typography>
                </Box>
                <LinearProgress 
                  variant="determinate" 
                  value={approvalProgress}
                  sx={{ 
                    height: { xs: 8, sm: 10 }, 
                    borderRadius: 5,
                    bgcolor: '#e0e0e0',
                    '& .MuiLinearProgress-bar': {
                      bgcolor: stats.rejected > 0 ? '#dc3545' : '#15e420'
                    }
                  }}
                />
              </Box>

              {/* Stats Chips - Scrollable on mobile */}
              <Box sx={{ 
                display: 'flex', 
                gap: { xs: 1, sm: 2 }, 
                mt: 3,
                overflowX: 'auto',
                pb: 1,
                '&::-webkit-scrollbar': {
                  height: '4px',
                },
                '&::-webkit-scrollbar-thumb': {
                  backgroundColor: '#ccc',
                  borderRadius: '4px',
                }
              }}>
                <Chip
                  icon={<DescriptionIcon />}
                  label={`Total: ${stats.total}`}
                  variant="outlined"
                  size={isMobile ? "small" : "medium"}
                  sx={{ 
                    color: '#17a2b8', 
                    borderColor: '#17a2b8',
                    flexShrink: 0
                  }}
                />
                <Chip
                  icon={<CheckCircleIcon />}
                  label={`Approved: ${stats.approved}`}
                  variant="outlined"
                  size={isMobile ? "small" : "medium"}
                  sx={{ 
                    color: '#28a745', 
                    borderColor: '#28a745',
                    flexShrink: 0
                  }}
                />
                <Chip
                  icon={<PendingIcon />}
                  label={`Pending: ${stats.pending}`}
                  variant="outlined"
                  size={isMobile ? "small" : "medium"}
                  sx={{ 
                    color: '#ffc107', 
                    borderColor: '#ffc107',
                    flexShrink: 0
                  }}
                />
                <Chip
                  icon={<CancelIcon />}
                  label={`Rejected: ${stats.rejected}`}
                  variant="outlined"
                  size={isMobile ? "small" : "medium"}
                  sx={{ 
                    color: '#dc3545', 
                    borderColor: '#dc3545',
                    flexShrink: 0
                  }}
                />
              </Box>
            </Paper>

            {/* Documents Display */}
            {viewMode === 'grid' ? (
              // Grid View - 4 cards per row on desktop
              <Grid container spacing={{ xs: 2, sm: 2, md: 3 }}>
                {documents.map((doc) => (
                  <Grid item xs={12} sm={6} md={4} lg={3} key={doc.id}>
                    <StyledCard status={doc.status}>
                      <StatusBadge>
                        {getStatusChip(doc.status)}
                      </StatusBadge>
                      
                      <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column', pt: 3, p: { xs: 1.5, sm: 2 } }}>
                        <DocumentIconWrapper status={doc.status}>
                          {getFileIcon(doc.type, doc.status)}
                        </DocumentIconWrapper>
                        
                        <Typography 
                          variant="h6" 
                          align="center" 
                          sx={{ 
                            fontWeight: 600,
                            fontSize: { xs: '0.9rem', sm: '1rem' },
                            mb: 1,
                            minHeight: { xs: '40px', sm: '48px' },
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}
                        >
                          {doc.name}
                        </Typography>

                        <DocumentMeta>
                          <InfoIcon sx={{ fontSize: '0.7rem', color: '#999' }} />
                          {new Date(doc.uploadedAt).toLocaleDateString()}
                        </DocumentMeta>

                        {doc.fileType && (
                          <DocumentMeta>
                            <DescriptionIcon sx={{ fontSize: '0.7rem', color: '#999' }} />
                            {doc.fileType.toUpperCase()}
                          </DocumentMeta>
                        )}

                        {doc.rejectionReason && (
                          <Tooltip title={doc.rejectionReason} arrow>
                            <DocumentStats>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <WarningIcon sx={{ fontSize: '0.8rem', color: '#dc3545' }} />
                                <Typography variant="caption" sx={{ color: '#dc3545', fontWeight: 500, fontSize: '0.7rem' }}>
                                  Rejected
                                </Typography>
                              </Box>
                            </DocumentStats>
                          </Tooltip>
                        )}
                      </CardContent>

                      <Divider />

                      <CardActions sx={{ justifyContent: 'space-between', p: { xs: 1, sm: 2 } }}>
                        <Box>
                          <Tooltip title="View Document" arrow>
                            <ActionButton 
                              onClick={() => handleViewDocument(doc)} 
                              size="small"
                            >
                              <VisibilityIcon />
                            </ActionButton>
                          </Tooltip>
                          <Tooltip title="Download Document" arrow>
                            <ActionButton 
                              onClick={() => handleDownloadDocument(doc)} 
                              size="small"
                            >
                              <DownloadIcon />
                            </ActionButton>
                          </Tooltip>
                        </Box>
                        
                        {doc.status === 'pending' && (
                          <Box>
                            <Tooltip title="Reject Document" arrow>
                              <ActionButton 
                                onClick={() => openRejectDialog(doc)} 
                                size="small"
                                actioncolor="reject"
                              >
                                <CancelIcon />
                              </ActionButton>
                            </Tooltip>
                            <Tooltip title="Approve Document" arrow>
                              <ActionButton 
                                onClick={() => handleApproveDocument(doc)} 
                                size="small"
                                actioncolor="approve"
                              >
                                <CheckCircleIcon />
                              </ActionButton>
                            </Tooltip>
                          </Box>
                        )}
                        
                        {doc.status === 'approved' && (
                          <Tooltip title="Document Approved" arrow>
                            <Chip
                              icon={<VerifiedIcon />}
                              label="Approved"
                              size="small"
                              color="success"
                              variant="outlined"
                              sx={{ height: '24px', fontSize: '0.7rem' }}
                            />
                          </Tooltip>
                        )}
                      </CardActions>
                    </StyledCard>
                  </Grid>
                ))}
              </Grid>
            ) : (
              // List View
              <Box>
                {documents.map((doc) => (
                  <DocumentListItem
                    key={doc.id}
                    doc={doc}
                    onView={handleViewDocument}
                    onDownload={handleDownloadDocument}
                    onApprove={handleApproveDocument}
                    onReject={handleRejectDocument}
                    openRejectDialog={openRejectDialog}
                    getStatusChip={getStatusChip}
                  />
                ))}
              </Box>
            )}

            {documents.length === 0 && (
              <Paper sx={{ p: { xs: 4, sm: 6 }, textAlign: 'center', borderRadius: '16px' }}>
                <DescriptionIcon sx={{ fontSize: { xs: 60, sm: 80 }, color: '#ccc', mb: 2 }} />
                <Typography variant="h5" sx={{ color: '#666', mb: 1, fontSize: { xs: '1.25rem', sm: '1.5rem' } }}>
                  No Documents Found
                </Typography>
                <Typography variant="body2" sx={{ color: '#999', fontSize: { xs: '0.875rem', sm: '1rem' } }}>
                  This organization hasn't uploaded any documents yet
                </Typography>
              </Paper>
            )}
          </Box>
        </Box>
      </Container>

      {/* Document Viewer Modal */}
      <Dialog
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        maxWidth="lg"
        fullWidth
        fullScreen={isMobile}
        PaperProps={{
          sx: {
            borderRadius: { xs: 0, sm: '16px' },
            minHeight: { xs: '100%', sm: '80vh' }
          }
        }}
      >
        <DialogTitle sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          fontFamily: '"Poppins", sans-serif',
          borderBottom: '1px solid #e0e0e0',
          pb: 2,
          p: { xs: 2, sm: 3 }
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {selectedDocument && getFileIcon(selectedDocument.type, selectedDocument.status)}
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 600, fontSize: { xs: '1rem', sm: '1.25rem' } }}>
                {selectedDocument?.name}
              </Typography>
              <Typography variant="caption" color="textSecondary">
                {organization?.company_name}
              </Typography>
            </Box>
          </Box>
          <IconButton onClick={() => setModalOpen(false)} sx={{ color: '#666' }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers sx={{ p: 0, bgcolor: '#f5f5f5' }}>
          <Box sx={{ position: 'relative', minHeight: { xs: 'calc(100vh - 120px)', sm: '70vh' } }}>
            <Box
              sx={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                opacity: 0.05,
                pointerEvents: 'none',
                zIndex: 0
              }}
            >
              <img src="/static/logo.png" alt="Watermark" width={isMobile ? 200 : 300} />
            </Box>
            {selectedDocument?.url ? (
              selectedDocument.name === 'Company Logo' ? (
                <Box sx={{ 
                  display: 'flex', 
                  justifyContent: 'center', 
                  alignItems: 'center', 
                  height: { xs: 'calc(100vh - 120px)', sm: '70vh' },
                  position: 'relative',
                  zIndex: 1,
                  p: 2
                }}>
                  <img 
                    src={selectedDocument.url} 
                    alt={selectedDocument.name}
                    style={{ 
                      maxWidth: '100%', 
                      maxHeight: '100%', 
                      objectFit: 'contain',
                      boxShadow: '0 5px 15px rgba(0,0,0,0.1)'
                    }} 
                  />
                </Box>
              ) : (
                <iframe
                  src={selectedDocument.url}
                  title={selectedDocument.name}
                  width="100%"
                  height={isMobile ? "calc(100vh - 120px)" : "70vh"}
                  style={{ 
                    border: 'none', 
                    position: 'relative', 
                    zIndex: 1,
                    backgroundColor: '#fff'
                  }}
                />
              )
            ) : (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: { xs: 'calc(100vh - 120px)', sm: '70vh' } }}>
                <CircularProgress style={{ color: '#15e420' }} />
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: { xs: 2, sm: 3 }, justifyContent: 'space-between' }}>
          <Button 
            onClick={() => selectedDocument && handleDownloadDocument(selectedDocument)}
            startIcon={<DownloadIcon />}
            sx={{ 
              color: '#15e420',
              '&:hover': { bgcolor: 'rgba(21, 228, 32, 0.1)' }
            }}
          >
            Download
          </Button>
          <Button onClick={() => setModalOpen(false)} variant="outlined">
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog 
        open={rejectDialogOpen} 
        onClose={() => setRejectDialogOpen(false)} 
        maxWidth="sm" 
        fullWidth
        fullScreen={isMobile}
        PaperProps={{
          sx: { 
            borderRadius: { xs: 0, sm: '16px' },
            m: { xs: 0, sm: 2 }
          }
        }}
      >
        <DialogTitle sx={{ 
          fontFamily: '"Poppins", sans-serif',
          borderBottom: '1px solid #e0e0e0',
          pb: 2,
          p: { xs: 2, sm: 3 }
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CancelIcon sx={{ color: '#dc3545' }} />
            <Typography variant="h6">Reject Document</Typography>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ pt: 3, p: { xs: 2, sm: 3 } }}>
          <Typography variant="body2" sx={{ mb: 2, color: '#666' }}>
            Please provide a reason for rejecting <strong>{currentDoc?.name}</strong>
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
            placeholder="Enter detailed reason for rejection..."
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: '8px'
              }
            }}
          />
        </DialogContent>
        <DialogActions sx={{ p: { xs: 2, sm: 3 }, pt: 0 }}>
          <Button 
            onClick={() => setRejectDialogOpen(false)}
            sx={{ color: '#666' }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleRejectDocument} 
            color="error" 
            variant="contained"
            disabled={!rejectReason.trim()}
            sx={{
              borderRadius: '8px',
              px: 3
            }}
          >
            Reject
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default AdminOrganizationDocuments;