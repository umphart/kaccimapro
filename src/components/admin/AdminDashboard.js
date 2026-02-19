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
  LinearProgress,
  Alert,
  Snackbar,
  CircularProgress
} from '@mui/material';
import {
  People as PeopleIcon,
  Payment as PaymentIcon,
  Description as DescriptionIcon,
  CheckCircle as CheckCircleIcon,
  Pending as PendingIcon,
  TrendingUp as TrendingUpIcon,
  Visibility as VisibilityIcon,
  Verified as VerifiedIcon,
  Warning as WarningIcon
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import AdminSidebar from './AdminSidebar';
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

const StyledCard = styled(Card)(({ theme }) => ({
  height: '100%',
  borderRadius: '16px',
  boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)',
  transition: 'all 0.3s',
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: '0 15px 35px rgba(21, 228, 32, 0.15)'
  }
}));

const StatCard = ({ title, value, icon, color, trend }) => (
  <StyledCard>
    <CardContent>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6" sx={{ fontFamily: '"Poppins", sans-serif', fontWeight: 600 }}>
          {title}
        </Typography>
        <Avatar sx={{ bgcolor: color, width: 48, height: 48 }}>
          {icon}
        </Avatar>
      </Box>
      <Typography variant="h3" sx={{ fontWeight: 700, mb: 1 }}>
        {value}
      </Typography>
      {trend && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <TrendingUpIcon sx={{ color: '#15e420', fontSize: 20 }} />
          <Typography variant="body2" sx={{ color: '#666' }}>
            {trend}
          </Typography>
        </Box>
      )}
    </CardContent>
  </StyledCard>
);

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [adminData, setAdminData] = useState(null);
  const [stats, setStats] = useState({
    totalOrganizations: 0,
    pendingOrganizations: 0,
    approvedOrganizations: 0,
    totalPayments: 0,
    pendingPayments: 0,
    approvedPayments: 0,
    totalRevenue: 0,
    monthlyRegistrations: []
  });
  const [recentActivities, setRecentActivities] = useState([]);
  const [alert, setAlert] = useState({ open: false, type: 'success', message: '' });

  useEffect(() => {
    checkAdmin();
    fetchStats();
    fetchRecentActivities();
  }, []);

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
    } catch (error) {
      console.error('Error checking admin:', error);
      navigate('/admin/login');
    }
  };

