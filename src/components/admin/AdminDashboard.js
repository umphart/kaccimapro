import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import {
  Box,
  Container,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  Chip,
  Button,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Avatar,
  Alert,
  Snackbar,
  CircularProgress,
  useTheme,
  useMediaQuery,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemButton,
  Divider,
  AppBar,
  Toolbar
} from '@mui/material';
import {
  People as PeopleIcon,
  Payment as PaymentIcon,
  CheckCircle as CheckCircleIcon,
  Pending as PendingIcon,
  TrendingUp as TrendingUpIcon,
  Visibility as VisibilityIcon,
  Warning as WarningIcon,
  Business as BusinessIcon,
  Receipt as ReceiptIcon,
  Dashboard as DashboardIcon,
  Description as DescriptionIcon,
  AttachMoney as AttachMoneyIcon,
  Assessment as AssessmentIcon,
  Notifications as NotificationsIcon,
  Settings as SettingsIcon,
  Logout as LogoutIcon,
  Menu as MenuIcon,
  AdminPanelSettings as AdminPanelSettingsIcon,
  Security as SecurityIcon
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js';
import { Line, Doughnut } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const drawerWidth = 260;

const StyledCard = styled(Card)(({ theme }) => ({
  height: '100%',
  borderRadius: '12px',
  boxShadow: '0 5px 15px rgba(0, 0, 0, 0.08)',
  transition: 'all 0.3s',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: '0 10px 25px rgba(21, 228, 32, 0.12)'
  }
}));

