// components/admin-org-dashboard/AdminOrgProfile.jsx
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
  Chip
} from '@mui/material';
import {
  Person as PersonIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Save as SaveIcon,
  Edit as EditIcon,
  Verified as VerifiedIcon,
  ArrowBack as ArrowBackIcon
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import AdminOrgSidebar from './AdminOrgSidebar';

const ProfileContainer = styled(motion.div)({
  padding: '2rem',
  fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif"
});

const ProfileHeader = styled(Box)({
  background: 'linear-gradient(135deg, #15e420 0%, #0fa819 100%)',
  borderRadius: '20px',
  padding: '2rem',
  color: 'white',
  marginBottom: '2rem'
});

const AdminOrgProfile = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [alert, setAlert] = useState({ open: false, type: 'success', message: '' });
  const [organization, setOrganization] = useState(null);
  const [membershipStatus, setMembershipStatus] = useState('pending');
  
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    position: '',
    department: ''
  });

  const [editMode, setEditMode] = useState(false);

  useEffect(() => {
    fetchProfileData();
  }, []);

  const showAlert = useCallback((type, message) => {
    setAlert({ open: true, type, message });
  }, []);

  const fetchProfileData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/login');
        return;
      }

      // Fetch organization data
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
        
        // Set form data from user profile
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        setFormData({
          full_name: profileData?.full_name || orgData.contact_person || '',
          email: user.email || '',
          phone: profileData?.phone || orgData.phone_number1 || '',
          position: profileData?.position || '',
          department: profileData?.department || ''
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      showAlert('error', 'Failed to load profile data');
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
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          full_name: formData.full_name,
          phone: formData.phone,
          position: formData.position,
          department: formData.department,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;
      
      showAlert('success', 'Profile updated successfully');
      setEditMode(false);
    } catch (error) {
      console.error('Error saving profile:', error);
      showAlert('error', 'Failed to update profile');
    } finally {
      setSaving(false);
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
              <ProfileHeader>
                <Box display="flex" alignItems="center" gap={2} mb={2}>
                  <Button
                    startIcon={<ArrowBackIcon />}
                    onClick={() => navigate('/admin-org-dashboard')}
                    sx={{ color: 'white' }}
                  >
                    Back to Dashboard
                  </Button>
                </Box>
                <Box display="flex" alignItems="center" gap={3}>
                  <Avatar
                    sx={{
                      width: 100,
                      height: 100,
                      bgcolor: 'rgba(255,255,255,0.2)',
                      border: '4px solid rgba(255,255,255,0.3)'
                    }}
                  >
                    <PersonIcon sx={{ fontSize: 50 }} />
                  </Avatar>
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 700 }}>
                      {formData.full_name || 'Your Profile'}
                    </Typography>
                    <Typography variant="body1" sx={{ opacity: 0.9 }}>
                      {organization?.company_name}
                    </Typography>
                    <Chip
                      label={membershipStatus === 'approved' ? 'Active Member' : membershipStatus}
                      sx={{
                        mt: 1,
                        bgcolor: 'rgba(255,255,255,0.2)',
                        color: 'white'
                      }}
                      icon={<VerifiedIcon />}
                    />
                  </Box>
                </Box>
              </ProfileHeader>

              <Paper sx={{ p: 4, borderRadius: '16px' }}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Personal Information
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
                      label="Full Name"
                      name="full_name"
                      value={formData.full_name}
                      onChange={handleInputChange}
                      disabled={!editMode}
                      InputProps={{
                        startAdornment: <PersonIcon sx={{ mr: 1, color: '#666' }} />
                      }}
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
                      label="Phone Number"
                      name="phone"
                      value={formData.phone}
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
                      label="Position"
                      name="position"
                      value={formData.position}
                      onChange={handleInputChange}
                      disabled={!editMode}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                      fullWidth
                      label="Department"
                      name="department"
                      value={formData.department}
                      onChange={handleInputChange}
                      disabled={!editMode}
                    />
                  </Grid>
                </Grid>

                <Divider sx={{ my: 4 }} />

                <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                  Account Information
                </Typography>

                <Grid container spacing={3}>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Card sx={{ p: 2, bgcolor: '#f8f9fa' }}>
                      <Typography variant="caption" color="textSecondary">
                        Member Since
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 500 }}>
                        {organization?.created_at 
                          ? new Date(organization.created_at).toLocaleDateString('en-NG', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })
                          : 'N/A'}
                      </Typography>
                    </Card>
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Card sx={{ p: 2, bgcolor: '#f8f9fa' }}>
                      <Typography variant="caption" color="textSecondary">
                        Organization Status
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 500, textTransform: 'capitalize' }}>
                        {membershipStatus}
                      </Typography>
                    </Card>
                  </Grid>
                </Grid>
              </Paper>
            </ProfileContainer>
          </Container>
        </Box>
      </Box>
    </>
  );
};

export default AdminOrgProfile;