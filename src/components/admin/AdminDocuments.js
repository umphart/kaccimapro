import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  TextField,
  InputAdornment,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Alert,
  Snackbar,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  Avatar
} from '@mui/material';
import {
  Search as SearchIcon,
  Visibility as VisibilityIcon,
  Download as DownloadIcon,
  CheckCircle as CheckCircleIcon,
  Pending as PendingIcon,
  Cancel as CancelIcon,
  Refresh as RefreshIcon,
  Description as DescriptionIcon,
  PictureAsPdf as PdfIcon,
  Image as ImageIcon,
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

const formatFileSize = (bytes) => {
  if (!bytes) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const AdminDocuments = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [documents, setDocuments] = useState([]);
  const [organizations, setOrganizations] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [orgFilter, setOrgFilter] = useState('all');
  const [alert, setAlert] = useState({ open: false, type: 'success', message: '' });
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    fetchOrganizations();
    fetchDocuments();
  }, []);

  const showAlert = (type, message) => {
    setAlert({ open: true, type, message });
  };

  const handleCloseAlert = () => {
    setAlert({ ...alert, open: false });
  };

  const fetchOrganizations = async () => {
    try {
      const { data, error } = await supabase
        .from('organizations')
        .select('id, company_name')
        .order('company_name');

      if (error) throw error;
      setOrganizations(data || []);
    } catch (error) {
      console.error('Error fetching organizations:', error);
    }
  };

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      // This is a simplified version - you'll need to implement based on your storage structure
      const { data: orgs, error: orgError } = await supabase
        .from('organizations')
        .select('id, company_name, cover_letter_path, memorandum_path, registration_cert_path, incorporation_cert_path, premises_cert_path, company_logo_path, form_c07_path, id_document_path');

      if (orgError) throw orgError;

      const docs = [];
      orgs.forEach(org => {
        const docFields = [
          { name: 'Cover Letter', path: org.cover_letter_path, type: 'document' },
          { name: 'Memorandum', path: org.memorandum_path, type: 'document' },
          { name: 'Registration Certificate', path: org.registration_cert_path, type: 'document' },
          { name: 'Incorporation Certificate', path: org.incorporation_cert_path, type: 'document' },
          { name: 'Premises Certificate', path: org.premises_cert_path, type: 'document' },
          { name: 'Company Logo', path: org.company_logo_path, type: 'image' },
          { name: 'Form C07', path: org.form_c07_path, type: 'document' },
          { name: 'ID Document', path: org.id_document_path, type: 'document' }
        ];

        docFields.forEach(field => {
          if (field.path) {
            docs.push({
              id: `${org.id}_${field.name}`,
              organizationId: org.id,
              organizationName: org.company_name,
              name: field.name,
              path: field.path,
              type: field.type,
              status: 'pending', // You can add status tracking in your database
              uploadedAt: new Date().toISOString() // You'll need to track this
            });
          }
        });
      });

      setDocuments(docs);
    } catch (error) {
      console.error('Error fetching documents:', error);
      showAlert('error', 'Failed to load documents');
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
      a.download = `${doc.organizationName}_${doc.name}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading document:', error);
      showAlert('error', 'Failed to download document');
    }
  };

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.organizationName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doc.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesOrg = orgFilter === 'all' || doc.organizationId === orgFilter;
    return matchesSearch && matchesOrg;
  });

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
            {/* Header */}
            <Box sx={{ mb: 4 }}>
              <Typography 
                variant="h4" 
                sx={{ 
                  fontFamily: '"Poppins", sans-serif',
                  fontWeight: 700,
                  color: '#333',
                  mb: 1
                }}
              >
                Document Management
              </Typography>
              <Typography 
                variant="body1" 
                sx={{ 
                  fontFamily: '"Inter", sans-serif',
                  color: '#666'
                }}
              >
                Review and verify all uploaded documents
              </Typography>
            </Box>

            {/* Filters */}
            <Paper sx={{ p: 2, mb: 3, borderRadius: '12px' }}>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    placeholder="Search by company or document..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon sx={{ color: '#15e420' }} />
                        </InputAdornment>
                      ),
                    }}
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} md={3}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Organization</InputLabel>
                    <Select
                      value={orgFilter}
                      onChange={(e) => setOrgFilter(e.target.value)}
                      label="Organization"
                    >
                      <MenuItem value="all">All Organizations</MenuItem>
                      {organizations.map(org => (
                        <MenuItem key={org.id} value={org.id}>{org.company_name}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={5} sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                  <Button
                    variant="outlined"
                    startIcon={<RefreshIcon />}
                    onClick={fetchDocuments}
                    sx={{ borderColor: '#15e420', color: '#15e420' }}
                  >
                    Refresh
                  </Button>
                </Grid>
              </Grid>
            </Paper>

            {/* Documents Grid */}
            <Grid container spacing={3}>
              {filteredDocuments.map((doc) => (
                <Grid item xs={12} sm={6} md={4} key={doc.id}>
                  <StyledCard>
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        {getFileIcon(doc.type)}
                        <Box sx={{ ml: 2 }}>
                          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                            {doc.name}
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
                            {doc.organizationName}
                          </Typography>
                        </Box>
                      </Box>
                      <Box sx={{ mb: 2 }}>
                        {getStatusChip(doc.status)}
                      </Box>
                      <Typography variant="caption" color="textSecondary">
                        Uploaded: {new Date(doc.uploadedAt).toLocaleDateString()}
                      </Typography>
                    </CardContent>
                    <CardActions sx={{ justifyContent: 'flex-end', p: 2, pt: 0 }}>
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
                    </CardActions>
                  </StyledCard>
                </Grid>
              ))}
              {filteredDocuments.length === 0 && (
                <Grid item xs={12}>
                  <Paper sx={{ p: 4, textAlign: 'center' }}>
                    <DescriptionIcon sx={{ fontSize: 64, color: '#ccc', mb: 2 }} />
                    <Typography variant="h6" sx={{ color: '#666' }}>
                      No documents found
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
          {selectedDocument?.name} - {selectedDocument?.organizationName}
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
    </>
  );
};

export default AdminDocuments;