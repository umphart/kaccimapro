// components/admin-org-dashboard/AdminOrgDashboard.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '../../supabaseClient';
import {
  Box,
  Container,
  Grid,
  Paper,
  Typography,
  CircularProgress,
  Card,
  CardContent,
  Chip,
  Button,
  Divider,
  LinearProgress,
  Avatar,
  IconButton,
  Tooltip,
  Alert,
  Snackbar,
  useMediaQuery,
  useTheme,
  Badge
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Business as BusinessIcon,
  Payment as PaymentIcon,
  Description as DescriptionIcon,
  Notifications as NotificationsIcon,
  Settings as SettingsIcon,
  Verified as VerifiedIcon,
  Pending as PendingIcon,
  Error as ErrorIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  CalendarToday as CalendarIcon,
  AttachMoney as MoneyIcon,
  Person as PersonIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  LocationOn as LocationIcon,
  Refresh as RefreshIcon,
  Download as DownloadIcon,
  Visibility as VisibilityIcon,
  ArrowForward as ArrowForwardIcon
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import Sidebar from '../Sidebar';
import './AdminOrgDashboard.css';

// Styled Components
const DashboardContainer = styled(motion.div)({
  padding: '2rem',
  fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif"
});

const WelcomeCard = styled(Card)({
  background: 'linear-gradient(135deg, #15e420 0%, #0fa819 100%)',
  color: 'white',
  borderRadius: '20px',
  padding: '2rem',
  marginBottom: '2rem',
  position: 'relative',
  overflow: 'hidden',
  '&::after': {
    content: '""',
    position: 'absolute',
    top: '-50%',
    right: '-10%',
    width: '300px',
    height: '300px',
    borderRadius: '50%',
    background: 'rgba(255, 255, 255, 0.05)'
  }
});

const StatCard = styled(Card)(({ theme }) => ({
  borderRadius: '16px',
  padding: '1.5rem',
  transition: 'transform 0.3s ease, box-shadow 0.3s ease',
  cursor: 'pointer',
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: '0 8px 30px rgba(0, 0, 0, 0.12)'
  }
}));

const StatusBadge = styled(Chip)(({ status }) => ({
  backgroundColor: status === 'approved' ? '#d4edda' :
                  status === 'pending' ? '#fff3e0' :
                  status === 'rejected' ? '#ffebee' :
                  status === 'active' ? '#d4edda' :
                  '#e8f5e9',
  color: status === 'approved' ? '#28a745' :
         status === 'pending' ? '#ff9800' :
         status === 'rejected' ? '#dc3545' :
         status === 'active' ? '#28a745' :
         '#15e420',
  fontWeight: 600,
  fontSize: '0.85rem',
  '& .MuiChip-icon': {
    color: status === 'approved' ? '#28a745' :
           status === 'pending' ? '#ff9800' :
           status === 'rejected' ? '#dc3545' :
           status === 'active' ? '#28a745' :
           '#15e420'
  }
}));

const QuickActionButton = styled(Button)({
  borderRadius: '12px',
  padding: '0.75rem 1.5rem',
  fontWeight: 600,
  textTransform: 'none',
  transition: 'all 0.3s ease',
  '&.primary': {
    background: 'linear-gradient(135deg, #15e420 0%, #0fa819 100%)',
    color: 'white',
    '&:hover': {
      transform: 'translateY(-2px)',
      boxShadow: '0 8px 25px rgba(21, 228, 32, 0.3)'
    }
  },
  '&.secondary': {
    border: '2px solid #15e420',
    color: '#15e420',
    background: 'transparent',
    '&:hover': {
      background: 'rgba(21, 228, 32, 0.05)',
      transform: 'translateY(-2px)'
    }
  },
  '&.danger': {
    border: '2px solid #dc3545',
    color: '#dc3545',
    background: 'transparent',
    '&:hover': {
      background: 'rgba(220, 53, 69, 0.05)',
      transform: 'translateY(-2px)'
    }
  }
});

const ActivityItem = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  gap: '1rem',
  padding: '0.75rem 0',
  borderBottom: '1px solid #f0f0f0',
  '&:last-child': {
    borderBottom: 'none'
  }
});

