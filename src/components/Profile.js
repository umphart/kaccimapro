import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '../supabaseClient';
import {
  Box,
  CircularProgress,
  Container,
  Alert,
  Snackbar,
  useMediaQuery,
  useTheme
} from '@mui/material';
import { styled } from '@mui/material/styles';
import Layout from './Layout';
import ProfileHeader from './profile/ProfileHeader';
import StatusCard from './profile/StatusCard';
import StatsCards from './profile/StatsCards';
import OrganizationInfo from './profile/OrganizationInfo';
import ProfileSecurity from './profile/ProfileSecurity';
import PaymentHistory from './profile/PaymentHistory';
import MembershipBenefits from './profile/MembershipBenefits';
import ChangePasswordModal from './profile/ChangePasswordModal';
import './Profile.css';

// Styled Components
const ProfileContainer = styled(motion.div)(({ theme }) => ({
  maxWidth: '1400px',
  margin: '0 auto',
  padding: theme.spacing(2),
  [theme.breakpoints.down('sm')]: {
    padding: theme.spacing(1.5)
  }
}));

const StyledContainer = styled(Container)({
  backgroundColor: '#f5f7fa',
  minHeight: '100vh',
  borderRadius: '12px',
  paddingTop: '24px',
  paddingBottom: '24px'
});

const Profile = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const [user, setUser] = useState(null);
  const [organization, setOrganization] = useState(null);
  const [payment, setPayment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState({ open: false, type: 'success', message: '' });
  const [logoUrl, setLogoUrl] = useState(null);
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [stats, setStats] = useState({
    totalPayments: 0,
    approvedPayments: 0,
    pendingPayments: 0,
    membershipDays: 0,
    totalSpent: 0
  });

  useEffect(() => {
    checkUser();
  }, []);

  useEffect(() => {
    if (user) {
      fetchOrganizationData();
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

  const fetchOrganizationData = async () => {
    try {
      if (!user) return;

      const { data: orgData, error: orgError } = await supabase
        .from('organizations')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (orgError) throw orgError;

      setOrganization(orgData);

      if (orgData?.id) {
        const { data: paymentData, error: paymentError } = await supabase
          .from('payments')
          .select('*')
          .eq('organization_id', orgData.id)
          .order('created_at', { ascending: false });

        if (!paymentError && paymentData) {
          setPayment(paymentData[0]);
          setPaymentHistory(paymentData);
          
          const approved = paymentData.filter(p => p.status === 'approved').length;
          const pending = paymentData.filter(p => p.status === 'pending').length;
          const totalSpent = paymentData
            .filter(p => p.status === 'approved')
            .reduce((sum, p) => sum + (p.amount || 0), 0);
          
          const firstPayment = paymentData.find(p => p.payment_type === 'first' && p.status === 'approved');
          let membershipDays = 0;
          if (firstPayment) {
            const startDate = new Date(firstPayment.created_at);
            const now = new Date();
            membershipDays = Math.floor((now - startDate) / (1000 * 60 * 60 * 24));
          }

          setStats({
            totalPayments: paymentData.length,
            approvedPayments: approved,
            pendingPayments: pending,
            membershipDays,
            totalSpent
          });
        }
      }

      if (orgData.company_logo_path) {
        const { data } = supabase.storage
          .from('logos')
          .getPublicUrl(orgData.company_logo_path);
        setLogoUrl(data.publicUrl);
      }
    } catch (error) {
      console.error('Error fetching organization:', error);
      showAlert('error', 'Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      navigate('/login');
    } catch (error) {
      console.error('Error logging out:', error);
      showAlert('error', 'Failed to log out');
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
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

      <Layout>
        <StyledContainer maxWidth="xl">
          <ProfileContainer
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <ProfileHeader 
              organizationName={organization?.company_name}
              onLogout={handleLogout}
              isMobile={isMobile}
            />

            <StatusCard 
              status={organization?.status}
              isMobile={isMobile}
            />

            {organization?.status === 'approved' && (
              <StatsCards stats={stats} isMobile={isMobile} />
            )}

            <OrganizationInfo 
              organization={organization}
              logoUrl={logoUrl}
              userEmail={user?.email}
              isMobile={isMobile}
            />

            <ProfileSecurity 
              user={user}
              onOpenPasswordModal={() => setPasswordModalOpen(true)}
              isMobile={isMobile}
            />

            {paymentHistory.length > 0 && (
              <PaymentHistory 
                payments={paymentHistory}
                isMobile={isMobile}
              />
            )}

            {(payment?.status === 'approved' || organization?.status === 'approved') && (
              <MembershipBenefits isMobile={isMobile} />
            )}
          </ProfileContainer>
        </StyledContainer>
      </Layout>

      <ChangePasswordModal
        open={passwordModalOpen}
        onClose={() => setPasswordModalOpen(false)}
        showAlert={showAlert}
      />
    </>
  );
};

export default Profile;