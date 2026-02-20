import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import Sidebar from './Sidebar';
import Layout from './Layout';
import {
  Box,
  Container,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemAvatar,
  Avatar,
  Chip,
  IconButton,
  Divider,
  Button,
  CircularProgress,
  Alert,
  Snackbar,
  Tab,
  Tabs
} from '@mui/material';
import {
  NotificationsActive as NotificationsActiveIcon,
  CheckCircle as CheckCircleIcon,
  Pending as PendingIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  Delete as DeleteIcon,
  DoneAll as DoneAllIcon,
  AccessTime as AccessTimeIcon,
  Payment as PaymentIcon,
  Business as BusinessIcon,
  Verified as VerifiedIcon,
  Description as DescriptionIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  borderRadius: '16px',
  boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)'
}));

const NotificationItem = styled(ListItem)(({ read }) => ({
  backgroundColor: read ? 'transparent' : '#e8f5e9',
  borderRadius: '8px',
  marginBottom: '8px',
  transition: 'all 0.3s',
  '&:hover': {
    backgroundColor: read ? '#f5f5f5' : '#d4edda',
    transform: 'translateX(4px)'
  }
}));

const TabPanel = ({ children, value, index, ...other }) => (
  <div
    role="tabpanel"
    hidden={value !== index}
    id={`notification-tabpanel-${index}`}
    {...other}
  >
    {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
  </div>
);

const getNotificationIcon = (type) => {
  switch(type) {
    case 'success':
      return <CheckCircleIcon sx={{ color: '#28a745' }} />;
    case 'pending':
      return <PendingIcon sx={{ color: '#ffc107' }} />;
    case 'error':
      return <ErrorIcon sx={{ color: '#dc3545' }} />;
    case 'payment':
      return <PaymentIcon sx={{ color: '#15e420' }} />;
    case 'registration':
      return <BusinessIcon sx={{ color: '#17a2b8' }} />;
    case 'approval':
      return <VerifiedIcon sx={{ color: '#15e420' }} />;
    case 'document':
      return <DescriptionIcon sx={{ color: '#15e420' }} />;
    default:
      return <InfoIcon sx={{ color: '#17a2b8' }} />;
  }
};

const getTimeAgo = (timestamp) => {
  if (!timestamp) return 'Unknown';
  
  const now = new Date();
  const then = new Date(timestamp);
  const diff = Math.floor((now - then) / 1000); // seconds

  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)} minutes ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
  if (diff < 2592000) return `${Math.floor(diff / 86400)} days ago`;
  if (diff < 31536000) return `${Math.floor(diff / 2592000)} months ago`;
  return `${Math.floor(diff / 31536000)} years ago`;
};

