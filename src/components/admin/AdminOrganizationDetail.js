import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
  Avatar,
  Alert,
  Snackbar,
  CircularProgress,
  Tooltip,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Card,
  CardContent,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Business as BusinessIcon,
  LocationOn as LocationOnIcon,
  Person as PersonIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  Description as DescriptionIcon,
  PictureAsPdf as PdfIcon,
  Image as ImageIcon,
  Download as DownloadIcon,
  Visibility as VisibilityIcon,
  CheckCircle as CheckCircleIcon,
  Pending as PendingIcon,
  Cancel as CancelIcon,
  ExpandMore as ExpandMoreIcon,
  People as PeopleIcon,
  ContactMail as ContactMailIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import AdminSidebar from './AdminSidebar';
import { documentFields, getDocumentSummary, requiredDocumentKeys } from './organizationConstants';

const StatusChip = styled(Chip)(({ status }) => ({
  borderRadius: '20px',
  height: '24px',
  fontSize: '0.7rem',
  fontWeight: 500,
  backgroundColor: 
    status === 'approved' || status === 'active' ? '#e8f5e9' :
    status === 'rejected' ? '#ffebee' :
    '#fff3e0',
  color: 
    status === 'approved' || status === 'active' ? '#2e7d32' :
    status === 'rejected' ? '#c62828' :
    '#e65100',
  '& .MuiChip-icon': {
    fontSize: '14px'
  }
}));

const DetailRow = styled(Box)(({ theme }) => ({
  display: 'flex',
  padding: theme.spacing(1, 0),
  borderBottom: '1px solid #f0f0f0',
  '&:last-child': {
    borderBottom: 'none'
  }
}));

const DetailLabel = styled(Typography)(({ theme }) => ({
  fontWeight: 600,
  color: '#666',
  minWidth: '140px',
  fontSize: '0.85rem'
}));

const DetailValue = styled(Typography)(({ theme }) => ({
  color: '#333',
  fontSize: '0.85rem',
  flex: 1
}));

const DocumentCard = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2),
  marginBottom: theme.spacing(1),
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  borderRadius: '8px',
  border: '1px solid #e0e0e0',
  backgroundColor: '#fafafa',
  '&:hover': {
    backgroundColor: '#f5f5f5',
    borderColor: '#15e420'
  }
}));

const AdminOrganizationDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [organization, setOrganization] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [alert, setAlert] = useState({ open: false, type: 'success', message: '' });

  useEffect(() => {
    if (id) {
      fetchOrganization();
    }
  }, [id]);

  const fetchOrganization = async () => {
    setLoading(true);
    try {
      console.log('Fetching organization with ID:', id);
      
      // Fetch organization details from organizations_registry
      const { data: orgData, error: orgError } = await supabase
        .from('organizations_registry')
        .select('*')
        .eq('id', id)
        .single();

      if (orgError) {
        console.error('Error fetching organization:', orgError);
        if (orgError.code === 'PGRST116') {
          setAlert({ open: true, type: 'error', message: 'Organization not found' });
          setOrganization(null);
          setLoading(false);
          return;
        }
        throw orgError;
      }

      if (!orgData) {
        setAlert({ open: true, type: 'error', message: 'Organization not found' });
        setOrganization(null);
        setLoading(false);
        return;
      }

      console.log('Organization found:', orgData);

      // Fetch documents for this organization
      const { data: docData, error: docError } = await supabase
        .from('organization_documents')
        .select('*')
        .eq('organization_id', id);

      if (docError) {
        console.error('Error fetching documents:', docError);
        setDocuments([]);
      } else {
        console.log('Documents found:', docData);
        setDocuments(docData || []);
      }

      setOrganization(orgData);
    } catch (error) {
      console.error('Error fetching organization:', error);
      setAlert({ open: true, type: 'error', message: 'Failed to load organization details' });
    } finally {
      setLoading(false);
    }
  };

  const handleCloseAlert = () => {
    setAlert({ ...alert, open: false });
  };

  const getStatusChip = (status) => {
    const statusMap = {
      pending: { label: 'Pending', icon: <PendingIcon /> },
      approved: { label: 'Approved', icon: <CheckCircleIcon /> },
      rejected: { label: 'Rejected', icon: <CancelIcon /> },
      active: { label: 'Active', icon: <CheckCircleIcon /> }
    };
    const config = statusMap[status?.toLowerCase()] || statusMap.pending;
    
    return <StatusChip icon={config.icon} label={config.label} status={status?.toLowerCase()} />;
  };

  const getDocumentIcon = (docType) => {
    const pdfTypes = ['cover_letter', 'memorandum', 'registration_cert', 'incorporation_cert', 'premises_cert', 'form_c07'];
    if (pdfTypes.includes(docType)) {
      return <PdfIcon sx={{ color: '#f44336' }} />;
    }
    return <ImageIcon sx={{ color: '#4caf50' }} />;
  };

  const getDocumentLabel = (docType) => {
    const labels = {
      cover_letter: 'Covering Letter',
      memorandum: 'Memorandum & Articles',
      registration_cert: 'Registration Certificate',
      incorporation_cert: 'Incorporation Certificate',
      premises_cert: 'Business Premises Certificate',
      company_logo: 'Company Logo',
      form_c07: 'Form C07',
      id_document: 'ID Document'
    };
    return labels[docType] || docType;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-NG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', bgcolor: '#f8f9fa', minHeight: '100vh' }}>
        <AdminSidebar />
        <Box sx={{ flex: 1, p: 3, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <CircularProgress style={{ color: '#15e420' }} />
        </Box>
      </Box>
    );
  }

  if (!organization) {
    return (
      <>
        <Snackbar
          open={alert.open}
          autoHideDuration={6000}
          onClose={handleCloseAlert}
          anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        >
          <Alert onClose={handleCloseAlert} severity={alert.type}>
            {alert.message}
          </Alert>
        </Snackbar>
        <Box sx={{ display: 'flex', bgcolor: '#f8f9fa', minHeight: '100vh' }}>
          <AdminSidebar />
          <Box sx={{ flex: 1, p: 3 }}>
            <Container maxWidth="lg">
              <Paper sx={{ p: 4, textAlign: 'center', borderRadius: '12px' }}>
                <BusinessIcon sx={{ fontSize: 64, color: '#ccc', mb: 2 }} />
                <Typography variant="h5" color="error" gutterBottom>
                  Organization Not Found
                </Typography>
                <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
                  The organization you're looking for doesn't exist or may have been deleted.
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<ArrowBackIcon />}
                  onClick={() => navigate('/admin/organizations')}
                  sx={{ 
                    bgcolor: '#15e420', 
                    '&:hover': { bgcolor: '#12c21e' },
                    textTransform: 'none'
                  }}
                >
                  Back to Organizations
                </Button>
              </Paper>
            </Container>
          </Box>
        </Box>
      </>
    );
  }

  const summary = getDocumentSummary(documents);
  const businessNature = organization.business_nature || [];
  let parsedBusinessNature = [];
  if (typeof businessNature === 'string') {
    try { parsedBusinessNature = JSON.parse(businessNature); } catch (e) { parsedBusinessNature = []; }
  } else if (Array.isArray(businessNature)) {
    parsedBusinessNature = businessNature;
  }

  return (
    <>
      <Snackbar
        open={alert.open}
        autoHideDuration={6000}
        onClose={handleCloseAlert}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert onClose={handleCloseAlert} severity={alert.type}>
          {alert.message}
        </Alert>
      </Snackbar>

      <Box sx={{ display: 'flex', bgcolor: '#f8f9fa', minHeight: '100vh' }}>
        <AdminSidebar />
        <Box sx={{ flex: 1, p: { xs: 2, md: 3 } }}>
          <Container maxWidth="xl" sx={{ py: { xs: 1, md: 2 } }}>
            {/* Header */}
            <Paper sx={{ p: 3, mb: 3, borderRadius: '12px' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2 }}>
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                    <Button
                      startIcon={<ArrowBackIcon />}
                      onClick={() => navigate('/admin/organizations')}
                      sx={{ color: '#15e420', textTransform: 'none' }}
                    >
                      Back
                    </Button>
                    <Typography variant="h4" sx={{ fontWeight: 700 }}>
                      {organization.company_name}
                    </Typography>
                    {getStatusChip(organization.status)}
                  </Box>
                  <Typography variant="body2" sx={{ color: '#666', mt: 1 }}>
                    Registration: {organization.registration_number}
                  </Typography>
                </Box>
              </Box>
            </Paper>

            <Grid container spacing={3}>

              {/* Company Details */}
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 3, borderRadius: '12px' }}>
                  <Typography variant="h6" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    <BusinessIcon sx={{ color: '#15e420' }} /> Company Information
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <DetailRow>
                        <DetailLabel>Company Name</DetailLabel>
                        <DetailValue>{organization.company_name}</DetailValue>
                      </DetailRow>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <DetailRow>
                        <DetailLabel>Registration Number</DetailLabel>
                        <DetailValue>{organization.registration_number}</DetailValue>
                      </DetailRow>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <DetailRow>
                        <DetailLabel>CAC Number</DetailLabel>
                        <DetailValue>{organization.cac_number || 'N/A'}</DetailValue>
                      </DetailRow>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <DetailRow>
                        <DetailLabel>Registration Date</DetailLabel>
                        <DetailValue>{formatDate(organization.registration_date)}</DetailValue>
                      </DetailRow>
                    </Grid>
                    <Grid item xs={12}>
                      <DetailRow>
                        <DetailLabel>Business Nature</DetailLabel>
                        <DetailValue>
                          {parsedBusinessNature.length > 0 ? parsedBusinessNature.join(', ') : 'N/A'}
                        </DetailValue>
                      </DetailRow>
                    </Grid>
                    <Grid item xs={12}>
                      <DetailRow>
                        <DetailLabel>ID Type</DetailLabel>
                        <DetailValue>{organization.id_type || 'N/A'}</DetailValue>
                      </DetailRow>
                    </Grid>
                  </Grid>
                </Paper>
              </Grid>

              {/* Address & Contact */}
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 3, borderRadius: '12px' }}>
                  <Typography variant="h6" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    <LocationOnIcon sx={{ color: '#15e420' }} /> Address & Contact
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <DetailRow>
                        <DetailLabel>House Number</DetailLabel>
                        <DetailValue>{organization.house_number || 'N/A'}</DetailValue>
                      </DetailRow>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <DetailRow>
                        <DetailLabel>Street</DetailLabel>
                        <DetailValue>{organization.street || 'N/A'}</DetailValue>
                      </DetailRow>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <DetailRow>
                        <DetailLabel>LGA</DetailLabel>
                        <DetailValue>{organization.lga || 'N/A'}</DetailValue>
                      </DetailRow>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <DetailRow>
                        <DetailLabel>State</DetailLabel>
                        <DetailValue>{organization.state || 'N/A'}</DetailValue>
                      </DetailRow>
                    </Grid>
                    <Grid item xs={12}>
                      <DetailRow>
                        <DetailLabel>Landmark</DetailLabel>
                        <DetailValue>{organization.landmark || 'N/A'}</DetailValue>
                      </DetailRow>
                    </Grid>
                    <Grid item xs={12}>
                      <Divider />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <DetailRow>
                        <DetailLabel><PhoneIcon fontSize="small" sx={{ mr: 0.5 }} /> Phone 1</DetailLabel>
                        <DetailValue>{organization.phone_number1 || 'N/A'}</DetailValue>
                      </DetailRow>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <DetailRow>
                        <DetailLabel><PhoneIcon fontSize="small" sx={{ mr: 0.5 }} /> Phone 2</DetailLabel>
                        <DetailValue>{organization.phone_number2 || 'N/A'}</DetailValue>
                      </DetailRow>
                    </Grid>
                    <Grid item xs={12}>
                      <DetailRow>
                        <DetailLabel><EmailIcon fontSize="small" sx={{ mr: 0.5 }} /> Email</DetailLabel>
                        <DetailValue>{organization.email || 'N/A'}</DetailValue>
                      </DetailRow>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <DetailRow>
                        <DetailLabel>Contact Person</DetailLabel>
                        <DetailValue>{organization.contact_person || 'N/A'}</DetailValue>
                      </DetailRow>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <DetailRow>
                        <DetailLabel>Representative</DetailLabel>
                        <DetailValue>{organization.representative || 'N/A'}</DetailValue>
                      </DetailRow>
                    </Grid>
                  </Grid>
                </Paper>
              </Grid>

              {/* Staff Information */}
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 3, borderRadius: '12px' }}>
                  <Typography variant="h6" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    <PeopleIcon sx={{ color: '#15e420' }} /> Staff Information
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <DetailRow>
                        <DetailLabel>Nigerian Directors</DetailLabel>
                        <DetailValue>{organization.nigerian_directors || 0}</DetailValue>
                      </DetailRow>
                    </Grid>
                    <Grid item xs={6}>
                      <DetailRow>
                        <DetailLabel>Non-Nigerian Directors</DetailLabel>
                        <DetailValue>{organization.non_nigerian_directors || 0}</DetailValue>
                      </DetailRow>
                    </Grid>
                    <Grid item xs={6}>
                      <DetailRow>
                        <DetailLabel>Nigerian Employees</DetailLabel>
                        <DetailValue>{organization.nigerian_employees || 0}</DetailValue>
                      </DetailRow>
                    </Grid>
                    <Grid item xs={6}>
                      <DetailRow>
                        <DetailLabel>Non-Nigerian Employees</DetailLabel>
                        <DetailValue>{organization.non_nigerian_employees || 0}</DetailValue>
                      </DetailRow>
                    </Grid>
                  </Grid>
                </Paper>
              </Grid>

              {/* Referee Information */}
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 3, borderRadius: '12px' }}>
                  <Typography variant="h6" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    <ContactMailIcon sx={{ color: '#15e420' }} /> Referee Information
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>Referee</Typography>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <DetailRow>
                        <DetailLabel>Full Name</DetailLabel>
                        <DetailValue>{organization.referee_name || 'N/A'}</DetailValue>
                      </DetailRow>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <DetailRow>
                        <DetailLabel>Business Name</DetailLabel>
                        <DetailValue>{organization.referee_business || 'N/A'}</DetailValue>
                      </DetailRow>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <DetailRow>
                        <DetailLabel>Phone Number</DetailLabel>
                        <DetailValue>{organization.referee_phone || 'N/A'}</DetailValue>
                      </DetailRow>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <DetailRow>
                        <DetailLabel>Registration Number</DetailLabel>
                        <DetailValue>{organization.referee_reg_number || 'N/A'}</DetailValue>
                      </DetailRow>
                    </Grid>
                  </Grid>
                </Paper>
              </Grid>

              {/* Documents */}
              <Grid item xs={12}>
                <Paper sx={{ p: 3, borderRadius: '12px' }}>
                  <Typography variant="h6" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    <DescriptionIcon sx={{ color: '#15e420' }} /> Documents ({documents.length || 0})
                  </Typography>
                  {documents.length > 0 ? (
                    <Box>
                      {documentFields.map((field) => {
                        const doc = documents.find(d => d.document_type === field.key);
                        return (
                          <DocumentCard key={field.key}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                              {doc ? getDocumentIcon(field.key) : <WarningIcon sx={{ color: '#ff9800' }} />}
                              <Box>
                                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                  {field.name}
                                  {field.required && (
                                    <Chip 
                                      label="Required" 
                                      size="small" 
                                      sx={{ ml: 1, height: '16px', fontSize: '0.55rem', backgroundColor: '#ffebee', color: '#c62828' }} 
                                    />
                                  )}
                                </Typography>
                                <Typography variant="caption" sx={{ color: '#666' }}>
                                  {doc ? `${doc.file_name} • ${formatDate(doc.uploaded_at)}` : 'Not uploaded'}
                                </Typography>
                              </Box>
                            </Box>
                            {doc && (
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Tooltip title="View Document">
                                  <IconButton
                                    size="small"
                                    href={doc.file_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    sx={{ color: '#15e420' }}
                                  >
                                    <VisibilityIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title="Download">
                                  <IconButton
                                    size="small"
                                    href={doc.file_url}
                                    download
                                    sx={{ color: '#2196f3' }}
                                  >
                                    <DownloadIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              </Box>
                            )}
                          </DocumentCard>
                        );
                      })}
                    </Box>
                  ) : (
                    <Typography variant="body2" sx={{ color: '#666', textAlign: 'center', py: 2 }}>
                      No documents uploaded
                    </Typography>
                  )}
                </Paper>
              </Grid>
            </Grid>
          </Container>
        </Box>
      </Box>
    </>
  );
};

export default AdminOrganizationDetail;