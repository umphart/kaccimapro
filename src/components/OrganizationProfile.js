import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '../supabaseClient';
import {
  Alert,
  Snackbar,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  Box,
  Paper,
  Typography,
  Grid,
  CircularProgress,
  Chip,
  Divider,
  Tooltip,
  LinearProgress
} from '@mui/material';
import {
  Description as DescriptionIcon,
  Image as ImageIcon,
  Badge as BadgeIcon,
  Visibility as VisibilityIcon,
  Download as DownloadIcon,
  Close as CloseIcon,
  CheckCircle as CheckCircleIcon,
  Pending as PendingIcon,
  Error as ErrorIcon,
  Business as BusinessIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  LocationOn as LocationIcon,
  Assignment as AssignmentIcon,
  CalendarToday as CalendarIcon,
  Verified as VerifiedIcon,
  Warning as WarningIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import Layout from './Layout';
import './OrganizationProfile.css';

// Styled Components
const ProfileContainer = styled(motion.div)({
  maxWidth: '1200px',
  margin: '0 auto',
  padding: '2rem',
  fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif"
});

const StatusCard = styled(motion.div)(({ status }) => ({
  background: 'white',
  borderRadius: '24px',
  padding: '2rem',
  marginBottom: '2rem',
  boxShadow: '0 10px 40px rgba(0, 0, 0, 0.1)',
  textAlign: 'center',
  position: 'relative',
  overflow: 'hidden',
  border: '1px solid rgba(0, 0, 0, 0.05)',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '4px',
    background: status === 'approved' ? 'linear-gradient(90deg, #28a745, #20c997)' :
                status === 'rejected' ? 'linear-gradient(90deg, #dc3545, #c82333)' :
                'linear-gradient(90deg, #ffc107, #ff9800)'
  }
}));

const StatusIconWrapper = styled('div')(({ status }) => ({
  width: '100px',
  height: '100px',
  background: status === 'approved' ? 'rgba(40, 167, 69, 0.1)' :
              status === 'rejected' ? 'rgba(220, 53, 69, 0.1)' :
              'rgba(255, 193, 7, 0.1)',
  borderRadius: '50%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  margin: '0 auto 1.5rem',
  '& svg': {
    fontSize: '3.5rem',
    color: status === 'approved' ? '#28a745' :
           status === 'rejected' ? '#dc3545' :
           '#ffc107'
  }
}));

const StatusTitle = styled(Typography)({
  fontSize: '2rem',
  fontWeight: 700,
  color: '#333',
  marginBottom: '1rem',
  fontFamily: "'Poppins', sans-serif"
});

const StatusMessage = styled(Typography)({
  color: '#666',
  lineHeight: 1.6,
  marginBottom: '1.5rem',
  maxWidth: '600px',
  marginLeft: 'auto',
  marginRight: 'auto',
  fontFamily: "'Inter', sans-serif"
});

const StatusBadge = styled('span')(({ status }) => ({
  display: 'inline-flex',
  alignItems: 'center',
  gap: '0.5rem',
  padding: '0.5rem 1.5rem',
  borderRadius: '50px',
  fontWeight: 600,
  fontSize: '0.9rem',
  background: status === 'approved' ? '#d4edda' :
              status === 'rejected' ? '#ffebee' :
              '#fff3e0',
  color: status === 'approved' ? '#28a745' :
         status === 'rejected' ? '#dc3545' :
         '#ff9800',
  border: `1px solid ${
    status === 'approved' ? '#c3e6cb' :
    status === 'rejected' ? '#ffcdd2' :
    '#ffe0b2'
  }`
}));

const InfoCard = styled(motion(Paper))({
  background: 'white',
  borderRadius: '20px',
  padding: '2rem',
  marginBottom: '2rem',
  boxShadow: '0 5px 20px rgba(0, 0, 0, 0.05)',
  fontFamily: "'Inter', sans-serif"
});

