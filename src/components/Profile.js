import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import {
  Box,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Paper,
  Avatar
} from '@mui/material';
import {
  Business as BusinessIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  LocationOn as LocationIcon,
  Badge as BadgeIcon,
  Download as DownloadIcon,
  Edit as EditIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import Layout from './Layout';
import './Profile.css';

// Styled components
const InfoCard = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  borderRadius: '16px',
  boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)',
  marginBottom: theme.spacing(3),
  backgroundColor: 'white'
}));

const Profile = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [organization, setOrganization] = useState(null);
  const [payment, setPayment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState(null);
  const [logoUrl, setLogoUrl] = useState(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [certificateDownloaded, setCertificateDownloaded] = useState(false);

  useEffect(() => {
    checkUser();
  }, []);

  useEffect(() => {
    if (user) {
      fetchOrganizationData();
    }
  }, [user]);

  const showAlert = (type, message) => {
    setAlert({ type, message });
    setTimeout(() => setAlert(null), 5000);
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

  const fetchOrganizationData = async () => {
    try {
      if (!user) return;

      // Fetch organization data
      const { data: orgData, error: orgError } = await supabase
        .from('organizations')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (orgError) throw orgError;

      setOrganization(orgData);

      // Fetch payment data
      if (orgData?.id) {
        const { data: paymentData, error: paymentError } = await supabase
          .from('payments')
          .select('*')
          .eq('organization_id', orgData.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (!paymentError && paymentData) {
          setPayment(paymentData);
          
          // Check if certificate was already downloaded
          const downloaded = localStorage.getItem(`certificate_${orgData.id}_downloaded`);
          if (downloaded) {
            setCertificateDownloaded(true);
          }
        }
      }

      // Get logo URL
      if (orgData.company_logo_path) {
        const { data } = supabase.storage
          .from('logos')
          .getPublicUrl(orgData.company_logo_path);
        setLogoUrl(data.publicUrl);
      }
    } catch (error) {
      console.error('Error fetching organization:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditOrganization = () => {
    navigate('/organization/edit');
  };

  const handleEditUserProfile = () => {
    navigate('/profile/edit');
  };

  const handleDownloadCertificate = () => {
    if (certificateDownloaded) {
      setConfirmDialogOpen(true);
    } else {
      downloadCertificate();
    }
  };

  const handleConfirmDownload = () => {
    downloadCertificate();
    setConfirmDialogOpen(false);
  };

  const downloadCertificate = () => {
    // Create a simple certificate
    const certificateContent = `
      KANO CHAMBER OF COMMERCE, INDUSTRY, MINES & AGRICULTURE (KACCIMA)
      
      MEMBERSHIP CERTIFICATE
      
      This is to certify that
      
      ${organization?.company_name}
      
      is a registered member of KACCIMA
      
      Membership Status: Active
      Registration Date: ${new Date(organization?.created_at).toLocaleDateString()}
      Membership ID: ${organization?.id}
      
      This certificate is valid for the membership year.
      
      Signed: ____________________
      KACCIMA Secretary
    `;

    const blob = new Blob([certificateContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `KACCIMA_Certificate_${organization?.company_name}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    // Mark as downloaded
    if (organization?.id) {
      localStorage.setItem(`certificate_${organization.id}_downloaded`, 'true');
      setCertificateDownloaded(true);
    }

    showAlert('success', 'Certificate downloaded successfully!');
  };

  const renderContent = () => {
    return (
      <section className="dashboard-content">
        <div className="profile-info">
          <h3>Profile Information</h3>
          
          <div className="photo-container">
            {logoUrl ? (
              <img 
                id="passportPhoto" 
                src={logoUrl} 
                alt="Company Logo" 
                className="profile-photo" 
                width="70px" 
                height="70px" 
              />
            ) : (
              <div className="profile-photo-placeholder">
                <span className="material-icons">business</span>
              </div>
            )}
          </div>

          <div className="info-item">
            <span className="label">Company Name:</span>
            <span className="value">{organization?.company_name || 'N/A'}</span>
          </div>

          <div className="info-item">
            <span className="label">Email:</span>
            <span className="value">{organization?.email || user?.email || 'N/A'}</span>
          </div>

          <div className="info-item">
            <span className="label">Office Address:</span>
            <span className="value">{organization?.office_address || 'N/A'}</span>
          </div>

          <div className="info-item">
            <span className="label">Phone Number:</span>
            <span className="value">{organization?.phone_number || 'N/A'}</span>
          </div>

          <div className="info-item">
            <span className="label">CAC Number:</span>
            <span className="value">{organization?.cac_number || 'N/A'}</span>
          </div>

          <div className="info-item">
            <span className="label">Nature of Business:</span>
            <span className="value">{organization?.business_nature || 'N/A'}</span>
          </div>

          <div className="info-item">
            <span className="label">Membership Status:</span>
            <span className={`value status-badge status-${organization?.status?.toLowerCase() || 'pending'}`}>
              {organization?.status || 'Pending'}
            </span>
          </div>

          <button 
            onClick={handleEditOrganization} 
            className="btn outline"
          >
            <EditIcon style={{ marginRight: '8px' }} /> Edit Organization Profile
          </button>

          <div className="profile-info-section">
            <h3>User Profile & Security</h3>
            
            <div className="info-item">
              <span className="label">User Email:</span>
              <span className="value">{user?.email || 'N/A'}</span>
            </div>

            <div className="info-item">
              <span className="label">Last Sign In:</span>
              <span className="value">
                {user?.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString() : 'N/A'}
              </span>
            </div>

            <div className="info-item">
              <span className="label">Password:</span>
              <span className="value">••••••••</span>
            </div>

            <button 
              onClick={handleEditUserProfile} 
              className="btn outline"
            >
              <EditIcon style={{ marginRight: '8px' }} /> Edit User Profile
            </button>
          </div>

          {(payment?.status === 'approved' || organization?.status === 'approved') && (
            <div className="profile-info-section">
              <h3>Membership Certificate</h3>
              <button 
                onClick={handleDownloadCertificate} 
                className="btn"
                style={{ backgroundColor: '#15e420', color: 'white' }}
              >
                <DownloadIcon style={{ marginRight: '8px' }} /> 
                {certificateDownloaded ? 'Download Certificate Again' : 'Download Certificate'}
              </button>
            </div>
          )}
        </div>
      </section>
    );
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
      {alert && (
        <div className={`mui-alert mui-alert-${alert.type}`}>
          <span className="material-icons mui-alert-icon">
            {alert.type === 'success' ? 'check_circle' : alert.type === 'info' ? 'info' : 'error'}
          </span>
          <span>{alert.message}</span>
        </div>
      )}
      
      <Layout>
        {renderContent()}

        {(payment?.status === 'approved' || organization?.status === 'approved') && (
          <>
            <InfoCard>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: '#15e420' }}>
                Membership Information
              </Typography>
              <Typography variant="body1" sx={{ color: '#666', lineHeight: 1.6 }}>
                As a member of KACCIMA, you are entitled to various benefits including access to business resources, 
                networking opportunities, and support for your business growth.
              </Typography>
            </InfoCard>

            <InfoCard>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: '#15e420' }}>
                Contact Information
              </Typography>
              <Typography variant="body1" sx={{ color: '#666', lineHeight: 1.6 }}>
                Email: info@kaccima.ng<br />
                Phone: +2347063174462<br />
                Website: www.kaccima.ng
              </Typography>
            </InfoCard>
          </>
        )}
      </Layout>

      {/* Confirmation Dialog */}
      <Dialog open={confirmDialogOpen} onClose={() => setConfirmDialogOpen(false)}>
        <DialogTitle sx={{ fontFamily: '"Poppins", sans-serif', fontWeight: 600 }}>
          Download Certificate Again?
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ color: '#666' }}>
            You have already downloaded your membership certificate. 
            Are you sure you want to download it again? This action will be recorded.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleConfirmDownload} 
            variant="contained"
            sx={{ bgcolor: '#15e420', '&:hover': { bgcolor: '#12c21e' } }}
          >
            Download Again
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default Profile;