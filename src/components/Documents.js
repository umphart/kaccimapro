import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import Sidebar from './Sidebar';
import {
  Box,
  Container,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  CardActions,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Snackbar,
  CircularProgress,
  Chip,
  Tooltip,
  Button,
  LinearProgress,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  Description as DescriptionIcon,
  PictureAsPdf as PdfIcon,
  Image as ImageIcon,
  Download as DownloadIcon,
  Visibility as VisibilityIcon,
  Close as CloseIcon,
  Folder as FolderIcon,
  Badge as BadgeIcon,
  CheckCircle as CheckCircleIcon,
  Pending as PendingIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  Warning as WarningIcon,
  Verified as VerifiedIcon,
  ZoomIn as ZoomInIcon,
  ZoomOut as ZoomOutIcon,
  RotateRight as RotateIcon,
  OpenInNew as OpenInNewIcon
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';

// Document fields mapping
const DOCUMENT_FIELDS = [
  { key: 'cover_letter_path', name: 'Covering Letter', icon: 'description' },
  { key: 'memorandum_path', name: 'Memorandum & Articles', icon: 'description' },
  { key: 'registration_cert_path', name: 'Business Registration Certificate', icon: 'description' },
  { key: 'incorporation_cert_path', name: 'Certificate of Incorporation', icon: 'description' },
  { key: 'premises_cert_path', name: 'Business Premises Certificate', icon: 'description' },
  { key: 'company_logo_path', name: 'Company Logo', icon: 'image' },
  { key: 'form_c07_path', name: 'Form C07', icon: 'description' },
  { key: 'id_document_path', name: 'ID Document', icon: 'badge' }
];

// Styled Components
const PageContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  gap: theme.spacing(3),
  backgroundColor: '#f5f7fa',
  minHeight: '100vh',
  padding: theme.spacing(2),
  [theme.breakpoints.down('md')]: {
    padding: theme.spacing(1),
    gap: theme.spacing(1)
  }
}));

const ContentWrapper = styled(Paper)(({ theme }) => ({
  flex: 1,
  padding: theme.spacing(3),
  borderRadius: '20px',
  boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)',
  backgroundColor: 'white',
  overflow: 'hidden',
  [theme.breakpoints.down('sm')]: {
    padding: theme.spacing(2)
  }
}));

const HeaderTitle = styled(Typography)(({ theme }) => ({
  fontFamily: '"Poppins", sans-serif',
  fontWeight: 600,
  fontSize: '1.5rem',
  color: '#333',
  marginBottom: theme.spacing(1),
  '& span': {
    color: '#15e420'
  },
  [theme.breakpoints.down('sm')]: {
    fontSize: '1.25rem'
  }
}));

const HeaderSubtitle = styled(Typography)(({ theme }) => ({
  fontFamily: '"Inter", sans-serif',
  fontSize: '0.9rem',
  color: '#666',
  marginBottom: theme.spacing(2.5),
  [theme.breakpoints.down('sm')]: {
    fontSize: '0.8rem',
    marginBottom: theme.spacing(2)
  }
}));

const StatsCard = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2),
  borderRadius: '16px',
  backgroundColor: '#f8f9fa',
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1.5),
  marginBottom: theme.spacing(3),
  flexWrap: 'wrap',
  [theme.breakpoints.down('sm')]: {
    padding: theme.spacing(1.5),
    gap: theme.spacing(1)
  }
}));

const StatsIcon = styled(Box)(({ color = '#15e420', theme }) => ({
  width: '48px',
  height: '48px',
  borderRadius: '12px',
  backgroundColor: `${color}10`,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  [theme.breakpoints.down('sm')]: {
    width: '40px',
    height: '40px',
    '& svg': {
      fontSize: '20px'
    }
  },
  '& svg': {
    fontSize: '24px',
    color: color
  }
}));

const StatsContent = styled(Box)({
  flex: 1,
  minWidth: '100px'
});

const StatsNumber = styled(Typography)(({ theme }) => ({
  fontFamily: '"Poppins", sans-serif',
  fontWeight: 700,
  fontSize: '1.5rem',
  color: '#333',
  lineHeight: 1.2,
  [theme.breakpoints.down('sm')]: {
    fontSize: '1.25rem'
  }
}));

