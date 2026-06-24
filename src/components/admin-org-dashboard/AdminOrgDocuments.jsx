// components/admin-org-dashboard/AdminOrgDocuments.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '../../supabaseClient';
import {
  Box,
  Container,
  Grid,
  Paper,
  Typography,
  CircularProgress,
  Button,
  Chip,
  Alert,
  Snackbar,
  Card,
  CardContent,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import {
  Description as DescriptionIcon,
  Upload as UploadIcon,
  Download as DownloadIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  Verified as VerifiedIcon,
  Pending as PendingIcon,
  Error as ErrorIcon,
  InsertDriveFile as FileIcon,
  PictureAsPdf as PdfIcon,
  Image as ImageIcon,
  ArrowBack as ArrowBackIcon,
  CloudUpload as CloudUploadIcon
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import AdminOrgSidebar from './AdminOrgSidebar';

const DocumentsContainer = styled(motion.div)({
  padding: '2rem',
  fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif"
});

const UploadArea = styled(Paper)({
  border: '2px dashed #15e420',
  borderRadius: '16px',
  padding: '3rem',
  textAlign: 'center',
  cursor: 'pointer',
  transition: 'all 0.3s ease',
  backgroundColor: '#f0fdf0',
  '&:hover': {
    backgroundColor: '#e8f5e9',
    borderColor: '#0fa819'
  }
});

const StatusChip = styled(Chip)(({ status }) => ({
  backgroundColor: status === 'approved' ? '#d4edda' :
                  status === 'pending' ? '#fff3e0' :
                  status === 'rejected' ? '#ffebee' : '#f0f0f0',
  color: status === 'approved' ? '#28a745' :
         status === 'pending' ? '#ff9800' :
         status === 'rejected' ? '#dc3545' : '#666',
  fontWeight: 600,
  fontSize: '0.75rem'
}));

const AdminOrgDocuments = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [alert, setAlert] = useState({ open: false, type: 'success', message: '' });
  const [organization, setOrganization] = useState(null);
  const [membershipStatus, setMembershipStatus] = useState('pending');
  const [documents, setDocuments] = useState([]);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [documentType, setDocumentType] = useState('');

  useEffect(() => {
    fetchDocuments();
  }, []);

  const showAlert = useCallback((type, message) => {
    setAlert({ open: true, type, message });
  }, []);

  const fetchDocuments = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/login');
        return;
      }

      let orgData = null;
      
      if (user.user_metadata?.organization_id) {
        const { data } = await supabase
          .from('organizations_registry')
          .select('*')
          .eq('id', user.user_metadata.organization_id)
          .maybeSingle();
        if (data) orgData = data;
      }

      if (!orgData && user.email) {
        const { data } = await supabase
          .from('organizations_registry')
          .select('*')
          .eq('email', user.email)
          .maybeSingle();
        if (data) orgData = data;
      }

      if (!orgData) {
        const { data } = await supabase
          .from('organizations_registry')
          .select('*')
          .eq('created_by', user.id)
          .maybeSingle();
        if (data) orgData = data;
      }

      if (orgData) {
        setOrganization(orgData);
        setMembershipStatus(orgData.status || 'pending');

        const { data: docs, error } = await supabase
          .from('organization_documents')
          .select('*')
          .eq('organization_id', orgData.id)
          .order('created_at', { ascending: false });

        if (docs) {
          setDocuments(docs);
        }
      }
    } catch (error) {
      console.error('Error fetching documents:', error);
      showAlert('error', 'Failed to load documents');
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        showAlert('error', 'File size must be less than 10MB');
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !documentType) {
      showAlert('error', 'Please select a file and document type');
      return;
    }

    setUploading(true);
    try {
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${organization.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('organization-documents')
        .upload(fileName, selectedFile);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('organization-documents')
        .getPublicUrl(fileName);

      const { error: dbError } = await supabase
        .from('organization_documents')
        .insert({
          organization_id: organization.id,
          document_type: documentType,
          file_name: selectedFile.name,
          file_url: publicUrl,
          file_size: selectedFile.size,
          status: 'pending',
          uploaded_at: new Date().toISOString()
        });

      if (dbError) throw dbError;

      showAlert('success', 'Document uploaded successfully');
      setUploadDialogOpen(false);
      setSelectedFile(null);
      setDocumentType('');
      fetchDocuments();
    } catch (error) {
      console.error('Error uploading document:', error);
      showAlert('error', 'Failed to upload document');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (documentId, fileUrl) => {
    try {
      const filePath = fileUrl.split('/').pop();
      await supabase.storage
        .from('organization-documents')
        .remove([`${organization.id}/${filePath}`]);

      const { error } = await supabase
        .from('organization_documents')
        .delete()
        .eq('id', documentId);

      if (error) throw error;

      showAlert('success', 'Document deleted successfully');
      fetchDocuments();
    } catch (error) {
      console.error('Error deleting document:', error);
      showAlert('error', 'Failed to delete document');
    }
  };

  const getFileIcon = (fileName) => {
    const ext = fileName?.split('.').pop()?.toLowerCase();
    if (ext === 'pdf') return <PdfIcon sx={{ color: '#dc3545' }} />;
    if (['jpg', 'jpeg', 'png', 'gif'].includes(ext)) return <ImageIcon sx={{ color: '#2196f3' }} />;
    return <FileIcon sx={{ color: '#666' }} />;
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case 'approved': return <VerifiedIcon sx={{ color: '#28a745' }} />;
      case 'pending': return <PendingIcon sx={{ color: '#ff9800' }} />;
      case 'rejected': return <ErrorIcon sx={{ color: '#dc3545' }} />;
      default: return <PendingIcon />;
    }
  };

  const documentTypes = [
    'Certificate of Incorporation',
    'Tax Clearance Certificate',
    'CAC Status Report',
    'Memorandum of Association',
    'Identification Document',
    'Other'
  ];

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress style={{ color: '#15e420' }} />
      </Box>
    );
  }

  return (
    <>
      <Snackbar
        open={alert.open}
        autoHideDuration={6000}
        onClose={() => setAlert(prev => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert onClose={() => setAlert(prev => ({ ...prev, open: false }))} severity={alert.type}>
          {alert.message}
        </Alert>
      </Snackbar>

      <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#f5f7fa' }}>
        <AdminOrgSidebar organization={organization} membershipStatus={membershipStatus} />
        
        <Box sx={{ flex: 1, overflow: 'auto' }}>
          <Container maxWidth="lg">
            <DocumentsContainer
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Paper sx={{ p: 3, borderRadius: '16px', mb: 3 }}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                  <Box display="flex" alignItems="center" gap={2}>
                    <Button
                      startIcon={<ArrowBackIcon />}
                      onClick={() => navigate('/admin-org-dashboard')}
                      sx={{ color: '#15e420' }}
                    >
                      Back
                    </Button>
                    <Typography variant="h5" sx={{ fontWeight: 700 }}>
                      Documents
                    </Typography>
                  </Box>
                  <Button
                    variant="contained"
                    startIcon={<CloudUploadIcon />}
                    onClick={() => setUploadDialogOpen(true)}
                    sx={{
                      bgcolor: '#15e420',
                      '&:hover': { bgcolor: '#12c21e' }
                    }}
                  >
                    Upload Document
                  </Button>
                </Box>

                {documents.length === 0 ? (
                  <UploadArea onClick={() => setUploadDialogOpen(true)}>
                    <CloudUploadIcon sx={{ fontSize: 64, color: '#15e420', mb: 2 }} />
                    <Typography variant="h6" sx={{ mb: 1 }}>
                      No Documents Yet
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Click here to upload your first document
                    </Typography>
                  </UploadArea>
                ) : (
                  <Grid container spacing={3}>
                    {documents.map((doc) => (
                      <Grid size={{ xs: 12, sm: 6, md: 4 }} key={doc.id}>
                        <Card sx={{ borderRadius: '16px', position: 'relative' }}>
                          <CardContent>
                            <Box display="flex" alignItems="center" gap={2} mb={2}>
                              {getFileIcon(doc.file_name)}
                              <Box flex={1}>
                                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                  {doc.document_type}
                                </Typography>
                                <Typography variant="caption" color="textSecondary">
                                  {doc.file_name}
                                </Typography>
                              </Box>
                            </Box>
                            
                            <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                              <StatusChip
                                status={doc.status}
                                icon={getStatusIcon(doc.status)}
                                label={doc.status}
                                size="small"
                              />
                              <Typography variant="caption" color="textSecondary">
                                {formatFileSize(doc.file_size)}
                              </Typography>
                            </Box>

                            <Box display="flex" gap={1}>
                              <IconButton
                                size="small"
                                onClick={() => window.open(doc.file_url, '_blank')}
                                sx={{ color: '#15e420' }}
                              >
                                <VisibilityIcon />
                              </IconButton>
                              <IconButton
                                size="small"
                                onClick={() => window.open(doc.file_url, '_blank')}
                                sx={{ color: '#2196f3' }}
                              >
                                <DownloadIcon />
                              </IconButton>
                              <IconButton
                                size="small"
                                onClick={() => handleDelete(doc.id, doc.file_url)}
                                sx={{ color: '#dc3545' }}
                              >
                                <DeleteIcon />
                              </IconButton>
                            </Box>
                          </CardContent>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                )}
              </Paper>
            </DocumentsContainer>
          </Container>
        </Box>
      </Box>

      {/* Upload Dialog */}
      <Dialog open={uploadDialogOpen} onClose={() => setUploadDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Upload Document</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <select
              value={documentType}
              onChange={(e) => setDocumentType(e.target.value)}
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '8px',
                border: '1px solid #ccc',
                marginBottom: '16px',
                fontSize: '14px'
              }}
            >
              <option value="">Select Document Type</option>
              {documentTypes.map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>

            <input
              type="file"
              onChange={handleFileSelect}
              style={{ display: 'none' }}
              id="file-input"
              accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
            />
            <label htmlFor="file-input">
              <UploadArea sx={{ p: 2, cursor: 'pointer' }}>
                {selectedFile ? (
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {selectedFile.name}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      {formatFileSize(selectedFile.size)}
                    </Typography>
                  </Box>
                ) : (
                  <Typography variant="body2" color="textSecondary">
                    Click to select a file (PDF, JPG, PNG, DOC up to 10MB)
                  </Typography>
                )}
              </UploadArea>
            </label>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUploadDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleUpload}
            variant="contained"
            disabled={!selectedFile || !documentType || uploading}
            sx={{ bgcolor: '#15e420', '&:hover': { bgcolor: '#12c21e' } }}
          >
            {uploading ? <CircularProgress size={24} /> : 'Upload'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default AdminOrgDocuments;