const ActivityIcon = styled(Box)(({ type }) => ({
  width: '40px',
  height: '40px',
  borderRadius: '12px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: type === 'payment' ? 'rgba(21, 228, 32, 0.1)' :
                  type === 'document' ? 'rgba(33, 150, 243, 0.1)' :
                  type === 'status' ? 'rgba(255, 193, 7, 0.1)' :
                  'rgba(108, 117, 125, 0.1)',
  color: type === 'payment' ? '#15e420' :
         type === 'document' ? '#2196f3' :
         type === 'status' ? '#ffc107' :
         '#6c757d'
}));

const AdminOrgDashboard = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  // State
  const [user, setUser] = useState(null);
  const [organization, setOrganization] = useState(null);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState({ open: false, type: 'success', message: '' });
  
  // Dashboard data
  const [stats, setStats] = useState({
    totalPayments: 0,
    pendingPayments: 0,
    approvedPayments: 0,
    totalDocuments: 0,
    pendingDocuments: 0,
    approvedDocuments: 0,
    membershipDays: 0,
    memberSince: null,
    nextRenewal: null
  });
  
  const [recentActivities, setRecentActivities] = useState([]);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [membershipStatus, setMembershipStatus] = useState('pending');

  useEffect(() => {
    checkUser();
  }, []);

  useEffect(() => {
    if (user) {
      fetchOrganizationData();
      setupRealtimeSubscription();
    }
  }, [user]);

  // Setup real-time subscriptions
  const setupRealtimeSubscription = () => {
    if (!organization?.id) return;

    const subscription = supabase
      .channel('admin_org_dashboard')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'admin_organization_payments',
          filter: `organization_id=eq.${organization.id}`
        },
        (payload) => {
          console.log('New payment:', payload);
          fetchOrganizationData();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'admin_organization_payments',
          filter: `organization_id=eq.${organization.id}`
        },
        (payload) => {
          console.log('Payment updated:', payload);
          fetchOrganizationData();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'organization_notifications',
          filter: `organization_id=eq.${organization.id}`
        },
        (payload) => {
          console.log('New notification:', payload);
          setUnreadNotifications(prev => prev + 1);
          fetchOrganizationData();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  };

  // Helper functions
  const showAlert = useCallback((type, message) => {
    setAlert({ open: true, type, message });
  }, []);

  const handleCloseAlert = useCallback(() => {
    setAlert(prev => ({ ...prev, open: false }));
  }, []);

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

      console.log('🔍 Fetching organization data for user:', user.id);

      // METHOD 1: Get organization from user metadata
      let orgData = null;

      if (user.user_metadata?.organization_id) {
        console.log('🔍 Looking up organization by metadata ID:', user.user_metadata.organization_id);
        
        const { data, error } = await supabase
          .from('organizations_registry')
          .select('*')
          .eq('id', user.user_metadata.organization_id)
          .maybeSingle();

        if (data) {
          console.log('✅ Found organization by metadata ID:', data.company_name);
          orgData = data;
        }
      }

      // METHOD 2: If not found, try by email
      if (!orgData && user.email) {
        console.log('🔍 Looking up organization by email:', user.email);
        
        const { data, error } = await supabase
          .from('organizations_registry')
          .select('*')
          .eq('email', user.email)
          .maybeSingle();

        if (data) {
          console.log('✅ Found organization by email:', data.company_name);
          orgData = data;
          
          // Update created_by if not set
          if (!data.created_by) {
            await supabase
              .from('organizations_registry')
              .update({ created_by: user.id })
              .eq('id', data.id);
            console.log('✅ Updated organization with created_by');
          }
        }
      }

      // METHOD 3: Finally try by created_by
      if (!orgData) {
        console.log('🔍 Looking up organization by created_by:', user.id);
        
        const { data, error } = await supabase
          .from('organizations_registry')
          .select('*')
          .eq('created_by', user.id)
          .maybeSingle();

        if (data) {
          console.log('✅ Found organization by created_by:', data.company_name);
          orgData = data;
        }
      }

      if (!orgData) {
        console.log('❌ No organization found');
        showAlert('error', 'Organization not found. Please contact admin.');
        return;
      }

      setOrganization(orgData);
      setMembershipStatus(orgData.status || 'pending');

      // Fetch payments from admin_organization_payments
      const { data: payments, error: paymentError } = await supabase
        .from('admin_organization_payments')
        .select('*')
        .eq('organization_id', orgData.id)
        .order('created_at', { ascending: false });

      if (!paymentError && payments) {
        const approved = payments.filter(p => p.status === 'approved').length;
        const pending = payments.filter(p => p.status === 'pending').length;
        
        // Calculate membership days
        const approvedPayments = payments.filter(p => p.status === 'approved');
        let membershipDays = 0;
        let memberSince = null;
        let nextRenewal = null;
        
        if (approvedPayments.length > 0) {
          const firstPayment = approvedPayments[approvedPayments.length - 1];
          memberSince = new Date(firstPayment.created_at);
          membershipDays = Math.floor((Date.now() - memberSince.getTime()) / (1000 * 60 * 60 * 24));
          
          // Calculate next renewal (1 year from first payment)
          nextRenewal = new Date(memberSince);
          nextRenewal.setFullYear(nextRenewal.getFullYear() + 1);
        }

        setStats(prev => ({
          ...prev,
          totalPayments: payments.length,
          pendingPayments: pending,
          approvedPayments: approved,
          membershipDays,
          memberSince,
          nextRenewal
        }));
      }

      // Fetch documents
      const { data: documents, error: docError } = await supabase
        .from('organization_documents')
        .select('*')
        .eq('organization_id', orgData.id);

      if (!docError && documents) {
        const pending = documents.filter(d => d.status === 'pending').length;
        const approved = documents.filter(d => d.status === 'approved').length;
        
        setStats(prev => ({
          ...prev,
          totalDocuments: documents.length,
          pendingDocuments: pending,
          approvedDocuments: approved
        }));
      }

      // Fetch notifications
      const { data: notifications, error: notifError } = await supabase
        .from('organization_notifications')
        .select('*')
        .eq('organization_id', orgData.id)
        .eq('read', false)
        .order('created_at', { ascending: false });

      if (!notifError && notifications) {
        setUnreadNotifications(notifications.length);
        
        // Get recent activities
        const activities = notifications.slice(0, 5).map(n => ({
          id: n.id,
          type: n.type?.includes('payment') ? 'payment' : 
                n.type?.includes('document') ? 'document' : 'status',
          title: n.title || 'Update',
          message: n.message || '',
          timestamp: n.created_at
        }));
        
        setRecentActivities(activities);
      }

    } catch (error) {
      console.error('❌ Error fetching organization data:', error);
      showAlert('error', 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case 'approved':
      case 'active':
        return <VerifiedIcon />;
      case 'pending':
        return <PendingIcon />;
      case 'rejected':
        return <ErrorIcon />;
      default:
        return <WarningIcon />;
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'approved':
      case 'active':
        return '#28a745';
      case 'pending':
        return '#ff9800';
      case 'rejected':
        return '#dc3545';
      default:
        return '#6c757d';
    }
  };

  const getActivityIcon = (type) => {
    switch(type) {
      case 'payment':
        return <PaymentIcon />;
      case 'document':
        return <DescriptionIcon />;
      case 'status':
        return <VerifiedIcon />;
      default:
        return <NotificationsIcon />;
    }
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-NG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTimeAgo = (date) => {
    if (!date) return '';
    const diff = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
    return formatDate(date);
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

      <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#f5f7fa' }}>
        <Sidebar />
        
        <Box sx={{ flex: 1, overflow: 'auto' }}>
          <Container maxWidth="xl">
            <DashboardContainer
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              {/* Welcome Section */}
              <WelcomeCard>
                <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
                      Welcome back, {organization?.company_name || 'Organization'}! 👋
                    </Typography>
                    <Typography variant="body1" sx={{ opacity: 0.9, mb: 2 }}>
                      Here's what's happening with your organization account.
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                      <StatusBadge
                        status={membershipStatus}
                        icon={getStatusIcon(membershipStatus)}
                        label={
                          membershipStatus === 'approved' ? 'Active Member' :
                          membershipStatus === 'pending' ? 'Pending Approval' :
                          membershipStatus === 'rejected' ? 'Rejected' :
                          'Inactive'
                        }
                      />
                      <Chip
                        icon={<CalendarIcon />}
                        label={`Registration: ${organization?.registration_number || 'N/A'}`}
                        sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }}
                      />
                    </Box>
                  </Box>
                  <Box sx={{ mt: { xs: 2, md: 0 }, textAlign: 'center' }}>
                    <Avatar
                      sx={{
                        width: 80,
                        height: 80,
                        bgcolor: 'rgba(255,255,255,0.2)',
                        border: '3px solid rgba(255,255,255,0.3)',
                        mx: 'auto'
                      }}
                    >
                      <BusinessIcon sx={{ fontSize: 40 }} />
                    </Avatar>
                    {membershipStatus === 'approved' && (
                      <Box
                        sx={{
                          position: 'relative',
                          mt: -3,
                          textAlign: 'center'
                        }}
                      >
                        <VerifiedIcon sx={{ fontSize: 24, color: '#28a745', bgcolor: 'white', borderRadius: '50%', p: 0.5 }} />
                      </Box>
                    )}
                  </Box>
                </Box>
              </WelcomeCard>

              {/* Stats Cards */}
              <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <StatCard onClick={() => navigate('/admin-org-payment')}>
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Box>
                        <Typography variant="caption" sx={{ color: '#666' }}>Total Payments</Typography>
                        <Typography variant="h4" sx={{ fontWeight: 700, color: '#333' }}>
                          {stats.totalPayments}
                        </Typography>
                      </Box>
                      <Avatar sx={{ bgcolor: 'rgba(21, 228, 32, 0.1)', color: '#15e420' }}>
                        <PaymentIcon />
                      </Avatar>
                    </Box>
                    <Box sx={{ mt: 1 }}>
                      <Chip
                        size="small"
                        label={`${stats.approvedPayments} approved`}
                        sx={{ bgcolor: '#d4edda', color: '#28a745', mr: 0.5 }}
                      />
                      {stats.pendingPayments > 0 && (
                        <Chip
                          size="small"
                          label={`${stats.pendingPayments} pending`}
                          sx={{ bgcolor: '#fff3e0', color: '#ff9800' }}
                        />
                      )}
                    </Box>
                  </StatCard>
                </Grid>

                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <StatCard onClick={() => navigate('/documents')}>
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Box>
                        <Typography variant="caption" sx={{ color: '#666' }}>Documents</Typography>
                        <Typography variant="h4" sx={{ fontWeight: 700, color: '#333' }}>
                          {stats.totalDocuments}
                        </Typography>
                      </Box>
                      <Avatar sx={{ bgcolor: 'rgba(33, 150, 243, 0.1)', color: '#2196f3' }}>
                        <DescriptionIcon />
                      </Avatar>
                    </Box>
                    <Box sx={{ mt: 1 }}>
                      <Chip
                        size="small"
                        label={`${stats.approvedDocuments} approved`}
                        sx={{ bgcolor: '#d4edda', color: '#28a745', mr: 0.5 }}
                      />
                      {stats.pendingDocuments > 0 && (
                        <Chip
                          size="small"
                          label={`${stats.pendingDocuments} pending`}
                          sx={{ bgcolor: '#fff3e0', color: '#ff9800' }}
                        />
                      )}
                    </Box>
                  </StatCard>
                </Grid>

                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <StatCard onClick={() => navigate('/notifications')}>
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Box>
                        <Typography variant="caption" sx={{ color: '#666' }}>Notifications</Typography>
                        <Typography variant="h4" sx={{ fontWeight: 700, color: '#333' }}>
                          {unreadNotifications}
                        </Typography>
                      </Box>
                      <Badge badgeContent={unreadNotifications} color="error">
                        <Avatar sx={{ bgcolor: 'rgba(255, 193, 7, 0.1)', color: '#ffc107' }}>
                          <NotificationsIcon />
                        </Avatar>
                      </Badge>
                    </Box>
                    <Typography variant="caption" sx={{ color: '#666' }}>
                      {unreadNotifications === 0 ? 'All caught up!' : `${unreadNotifications} unread`}
                    </Typography>
                  </StatCard>
                </Grid>

                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <StatCard>
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Box>
                        <Typography variant="caption" sx={{ color: '#666' }}>Membership</Typography>
                        <Typography variant="h4" sx={{ fontWeight: 700, color: '#333' }}>
                          {stats.membershipDays}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#666' }}>days active</Typography>
                      </Box>
                      <Avatar sx={{ bgcolor: 'rgba(40, 167, 69, 0.1)', color: '#28a745' }}>
                        <VerifiedIcon />
                      </Avatar>
                    </Box>
                    {stats.nextRenewal && (
                      <Typography variant="caption" sx={{ color: '#666', display: 'block', mt: 1 }}>
                        Renewal: {formatDate(stats.nextRenewal)}
                      </Typography>
                    )}
                  </StatCard>
                </Grid>
              </Grid>

              {/* Quick Actions */}
              <Paper sx={{ p: 3, borderRadius: '16px', mb: 4 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                  Quick Actions
                </Typography>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <QuickActionButton
                      className="primary"
                      fullWidth
                      startIcon={<PaymentIcon />}
                      onClick={() => navigate('/admin-org-payment')}
                    >
                      Make Payment
                    </QuickActionButton>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <QuickActionButton
                      className="secondary"
                      fullWidth
                      startIcon={<DescriptionIcon />}
                      onClick={() => navigate('/documents')}
                    >
                      Manage Documents
                    </QuickActionButton>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <QuickActionButton
                      className="secondary"
                      fullWidth
                      startIcon={<BusinessIcon />}
                      onClick={() => navigate('/organization')}
                    >
                      View Profile
                    </QuickActionButton>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <QuickActionButton
                      className="secondary"
                      fullWidth
                      startIcon={<SettingsIcon />}
                      onClick={() => navigate('/settings')}
                    >
                      Settings
                    </QuickActionButton>
                  </Grid>
                </Grid>
              </Paper>

              {/* Recent Activity & Status */}
              <Grid container spacing={3}>
                <Grid size={{ xs: 12, md: 8 }}>
                  <Paper sx={{ p: 3, borderRadius: '16px' }}>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        Recent Activity
                      </Typography>
                      <Button
                        size="small"
                        endIcon={<ArrowForwardIcon />}
                        onClick={() => navigate('/notifications')}
                        sx={{ color: '#15e420' }}
                      >
                        View All
                      </Button>
                    </Box>
                    
                    {recentActivities.length === 0 ? (
                      <Box textAlign="center" py={4}>
                        <NotificationsIcon sx={{ fontSize: 48, color: '#ccc' }} />
                        <Typography variant="body2" sx={{ color: '#999', mt: 1 }}>
                          No recent activity
                        </Typography>
                      </Box>
                    ) : (
                      recentActivities.map((activity, index) => (
                        <ActivityItem key={activity.id || index}>
                          <ActivityIcon type={activity.type}>
                            {getActivityIcon(activity.type)}
                          </ActivityIcon>
                          <Box flex={1}>
                            <Typography variant="body2" sx={{ fontWeight: 500, color: '#333' }}>
                              {activity.title}
                            </Typography>
                            <Typography variant="caption" sx={{ color: '#666' }}>
                              {activity.message}
                            </Typography>
                          </Box>
                          <Typography variant="caption" sx={{ color: '#999' }}>
                            {formatTimeAgo(activity.timestamp)}
                          </Typography>
                        </ActivityItem>
                      ))
                    )}
                  </Paper>
                </Grid>

                <Grid size={{ xs: 12, md: 4 }}>
                  <Paper sx={{ p: 3, borderRadius: '16px' }}>
                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                      Membership Status
                    </Typography>
                    
                    <Box textAlign="center" py={2}>
                      <Box sx={{ position: 'relative', display: 'inline-block' }}>
                        {membershipStatus === 'approved' ? (
                          <VerifiedIcon sx={{ fontSize: 64, color: '#28a745' }} />
                        ) : membershipStatus === 'pending' ? (
                          <PendingIcon sx={{ fontSize: 64, color: '#ff9800' }} />
                        ) : membershipStatus === 'rejected' ? (
                          <ErrorIcon sx={{ fontSize: 64, color: '#dc3545' }} />
                        ) : (
                          <WarningIcon sx={{ fontSize: 64, color: '#6c757d' }} />
                        )}
                      </Box>
                      
                      <Typography variant="h6" sx={{ mt: 2, color: getStatusColor(membershipStatus) }}>
                        {membershipStatus === 'approved' ? 'Active Member' :
                         membershipStatus === 'pending' ? 'Pending Approval' :
                         membershipStatus === 'rejected' ? 'Membership Rejected' :
                         'Inactive'}
                      </Typography>
                      
                      {membershipStatus === 'approved' && (
                        <>
                          <Typography variant="body2" sx={{ color: '#666', mt: 1 }}>
                            You have full access to all membership benefits.
                          </Typography>
                          {stats.nextRenewal && (
                            <Typography variant="caption" sx={{ color: '#999', display: 'block', mt: 1 }}>
                              Next renewal: {formatDate(stats.nextRenewal)}
                            </Typography>
                          )}
                          <Button
                            variant="contained"
                            fullWidth
                            sx={{ mt: 2, bgcolor: '#15e420', '&:hover': { bgcolor: '#12c21e' } }}
                            startIcon={<VerifiedIcon />}
                          >
                            Download Membership Card
                          </Button>
                        </>
                      )}
                      
                      {membershipStatus === 'pending' && (
                        <>
                          <Typography variant="body2" sx={{ color: '#666', mt: 1 }}>
                            Your membership is being reviewed by the admin.
                          </Typography>
                          <LinearProgress sx={{ mt: 2, height: 8, borderRadius: 4 }} />
                          <Typography variant="caption" sx={{ color: '#999', mt: 1, display: 'block' }}>
                            Estimated review time: 24-48 hours
                          </Typography>
                        </>
                      )}
                      
                      {membershipStatus === 'rejected' && (
                        <>
                          <Typography variant="body2" sx={{ color: '#dc3545', mt: 1 }}>
                            Your membership application has been rejected.
                          </Typography>
                          <Button
                            variant="outlined"
                            fullWidth
                            sx={{ mt: 2, borderColor: '#15e420', color: '#15e420' }}
                            startIcon={<RefreshIcon />}
                            onClick={() => navigate('/organization')}
                          >
                            Review & Resubmit
                          </Button>
                        </>
                      )}
                      
                      {(!membershipStatus || membershipStatus === 'inactive') && (
                        <>
                          <Typography variant="body2" sx={{ color: '#666', mt: 1 }}>
                            Complete your registration to become a member.
                          </Typography>
                          <Button
                            variant="contained"
                            fullWidth
                            sx={{ mt: 2, bgcolor: '#15e420', '&:hover': { bgcolor: '#12c21e' } }}
                            startIcon={<PaymentIcon />}
                            onClick={() => navigate('/admin-org-payment')}
                          >
                            Make Payment
                          </Button>
                        </>
                      )}
                    </Box>
                  </Paper>
                </Grid>
              </Grid>

              {/* Organization Details Summary */}
              <Paper sx={{ p: 3, borderRadius: '16px', mt: 4 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                  Organization Summary
                </Typography>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <Typography variant="caption" sx={{ color: '#666' }}>Registration Number</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {organization?.registration_number || 'N/A'}
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <Typography variant="caption" sx={{ color: '#666' }}>CAC Number</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {organization?.cac_number || 'N/A'}
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <Typography variant="caption" sx={{ color: '#666' }}>Email</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {organization?.email || 'N/A'}
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <Typography variant="caption" sx={{ color: '#666' }}>Phone</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {organization?.phone_number1 || 'N/A'}
                    </Typography>
                  </Grid>
                </Grid>
                <Divider sx={{ my: 2 }} />
                <Button
                  size="small"
                  endIcon={<ArrowForwardIcon />}
                  onClick={() => navigate('/organization')}
                  sx={{ color: '#15e420' }}
                >
                  View Full Profile
                </Button>
              </Paper>
            </DashboardContainer>
          </Container>
        </Box>
      </Box>
    </>
  );
};

export default AdminOrgDashboard;