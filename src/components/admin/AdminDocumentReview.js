import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
  Tooltip,
  Badge,
  alpha
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Description as DescriptionIcon,
  Refresh as RefreshIcon,
  Warning as WarningIcon,
  Visibility as VisibilityIcon,
  Download as DownloadIcon,
  History as HistoryIcon,
  Pending as PendingIcon,
  Business as BusinessIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  LocationOn as LocationIcon,
  PictureAsPdf as PdfIcon,
  Image as ImageIcon,
  InsertDriveFile as FileIcon
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { supabase } from '../../supabaseClient';
import AdminSidebar from './AdminSidebar';
import { documentFields } from './organizationConstants';
import DocumentViewerDialog from './DocumentViewerDialog';

// Styled components
const StyledCard = styled(Card)(({ theme, status }) => ({
  borderRadius: '12px',
  transition: 'all 0.2s ease',
  border: '1px solid #eaeef2',
  boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
  backgroundColor: '#ffffff',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: '0 8px 16px rgba(0,0,0,0.04)',
    borderColor: theme.palette.primary.main
  }
}));

const StatusIcon = styled(Box)(({ theme, status }) => ({
  position: 'absolute',
  top: 8,
  right: 8,
  width: 24,
  height: 24,
  borderRadius: '50%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: 
    status === 'approved' ? alpha(theme.palette.success.main, 0.1) :
    status === 'rejected' ? alpha(theme.palette.error.main, 0.1) :
    alpha(theme.palette.warning.main, 0.1),
  color: 
    status === 'approved' ? theme.palette.success.main :
    status === 'rejected' ? theme.palette.error.main :
    theme.palette.warning.main
}));

const InfoItem = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1),
  padding: theme.spacing(0.75, 1.5),
  borderRadius: '8px',
  backgroundColor: '#ffffff',
  border: '1px solid #eaeef2',
  '&:hover': {
    backgroundColor: '#f8fafc',
  },
}));