const StatsLabel = styled(Typography)(({ theme }) => ({
  fontFamily: '"Inter", sans-serif',
  fontSize: '0.8rem',
  color: '#666',
  textTransform: 'uppercase',
  letterSpacing: '0.3px',
  [theme.breakpoints.down('sm')]: {
    fontSize: '0.7rem'
  }
}));

const StyledCard = styled(Card)(({ status, theme }) => ({
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  transition: 'all 0.3s ease',
  borderRadius: '16px',
  border: '1px solid #f0f0f0',
  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
  position: 'relative',
  overflow: 'hidden',
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: '0 15px 35px rgba(21, 228, 32, 0.15)',
    borderColor: '#15e420'
  },
  '&::before': {
    content: '""',
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: '4px',
    background: status === 'approved' ? '#28a745' :
                status === 'rejected' ? '#dc3545' :
                status === 'pending' ? '#ffc107' :
                '#15e420'
  }
}));

const CardHeader = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2),
  paddingBottom: theme.spacing(1),
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1.5),
  [theme.breakpoints.down('sm')]: {
    padding: theme.spacing(1.5),
    gap: theme.spacing(1)
  }
}));

const FileIconWrapper = styled(Box)(({ status, iconType, theme }) => ({
  width: '50px',
  height: '50px',
  borderRadius: '12px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: status === 'approved' ? 'rgba(40, 167, 69, 0.1)' :
              status === 'rejected' ? 'rgba(220, 53, 69, 0.1)' :
              status === 'pending' ? 'rgba(255, 193, 7, 0.1)' :
              'rgba(21, 228, 32, 0.1)',
  [theme.breakpoints.down('sm')]: {
    width: '40px',
    height: '40px',
    '& svg': {
      fontSize: '22px'
    }
  },
  '& svg': {
    fontSize: '28px',
    color: status === 'approved' ? '#28a745' :
           status === 'rejected' ? '#dc3545' :
           status === 'pending' ? '#ffc107' :
           '#15e420'
  }
}));

const FileInfo = styled(Box)({
  flex: 1,
  overflow: 'hidden'
});

const FileName = styled(Typography)(({ theme }) => ({
  fontFamily: '"Inter", sans-serif',
  fontWeight: 600,
  fontSize: '0.95rem',
  color: '#333',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  marginBottom: theme.spacing(0.5),
  [theme.breakpoints.down('sm')]: {
    fontSize: '0.85rem'
  }
}));

const StatusBadge = styled(Chip)(({ status, theme }) => ({
  height: '24px',
  fontSize: '0.7rem',
  fontWeight: 500,
  background: status === 'approved' ? '#d4edda' :
              status === 'rejected' ? '#ffebee' :
              status === 'pending' ? '#fff3e0' :
              '#e8f5e9',
  color: status === 'approved' ? '#28a745' :
         status === 'rejected' ? '#dc3545' :
         status === 'pending' ? '#ff9800' :
         '#15e420',
  [theme.breakpoints.down('sm')]: {
    height: '20px',
    fontSize: '0.65rem'
  },
  '& .MuiChip-icon': {
    fontSize: '0.9rem',
    color: 'inherit'
  }
}));

const FileDetails = styled(Box)({
  display: 'flex',
  flexDirection: 'column',
  gap: '8px',
  marginBottom: '12px'
});

const DetailRow = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  fontSize: '0.75rem',
  color: '#666'
});

const ActionButton = styled(IconButton)(({ theme }) => ({
  backgroundColor: '#fff',
  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
  transition: 'all 0.2s ease',
  [theme.breakpoints.down('sm')]: {
    padding: '6px',
    '& svg': {
      fontSize: '1rem'
    }
  },
  '&:hover': {
    backgroundColor: '#15e420',
    transform: 'scale(1.1)',
    '& svg': {
      color: '#fff'
    }
  },
  '& svg': {
    fontSize: '1.2rem',
    color: '#15e420'
  }
}));

const EmptyState = styled(Box)(({ theme }) => ({
  textAlign: 'center',
  padding: theme.spacing(8, 2),
  backgroundColor: '#f8f9fa',
  borderRadius: '16px',
  [theme.breakpoints.down('sm')]: {
    padding: theme.spacing(4, 1)
  }
}));

const EmptyIcon = styled(Box)(({ theme }) => ({
  width: '80px',
  height: '80px',
  borderRadius: '50%',
  backgroundColor: 'rgba(21, 228, 32, 0.1)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  margin: '0 auto 20px',
  [theme.breakpoints.down('sm')]: {
    width: '60px',
    height: '60px',
    '& svg': {
      fontSize: '30px'
    }
  },
  '& svg': {
    fontSize: '40px',
    color: '#15e420'
  }
}));

