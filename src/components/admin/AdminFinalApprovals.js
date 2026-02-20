import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import {
  Box,
  Container,
  Paper,
  Typography,
  Chip,  
  Button,
  Alert,
  Snackbar,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Card,
  CardContent,
  Avatar
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Visibility as VisibilityIcon,
  Verified as VerifiedIcon,
  Business as BusinessIcon,
  Payment as PaymentIcon,
   Pending as PendingIcon,
  
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import AdminSidebar from './AdminSidebar';

const StyledCard = styled(Card)(({ theme }) => ({
  borderRadius: '16px',
  boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)'
}));

const AdminFinalApprovals = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [pendingOrgs, setPendingOrgs] = useState([]);
  const [selectedOrg, setSelectedOrg] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [alert, setAlert] = useState({ open: false, type: 'success', message: '' });

  useEffect(() => {
    fetchPendingOrganizations();
  }, []);

  const showAlert = (type, message) => {
    setAlert({ open: true, type, message });
  };

  const handleCloseAlert = () => {
    setAlert({ ...alert, open: false });
  };

  const fetchPendingOrganizations = async () => {
    setLoading(true);
    try {
      // Get organizations that are pending final approval
      const { data, error } = await supabase
        .from('organizations')
        .select(`
          *,
          payments(*),
          documents:documents(*)
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Filter to only those with approved payments
      const readyForApproval = data?.filter(org => {
        const hasApprovedPayment = org.payments?.some(p => p.status === 'approved');
        return hasApprovedPayment;
      }) || [];

      setPendingOrgs(readyForApproval);
    } catch (error) {
      console.error('Error fetching organizations:', error);
      showAlert('error', 'Failed to load organizations');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (org) => {
    setSelectedOrg(org);
    setModalOpen(true);
  };

  const handleApprove = async () => {
    try {
      const { error } = await supabase
        .from('organizations')
        .update({ 
          status: 'approved',
          approved_at: new Date().toISOString(),
          approved_by: (await supabase.auth.getUser()).data.user?.id
        })
        .eq('id', selectedOrg.id);

      if (error) throw error;

      showAlert('success', 'Organization approved successfully!');
      setModalOpen(false);
      fetchPendingOrganizations();
    } catch (error) {
      console.error('Error approving organization:', error);
      showAlert('error', 'Failed to approve organization');
    }
  };

  const handleReject = async () => {
    try {
      const { error } = await supabase
        .from('organizations')
        .update({ status: 'rejected' })
        .eq('id', selectedOrg.id);

      if (error) throw error;

      showAlert('success', 'Organization rejected');
      setModalOpen(false);
      fetchPendingOrganizations();
    } catch (error) {
      console.error('Error rejecting organization:', error);
      showAlert('error', 'Failed to reject organization');
    }
  };

  const getDocumentStatus = (org) => {
    const docs = [
      org.cover_letter_path,
      org.memorandum_path,
      org.registration_cert_path,
      org.incorporation_cert_path,
      org.premises_cert_path,
      org.form_c07_path,
      org.id_document_path
    ].filter(Boolean);
    
    return `${docs.length} documents uploaded`;
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
                Final Approvals
              </Typography>
              <Typography 
                variant="body1" 
                sx={{ 
                  fontFamily: '"Inter", sans-serif',
                  color: '#666'
                }}
              >
                Review and approve organizations ready for membership
              </Typography>
            </Box>

            {pendingOrgs.length === 0 ? (
              <Paper sx={{ p: 4, textAlign: 'center', borderRadius: '16px' }}>
                <VerifiedIcon sx={{ fontSize: 64, color: '#15e420', mb: 2 }} />
                <Typography variant="h6" sx={{ color: '#666', mb: 1 }}>
                  No Pending Approvals
                </Typography>
                <Typography variant="body2" sx={{ color: '#999' }}>
                  All organizations have been processed
                </Typography>
              </Paper>
            ) : (
              <Grid container spacing={3}>
                {pendingOrgs.map((org) => (
                  <Grid item xs={12} key={org.id}>
                    <StyledCard>
                      <CardContent>
                        <Grid container spacing={2} alignItems="center">
                          <Grid item xs={12} md={3}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                              <Avatar sx={{ bgcolor: '#15e420', width: 48, height: 48 }}>
                                <BusinessIcon />
                              </Avatar>
                              <Box>
                                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                                  {org.company_name}
                                </Typography>
                                <Typography variant="caption" color="textSecondary">
                                  {org.email}
                                </Typography>
                              </Box>
                            </Box>
                          </Grid>
                          <Grid item xs={12} md={2}>
                            <Box>
                              <Typography variant="caption" color="textSecondary">
                                CAC Number
                              </Typography>
                              <Typography variant="body2">
                                {org.cac_number || 'N/A'}
                              </Typography>
                            </Box>
                          </Grid>
                          <Grid item xs={12} md={2}>
                            <Box>
                              <Typography variant="caption" color="textSecondary">
                                Documents
                              </Typography>
                              <Typography variant="body2">
                                {getDocumentStatus(org)}
                              </Typography>
                            </Box>
                          </Grid>
                          <Grid item xs={12} md={2}>
                            <Box>
                              <Typography variant="caption" color="textSecondary">
                                Payment
                              </Typography>
                              <Chip
                                icon={<CheckCircleIcon />}
                                label="Approved"
                                size="small"
                                color="success"
                              />
                            </Box>
                          </Grid>
                          <Grid item xs={12} md={3}>
                            <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                              <Button
                                variant="outlined"
                                startIcon={<VisibilityIcon />}
                                onClick={() => handleViewDetails(org)}
                                sx={{ borderColor: '#15e420', color: '#15e420' }}
                              >
                                Review
                              </Button>
                              <Button
                                variant="contained"
                                startIcon={<CheckCircleIcon />}
                                onClick={() => {
                                  setSelectedOrg(org);
                                  handleApprove();
                                }}
                                sx={{ bgcolor: '#15e420', '&:hover': { bgcolor: '#12c21e' } }}
                              >
                                Approve
                              </Button>
                            </Box>
                          </Grid>
                        </Grid>
                      </CardContent>
                    </StyledCard>
                  </Grid>
                ))}
              </Grid>
            )}
          </Box>
        </Box>
      </Container>

      {/* Organization Details Modal */}
      <Dialog
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ fontFamily: '"Poppins", sans-serif', fontWeight: 600 }}>
          Organization Details - {selectedOrg?.company_name}
        </DialogTitle>
        <DialogContent dividers>
          {selectedOrg && (
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                  Basic Information
                </Typography>
                <Paper sx={{ p: 2, bgcolor: '#f8f9fa' }}>
                  <Typography variant="body2"><strong>Company:</strong> {selectedOrg.company_name}</Typography>
                  <Typography variant="body2"><strong>Email:</strong> {selectedOrg.email}</Typography>
                  <Typography variant="body2"><strong>Phone:</strong> {selectedOrg.phone_number || 'N/A'}</Typography>
                  <Typography variant="body2"><strong>Address:</strong> {selectedOrg.office_address || 'N/A'}</Typography>
                  <Typography variant="body2"><strong>Business Nature:</strong> {selectedOrg.business_nature || 'N/A'}</Typography>
                  <Typography variant="body2"><strong>CAC Number:</strong> {selectedOrg.cac_number || 'N/A'}</Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                  Payment Information
                </Typography>
                <Paper sx={{ p: 2, bgcolor: '#f8f9fa' }}>
                  {selectedOrg.payments?.map((payment, index) => (
                    <Box key={index} sx={{ mb: 1 }}>
                      <Typography variant="body2">
                        <strong>Amount:</strong> ₦{payment.amount?.toLocaleString()}
                      </Typography>
                      <Typography variant="body2">
                        <strong>Date:</strong> {new Date(payment.created_at).toLocaleDateString()}
                      </Typography>
                      <Typography variant="body2">
                        <strong>Status:</strong>{' '}
                        <Chip
                          label={payment.status}
                          size="small"
                          color={payment.status === 'approved' ? 'success' : 'warning'}
                        />
                      </Typography>
                    </Box>
                  ))}
                </Paper>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setModalOpen(false)}>Close</Button>
          <Button
            onClick={handleReject}
            color="error"
            startIcon={<CancelIcon />}
          >
            Reject
          </Button>
          <Button
            onClick={handleApprove}
            variant="contained"
            startIcon={<CheckCircleIcon />}
            sx={{ bgcolor: '#15e420', '&:hover': { bgcolor: '#12c21e' } }}
          >
            Approve Membership
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default AdminFinalApprovals;