const SectionTitle = styled(Typography)({
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
  fontSize: '1.25rem',
  fontWeight: 600,
  color: '#333',
  marginBottom: '1.5rem',
  paddingBottom: '0.5rem',
  borderBottom: '2px solid #f0f0f0',
  fontFamily: "'Poppins', sans-serif",
  '& svg': {
    color: '#15e420'
  }
});

const InfoGrid = styled('div')({
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
  gap: '1.5rem',
  marginBottom: '2rem'
});

const InfoItem = styled('div')({
  background: '#f8f9fa',
  padding: '1rem',
  borderRadius: '12px',
  transition: 'all 0.2s ease',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: '0 5px 15px rgba(0, 0, 0, 0.1)'
  }
});

const InfoLabel = styled('div')({
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
  color: '#666',
  fontSize: '0.85rem',
  marginBottom: '0.5rem',
  fontFamily: "'Inter', sans-serif",
  '& svg': {
    color: '#15e420',
    fontSize: '0.9rem'
  }
});

const InfoValue = styled(Typography)({
  fontWeight: 600,
  color: '#333',
  fontSize: '1rem',
  fontFamily: "'Inter', sans-serif"
});

const DocumentGrid = styled('div')({
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
  gap: '1rem',
  marginTop: '1rem'
});