const ProgressContainer = styled(Box)(({ theme }) => ({
  marginTop: theme.spacing(2.5),
  marginBottom: theme.spacing(3),
  [theme.breakpoints.down('sm')]: {
    marginTop: theme.spacing(2),
    marginBottom: theme.spacing(2.5)
  }
}));

const LoadingContainer = styled(Box)({
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  minHeight: '100vh',
});

// Document Viewer Styled Components
const ViewerDialog = styled(Dialog)(({ theme }) => ({
  '& .MuiDialog-paper': {
    borderRadius: '20px',
    overflow: 'hidden',
    maxWidth: '95vw',
    maxHeight: '95vh',
    [theme.breakpoints.down('sm')]: {
      borderRadius: '12px',
      maxWidth: '100vw',
      maxHeight: '100vh',
      margin: 0
    }
  }
}));

const ViewerContainer = styled(Box)(({ theme }) => ({
  height: '85vh',
  width: '85vw',
  display: 'flex',
  flexDirection: 'column',
  backgroundColor: '#1a1a1a',
  [theme.breakpoints.down('sm')]: {
    height: '100vh',
    width: '100vw'
  }
}));

const ViewerHeader = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: theme.spacing(1.5, 2),
  borderBottom: '1px solid #333',
  backgroundColor: '#2d2d2d',
  color: '#fff',
  [theme.breakpoints.down('sm')]: {
    padding: theme.spacing(1, 1.5)
  }
}));

const ViewerTitle = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1.5),
  '& svg': {
    color: '#15e420',
    fontSize: '1.5rem'
  }
}));

const ViewerContent = styled(Box)({
  flex: 1,
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  backgroundColor: '#2d2d2d',
  overflow: 'auto',
  position: 'relative'
});

const PdfFrame = styled('iframe')({
  width: '100%',
  height: '100%',
  border: 'none',
  backgroundColor: '#fff'
});

const ImageViewer = styled(Box)({
  flex: 1,
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  overflow: 'auto',
  padding: '20px'
});

const StyledImage = styled('img')(({ zoom, rotation }) => ({
  maxWidth: `${zoom}%`,
  maxHeight: `${zoom}%`,
  transform: `rotate(${rotation}deg)`,
  objectFit: 'contain',
  transition: 'all 0.2s ease',
  boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
  cursor: 'zoom-in'
}));

const ZoomControls = styled(Box)(({ theme }) => ({
  position: 'absolute',
  bottom: theme.spacing(2),
  right: theme.spacing(2),
  display: 'flex',
  gap: theme.spacing(1),
  backgroundColor: 'rgba(0,0,0,0.7)',
  padding: theme.spacing(0.5),
  borderRadius: '30px',
  zIndex: 10,
  backdropFilter: 'blur(5px)',
  [theme.breakpoints.down('sm')]: {
    bottom: theme.spacing(1),
    right: theme.spacing(1),
    padding: theme.spacing(0.25)
  },
  '& button': {
    color: '#fff',
    '&:hover': {
      backgroundColor: 'rgba(255,255,255,0.1)'
    },
    '&.Mui-disabled': {
      opacity: 0.3
    }
  }
}));

const Watermark = styled(Box)({
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  opacity: 0.03,
  pointerEvents: 'none',
  zIndex: 0,
  '& img': {
    maxWidth: '200px',
    maxHeight: '200px'
  }
});

const FallbackView = styled(Box)({
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  alignItems: 'center',
  gap: '16px',
  backgroundColor: '#2d2d2d',
  color: '#fff'
});

// Helper functions
const getStatusIcon = (status) => {
  switch(status) {
    case 'approved':
      return <CheckCircleIcon />;
    case 'rejected':
      return <ErrorIcon />;
    case 'pending':
      return <PendingIcon />;
    default:
      return <InfoIcon />;
  }
};

const getDocumentIcon = (iconType, status) => {
  const props = { 
    sx: { 
      fontSize: '28px'
    }
  };

  switch(iconType) {
    case 'image':
      return <ImageIcon {...props} />;
    case 'badge':
      return <BadgeIcon {...props} />;
    default:
      return <DescriptionIcon {...props} />;
  }
};