const fetchStats = async () => {
  try {
    console.log('Fetching stats...');
    
    // Fetch all organizations first to debug
    const { data: allOrgs, error: orgsError } = await supabase
      .from('organizations')
      .select('*');
    
    if (orgsError) {
      console.error('Error fetching organizations:', orgsError);
      throw orgsError;
    }
    
    console.log('All organizations:', allOrgs);
    
    // Calculate stats manually
    const totalOrgs = allOrgs?.length || 0;
    const pendingOrgs = allOrgs?.filter(o => o.status === 'pending').length || 0;
    const approvedOrgs = allOrgs?.filter(o => o.status === 'approved').length || 0;

    // Fetch all payments
    const { data: allPayments, error: paymentsError } = await supabase
      .from('payments')
      .select('*');
    
    if (paymentsError) {
      console.error('Error fetching payments:', paymentsError);
      throw paymentsError;
    }
    
    console.log('All payments:', allPayments);
    
    const totalPayments = allPayments?.length || 0;
    const pendingPayments = allPayments?.filter(p => p.status === 'pending').length || 0;
    const approvedPayments = allPayments?.filter(p => p.status === 'approved').length || 0;
    
    // Calculate total revenue
    const totalRevenue = allPayments
      ?.filter(p => p.status === 'approved')
      .reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0) || 0;

    // Fetch monthly registrations
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const { data: registrations } = await supabase
      .from('organizations')
      .select('created_at')
      .gte('created_at', sixMonthsAgo.toISOString())
      .order('created_at');

    // Group by month
    const monthlyData = {};
    registrations?.forEach(reg => {
      const date = new Date(reg.created_at);
      const month = date.toLocaleString('default', { month: 'short' });
      monthlyData[month] = (monthlyData[month] || 0) + 1;
    });

    const monthlyRegistrations = Object.entries(monthlyData).map(([month, count]) => ({
      month,
      count
    }));

    setStats({
      totalOrganizations: totalOrgs,
      pendingOrganizations: pendingOrgs,
      approvedOrganizations: approvedOrgs,
      totalPayments,
      pendingPayments,
      approvedPayments,
      totalRevenue,
      monthlyRegistrations
    });

    console.log('Stats updated:', {
      totalOrgs,
      pendingOrgs,
      approvedOrgs,
      totalPayments,
      pendingPayments,
      approvedPayments,
      totalRevenue
    });

  } catch (error) {
    console.error('Error fetching stats:', error);
    showAlert('error', 'Failed to load statistics: ' + error.message);
  } finally {
    setLoading(false);
  }
};

  const fetchRecentActivities = async () => {
    try {
      // Fetch recent registrations
      const { data: recentOrgs } = await supabase
        .from('organizations')
        .select('*, payments(*)')
        .order('created_at', { ascending: false })
        .limit(5);

      const activities = recentOrgs?.map(org => ({
        id: org.id,
        type: 'registration',
        company: org.company_name,
        status: org.status,
        date: org.created_at,
        hasPayment: org.payments?.length > 0
      })) || [];

      setRecentActivities(activities);
    } catch (error) {
      console.error('Error fetching activities:', error);
    }
  };

  const getStatusChip = (status) => {
    const config = {
      pending: { color: 'warning', icon: <PendingIcon />, label: 'Pending' },
      approved: { color: 'success', icon: <CheckCircleIcon />, label: 'Approved' },
      rejected: { color: 'error', icon: <WarningIcon />, label: 'Rejected' }
    };
    const statusConfig = config[status] || config.pending;
    
    return (
      <Chip
        icon={statusConfig.icon}
        label={statusConfig.label}
        size="small"
        color={statusConfig.color}
        sx={{ fontFamily: '"Inter", sans-serif' }}
      />
    );
  };

  const chartData = {
    labels: stats.monthlyRegistrations.map(d => d.month),
    datasets: [
      {
        label: 'Registrations',
        data: stats.monthlyRegistrations.map(d => d.count),
        borderColor: '#15e420',
        backgroundColor: 'rgba(21, 228, 32, 0.1)',
        tension: 0.4
      }
    ]
  };

  const doughnutData = {
    labels: ['Pending', 'Approved', 'Rejected'],
    datasets: [
      {
        data: [
          stats.pendingOrganizations,
          stats.approvedOrganizations,
          stats.totalOrganizations - stats.pendingOrganizations - stats.approvedOrganizations
        ],
        backgroundColor: ['#ffc107', '#15e420', '#dc3545'],
        borderWidth: 0
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          font: {
            family: '"Inter", sans-serif'
          }
        }
      }
    }
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
          
          <Box sx={{ flex: 1 }}>
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
                Welcome back, {adminData?.full_name}!
              </Typography>
              <Typography 
                variant="body1" 
                sx={{ 
                  fontFamily: '"Inter", sans-serif',
                  color: '#666'
                }}
              >
                Here's what's happening with your platform today.
              </Typography>
            </Box>

            {/* Stats Cards */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
              <Grid item xs={12} sm={6} md={3}>
                <StatCard
                  title="Total Organizations"
                  value={stats.totalOrganizations}
                  icon={<PeopleIcon />}
                  color="#15e420"
                  trend="+12% from last month"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <StatCard
                  title="Pending Reviews"
                  value={stats.pendingOrganizations}
                  icon={<PendingIcon />}
                  color="#ffc107"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <StatCard
                  title="Total Payments"
                  value={stats.totalPayments}
                  icon={<PaymentIcon />}
                  color="#17a2b8"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <StatCard
                  title="Total Revenue"
                  value={`₦${stats.totalRevenue.toLocaleString()}`}
                  icon={<TrendingUpIcon />}
                  color="#dc3545"
                />
              </Grid>
            </Grid>

            {/* Charts */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
              <Grid item xs={12} md={8}>
                <Paper sx={{ p: 3, borderRadius: '16px' }}>
                  <Typography 
                    variant="h6" 
                    sx={{ 
                      fontFamily: '"Poppins", sans-serif',
                      fontWeight: 600,
                      mb: 3
                    }}
                  >
                    Registration Trends
                  </Typography>
                  <Box sx={{ height: 300 }}>
                    <Line data={chartData} options={chartOptions} />
                  </Box>
                </Paper>
              </Grid>
              <Grid item xs={12} md={4}>
                <Paper sx={{ p: 3, borderRadius: '16px', height: '100%' }}>
                  <Typography 
                    variant="h6" 
                    sx={{ 
                      fontFamily: '"Poppins", sans-serif',
                      fontWeight: 600,
                      mb: 3
                    }}
                  >
                    Organization Status
                  </Typography>
                  <Box sx={{ height: 250 }}>
                    <Doughnut data={doughnutData} options={chartOptions} />
                  </Box>
                </Paper>
              </Grid>
            </Grid>

            {/* Recent Activities */}
            <Paper sx={{ p: 3, borderRadius: '16px' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography 
                  variant="h6" 
                  sx={{ 
                    fontFamily: '"Poppins", sans-serif',
                    fontWeight: 600
                  }}
                >
                  Recent Registrations
                </Typography>
                <Button
                  variant="outlined"
                  onClick={() => navigate('/admin/organizations')}
                  sx={{
                    borderColor: '#15e420',
                    color: '#15e420',
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
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontFamily: '"Inter", sans-serif', fontWeight: 600 }}>Company</TableCell>
                      <TableCell sx={{ fontFamily: '"Inter", sans-serif', fontWeight: 600 }}>Date</TableCell>
                      <TableCell sx={{ fontFamily: '"Inter", sans-serif', fontWeight: 600 }}>Status</TableCell>
                      <TableCell sx={{ fontFamily: '"Inter", sans-serif', fontWeight: 600 }}>Payment</TableCell>
                      <TableCell sx={{ fontFamily: '"Inter", sans-serif', fontWeight: 600 }}>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {recentActivities.map((activity) => (
                      <TableRow key={activity.id} hover>
                        <TableCell sx={{ fontFamily: '"Inter", sans-serif' }}>
                          {activity.company}
                        </TableCell>
                        <TableCell sx={{ fontFamily: '"Inter", sans-serif' }}>
                          {new Date(activity.date).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          {getStatusChip(activity.status)}
                        </TableCell>
                        <TableCell>
                          {activity.hasPayment ? (
                            <Chip
                              icon={<CheckCircleIcon />}
                              label="Received"
                              size="small"
                              color="success"
                            />
                          ) : (
                            <Chip
                              icon={<PendingIcon />}
                              label="Pending"
                              size="small"
                              color="warning"
                            />
                          )}
                        </TableCell>
                        <TableCell>
                          <IconButton
                            size="small"
                            onClick={() => navigate(`/admin/organizations/${activity.id}`)}
                            sx={{ color: '#15e420' }}
                          >
                            <VisibilityIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </Box>
        </Box>
      </Container>
    </>
  );
};

export default AdminDashboard;