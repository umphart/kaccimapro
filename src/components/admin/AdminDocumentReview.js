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
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tooltip,
  Badge
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
  Pending as PendingIcon // Move PendingIcon here from @mui/material
} from '@mui/icons-material';
import { supabase } from '../../supabaseClient';
import AdminSidebar from './AdminSidebar';
import { documentFields } from './organizationConstants'; // Fix import path

const AdminDocumentReview = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [organization, setOrganization] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [rejectionDialog, setRejectionDialog] = useState({ open: false, doc: null, reason: '' });
  const [alert, setAlert] = useState({ open: false, type: 'success', message: '' });
  const [processing, setProcessing] = useState(false);
  const [reuploadHistory, setReuploadHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    fetchOrganizationDetails();
  }, [id]);

  const showAlert = (type, message) => {
    setAlert({ open: true, type, message });
  };

  const fetchOrganizationDetails = async () => {
    setLoading(true);
    try {
      // Fetch organization data
      const { data: orgData, error: orgError } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', id)
        .single();

      if (orgError) throw orgError;
      setOrganization(orgData);

      // Build documents list with status
      const docs = [];
      
      for (const field of documentFields) {
        if (orgData[field.key]) {
          // Check document status from notifications
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
              status = 'reuploaded';
            }
          }

          docs.push({
            ...field,
            path: orgData[field.key],
            status,
            rejectionReason,
            notifications: notifications || []
          });
        }
      }

      setDocuments(docs);

      // Fetch re-upload history
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

  const handleApproveDocument = async (doc) => {
    setProcessing(true);
    try {
      // Update document status
      const { error } = await supabase
        .from('organizations')
        .update({ 
          [doc.rejectionField]: null, // Clear rejection reason
          updated_at: new Date().toISOString() 
        })
        .eq('id', id);

      if (error) throw error;

      // Create approval notification
      await supabase
        .from('organization_notifications')
        .insert([{
          organization_id: id,
          type: 'document_approved',
          title: `Document Approved: ${doc.name}`,
          message: `Your ${doc.name} has been approved.`,
          category: 'document',
          for_admin: false,
          read: false,
          created_at: new Date().toISOString()
        }]);

      // Update local state
      setDocuments(prev => prev.map(d => 
        d.key === doc.key ? { ...d, status: 'approved', rejectionReason: null } : d
      ));

      showAlert('success', `${doc.name} approved successfully`);
    } catch (error) {
      console.error('Error approving document:', error);
      showAlert('error', 'Failed to approve document');
    } finally {
      setProcessing(false);
    }
  };

  const handleRejectDocument = async () => {
    const { doc, reason } = rejectionDialog;
    if (!reason.trim()) {
      showAlert('error', 'Please provide a rejection reason');
      return;
    }

    setProcessing(true);
    try {
      // Update rejection reason in organizations table
      const { error } = await supabase
        .from('organizations')
        .update({ 
          [doc.rejectionField]: reason,
          updated_at: new Date().toISOString() 
        })
        .eq('id', id);

      if (error) throw error;

      // Create rejection notification for user
      await supabase
        .from('organization_notifications')
        .insert([{
          organization_id: id,
          type: 'document_rejected',
          title: `Document Rejected: ${doc.name}`,
          message: `Your ${doc.name} was rejected. Reason: ${reason}`,
          category: 'document',
          for_admin: false,
          read: false,
          created_at: new Date().toISOString()
        }]);

      // Also create notification for admin to track
      await supabase
        .from('organization_notifications')
        .insert([{
          organization_id: id,
          type: 'document_rejected',
          title: `Document Rejected: ${doc.name}`,
          message: `Rejected ${doc.name} for ${organization?.company_name}. Reason: ${reason}`,
          category: 'document',
          for_admin: true,
          read: false,
          created_at: new Date().toISOString()
        }]);

      // Update local state
      setDocuments(prev => prev.map(d => 
        d.key === doc.key ? { ...d, status: 'rejected', rejectionReason: reason } : d
      ));

      showAlert('success', `${doc.name} rejected with reason`);
      setRejectionDialog({ open: false, doc: null, reason: '' });
    } catch (error) {
      console.error('Error rejecting document:', error);
      showAlert('error', 'Failed to reject document');
    } finally {
      setProcessing(false);
    }
  };

  const handleViewDocument = async (doc) => {
    try {
      const { data } = supabase.storage
        .from(doc.bucket)
        .getPublicUrl(doc.path);
      
      window.open(data.publicUrl, '_blank');
    } catch (error) {
      console.error('Error viewing document:', error);
      showAlert('error', 'Failed to open document');
    }
  };

  const handleDownloadDocument = async (doc) => {
    try {
      const { data, error } = await supabase.storage
        .from(doc.bucket)
        .download(doc.path);

      if (error) throw error;

      const url = window.URL.createObjectURL(data);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${doc.name}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading document:', error);
      showAlert('error', 'Failed to download document');
    }
  };

  const getStatusChip = (status) => {
    const config = {
      approved: { color: 'success', icon: <CheckCircleIcon />, label: 'Approved' },
      rejected: { color: 'error', icon: <CancelIcon />, label: 'Rejected' },
      reuploaded: { color: 'info', icon: <RefreshIcon />, label: 'Re-uploaded' },
      pending: { color: 'warning', icon: <PendingIcon />, label: 'Pending' }
    };
    const statusConfig = config[status] || config.pending;

    return (
      <Chip
        icon={statusConfig.icon}
        label={statusConfig.label}
        size="small"
        color={statusConfig.color}
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
        onClose={() => setAlert({ ...alert, open: false })}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert severity={alert.type} sx={{ width: '100%' }}>
          {alert.message}
        </Alert>
      </Snackbar>

      {/* Rejection Dialog */}
      <Dialog 
        open={rejectionDialog.open} 
        onClose={() => setRejectionDialog({ open: false, doc: null, reason: '' })}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Reject Document</DialogTitle>
        <DialogContent>
          <Typography variant="subtitle2" gutterBottom>
            Document: {rejectionDialog.doc?.name}
          </Typography>
          <TextField
            autoFocus
            margin="dense"
            label="Rejection Reason"
            fullWidth
            multiline
            rows={4}
            value={rejectionDialog.reason}
            onChange={(e) => setRejectionDialog(prev => ({ ...prev, reason: e.target.value }))}
            placeholder="Explain why this document is being rejected..."
            required
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRejectionDialog({ open: false, doc: null, reason: '' })}>
            Cancel
          </Button>
          <Button 
            onClick={handleRejectDocument} 
            variant="contained" 
            color="error"
            disabled={!rejectionDialog.reason.trim() || processing}
          >
            {processing ? 'Rejecting...' : 'Reject Document'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* History Dialog */}
      <Dialog 
        open={showHistory} 
        onClose={() => setShowHistory(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Document Re-upload History</DialogTitle>
        <DialogContent>
          {reuploadHistory.length > 0 ? (
            <List>
              {reuploadHistory.map((item, index) => (
                <ListItem key={index} divider>
                  <ListItemIcon>
                    <RefreshIcon color="info" />
                  </ListItemIcon>
                  <ListItemText
                    primary={item.title}
                    secondary={
                      <>
                        <Typography variant="caption" display="block">
                          {new Date(item.created_at).toLocaleString()}
                        </Typography>
                        <Typography variant="body2">{item.message}</Typography>
                      </>
                    }
                  />
                </ListItem>
              ))}
            </List>
          ) : (
            <Typography color="textSecondary" align="center" sx={{ py: 4 }}>
              No re-upload history found
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowHistory(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', gap: 3 }}>
          <AdminSidebar />
          
          <Box sx={{ flex: 1, bgcolor: '#f8f9fa', p: 3, borderRadius: '16px' }}>
            {/* Header */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
              <IconButton onClick={() => navigate('/admin/organizations')} sx={{ color: '#15e420' }}>
                <ArrowBackIcon />
              </IconButton>
              <Typography variant="h4" sx={{ fontFamily: '"Poppins", sans-serif', fontWeight: 700 }}>
                Document Review..
              </Typography>
              <Box sx={{ ml: 'auto', display: 'flex', gap: 2 }}>
                <Tooltip title="View Re-upload History">
                  <IconButton onClick={() => setShowHistory(true)} sx={{ color: '#15e420' }}>
                    <Badge badgeContent={reuploadHistory.length} color="info">
                      <HistoryIcon />
                    </Badge>
                  </IconButton>
                </Tooltip>
                <Chip
                  label={organization?.status}
                  color={
                    organization?.status === 'approved' ? 'success' :
                    organization?.status === 'rejected' ? 'error' : 'warning'
                  }
                />
              </Box>
            </Box>

            {/* Organization Info */}
            <Paper sx={{ p: 3, mb: 4, borderRadius: '16px' }}>
              <Typography variant="h6" gutterBottom>
                {organization?.company_name}
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="textSecondary">
                    Email: {organization?.email}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="textSecondary">
                    CAC: {organization?.cac_number || 'N/A'}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="body2" color="textSecondary">
                    Re-upload Count: {organization?.re_upload_count || 0}
                  </Typography>
                </Grid>
                {organization?.last_re_upload_at && (
                  <Grid item xs={12}>
                    <Typography variant="body2" color="textSecondary">
                      Last Re-upload: {new Date(organization.last_re_upload_at).toLocaleString()}
                    </Typography>
                  </Grid>
                )}
              </Grid>
            </Paper>

            {/* Documents Grid */}
            <Grid container spacing={3}>
              {documents.map((doc) => (
                <Grid item xs={12} md={6} key={doc.key}>
                  <Card sx={{ 
                    borderRadius: '12px',
                    border: doc.status === 'rejected' ? '1px solid #ffcdd2' : 'none',
                    bgcolor: doc.status === 'rejected' ? '#fff8f8' : 'white'
                  }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <DescriptionIcon sx={{ color: '#15e420' }} />
                          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                            {doc.name}
                            {!doc.required && (
                              <Chip
                                label="Optional"
                                size="small"
                                sx={{ ml: 1, height: 20, fontSize: '0.65rem' }}
                              />
                            )}
                          </Typography>
                        </Box>
                        {getStatusChip(doc.status)}
                      </Box>

                      {doc.rejectionReason && (
                        <Alert 
                          severity="error" 
                          icon={<WarningIcon />}
                          sx={{ mb: 2 }}
                        >
                          <Typography variant="body2">
                            <strong>Rejection Reason:</strong> {doc.rejectionReason}
                          </Typography>
                        </Alert>
                      )}

                      <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                        <Tooltip title="View Document">
                          <IconButton 
                            size="small" 
                            onClick={() => handleViewDocument(doc)}
                            sx={{ color: '#15e420' }}
                          >
                            <VisibilityIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Download">
                          <IconButton 
                            size="small" 
                            onClick={() => handleDownloadDocument(doc)}
                            sx={{ color: '#15e420' }}
                          >
                            <DownloadIcon />
                          </IconButton>
                        </Tooltip>
                        
                        {doc.status !== 'approved' && (
                          <>
                            <Tooltip title="Approve">
                              <IconButton 
                                size="small"
                                onClick={() => handleApproveDocument(doc)}
                                disabled={processing}
                                sx={{ color: '#28a745' }}
                              >
                                <CheckCircleIcon />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Reject">
                              <IconButton 
                                size="small"
                                onClick={() => setRejectionDialog({ open: true, doc, reason: '' })}
                                disabled={processing}
                                sx={{ color: '#dc3545' }}
                              >
                                <CancelIcon />
                              </IconButton>
                            </Tooltip>
                          </>
                        )}
                      </Box>

                      {/* Show notification history */}
                      {doc.notifications && doc.notifications.length > 0 && (
                        <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid #e0e0e0' }}>
                          <Typography variant="caption" color="textSecondary">
                            History:
                          </Typography>
                          {doc.notifications.slice(0, 2).map((notif, idx) => (
                            <Typography key={idx} variant="caption" display="block" sx={{ fontSize: '0.7rem' }}>
                              • {new Date(notif.created_at).toLocaleDateString()}: {notif.type.replace('_', ' ')}
                            </Typography>
                          ))}
                        </Box>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>
        </Box>
      </Container>
    </>
  );
};

export default AdminDocumentReview;