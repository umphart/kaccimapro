import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
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
  ListItemIcon
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Description as DescriptionIcon,
  Payment as PaymentIcon,
  Business as BusinessIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  LocationOn as LocationIcon,
  Verified as VerifiedIcon,
  Pending as PendingIcon
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import AdminSidebar from './AdminSidebar';

const StyledCard = styled(Card)(({ theme }) => ({
  borderRadius: '16px',
  boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)',
  height: '100%'
}));

const AdminOrganizationDetail = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [organization, setOrganization] = useState(null);
  const [payments, setPayments] = useState([]);
  const [alert, setAlert] = useState({ open: false, type: 'success', message: '' });

  useEffect(() => {
    fetchOrganizationDetails();
  }, [id]);

  const showAlert = (type, message) => {
    setAlert({ open: true, type, message });
  };

  const handleCloseAlert = () => {
    setAlert({ ...alert, open: false });
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

      const { data: paymentData, error: paymentError } = await supabase
        .from('payments')
        .select('*')
        .eq('organization_id', id)
        .order('created_at', { ascending: false });

      if (paymentError) throw paymentError;

      setOrganization(orgData);
      setPayments(paymentData || []);
    } catch (error) {
      console.error('Error fetching organization:', error);
      showAlert('error', 'Failed to load organization details');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    try {
      const { error } = await supabase
        .from('organizations')
        .update({ status: 'approved' })
        .eq('id', id);

      if (error) throw error;

      showAlert('success', 'Organization approved successfully');
      fetchOrganizationDetails();
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
        .eq('id', id);

      if (error) throw error;

      showAlert('success', 'Organization rejected');
      fetchOrganizationDetails();
    } catch (error) {
      console.error('Error rejecting organization:', error);
      showAlert('error', 'Failed to reject organization');
    }
  };

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

  if (!organization) {
    return (
      <Container>
        <Typography>Organization not found</Typography>
      </Container>
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
          
          <Box sx={{ flex: 1 }}>
            {/* Header */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
              <IconButton onClick={() => navigate('/admin/organizations')} sx={{ color: '#15e420' }}>
                <ArrowBackIcon />
              </IconButton>
              <Typography 
                variant="h4" 
                sx={{ 
                  fontFamily: '"Poppins", sans-serif',
                  fontWeight: 700,
                  color: '#333'
                }}
              >
                Organization Details
              </Typography>
              <Box sx={{ ml: 'auto' }}>
                {getStatusChip(organization.status)}
              </Box>
            </Box>

            <Grid container spacing={3}>
              {/* Basic Information */}
              <Grid item xs={12} md={6}>
                <StyledCard>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                      <Avatar sx={{ bgcolor: '#15e420', width: 56, height: 56 }}>
                        <BusinessIcon />
                      </Avatar>
                      <Box>
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                          {organization.company_name}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          {organization.cac_number || 'No CAC Number'}
                        </Typography>
                      </Box>
                    </Box>

                    <Divider sx={{ mb: 3 }} />

                    <List>
                      <ListItem>
                        <ListItemIcon>
                          <EmailIcon sx={{ color: '#15e420' }} />
                        </ListItemIcon>
                        <ListItemText 
                          primary="Email"
                          secondary={organization.email}
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon>
                          <PhoneIcon sx={{ color: '#15e420' }} />
                        </ListItemIcon>
                        <ListItemText 
                          primary="Phone"
                          secondary={organization.phone_number || 'N/A'}
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon>
                          <LocationIcon sx={{ color: '#15e420' }} />
                        </ListItemIcon>
                        <ListItemText 
                          primary="Address"
                          secondary={organization.office_address || 'N/A'}
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon>
                          <BusinessIcon sx={{ color: '#15e420' }} />
                        </ListItemIcon>
                        <ListItemText 
                          primary="Nature of Business"
                          secondary={organization.business_nature || 'N/A'}
                        />
                      </ListItem>
                    </List>
                  </CardContent>
                </StyledCard>
              </Grid>

              {/* Payment Information */}
              <Grid item xs={12} md={6}>
                <StyledCard>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                      <Avatar sx={{ bgcolor: '#15e420', width: 56, height: 56 }}>
                        <PaymentIcon />
                      </Avatar>
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        Payment History
                      </Typography>
                    </Box>

                    <Divider sx={{ mb: 3 }} />

                    {payments.length > 0 ? (
                      payments.map((payment, index) => (
                        <Paper key={index} sx={{ p: 2, mb: 2, bgcolor: '#f8f9fa' }}>
                          <Grid container spacing={2}>
                            <Grid item xs={6}>
                              <Typography variant="caption" color="textSecondary">
                                Amount
                              </Typography>
                              <Typography variant="body1" sx={{ fontWeight: 600 }}>
                                ₦{payment.amount?.toLocaleString()}
                              </Typography>
                            </Grid>
                            <Grid item xs={6}>
                              <Typography variant="caption" color="textSecondary">
                                Status
                              </Typography>
                              <Box>
                                <Chip
                                  label={payment.status}
                                  size="small"
                                  color={payment.status === 'approved' ? 'success' : 'warning'}
                                />
                              </Box>
                            </Grid>
                            <Grid item xs={6}>
                              <Typography variant="caption" color="textSecondary">
                                Type
                              </Typography>
                              <Typography variant="body2">
                                {payment.payment_type === 'first' ? 'First Payment' : 'Renewal'}
                              </Typography>
                            </Grid>
                            <Grid item xs={6}>
                              <Typography variant="caption" color="textSecondary">
                                Date
                              </Typography>
                              <Typography variant="body2">
                                {new Date(payment.created_at).toLocaleDateString()}
                              </Typography>
                            </Grid>
                          </Grid>
                        </Paper>
                      ))
                    ) : (
                      <Typography color="textSecondary">No payments found</Typography>
                    )}
                  </CardContent>
                </StyledCard>
              </Grid>

              {/* Documents */}
              <Grid item xs={12}>
                <StyledCard>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                      <Avatar sx={{ bgcolor: '#15e420', width: 56, height: 56 }}>
                        <DescriptionIcon />
                      </Avatar>
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        Uploaded Documents
                      </Typography>
                    </Box>

                    <Divider sx={{ mb: 3 }} />

                    <Grid container spacing={2}>
                      {organization.cover_letter_path && (
                        <Grid item xs={12} sm={6} md={3}>
                          <Paper sx={{ p: 2, textAlign: 'center', bgcolor: '#f8f9fa' }}>
                            <DescriptionIcon sx={{ fontSize: 40, color: '#15e420', mb: 1 }} />
                            <Typography variant="body2">Cover Letter</Typography>
                          </Paper>
                        </Grid>
                      )}
                      {organization.memorandum_path && (
                        <Grid item xs={12} sm={6} md={3}>
                          <Paper sx={{ p: 2, textAlign: 'center', bgcolor: '#f8f9fa' }}>
                            <DescriptionIcon sx={{ fontSize: 40, color: '#15e420', mb: 1 }} />
                            <Typography variant="body2">Memorandum</Typography>
                          </Paper>
                        </Grid>
                      )}
                      {organization.registration_cert_path && (
                        <Grid item xs={12} sm={6} md={3}>
                          <Paper sx={{ p: 2, textAlign: 'center', bgcolor: '#f8f9fa' }}>
                            <DescriptionIcon sx={{ fontSize: 40, color: '#15e420', mb: 1 }} />
                            <Typography variant="body2">Registration Cert</Typography>
                          </Paper>
                        </Grid>
                      )}
                      {organization.incorporation_cert_path && (
                        <Grid item xs={12} sm={6} md={3}>
                          <Paper sx={{ p: 2, textAlign: 'center', bgcolor: '#f8f9fa' }}>
                            <DescriptionIcon sx={{ fontSize: 40, color: '#15e420', mb: 1 }} />
                            <Typography variant="body2">Incorporation Cert</Typography>
                          </Paper>
                        </Grid>
                      )}
                      {organization.premises_cert_path && (
                        <Grid item xs={12} sm={6} md={3}>
                          <Paper sx={{ p: 2, textAlign: 'center', bgcolor: '#f8f9fa' }}>
                            <DescriptionIcon sx={{ fontSize: 40, color: '#15e420', mb: 1 }} />
                            <Typography variant="body2">Premises Cert</Typography>
                          </Paper>
                        </Grid>
                      )}
                      {organization.form_c07_path && (
                        <Grid item xs={12} sm={6} md={3}>
                          <Paper sx={{ p: 2, textAlign: 'center', bgcolor: '#f8f9fa' }}>
                            <DescriptionIcon sx={{ fontSize: 40, color: '#15e420', mb: 1 }} />
                            <Typography variant="body2">Form C07</Typography>
                          </Paper>
                        </Grid>
                      )}
                      {organization.id_document_path && (
                        <Grid item xs={12} sm={6} md={3}>
                          <Paper sx={{ p: 2, textAlign: 'center', bgcolor: '#f8f9fa' }}>
                            <DescriptionIcon sx={{ fontSize: 40, color: '#15e420', mb: 1 }} />
                            <Typography variant="body2">ID Document</Typography>
                          </Paper>
                        </Grid>
                      )}
                    </Grid>
                  </CardContent>
                </StyledCard>
              </Grid>

              {/* Actions */}
              {organization.status === 'pending' && (
                <Grid item xs={12}>
                  <Paper sx={{ p: 3, borderRadius: '16px' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                      <Button
                        variant="outlined"
                        color="error"
                        startIcon={<CancelIcon />}
                        onClick={handleReject}
                      >
                        Reject Application
                      </Button>
                      <Button
                        variant="contained"
                        startIcon={<CheckCircleIcon />}
                        onClick={handleApprove}
                        sx={{ bgcolor: '#15e420', '&:hover': { bgcolor: '#12c21e' } }}
                      >
                        Approve Organization
                      </Button>
                    </Box>
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

export default AdminOrganizationDetail;