const AdminDocumentReview = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [organization, setOrganization] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [alert, setAlert] = useState({ open: false, type: 'success', message: '' });
  const [reuploadHistory, setReuploadHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState(null);

  useEffect(() => {
    fetchOrganizationDetails();
  }, [id]);

  const showAlert = (type, message) => {
    setAlert({ open: true, type, message });
  };

  const fetchOrganizationDetails = async () => {
    setLoading(true);
    try {
      const { data: orgData, error: orgError } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', id)
        .single();

      if (orgError) throw orgError;
      setOrganization(orgData);

      const docs = [];
      
      for (const field of documentFields) {
        if (orgData[field.key]) {
          let bucket = field.bucket;
          let path = orgData[field.key];
          
          if (path && path.includes('supabase.co/storage/v1/object/public/')) {
            const urlParts = path.split('/object/public/');
            if (urlParts.length > 1) {
              const bucketAndPath = urlParts[1];
              const bucketEndIndex = bucketAndPath.indexOf('/');
              if (bucketEndIndex > -1) {
                bucket = bucketAndPath.substring(0, bucketEndIndex);
                path = bucketAndPath.substring(bucketEndIndex + 1);
              }
            }
          }

          const { data: notifications } = await supabase
            .from('organization_notifications')
            .select('*')
            .eq('organization_id', id)
            .in('type', ['document_approved', 'document_rejected', 'document_reuploaded'])
            .ilike('title', `%${field.name}%`)
            .order('created_at', { ascending: false });

          let status = 'pending';
          let rejectionReason = orgData[field.rejectionField] || '';

          if (notifications && notifications.length > 0) {
            const latest = notifications[0];
            if (latest.type === 'document_approved') {
              status = 'approved';
            } else if (latest.type === 'document_rejected') {
              status = 'rejected';
            } else if (latest.type === 'document_reuploaded') {
              status = 'pending';
            }
          }

          const fileExt = path?.split('.').pop()?.toLowerCase() || '';
          
          docs.push({
            ...field,
            originalPath: orgData[field.key],
            path,
            bucket,
            status,
            rejectionReason,
            notifications: notifications || [],
            fileExt,
            isImage: ['jpg', 'jpeg', 'png', 'gif', 'svg'].includes(fileExt),
            isPdf: fileExt === 'pdf'
          });
        }
      }

      setDocuments(docs);

      const { data: history } = await supabase
        .from('organization_notifications')
        .select('*')
        .eq('organization_id', id)
        .eq('type', 'document_reuploaded')
        .order('created_at', { ascending: false });

      setReuploadHistory(history || []);

    } catch (error) {
      console.error('Error fetching organization:', error);
      showAlert('error', 'Failed to load organization details');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDocument = (doc) => {
    setSelectedDocument(doc);
    setViewerOpen(true);
  };

  const handleDownloadDocument = async (doc) => {
    try {
      if (doc.originalPath?.startsWith('http')) {
        window.open(doc.originalPath, '_blank');
        return;
      }

      const { data, error } = await supabase.storage
        .from(doc.bucket)
        .download(doc.path);

      if (error) throw error;

      const url = window.URL.createObjectURL(data);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${doc.name.replace(/\s+/g, '_')}.${doc.fileExt || 'pdf'}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading document:', error);
      showAlert('error', 'Failed to download document');
    }
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case 'approved': return <CheckCircleIcon fontSize="small" />;
      case 'rejected': return <CancelIcon fontSize="small" />;
      default: return <PendingIcon fontSize="small" />;
    }
  };

  const getFileIcon = (doc) => {
    if (doc.isImage) return <ImageIcon sx={{ fontSize: 32 }} />;
    if (doc.isPdf) return <PdfIcon sx={{ fontSize: 32 }} />;
    return <FileIcon sx={{ fontSize: 32 }} />;
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress size={32} sx={{ color: '#15e420' }} />
      </Box>
    );
  }

  return (
    <>
      <Snackbar
        open={alert.open}
        autoHideDuration={4000}
        onClose={() => setAlert({ ...alert, open: false })}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert severity={alert.type} sx={{ borderRadius: '8px' }}>
          {alert.message}
        </Alert>
      </Snackbar>

      <DocumentViewerDialog
        open={viewerOpen}
        onClose={() => {
          setViewerOpen(false);
          setSelectedDocument(null);
        }}
        document={selectedDocument}
        companyName={organization?.company_name}
        onDownload={handleDownloadDocument}
      />

      <Dialog 
        open={showHistory} 
        onClose={() => setShowHistory(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: '12px' } }}
      >
        <DialogTitle sx={{ pb: 1, fontWeight: 600 }}>Re-upload History</DialogTitle>
        <DialogContent>
          {reuploadHistory.length > 0 ? (
            <List dense>
              {reuploadHistory.map((item, index) => (
                <ListItem key={index} divider={index < reuploadHistory.length - 1}>
                  <ListItemIcon>
                    <RefreshIcon sx={{ color: '#17a2b8', fontSize: 20 }} />
                  </ListItemIcon>
                  <ListItemText
                    primary={item.title}
                    secondary={new Date(item.created_at).toLocaleString()}
                    primaryTypographyProps={{ variant: 'body2', fontWeight: 500 }}
                    secondaryTypographyProps={{ variant: 'caption' }}
                  />
                </ListItem>
              ))}
            </List>
          ) : (
            <Typography color="textSecondary" align="center" sx={{ py: 3 }}>
              No re-upload history
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowHistory(false)} size="small">
            Close
          </Button>
        </DialogActions>
      </Dialog>

      <Container maxWidth="xl" sx={{ py: 3,  minHeight: '100vh' }}>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <AdminSidebar />
          
          <Box sx={{ flex: 1 ,bgcolor: '#f8fafc', borderRadius: '12px', p: 3, border: '1px solid #eaeef2' }}>
            {/* Header */}
            <Paper sx={{ p: 2, mb: 2, borderRadius: '12px', bgcolor: '#ffffff', border: '1px solid #eaeef2' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <IconButton size="small" onClick={() => navigate('/admin/organizations')}>
                  <ArrowBackIcon fontSize="small" />
                </IconButton>
                <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1.1rem' }}>
                  Document Review
                </Typography>
                <Box sx={{ ml: 'auto', display: 'flex', gap: 1 }}>
                  <IconButton size="small" onClick={() => setShowHistory(true)}>
                    <Badge badgeContent={reuploadHistory.length} color="info" max={9}>
                      <HistoryIcon fontSize="small" />
                    </Badge>
                  </IconButton>
                  <Chip
                    label={organization?.status}
                    size="small"
                    color={
                      organization?.status === 'approved' ? 'success' :
                      organization?.status === 'rejected' ? 'error' : 'warning'
                    }
                    sx={{ height: 24, textTransform: 'capitalize' }}
                  />
                </Box>
              </Box>
            </Paper>

            {/* Organization Info - Enhanced */}
            <Paper sx={{ p: 2, mb: 2, borderRadius: '12px', bgcolor: '#ffffff', border: '1px solid #eaeef2' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <Avatar sx={{ width: 48, height: 48, bgcolor: '#15e420' }}>
                  <BusinessIcon />
                </Avatar>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1.1rem' }}>
                    {organization?.company_name}
                  </Typography>
                  <Typography variant="caption" color="textSecondary">
                    CAC: {organization?.cac_number || 'N/A'}
                  </Typography>
                </Box>
              </Box>
              
              <Divider sx={{ my: 1.5 }} />
              
              <Grid container spacing={1.5}>
                <Grid item xs={12} sm={6}>
                  <InfoItem>
                    <EmailIcon sx={{ color: '#15e420', fontSize: 18 }} />
                    <Typography variant="body2" sx={{ fontSize: '0.85rem' }}>
                      {organization?.email}
                    </Typography>
                  </InfoItem>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <InfoItem>
                    <PhoneIcon sx={{ color: '#15e420', fontSize: 18 }} />
                    <Typography variant="body2" sx={{ fontSize: '0.85rem' }}>
                      {organization?.phone_number || 'N/A'}
                    </Typography>
                  </InfoItem>
                </Grid>
                <Grid item xs={12}>
                  <InfoItem>
                    <LocationIcon sx={{ color: '#15e420', fontSize: 18 }} />
                    <Typography variant="body2" sx={{ fontSize: '0.85rem' }} noWrap>
                      {organization?.office_address || 'N/A'}
                    </Typography>
                  </InfoItem>
                </Grid>
                <Grid item xs={6}>
                  <InfoItem>
                    <HistoryIcon sx={{ color: '#15e420', fontSize: 18 }} />
                    <Typography variant="body2" sx={{ fontSize: '0.85rem' }}>
                      Re-uploads: {organization?.re_upload_count || 0}
                    </Typography>
                  </InfoItem>
                </Grid>
                {organization?.last_re_upload_at && (
                  <Grid item xs={6}>
                    <InfoItem>
                      <RefreshIcon sx={{ color: '#15e420', fontSize: 18 }} />
                      <Typography variant="body2" sx={{ fontSize: '0.85rem' }}>
                        {new Date(organization.last_re_upload_at).toLocaleDateString()}
                      </Typography>
                    </InfoItem>
                  </Grid>
                )}
              </Grid>
            </Paper>

            {/* Document Grid */}
            <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 600, color: '#4a5568' }}>
              Documents ({documents.length})
            </Typography>
            
            <Grid container spacing={1.5}>
              {documents.map((doc) => {
                const wasReuploaded = reuploadHistory.some(
                  h => h.title?.includes(doc.name) || h.message?.includes(doc.name)
                );
                
                return (
                  <Grid item xs={12} sm={6} md={4} lg={3} key={doc.key}>
                    <StyledCard>
                      <CardContent sx={{ p: 2, position: 'relative' }}>
                        {/* Status Icon */}
                        <StatusIcon status={doc.status}>
                          {getStatusIcon(doc.status)}
                        </StatusIcon>

                        {/* Re-upload Indicator */}
                        {wasReuploaded && doc.status === 'pending' && (
                          <Tooltip title="Re-uploaded" arrow>
                            <Box sx={{ 
                              position: 'absolute',
                              top: 8,
                              left: 8,
                              width: 20,
                              height: 20,
                              borderRadius: '50%',
                              bgcolor: alpha('#17a2b8', 0.1),
                              color: '#17a2b8',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}>
                              <RefreshIcon sx={{ fontSize: 12 }} />
                            </Box>
                          </Tooltip>
                        )}

                        {/* Icon */}
                        <Box sx={{ 
                          display: 'flex', 
                          justifyContent: 'center',
                          mb: 1.5,
                          color: 
                            doc.status === 'approved' ? '#28a745' :
                            doc.status === 'rejected' ? '#dc3545' :
                            '#ffc107'
                        }}>
                          {getFileIcon(doc)}
                        </Box>

                        {/* Name */}
                        <Tooltip title={doc.name} arrow>
                          <Typography 
                            variant="body2" 
                            align="center"
                            sx={{ 
                              fontWeight: 500,
                              fontSize: '0.85rem',
                              mb: 1,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap'
                            }}
                          >
                            {doc.name}
                          </Typography>
                        </Tooltip>

                        {/* Rejection Icon */}
                        {doc.rejectionReason && doc.status === 'rejected' && (
                          <Tooltip title={doc.rejectionReason} arrow>
                            <Box sx={{ 
                              display: 'flex', 
                              justifyContent: 'center',
                              mb: 1
                            }}>
                              <WarningIcon sx={{ fontSize: 16, color: '#dc3545' }} />
                            </Box>
                          </Tooltip>
                        )}

                        {/* Actions */}
                        <Box sx={{ 
                          display: 'flex', 
                          justifyContent: 'center',
                          gap: 0.5,
                          mt: 1
                        }}>
                          <Tooltip title="View Document">
                            <IconButton 
                              size="small" 
                              onClick={() => handleViewDocument(doc)}
                              sx={{ 
                                p: 0.5,
                                bgcolor: alpha('#15e420', 0.05),
                                '&:hover': { bgcolor: alpha('#15e420', 0.1) }
                              }}
                            >
                              <VisibilityIcon sx={{ fontSize: 18, color: '#15e420' }} />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Download">
                            <IconButton 
                              size="small" 
                              onClick={() => handleDownloadDocument(doc)}
                              sx={{ 
                                p: 0.5,
                                bgcolor: alpha('#15e420', 0.05),
                                '&:hover': { bgcolor: alpha('#15e420', 0.1) }
                              }}
                            >
                              <DownloadIcon sx={{ fontSize: 18, color: '#15e420' }} />
                            </IconButton>
                          </Tooltip>
                        </Box>

                        {/* History Dots - Minimal */}
                        {doc.notifications && doc.notifications.length > 0 && (
                          <Box sx={{ 
                            display: 'flex', 
                            justifyContent: 'center',
                            gap: 0.5,
                            mt: 1
                          }}>
                            {doc.notifications.slice(0, 3).map((notif, idx) => (
                              <Tooltip 
                                key={idx}
                                title={`${notif.type.replace('_', ' ')} - ${new Date(notif.created_at).toLocaleDateString()}`}
                                arrow
                              >
                                <Box sx={{ 
                                  width: 6, 
                                  height: 6, 
                                  borderRadius: '50%',
                                  bgcolor: 
                                    notif.type === 'document_approved' ? '#28a745' :
                                    notif.type === 'document_rejected' ? '#dc3545' :
                                    notif.type === 'document_reuploaded' ? '#17a2b8' :
                                    '#ffc107'
                                }} />
                              </Tooltip>
                            ))}
                          </Box>
                        )}
                      </CardContent>
                    </StyledCard>
                  </Grid>
                );
              })}

              {documents.length === 0 && (
                <Grid item xs={12}>
                  <Paper sx={{ 
                    p: 4, 
                    textAlign: 'center',
                    borderRadius: '12px',
                    bgcolor: '#ffffff',
                    border: '1px solid #eaeef2'
                  }}>
                    <DescriptionIcon sx={{ fontSize: 48, color: '#ccc', mb: 2 }} />
                    <Typography color="textSecondary">No documents uploaded yet</Typography>
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

export default AdminDocumentReview;