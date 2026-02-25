import React from 'react';
import { Tabs, Tab, Box } from '@mui/material';

const NotificationTabs = ({ tabValue, onTabChange }) => {
  return (
    <Tabs 
      value={tabValue} 
      onChange={onTabChange}
      sx={{
        borderBottom: 1,
        borderColor: 'divider',
        '& .MuiTab-root.Mui-selected': {
          color: '#15e420'
        },
        '& .MuiTabs-indicator': {
          backgroundColor: '#15e420'
        }
      }}
    >
      <Tab label="All" />
      <Tab label="Registration" />
      <Tab label="Payments" />
      <Tab label="Documents" />
      <Tab label="Other" />
    </Tabs>
  );
};

export const TabPanel = ({ children, value, index, ...other }) => (
  <div
    role="tabpanel"
    hidden={value !== index}
    id={`notification-tabpanel-${index}`}
    {...other}
  >
    {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
  </div>
);

export default NotificationTabs;