const StatCard = ({ title, value, icon, color }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  return (
    <StyledCard>
      <CardContent sx={{ p: isMobile ? 1.5 : 2.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: isMobile ? 1 : 1.5 }}>
          <Avatar sx={{ bgcolor: color, width: isMobile ? 32 : 40, height: isMobile ? 32 : 40 }}>
            {icon}
          </Avatar>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography 
              variant="caption" 
              sx={{ 
                color: '#666', 
                fontFamily: '"Inter", sans-serif', 
                fontSize: isMobile ? '0.65rem' : '0.7rem', 
                fontWeight: 500,
                display: 'block',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}
            >
              {title}
            </Typography>
            <Typography 
              variant={isMobile ? "body2" : "h6"} 
              sx={{ 
                fontWeight: 700, 
                fontFamily: '"Poppins", sans-serif', 
                fontSize: isMobile ? '0.9rem' : '1.1rem', 
                lineHeight: 1.3,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}
            >
              {value}
            </Typography>
          </Box>
        </Box>
      </CardContent>
    </StyledCard>
  );
};

const AdminDashboard = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [adminData, setAdminData] = useState(null);
  const [stats, setStats] = useState({
    totalOrganizations: 0,
    pendingOrganizations: 0,
    approvedOrganizations: 0,
    rejectedOrganizations: 0,
    totalPayments: 0,
    pendingPayments: 0,
    approvedPayments: 0,
    rejectedPayments: 0,
    totalRevenue: 0,
    monthlyRegistrations: []
  });
  const [recentActivities, setRecentActivities] = useState([]);
  const [alert, setAlert] = useState({ open: false, type: 'success', message: '' });

  useEffect(() => {
    checkAdmin();
  }, []);

  useEffect(() => {
    if (adminData) {
      loadDashboardData();
    }
  }, [adminData]);

  const showAlert = (type, message) => {
    setAlert({ open: true, type, message });
  };

  const handleCloseAlert = () => {
    setAlert({ ...alert, open: false });
  };

  const checkAdmin = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/admin/login');
        return;
      }

      const { data, error } = await supabase
        .from('admin_users')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error || !data) {
        await supabase.auth.signOut();
        navigate('/admin/login');
        return;
      }

      setAdminData(data);
      // Store admin data
      sessionStorage.setItem('adminData', JSON.stringify(data));
      sessionStorage.setItem('adminRole', data.admin_type);
    } catch (error) {
      console.error('Error checking admin:', error);
      navigate('/admin/login');
    }
  };

  const loadDashboardData = async () => {
    setLoading(true);
    await Promise.all([fetchStats(), fetchRecentActivities()]);
    setLoading(false);
  };

  const fetchStats = async () => {
    try {
      const { data: allOrgs, error: orgsError } = await supabase
        .from('organizations')
        .select('*');
      
      if (orgsError) throw orgsError;
      
      const totalOrgs = allOrgs?.length || 0;
      const pendingOrgs = allOrgs?.filter(o => o.status?.toLowerCase() === 'pending').length || 0;
      const approvedOrgs = allOrgs?.filter(o => o.status?.toLowerCase() === 'approved').length || 0;
      const rejectedOrgs = allOrgs?.filter(o => o.status?.toLowerCase() === 'rejected').length || 0;

      const { data: allPayments, error: paymentsError } = await supabase
        .from('payments')
        .select('*');
      
      if (paymentsError) throw paymentsError;
      
      const totalPayments = allPayments?.length || 0;
      const pendingPayments = allPayments?.filter(p => p.status?.toLowerCase() === 'pending').length || 0;
      const approvedPayments = allPayments?.filter(p => p.status?.toLowerCase() === 'approved').length || 0;
      const rejectedPayments = allPayments?.filter(p => p.status?.toLowerCase() === 'rejected').length || 0;
      
      const totalRevenue = allPayments
        ?.filter(p => p.status?.toLowerCase() === 'approved')
        .reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0) || 0;

      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

      const { data: registrations } = await supabase
        .from('organizations')
        .select('created_at')
        .gte('created_at', sixMonthsAgo.toISOString())
        .order('created_at');

      const monthlyData = {};
      registrations?.forEach(reg => {
        const date = new Date(reg.created_at);
        const month = date.toLocaleString('default', { month: 'short' });
        const year = date.getFullYear();
        const key = `${month} ${year}`;
        monthlyData[key] = (monthlyData[key] || 0) + 1;
      });

      const monthlyRegistrations = Object.entries(monthlyData).map(([month, count]) => ({
        month,
        count
      }));

      setStats({
        totalOrganizations: totalOrgs,
        pendingOrganizations: pendingOrgs,
        approvedOrganizations: approvedOrgs,
        rejectedOrganizations: rejectedOrgs,
        totalPayments,
        pendingPayments,
        approvedPayments,
        rejectedPayments,
        totalRevenue,
        monthlyRegistrations
      });

    } catch (error) {
      console.error('Error fetching stats:', error);
      showAlert('error', 'Failed to load statistics: ' + error.message);
    }
  };

  const fetchRecentActivities = async () => {
    try {
      const { data: recentOrgs, error } = await supabase
        .from('organizations')
        .select(`
          id,
          company_name,
          status,
          created_at,
          payments (
            id,
            amount,
            status,
            created_at
          )
        `)
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;

      const activities = recentOrgs?.map(org => ({
        id: org.id,
        company: org.company_name,
        status: org.status,
        date: org.created_at,
        hasPayment: org.payments && org.payments.length > 0,
        paymentStatus: org.payments?.[0]?.status
      })) || [];

      setRecentActivities(activities);
    } catch (error) {
      console.error('Error fetching activities:', error);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    sessionStorage.removeItem('adminData');
    sessionStorage.removeItem('adminRole');
    sessionStorage.removeItem('adminPermissions');
    navigate('/admin/login');
  };

  const getStatusChip = (status) => {
    const normalizedStatus = status?.toLowerCase() || 'pending';
    
    const config = {
      pending: { color: 'warning', icon: <PendingIcon />, label: 'Pending' },
      approved: { color: 'success', icon: <CheckCircleIcon />, label: 'Approved' },
      rejected: { color: 'error', icon: <WarningIcon />, label: 'Rejected' }
    };
    
    const statusConfig = config[normalizedStatus] || config.pending;
    
    return (
      <Chip
        icon={statusConfig.icon}
        label={statusConfig.label}
        size="small"
        color={statusConfig.color}
        sx={{ fontFamily: '"Inter", sans-serif', height: '24px', fontSize: '0.75rem' }}
      />
    );
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          font: { family: '"Inter", sans-serif', size: 10 },
          boxWidth: 10,
          padding: 8
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: { color: 'rgba(0, 0, 0, 0.05)' },
        ticks: { font: { size: 9 } }
      },
      x: {
        grid: { display: false },
        ticks: { font: { size: 9 } }
      }
    }
  };

  const chartData = {
    labels: stats.monthlyRegistrations.map(d => d.month),
    datasets: [{
      label: 'Registrations',
      data: stats.monthlyRegistrations.map(d => d.count),
      borderColor: '#15e420',
      backgroundColor: 'rgba(21, 228, 32, 0.1)',
      tension: 0.4,
      fill: true,
      pointRadius: 3,
      pointHoverRadius: 5
    }]
  };

  const doughnutData = {
    labels: ['Pending', 'Approved', 'Rejected'],
    datasets: [{
      data: [
        stats.pendingOrganizations,
        stats.approvedOrganizations,
        stats.rejectedOrganizations
      ],
      backgroundColor: ['#ffc107', '#15e420', '#dc3545'],
      borderWidth: 0,
      hoverOffset: 4
    }]
  };

  // Sidebar content
  const sidebarContent = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ p: 2, textAlign: 'center' }}>
        <img src="/static/logo.png" alt="KACCIMA" style={{ width: '60px', height: '60px', marginBottom: '8px' }} />
        <Typography variant="subtitle1" sx={{ fontFamily: '"Poppins", sans-serif', fontWeight: 600, color: '#15e420' }}>
          Admin Panel
        </Typography>
        {adminData && (
          <Chip
            label={adminData.admin_type?.replace('_', ' ')}
            size="small"
            sx={{ 
              mt: 1, 
              backgroundColor: adminData.admin_type === 'super_admin' ? '#dc3545' : 
                              adminData.admin_type === 'approver' ? '#667eea' : '#f093fb',
              color: 'white',
              textTransform: 'capitalize'
            }}
          />
        )}
      </Box>
      
      <Divider />
      
      <List sx={{ flex: 1, px: 1 }}>
        <ListItemButton 
          onClick={() => { navigate('/admin/dashboard'); setMobileOpen(false); }}
          selected={window.location.pathname === '/admin/dashboard'}
          sx={{ borderRadius: '8px', mb: 0.5 }}
        >
          <ListItemIcon><DashboardIcon sx={{ color: '#15e420' }} /></ListItemIcon>
          <ListItemText primary="Dashboard" primaryTypographyProps={{ fontSize: '0.9rem' }} />
        </ListItemButton>

        <ListItemButton 
          onClick={() => { navigate('/admin/organizations'); setMobileOpen(false); }}
          selected={window.location.pathname.includes('/admin/organizations')}
          sx={{ borderRadius: '8px', mb: 0.5 }}
        >
          <ListItemIcon><BusinessIcon sx={{ color: '#15e420' }} /></ListItemIcon>
          <ListItemText primary="Organizations" primaryTypographyProps={{ fontSize: '0.9rem' }} />
        </ListItemButton>

        <ListItemButton 
          onClick={() => { navigate('/admin/payments'); setMobileOpen(false); }}
          selected={window.location.pathname.includes('/admin/payments')}buck
          sx={{ borderRadius: '8px', mb: 0.5 }}
        >
          <ListItemIcon><AttachMoneyIcon sx={{ color: '#15e420' }} /></ListItemIcon>
          <ListItemText primary="Payments" primaryTypographyProps={{ fontSize: '0.9rem' }} />
        </ListItemButton>

        <ListItemButton 
          onClick={() => { navigate('/admin/documents'); setMobileOpen(false); }}
          selected={window.location.pathname === '/admin/documents'}
          sx={{ borderRadius: '8px', mb: 0.5 }}
        >
          <ListItemIcon><DescriptionIcon sx={{ color: '#15e420' }} /></ListItemIcon>
          <ListItemText primary="Documents" primaryTypographyProps={{ fontSize: '0.9rem' }} />
        </ListItemButton>

        <ListItemButton 
          onClick={() => { navigate('/admin/reports'); setMobileOpen(false); }}
          selected={window.location.pathname === '/admin/reports'}
          sx={{ borderRadius: '8px', mb: 0.5 }}
        >
          <ListItemIcon><AssessmentIcon sx={{ color: '#15e420' }} /></ListItemIcon>
          <ListItemText primary="Reports" primaryTypographyProps={{ fontSize: '0.9rem' }} />
        </ListItemButton>

        <ListItemButton 
          onClick={() => { navigate('/admin/notifications'); setMobileOpen(false); }}
          selected={window.location.pathname === '/admin/notifications'}
          sx={{ borderRadius: '8px', mb: 0.5 }}
        >
          <ListItemIcon><NotificationsIcon sx={{ color: '#15e420' }} /></ListItemIcon>
          <ListItemText primary="Notifications" primaryTypographyProps={{ fontSize: '0.9rem' }} />
        </ListItemButton>

 

        <ListItemButton 
          onClick={() => { navigate('/admin/settings'); setMobileOpen(false); }}
          selected={window.location.pathname === '/admin/settings'}
          sx={{ borderRadius: '8px', mb: 0.5 }}
        >
          <ListItemIcon><SettingsIcon sx={{ color: '#15e420' }} /></ListItemIcon>
          <ListItemText primary="Settings" primaryTypographyProps={{ fontSize: '0.9rem' }} />
        </ListItemButton>
      </List>

      <Divider />
      
      <Box sx={{ p: 2 }}>
        <Button
          fullWidth
          variant="outlined"
          color="error"
          startIcon={<LogoutIcon />}
          onClick={handleLogout}
          sx={{ textTransform: 'none' }}
        >
          Logout
        </Button>
      </Box>
    </Box>
  );

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

      <Box sx={{ display: 'flex' }}>
        {/* Mobile drawer */}
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth }
          }}
        >
          {sidebarContent}
        </Drawer>

        {/* Desktop drawer */}
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth }
          }}
          open
        >
          {sidebarContent}
        </Drawer>

        {/* Main content */}
        <Box sx={{ flex: 1, bgcolor: '#f8f9fa', minHeight: '100vh' }}>
          {/* Top bar for mobile */}
          <AppBar position="sticky" sx={{ display: { xs: 'block', md: 'none' }, bgcolor: 'white', boxShadow: 1 }}>
            <Toolbar>
              <IconButton onClick={() => setMobileOpen(true)}>
                <MenuIcon />
              </IconButton>
              <Typography variant="h6" sx={{ flex: 1, color: '#333', fontFamily: '"Poppins", sans-serif' }}>
                Admin Dashboard
              </Typography>
            </Toolbar>
          </AppBar>

          <Container maxWidth="xl" sx={{ py: 3, px: { xs: 1, sm: 2, md: 3 } }}>
            {/* Header */}
            <Box sx={{ mb: 3 }}>
              <Typography 
                variant="h5" 
                sx={{ 
                  fontFamily: '"Poppins", sans-serif',
                  fontWeight: 600,
                  color: '#333',
                  mb: 0.5,
                  fontSize: { xs: '1.1rem', sm: '1.5rem' }
                }}
              >
                Welcome back, {adminData?.full_name}!
              </Typography>
              <Typography 
                variant="body2" 
                sx={{ 
                  fontFamily: '"Inter", sans-serif',
                  color: '#666',
                  fontSize: { xs: '0.75rem', sm: '0.875rem' }
                }}
              >
                Here's what's happening with your platform today.
              </Typography>
            </Box>

            {/* Stats Cards */}
            <Grid container spacing={{ xs: 1, sm: 2 }} sx={{ mb: { xs: 1, sm: 3 } }}>
              <Grid item xs={6} sm={6} md={3}>
                <StatCard
                  title="Total Organizations"
                  value={stats.totalOrganizations}
                  icon={<BusinessIcon />}
                  color="#15e420"
                />
              </Grid>
              <Grid item xs={6} sm={6} md={3}>
                <StatCard
                  title="Pending Reviews"
                  value={stats.pendingOrganizations}
                  icon={<PendingIcon />}
                  color="#ffc107"
                />
              </Grid>
              <Grid item xs={6} sm={6} md={3}>
                <StatCard
                  title="Approved"
                  value={stats.approvedOrganizations}
                  icon={<CheckCircleIcon />}
                  color="#28a745"
                />
              </Grid>
              <Grid item xs={6} sm={6} md={3}>
                <StatCard
                  title="Rejected"
                  value={stats.rejectedOrganizations}
                  icon={<WarningIcon />}
                  color="#dc3545"
                />
              </Grid>
            </Grid>

            {/* Payment Stats */}
            <Grid container spacing={{ xs: 1, sm: 2 }} sx={{ mb: { xs: 1, sm: 3 } }}>
              <Grid item xs={6} sm={6} md={3}>
                <StatCard
                  title="Total Payments"
                  value={stats.totalPayments}
                  icon={<PaymentIcon />}
                  color="#17a2b8"
                />
              </Grid>
              <Grid item xs={6} sm={6} md={3}>
                <StatCard
                  title="Pending Payments"
                  value={stats.pendingPayments}
                  icon={<PendingIcon />}
                  color="#ffc107"
                />
              </Grid>
              <Grid item xs={6} sm={6} md={3}>
                <StatCard
                  title="Approved Payments"
                  value={stats.approvedPayments}
                  icon={<CheckCircleIcon />}
                  color="#28a745"
                />
              </Grid>
              <Grid item xs={6} sm={6} md={3}>
                <StatCard
                  title="Total Revenue"
                  value={`₦${stats.totalRevenue.toLocaleString()}`}
                  icon={<ReceiptIcon />}
                  color="#dc3545"
                />
              </Grid>
            </Grid>

            {/* Charts */}
            <Grid container spacing={{ xs: 1, sm: 2 }} sx={{ mb: { xs: 1, sm: 3 } }}>
              <Grid item xs={12} md={8}>
                <Paper sx={{ p: { xs: 1.5, sm: 2 }, borderRadius: '12px', bgcolor: 'white' }}>
                  <Typography 
                    variant="subtitle1" 
                    sx={{ 
                      fontFamily: '"Poppins", sans-serif',
                      fontWeight: 600,
                      mb: { xs: 1, sm: 2 },
                      fontSize: { xs: '0.9rem', sm: '1rem' }
                    }}
                  >
                    Registration Trends (Last 6 Months)
                  </Typography>
                  <Box sx={{ height: { xs: 180, sm: 220 } }}>
                    {stats.monthlyRegistrations.length > 0 ? (
                      <Line data={chartData} options={chartOptions} />
                    ) : (
                      <Box display="flex" justifyContent="center" alignItems="center" height="100%">
                        <Typography variant="body2" color="textSecondary">
                          No registration data available
                        </Typography>
                      </Box>
                    )}
                  </Box>
                </Paper>
              </Grid>
              <Grid item xs={12} md={4}>
                <Paper sx={{ 
                  p: { xs: 1.5, sm: 2 }, 
                  borderRadius: '12px', 
                  height: '100%', 
                  bgcolor: 'white',
                  minHeight: { xs: 200, md: 'auto' }
                }}>
                  <Typography 
                    variant="subtitle1" 
                    sx={{ 
                      fontFamily: '"Poppins", sans-serif',
                      fontWeight: 600,
                      mb: { xs: 1, sm: 2 },
                      fontSize: { xs: '0.9rem', sm: '1rem' }
                    }}
                  >
                    Organization Status
                  </Typography>
                  <Box sx={{ height: { xs: 140, sm: 180 } }}>
                    {stats.totalOrganizations > 0 ? (
                      <Doughnut data={doughnutData} options={chartOptions} />
                    ) : (
                      <Box display="flex" justifyContent="center" alignItems="center" height="100%">
                        <Typography variant="body2" color="textSecondary">
                          No data available
                        </Typography>
                      </Box>
                    )}
                  </Box>
                </Paper>
              </Grid>
            </Grid>

            {/* Recent Activities */}
            <Paper sx={{ p: { xs: 1.5, sm: 2 }, borderRadius: '12px', bgcolor: 'white', overflow: 'hidden' }}>
              <Box sx={{ 
                display: 'flex', 
                flexDirection: { xs: 'column', sm: 'row' },
                justifyContent: 'space-between', 
                alignItems: { xs: 'flex-start', sm: 'center' }, 
                mb: 2,
                gap: { xs: 1, sm: 0 }
              }}>
                <Typography 
                  variant="subtitle1" 
                  sx={{ 
                    fontFamily: '"Poppins", sans-serif',
                    fontWeight: 600,
                    fontSize: { xs: '0.9rem', sm: '1rem' }
                  }}
                >
                  Recent Registrations
                </Typography>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => navigate('/admin/organizations')}
                  sx={{
                    borderColor: '#15e420',
                    color: '#15e420',
                    fontSize: '0.75rem',
                    py: 0.5,
                    px: 1.5,
                    alignSelf: { xs: 'flex-end', sm: 'auto' },
                    '&:hover': {
                      borderColor: '#12c21e',
                      backgroundColor: '#e8f5e9'
                    }
                  }}
                >
                  View All
                </Button>
              </Box>

              <TableContainer sx={{ overflowX: 'auto' }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontFamily: '"Inter", sans-serif', fontWeight: 600, fontSize: '0.8rem', py: 1 }}>
                        Company
                      </TableCell>
                      <TableCell sx={{ fontFamily: '"Inter", sans-serif', fontWeight: 600, fontSize: '0.8rem', py: 1, display: { xs: 'none', sm: 'table-cell' } }}>
                        Date
                      </TableCell>
                      <TableCell sx={{ fontFamily: '"Inter", sans-serif', fontWeight: 600, fontSize: '0.8rem', py: 1 }}>
                        Status
                      </TableCell>
                      <TableCell sx={{ fontFamily: '"Inter", sans-serif', fontWeight: 600, fontSize: '0.8rem', py: 1 }}>
                        Payment
                      </TableCell>
                      <TableCell sx={{ fontFamily: '"Inter", sans-serif', fontWeight: 600, fontSize: '0.8rem', py: 1 }}>
                        Actions
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {recentActivities.length > 0 ? (
                      recentActivities.map((activity) => (
                        <TableRow key={activity.id} hover>
                          <TableCell sx={{ 
                            fontFamily: '"Inter", sans-serif', 
                            fontSize: '0.8rem', 
                            py: 1,
                            maxWidth: { xs: 100, sm: 'none' },
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}>
                            {activity.company}
                          </TableCell>
                          <TableCell sx={{ 
                            fontFamily: '"Inter", sans-serif', 
                            fontSize: '0.8rem', 
                            py: 1,
                            display: { xs: 'none', sm: 'table-cell' }
                          }}>
                            {new Date(activity.date).toLocaleDateString()}
                          </TableCell>
                          <TableCell sx={{ py: 1 }}>
                            {getStatusChip(activity.status)}
                          </TableCell>
                          <TableCell sx={{ py: 1 }}>
                            {activity.hasPayment ? (
                              <Chip
                                icon={<CheckCircleIcon />}
                                label={activity.paymentStatus === 'approved' ? 'Paid' : 'Pending'}
                                size="small"
                                color={activity.paymentStatus === 'approved' ? 'success' : 'warning'}
                                sx={{ height: '24px', fontSize: '0.7rem' }}
                              />
                            ) : (
                              <Chip
                                icon={<PendingIcon />}
                                label="No Payment"
                                size="small"
                                color="default"
                                sx={{ height: '24px', fontSize: '0.7rem' }}
                              />
                            )}
                          </TableCell>
                          <TableCell sx={{ py: 1 }}>
                            <IconButton
                              size="small"
                              onClick={() => navigate(`/admin/organizations/${activity.id}`)}
                              sx={{ color: '#15e420', p: 0.5 }}
                            >
                              <VisibilityIcon fontSize="small" />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={5} align="center" sx={{ py: 3 }}>
                          <Typography variant="body2" sx={{ color: '#666' }}>
                            No recent activities found
                          </Typography>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </Container>
        </Box>
      </Box>
    </>
  );
};

export default AdminDashboard;