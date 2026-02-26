import React from 'react';
import {
  Box,
  Typography,
  Grid,
  TextField,
  Switch,
  FormControlLabel,
  Button
} from '@mui/material';

const SystemSettings = ({ settings, onSettingsChange, onSave }) => {
  // CRITICAL FIX: Check if settings is undefined and provide default
  if (!settings) {
    console.warn('Settings is undefined, using default values');
    // Return a loading state or use default values
    settings = {
      emailNotifications: true,
      autoApprovePayments: false,
      requireDocumentVerification: true,
      renewalReminderDays: 30,
      sessionTimeout: 60,
      twoFactorAuth: false
    };
  }

  // Additional safety: ensure all required properties exist
  const safeSettings = {
    emailNotifications: settings.emailNotifications ?? true,
    autoApprovePayments: settings.autoApprovePayments ?? false,
    requireDocumentVerification: settings.requireDocumentVerification ?? true,
    renewalReminderDays: settings.renewalReminderDays ?? 30,
    sessionTimeout: settings.sessionTimeout ?? 60,
    twoFactorAuth: settings.twoFactorAuth ?? false
  };

  const handleChange = (field, value) => {
    if (onSettingsChange) {
      onSettingsChange({ ...safeSettings, [field]: value });
    }
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
                checked={safeSettings.emailNotifications}
                onChange={(e) => handleChange('emailNotifications', e.target.checked)}
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
                checked={safeSettings.autoApprovePayments}
                onChange={(e) => handleChange('autoApprovePayments', e.target.checked)}
              />
            }
            label="Auto-approve Payments (Not Recommended)"
          />
        </Grid>

        <Grid item xs={12}>
          <FormControlLabel
            control={
              <Switch
                checked={safeSettings.requireDocumentVerification}
                onChange={(e) => handleChange('requireDocumentVerification', e.target.checked)}
              />
            }
            label="Require Document Verification"
          />
        </Grid>

        <Grid item xs={12}>
          <FormControlLabel
            control={
              <Switch
                checked={safeSettings.twoFactorAuth}
                onChange={(e) => handleChange('twoFactorAuth', e.target.checked)}
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
            value={safeSettings.renewalReminderDays}
            onChange={(e) => handleChange('renewalReminderDays', parseInt(e.target.value) || 0)}
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            type="number"
            label="Session Timeout (minutes)"
            value={safeSettings.sessionTimeout}
            onChange={(e) => handleChange('sessionTimeout', parseInt(e.target.value) || 0)}
          />
        </Grid>

        <Grid item xs={12}>
          <Button
            variant="contained"
            onClick={onSave}
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