const DocumentCard = styled(motion(Paper))(({ theme, status }) => ({
  display: 'flex',
  alignItems: 'center',
  padding: '1rem',
  borderRadius: '16px',
  transition: 'all 0.3s ease',
  border: '1px solid #f0f0f0',
  position: 'relative',
  overflow: 'hidden',
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: '0 10px 30px rgba(0, 0, 0, 0.15)'
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

const DocumentIcon = styled('div')(({ status }) => ({
  width: '50px',
  height: '50px',
  borderRadius: '12px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  marginRight: '1rem',
  background: status === 'approved' ? 'rgba(40, 167, 69, 0.1)' :
              status === 'rejected' ? 'rgba(220, 53, 69, 0.1)' :
              'rgba(21, 228, 32, 0.1)',
  '& svg': {
    fontSize: '1.8rem',
    color: status === 'approved' ? '#28a745' :
           status === 'rejected' ? '#dc3545' :
           '#15e420'
  }
}));

const DocumentContent = styled(Box)({
  flex: 1
});

const DocumentName = styled(Typography)({
  fontWeight: 600,
  fontSize: '0.95rem',
  color: '#333',
  fontFamily: "'Inter', sans-serif",
  marginBottom: '0.25rem'
});

const DocumentStatus = styled(Chip)(({ status }) => ({
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
  '& .MuiChip-icon': {
    fontSize: '0.9rem'
  }
}));

const QuickActions = styled('div')({
  display: 'flex',
  gap: '1rem',
  marginTop: '1.5rem',
  flexWrap: 'wrap'
});

const ActionButton = styled('button')({
  padding: '0.75rem 1.5rem',
  border: '1px solid #15e420',
  background: 'white',
  color: '#15e420',
  borderRadius: '8px',
  fontWeight: 600,
  cursor: 'pointer',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '0.5rem',
  transition: 'all 0.3s ease',
  fontFamily: "'Inter', sans-serif",
  fontSize: '0.9rem',
  '&:hover': {
    background: '#15e420',
    color: 'white',
    transform: 'translateY(-2px)',
    boxShadow: '0 5px 15px rgba(21, 228, 32, 0.3)'
  }
});

const PrimaryButton = styled(ActionButton)({
  background: '#15e420',
  color: 'white',
  border: 'none',
  '&:hover': {
    background: '#12c21e',
    boxShadow: '0 5px 15px rgba(21, 228, 32, 0.4)'
  }
});

const ProgressTracker = styled('div')({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  margin: '2rem 0',
  padding: '0 1rem'
});

const ProgressStep = styled('div')(({ active, completed }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '0.5rem',
  position: 'relative',
  zIndex: 2,
  '& .step-indicator': {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    background: completed ? '#15e420' : active ? '#ffc107' : '#f0f0f0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 600,
    color: completed || active ? 'white' : '#999',
    border: completed ? 'none' : `2px solid ${active ? '#ffc107' : '#ddd'}`,
    animation: active ? 'pulse 1.5s infinite' : 'none'
  },
  '& .step-label': {
    fontSize: '0.85rem',
    color: '#666',
    fontWeight: 500,
    fontFamily: "'Inter', sans-serif"
  }
}));

const ProgressLine = styled('div')({
  flex: 1,
  height: '2px',
  background: '#ddd',
  margin: '0 0.5rem',
  position: 'relative',
  top: '-12px'
});

const OrganizationProfile = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [organization, setOrganization] = useState(null);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState({ open: false, type: 'success', message: '' });
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
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

      if (error) throw error;

      setOrganization(orgData);
      
      // Calculate document statistics
      const documents = getDocumentsList(orgData);
      const uploaded = documents.filter(doc => doc.path).length;
      const approved = documents.filter(doc => doc.status === 'approved').length;
      const pending = documents.filter(doc => doc.status === 'pending').length;
      const rejected = documents.filter(doc => doc.status === 'rejected').length;
      
      setDocumentStats({
        total: documents.length,
        uploaded,
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

  const getDocumentsList = (orgData) => {
    const documents = [
      { key: 'cover_letter_path', name: 'Covering Letter', icon: 'description' },
      { key: 'memorandum_path', name: 'Memorandum & Articles', icon: 'description' },
      { key: 'registration_cert_path', name: 'Business Registration Certificate', icon: 'description' },
      { key: 'incorporation_cert_path', name: 'Certificate of Incorporation', icon: 'description' },
      { key: 'premises_cert_path', name: 'Business Premises Certificate', icon: 'description' },
      { key: 'company_logo_path', name: 'Company Logo', icon: 'image' },
      { key: 'form_c07_path', name: 'Form C07', icon: 'description' },
      { key: 'id_document_path', name: 'ID Document', icon: 'badge' }
    ];

    return documents.map(doc => {
      const path = orgData?.[doc.key];
      const rejectionField = `${doc.key.replace('_path', '_rejection_reason')}`;
      const rejectionReason = orgData?.[rejectionField];
      
      let status = 'not_uploaded';
      if (path) {
        status = rejectionReason ? 'rejected' : 
                (orgData.status === 'approved' ? 'approved' : 'pending');
      }

      return {
        ...doc,
        path,
        status,
        rejectionReason
      };
    });
  };

  const getDocumentUrl = async (path) => {
    if (!path) return null;
    
    try {
      const bucket = path.includes('companyLogo') ? 'logos' : 'documents';
      const { data } = supabase.storage
        .from(bucket)
        .getPublicUrl(path);
      
      return data.publicUrl;
    } catch (error) {
      console.error('Error getting document URL:', error);
      return null;
    }
  };

  const handleViewDocument = async (docName, docPath) => {
    const url = await getDocumentUrl(docPath);
    if (url) {
      setSelectedDocument({ name: docName, url });
      setModalOpen(true);
    } else {
      showAlert('error', 'Could not load document');
    }
  };

  const handleDownloadDocument = async (docPath, fileName) => {
    try {
      const bucket = docPath.includes('companyLogo') ? 'logos' : 'documents';
      const { data, error } = await supabase.storage
        .from(bucket)
        .download(docPath);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading document:', error);
      showAlert('error', 'Failed to download document');
    }
  };

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

  const getStatusMessage = () => {
    switch(organization?.status) {
      case 'approved':
        return 'Your organization has been fully verified and approved. You now have access to all platform features.';
      case 'rejected':
        return 'Your registration has been rejected. Please review the feedback and resubmit the required information.';
      case 'pending':
      default:
        return 'Your organization registration is currently under review by our verification team. This process typically takes 24-48 hours.';
    }
  };

  const getDocumentIcon = (iconType, status) => {
    const props = { 
      sx: { 
        fontSize: '1.8rem',
        color: status === 'approved' ? '#28a745' :
               status === 'rejected' ? '#dc3545' :
               status === 'pending' ? '#ff9800' :
               '#15e420'
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

  const submissionDate = organization?.created_at 
    ? new Date(organization.created_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    : 'N/A';

  const approvalProgress = documentStats.total > 0 
    ? (documentStats.approved / documentStats.total) * 100 
    : 0;

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress style={{ color: '#15e420' }} />
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
        <Alert onClose={handleCloseAlert} severity={alert.type} sx={{ width: '100%' }}>
          {alert.message}
        </Alert>
      </Snackbar>

      <Layout>
        <ProfileContainer
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Status Card */}
          <StatusCard
            status={organization?.status}
            initial={{ scale: 0.95 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2 }}
          >
            <StatusIconWrapper status={organization?.status}>
              <motion.div
                animate={organization?.status === 'pending' ? { 
                  rotate: [0, 10, -10, 10, 0],
                  scale: [1, 1.1, 1]
                } : {}}
                transition={{ 
                  duration: 2,
                  repeat: organization?.status === 'pending' ? Infinity : 0,
                  repeatDelay: 3
                }}
              >
                {organization?.status === 'approved' && <VerifiedIcon sx={{ fontSize: '3.5rem' }} />}
                {organization?.status === 'rejected' && <ErrorIcon sx={{ fontSize: '3.5rem' }} />}
                {organization?.status === 'pending' && <PendingIcon sx={{ fontSize: '3.5rem' }} />}
              </motion.div>
            </StatusIconWrapper>
            
            <StatusTitle variant="h2">
              {organization?.status === 'approved' && 'Registration Approved! 🎉'}
              {organization?.status === 'rejected' && 'Registration Rejected'}
              {organization?.status === 'pending' && 'Registration Under Review'}
            </StatusTitle>
            
            <StatusMessage variant="body1">
              {getStatusMessage()}
            </StatusMessage>

            <StatusBadge status={organization?.status}>
              {getStatusIcon(organization?.status)}
              {organization?.status === 'approved' && 'Verified Organization'}
              {organization?.status === 'rejected' && 'Rejected'}
              {organization?.status === 'pending' && 'Pending Approval'}
            </StatusBadge>

            {/* Progress Tracker for Pending Status */}
            {organization?.status === 'pending' && (
              <ProgressTracker>
                <ProgressStep completed={true}>
                  <div className="step-indicator">✓</div>
                  <span className="step-label">Submitted</span>
                </ProgressStep>
                <ProgressLine />
                <ProgressStep active={true}>
                  <div className="step-indicator">2</div>
                  <span className="step-label">Under Review</span>
                </ProgressStep>
                <ProgressLine />
                <ProgressStep>
                  <div className="step-indicator">3</div>
                  <span className="step-label">Approval</span>
                </ProgressStep>
              </ProgressTracker>
            )}

            {/* Submission Info */}
            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center', gap: 2, flexWrap: 'wrap' }}>
              <Chip
                icon={<CalendarIcon />}
                label={`Submitted: ${submissionDate}`}
                variant="outlined"
                sx={{ color: '#666', borderColor: '#ddd' }}
              />
              <Chip
                icon={<AssignmentIcon />}
                label={`Documents: ${documentStats.uploaded}/${documentStats.total}`}
                variant="outlined"
                sx={{ color: '#666', borderColor: '#ddd' }}
              />
            </Box>
          </StatusCard>

          {/* Organization Information Card */}
          <InfoCard
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <SectionTitle>
              <BusinessIcon /> Organization Details
            </SectionTitle>

            <InfoGrid>
              <InfoItem>
                <InfoLabel>
                  <BusinessIcon /> Company Name
                </InfoLabel>
                <InfoValue>{organization?.company_name || 'N/A'}</InfoValue>
              </InfoItem>

              <InfoItem>
                <InfoLabel>
                  <EmailIcon /> Email Address
                </InfoLabel>
                <InfoValue>{organization?.email || 'N/A'}</InfoValue>
              </InfoItem>

              <InfoItem>
                <InfoLabel>
                  <PhoneIcon /> Phone Number
                </InfoLabel>
                <InfoValue>{organization?.phone_number || 'N/A'}</InfoValue>
              </InfoItem>

              <InfoItem>
                <InfoLabel>
                  <LocationIcon /> Office Address
                </InfoLabel>
                <InfoValue>{organization?.office_address || 'N/A'}</InfoValue>
              </InfoItem>

              <InfoItem>
                <InfoLabel>
                  <AssignmentIcon /> CAC Number
                </InfoLabel>
                <InfoValue>{organization?.cac_number || 'N/A'}</InfoValue>
              </InfoItem>

              <InfoItem>
                <InfoLabel>
                  <BusinessIcon /> Nature of Business
                </InfoLabel>
                <InfoValue>{organization?.business_nature || 'N/A'}</InfoValue>
              </InfoItem>

              <InfoItem>
                <InfoLabel>
                  <BadgeIcon /> Contact Person
                </InfoLabel>
                <InfoValue>{organization?.contact_person || 'N/A'}</InfoValue>
              </InfoItem>

              <InfoItem>
                <InfoLabel>
                  <BadgeIcon /> Representative
                </InfoLabel>
                <InfoValue>{organization?.representative || 'N/A'}</InfoValue>
              </InfoItem>
            </InfoGrid>

            {/* Document Progress */}
            <Box sx={{ mt: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2" sx={{ fontWeight: 600, color: '#666' }}>
                  Document Verification Progress
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600, color: '#15e420' }}>
                  {Math.round(approvalProgress)}%
                </Typography>
              </Box>
              <LinearProgress 
                variant="determinate" 
                value={approvalProgress}
                sx={{ 
                  height: 8, 
                  borderRadius: 4,
                  bgcolor: '#e0e0e0',
                  '& .MuiLinearProgress-bar': {
                    bgcolor: documentStats.rejected > 0 ? '#dc3545' : '#15e420'
                  }
                }}
              />
              <Box sx={{ display: 'flex', gap: 2, mt: 2, flexWrap: 'wrap' }}>
                <Chip
                  icon={<CheckCircleIcon />}
                  label={`Approved: ${documentStats.approved}`}
                  size="small"
                  sx={{ bgcolor: '#d4edda', color: '#28a745' }}
                />
                <Chip
                  icon={<PendingIcon />}
                  label={`Pending: ${documentStats.pending}`}
                  size="small"
                  sx={{ bgcolor: '#fff3e0', color: '#ff9800' }}
                />
                {documentStats.rejected > 0 && (
                  <Chip
                    icon={<ErrorIcon />}
                    label={`Rejected: ${documentStats.rejected}`}
                    size="small"
                    sx={{ bgcolor: '#ffebee', color: '#dc3545' }}
                  />
                )}
              </Box>
            </Box>
          </InfoCard>

          {/* Documents Section */}
          <InfoCard
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <SectionTitle>
              <DescriptionIcon /> Submitted Documents
            </SectionTitle>

            <DocumentGrid>
              {getDocumentsList(organization).map((doc, index) => (
                <DocumentCard
                  key={doc.key}
                  status={doc.status}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * index }}
                >
                  <DocumentIcon status={doc.status}>
                    {getDocumentIcon(doc.icon, doc.status)}
                  </DocumentIcon>
                  
                  <DocumentContent>
                    <DocumentName>{doc.name}</DocumentName>
                    
                    {doc.status === 'not_uploaded' ? (
                      <DocumentStatus
                        label="Not Uploaded"
                        status="not_uploaded"
                        icon={<InfoIcon />}
                      />
                    ) : (
                      <DocumentStatus
                        label={
                          doc.status === 'approved' ? 'Approved' :
                          doc.status === 'rejected' ? 'Rejected' :
                          'Pending Review'
                        }
                        status={doc.status}
                        icon={getStatusIcon(doc.status)}
                      />
                    )}

                    {doc.rejectionReason && (
                      <Tooltip title={doc.rejectionReason} arrow>
                        <Typography 
                          variant="caption" 
                          sx={{ 
                            color: '#dc3545', 
                            display: 'block',
                            mt: 0.5,
                            fontSize: '0.7rem'
                          }}
                        >
                          <WarningIcon sx={{ fontSize: '0.7rem', mr: 0.5 }} />
                          {doc.rejectionReason.substring(0, 30)}...
                        </Typography>
                      </Tooltip>
                    )}
                  </DocumentContent>

                  {doc.path && (
                    <Box>
                      <Tooltip title="View Document">
                        <IconButton 
                          onClick={() => handleViewDocument(doc.name, doc.path)}
                          size="small"
                          sx={{ 
                            mr: 0.5,
                            color: '#15e420',
                            '&:hover': { bgcolor: 'rgba(21, 228, 32, 0.1)' }
                          }}
                        >
                          <VisibilityIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Download">
                        <IconButton 
                          onClick={() => handleDownloadDocument(doc.path, `${doc.name}.pdf`)}
                          size="small"
                          sx={{ 
                            color: '#15e420',
                            '&:hover': { bgcolor: 'rgba(21, 228, 32, 0.1)' }
                          }}
                        >
                          <DownloadIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  )}
                </DocumentCard>
              ))}
            </DocumentGrid>
          </InfoCard>

          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <QuickActions>
              <PrimaryButton onClick={() => navigate('/documents')}>
                <DescriptionIcon /> Manage Documents
              </PrimaryButton>
              
              {organization?.status === 'approved' && (
                <ActionButton onClick={() => navigate('/payment')}>
                  <VerifiedIcon /> Make Payment
                </ActionButton>
              )}
              
              {organization?.status === 'rejected' && (
                <PrimaryButton onClick={() => navigate('/organization/edit')}>
                  <ErrorIcon /> Resubmit Registration
                </PrimaryButton>
              )}
              
              <ActionButton onClick={() => navigate('/support')}>
                <EmailIcon /> Contact Support
              </ActionButton>
              
              <ActionButton onClick={() => window.location.reload()}>
                <PendingIcon /> Refresh Status
              </ActionButton>
            </QuickActions>
          </motion.div>
        </ProfileContainer>
      </Layout>

      {/* Document Modal */}
      <Dialog
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '24px',
            overflow: 'hidden'
          }
        }}
      >
        <DialogTitle sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          fontFamily: '"Poppins", sans-serif',
          fontWeight: 600,
          borderBottom: '1px solid #eee',
          bgcolor: '#f8f9fa'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <DescriptionIcon sx={{ color: '#15e420' }} />
            <span>{selectedDocument?.name}</span>
          </Box>
          <IconButton onClick={() => setModalOpen(false)}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers sx={{ p: 0, bgcolor: '#f5f5f5' }}>
          <Box sx={{ position: 'relative', minHeight: '70vh' }}>
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
              <img src="/static/logo.png" alt="Watermark" width={200} />
            </Box>
            {selectedDocument?.url ? (
              <iframe
                src={selectedDocument.url}
                title={selectedDocument.name}
                width="100%"
                height="70vh"
                style={{ 
                  border: 'none', 
                  position: 'relative', 
                  zIndex: 1,
                  backgroundColor: '#fff'
                }}
              />
            ) : (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '70vh' }}>
                <CircularProgress style={{ color: '#15e420' }} />
              </Box>
            )}
          </Box>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default OrganizationProfile;