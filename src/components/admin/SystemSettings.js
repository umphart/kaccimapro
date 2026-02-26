import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  TextField,
  Button,
  FormControlLabel,
  Switch
} from '@mui/material';

const SystemSettings = ({ showAlert }) => {
  const [settings, setSettings] = useState({
    emailNotifications: true,
    autoApprovePayments: false,
    requireDocumentVerification: true,
    renewalReminderDays: 30,
    sessionTimeout: 60,
    twoFactorAuth: false
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = () => {
    const savedSettings = localStorage.getItem('adminSettings');
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings));
    }
  };

  const saveSettings = () => {
    localStorage.setItem('adminSettings', JSON.stringify(settings));
    showAlert('success', 'Settings saved successfully');
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h6" sx={{ fontFamily: '"Poppins", sans-serif', mb: 3 }}>
        System Settings
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12}>
          <FormControlLabel
            control={
              <Switch
                checked={settings.emailNotifications}
                onChange={(e) => setSettings({ ...settings, emailNotifications: e.target.checked })}
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
            label="Enable Email Notifications"
          />
        </Grid>

        <Grid item xs={12}>
          <FormControlLabel
            control={
              <Switch
                checked={settings.autoApprovePayments}
                onChange={(e) => setSettings({ ...settings, autoApprovePayments: e.target.checked })}
              />
            }
            label="Auto-approve Payments (Not Recommended)"
          />
        </Grid>

        <Grid item xs={12}>
          <FormControlLabel
            control={
              <Switch
                checked={settings.requireDocumentVerification}
                onChange={(e) => setSettings({ ...settings, requireDocumentVerification: e.target.checked })}
              />
            }
            label="Require Document Verification"
          />
        </Grid>

        <Grid item xs={12}>
          <FormControlLabel
            control={
              <Switch
                checked={settings.twoFactorAuth}
                onChange={(e) => setSettings({ ...settings, twoFactorAuth: e.target.checked })}
              />
            }
            label="Require Two-Factor Authentication for Admins"
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            type="number"
            label="Renewal Reminder (days before)"
            value={settings.renewalReminderDays}
            onChange={(e) => setSettings({ ...settings, renewalReminderDays: parseInt(e.target.value) })}
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            type="number"
            label="Session Timeout (minutes)"
            value={settings.sessionTimeout}
            onChange={(e) => setSettings({ ...settings, sessionTimeout: parseInt(e.target.value) })}
          />
        </Grid>

        <Grid item xs={12}>
          <Button
            variant="contained"
            onClick={saveSettings}
            sx={{ bgcolor: '#15e420', '&:hover': { bgcolor: '#12c21e' } }}
          >
            Save Settings
          </Button>
        </Grid>
      </Grid>
    </Box>
  );
};

export default SystemSettings;