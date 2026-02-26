import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Paper,
  Typography,
  Tabs,
  Tab,
  CircularProgress,
  Snackbar,
  Alert,
  Card
} from '@mui/material';
import {
  AdminPanelSettings as AdminIcon,
  Business as BusinessIcon,
  Settings as SettingsIcon
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import AdminSidebar from './AdminSidebar';
import AdminManagement from './AdminManagement';
import OrganizationManagement from './OrganizationManagement';
import SystemSettings from './SystemSettings';
import { useAlert } from '../hooks/useAlert';

const StyledCard = styled(Card)(({ theme }) => ({
  borderRadius: '16px',
  boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)',
  marginBottom: theme.spacing(3)
}));

const TabPanel = ({ children, value, index, ...other }) => (
  <div
    role="tabpanel"
    hidden={value !== index}
    id={`settings-tabpanel-${index}`}
    aria-labelledby={`settings-tab-${index}`}
    {...other}
  >
    {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
  </div>
);

const AdminSettings = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const { alert, showAlert, handleCloseAlert } = useAlert();
  const [tabValue, setTabValue] = useState(0);

  useEffect(() => {
    // Initial loading
    setTimeout(() => setLoading(false), 1000);
  }, []);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
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
                Settings
              </Typography>
              <Typography 
                variant="body1" 
                sx={{ 
                  fontFamily: '"Inter", sans-serif',
                  color: '#666'
                }}
              >
                Manage system settings, administrators, and organizations
              </Typography>
            </Box>

            {/* Tabs */}
            <Paper sx={{ borderRadius: '16px', overflow: 'hidden' }}>
              <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <Tabs 
                  value={tabValue} 
                  onChange={handleTabChange}
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

              {/* Admin Management Tab */}
              <TabPanel value={tabValue} index={0}>
                <AdminManagement showAlert={showAlert} />
              </TabPanel>

              {/* Organizations Management Tab */}
              <TabPanel value={tabValue} index={1}>
                <OrganizationManagement showAlert={showAlert} navigate={navigate} />
              </TabPanel>

              {/* System Settings Tab */}
              <TabPanel value={tabValue} index={2}>
                <SystemSettings showAlert={showAlert} />
              </TabPanel>
            </Paper>
          </Box>
        </Box>
      </Container>
    </>
  );
};

export default AdminSettings;