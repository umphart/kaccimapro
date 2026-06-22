import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  useMediaQuery
} from '@mui/material';
import {
  People as PeopleIcon,
  Payment as PaymentIcon,
  CheckCircle as CheckCircleIcon,
  Pending as PendingIcon,
  Visibility as VisibilityIcon,
  Warning as WarningIcon,
  Business as BusinessIcon,
  Receipt as ReceiptIcon
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
import AdminSidebar from './AdminSidebar';

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

const StyledCard = styled(Card)(({ theme }) => ({
  height: '100%',
  borderRadius: '12px',
  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
  transition: 'all 0.2s ease',
  border: '1px solid #f0f0f0',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: '0 8px 16px rgba(21, 228, 32, 0.1)'
  }
}));

const StatCard = ({ title, value, icon, color, subtitle }) => {
  return (
    <StyledCard>
      <CardContent sx={{ p: 2.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar sx={{ bgcolor: color, width: 44, height: 44 }}>
            {icon}
          </Avatar>
          <Box>
            <Typography variant="body2" sx={{ color: '#666', fontWeight: 500 }}>
              {title}
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 700, color: '#333' }}>
              {value}
            </Typography>
            {subtitle && (
              <Typography variant="caption" sx={{ color: '#999' }}>
                {subtitle}
              </Typography>
            )}
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

      <Box sx={{ display: 'flex', bgcolor: '#f8f9fa', minHeight: '100vh' }}>
        <AdminSidebar onLogout={handleLogout} />

        <Box sx={{ flex: 1, p: { xs: 2, md: 3 } }}>
          <Container maxWidth="xl" sx={{ py: { xs: 1, md: 2 } }}>
            {/* Header */}
            <Box sx={{ mb: 3 }}>
              <Typography 
                variant="h5" 
                sx={{ 
                  fontFamily: '"Inter", sans-serif',
                  fontWeight: 600,
                  color: '#333',
                  mb: 0.5
                }}
              >
                Welcome back, {adminData?.full_name || 'Admin'}!
              </Typography>
              <Typography 
                variant="body2" 
                sx={{ 
                  fontFamily: '"Inter", sans-serif',
                  color: '#666'
                }}
              >
                Here's what's happening with your platform today.
              </Typography>
            </Box>

            {/* Stats Cards - Organizations */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={6} sm={3}>
                <StatCard
                  title="Total Organizations"
                  value={stats.totalOrganizations}
                  icon={<BusinessIcon />}
                  color="#15e420"
                />
              </Grid>
              <Grid item xs={6} sm={3}>
                <StatCard
                  title="Pending Reviews"
                  value={stats.pendingOrganizations}
                  icon={<PendingIcon />}
                  color="#ffc107"
                />
              </Grid>
              <Grid item xs={6} sm={3}>
                <StatCard
                  title="Approved"
                  value={stats.approvedOrganizations}
                  icon={<CheckCircleIcon />}
                  color="#28a745"
                />
              </Grid>
              <Grid item xs={6} sm={3}>
                <StatCard
                  title="Rejected"
                  value={stats.rejectedOrganizations}
                  icon={<WarningIcon />}
                  color="#dc3545"
                />
              </Grid>
            </Grid>

            {/* Stats Cards - Payments */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={6} sm={3}>
                <StatCard
                  title="Total Payments"
                  value={stats.totalPayments}
                  icon={<PaymentIcon />}
                  color="#17a2b8"
                />
              </Grid>
              <Grid item xs={6} sm={3}>
                <StatCard
                  title="Pending Payments"
                  value={stats.pendingPayments}
                  icon={<PendingIcon />}
                  color="#ffc107"
                />
              </Grid>
              <Grid item xs={6} sm={3}>
                <StatCard
                  title="Approved Payments"
                  value={stats.approvedPayments}
                  icon={<CheckCircleIcon />}
                  color="#28a745"
                />
              </Grid>
              <Grid item xs={6} sm={3}>
                <StatCard
                  title="Total Revenue"
                  value={`₦${stats.totalRevenue.toLocaleString()}`}
                  icon={<ReceiptIcon />}
                  color="#dc3545"
                />
              </Grid>
            </Grid>

            {/* Charts */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={12} md={8}>
                <Paper sx={{ p: 2, borderRadius: '12px', bgcolor: 'white' }}>
                  <Typography 
                    variant="subtitle1" 
                    sx={{ 
                      fontFamily: '"Inter", sans-serif',
                      fontWeight: 600,
                      mb: 2
                    }}
                  >
                    Registration Trends (Last 6 Months)
                  </Typography>
                  <Box sx={{ height: 220 }}>
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
                  p: 2, 
                  borderRadius: '12px', 
                  height: '100%', 
                  bgcolor: 'white',
                  minHeight: 200
                }}>
                  <Typography 
                    variant="subtitle1" 
                    sx={{ 
                      fontFamily: '"Inter", sans-serif',
                      fontWeight: 600,
                      mb: 2
                    }}
                  >
                    Organization Status
                  </Typography>
                  <Box sx={{ height: 180 }}>
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
            <Paper sx={{ p: 2, borderRadius: '12px', bgcolor: 'white' }}>
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                mb: 2
              }}>
                <Typography 
                  variant="subtitle1" 
                  sx={{ 
                    fontFamily: '"Inter", sans-serif',
                    fontWeight: 600
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
                    '&:hover': {
                      borderColor: '#12c21e',
                      backgroundColor: '#e8f5e9'
                    }
                  }}
                >
                  View All
                </Button>
              </Box>

              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600, fontSize: '0.8rem' }}>Company</TableCell>
                      <TableCell sx={{ fontWeight: 600, fontSize: '0.8rem', display: { xs: 'none', sm: 'table-cell' } }}>Date</TableCell>
                      <TableCell sx={{ fontWeight: 600, fontSize: '0.8rem' }}>Status</TableCell>
                      <TableCell sx={{ fontWeight: 600, fontSize: '0.8rem' }}>Payment</TableCell>
                      <TableCell sx={{ fontWeight: 600, fontSize: '0.8rem' }}>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {recentActivities.length > 0 ? (
                      recentActivities.map((activity) => (
                        <TableRow key={activity.id} hover>
                          <TableCell sx={{ fontSize: '0.85rem' }}>
                            {activity.company}
                          </TableCell>
                          <TableCell sx={{ fontSize: '0.85rem', display: { xs: 'none', sm: 'table-cell' } }}>
                            {new Date(activity.date).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            {getStatusChip(activity.status)}
                          </TableCell>
                          <TableCell>
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
                          <TableCell>
                            <IconButton
                              size="small"
                              onClick={() => navigate(`/admin/organizations/${activity.id}`)}
                              sx={{ color: '#15e420' }}
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