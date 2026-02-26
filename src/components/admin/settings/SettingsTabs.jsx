import React from 'react';
import { Box, Tab, Tabs } from '@mui/material';
import {
  AdminPanelSettings as AdminIcon,
  Business as BusinessIcon,
  Settings as SettingsIcon
} from '@mui/icons-material';

const SettingsTabs = ({ tabValue, onTabChange }) => {
  return (
    <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
      <Tabs 
        value={tabValue} 
        onChange={onTabChange}
        sx={{
          '& .MuiTab-root': {
            fontFamily: '"Inter", sans-serif',
            fontWeight: 600,
            textTransform: 'none',
            fontSize: '16px',
            minWidth: '200px'
          },
          '& .Mui-selected': {
            color: '#15e420 !important'
          },
          '& .MuiTabs-indicator': {
            backgroundColor: '#15e420'
          }
        }}
      >
        <Tab icon={<AdminIcon />} label="Administrators" iconPosition="start" />
        <Tab icon={<BusinessIcon />} label="Organizations" iconPosition="start" />
        <Tab icon={<SettingsIcon />} label="System Settings" iconPosition="start" />
      </Tabs>
    </Box>
  );
};

export default SettingsTabs;