const getDocumentUrl = (path, bucket) => {
  if (!path) return null;
  
  // If it's already a full URL, use it directly
  if (path.startsWith('http')) {
    return path;
  }
  
  // Otherwise construct public URL
  try {
    const { data } = supabase.storage
      .from(bucket)
      .getPublicUrl(path);
    return data?.publicUrl || null;
  } catch (error) {
    console.error('Error getting document URL:', error);
    return null;
  }
};

const getFileType = (path) => {
  if (!path) return 'unknown';
  const ext = path.split('.').pop()?.toLowerCase() || '';
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'].includes(ext)) return 'image';
  if (ext === 'pdf') return 'pdf';
  return 'other';
};

const Documents = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));
  
  const [user, setUser] = useState(null);
  const [organization, setOrganization] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState({ open: false, type: 'success', message: '' });
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [zoom, setZoom] = useState(100);
  const [rotation, setRotation] = useState(0);
  const [documentStats, setDocumentStats] = useState({
    total: 0,
    uploaded: 0,
    approved: 0,
    pending: 0,
    rejected: 0
  });

  useEffect(() => {
    checkUser();
  }, []);

  useEffect(() => {
    if (user) {
      fetchOrganizationData();
    }
  }, [user]);

  const showAlert = (type, message) => {
    setAlert({ open: true, type, message });
  };

  const handleCloseAlert = () => {
    setAlert({ ...alert, open: false });
  };

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

  const fetchOrganizationData = async () => {
    try {
      if (!user) return;

      const { data: orgData, error } = await supabase
        .from('organizations')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) {
        console.error('Organization fetch error:', error);
        throw error;
      }

      setOrganization(orgData);
      
      // Fetch all payments for this organization to check approval status
      const { data: payments, error: paymentsError } = await supabase
        .from('payments')
        .select('*')
        .eq('organization_id', orgData.id)
        .order('created_at', { ascending: false });

      if (paymentsError) {
        console.error('Error fetching payments:', paymentsError);
      }

      // Check if any payment is approved
      const hasApprovedPayment = payments?.some(p => p.status === 'approved') || false;

      // Build documents list from organization fields
      const uploadedDocs = await Promise.all(
        DOCUMENT_FIELDS
          .filter(doc => orgData[doc.key])
          .map(async (doc) => {
            
            // Check if this specific document has a rejection reason
            const rejectionField = `${doc.key.replace('_path', '_rejection_reason')}`;
            const rejectionReason = orgData[rejectionField];
            
            // Determine document status:
            // 1. If there's a rejection reason, it's rejected
            // 2. If the organization is approved OR there's an approved payment, mark document as approved
            // 3. Otherwise, it's pending
            let status = 'pending';
            
            if (rejectionReason) {
              status = 'rejected';
            } else if (orgData.status === 'approved' || hasApprovedPayment) {
              status = 'approved';
            }

            const bucket = doc.key === 'company_logo_path' ? 'logos' : 'documents';
            const url = getDocumentUrl(orgData[doc.key], bucket);
            const fileType = getFileType(orgData[doc.key]);

            return {
              id: `${orgData.id}_${doc.key}`,
              name: doc.name,
              path: orgData[doc.key],
              field: doc.key,
              icon: doc.icon,
              status: status,
              rejectionReason: rejectionReason,
              uploadedAt: orgData.updated_at || orgData.created_at || new Date().toISOString(),
              fileType: fileType,
              url: url,
              bucket: bucket,
              isImage: fileType === 'image',
              isPdf: fileType === 'pdf'
            };
          })
      );

      setDocuments(uploadedDocs);
      
      // Calculate stats
      const approved = uploadedDocs.filter(d => d.status === 'approved').length;
      const pending = uploadedDocs.filter(d => d.status === 'pending').length;
      const rejected = uploadedDocs.filter(d => d.status === 'rejected').length;
      
      setDocumentStats({
        total: DOCUMENT_FIELDS.length,
        uploaded: uploadedDocs.length,
        approved,
        pending,
        rejected
      });

    } catch (error) {
      console.error('Error fetching organization:', error);
      showAlert('error', 'Failed to load documents');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDocument = (doc) => {
    setSelectedDocument(doc);
    setZoom(100);
    setRotation(0);
    setModalOpen(true);
  };

  const handleDownloadDocument = async (doc) => {
    try {
      // If it's a full URL, fetch and download
      if (doc.path.startsWith('http')) {
        const response = await fetch(doc.path);
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${organization?.company_name || 'document'}_${doc.name}.${doc.fileType === 'pdf' ? 'pdf' : 'jpg'}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } else {
        // Download from storage
        const { data, error } = await supabase.storage
          .from(doc.bucket)
          .download(doc.path);

        if (error) {
          console.error('Download error:', error);
          throw error;
        }

        const url = URL.createObjectURL(data);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${organization?.company_name || 'document'}_${doc.name}.${doc.fileType === 'pdf' ? 'pdf' : 'jpg'}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
      
      showAlert('success', 'Download started');
    } catch (error) {
      console.error('Error downloading document:', error);
      showAlert('error', 'Failed to download document. Please try again.');
    }
  };

  const handleOpenInNewTab = () => {
    if (selectedDocument?.url) {
      window.open(selectedDocument.url, '_blank');
    }
  };

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 25, 300));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 25, 25));
  const handleRotate = () => setRotation(prev => (prev + 90) % 360);

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-NG', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const approvalProgress = documentStats.total > 0 
    ? (documentStats.approved / documentStats.total) * 100 
    : 0;

  // Show loading state without sidebar
  if (loading) {
    return (
      <LoadingContainer>
        <CircularProgress style={{ color: '#15e420' }} />
      </LoadingContainer>
    );
  }

  return (
    <>
      <Snackbar
        open={alert.open}
        autoHideDuration={4000}
        onClose={handleCloseAlert}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert onClose={handleCloseAlert} severity={alert.type} sx={{ width: '100%', borderRadius: '8px' }}>
          {alert.message}
        </Alert>
      </Snackbar>

      <PageContainer>
        {/* Sidebar */}
        <Sidebar />

        {/* Main Content */}
        <ContentWrapper>
          {/* Header */}
          <Box sx={{ mb: { xs: 2, sm: 3 } }}>
            <HeaderTitle variant="h4">
              My <span>Documents</span>
            </HeaderTitle>
            <HeaderSubtitle>
              View and manage your submitted documents
            </HeaderSubtitle>
          </Box>

          {/* Organization Info */}
          {organization && (
            <Paper sx={{ 
              p: { xs: 1.5, sm: 2 }, 
              mb: { xs: 2, sm: 3 }, 
              bgcolor: '#f8f9fa', 
              borderRadius: '12px' 
            }}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" sx={{ color: '#666', fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
                    Organization: <strong style={{ color: '#333' }}>{organization.company_name}</strong>
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" sx={{ color: '#666', fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
                    Status: 
                    <Chip
                      size="small"
                      icon={organization.status === 'approved' ? <VerifiedIcon /> : 
                            organization.status === 'rejected' ? <ErrorIcon /> : <PendingIcon />}
                      label={organization.status || 'Pending'}
                      sx={{ 
                        ml: 1,
                        bgcolor: organization.status === 'approved' ? '#d4edda' :
                                organization.status === 'rejected' ? '#ffebee' : '#fff3e0',
                        color: organization.status === 'approved' ? '#28a745' :
                               organization.status === 'rejected' ? '#dc3545' : '#ff9800',
                        height: { xs: '20px', sm: '24px' },
                        fontSize: { xs: '0.65rem', sm: '0.7rem' }
                      }}
                    />
                  </Typography>
                </Grid>
              </Grid>
            </Paper>
          )}

          {/* Stats Cards */}
          <Grid container spacing={2} sx={{ mb: { xs: 2, sm: 3 } }}>
            <Grid item xs={6} sm={3}>
              <StatsCard elevation={0} sx={{ flexDirection: 'column', textAlign: 'center', p: { xs: 1.5, sm: 2 } }}>
                <StatsIcon color="#17a2b8" sx={{ mb: 1 }}>
                  <FolderIcon />
                </StatsIcon>
                <StatsNumber>{documentStats.uploaded}</StatsNumber>
                <StatsLabel>Uploaded</StatsLabel>
              </StatsCard>
            </Grid>
            
            <Grid item xs={6} sm={3}>
              <StatsCard elevation={0} sx={{ flexDirection: 'column', textAlign: 'center', p: { xs: 1.5, sm: 2 } }}>
                <StatsIcon color="#28a745" sx={{ mb: 1 }}>
                  <CheckCircleIcon />
                </StatsIcon>
                <StatsNumber>{documentStats.approved}</StatsNumber>
                <StatsLabel>Approved</StatsLabel>
              </StatsCard>
            </Grid>
            
            <Grid item xs={6} sm={3}>
              <StatsCard elevation={0} sx={{ flexDirection: 'column', textAlign: 'center', p: { xs: 1.5, sm: 2 } }}>
                <StatsIcon color="#ffc107" sx={{ mb: 1 }}>
                  <PendingIcon />
                </StatsIcon>
                <StatsNumber>{documentStats.pending}</StatsNumber>
                <StatsLabel>Pending</StatsLabel>
              </StatsCard>
            </Grid>
            
            <Grid item xs={6} sm={3}>
              <StatsCard elevation={0} sx={{ flexDirection: 'column', textAlign: 'center', p: { xs: 1.5, sm: 2 } }}>
                <StatsIcon color="#dc3545" sx={{ mb: 1 }}>
                  <ErrorIcon />
                </StatsIcon>
                <StatsNumber>{documentStats.rejected}</StatsNumber>
                <StatsLabel>Rejected</StatsLabel>
              </StatsCard>
            </Grid>
          </Grid>

          {/* Progress Bar */}
          <ProgressContainer>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2" sx={{ fontWeight: 500, color: '#666', fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                Overall Verification Progress
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 600, color: '#15e420', fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                {Math.round(approvalProgress)}%
              </Typography>
            </Box>
            <LinearProgress 
              variant="determinate" 
              value={approvalProgress}
              sx={{ 
                height: { xs: 6, sm: 8 }, 
                borderRadius: 4,
                bgcolor: '#e0e0e0',
                '& .MuiLinearProgress-bar': {
                  bgcolor: documentStats.rejected > 0 ? '#dc3545' : '#15e420'
                }
              }}
            />
          </ProgressContainer>

          {/* Documents Grid */}
          {documents.length > 0 ? (
            <Grid container spacing={3}>
              {documents.map((doc, index) => (
                <Grid item xs={12} sm={6} md={4} key={doc.id}>
                  <StyledCard status={doc.status}>
                    <CardHeader>
                      <FileIconWrapper status={doc.status} iconType={doc.icon}>
                        {getDocumentIcon(doc.icon, doc.status)}
                      </FileIconWrapper>
                      <FileInfo>
                        <FileName title={doc.name}>
                          {doc.name}
                        </FileName>
                        <StatusBadge
                          size="small"
                          icon={getStatusIcon(doc.status)}
                          label={
                            doc.status === 'approved' ? 'Approved' :
                            doc.status === 'rejected' ? 'Rejected' :
                            'Pending Review'
                          }
                          status={doc.status}
                        />
                      </FileInfo>
                    </CardHeader>
                    
                    <CardContent>
                      <FileDetails>
                        <DetailRow>
                          <DescriptionIcon sx={{ fontSize: { xs: '0.8rem', sm: '0.9rem' }, color: '#999' }} />
                          <span style={{ fontSize: isMobile ? '0.7rem' : '0.75rem' }}>
                            Uploaded: {formatDate(doc.uploadedAt)}
                          </span>
                        </DetailRow>
                        
                        <DetailRow>
                          <InfoIcon sx={{ fontSize: { xs: '0.8rem', sm: '0.9rem' }, color: '#999' }} />
                          <span style={{ fontSize: isMobile ? '0.7rem' : '0.75rem' }}>
                            Type: {doc.fileType?.toUpperCase() || 'DOCUMENT'}
                          </span>
                        </DetailRow>

                        {doc.rejectionReason && (
                          <Tooltip title={doc.rejectionReason} arrow>
                            <DetailRow sx={{ 
                              color: '#dc3545', 
                              bgcolor: '#ffebee', 
                              p: 1, 
                              borderRadius: '4px',
                              flexWrap: 'wrap'
                            }}>
                              <WarningIcon sx={{ fontSize: '0.9rem' }} />
                              <span style={{ fontSize: isMobile ? '0.65rem' : '0.7rem' }}>
                                {doc.rejectionReason.substring(0, isMobile ? 30 : 40)}...
                              </span>
                            </DetailRow>
                          </Tooltip>
                        )}
                      </FileDetails>
                      
                      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 2 }}>
                        <Tooltip title="View Document">
                          <ActionButton size="small" onClick={() => handleViewDocument(doc)}>
                            <VisibilityIcon fontSize="small" />
                          </ActionButton>
                        </Tooltip>
                        <Tooltip title="Download">
                          <ActionButton size="small" onClick={() => handleDownloadDocument(doc)}>
                            <DownloadIcon fontSize="small" />
                          </ActionButton>
                        </Tooltip>
                      </Box>
                    </CardContent>
                  </StyledCard>
                </Grid>
              ))}
            </Grid>
          ) : (
            <EmptyState>
              <EmptyIcon>
                <DescriptionIcon />
              </EmptyIcon>
              <Typography variant="h6" sx={{ color: '#333', mb: 1, fontWeight: 600, fontSize: { xs: '1rem', sm: '1.25rem' } }}>
                No Documents Uploaded
              </Typography>
              <Typography variant="body2" sx={{ color: '#999', maxWidth: '400px', mx: 'auto', fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
                You haven't submitted any documents yet. Please upload the required documents in your organization profile.
              </Typography>
            </EmptyState>
          )}
        </ContentWrapper>
      </PageContainer>

      {/* Document Viewer Modal */}
      <ViewerDialog 
        open={modalOpen} 
        onClose={() => setModalOpen(false)}
        maxWidth={false}
        fullWidth={false}
        fullScreen={isMobile}
      >
        <ViewerContainer>
          <ViewerHeader>
            <ViewerTitle>
              {selectedDocument?.isImage ? <ImageIcon /> : 
               selectedDocument?.isPdf ? <PdfIcon /> : 
               <DescriptionIcon />}
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#fff', fontSize: { xs: '0.9rem', sm: '1rem' } }}>
                  {selectedDocument?.name}
                </Typography>
                {organization?.company_name && (
                  <Typography variant="caption" sx={{ color: '#aaa', display: 'block' }}>
                    {organization.company_name}
                  </Typography>
                )}
              </Box>
            </ViewerTitle>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Tooltip title="Open in new tab">
                <IconButton onClick={handleOpenInNewTab} sx={{ color: '#15e420' }}>
                  <OpenInNewIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Download">
                <IconButton onClick={() => selectedDocument && handleDownloadDocument(selectedDocument)} sx={{ color: '#15e420' }}>
                  <DownloadIcon />
                </IconButton>
              </Tooltip>
              <IconButton onClick={() => setModalOpen(false)} sx={{ color: '#fff' }}>
                <CloseIcon />
              </IconButton>
            </Box>
          </ViewerHeader>

          <ViewerContent>
            <Watermark>
              <img src="/static/logo.png" alt="Watermark" />
            </Watermark>

            {selectedDocument?.isPdf ? (
              <PdfFrame
                src={`${selectedDocument.url}#toolbar=0&navpanes=0&scrollbar=1&view=FitH`}
                title={selectedDocument.name}
              />
            ) : selectedDocument?.isImage ? (
              <ImageViewer>
                <StyledImage
                  src={selectedDocument.url}
                  alt={selectedDocument.name}
                  zoom={zoom}
                  rotation={rotation}
                  onClick={handleZoomIn}
                />
                <ZoomControls>
                  <IconButton size="small" onClick={handleZoomOut} disabled={zoom <= 25}>
                    <ZoomOutIcon />
                  </IconButton>
                  <Typography variant="caption" sx={{ color: '#fff', px: 1 }}>
                    {zoom}%
                  </Typography>
                  <IconButton size="small" onClick={handleZoomIn} disabled={zoom >= 300}>
                    <ZoomInIcon />
                  </IconButton>
                  <IconButton size="small" onClick={handleRotate}>
                    <RotateIcon />
                  </IconButton>
                </ZoomControls>
              </ImageViewer>
            ) : (
              <FallbackView>
                <DescriptionIcon sx={{ fontSize: 64, color: '#666' }} />
                <Typography variant="h6" sx={{ color: '#fff', textAlign: 'center' }}>
                  Cannot preview this file type
                </Typography>
                <Typography variant="body2" sx={{ color: '#aaa', textAlign: 'center', maxWidth: '400px' }}>
                  This file format cannot be previewed directly. Please download to view.
                </Typography>
                <Button
                  variant="contained"
                  onClick={() => selectedDocument && handleDownloadDocument(selectedDocument)}
                  sx={{ 
                    mt: 2,
                    bgcolor: '#15e420',
                    '&:hover': { bgcolor: '#12c21e' }
                  }}
                >
                  Download File
                </Button>
              </FallbackView>
            )}
          </ViewerContent>
        </ViewerContainer>
      </ViewerDialog>
    </>
  );
};

export default Documents;