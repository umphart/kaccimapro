// src/components/admin/AdminNotifications.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import {
  Box,
  Container,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  TextField,
  Alert,
  Snackbar,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Avatar,
  Badge
} from '@mui/material';
import {
  NotificationsActive as NotificationsActiveIcon,
  Send as SendIcon,
  Schedule as ScheduleIcon,
  Payment as PaymentIcon,
  CheckCircle as CheckCircleIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  AccessTime as AccessTimeIcon,
  Email as EmailIcon,
  Business as BusinessIcon,
  PersonAdd as PersonAddIcon,
  Receipt as ReceiptIcon,
  Warning as WarningIcon
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import AdminSidebar from './AdminSidebar';
import { 
  sendOrganizationCredentials, 
  sendAdminRegistrationNotification,
  sendAdminPaymentNotification,
  sendRawEmail
} from '../../utils/emailService';

const StyledCard = styled(Card)(({ theme }) => ({
  borderRadius: '16px',
  boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)',
  marginBottom: theme.spacing(3)
}));

const NotificationItem = styled(ListItem)(({ theme, unread }) => ({
  backgroundColor: unread ? 'rgba(21, 228, 32, 0.05)' : 'transparent',
  borderLeft: unread ? '4px solid #15e420' : '4px solid transparent',
  transition: 'all 0.3s ease',
  '&:hover': {
    backgroundColor: 'rgba(0, 0, 0, 0.02)'
  }
}));