const Notifications = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [organization, setOrganization] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [alert, setAlert] = useState({ open: false, type: 'success', message: '' });
  const [tabValue, setTabValue] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);

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
      const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching organization:', error);
      }

      if (data) {
        setOrganization(data);
      }
      
      // Fetch notifications after we have org data
      await fetchNotifications(data);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const fetchNotifications = async (orgData = organization) => {
    setLoading(true);
    try {
      const notificationsList = [];

      // 1. Check organization status notification
      if (orgData) {
        if (orgData.status === 'pending') {
          notificationsList.push({
            id: 'org-pending',
            type: 'pending',
            title: 'Registration Pending Review',
            message: 'Your organization registration is currently under review by our team.',
            timestamp: orgData.updated_at || orgData.created_at,
            read: false,
            category: 'registration',
            actionUrl: '/organization',
            icon: <BusinessIcon />
          });
        } else if (orgData.status === 'approved') {
          notificationsList.push({
            id: 'org-approved',
            type: 'success',
            title: 'Registration Approved!',
            message: 'Your organization has been approved. Please proceed with payment to activate your membership.',
            timestamp: orgData.updated_at,
            read: false,
            category: 'registration',
            actionUrl: '/payment',
            icon: <VerifiedIcon />
          });
        } else if (orgData.status === 'rejected') {
          notificationsList.push({
            id: 'org-rejected',
            type: 'error',
            title: 'Registration Rejected',
            message: 'Your organization registration has been rejected. Please contact support for more information.',
            timestamp: orgData.updated_at,
            read: false,
            category: 'registration',
            actionUrl: '/organization',
            icon: <ErrorIcon />
          });
        }
      }

      // 2. Fetch payment notifications
      if (orgData?.id) {
        const { data: payments, error: paymentsError } = await supabase
          .from('payments')
          .select('*')
          .eq('organization_id', orgData.id)
          .order('created_at', { ascending: false });

        if (!paymentsError && payments) {
          payments.forEach((payment, index) => {
            if (payment.status === 'pending') {
              notificationsList.push({
                id: `payment-pending-${payment.id}`,
                type: 'pending',
                title: 'Payment Pending Verification',
                message: `Your payment of ₦${payment.amount?.toLocaleString()} is being verified.`,
                timestamp: payment.created_at,
                read: false,
                category: 'payment',
                actionUrl: '/payment',
                icon: <PaymentIcon />
              });
            } else if (payment.status === 'approved') {
              notificationsList.push({
                id: `payment-approved-${payment.id}`,
                type: 'success',
                title: 'Payment Approved!',
                message: `Your payment of ₦${payment.amount?.toLocaleString()} has been verified.`,
                timestamp: payment.updated_at,
                read: false,
                category: 'payment',
                actionUrl: '/dashboard',
                icon: <CheckCircleIcon />
              });
            } else if (payment.status === 'rejected') {
              notificationsList.push({
                id: `payment-rejected-${payment.id}`,
                type: 'error',
                title: 'Payment Rejected',
                message: `Your payment of ₦${payment.amount?.toLocaleString()} could not be verified. Please upload a new receipt.`,
                timestamp: payment.updated_at,
                read: false,
                category: 'payment',
                actionUrl: '/payment',
                icon: <ErrorIcon />
              });
            }

            // Add renewal reminder if payment was approved and it's near renewal date
            if (payment.status === 'approved' && payment.payment_type === 'first') {
              const paymentDate = new Date(payment.created_at);
              const renewalDate = new Date(paymentDate.getFullYear() + 1, 0, 1); // January 1st next year
              const now = new Date();
              const daysUntilRenewal = Math.floor((renewalDate - now) / (1000 * 60 * 60 * 24));

              if (daysUntilRenewal <= 30 && daysUntilRenewal > 0) {
                notificationsList.push({
                  id: `renewal-reminder-${payment.id}`,
                  type: 'pending',
                  title: 'Renewal Reminder',
                  message: `Your membership renewal is due in ${daysUntilRenewal} days (January 1, ${renewalDate.getFullYear()}).`,
                  timestamp: new Date().toISOString(),
                  read: false,
                  category: 'renewal',
                  actionUrl: '/payment',
                  icon: <AccessTimeIcon />
                });
              }
            }
          });
        }
      }

      // 3. Document upload notifications
      if (orgData) {
        const documentFields = [
          { key: 'cover_letter_path', name: 'Cover Letter' },
          { key: 'memorandum_path', name: 'Memorandum' },
          { key: 'registration_cert_path', name: 'Registration Certificate' },
          { key: 'incorporation_cert_path', name: 'Incorporation Certificate' },
          { key: 'premises_cert_path', name: 'Premises Certificate' },
          { key: 'company_logo_path', name: 'Company Logo' },
          { key: 'form_c07_path', name: 'Form C07' },
          { key: 'id_document_path', name: 'ID Document' }
        ];

        documentFields.forEach((field, index) => {
          if (orgData[field.key]) {
            // Check if document was recently uploaded (within last 7 days)
            const uploadDate = new Date(orgData.updated_at); // You might want to track actual upload dates
            const now = new Date();
            const daysSinceUpload = Math.floor((now - uploadDate) / (1000 * 60 * 60 * 24));

            if (daysSinceUpload <= 7) {
              notificationsList.push({
                id: `doc-upload-${field.key}`,
                type: 'info',
                title: 'Document Uploaded',
                message: `Your ${field.name} has been uploaded successfully.`,
                timestamp: orgData.updated_at,
                read: false,
                category: 'document',
                actionUrl: '/documents',
                icon: <DescriptionIcon />
              });
            }
          }
        });
      }

      // 4. Check for missing documents
      if (orgData && orgData.status === 'pending') {
        const documentFields = [
          { key: 'cover_letter_path', name: 'Cover Letter', required: true },
          { key: 'memorandum_path', name: 'Memorandum', required: true },
          { key: 'registration_cert_path', name: 'Registration Certificate', required: true },
          { key: 'incorporation_cert_path', name: 'Incorporation Certificate', required: true },
          { key: 'premises_cert_path', name: 'Premises Certificate', required: true },
          { key: 'company_logo_path', name: 'Company Logo', required: true },
          { key: 'form_c07_path', name: 'Form C07', required: true },
          { key: 'id_document_path', name: 'ID Document', required: true }
        ];

        const missingDocs = documentFields.filter(field => !orgData[field.key]);
        
        if (missingDocs.length > 0) {
          notificationsList.push({
            id: 'missing-docs',
            type: 'error',
            title: 'Missing Documents',
            message: `You have ${missingDocs.length} required document(s) missing. Please upload them to complete your registration.`,
            timestamp: new Date().toISOString(),
            read: false,
            category: 'document',
            actionUrl: '/documents',
            icon: <ErrorIcon />
          });
        }
      }

      // Sort by timestamp (newest first)
      notificationsList.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

      // Load read status from localStorage
      const readStatus = JSON.parse(localStorage.getItem('notificationReadStatus') || '{}');
      const updatedNotifications = notificationsList.map(notif => ({
        ...notif,
        read: readStatus[notif.id] || false
      }));

      setNotifications(updatedNotifications);
      
      // Calculate unread count
      const unread = updatedNotifications.filter(n => !n.read).length;
      setUnreadCount(unread);

    } catch (error) {
      console.error('Error fetching notifications:', error);
      showAlert('error', 'Failed to load notifications');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchNotifications();
  };

  const markAsRead = (id) => {
    const updatedNotifications = notifications.map(notif =>
      notif.id === id ? { ...notif, read: true } : notif
    );
    setNotifications(updatedNotifications);
    
    // Save to localStorage
    const readStatus = JSON.parse(localStorage.getItem('notificationReadStatus') || '{}');
    readStatus[id] = true;
    localStorage.setItem('notificationReadStatus', JSON.stringify(readStatus));
    
    // Update unread count
    setUnreadCount(updatedNotifications.filter(n => !n.read).length);
  };

  const markAllAsRead = () => {
    const updatedNotifications = notifications.map(notif => ({ ...notif, read: true }));
    setNotifications(updatedNotifications);
    
    // Save to localStorage
    const readStatus = {};
    notifications.forEach(notif => {
      readStatus[notif.id] = true;
    });
    localStorage.setItem('notificationReadStatus', JSON.stringify(readStatus));
    
    setUnreadCount(0);
    showAlert('success', 'All notifications marked as read');
  };

  const deleteNotification = (id) => {
    const updatedNotifications = notifications.filter(notif => notif.id !== id);
    setNotifications(updatedNotifications);
    
    // Update unread count
    setUnreadCount(updatedNotifications.filter(n => !n.read).length);
    showAlert('success', 'Notification deleted');
  };

  const deleteAllRead = () => {
    const updatedNotifications = notifications.filter(notif => !notif.read);
    setNotifications(updatedNotifications);
    
    // Update localStorage
    const readStatus = JSON.parse(localStorage.getItem('notificationReadStatus') || '{}');
    notifications.forEach(notif => {
      if (notif.read) {
        delete readStatus[notif.id];
      }
    });
    localStorage.setItem('notificationReadStatus', JSON.stringify(readStatus));
    
    showAlert('success', 'Read notifications cleared');
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleNotificationClick = (notification) => {
    markAsRead(notification.id);
    if (notification.actionUrl) {
      navigate(notification.actionUrl);
    }
  };

  const filteredNotifications = notifications.filter(notif => {
    if (tabValue === 0) return true; // All
    if (tabValue === 1) return notif.category === 'registration';
    if (tabValue === 2) return notif.category === 'payment';
    if (tabValue === 3) return notif.category === 'document';
    if (tabValue === 4) return notif.category === 'renewal';
    return true;
  });

  // Consistent loading state
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

      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', gap: 3 }}>
          {/* Sidebar */}
          <Sidebar />

          {/* Main Content */}
          <Box sx={{ flex: 1, bgcolor: '#f8f9fa', p: 3, borderRadius: '16px' }}>
            <StyledPaper>
              {/* Header with Refresh Button */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <NotificationsActiveIcon sx={{ color: '#15e420', fontSize: 32 }} />
                  <Typography variant="h5" sx={{ fontWeight: 700, color: '#333' }}>
                    Notifications
                  </Typography>
                  {unreadCount > 0 && (
                    <Chip
                      label={`${unreadCount} new`}
                      size="small"
                      sx={{
                        backgroundColor: '#15e420',
                        color: 'white',
                        fontWeight: 600
                      }}
                    />
                  )}
                </Box>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <IconButton 
                    onClick={handleRefresh} 
                    disabled={refreshing}
                    sx={{ color: '#15e420' }}
                  >
                    <RefreshIcon />
                  </IconButton>
                  <Button
                    startIcon={<DoneAllIcon />}
                    onClick={markAllAsRead}
                    disabled={unreadCount === 0}
                    size="small"
                    sx={{ color: '#15e420' }}
                  >
                    Mark all read
                  </Button>
                  <Button
                    startIcon={<DeleteIcon />}
                    onClick={deleteAllRead}
                    disabled={notifications.filter(n => n.read).length === 0}
                    size="small"
                    sx={{ color: '#dc3545' }}
                  >
                    Clear read
                  </Button>
                </Box>
              </Box>

              {/* Tabs */}
              <Tabs 
                value={tabValue} 
                onChange={handleTabChange}
                sx={{
                  borderBottom: 1,
                  borderColor: 'divider',
                  '& .MuiTab-root.Mui-selected': {
                    color: '#15e420'
                  },
                  '& .MuiTabs-indicator': {
                    backgroundColor: '#15e420'
                  }
                }}
              >
                <Tab label="All" />
                <Tab label="Registration" />
                <Tab label="Payments" />
                <Tab label="Documents" />
                <Tab label="Renewals" />
              </Tabs>

              {/* All Notifications Tab */}
              <TabPanel value={tabValue} index={0}>
                {filteredNotifications.length === 0 ? (
                  <Box sx={{ textAlign: 'center', py: 8 }}>
                    <NotificationsActiveIcon sx={{ fontSize: 64, color: '#ccc', mb: 2 }} />
                    <Typography variant="h6" sx={{ color: '#666', mb: 1 }}>
                      No Notifications
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#999' }}>
                      You're all caught up!
                    </Typography>
                  </Box>
                ) : (
                  <List>
                    {filteredNotifications.map((notification) => (
                      <NotificationItem
                        key={notification.id}
                        read={notification.read}
                        secondaryAction={
                          <Box>
                            <IconButton
                              edge="end"
                              onClick={() => markAsRead(notification.id)}
                              disabled={notification.read}
                              sx={{ mr: 1, color: '#15e420' }}
                            >
                              <DoneAllIcon />
                            </IconButton>
                            <IconButton
                              edge="end"
                              onClick={() => deleteNotification(notification.id)}
                              sx={{ color: '#dc3545' }}
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Box>
                        }
                        onClick={() => handleNotificationClick(notification)}
                        sx={{ cursor: 'pointer' }}
                      >
                        <ListItemAvatar>
                          <Avatar sx={{ bgcolor: 'transparent' }}>
                            {getNotificationIcon(notification.type)}
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={
                            <Typography
                              variant="subtitle1"
                              sx={{
                                fontWeight: notification.read ? 400 : 600,
                                color: notification.read ? '#666' : '#333'
                              }}
                            >
                              {notification.title}
                            </Typography>
                          }
                          secondary={
                            <Box>
                              <Typography
                                variant="body2"
                                sx={{
                                  color: '#666',
                                  mb: 0.5
                                }}
                              >
                                {notification.message}
                              </Typography>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <AccessTimeIcon sx={{ fontSize: 14, color: '#999' }} />
                                <Typography variant="caption" sx={{ color: '#999' }}>
                                  {getTimeAgo(notification.timestamp)}
                                </Typography>
                                <Chip
                                  label={notification.category}
                                  size="small"
                                  sx={{
                                    height: 20,
                                    fontSize: '10px',
                                    backgroundColor: 
                                      notification.category === 'payment' ? '#e3f2fd' :
                                      notification.category === 'registration' ? '#e8f5e9' :
                                      notification.category === 'document' ? '#fff3e0' : '#f3e5f5',
                                    color: 
                                      notification.category === 'payment' ? '#1976d2' :
                                      notification.category === 'registration' ? '#2e7d32' :
                                      notification.category === 'document' ? '#ed6c02' : '#9c27b0'
                                  }}
                                />
                              </Box>
                            </Box>
                          }
                        />
                      </NotificationItem>
                    ))}
                  </List>
                )}
              </TabPanel>

              {/* Registration Tab */}
              <TabPanel value={tabValue} index={1}>
                {filteredNotifications.length === 0 ? (
                  <Box sx={{ textAlign: 'center', py: 8 }}>
                    <BusinessIcon sx={{ fontSize: 64, color: '#ccc', mb: 2 }} />
                    <Typography variant="h6" sx={{ color: '#666' }}>
                      No registration notifications
                    </Typography>
                  </Box>
                ) : (
                  <List>
                    {filteredNotifications.map((notification) => (
                      <NotificationItem
                        key={notification.id}
                        read={notification.read}
                        secondaryAction={
                          <Box>
                            <IconButton
                              edge="end"
                              onClick={() => markAsRead(notification.id)}
                              disabled={notification.read}
                              sx={{ mr: 1, color: '#15e420' }}
                            >
                              <DoneAllIcon />
                            </IconButton>
                            <IconButton
                              edge="end"
                              onClick={() => deleteNotification(notification.id)}
                              sx={{ color: '#dc3545' }}
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Box>
                        }
                        onClick={() => handleNotificationClick(notification)}
                        sx={{ cursor: 'pointer' }}
                      >
                        <ListItemAvatar>
                          <Avatar sx={{ bgcolor: 'transparent' }}>
                            {getNotificationIcon(notification.type)}
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={
                            <Typography
                              variant="subtitle1"
                              sx={{
                                fontWeight: notification.read ? 400 : 600,
                                color: notification.read ? '#666' : '#333'
                              }}
                            >
                              {notification.title}
                            </Typography>
                          }
                          secondary={
                            <Box>
                              <Typography variant="body2" sx={{ color: '#666', mb: 0.5 }}>
                                {notification.message}
                              </Typography>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <AccessTimeIcon sx={{ fontSize: 14, color: '#999' }} />
                                <Typography variant="caption" sx={{ color: '#999' }}>
                                  {getTimeAgo(notification.timestamp)}
                                </Typography>
                              </Box>
                            </Box>
                          }
                        />
                      </NotificationItem>
                    ))}
                  </List>
                )}
              </TabPanel>

              {/* Payments Tab */}
              <TabPanel value={tabValue} index={2}>
                {filteredNotifications.length === 0 ? (
                  <Box sx={{ textAlign: 'center', py: 8 }}>
                    <PaymentIcon sx={{ fontSize: 64, color: '#ccc', mb: 2 }} />
                    <Typography variant="h6" sx={{ color: '#666' }}>
                      No payment notifications
                    </Typography>
                  </Box>
                ) : (
                  <List>
                    {filteredNotifications.map((notification) => (
                      <NotificationItem
                        key={notification.id}
                        read={notification.read}
                        secondaryAction={
                          <Box>
                            <IconButton
                              edge="end"
                              onClick={() => markAsRead(notification.id)}
                              disabled={notification.read}
                              sx={{ mr: 1, color: '#15e420' }}
                            >
                              <DoneAllIcon />
                            </IconButton>
                            <IconButton
                              edge="end"
                              onClick={() => deleteNotification(notification.id)}
                              sx={{ color: '#dc3545' }}
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Box>
                        }
                        onClick={() => handleNotificationClick(notification)}
                        sx={{ cursor: 'pointer' }}
                      >
                        <ListItemAvatar>
                          <Avatar sx={{ bgcolor: 'transparent' }}>
                            {getNotificationIcon(notification.type)}
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={
                            <Typography
                              variant="subtitle1"
                              sx={{
                                fontWeight: notification.read ? 400 : 600,
                                color: notification.read ? '#666' : '#333'
                              }}
                            >
                              {notification.title}
                            </Typography>
                          }
                          secondary={
                            <Box>
                              <Typography variant="body2" sx={{ color: '#666', mb: 0.5 }}>
                                {notification.message}
                              </Typography>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <AccessTimeIcon sx={{ fontSize: 14, color: '#999' }} />
                                <Typography variant="caption" sx={{ color: '#999' }}>
                                  {getTimeAgo(notification.timestamp)}
                                </Typography>
                              </Box>
                            </Box>
                          }
                        />
                      </NotificationItem>
                    ))}
                  </List>
                )}
              </TabPanel>

              {/* Documents Tab */}
              <TabPanel value={tabValue} index={3}>
                {filteredNotifications.length === 0 ? (
                  <Box sx={{ textAlign: 'center', py: 8 }}>
                    <DescriptionIcon sx={{ fontSize: 64, color: '#ccc', mb: 2 }} />
                    <Typography variant="h6" sx={{ color: '#666' }}>
                      No document notifications
                    </Typography>
                  </Box>
                ) : (
                  <List>
                    {filteredNotifications.map((notification) => (
                      <NotificationItem
                        key={notification.id}
                        read={notification.read}
                        secondaryAction={
                          <Box>
                            <IconButton
                              edge="end"
                              onClick={() => markAsRead(notification.id)}
                              disabled={notification.read}
                              sx={{ mr: 1, color: '#15e420' }}
                            >
                              <DoneAllIcon />
                            </IconButton>
                            <IconButton
                              edge="end"
                              onClick={() => deleteNotification(notification.id)}
                              sx={{ color: '#dc3545' }}
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Box>
                        }
                        onClick={() => handleNotificationClick(notification)}
                        sx={{ cursor: 'pointer' }}
                      >
                        <ListItemAvatar>
                          <Avatar sx={{ bgcolor: 'transparent' }}>
                            {getNotificationIcon(notification.type)}
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={
                            <Typography
                              variant="subtitle1"
                              sx={{
                                fontWeight: notification.read ? 400 : 600,
                                color: notification.read ? '#666' : '#333'
                              }}
                            >
                              {notification.title}
                            </Typography>
                          }
                          secondary={
                            <Box>
                              <Typography variant="body2" sx={{ color: '#666', mb: 0.5 }}>
                                {notification.message}
                              </Typography>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <AccessTimeIcon sx={{ fontSize: 14, color: '#999' }} />
                                <Typography variant="caption" sx={{ color: '#999' }}>
                                  {getTimeAgo(notification.timestamp)}
                                </Typography>
                              </Box>
                            </Box>
                          }
                        />
                      </NotificationItem>
                    ))}
                  </List>
                )}
              </TabPanel>

              {/* Renewals Tab */}
              <TabPanel value={tabValue} index={4}>
                {filteredNotifications.length === 0 ? (
                  <Box sx={{ textAlign: 'center', py: 8 }}>
                    <AccessTimeIcon sx={{ fontSize: 64, color: '#ccc', mb: 2 }} />
                    <Typography variant="h6" sx={{ color: '#666' }}>
                      No renewal notifications
                    </Typography>
                  </Box>
                ) : (
                  <List>
                    {filteredNotifications.map((notification) => (
                      <NotificationItem
                        key={notification.id}
                        read={notification.read}
                        secondaryAction={
                          <Box>
                            <IconButton
                              edge="end"
                              onClick={() => markAsRead(notification.id)}
                              disabled={notification.read}
                              sx={{ mr: 1, color: '#15e420' }}
                            >
                              <DoneAllIcon />
                            </IconButton>
                            <IconButton
                              edge="end"
                              onClick={() => deleteNotification(notification.id)}
                              sx={{ color: '#dc3545' }}
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Box>
                        }
                        onClick={() => handleNotificationClick(notification)}
                        sx={{ cursor: 'pointer' }}
                      >
                        <ListItemAvatar>
                          <Avatar sx={{ bgcolor: 'transparent' }}>
                            {getNotificationIcon(notification.type)}
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={
                            <Typography
                              variant="subtitle1"
                              sx={{
                                fontWeight: notification.read ? 400 : 600,
                                color: notification.read ? '#666' : '#333'
                              }}
                            >
                              {notification.title}
                            </Typography>
                          }
                          secondary={
                            <Box>
                              <Typography variant="body2" sx={{ color: '#666', mb: 0.5 }}>
                                {notification.message}
                              </Typography>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <AccessTimeIcon sx={{ fontSize: 14, color: '#999' }} />
                                <Typography variant="caption" sx={{ color: '#999' }}>
                                  {getTimeAgo(notification.timestamp)}
                                </Typography>
                              </Box>
                            </Box>
                          }
                        />
                      </NotificationItem>
                    ))}
                  </List>
                )}
              </TabPanel>
            </StyledPaper>
          </Box>
        </Box>
      </Container>
    </>
  );
};

export default Notifications;