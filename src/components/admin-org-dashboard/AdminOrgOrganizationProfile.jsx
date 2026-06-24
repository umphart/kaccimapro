// components/admin-org-dashboard/AdminOrgOrganizationProfile.jsx
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
  TextField,
  Button,
  Avatar,
  Divider,
  Alert,
  Snackbar,
  Card,
  CardContent,
  Chip,
  LinearProgress,
  List,
  ListItem,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import {
  Business as BusinessIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  LocationOn as LocationIcon,
  Language as LanguageIcon,
  Category as CategoryIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Verified as VerifiedIcon,
  Pending as PendingIcon,
  Error as ErrorIcon,
  ArrowBack as ArrowBackIcon,
  CalendarToday as CalendarIcon,
  Description as DescriptionIcon,
  Payment as PaymentIcon
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import AdminOrgSidebar from './AdminOrgSidebar';

const ProfileContainer = styled(motion.div)({
  padding: '2rem',
  fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif"
});

const OrgHeader = styled(Box)({
  background: 'linear-gradient(135deg, #15e420 0%, #0fa819 100%)',
  borderRadius: '20px',
  padding: '2rem',
  color: 'white',
  marginBottom: '2rem',
  position: 'relative',
  overflow: 'hidden',
  '&::after': {
    content: '""',
    position: 'absolute',
    top: '-50%',
    right: '-10%',
    width: '300px',
    height: '300px',
    borderRadius: '50%',
    background: 'rgba(255, 255, 255, 0.05)'
  }
});

const StatusBadge = styled(Chip)(({ status }) => ({
  backgroundColor: status === 'approved' || status === 'active' ? '#d4edda' :
                  status === 'pending' ? '#fff3e0' :
                  status === 'rejected' ? '#ffebee' : '#f0f0f0',
  color: status === 'approved' || status === 'active' ? '#28a745' :
         status === 'pending' ? '#ff9800' :
         status === 'rejected' ? '#dc3545' : '#666',
  fontWeight: 600
}));

const AdminOrgOrganizationProfile = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [alert, setAlert] = useState({ open: false, type: 'success', message: '' });
  const [organization, setOrganization] = useState(null);
  const [membershipStatus, setMembershipStatus] = useState('pending');
  const [editMode, setEditMode] = useState(false);
  
  const [formData, setFormData] = useState({
    company_name: '',
    registration_number: '',
    cac_number: '',
    email: '',
    phone_number1: '',
    phone_number2: '',
    address: '',
    website: '',
    business_type: '',
    description: ''
  });

  useEffect(() => {
    fetchOrganizationProfile();
  }, []);

  const showAlert = useCallback((type, message) => {
    setAlert({ open: true, type, message });
  }, []);

  const fetchOrganizationProfile = async () => {
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
        
        setFormData({
          company_name: orgData.company_name || '',
          registration_number: orgData.registration_number || '',
          cac_number: orgData.cac_number || '',
          email: orgData.email || '',
          phone_number1: orgData.phone_number1 || '',
          phone_number2: orgData.phone_number2 || '',
          address: orgData.address || '',
          website: orgData.website || '',
          business_type: orgData.business_type || '',
          description: orgData.description || ''
        });
      }
    } catch (error) {
      console.error('Error fetching organization:', error);
      showAlert('error', 'Failed to load organization profile');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('organizations_registry')
        .update({
          company_name: formData.company_name,
          phone_number1: formData.phone_number1,
          phone_number2: formData.phone_number2,
          address: formData.address,
          website: formData.website,
          business_type: formData.business_type,
          description: formData.description,
          updated_at: new Date().toISOString()
        })
        .eq('id', organization.id);

      if (error) throw error;
      
      showAlert('success', 'Organization profile updated successfully');
      setEditMode(false);
      fetchOrganizationProfile();
    } catch (error) {
      console.error('Error saving profile:', error);
      showAlert('error', 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case 'approved':
      case 'active':
        return <VerifiedIcon />;
      case 'pending':
        return <PendingIcon />;
      case 'rejected':
        return <ErrorIcon />;
      default:
        return <PendingIcon />;
    }
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
            <ProfileContainer
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <OrgHeader>
                <Button
                  startIcon={<ArrowBackIcon />}
                  onClick={() => navigate('/admin-org-dashboard')}
                  sx={{ color: 'white', mb: 2 }}
                >
                  Back to Dashboard
                </Button>
                <Box display="flex" alignItems="center" gap={3}>
                  <Avatar
                    sx={{
                      width: 100,
                      height: 100,
                      bgcolor: 'rgba(255,255,255,0.2)',
                      border: '4px solid rgba(255,255,255,0.3)'
                    }}
                  >
                    <BusinessIcon sx={{ fontSize: 50 }} />
                  </Avatar>
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 700 }}>
                      {organization?.company_name}
                    </Typography>
                    <Typography variant="body1" sx={{ opacity: 0.9 }}>
                      Registration: {organization?.registration_number}
                    </Typography>
                    <StatusBadge
                      status={membershipStatus}
                      icon={getStatusIcon(membershipStatus)}
                      label={
                        membershipStatus === 'approved' ? 'Active Member' :
                        membershipStatus === 'pending' ? 'Pending Approval' :
                        membershipStatus === 'rejected' ? 'Rejected' : 'Inactive'
                      }
                      sx={{ mt: 1 }}
                    />
                  </Box>
                </Box>
              </OrgHeader>

              <Grid container spacing={3}>
                <Grid size={{ xs: 12, md: 8 }}>
                  <Paper sx={{ p: 4, borderRadius: '16px' }}>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        Organization Information
                      </Typography>
                      <Button
                        startIcon={editMode ? <SaveIcon /> : <EditIcon />}
                        onClick={editMode ? handleSave : () => setEditMode(true)}
                        variant={editMode ? 'contained' : 'outlined'}
                        disabled={saving}
                        sx={{
                          bgcolor: editMode ? '#15e420' : 'transparent',
                          color: editMode ? 'white' : '#15e420',
                          borderColor: '#15e420',
                          '&:hover': {
                            bgcolor: editMode ? '#12c21e' : 'rgba(21,228,32,0.05)'
                          }
                        }}
                      >
                        {saving ? 'Saving...' : editMode ? 'Save Changes' : 'Edit Profile'}
                      </Button>
                    </Box>

                    <Grid container spacing={3}>
                      <Grid size={{ xs: 12, md: 6 }}>
                        <TextField
                          fullWidth
                          label="Company Name"
                          name="company_name"
                          value={formData.company_name}
                          onChange={handleInputChange}
                          disabled={!editMode}
                        />
                      </Grid>
                      <Grid size={{ xs: 12, md: 6 }}>
                        <TextField
                          fullWidth
                          label="Registration Number"
                          name="registration_number"
                          value={formData.registration_number}
                          disabled
                        />
                      </Grid>
                      <Grid size={{ xs: 12, md: 6 }}>
                        <TextField
                          fullWidth
                          label="CAC Number"
                          name="cac_number"
                          value={formData.cac_number}
                          disabled
                        />
                      </Grid>
                      <Grid size={{ xs: 12, md: 6 }}>
                        <TextField
                          fullWidth
                          label="Email"
                          name="email"
                          value={formData.email}
                          disabled
                          InputProps={{
                            startAdornment: <EmailIcon sx={{ mr: 1, color: '#666' }} />
                          }}
                        />
                      </Grid>
                      <Grid size={{ xs: 12, md: 6 }}>
                        <TextField
                          fullWidth
                          label="Phone Number 1"
                          name="phone_number1"
                          value={formData.phone_number1}
                          onChange={handleInputChange}
                          disabled={!editMode}
                          InputProps={{
                            startAdornment: <PhoneIcon sx={{ mr: 1, color: '#666' }} />
                          }}
                        />
                      </Grid>
                      <Grid size={{ xs: 12, md: 6 }}>
                        <TextField
                          fullWidth
                          label="Phone Number 2"
                          name="phone_number2"
                          value={formData.phone_number2}
                          onChange={handleInputChange}
                          disabled={!editMode}
                          InputProps={{
                            startAdornment: <PhoneIcon sx={{ mr: 1, color: '#666' }} />
                          }}
                        />
                      </Grid>
                      <Grid size={{ xs: 12 }}>
                        <TextField
                          fullWidth
                          label="Address"
                          name="address"
                          value={formData.address}
                          onChange={handleInputChange}
                          disabled={!editMode}
                          multiline
                          rows={2}
                          InputProps={{
                            startAdornment: <LocationIcon sx={{ mr: 1, color: '#666' }} />
                          }}
                        />
                      </Grid>
                      <Grid size={{ xs: 12, md: 6 }}>
                        <TextField
                          fullWidth
                          label="Website"
                          name="website"
                          value={formData.website}
                          onChange={handleInputChange}
                          disabled={!editMode}
                          InputProps={{
                            startAdornment: <LanguageIcon sx={{ mr: 1, color: '#666' }} />
                          }}
                        />
                      </Grid>
                      <Grid size={{ xs: 12, md: 6 }}>
                        <TextField
                          fullWidth
                          label="Business Type"
                          name="business_type"
                          value={formData.business_type}
                          onChange={handleInputChange}
                          disabled={!editMode}
                          InputProps={{
                            startAdornment: <CategoryIcon sx={{ mr: 1, color: '#666' }} />
                          }}
                        />
                      </Grid>
                      <Grid size={{ xs: 12 }}>
                        <TextField
                          fullWidth
                          label="Description"
                          name="description"
                          value={formData.description}
                          onChange={handleInputChange}
                          disabled={!editMode}
                          multiline
                          rows={4}
                        />
                      </Grid>
                    </Grid>
                  </Paper>
                </Grid>

                <Grid size={{ xs: 12, md: 4 }}>
                  <Paper sx={{ p: 3, borderRadius: '16px', mb: 3 }}>
                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                      Membership Status
                    </Typography>
                    <Box textAlign="center" py={2}>
                      {getStatusIcon(membershipStatus)}
                      <Typography variant="h5" sx={{ mt: 1, textTransform: 'capitalize', fontWeight: 600 }}>
                        {membershipStatus}
                      </Typography>
                      {membershipStatus === 'pending' && (
                        <>
                          <LinearProgress sx={{ mt: 2, height: 6, borderRadius: 3 }} />
                          <Typography variant="caption" color="textSecondary" sx={{ mt: 1, display: 'block' }}>
                            Under review
                          </Typography>
                        </>
                      )}
                    </Box>
                  </Paper>

                  <Paper sx={{ p: 3, borderRadius: '16px' }}>
                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                      Quick Links
                    </Typography>
                    <List>
                      <ListItem button onClick={() => navigate('/documents')}>
                        <ListItemIcon>
                          <DescriptionIcon sx={{ color: '#15e420' }} />
                        </ListItemIcon>
                        <ListItemText primary="Manage Documents" />
                      </ListItem>
                      <ListItem button onClick={() => navigate('/admin-org-payment')}>
                        <ListItemIcon>
                          <PaymentIcon sx={{ color: '#15e420' }} />
                        </ListItemIcon>
                        <ListItemText primary="Make Payment" />
                      </ListItem>
                      <ListItem button onClick={() => navigate('/notifications')}>
                        <ListItemIcon>
                          <EmailIcon sx={{ color: '#15e420' }} />
                        </ListItemIcon>
                        <ListItemText primary="View Notifications" />
                      </ListItem>
                    </List>
                  </Paper>
                </Grid>
              </Grid>
            </ProfileContainer>
          </Container>
        </Box>
      </Box>
    </>
  );
};

export default AdminOrgOrganizationProfile;