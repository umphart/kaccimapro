import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import Sidebar from './Sidebar';
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
  Snackbar
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
  Verified as VerifiedIcon
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
    default:
      return <InfoIcon sx={{ color: '#17a2b8' }} />;
  }
};

const getTimeAgo = (timestamp) => {
  const now = new Date();
  const then = new Date(timestamp);
  const diff = Math.floor((now - then) / 1000); // seconds

  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)} minutes ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
  return `${Math.floor(diff / 86400)} days ago`;
};

const Notifications = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState({ open: false, type: 'success', message: '' });

  useEffect(() => {
    checkUser();
  }, []);

  useEffect(() => {
    if (user) {
      fetchNotifications();
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

  const fetchNotifications = async () => {
    try {
      // Mock notifications for now - replace with actual database query
      const mockNotifications = [
        {
          id: 1,
          type: 'registration',
          title: 'Registration Submitted',
          message: 'Your organization registration has been submitted successfully.',
          timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
          read: false
        },
        {
          id: 2,
          type: 'approval',
          title: 'Registration Approved',
          message: 'Your organization has been approved. Please proceed with payment.',
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
          read: true
        },
        {
          id: 3,
          type: 'payment',
          title: 'Payment Received',
          message: 'Your payment of ₦25,000 has been received and is being verified.',
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
          read: false
        },
        {
          id: 4,
          type: 'success',
          title: 'Payment Verified',
          message: 'Your payment has been verified. Your membership is now active.',
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
          read: true
        }
      ];

      setNotifications(mockNotifications);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      showAlert('error', 'Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = (id) => {
    setNotifications(prev =>
      prev.map(notif =>
        notif.id === id ? { ...notif, read: true } : notif
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev =>
      prev.map(notif => ({ ...notif, read: true }))
    );
    showAlert('success', 'All notifications marked as read');
  };

  const deleteNotification = (id) => {
    setNotifications(prev => prev.filter(notif => notif.id !== id));
    showAlert('success', 'Notification deleted');
  };

  const deleteAllRead = () => {
    setNotifications(prev => prev.filter(notif => !notif.read));
    showAlert('success', 'Read notifications cleared');
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress sx={{ color: '#15e420' }} />
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
          <Box sx={{ flex: 1 }}>
            <StyledPaper>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
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

              <Divider sx={{ mb: 3 }} />

              {notifications.length === 0 ? (
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
                  {notifications.map((notification) => (
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
                            </Box>
                          </Box>
                        }
                      />
                    </NotificationItem>
                  ))}
                </List>
              )}
            </StyledPaper>
          </Box>
        </Box>
      </Container>
    </>
  );
};

export default Notifications;