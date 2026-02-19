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
  Button,
  IconButton,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Snackbar,
  CircularProgress
} from '@mui/material';
import {
  Description as DescriptionIcon,
  PictureAsPdf as PdfIcon,
  Image as ImageIcon,
  CloudUpload as CloudUploadIcon,
  Download as DownloadIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';

const StyledCard = styled(Card)(({ theme }) => ({
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  transition: 'all 0.3s',
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: '0 15px 35px rgba(21, 228, 32, 0.15)'
  }
}));

const UploadArea = styled(Paper)(({ theme }) => ({
  border: '2px dashed #ccc',
  backgroundColor: '#fafafa',
  padding: '40px',
  textAlign: 'center',
  cursor: 'pointer',
  transition: 'all 0.3s',
  marginBottom: '24px',
  '&:hover': {
    borderColor: '#15e420',
    backgroundColor: '#e8f5e9'
  }
}));

const HiddenInput = styled('input')({
  display: 'none'
});

const getFileIcon = (type) => {
  if (!type) return <DescriptionIcon sx={{ fontSize: 40, color: '#17a2b8' }} />;
  if (type.includes('pdf')) return <PdfIcon sx={{ fontSize: 40, color: '#dc3545' }} />;
  if (type.includes('image')) return <ImageIcon sx={{ fontSize: 40, color: '#15e420' }} />;
  return <DescriptionIcon sx={{ fontSize: 40, color: '#17a2b8' }} />;
};

