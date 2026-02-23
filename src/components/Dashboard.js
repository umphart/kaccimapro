import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { Box, CircularProgress } from '@mui/material';
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
      }
    } catch (error) {
      console.error('Error checking user:', error);
      navigate('/login');
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

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress style={{ color: '#15e420' }} />
      </Box>
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