const AdminNotifications = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [alert, setAlert] = useState({ open: false, type: 'success', message: '' });
  const [organizations, setOrganizations] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [notificationType, setNotificationType] = useState('renewal');
  const [selectedMembers, setSelectedMembers] = useState('all');
  const [message, setMessage] = useState('');
  const [subject, setSubject] = useState('');
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTime, setScheduleTime] = useState('');
  const [recentPayments, setRecentPayments] = useState([]);
  const [recentRegistrations, setRecentRegistrations] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);

  useEffect(() => {
    fetchData();
    setupRealtimeSubscriptions();
  }, []);

  const showAlert = (type, message) => {
    setAlert({ open: true, type, message });
  };

  const handleCloseAlert = () => {
    setAlert({ ...alert, open: false });
  };

  const setupRealtimeSubscriptions = () => {
    // Subscribe to new payments
    const paymentSubscription = supabase
      .channel('admin-payments-channel')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'admin_organization_payments'
        },
        (payload) => {
          if (payload.new.status !== 'completed' && payload.new.status !== 'approved') {
            handleNewPayment(payload.new);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'payments'
        },
        (payload) => {
          if (payload.new.status !== 'completed') {
            handleNewPayment(payload.new);
          }
        }
      )
      .subscribe();

    // Subscribe to new registrations
    const registrationSubscription = supabase
      .channel('admin-registrations-channel')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'organizations_registry'
        },
        (payload) => {
          if (payload.new.status !== 'approved') {
            handleNewRegistration(payload.new);
          }
        }
      )
      .subscribe();

    return () => {
      paymentSubscription.unsubscribe();
      registrationSubscription.unsubscribe();
    };
  };

  const handleNewPayment = async (payment) => {
    try {
      const { data: org } = await supabase
        .from('organizations_registry')
        .select('company_name, email, phone_number1')
        .eq('id', payment.organization_id)
        .single();

      if (org) {
        await sendAdminPaymentNotification(payment, org);
      }

      if (org?.email) {
        // Send raw email with payment notification
        await sendRawEmail({
          toEmail: org.email,
          companyName: org.company_name,
          subject: `Payment Received - ${org.company_name}`,
          message: `
We have received your payment of ₦${parseFloat(payment.amount).toLocaleString()}.

Payment Details:
• Amount: ₦${parseFloat(payment.amount).toLocaleString()}
• Payment Type: ${payment.payment_type || 'Registration'}
• Status: ${payment.status || 'Pending'}
• Date: ${new Date(payment.created_at).toLocaleString()}

Your payment is currently being processed. You will receive another notification once it is approved.

Thank you for your prompt payment.`,
          actionUrl: `${window.location.origin}/dashboard`,
          actionText: 'View Payment Status'
        });
      }

      const paymentData = {
        id: payment.id,
        organization_id: payment.organization_id,
        company_name: org?.company_name || 'Unknown Organization',
        amount: payment.amount,
        status: payment.status,
        payment_type: payment.payment_type || 'registration',
        created_at: payment.created_at,
        is_read: false
      };

      setRecentPayments(prev => [paymentData, ...prev].slice(0, 20));

      const notificationMessage = `New ${payment.payment_type || 'payment'} of ₦${parseFloat(payment.amount).toLocaleString()} from ${org?.company_name || 'Unknown Organization'}`;
      
      const newNotification = {
        id: `payment_${payment.id}`,
        type: 'payment',
        subject: `New Payment Received - Pending Approval`,
        message: notificationMessage,
        recipients: 'Admin',
        sentAt: new Date().toISOString(),
        status: 'sent',
        isRead: false,
        createdAt: new Date().toISOString(),
        payment_id: payment.id,
        organization_id: payment.organization_id,
        amount: payment.amount,
        company_name: org?.company_name,
        email_sent: !!org?.email
      };

      setNotifications(prev => [newNotification, ...prev]);
      setUnreadCount(prev => prev + 1);

      showAlert('info', `💰 New payment received from ${org?.company_name || 'Unknown'}`);

    } catch (error) {
      console.error('Error handling new payment:', error);
    }
  };

  const handleNewRegistration = async (registration) => {
    try {
      const registrationData = {
        id: registration.id,
        company_name: registration.company_name || 'Unknown Organization',
        registration_number: registration.registration_number,
        email: registration.email,
        phone: registration.phone_number1,
        status: registration.status || 'pending',
        created_at: registration.created_at,
        is_read: false
      };

      await sendAdminRegistrationNotification(registration);

      if (registration.email) {
        // Send raw email with registration notification
        await sendRawEmail({
          toEmail: registration.email,
          companyName: registration.company_name,
          subject: `Registration Received - ${registration.company_name}`,
          message: `
Thank you for registering with KACCIMA.

Registration Details:
• Company Name: ${registration.company_name}
• Registration Number: ${registration.registration_number}
• Status: ${registration.status || 'Pending Review'}
• Date: ${new Date(registration.created_at).toLocaleString()}

Your registration is currently being reviewed. You will receive another notification once it is approved.

If you have any questions, please contact our support team.`,
          actionUrl: `${window.location.origin}/dashboard`,
          actionText: 'Track Registration Status'
        });
      }

      setRecentRegistrations(prev => [registrationData, ...prev].slice(0, 20));

      const notificationMessage = `New organization registration: ${registration.company_name || 'Unknown'} (${registration.registration_number || 'N/A'}) - Pending Approval`;
      
      const newNotification = {
        id: `registration_${registration.id}`,
        type: 'registration',
        subject: `New Registration - Pending Approval`,
        message: notificationMessage,
        recipients: 'Admin',
        sentAt: new Date().toISOString(),
        status: 'sent',
        isRead: false,
        createdAt: new Date().toISOString(),
        organization_id: registration.id,
        company_name: registration.company_name,
        registration_number: registration.registration_number,
        email_sent: !!registration.email
      };

      setNotifications(prev => [newNotification, ...prev]);
      setUnreadCount(prev => prev + 1);

      showAlert('info', `🏢 New registration: ${registration.company_name || 'Unknown'}`);

    } catch (error) {
      console.error('Error handling new registration:', error);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: orgsData, error: orgsError } = await supabase
        .from('organizations_registry')
        .select('*')
        .order('created_at', { ascending: false });

      if (orgsError) throw orgsError;
      setOrganizations(orgsData || []);

      const { data: adminPayments } = await supabase
        .from('admin_organization_payments')
        .select('*, organizations:organization_id(company_name, email, phone_number1)')
        .order('created_at', { ascending: false })
        .limit(10);

      const { data: payments } = await supabase
        .from('payments')
        .select('*, organizations:organization_id(company_name, email, phone_number1)')
        .order('created_at', { ascending: false })
        .limit(10);

      const allPayments = [...(adminPayments || []), ...(payments || [])]
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(0, 10);

      setRecentPayments(allPayments.map(p => ({
        id: p.id,
        organization_id: p.organization_id,
        company_name: p.organizations?.company_name || 'Unknown',
        amount: p.amount,
        status: p.status,
        payment_type: p.payment_type || 'registration',
        created_at: p.created_at,
        is_read: false
      })));

      const { data: registrations } = await supabase
        .from('organizations_registry')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      setRecentRegistrations(registrations?.map(r => ({
        id: r.id,
        company_name: r.company_name,
        registration_number: r.registration_number,
        email: r.email,
        phone: r.phone_number1,
        status: r.status,
        created_at: r.created_at,
        is_read: false
      })) || []);

      const combinedNotifications = [
        ...(allPayments || [])
          .filter(p => p.status !== 'completed' && p.status !== 'approved')
          .map(p => ({
            id: `payment_${p.id}`,
            type: 'payment',
            subject: 'New Payment - Pending Approval',
            message: `Payment of ₦${parseFloat(p.amount).toLocaleString()} from ${p.organizations?.company_name || 'Unknown'} - Pending Approval`,
            recipients: 'Admin',
            sentAt: p.created_at,
            status: 'sent',
            isRead: false,
            createdAt: p.created_at,
            payment_id: p.id,
            organization_id: p.organization_id,
            amount: p.amount,
            company_name: p.organizations?.company_name
          })),
        ...(registrations || [])
          .filter(r => r.status !== 'approved')
          .map(r => ({
            id: `registration_${r.id}`,
            type: 'registration',
            subject: 'New Registration - Pending Approval',
            message: `${r.company_name || 'Unknown'} registered (${r.registration_number || 'N/A'}) - Pending Approval`,
            recipients: 'Admin',
            sentAt: r.created_at,
            status: 'sent',
            isRead: false,
            createdAt: r.created_at,
            organization_id: r.id,
            company_name: r.company_name,
            registration_number: r.registration_number
          }))
      ];

      const sortedNotifications = combinedNotifications
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 50);

      setNotifications(sortedNotifications);
      setUnreadCount(sortedNotifications.filter(n => !n.isRead).length);

    } catch (error) {
      console.error('Error fetching data:', error);
      showAlert('error', 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = (notificationId) => {
    setNotifications(prev => prev.map(n => 
      n.id === notificationId ? { ...n, isRead: true } : n
    ));
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    setUnreadCount(0);
    showAlert('success', 'All notifications marked as read');
  };

  const handlePaymentClick = (payment) => {
    setSelectedPayment(payment);
    setPaymentDialogOpen(true);
  };

  const deleteNotification = (id) => {
    setNotifications(notifications.filter(n => n.id !== id));
    const deletedNotification = notifications.find(n => n.id === id);
    if (deletedNotification && !deletedNotification.isRead) {
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
    showAlert('success', 'Notification removed');
  };

  const resetForm = () => {
    setSubject('');
    setMessage('');
    setNotificationType('renewal');
    setSelectedMembers('all');
    setScheduleDate('');
    setScheduleTime('');
  };

  const handleSendNotification = async () => {
    if (!subject || !message) {
      showAlert('error', 'Please fill in all required fields');
      return;
    }

    setSending(true);
    try {
      let recipients = [];
      
      if (selectedMembers === 'all') {
        recipients = organizations;
      } else if (selectedMembers === 'active') {
        recipients = organizations.filter(m => m.status?.toLowerCase() === 'approved');
      } else if (selectedMembers === 'pending') {
        recipients = organizations.filter(m => m.status?.toLowerCase() === 'pending');
      } else if (selectedMembers === 'renewal') {
        recipients = organizations.filter(m => m.status?.toLowerCase() === 'approved');
      }

      if (recipients.length === 0) {
        showAlert('error', 'No recipients selected');
        setSending(false);
        return;
      }

      // Send raw email with the admin's custom message
      let emailCount = 0;
      for (const recipient of recipients) {
        if (recipient.email) {
          const result = await sendRawEmail({
            toEmail: recipient.email,
            companyName: recipient.company_name || 'Member',
            subject: subject,
            message: message,
            actionUrl: `${window.location.origin}/dashboard`,
            actionText: 'View Details'
          });
          if (result.success) {
            emailCount++;
          }
        }
      }

      // Save to database
      const notificationsToInsert = recipients.map(recipient => ({
        organization_id: recipient.id,
        type: notificationType,
        title: subject,
        message: message,
        category: notificationType === 'renewal' ? 'renewal' : 
                  notificationType === 'payment' ? 'payment' : 'general',
        action_url: notificationType === 'payment' ? '/payment' : 
                   notificationType === 'renewal' ? '/payment' : '/notifications',
        read: false,
        scheduled_for: scheduleDate && scheduleTime ? `${scheduleDate}T${scheduleTime}` : null,
        created_at: new Date().toISOString()
      }));

      const { data, error } = await supabase
        .from('organization_notifications')
        .insert(notificationsToInsert)
        .select();

      if (error) throw error;

      const newNotifications = data.map(notif => ({
        id: notif.id,
        type: notif.type,
        subject: notif.title,
        message: notif.message,
        recipients: recipients.length,
        scheduledFor: notif.scheduled_for,
        sentAt: notif.created_at,
        status: notif.scheduled_for ? 'scheduled' : 'sent',
        createdAt: notif.created_at,
        isRead: false
      }));

      setNotifications(prev => [...newNotifications, ...prev]);
      setUnreadCount(prev => prev + newNotifications.length);

      showAlert('success', `Notification ${scheduleDate ? 'scheduled' : 'sent'} successfully to ${recipients.length} recipients (${emailCount} emails sent)`);
      setDialogOpen(false);
      resetForm();

    } catch (error) {
      console.error('Error sending notification:', error);
      showAlert('error', 'Failed to send notification: ' + error.message);
    } finally {
      setSending(false);
    }
  };

  const getStatusColor = (status) => {
    switch(status?.toLowerCase()) {
      case 'approved':
      case 'completed':
        return '#28a745';
      case 'pending':
        return '#ffc107';
      case 'rejected':
      case 'failed':
        return '#dc3545';
      default:
        return '#6c757d';
    }
  };

  const formatCurrency = (amount) => {
    return `₦${parseFloat(amount || 0).toLocaleString()}`;
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
          
          <Box sx={{ flex: 1, bgcolor: '#f8f9fa', p: 3, borderRadius: '16px' }}>
            {/* Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
              <Box>
                <Typography 
                  variant="h4" 
                  sx={{ 
                    fontFamily: '"Poppins", sans-serif',
                    fontWeight: 700,
                    color: '#333',
                    mb: 1
                  }}
                >
                  Notifications
                </Typography>
                <Typography 
                  variant="body1" 
                  sx={{ 
                    fontFamily: '"Inter", sans-serif',
                    color: '#666'
                  }}
                >
                  Real-time updates on payments and registrations
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', gap: 2 }}>
                {unreadCount > 0 && (
                  <Button
                    variant="outlined"
                    onClick={markAllAsRead}
                    sx={{ borderColor: '#15e420', color: '#15e420' }}
                  >
                    Mark All Read ({unreadCount})
                  </Button>
                )}
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => setDialogOpen(true)}
                  sx={{ bgcolor: '#15e420', '&:hover': { bgcolor: '#12c21e' } }}
                >
                  New Notification
                </Button>
              </Box>
            </Box>

            {/* Stats */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
              <Grid item xs={12} md={3}>
                <StyledCard>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Avatar sx={{ bgcolor: '#15e420', width: 48, height: 48 }}>
                        <BusinessIcon />
                      </Avatar>
                      <Box>
                        <Typography variant="body2" sx={{ color: '#666' }}>
                          Total Orgs
                        </Typography>
                        <Typography variant="h4" sx={{ fontWeight: 700 }}>
                          {organizations.length}
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </StyledCard>
              </Grid>
              <Grid item xs={12} md={3}>
                <StyledCard>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Avatar sx={{ bgcolor: '#ffc107', width: 48, height: 48 }}>
                        <PersonAddIcon />
                      </Avatar>
                      <Box>
                        <Typography variant="body2" sx={{ color: '#666' }}>
                          Pending Registrations
                        </Typography>
                        <Typography variant="h4" sx={{ fontWeight: 700 }}>
                          {recentRegistrations.filter(r => r.status !== 'approved').length}
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </StyledCard>
              </Grid>
              <Grid item xs={12} md={3}>
                <StyledCard>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Avatar sx={{ bgcolor: '#2196f3', width: 48, height: 48 }}>
                        <ReceiptIcon />
                      </Avatar>
                      <Box>
                        <Typography variant="body2" sx={{ color: '#666' }}>
                          Pending Payments
                        </Typography>
                        <Typography variant="h4" sx={{ fontWeight: 700 }}>
                          {recentPayments.filter(p => p.status !== 'completed' && p.status !== 'approved').length}
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </StyledCard>
              </Grid>
              <Grid item xs={12} md={3}>
                <StyledCard>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Badge badgeContent={unreadCount} color="error">
                        <Avatar sx={{ bgcolor: '#ff6b6b', width: 48, height: 48 }}>
                          <NotificationsActiveIcon />
                        </Avatar>
                      </Badge>
                      <Box>
                        <Typography variant="body2" sx={{ color: '#666' }}>
                          Unread
                        </Typography>
                        <Typography variant="h4" sx={{ fontWeight: 700 }}>
                          {unreadCount}
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </StyledCard>
              </Grid>
            </Grid>

            {/* Recent Payments */}
            <StyledCard>
              <CardContent>
                <Typography variant="h6" sx={{ fontFamily: '"Poppins", sans-serif', mb: 2 }}>
                  Recent Payments
                </Typography>
                {recentPayments.length === 0 ? (
                  <Box sx={{ textAlign: 'center', py: 3 }}>
                    <PaymentIcon sx={{ fontSize: 48, color: '#ccc' }} />
                    <Typography color="textSecondary">No recent payments</Typography>
                  </Box>
                ) : (
                  <List>
                    {recentPayments.slice(0, 5).map((payment, index) => (
                      <React.Fragment key={payment.id}>
                        <ListItem button onClick={() => handlePaymentClick(payment)}>
                          <ListItemIcon>
                            <PaymentIcon sx={{ color: getStatusColor(payment.status) }} />
                          </ListItemIcon>
                          <ListItemText
                            primary={
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                                <Typography variant="subtitle2">{payment.company_name}</Typography>
                                <Chip
                                  label={payment.status}
                                  size="small"
                                  sx={{ 
                                    backgroundColor: getStatusColor(payment.status),
                                    color: 'white',
                                    height: 20, 
                                    fontSize: '0.7rem' 
                                  }}
                                />
                                <Chip
                                  label={payment.payment_type}
                                  size="small"
                                  variant="outlined"
                                  sx={{ height: 20, fontSize: '0.7rem' }}
                                />
                              </Box>
                            }
                            secondary={
                              <Box>
                                <Typography variant="body2">
                                  {formatCurrency(payment.amount)}
                                </Typography>
                                <Typography variant="caption" color="textSecondary">
                                  {new Date(payment.created_at).toLocaleString()}
                                </Typography>
                              </Box>
                            }
                          />
                        </ListItem>
                        {index < Math.min(recentPayments.length, 5) - 1 && <Divider />}
                      </React.Fragment>
                    ))}
                  </List>
                )}
              </CardContent>
            </StyledCard>

            {/* Recent Registrations */}
            <StyledCard>
              <CardContent>
                <Typography variant="h6" sx={{ fontFamily: '"Poppins", sans-serif', mb: 2 }}>
                  Recent Registrations
                </Typography>
                {recentRegistrations.length === 0 ? (
                  <Box sx={{ textAlign: 'center', py: 3 }}>
                    <PersonAddIcon sx={{ fontSize: 48, color: '#ccc' }} />
                    <Typography color="textSecondary">No recent registrations</Typography>
                  </Box>
                ) : (
                  <List>
                    {recentRegistrations.slice(0, 5).map((reg, index) => (
                      <React.Fragment key={reg.id}>
                        <ListItem>
                          <ListItemIcon>
                            <BusinessIcon sx={{ color: getStatusColor(reg.status) }} />
                          </ListItemIcon>
                          <ListItemText
                            primary={
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                                <Typography variant="subtitle2">{reg.company_name}</Typography>
                                <Chip
                                  label={reg.status}
                                  size="small"
                                  sx={{ 
                                    backgroundColor: getStatusColor(reg.status),
                                    color: 'white',
                                    height: 20, 
                                    fontSize: '0.7rem' 
                                  }}
                                />
                                <Chip
                                  label={reg.registration_number}
                                  size="small"
                                  variant="outlined"
                                  sx={{ height: 20, fontSize: '0.7rem' }}
                                />
                              </Box>
                            }
                            secondary={
                              <Box>
                                <Typography variant="body2">
                                  {reg.email} • {reg.phone}
                                </Typography>
                                <Typography variant="caption" color="textSecondary">
                                  {new Date(reg.created_at).toLocaleString()}
                                </Typography>
                              </Box>
                            }
                          />
                        </ListItem>
                        {index < Math.min(recentRegistrations.length, 5) - 1 && <Divider />}
                      </React.Fragment>
                    ))}
                  </List>
                )}
              </CardContent>
            </StyledCard>

            {/* All Notifications */}
            <StyledCard>
              <CardContent>
                <Typography variant="h6" sx={{ fontFamily: '"Poppins", sans-serif', mb: 2 }}>
                  All Notifications
                </Typography>
                
                {notifications.length === 0 ? (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <NotificationsActiveIcon sx={{ fontSize: 48, color: '#ccc', mb: 2 }} />
                    <Typography color="textSecondary">No notifications yet</Typography>
                  </Box>
                ) : (
                  <List>
                    {notifications.slice(0, 20).map((notification, index) => (
                      <React.Fragment key={notification.id}>
                        <NotificationItem 
                          unread={!notification.isRead}
                          onClick={() => markAsRead(notification.id)}
                        >
                          <ListItemIcon>
                            {notification.type === 'payment' ? <PaymentIcon sx={{ color: '#2196f3' }} /> :
                             notification.type === 'registration' ? <PersonAddIcon sx={{ color: '#15e420' }} /> :
                             notification.type === 'renewal' ? <ScheduleIcon sx={{ color: '#ffc107' }} /> :
                             <NotificationsActiveIcon sx={{ color: '#ff6b6b' }} />}
                          </ListItemIcon>
                          <ListItemText
                            primary={
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                                <Typography variant="subtitle2">{notification.subject}</Typography>
                                {!notification.isRead && (
                                  <Chip
                                    label="New"
                                    size="small"
                                    sx={{ 
                                      backgroundColor: '#15e420',
                                      color: 'white',
                                      height: 18, 
                                      fontSize: '0.6rem' 
                                    }}
                                  />
                                )}
                                <Chip
                                  label={notification.type}
                                  size="small"
                                  variant="outlined"
                                  sx={{ height: 18, fontSize: '0.6rem' }}
                                />
                                {notification.email_sent && (
                                  <Chip
                                    label="Email Sent"
                                    size="small"
                                    sx={{ 
                                      backgroundColor: '#e3f2fd',
                                      color: '#1976d2',
                                      height: 18, 
                                      fontSize: '0.6rem' 
                                    }}
                                  />
                                )}
                              </Box>
                            }
                            secondary={
                              <Box>
                                <Typography variant="body2" color="textSecondary">
                                  {notification.message}
                                </Typography>
                                <Box sx={{ display: 'flex', gap: 2, mt: 0.5 }}>
                                  <Typography variant="caption" color="textSecondary">
                                    {new Date(notification.createdAt || notification.sentAt).toLocaleString()}
                                  </Typography>
                                  {notification.amount && (
                                    <Typography variant="caption" color="textSecondary">
                                      Amount: {formatCurrency(notification.amount)}
                                    </Typography>
                                  )}
                                </Box>
                              </Box>
                            }
                          />
                          <IconButton edge="end" onClick={(e) => {
                            e.stopPropagation();
                            deleteNotification(notification.id);
                          }}>
                            <DeleteIcon />
                          </IconButton>
                        </NotificationItem>
                        {index < Math.min(notifications.length, 20) - 1 && <Divider />}
                      </React.Fragment>
                    ))}
                  </List>
                )}
              </CardContent>
            </StyledCard>
          </Box>
        </Box>
      </Container>

      {/* New Notification Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontFamily: '"Poppins", sans-serif' }}>
          Create Notification
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={3} sx={{ mt: 0 }}>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Notification Type</InputLabel>
                <Select
                  value={notificationType}
                  onChange={(e) => setNotificationType(e.target.value)}
                  label="Notification Type"
                >
                  <MenuItem value="renewal">Renewal Reminder</MenuItem>
                  <MenuItem value="payment">Payment Confirmation</MenuItem>
                  <MenuItem value="general">General Announcement</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Send To</InputLabel>
                <Select
                  value={selectedMembers}
                  onChange={(e) => setSelectedMembers(e.target.value)}
                  label="Send To"
                >
                  <MenuItem value="all">All Organizations ({organizations.length})</MenuItem>
                  <MenuItem value="active">Active Organizations ({organizations.filter(m => m.status?.toLowerCase() === 'approved').length})</MenuItem>
                  <MenuItem value="pending">Pending Organizations ({organizations.filter(m => m.status?.toLowerCase() === 'pending').length})</MenuItem>
                  <MenuItem value="renewal">Renewal Due (Next 30 days)</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                required
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                multiline
                rows={6}
                required
                placeholder="Type your message here. This will be sent as-is to the organizations."
              />
            </Grid>

            <Grid item xs={12}>
              <Typography variant="subtitle2" gutterBottom>
                Schedule (Optional)
              </Typography>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <TextField
                  type="date"
                  label="Date"
                  value={scheduleDate}
                  onChange={(e) => setScheduleDate(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  fullWidth
                />
                <TextField
                  type="time"
                  label="Time"
                  value={scheduleTime}
                  onChange={(e) => setScheduleTime(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  fullWidth
                />
              </Box>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleSendNotification}
            variant="contained"
            disabled={sending || !subject || !message}
            startIcon={sending ? <CircularProgress size={20} /> : <SendIcon />}
            sx={{ bgcolor: '#15e420', '&:hover': { bgcolor: '#12c21e' } }}
          >
            {sending ? 'Sending...' : scheduleDate ? 'Schedule' : 'Send Now'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Payment Details Dialog */}
      <Dialog open={paymentDialogOpen} onClose={() => setPaymentDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontFamily: '"Poppins", sans-serif' }}>
          Payment Details
        </DialogTitle>
        <DialogContent>
          {selectedPayment && (
            <Box sx={{ py: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Typography variant="caption" color="textSecondary">Organization</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    {selectedPayment.company_name}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="textSecondary">Amount</Typography>
                  <Typography variant="h6" sx={{ color: '#15e420', fontWeight: 700 }}>
                    {formatCurrency(selectedPayment.amount)}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="textSecondary">Status</Typography>
                  <Chip
                    label={selectedPayment.status}
                    sx={{ 
                      backgroundColor: getStatusColor(selectedPayment.status),
                      color: 'white'
                    }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="caption" color="textSecondary">Payment Type</Typography>
                  <Typography variant="body2">
                    {selectedPayment.payment_type || 'Registration'}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="caption" color="textSecondary">Date</Typography>
                  <Typography variant="body2">
                    {new Date(selectedPayment.created_at).toLocaleString()}
                  </Typography>
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPaymentDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default AdminNotifications;