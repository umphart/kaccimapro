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
  TextField,
  Button,
  Switch,
  FormControlLabel,
  Divider,
  Alert,
  Snackbar,
  CircularProgress,
  Card,
  CardContent,
  Avatar
} from '@mui/material';
import {
  Settings as SettingsIcon,
  Security as SecurityIcon,
  Notifications as NotificationsIcon,
  Palette as PaletteIcon,
  Language as LanguageIcon,
  Save as SaveIcon,
  Lock as LockIcon,
  Email as EmailIcon,
  Phone as PhoneIcon
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';

const StyledCard = styled(Card)(({ theme }) => ({
  borderRadius: '16px',
  boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)',
  overflow: 'hidden'
}));

const Settings = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [alert, setAlert] = useState({ open: false, type: 'success', message: '' });
  const [settings, setSettings] = useState({
    // Profile Settings
    fullName: '',
    email: '',
    phone: '',
    
    // Notification Settings
    emailNotifications: true,
    pushNotifications: false,
    smsNotifications: false,
    
    // Security Settings
    twoFactorAuth: false,
    sessionTimeout: '30',
    
    // Display Settings
    darkMode: false,
    compactView: false,
    
    // Language
    language: 'en'
  });

  useEffect(() => {
    checkUser();
  }, []);

  useEffect(() => {
    if (user) {
      loadUserSettings();
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

  const loadUserSettings = async () => {
    try {
      // Load user profile
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      // Load saved settings from localStorage (or database)
      const savedSettings = localStorage.getItem('userSettings');
      const parsedSettings = savedSettings ? JSON.parse(savedSettings) : {};

      setSettings({
        fullName: profile?.full_name || user.user_metadata?.full_name || '',
        email: user.email || '',
        phone: profile?.phone || '',
        emailNotifications: parsedSettings.emailNotifications ?? true,
        pushNotifications: parsedSettings.pushNotifications ?? false,
        smsNotifications: parsedSettings.smsNotifications ?? false,
        twoFactorAuth: parsedSettings.twoFactorAuth ?? false,
        sessionTimeout: parsedSettings.sessionTimeout ?? '30',
        darkMode: parsedSettings.darkMode ?? false,
        compactView: parsedSettings.compactView ?? false,
        language: parsedSettings.language ?? 'en'
      });
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, checked, type } = e.target;
    setSettings(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Save to localStorage (or database)
      localStorage.setItem('userSettings', JSON.stringify({
        emailNotifications: settings.emailNotifications,
        pushNotifications: settings.pushNotifications,
        smsNotifications: settings.smsNotifications,
        twoFactorAuth: settings.twoFactorAuth,
        sessionTimeout: settings.sessionTimeout,
        darkMode: settings.darkMode,
        compactView: settings.compactView,
        language: settings.language
      }));

      // Update profile in database if needed
      if (settings.fullName || settings.phone) {
        await supabase
          .from('profiles')
          .upsert({
            id: user.id,
            full_name: settings.fullName,
            phone: settings.phone,
            updated_at: new Date()
          });
      }

      showAlert('success', 'Settings saved successfully');
    } catch (error) {
      console.error('Error saving settings:', error);
      showAlert('error', 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress sx={{ color: '#15e420' }} />
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
            <StyledCard>
              <CardContent sx={{ p: 4 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
                  <Avatar sx={{ bgcolor: '#15e420', width: 56, height: 56 }}>
                    <SettingsIcon />
                  </Avatar>
                  <Box>
                    <Typography variant="h5" sx={{ fontWeight: 700, color: '#333' }}>
                      Settings
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#666' }}>
                      Manage your account settings and preferences
                    </Typography>
                  </Box>
                </Box>

                <Grid container spacing={4}>
                  {/* Profile Settings */}
                  <Grid item xs={12}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                      <EmailIcon sx={{ color: '#15e420' }} />
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        Profile Settings
                      </Typography>
                    </Box>
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          label="Full Name"
                          name="fullName"
                          value={settings.fullName}
                          onChange={handleChange}
                          variant="outlined"
                        />
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          label="Email"
                          name="email"
                          value={settings.email}
                          onChange={handleChange}
                          disabled
                          variant="outlined"
                        />
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          label="Phone Number"
                          name="phone"
                          value={settings.phone}
                          onChange={handleChange}
                          variant="outlined"
                        />
                      </Grid>
                    </Grid>
                  </Grid>

                  <Grid item xs={12}>
                    <Divider />
                  </Grid>

                  {/* Notification Settings */}
                  <Grid item xs={12}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                      <NotificationsIcon sx={{ color: '#15e420' }} />
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        Notification Preferences
                      </Typography>
                    </Box>
                    <Grid container spacing={2}>
                      <Grid item xs={12}>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={settings.emailNotifications}
                              onChange={handleChange}
                              name="emailNotifications"
                              sx={{
                                '& .MuiSwitch-switchBase.Mui-checked': {
                                  color: '#15e420',
                                },
                                '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                                  backgroundColor: '#15e420',
                                },
                              }}
                            />
                          }
                          label="Email Notifications"
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={settings.pushNotifications}
                              onChange={handleChange}
                              name="pushNotifications"
                              sx={{
                                '& .MuiSwitch-switchBase.Mui-checked': {
                                  color: '#15e420',
                                },
                                '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                                  backgroundColor: '#15e420',
                                },
                              }}
                            />
                          }
                          label="Push Notifications"
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={settings.smsNotifications}
                              onChange={handleChange}
                              name="smsNotifications"
                              sx={{
                                '& .MuiSwitch-switchBase.Mui-checked': {
                                  color: '#15e420',
                                },
                                '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                                  backgroundColor: '#15e420',
                                },
                              }}
                            />
                          }
                          label="SMS Notifications"
                        />
                      </Grid>
                    </Grid>
                  </Grid>

                  <Grid item xs={12}>
                    <Divider />
                  </Grid>

                  {/* Security Settings */}
                  <Grid item xs={12}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                      <SecurityIcon sx={{ color: '#15e420' }} />
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        Security Settings
                      </Typography>
                    </Box>
                    <Grid container spacing={2}>
                      <Grid item xs={12}>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={settings.twoFactorAuth}
                              onChange={handleChange}
                              name="twoFactorAuth"
                              sx={{
                                '& .MuiSwitch-switchBase.Mui-checked': {
                                  color: '#15e420',
                                },
                                '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                                  backgroundColor: '#15e420',
                                },
                              }}
                            />
                          }
                          label="Two-Factor Authentication"
                        />
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          label="Session Timeout (minutes)"
                          name="sessionTimeout"
                          type="number"
                          value={settings.sessionTimeout}
                          onChange={handleChange}
                          variant="outlined"
                        />
                      </Grid>
                    </Grid>
                  </Grid>

                  <Grid item xs={12}>
                    <Divider />
                  </Grid>

                  {/* Display Settings */}
                  <Grid item xs={12}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                      <PaletteIcon sx={{ color: '#15e420' }} />
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        Display Settings
                      </Typography>
                    </Box>
                    <Grid container spacing={2}>
                      <Grid item xs={12}>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={settings.darkMode}
                              onChange={handleChange}
                              name="darkMode"
                              sx={{
                                '& .MuiSwitch-switchBase.Mui-checked': {
                                  color: '#15e420',
                                },
                                '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                                  backgroundColor: '#15e420',
                                },
                              }}
                            />
                          }
                          label="Dark Mode"
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={settings.compactView}
                              onChange={handleChange}
                              name="compactView"
                              sx={{
                                '& .MuiSwitch-switchBase.Mui-checked': {
                                  color: '#15e420',
                                },
                                '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                                  backgroundColor: '#15e420',
                                },
                              }}
                            />
                          }
                          label="Compact View"
                        />
                      </Grid>
                    </Grid>
                  </Grid>

                  <Grid item xs={12}>
                    <Divider />
                  </Grid>

                  {/* Language Settings */}
                  <Grid item xs={12}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                      <LanguageIcon sx={{ color: '#15e420' }} />
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        Language Settings
                      </Typography>
                    </Box>
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={6}>
                        <TextField
                          select
                          fullWidth
                          label="Language"
                          name="language"
                          value={settings.language}
                          onChange={handleChange}
                          variant="outlined"
                          SelectProps={{
                            native: true
                          }}
                        >
                          <option value="en">English</option>
                          <option value="ha">Hausa</option>
                          <option value="yo">Yoruba</option>
                          <option value="ig">Igbo</option>
                        </TextField>
                      </Grid>
                    </Grid>
                  </Grid>

                  <Grid item xs={12}>
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                      <Button
                        variant="contained"
                        startIcon={<SaveIcon />}
                        onClick={handleSave}
                        disabled={saving}
                        sx={{
                          bgcolor: '#15e420',
                          '&:hover': { bgcolor: '#12c21e' },
                          px: 4,
                          py: 1.5
                        }}
                      >
                        {saving ? 'Saving...' : 'Save Settings'}
                      </Button>
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </StyledCard>
          </Box>
        </Box>
      </Container>
    </>
  );
};

export default Settings;