// components/admin-org-dashboard/AdminOrgSettings.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '../../supabaseClient';
import {
  Box,
  Container,
  Paper,
  Typography,
  CircularProgress,
  Button,
  Switch,
  Alert,
  Snackbar,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField
} from '@mui/material';
import {
  Settings as SettingsIcon,
  Notifications as NotificationsIcon,
  Email as EmailIcon,
  Security as SecurityIcon,
  Delete as DeleteIcon,
  Logout as LogoutIcon,
  ArrowBack as ArrowBackIcon,
  Lock as LockIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import AdminOrgSidebar from './AdminOrgSidebar';

const SettingsContainer = styled(motion.div)({
  padding: '2rem',
  fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif"
});

const AdminOrgSettings = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState({ open: false, type: 'success', message: '' });
  const [organization, setOrganization] = useState(null);
  const [membershipStatus, setMembershipStatus] = useState('pending');
  
  const [settings, setSettings] = useState({
    emailNotifications: true,
    paymentNotifications: true,
    documentNotifications: true,
    twoFactorAuth: false,
    marketingEmails: false
  });

  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const [deleteAccountOpen, setDeleteAccountOpen] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPasswords, setShowPasswords] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const showAlert = useCallback((type, message) => {
    setAlert({ open: true, type, message });
  }, []);

  const fetchSettings = async () => {
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
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
      showAlert('error', 'Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleChange = (setting) => {
    setSettings(prev => ({
      ...prev,
      [setting]: !prev[setting]
    }));
    showAlert('success', 'Setting updated successfully');
  };

  const handleChangePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      showAlert('error', 'New passwords do not match');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      showAlert('error', 'Password must be at least 6 characters');
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: passwordData.newPassword
      });

      if (error) throw error;

      showAlert('success', 'Password changed successfully');
      setChangePasswordOpen(false);
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      console.error('Error changing password:', error);
      showAlert('error', 'Failed to change password');
    }
  };

  const handleDeleteAccount = async () => {
    try {
      if (organization) {
        await supabase
          .from('organizations_registry')
          .update({ status: 'deleted' })
          .eq('id', organization.id);
      }

      await supabase.auth.signOut();
      navigate('/login');
    } catch (error) {
      console.error('Error deleting account:', error);
      showAlert('error', 'Failed to delete account');
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      navigate('/login');
    } catch (error) {
      console.error('Error logging out:', error);
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
          <Container maxWidth="md">
            <SettingsContainer
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Paper sx={{ p: 3, borderRadius: '16px', mb: 3 }}>
                <Box display="flex" alignItems="center" gap={2} mb={3}>
                  <Button
                    startIcon={<ArrowBackIcon />}
                    onClick={() => navigate('/admin-org-dashboard')}
                    sx={{ color: '#15e420' }}
                  >
                    Back
                  </Button>
                  <Typography variant="h5" sx={{ fontWeight: 700 }}>
                    Settings
                  </Typography>
                </Box>

                {/* Notification Settings */}
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                  Notifications
                </Typography>
                <List>
                  <ListItem>
                    <ListItemIcon>
                      <EmailIcon sx={{ color: '#15e420' }} />
                    </ListItemIcon>
                    <ListItemText
                      primary="Email Notifications"
                      secondary="Receive email notifications for important updates"
                    />
                    <ListItemSecondaryAction>
                      <Switch
                        checked={settings.emailNotifications}
                        onChange={() => handleToggleChange('emailNotifications')}
                        sx={{
                          '& .MuiSwitch-switchBase.Mui-checked': {
                            color: '#15e420'
                          },
                          '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                            backgroundColor: '#15e420'
                          }
                        }}
                      />
                    </ListItemSecondaryAction>
                  </ListItem>
                  
                  <ListItem>
                    <ListItemIcon>
                      <NotificationsIcon sx={{ color: '#ff9800' }} />
                    </ListItemIcon>
                    <ListItemText
                      primary="Payment Notifications"
                      secondary="Get notified about payment status changes"
                    />
                    <ListItemSecondaryAction>
                      <Switch
                        checked={settings.paymentNotifications}
                        onChange={() => handleToggleChange('paymentNotifications')}
                        sx={{
                          '& .MuiSwitch-switchBase.Mui-checked': {
                            color: '#15e420'
                          },
                          '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                            backgroundColor: '#15e420'
                          }
                        }}
                      />
                    </ListItemSecondaryAction>
                  </ListItem>
                  
                  <ListItem>
                    <ListItemIcon>
                      <NotificationsIcon sx={{ color: '#2196f3' }} />
                    </ListItemIcon>
                    <ListItemText
                      primary="Document Notifications"
                      secondary="Get notified when documents are reviewed"
                    />
                    <ListItemSecondaryAction>
                      <Switch
                        checked={settings.documentNotifications}
                        onChange={() => handleToggleChange('documentNotifications')}
                        sx={{
                          '& .MuiSwitch-switchBase.Mui-checked': {
                            color: '#15e420'
                          },
                          '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                            backgroundColor: '#15e420'
                          }
                        }}
                      />
                    </ListItemSecondaryAction>
                  </ListItem>
                </List>

                <Divider sx={{ my: 3 }} />

                {/* Security Settings */}
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                  Security
                </Typography>
                <List>
                  <ListItem>
                    <ListItemIcon>
                      <SecurityIcon sx={{ color: '#ff9800' }} />
                    </ListItemIcon>
                    <ListItemText
                      primary="Two-Factor Authentication"
                      secondary="Add an extra layer of security to your account"
                    />
                    <ListItemSecondaryAction>
                      <Switch
                        checked={settings.twoFactorAuth}
                        onChange={() => handleToggleChange('twoFactorAuth')}
                        sx={{
                          '& .MuiSwitch-switchBase.Mui-checked': {
                            color: '#15e420'
                          },
                          '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                            backgroundColor: '#15e420'
                          }
                        }}
                      />
                    </ListItemSecondaryAction>
                  </ListItem>
                  
                  <ListItem button onClick={() => setChangePasswordOpen(true)}>
                    <ListItemIcon>
                      <LockIcon sx={{ color: '#15e420' }} />
                    </ListItemIcon>
                    <ListItemText
                      primary="Change Password"
                      secondary="Update your account password"
                    />
                  </ListItem>
                </List>

                <Divider sx={{ my: 3 }} />

                {/* Account Actions */}
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                  Account
                </Typography>
                <List>
                  <ListItem button onClick={handleLogout}>
                    <ListItemIcon>
                      <LogoutIcon sx={{ color: '#ff9800' }} />
                    </ListItemIcon>
                    <ListItemText
                      primary="Logout"
                      secondary="Sign out of your account"
                    />
                  </ListItem>
                  
                  <ListItem button onClick={() => setDeleteAccountOpen(true)}>
                    <ListItemIcon>
                      <DeleteIcon sx={{ color: '#dc3545' }} />
                    </ListItemIcon>
                    <ListItemText
                      primary="Delete Account"
                      secondary="Permanently delete your organization account"
                      primaryTypographyProps={{ color: '#dc3545' }}
                    />
                  </ListItem>
                </List>
              </Paper>
            </SettingsContainer>
          </Container>
        </Box>
      </Box>

      {/* Change Password Dialog */}
      <Dialog open={changePasswordOpen} onClose={() => setChangePasswordOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Change Password</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <TextField
              fullWidth
              type={showPasswords ? 'text' : 'password'}
              label="Current Password"
              value={passwordData.currentPassword}
              onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              type={showPasswords ? 'text' : 'password'}
              label="New Password"
              value={passwordData.newPassword}
              onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              type={showPasswords ? 'text' : 'password'}
              label="Confirm New Password"
              value={passwordData.confirmPassword}
              onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
              sx={{ mb: 2 }}
            />
            <Button
              startIcon={showPasswords ? <VisibilityOffIcon /> : <VisibilityIcon />}
              onClick={() => setShowPasswords(!showPasswords)}
              size="small"
            >
              {showPasswords ? 'Hide' : 'Show'} Passwords
            </Button>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setChangePasswordOpen(false)}>Cancel</Button>
          <Button
            onClick={handleChangePassword}
            variant="contained"
            sx={{ bgcolor: '#15e420', '&:hover': { bgcolor: '#12c21e' } }}
          >
            Change Password
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Account Dialog */}
      <Dialog open={deleteAccountOpen} onClose={() => setDeleteAccountOpen(false)}>
        <DialogTitle>Delete Account</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            This action cannot be undone. All your organization data will be permanently deleted.
          </Alert>
          <Typography>
            Are you sure you want to delete your organization account? This will remove all:
          </Typography>
          <ul>
            <li>Organization information</li>
            <li>Uploaded documents</li>
            <li>Payment history</li>
            <li>Notification history</li>
          </ul>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteAccountOpen(false)}>Cancel</Button>
          <Button
            onClick={handleDeleteAccount}
            variant="contained"
            color="error"
          >
            Delete Account
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default AdminOrgSettings;