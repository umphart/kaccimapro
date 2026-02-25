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
  TrendingUp as TrendingUpIcon,
  Visibility as VisibilityIcon,
  Warning as WarningIcon,
  Business as BusinessIcon,
  Receipt as ReceiptIcon
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
  borderRadius: '12px',
  boxShadow: '0 5px 15px rgba(0, 0, 0, 0.08)',
  transition: 'all 0.3s',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: '0 10px 25px rgba(21, 228, 32, 0.12)'
  }
}));

// Responsive StatCard component
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
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));
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
      // Fetch all organizations
      const { data: allOrgs, error: orgsError } = await supabase
        .from('organizations')
        .select('*');
      
      if (orgsError) throw orgsError;
      
      // Calculate org stats with case-insensitive status
      const totalOrgs = allOrgs?.length || 0;
      const pendingOrgs = allOrgs?.filter(o => o.status?.toLowerCase() === 'pending').length || 0;
      const approvedOrgs = allOrgs?.filter(o => o.status?.toLowerCase() === 'approved').length || 0;
      const rejectedOrgs = allOrgs?.filter(o => o.status?.toLowerCase() === 'rejected').length || 0;

      // Fetch all payments
      const { data: allPayments, error: paymentsError } = await supabase
        .from('payments')
        .select('*');
      
      if (paymentsError) throw paymentsError;
      
      // Calculate payment stats with case-insensitive status
      const totalPayments = allPayments?.length || 0;
      const pendingPayments = allPayments?.filter(p => p.status?.toLowerCase() === 'pending').length || 0;
      const approvedPayments = allPayments?.filter(p => p.status?.toLowerCase() === 'approved').length || 0;
      const rejectedPayments = allPayments?.filter(p => p.status?.toLowerCase() === 'rejected').length || 0;
      
      // Calculate total revenue from approved payments
      const totalRevenue = allPayments
        ?.filter(p => p.status?.toLowerCase() === 'approved')
        .reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0) || 0;

      // Fetch monthly registrations (last 6 months)
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
        sx={{ fontFamily: '"Inter", sans-serif', height: isMobile ? '20px' : '24px', fontSize: isMobile ? '0.65rem' : '0.75rem' }}
      />
    );
  };

  // Responsive chart options
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          font: {
            family: '"Inter", sans-serif',
            size: isMobile ? 8 : 10
          },
          boxWidth: isMobile ? 8 : 10,
          padding: isMobile ? 4 : 8
        }
      },
      tooltip: {
        enabled: true,
        titleFont: { size: isMobile ? 10 : 12 },
        bodyFont: { size: isMobile ? 9 : 11 }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.05)'
        },
        ticks: {
          font: {
            size: isMobile ? 8 : 9
          },
          stepSize: isMobile ? 1 : undefined
        }
      },
      x: {
        grid: {
          display: false
        },
        ticks: {
          font: {
            size: isMobile ? 8 : 9
          },
          maxRotation: isMobile ? 45 : 0,
          minRotation: isMobile ? 45 : 0
        }
      }
    }
  };

  const chartData = {
    labels: stats.monthlyRegistrations.map(d => d.month),
    datasets: [
      {
        label: 'Registrations',
        data: stats.monthlyRegistrations.map(d => d.count),
        borderColor: '#15e420',
        backgroundColor: 'rgba(21, 228, 32, 0.1)',
        tension: 0.4,
        fill: true,
        pointRadius: isMobile ? 2 : 3,
        pointHoverRadius: isMobile ? 4 : 5
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
          stats.rejectedOrganizations
        ],
        backgroundColor: ['#ffc107', '#15e420', '#dc3545'],
        borderWidth: 0,
        hoverOffset: 4
      }
    ]
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

      <Container maxWidth="xl" sx={{ py: isMobile ? 1 : 3, px: isMobile ? 1 : 2 }}>
        <Box sx={{ 
          display: 'flex', 
          flexDirection: isMobile ? 'column' : 'row',
          gap: isMobile ? 1 : 2 
        }}>
          <AdminSidebar />
          
          <Box sx={{ 
            flex: 1, 
            bgcolor: '#f8f9fa', 
            p: isMobile ? 1.5 : 2.5, 
            borderRadius: '12px',
            minWidth: 0 // Prevent overflow
          }}>
            {/* Header */}
            <Box sx={{ mb: isMobile ? 2 : 3 }}>
              <Typography 
                variant={isMobile ? "h6" : "h5"} 
                sx={{ 
                  fontFamily: '"Poppins", sans-serif',
                  fontWeight: 600,
                  color: '#333',
                  mb: 0.5,
                  fontSize: isMobile ? '1.1rem' : undefined
                }}
              >
                Welcome back, {adminData?.full_name}!
              </Typography>
              <Typography 
                variant="body2" 
                sx={{ 
                  fontFamily: '"Inter", sans-serif',
                  color: '#666',
                  fontSize: isMobile ? '0.75rem' : '0.875rem'
                }}
              >
                Here's what's happening with your platform today.
              </Typography>
            </Box>

            {/* Stats Cards - Responsive grid */}
            <Grid container spacing={isMobile ? 1 : 2} sx={{ mb: isMobile ? 1 : 3 }}>
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

            {/* Second Row of Stats - Payments */}
            <Grid container spacing={isMobile ? 1 : 2} sx={{ mb: isMobile ? 1 : 3 }}>
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

            {/* Charts - Responsive layout */}
            <Grid container spacing={isMobile ? 1 : 2} sx={{ mb: isMobile ? 1 : 3 }}>
              <Grid item xs={12} md={8}>
                <Paper sx={{ p: isMobile ? 1.5 : 2, borderRadius: '12px', bgcolor: 'white' }}>
                  <Typography 
                    variant={isMobile ? "body2" : "subtitle1"} 
                    sx={{ 
                      fontFamily: '"Poppins", sans-serif',
                      fontWeight: 600,
                      mb: isMobile ? 1 : 2,
                      fontSize: isMobile ? '0.9rem' : '1rem'
                    }}
                  >
                    Registration Trends (Last 6 Months)
                  </Typography>
                  <Box sx={{ height: isMobile ? 180 : 220 }}>
                    {stats.monthlyRegistrations.length > 0 ? (
                      <Line data={chartData} options={chartOptions} />
                    ) : (
                      <Box display="flex" justifyContent="center" alignItems="center" height="100%">
                        <Typography variant="body2" color="textSecondary" sx={{ fontSize: isMobile ? '0.75rem' : '0.875rem' }}>
                          No registration data available
                        </Typography>
                      </Box>
                    )}
                  </Box>
                </Paper>
              </Grid>
              <Grid item xs={12} md={4}>
                <Paper sx={{ 
                  p: isMobile ? 1.5 : 2, 
                  borderRadius: '12px', 
                  height: '100%', 
                  bgcolor: 'white',
                  minHeight: isMobile ? 200 : 'auto'
                }}>
                  <Typography 
                    variant={isMobile ? "body2" : "subtitle1"} 
                    sx={{ 
                      fontFamily: '"Poppins", sans-serif',
                      fontWeight: 600,
                      mb: isMobile ? 1 : 2,
                      fontSize: isMobile ? '0.9rem' : '1rem'
                    }}
                  >
                    Organization Status
                  </Typography>
                  <Box sx={{ height: isMobile ? 140 : 180 }}>
                    {stats.totalOrganizations > 0 ? (
                      <Doughnut data={doughnutData} options={chartOptions} />
                    ) : (
                      <Box display="flex" justifyContent="center" alignItems="center" height="100%">
                        <Typography variant="body2" color="textSecondary" sx={{ fontSize: isMobile ? '0.75rem' : '0.875rem' }}>
                          No data available
                        </Typography>
                      </Box>
                    )}
                  </Box>
                </Paper>
              </Grid>
            </Grid>

            {/* Recent Activities - Responsive table */}
            <Paper sx={{ p: isMobile ? 1.5 : 2, borderRadius: '12px', bgcolor: 'white', overflow: 'hidden' }}>
              <Box sx={{ 
                display: 'flex', 
                flexDirection: isMobile ? 'column' : 'row',
                justifyContent: 'space-between', 
                alignItems: isMobile ? 'flex-start' : 'center', 
                mb: 2,
                gap: isMobile ? 1 : 0
              }}>
                <Typography 
                  variant={isMobile ? "body2" : "subtitle1"} 
                  sx={{ 
                    fontFamily: '"Poppins", sans-serif',
                    fontWeight: 600,
                    fontSize: isMobile ? '0.9rem' : '1rem'
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
                    fontSize: isMobile ? '0.7rem' : '0.75rem',
                    py: 0.5,
                    px: 1.5,
                    alignSelf: isMobile ? 'flex-end' : 'auto',
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
                <Table size={isMobile ? "small" : "small"}>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ 
                        fontFamily: '"Inter", sans-serif', 
                        fontWeight: 600, 
                        fontSize: isMobile ? '0.7rem' : '0.8rem', 
                        py: 1,
                        px: isMobile ? 0.5 : 1
                      }}>
                        Company
                      </TableCell>
                      {!isMobile && (
                        <TableCell sx={{ 
                          fontFamily: '"Inter", sans-serif', 
                          fontWeight: 600, 
                          fontSize: isMobile ? '0.7rem' : '0.8rem', 
                          py: 1 
                        }}>
                          Date
                        </TableCell>
                      )}
                      <TableCell sx={{ 
                        fontFamily: '"Inter", sans-serif', 
                        fontWeight: 600, 
                        fontSize: isMobile ? '0.7rem' : '0.8rem', 
                        py: 1,
                        px: isMobile ? 0.5 : 1
                      }}>
                        Status
                      </TableCell>
                      <TableCell sx={{ 
                        fontFamily: '"Inter", sans-serif', 
                        fontWeight: 600, 
                        fontSize: isMobile ? '0.7rem' : '0.8rem', 
                        py: 1,
                        px: isMobile ? 0.5 : 1
                      }}>
                        Payment
                      </TableCell>
                      <TableCell sx={{ 
                        fontFamily: '"Inter", sans-serif', 
                        fontWeight: 600, 
                        fontSize: isMobile ? '0.7rem' : '0.8rem', 
                        py: 1,
                        px: isMobile ? 0.5 : 1
                      }}>
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
                            fontSize: isMobile ? '0.7rem' : '0.8rem', 
                            py: 1,
                            px: isMobile ? 0.5 : 1,
                            maxWidth: isMobile ? 100 : 'none',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}>
                            {activity.company}
                          </TableCell>
                          {!isMobile && (
                            <TableCell sx={{ 
                              fontFamily: '"Inter", sans-serif', 
                              fontSize: '0.8rem', 
                              py: 1 
                            }}>
                              {new Date(activity.date).toLocaleDateString()}
                            </TableCell>
                          )}
                          <TableCell sx={{ py: 1, px: isMobile ? 0.5 : 1 }}>
                            {getStatusChip(activity.status)}
                          </TableCell>
                          <TableCell sx={{ py: 1, px: isMobile ? 0.5 : 1 }}>
                            {activity.hasPayment ? (
                              <Chip
                                icon={<CheckCircleIcon />}
                                label={activity.paymentStatus === 'approved' ? 'Paid' : 'Pending'}
                                size="small"
                                color={activity.paymentStatus === 'approved' ? 'success' : 'warning'}
                                sx={{ 
                                  height: isMobile ? '20px' : '24px', 
                                  fontSize: isMobile ? '0.6rem' : '0.7rem',
                                  '& .MuiChip-icon': {
                                    fontSize: isMobile ? '0.7rem' : '0.9rem'
                                  }
                                }}
                              />
                            ) : (
                              <Chip
                                icon={<PendingIcon />}
                                label="No Payment"
                                size="small"
                                color="default"
                                sx={{ 
                                  height: isMobile ? '20px' : '24px', 
                                  fontSize: isMobile ? '0.6rem' : '0.7rem',
                                  '& .MuiChip-icon': {
                                    fontSize: isMobile ? '0.7rem' : '0.9rem'
                                  }
                                }}
                              />
                            )}
                          </TableCell>
                          <TableCell sx={{ py: 1, px: isMobile ? 0.5 : 1 }}>
                            <IconButton
                              size="small"
                              onClick={() => navigate(`/admin/organizations/${activity.id}`)}
                              sx={{ color: '#15e420', p: 0.5 }}
                            >
                              <VisibilityIcon fontSize={isMobile ? "small" : "small"} />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={isMobile ? 4 : 5} align="center" sx={{ py: 3 }}>
                          <Typography variant="body2" sx={{ color: '#666', fontSize: isMobile ? '0.75rem' : '0.875rem' }}>
                            No recent activities found
                          </Typography>
                        </TableCell>
                      </TableRow>
                    )}
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