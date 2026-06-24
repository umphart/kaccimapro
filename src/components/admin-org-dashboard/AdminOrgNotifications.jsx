// components/admin-org-dashboard/AdminOrgNotifications.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '../../supabaseClient';
import {
  Box,
  Container,
  Paper,
  Typography,
  CircularProgress,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Button,
  Chip,
  Alert,
  Snackbar,
  Tabs,
  Tab,
  Badge,
  Divider
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  Payment as PaymentIcon,
  Description as DescriptionIcon,
  Verified as VerifiedIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  CheckCircle as CheckCircleIcon,
  Delete as DeleteIcon,
  MarkEmailRead as MarkReadIcon,
  ArrowBack as ArrowBackIcon
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import AdminOrgSidebar from './AdminOrgSidebar';

const NotificationsContainer = styled(motion.div)({
  padding: '2rem',
  fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif"
});

const AdminOrgNotifications = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState({ open: false, type: 'success', message: '' });
  const [organization, setOrganization] = useState(null);
  const [membershipStatus, setMembershipStatus] = useState('pending');
  const [notifications, setNotifications] = useState([]);
  const [tabValue, setTabValue] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    fetchNotifications();
    setupRealtimeSubscription();
  }, []);

  const showAlert = useCallback((type, message) => {
    setAlert({ open: true, type, message });
  }, []);

  const setupRealtimeSubscription = () => {
    if (!organization?.id) return;

    const subscription = supabase
      .channel('admin_org_notifications_page')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'organization_notifications',
          filter: `organization_id=eq.${organization.id}`
        },
        () => {
          fetchNotifications();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  };

  const fetchNotifications = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/login');
        return;
      }

      let orgData = null;
      
      if (user.user_metadata?.organization_id) {
        const { data } = await supabase
          .from('organizations_registry')
          .select('*')
          .eq('id', user.user_metadata.organization_id)
          .maybeSingle();
        if (data) orgData = data;
      }

      if (!orgData && user.email) {
        const { data } = await supabase
          .from('organizations_registry')
          .select('*')
          .eq('email', user.email)
          .maybeSingle();
        if (data) orgData = data;
      }

      if (!orgData) {
        const { data } = await supabase
          .from('organizations_registry')
          .select('*')
          .eq('created_by', user.id)
          .maybeSingle();
        if (data) orgData = data;
      }

      if (orgData) {
        setOrganization(orgData);
        setMembershipStatus(orgData.status || 'pending');

        const { data: notifData, error } = await supabase
          .from('organization_notifications')
          .select('*')
          .eq('organization_id', orgData.id)
          .order('created_at', { ascending: false });

        if (notifData) {
          setNotifications(notifData);
          setUnreadCount(notifData.filter(n => !n.read).length);
        }
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
      showAlert('error', 'Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (notificationId) => {
    try {
      const { error } = await supabase
        .from('organization_notifications')
        .update({ read: true })
        .eq('id', notificationId);

      if (error) throw error;
      fetchNotifications();
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const { error } = await supabase
        .from('organization_notifications')
        .update({ read: true })
        .eq('organization_id', organization.id)
        .eq('read', false);

      if (error) throw error;
      fetchNotifications();
      showAlert('success', 'All notifications marked as read');
    } catch (error) {
      console.error('Error marking all as read:', error);
      showAlert('error', 'Failed to update notifications');
    }
  };

  const handleDeleteNotification = async (notificationId) => {
    try {
      const { error } = await supabase
        .from('organization_notifications')
        .delete()
        .eq('id', notificationId);

      if (error) throw error;
      fetchNotifications();
      showAlert('success', 'Notification deleted');
    } catch (error) {
      console.error('Error deleting notification:', error);
      showAlert('error', 'Failed to delete notification');
    }
  };

  const getNotificationIcon = (type) => {
    switch(type) {
      case 'payment':
        return <PaymentIcon />;
      case 'document':
        return <DescriptionIcon />;
      case 'status':
        return <VerifiedIcon />;
      case 'warning':
        return <WarningIcon />;
      case 'success':
        return <CheckCircleIcon />;
      default:
        return <InfoIcon />;
    }
  };

  const getNotificationColor = (type) => {
    switch(type) {
      case 'payment': return '#15e420';
      case 'document': return '#2196f3';
      case 'status': return '#ff9800';
      case 'warning': return '#f44336';
      case 'success': return '#4caf50';
      default: return '#666';
    }
  };

  const formatTimeAgo = (date) => {
    if (!date) return '';
    const diff = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
    return new Date(date).toLocaleDateString();
  };

  const filteredNotifications = tabValue === 0 
    ? notifications 
    : tabValue === 1 
      ? notifications.filter(n => !n.read)
      : notifications.filter(n => n.read);

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
        onClose={() => setAlert(prev => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert onClose={() => setAlert(prev => ({ ...prev, open: false }))} severity={alert.type}>
          {alert.message}
        </Alert>
      </Snackbar>

      <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#f5f7fa' }}>
        <AdminOrgSidebar organization={organization} membershipStatus={membershipStatus} />
        
        <Box sx={{ flex: 1, overflow: 'auto' }}>
          <Container maxWidth="md">
            <NotificationsContainer
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Paper sx={{ p: 3, borderRadius: '16px', mb: 3 }}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                  <Box display="flex" alignItems="center" gap={2}>
                    <Button
                      startIcon={<ArrowBackIcon />}
                      onClick={() => navigate('/admin-org-dashboard')}
                      sx={{ color: '#15e420' }}
                    >
                      Back
                    </Button>
                    <Typography variant="h5" sx={{ fontWeight: 700 }}>
                      Notifications
                      {unreadCount > 0 && (
                        <Chip
                          label={unreadCount}
                          size="small"
                          color="error"
                          sx={{ ml: 1 }}
                        />
                      )}
                    </Typography>
                  </Box>
                  {unreadCount > 0 && (
                    <Button
                      startIcon={<MarkReadIcon />}
                      onClick={handleMarkAllAsRead}
                      sx={{ color: '#15e420' }}
                    >
                      Mark All as Read
                    </Button>
                  )}
                </Box>

                <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)} sx={{ mb: 2 }}>
                  <Tab label={`All (${notifications.length})`} />
                  <Tab label={`Unread (${notifications.filter(n => !n.read).length})`} />
                  <Tab label={`Read (${notifications.filter(n => n.read).length})`} />
                </Tabs>

                {filteredNotifications.length === 0 ? (
                  <Box textAlign="center" py={6}>
                    <NotificationsIcon sx={{ fontSize: 64, color: '#ccc' }} />
                    <Typography variant="h6" sx={{ mt: 2, color: '#999' }}>
                      No notifications
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      You're all caught up!
                    </Typography>
                  </Box>
                ) : (
                  <List>
                    {filteredNotifications.map((notification, index) => (
                      <React.Fragment key={notification.id}>
                        <ListItem
                          sx={{
                            bgcolor: notification.read ? 'transparent' : '#f0fdf0',
                            borderRadius: '12px',
                            mb: 1,
                            '&:hover': { bgcolor: '#f5f5f5' }
                          }}
                        >
                          <ListItemIcon>
                            <Box
                              sx={{
                                width: 40,
                                height: 40,
                                borderRadius: '12px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                bgcolor: `${getNotificationColor(notification.type)}15`,
                                color: getNotificationColor(notification.type)
                              }}
                            >
                              {getNotificationIcon(notification.type)}
                            </Box>
                          </ListItemIcon>
                          <ListItemText
                            primary={
                              <Typography variant="body2" sx={{ fontWeight: notification.read ? 400 : 600 }}>
                                {notification.title}
                              </Typography>
                            }
                            secondary={
                              <>
                                <Typography variant="caption" color="textSecondary">
                                  {notification.message}
                                </Typography>
                                <Typography variant="caption" display="block" color="textSecondary">
                                  {formatTimeAgo(notification.created_at)}
                                </Typography>
                              </>
                            }
                          />
                          <ListItemSecondaryAction>
                            {!notification.read && (
                              <IconButton
                                size="small"
                                onClick={() => handleMarkAsRead(notification.id)}
                                sx={{ color: '#15e420' }}
                              >
                                <MarkReadIcon />
                              </IconButton>
                            )}
                            <IconButton
                              size="small"
                              onClick={() => handleDeleteNotification(notification.id)}
                              sx={{ color: '#dc3545' }}
                            >
                              <DeleteIcon />
                            </IconButton>
                          </ListItemSecondaryAction>
                        </ListItem>
                        {index < filteredNotifications.length - 1 && <Divider />}
                      </React.Fragment>
                    ))}
                  </List>
                )}
              </Paper>
            </NotificationsContainer>
          </Container>
        </Box>
      </Box>
    </>
  );
};

export default AdminOrgNotifications;