const formatFileSize = (bytes) => {
  if (bytes === 0 || !bytes) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const Documents = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [organization, setOrganization] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [alert, setAlert] = useState({ open: false, type: 'success', message: '' });
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  useEffect(() => {
    checkUser();
  }, []);

  useEffect(() => {
    if (user) {
      fetchOrganizationData();
      fetchDocuments();
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
      const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;
      setOrganization(data);
    } catch (error) {
      console.error('Error fetching organization:', error);
    }
  };

  const fetchDocuments = async () => {
    try {
      // List all files in user's folder
      const { data, error } = await supabase.storage
        .from('documents')
        .list(`${user.id}/`);

      if (error) throw error;

      const docList = await Promise.all(
        data.map(async (file) => {
          const { data: urlData } = supabase.storage
            .from('documents')
            .getPublicUrl(`${user.id}/${file.name}`);

          return {
            name: file.name,
            path: `${user.id}/${file.name}`,
            size: file.metadata?.size || 0,
            created_at: file.created_at,
            updated_at: file.updated_at,
            url: urlData.publicUrl,
            type: file.metadata?.mimetype || 'application/octet-stream'
          };
        })
      );

      setDocuments(docList);
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
      // Validate file size (10MB max)
      if (file.size > 10 * 1024 * 1024) {
        showAlert('error', 'File size must be less than 10MB');
        return;
      }

      // Validate file type
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
      if (!allowedTypes.includes(file.type)) {
        showAlert('error', 'Please upload PDF or image files only');
        return;
      }

      setUploadFile(file);
      setUploadModalOpen(true);
    }
  };

  const handleUpload = async () => {
    if (!uploadFile) return;

    setUploading(true);
    setUploadProgress(0);

    try {
      const timestamp = Date.now();
      const cleanFileName = uploadFile.name.replace(/[^a-zA-Z0-9.]/g, '_');
      const fileName = `${timestamp}_${cleanFileName}`;
      const filePath = `${user.id}/${fileName}`;

      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 300);

      const { data, error } = await supabase.storage
        .from('documents')
        .upload(filePath, uploadFile, {
          cacheControl: '3600',
          upsert: false
        });

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (error) throw error;

      setTimeout(() => {
        showAlert('success', 'File uploaded successfully');
        setUploadModalOpen(false);
        setUploadFile(null);
        setUploadProgress(0);
        fetchDocuments();
      }, 500);
    } catch (error) {
      console.error('Error uploading file:', error);
      showAlert('error', 'Failed to upload file');
      setUploadProgress(0);
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async (doc) => {
    try {
      const { data, error } = await supabase.storage
        .from('documents')
        .download(doc.path);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = doc.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading file:', error);
      showAlert('error', 'Failed to download file');
    }
  };

  const handleDelete = async (doc) => {
    if (!window.confirm('Are you sure you want to delete this document?')) return;

    try {
      const { error } = await supabase.storage
        .from('documents')
        .remove([doc.path]);

      if (error) throw error;

      showAlert('success', 'Document deleted successfully');
      fetchDocuments();
    } catch (error) {
      console.error('Error deleting document:', error);
      showAlert('error', 'Failed to delete document');
    }
  };

  const handleView = (doc) => {
    setSelectedDocument(doc);
    setModalOpen(true);
  };

  // Consistent loading state
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

      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', gap: 3 }}>
          {/* Sidebar */}
          <Sidebar />

          {/* Main Content */}
          <Box sx={{ flex: 1 }}>
            <Paper sx={{ p: 3, borderRadius: '16px', boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h5" sx={{ fontWeight: 700, color: '#15e420' }}>
                  Document Management
                </Typography>
                
                {/* Hidden file input */}
                <HiddenInput
                  accept=".pdf,.jpg,.jpeg,.png"
                  id="file-upload"
                  type="file"
                  onChange={handleFileSelect}
                />
                <label htmlFor="file-upload">
                  <Button
                    variant="contained"
                    component="span"
                    startIcon={<CloudUploadIcon />}
                    sx={{
                      bgcolor: '#15e420',
                      '&:hover': { bgcolor: '#12c21e' }
                    }}
                  >
                    Upload Document
                  </Button>
                </label>
              </Box>

              {/* Upload Area */}
              <UploadArea onClick={() => document.getElementById('file-upload').click()}>
                <CloudUploadIcon sx={{ fontSize: 48, color: '#15e420', mb: 2 }} />
                <Typography variant="h6" sx={{ mb: 1 }}>
                  Click to upload files
                </Typography>
                <Typography variant="body2" sx={{ color: '#666' }}>
                  Supported formats: PDF, PNG, JPG, JPEG (Max: 10MB)
                </Typography>
              </UploadArea>

              {/* Documents Grid */}
              <Grid container spacing={3}>
                {documents.map((doc) => (
                  <Grid item xs={12} sm={6} md={4} key={doc.path}>
                    <StyledCard>
                      <CardContent sx={{ flex: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                          {getFileIcon(doc.type)}
                          <Box sx={{ ml: 2, flex: 1 }}>
                            <Typography variant="subtitle1" noWrap sx={{ fontWeight: 600 }}>
                              {doc.name.length > 30 ? doc.name.substring(0, 30) + '...' : doc.name}
                            </Typography>
                            <Typography variant="caption" color="textSecondary">
                              {formatFileSize(doc.size)}
                            </Typography>
                          </Box>
                        </Box>
                        <Typography variant="caption" color="textSecondary" display="block">
                          Uploaded: {doc.created_at ? new Date(doc.created_at).toLocaleDateString() : 'N/A'}
                        </Typography>
                      </CardContent>
                      <CardActions sx={{ justifyContent: 'flex-end', p: 2, pt: 0 }}>
                        <IconButton onClick={() => handleView(doc)} size="small" sx={{ color: '#15e420' }}>
                          <VisibilityIcon />
                        </IconButton>
                        <IconButton onClick={() => handleDownload(doc)} size="small" sx={{ color: '#15e420' }}>
                          <DownloadIcon />
                        </IconButton>
                        <IconButton onClick={() => handleDelete(doc)} size="small" sx={{ color: '#dc3545' }}>
                          <DeleteIcon />
                        </IconButton>
                      </CardActions>
                    </StyledCard>
                  </Grid>
                ))}

                {documents.length === 0 && (
                  <Grid item xs={12}>
                    <Box sx={{ textAlign: 'center', py: 8 }}>
                      <DescriptionIcon sx={{ fontSize: 64, color: '#ccc', mb: 2 }} />
                      <Typography variant="h6" sx={{ color: '#666', mb: 1 }}>
                        No Documents Found
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#999' }}>
                        Click the upload button to add your first document
                      </Typography>
                    </Box>
                  </Grid>
                )}
              </Grid>
            </Paper>
          </Box>
        </Box>
      </Container>

      {/* Upload Modal */}
      <Dialog open={uploadModalOpen} onClose={() => !uploading && setUploadModalOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          Upload Document
          {!uploading && (
            <IconButton
              onClick={() => {
                setUploadModalOpen(false);
                setUploadFile(null);
                setUploadProgress(0);
              }}
              sx={{ position: 'absolute', right: 8, top: 8 }}
            >
              <CloseIcon />
            </IconButton>
          )}
        </DialogTitle>
        <DialogContent dividers>
          {uploadFile && (
            <Box sx={{ textAlign: 'center', py: 2 }}>
              {getFileIcon(uploadFile.type)}
              <Typography variant="subtitle1" sx={{ mt: 2, fontWeight: 600 }}>
                {uploadFile.name}
              </Typography>
              <Typography variant="caption" color="textSecondary">
                {formatFileSize(uploadFile.size)}
              </Typography>
              {uploading && (
                <Box sx={{ width: '100%', mt: 3 }}>
                  <LinearProgress 
                    variant="determinate" 
                    value={uploadProgress} 
                    sx={{ 
                      mb: 1,
                      '& .MuiLinearProgress-bar': {
                        backgroundColor: '#15e420'
                      }
                    }} 
                  />
                  <Typography variant="caption">{uploadProgress}% uploaded</Typography>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setUploadModalOpen(false);
            setUploadFile(null);
            setUploadProgress(0);
          }} disabled={uploading}>
            Cancel
          </Button>
          <Button
            onClick={handleUpload}
            variant="contained"
            disabled={!uploadFile || uploading}
            sx={{ bgcolor: '#15e420', '&:hover': { bgcolor: '#12c21e' } }}
          >
            {uploading ? 'Uploading...' : 'Upload'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Document Viewer Modal */}
      <Dialog open={modalOpen} onClose={() => setModalOpen(false)} maxWidth="lg" fullWidth>
        <DialogTitle>
          {selectedDocument?.name}
          <IconButton
            onClick={() => setModalOpen(false)}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
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

export default Documents;