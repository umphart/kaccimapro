import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import Sidebar from './Sidebar';
import NotificationItem from './NotificationItem';
import ReuploadDialog from './ReuploadDialog';
import {
  Box,
  Container,
  Typography,
  Paper,
  List,
  ListItemAvatar,
  Avatar,
  Chip,
  IconButton,
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
  Refresh as RefreshIcon,
  Warning as WarningIcon
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { documentFields } from '../utils/notificationUtils';

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  borderRadius: '16px',
  boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)'
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
  const [reuploadDialog, setReuploadDialog] = useState({
    open: false,
    notification: null
  });

  useEffect(() => {
    checkUser();
  }, []);

  useEffect(() => {
    if (user) {
      fetchOrganizationData();
    }
  }, [user]);

  // Set up real-time subscription for new notifications
  useEffect(() => {
    if (organization?.id) {
      const subscription = supabase
        .channel('organization_notifications_channel')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'organization_notifications',
            filter: `organization_id=eq.${organization.id}`
          },
          (payload) => {
            const newNotif = {
              id: payload.new.id,
              type: payload.new.type === 'renewal' ? 'renewal' : 
                    payload.new.type === 'payment' ? 'payment' : 
                    payload.new.type === 'general' ? 'info' : payload.new.type,
              title: payload.new.title,
              message: payload.new.message,
              timestamp: payload.new.created_at,
              read: payload.new.read || false,
              category: payload.new.category || 'general',
              actionUrl: payload.new.action_url,
              isFromAdmin: true
            };
            
            setNotifications(prev => [newNotif, ...prev]);
            setUnreadCount(prev => prev + 1);
            
            showAlert('info', `New notification: ${payload.new.title}`);
          }
        )
        .subscribe();

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [organization?.id]);

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
      
      await fetchNotifications(data);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const fetchNotifications = async (orgData = organization) => {
    setLoading(true);
    try {
      const notificationsList = [];

      // 1. Fetch notifications from database (admin notifications)
      if (orgData?.id) {
        const { data: dbNotifications, error } = await supabase
          .from('organization_notifications')
          .select('*')
          .eq('organization_id', orgData.id)
          .order('created_at', { ascending: false });

        if (!error && dbNotifications) {
          dbNotifications.forEach(notif => {
            if (notif.scheduled_for && new Date(notif.scheduled_for) > new Date()) {
              return;
            }
            
            notificationsList.push({
              id: notif.id,
              type: notif.type === 'renewal' ? 'renewal' : 
                     notif.type === 'payment' ? 'payment' : 
                     notif.type === 'general' ? 'info' : notif.type,
              title: notif.title,
              message: notif.message,
              timestamp: notif.created_at,
              read: notif.read || false,
              category: notif.category || 'general',
              actionUrl: notif.action_url,
              isFromAdmin: true
            });
          });
        }
      }

      // 2. Check organization status notification
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
            isFromAdmin: false
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
            isFromAdmin: false
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
            isFromAdmin: false
          });
        }
      }

      // 3. Fetch payment notifications
      if (orgData?.id) {
        const { data: payments, error: paymentsError } = await supabase
          .from('payments')
          .select('*')
          .eq('organization_id', orgData.id)
          .order('created_at', { ascending: false });

        if (!paymentsError && payments) {
          payments.forEach((payment) => {
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
                isFromAdmin: false
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
                isFromAdmin: false
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
                isFromAdmin: false
              });
            }

            // Add renewal reminder
            if (payment.status === 'approved' && payment.payment_type === 'first') {
              const paymentDate = new Date(payment.created_at);
              const renewalDate = new Date(paymentDate.getFullYear() + 1, 0, 1);
              const now = new Date();
              const daysUntilRenewal = Math.floor((renewalDate - now) / (1000 * 60 * 60 * 24));

              if (daysUntilRenewal <= 30 && daysUntilRenewal > 0) {
                notificationsList.push({
                  id: `renewal-reminder-${payment.id}`,
                  type: 'renewal',
                  title: 'Renewal Reminder',
                  message: `Your membership renewal is due in ${daysUntilRenewal} days (January 1, ${renewalDate.getFullYear()}).`,
                  timestamp: new Date().toISOString(),
                  read: false,
                  category: 'renewal',
                  actionUrl: '/payment',
                  isFromAdmin: false
                });
              }
            }
          });
        }
      }

      // 4. Document notifications with rejection handling
      if (orgData) {
        // Check for rejected documents from admin notifications
        const rejectedDocs = notificationsList.filter(
          n => n.type === 'document_rejected' && n.category === 'document'
        );

        // Add document uploaded notifications
        documentFields.forEach((field) => {
          if (orgData[field.key]) {
            // Check if this document was previously rejected
            const wasRejected = rejectedDocs.some(doc => 
              doc.message?.includes(field.name)
            );

            notificationsList.push({
              id: `doc-upload-${field.key}-${Date.now()}`,
              type: wasRejected ? 'document_rejected' : 'info',
              title: wasRejected ? `Document Rejected: ${field.name}` : `Document Uploaded: ${field.name}`,
              message: wasRejected 
                ? `Your ${field.name} was rejected. Please upload a corrected version.`
                : `Your ${field.name} has been uploaded and is pending review.`,
              timestamp: orgData.updated_at,
              read: false,
              category: 'document',
              actionUrl: '/documents',
              isFromAdmin: false,
              documentField: field.key,
              documentName: field.name
            });
          }
        });

        // Check for missing documents
        if (orgData.status === 'pending') {
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
              isFromAdmin: false
            });
          }
        }
      }

      // Sort by timestamp (newest first)
      notificationsList.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

      // Remove duplicates
      const uniqueNotifications = [];
      const seenIds = new Set();
      
      notificationsList.forEach(notif => {
        if (!seenIds.has(notif.id)) {
          seenIds.add(notif.id);
          uniqueNotifications.push(notif);
        }
      });

      setNotifications(uniqueNotifications);
      
      const unread = uniqueNotifications.filter(n => !n.read).length;
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

  const markAsRead = async (id) => {
    const updatedNotifications = notifications.map(notif =>
      notif.id === id ? { ...notif, read: true } : notif
    );
    setNotifications(updatedNotifications);
    
    if (!id.startsWith('org-') && !id.startsWith('payment-') && 
        !id.startsWith('renewal-') && !id.startsWith('doc-') && 
        !id.startsWith('missing-')) {
      try {
        await supabase
          .from('organization_notifications')
          .update({ read: true, read_at: new Date().toISOString() })
          .eq('id', id);
      } catch (error) {
        console.error('Error marking notification as read:', error);
      }
    }
    
    setUnreadCount(updatedNotifications.filter(n => !n.read).length);
  };

  const markAllAsRead = async () => {
    const updatedNotifications = notifications.map(notif => ({ ...notif, read: true }));
    setNotifications(updatedNotifications);
    
    const dbNotificationIds = notifications
      .filter(n => !n.id.startsWith('org-') && !n.id.startsWith('payment-') && 
                  !n.id.startsWith('renewal-') && !n.id.startsWith('doc-') && 
                  !n.id.startsWith('missing-'))
      .map(n => n.id);
    
    if (dbNotificationIds.length > 0) {
      try {
        await supabase
          .from('organization_notifications')
          .update({ read: true, read_at: new Date().toISOString() })
          .in('id', dbNotificationIds);
      } catch (error) {
        console.error('Error marking notifications as read:', error);
      }
    }
    
    setUnreadCount(0);
    showAlert('success', 'All notifications marked as read');
  };

  const deleteNotification = async (id) => {
    if (!id.startsWith('org-') && !id.startsWith('payment-') && 
        !id.startsWith('renewal-') && !id.startsWith('doc-') && 
        !id.startsWith('missing-')) {
      try {
        await supabase
          .from('organization_notifications')
          .delete()
          .eq('id', id);
      } catch (error) {
        console.error('Error deleting notification:', error);
        showAlert('error', 'Failed to delete notification');
        return;
      }
    }
    
    const updatedNotifications = notifications.filter(notif => notif.id !== id);
    setNotifications(updatedNotifications);
    setUnreadCount(updatedNotifications.filter(n => !n.read).length);
    showAlert('success', 'Notification deleted');
  };

  const deleteAllRead = async () => {
    const readDbNotifications = notifications
      .filter(n => n.read && !n.id.startsWith('org-') && !n.id.startsWith('payment-') && 
                  !n.id.startsWith('renewal-') && !n.id.startsWith('doc-') && 
                  !n.id.startsWith('missing-'))
      .map(n => n.id);
    
    if (readDbNotifications.length > 0) {
      try {
        await supabase
          .from('organization_notifications')
          .delete()
          .in('id', readDbNotifications);
      } catch (error) {
        console.error('Error deleting read notifications:', error);
      }
    }
    
    const updatedNotifications = notifications.filter(notif => !notif.read);
    setNotifications(updatedNotifications);
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

  const handleReupload = (notification) => {
    setReuploadDialog({
      open: true,
      notification
    });
  };

  const handleReuploadSuccess = () => {
    showAlert('success', 'Document re-uploaded successfully');
    fetchNotifications(); // Refresh notifications
  };

  const filteredNotifications = notifications.filter(notif => {
    if (tabValue === 0) return true;
    if (tabValue === 1) return notif.category === 'registration';
    if (tabValue === 2) return notif.category === 'payment';
    if (tabValue === 3) return notif.category === 'document';
    if (tabValue === 4) return notif.category === 'renewal' || notif.category === 'general';
    return true;
  });

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

      <ReuploadDialog
        open={reuploadDialog.open}
        onClose={() => setReuploadDialog({ open: false, notification: null })}
        notification={reuploadDialog.notification}
        organization={organization}
        onSuccess={handleReuploadSuccess}
      />

      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', gap: 3 }}>
          <Sidebar unreadCount={unreadCount} />

          <Box sx={{ flex: 1, bgcolor: '#f8f9fa', p: 3, borderRadius: '16px' }}>
            <StyledPaper>
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
                <Tab label="Other" />
              </Tabs>

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
                        notification={notification}
                        onMarkRead={markAsRead}
                        onDelete={deleteNotification}
                        onClick={handleNotificationClick}
                        showReuploadButton={true}
                        onReupload={handleReupload}
                      />
                    ))}
                  </List>
                )}
              </TabPanel>

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
                        notification={notification}
                        onMarkRead={markAsRead}
                        onDelete={deleteNotification}
                        onClick={handleNotificationClick}
                        showReuploadButton={true}
                        onReupload={handleReupload}
                      />
                    ))}
                  </List>
                )}
              </TabPanel>

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
                        notification={notification}
                        onMarkRead={markAsRead}
                        onDelete={deleteNotification}
                        onClick={handleNotificationClick}
                        showReuploadButton={false}
                      />
                    ))}
                  </List>
                )}
              </TabPanel>

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
                        notification={notification}
                        onMarkRead={markAsRead}
                        onDelete={deleteNotification}
                        onClick={handleNotificationClick}
                        showReuploadButton={true}
                        onReupload={handleReupload}
                      />
                    ))}
                  </List>
                )}
              </TabPanel>

              <TabPanel value={tabValue} index={4}>
                {filteredNotifications.length === 0 ? (
                  <Box sx={{ textAlign: 'center', py: 8 }}>
                    <AccessTimeIcon sx={{ fontSize: 64, color: '#ccc', mb: 2 }} />
                    <Typography variant="h6" sx={{ color: '#666' }}>
                      No other notifications
                    </Typography>
                  </Box>
                ) : (
                  <List>
                    {filteredNotifications.map((notification) => (
                      <NotificationItem
                        key={notification.id}
                        notification={notification}
                        onMarkRead={markAsRead}
                        onDelete={deleteNotification}
                        onClick={handleNotificationClick}
                        showReuploadButton={false}
                      />
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