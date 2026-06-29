import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { Box, CircularProgress, Button, Paper, Typography } from '@mui/material';
import Layout from './Layout';
import DashboardAlerts from './dashboard/DashboardAlerts';
import DashboardContent from './dashboard/DashboardContent';
import DownloadDialog from './dashboard/DownloadDialog';
import CertificateGenerator from './dashboard/CertificateGenerator';
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
  const [dialogType, setDialogType] = useState('');
  const [noOrganization, setNoOrganization] = useState(false);
  const [generatingCertificate, setGeneratingCertificate] = useState(false);
  const [generatingReceipt, setGeneratingReceipt] = useState(false);
  const [certTrigger, setCertTrigger] = useState(false);

  useEffect(() => {
    checkUser();
  }, []);

  useEffect(() => {
    if (user) {
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
        await checkOrganization(user);
      }
    } catch (error) {
      console.error('Error checking user:', error);
      navigate('/login');
    }
  };

  const checkOrganization = async (user) => {
    try {
      let hasOrg = false;

      const { data: adminOrg } = await supabase
        .from('organizations_registry')
        .select('id')
        .eq('created_by', user.id)
        .maybeSingle();

      if (adminOrg) {
        hasOrg = true;
      }

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
  
  if (type === 'certificate') {
    setGeneratingCertificate(true);
    // Dispatch print certificate event
    const event = new CustomEvent('printCertificate');
    document.dispatchEvent(event);
  } else if (type === 'receipt') {
    setGeneratingReceipt(true);
    setTimeout(() => {
      const event = new CustomEvent('downloadReceipt');
      document.dispatchEvent(event);
    }, 300);
  }
};

  const handleConfirmDownload = () => {
    setConfirmDialogOpen(false);
    showAlert('info', `${dialogType === 'certificate' ? 'Certificate' : 'Receipt'} can only be downloaded once. Please contact admin if you need a replacement.`);
  };

  const handleSuccessfulDownload = (type) => {
    markAsDownloaded(type);
    if (type === 'certificate') {
      setGeneratingCertificate(false);
      showAlert('success', 'Certificate downloaded successfully');
    } else if (type === 'receipt') {
      setGeneratingReceipt(false);
      showAlert('success', 'Receipt downloaded successfully');
    }
  };

  const handleDownloadError = (error) => {
    setGeneratingCertificate(false);
    setGeneratingReceipt(false);
    showAlert('error', error || 'Failed to download document');
  };

  const getPaymentForCertificate = () => {
    if (!payment) {
      const now = new Date();
      return {
        day: now.getDate().toString().padStart(2, '0'),
        month: (now.getMonth() + 1).toString().padStart(2, '0'),
        year: now.getFullYear().toString()
      };
    }
    
    const date = new Date(payment.created_at || payment.payment_date || Date.now());
    return {
      day: date.getDate().toString().padStart(2, '0'),
      month: (date.getMonth() + 1).toString().padStart(2, '0'),
      year: date.getFullYear().toString()
    };
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress style={{ color: '#15e420' }} />
      </Box>
    );
  }

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
      
      {/* Certificate Generator Component */}
      {organization && (
        <CertificateGenerator
          organization={{
            company_name: organization.company_name || 'N/A',
            office_address: `${organization.house_number || ''} ${organization.street || ''} ${organization.lga || ''} ${organization.state || ''}`.trim() || 'N/A',
            business_nature: organization.business_nature || 'N/A',
            cac_number: organization.cac_number || 'N/A',
            registration_number: organization.registration_number || 'N/A'
          }}
          payment={getPaymentForCertificate()}
          onSuccess={() => handleSuccessfulDownload('certificate')}
          onError={handleDownloadError}
          trigger={certTrigger}
        />
      )}
      
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
          generatingCertificate={generatingCertificate}
          generatingReceipt={generatingReceipt}
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