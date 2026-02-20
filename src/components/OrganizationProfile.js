import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import {
  Alert,
  Snackbar,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  Box,
  Paper,
  Typography,
  Grid,
  CircularProgress
} from '@mui/material';
import {
  Edit as EditIcon,
  Description as DescriptionIcon,
  Image as ImageIcon,
  Badge as BadgeIcon,
  Visibility as VisibilityIcon,
  Download as DownloadIcon,
  Close as CloseIcon,
  CheckCircle as CheckCircleIcon,
  Pending as PendingIcon,
  Error as ErrorIcon
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import Layout from './Layout';
import './OrganizationProfile.css';

// Styled components with Google Fonts
const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  marginBottom: theme.spacing(3),
  borderRadius: '10px',
  boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
  fontFamily: '"Inter", sans-serif'
}));

const DocumentItem = styled(Paper)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  padding: theme.spacing(2),
  marginBottom: theme.spacing(1),
  borderRadius: '8px',
  transition: 'all 0.3s',
  fontFamily: '"Inter", sans-serif',
  '&:hover': {
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    transform: 'translateY(-2px)'
  }
}));

const StatusChip = styled('span')(({ status }) => ({
  fontSize: '12px',
  padding: '4px 12px',
  borderRadius: '16px',
  display: 'inline-flex',
  alignItems: 'center',
  gap: '4px',
  fontFamily: '"Inter", sans-serif',
  fontWeight: 500,
  backgroundColor: status === 'Approved' ? '#d4edda' : 
                  status === 'Pending Review' ? '#fff3cd' : '#f8d7fa',
  color: status === 'Approved' ? '#155724' : 
         status === 'Pending Review' ? '#856404' : '#721c24'
}));

const SectionTitle = styled(Typography)(({ theme }) => ({
  color: '#15e420',
  marginBottom: theme.spacing(2),
  paddingBottom: theme.spacing(1),
  borderBottom: '1px solid #eee',
  fontFamily: '"Poppins", sans-serif',
  fontWeight: 600,
  fontSize: '1.25rem'
}));

const FieldLabel = styled(Typography)(({ theme }) => ({
  color: 'textSecondary',
  display: 'block',
  fontFamily: '"Inter", sans-serif',
  fontSize: '0.75rem',
  fontWeight: 500,
  textTransform: 'uppercase',
  letterSpacing: '0.5px'
}));

const FieldValue = styled(Typography)(({ theme }) => ({
  fontWeight: 500,
  fontFamily: '"Inter", sans-serif',
  fontSize: '0.9rem',
  color: '#333'
}));

const DocumentName = styled(Typography)(({ theme }) => ({
  fontFamily: '"Inter", sans-serif',
  fontWeight: 600,
  fontSize: '0.9rem'
}));

