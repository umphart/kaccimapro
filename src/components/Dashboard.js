import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { Box, CircularProgress, Button, Paper, Typography } from '@mui/material';
import Layout from './Layout';
import DashboardAlerts from './dashboard/DashboardAlerts';
import DashboardContent from './dashboard/DashboardContent';
import DownloadDialog from './dashboard/DownloadDialog';
import { useUserData } from './hooks/useUserData';
import './Dashboard.css';

const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const { organization, payment, loading, registrationStatus, countdown, refreshData } = useUserData(user);
  const [alert, setAlert] = useState(null);
  const [certificateDownloaded, setCertificateDownloaded] = useState(false);
  const [receiptDownloaded, setReceiptDownloaded] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState(''); // 'certificate' or 'receipt'
  const [noOrganization, setNoOrganization] = useState(false);

  useEffect(() => {
    checkUser();
  }, []);

  useEffect(() => {
    if (user) {
      // Check download status for this specific user
      const certStatus = localStorage.getItem(`certificateDownloaded_${user.id}`);
      const receiptStatus = localStorage.getItem(`receiptDownloaded_${user.id}`);
      if (certStatus === 'true') {
        setCertificateDownloaded(true);
      }
      if (receiptStatus === 'true') {
        setReceiptDownloaded(true);
      }
    }
  }, [user]);

  const checkUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/login');
      } else {
        setUser(user);
        // Check if user has an organization
        await checkOrganization(user);
      }
    } catch (error) {
      console.error('Error checking user:', error);
      navigate('/login');
    }
  };

  const checkOrganization = async (user) => {
    try {
      // Check for admin-created organization
      let hasOrg = false;

      // Check by created_by
      const { data: adminOrg } = await supabase
        .from('organizations_registry')
        .select('id')
        .eq('created_by', user.id)
        .maybeSingle();

      if (adminOrg) {
        hasOrg = true;
      }

      // Check by email if not found
      if (!hasOrg && user.email) {
        const { data: emailOrg } = await supabase
          .from('organizations_registry')
          .select('id')
          .eq('email', user.email)
          .maybeSingle();
        if (emailOrg) {
          hasOrg = true;
        }
      }

      // Check by organization_id in metadata
      if (!hasOrg && user.user_metadata?.organization_id) {
        const { data: metaOrg } = await supabase
          .from('organizations_registry')
          .select('id')
          .eq('id', user.user_metadata.organization_id)
          .maybeSingle();
        if (metaOrg) {
          hasOrg = true;
        }
      }

      // Check for self-created organization
      if (!hasOrg) {
        const { data: selfOrg } = await supabase
          .from('organizations')
          .select('id')
          .eq('user_id', user.id)
          .maybeSingle();
        if (selfOrg) {
          hasOrg = true;
        }
      }

      // If no organization found, show notification instead of redirecting
      if (!hasOrg) {
        setNoOrganization(true);
      }
    } catch (error) {
      console.error('Error checking organization:', error);
      setNoOrganization(true);
    }
  };

  const showAlert = (type, message) => {
    setAlert({ type, message });
    setTimeout(() => setAlert(null), 5000);
  };

  const markAsDownloaded = (type) => {
    if (type === 'certificate' && user) {
      localStorage.setItem(`certificateDownloaded_${user.id}`, 'true');
      setCertificateDownloaded(true);
    } else if (type === 'receipt' && user) {
      localStorage.setItem(`receiptDownloaded_${user.id}`, 'true');
      setReceiptDownloaded(true);
    }
  };

  const handleDownloadClick = (type) => {
    setDialogType(type);
    
    if (type === 'certificate' && certificateDownloaded) {
      setConfirmDialogOpen(true);
      return;
    }
    
    if (type === 'receipt' && receiptDownloaded) {
      setConfirmDialogOpen(true);
      return;
    }
    
    // Dispatch custom event to trigger download
    if (type === 'certificate') {
      const event = new CustomEvent('downloadCertificate');
      document.dispatchEvent(event);
    } else if (type === 'receipt') {
      const event = new CustomEvent('downloadReceipt');
      document.dispatchEvent(event);
    }
  };

  const handleConfirmDownload = () => {
    setConfirmDialogOpen(false);
    showAlert('info', `${dialogType === 'certificate' ? 'Certificate' : 'Receipt'} can only be downloaded once. Please contact admin if you need a replacement.`);
  };

  const handleSuccessfulDownload = (type) => {
    markAsDownloaded(type);
    showAlert('success', `${type === 'certificate' ? 'Certificate' : 'Receipt'} downloaded successfully`);
  };

  // Show loading state
  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress style={{ color: '#15e420' }} />
      </Box>
    );
  }

  // Show "No Organization" notification
  if (noOrganization) {
    return (
      <Layout>
        <Box 
          display="flex" 
          justifyContent="center" 
          alignItems="center" 
          minHeight="400px"
          sx={{ padding: 3 }}
        >
          <Paper 
            elevation={3} 
            sx={{ 
              maxWidth: 600, 
              width: '100%', 
              padding: 4,
              textAlign: 'center',
              borderRadius: 2
            }}
          >
            <Typography variant="h5" gutterBottom sx={{ color: '#15e420', fontWeight: 600 }}>
              Welcome to KACCIMA!
            </Typography>
            
            <Box sx={{ my: 3 }}>
              <Box 
                sx={{ 
                  width: 80, 
                  height: 80, 
                  margin: '0 auto',
                  backgroundColor: '#e8f5e9',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mb: 2
                }}
              >
                <span className="material-icons" style={{ fontSize: 48, color: '#15e420' }}>
                  business
                </span>
              </Box>
            </Box>
            
            <Typography variant="body1" sx={{ mb: 2, color: '#666' }}>
              You haven't registered any organization yet. To become a member of KACCIMA and access all features, please complete the registration process.
            </Typography>
            
            <Typography variant="body2" sx={{ mb: 3, color: '#999' }}>
              Registration is quick and easy. You'll need to provide your company details, upload required documents, and complete the payment process.
            </Typography>
            
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Button
                variant="contained"
                onClick={() => navigate('/organization-registration')}
                sx={{
                  backgroundColor: '#15e420',
                  '&:hover': {
                    backgroundColor: '#0fb815',
                  },
                  padding: '12px 30px',
                  fontSize: '16px',
                  textTransform: 'none',
                  borderRadius: '8px'
                }}
              >
                <span className="material-icons" style={{ marginRight: 8 }}>add_business</span>
                Register Your Organization
              </Button>
              
              <Button
                variant="outlined"
                onClick={() => navigate('/login')}
                sx={{
                  borderColor: '#15e420',
                  color: '#15e420',
                  '&:hover': {
                    borderColor: '#0fb815',
                    backgroundColor: 'rgba(21, 228, 32, 0.05)'
                  },
                  padding: '12px 30px',
                  fontSize: '16px',
                  textTransform: 'none',
                  borderRadius: '8px'
                }}
              >
                Logout
              </Button>
            </Box>
          </Paper>
        </Box>
      </Layout>
    );
  }

  return (
    <>
      <DashboardAlerts alert={alert} />
      
      <Layout>
        <DashboardContent 
          registrationStatus={registrationStatus}
          organization={organization}
          payment={payment}
          countdown={countdown}
          certificateDownloaded={certificateDownloaded}
          receiptDownloaded={receiptDownloaded}
          onDownloadClick={handleDownloadClick}
          onRefresh={refreshData}
          onNavigate={navigate}
          onShowAlert={showAlert}
          onSuccessfulDownload={handleSuccessfulDownload}
        />
      </Layout>

      <DownloadDialog 
        open={confirmDialogOpen}
        type={dialogType}
        onClose={() => setConfirmDialogOpen(false)}
        onConfirm={handleConfirmDownload}
      />
    </>
  );
};

export default Dashboard;