const OrganizationProfile = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [organization, setOrganization] = useState(null);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState({ open: false, type: 'success', message: '' });
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

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
    } catch (error) {
      console.error('Error fetching organization:', error);
      showAlert('error', 'Failed to load organization data');
    } finally {
      setLoading(false);
    }
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

  const getDocumentStatus = (path) => {
    if (!path) return 'Not Uploaded';
    return organization?.status === 'approved' ? 'Approved' : 'Pending Review';
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case 'Approved':
        return <CheckCircleIcon style={{ fontSize: 16, marginRight: 4 }} />;
      case 'Pending Review':
        return <PendingIcon style={{ fontSize: 16, marginRight: 4 }} />;
      default:
        return <ErrorIcon style={{ fontSize: 16, marginRight: 4 }} />;
    }
  };

  const getDocumentIcon = (iconType) => {
    switch(iconType) {
      case 'image':
        return <ImageIcon style={{ color: '#15e420', fontSize: 24 }} />;
      case 'badge':
        return <BadgeIcon style={{ color: '#15e420', fontSize: 24 }} />;
      default:
        return <DescriptionIcon style={{ color: '#15e420', fontSize: 24 }} />;
    }
  };

  const documents = [
    { key: 'cover_letter_path', name: 'Covering Letter', icon: 'description' },
    { key: 'memorandum_path', name: 'Memorandum & Articles', icon: 'description' },
    { key: 'registration_cert_path', name: 'Business Name Certificate', icon: 'description' },
    { key: 'incorporation_cert_path', name: 'Incorporation Certificate', icon: 'description' },
    { key: 'premises_cert_path', name: 'Business Premises Certificate', icon: 'description' },
    { key: 'company_logo_path', name: 'Company Logo', icon: 'image' },
    { key: 'form_c07_path', name: 'Form C07', icon: 'description' },
    { key: 'id_document_path', name: 'ID Document', icon: 'badge' }
  ];

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px" >
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
        <Alert 
          onClose={handleCloseAlert} 
          severity={alert.type} 
          sx={{ width: '100%' }}
          iconMapping={{
            success: <CheckCircleIcon fontSize="inherit" />,
            error: <ErrorIcon fontSize="inherit" />
          }}
        >
          {alert.message}
        </Alert>
      </Snackbar>

      <Layout>
        <StyledPaper>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography 
              variant="h5" 
              sx={{ 
                color: '#15e420', 
                fontWeight: 'bold',
                fontFamily: '"Poppins", sans-serif'
              }}
            >
              Organization Profile
            </Typography>
            <Button
              variant="contained"
              startIcon={<EditIcon />}
              onClick={() => navigate('/organization/edit')}
              sx={{
                bgcolor: '#15e420',
                '&:hover': { bgcolor: '#12c21e' },
                fontFamily: '"Inter", sans-serif',
                textTransform: 'none',
                fontWeight: 500
              }}
            >
              Edit Profile
            </Button>
          </Box>

          {/* Basic Information Section */}
          <Box sx={{ mb: 4 }}>
            <SectionTitle variant="h6">
              Basic Information
            </SectionTitle>
            <Grid container spacing={3}>
              {[
                { label: 'Company Name', value: organization?.company_name },
                { label: 'Office Address', value: organization?.office_address },
                { label: 'Nature of Business', value: organization?.business_nature },
                { label: 'CAC Number', value: organization?.cac_number },
                { label: 'Contact Person', value: organization?.contact_person },
                { label: 'Representative', value: organization?.representative },
                { label: 'Phone Number', value: organization?.phone_number },
                { label: 'Email', value: organization?.email }
              ].map((field, index) => (
                <Grid item xs={12} sm={6} md={3} key={index}>
                  <FieldLabel variant="caption" color="textSecondary">
                    {field.label}
                  </FieldLabel>
                  <FieldValue variant="body1">
                    {field.value || 'N/A'}
                  </FieldValue>
                </Grid>
              ))}
            </Grid>
          </Box>

          {/* Documents Section */}
          <Box>
            <SectionTitle variant="h6">
              Submitted Documents
            </SectionTitle>
            <Box>
              {documents.map((doc) => {
                const docPath = organization?.[doc.key];
                const status = getDocumentStatus(docPath);
                
                return (
                  <DocumentItem key={doc.key} elevation={1}>
                    <Box sx={{ mr: 2 }}>
                      {getDocumentIcon(doc.icon)}
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <DocumentName variant="subtitle2">{doc.name}</DocumentName>
                      {docPath ? (
                        <StatusChip status={status}>
                          {getStatusIcon(status)}
                          {status}
                        </StatusChip>
                      ) : (
                        <StatusChip status="Not Uploaded">
                          <ErrorIcon style={{ fontSize: 16, marginRight: 4 }} />
                          Not Uploaded
                        </StatusChip>
                      )}
                    </Box>
                    {docPath && (
                      <Box>
                        <IconButton 
                          onClick={() => handleViewDocument(doc.name, docPath)}
                          size="small"
                          sx={{ 
                            mr: 1,
                            '&:hover': {
                              backgroundColor: '#e8f5e9'
                            }
                          }}
                        >
                          <VisibilityIcon sx={{ color: '#15e420' }} />
                        </IconButton>
                        <IconButton 
                          onClick={() => handleDownloadDocument(docPath, `${doc.name}.pdf`)}
                          size="small"
                          sx={{
                            '&:hover': {
                              backgroundColor: '#e8f5e9'
                            }
                          }}
                        >
                          <DownloadIcon sx={{ color: '#15e420' }} />
                        </IconButton>
                      </Box>
                    )}
                  </DocumentItem>
                );
              })}
            </Box>
          </Box>
        </StyledPaper>
      </Layout>

      {/* Document Modal */}
      <Dialog
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '16px',
            fontFamily: '"Inter", sans-serif'
          }
        }}
      >
        <DialogTitle sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          fontFamily: '"Poppins", sans-serif',
          fontWeight: 600,
          borderBottom: '1px solid #eee'
        }}>
          {selectedDocument?.name}
          <IconButton onClick={() => setModalOpen(false)}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <Box sx={{ position: 'relative', minHeight: 500 }}>
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
                height="500px"
                style={{ border: 'none', position: 'relative', zIndex: 1 }}
              />
            ) : (
              <Typography 
                sx={{ 
                  fontFamily: '"Inter", sans-serif',
                  textAlign: 'center',
                  mt: 4
                }}
              >
                Document preview not available
              </Typography>
            )}
          </Box>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default OrganizationProfile;