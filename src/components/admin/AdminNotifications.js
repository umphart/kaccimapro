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
  Avatar
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
  Email as EmailIcon
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import AdminSidebar from './AdminSidebar';

const StyledCard = styled(Card)(({ theme }) => ({
  borderRadius: '16px',
  boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)',
  marginBottom: theme.spacing(3)
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

  useEffect(() => {
    fetchData();
  }, []);

  const showAlert = (type, message) => {
    setAlert({ open: true, type, message });
  };

  const handleCloseAlert = () => {
    setAlert({ ...alert, open: false });
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch organizations
      const { data: orgsData, error: orgsError } = await supabase
        .from('organizations')
        .select('*')
        .order('created_at', { ascending: false });

      if (orgsError) throw orgsError;
      setOrganizations(orgsData || []);

      // Fetch notifications from database
      const { data: dbNotifications, error: notifError } = await supabase
        .from('organization_notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (notifError) throw notifError;

      // Transform database notifications for display
      const transformedNotifications = dbNotifications?.map(notif => ({
        id: notif.id,
        type: notif.type,
        subject: notif.title,
        message: notif.message,
        recipients: 1, // Individual notification per organization
        scheduledFor: notif.scheduled_for,
        sentAt: notif.created_at,
        status: notif.scheduled_for ? 'scheduled' : 'sent',
        createdAt: notif.created_at,
        organization_id: notif.organization_id
      })) || [];

      setNotifications(transformedNotifications);

    } catch (error) {
      console.error('Error fetching data:', error);
      showAlert('error', 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const sendNotificationToDatabase = async (recipients, notificationData) => {
    try {
      // If scheduled, create notifications with scheduled_for timestamp
      if (notificationData.scheduledFor) {
        const scheduledTime = new Date(notificationData.scheduledFor);
        const now = new Date();
        
        const notificationsToInsert = recipients.map(recipient => ({
          organization_id: recipient.id,
          type: notificationData.type,
          title: notificationData.title,
          message: notificationData.message,
          category: notificationData.category,
          action_url: notificationData.actionUrl || null,
          read: false,
          scheduled_for: notificationData.scheduledFor,
          created_at: now.toISOString()
        }));

        const { data, error } = await supabase
          .from('organization_notifications')
          .insert(notificationsToInsert)
          .select();

        if (error) throw error;
        return data;
      }

      // Send immediately
      const notificationsToInsert = recipients.map(recipient => ({
        organization_id: recipient.id,
        type: notificationData.type,
        title: notificationData.title,
        message: notificationData.message,
        category: notificationData.category,
        action_url: notificationData.actionUrl || null,
        read: false,
        created_at: new Date().toISOString()
      }));

      const { data, error } = await supabase
        .from('organization_notifications')
        .insert(notificationsToInsert)
        .select();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error sending notifications to database:', error);
      throw error;
    }
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
        // Get organizations with renewal due soon
        // You would need to implement this based on your payment data
        recipients = organizations.filter(m => m.status?.toLowerCase() === 'approved');
      }

      if (recipients.length === 0) {
        showAlert('error', 'No recipients selected');
        setSending(false);
        return;
      }

      // Prepare notification data
      const notificationData = {
        type: notificationType,
        title: subject,
        message: message,
        category: notificationType === 'renewal' ? 'renewal' : 
                  notificationType === 'payment' ? 'payment' : 'general',
        actionUrl: notificationType === 'payment' ? '/payment' : 
                   notificationType === 'renewal' ? '/payment' : '/notifications',
        scheduledFor: scheduleDate && scheduleTime ? `${scheduleDate}T${scheduleTime}` : null
      };

      // Send notifications to database
      const sentNotifications = await sendNotificationToDatabase(recipients, notificationData);

      // Refresh notifications list
      const { data: updatedNotifications } = await supabase
        .from('organization_notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      const transformedNotifications = updatedNotifications?.map(notif => ({
        id: notif.id,
        type: notif.type,
        subject: notif.title,
        message: notif.message,
        recipients: 1,
        scheduledFor: notif.scheduled_for,
        sentAt: notif.created_at,
        status: notif.scheduled_for ? 'scheduled' : 'sent',
        createdAt: notif.created_at,
        organization_id: notif.organization_id
      })) || [];

      setNotifications(transformedNotifications);

      showAlert('success', `Notification ${scheduleDate ? 'scheduled' : 'sent'} successfully to ${recipients.length} recipients`);
      setDialogOpen(false);
      resetForm();

    } catch (error) {
      console.error('Error sending notification:', error);
      showAlert('error', 'Failed to send notification: ' + error.message);
    } finally {
      setSending(false);
    }
  };

  const resetForm = () => {
    setSubject('');
    setMessage('');
    setNotificationType('renewal');
    setSelectedMembers('all');
    setScheduleDate('');
    setScheduleTime('');
  };

  const getTemplate = (type) => {
    if (type === 'renewal') {
      setSubject('Membership Renewal Reminder');
      setMessage('Dear Member,\n\nYour membership with KACCIMA is due for renewal. Please log in to your dashboard to complete the renewal process.\n\nThank you for your continued membership.\n\nBest regards,\nKACCIMA Team');
    } else if (type === 'payment') {
      setSubject('Payment Confirmation');
      setMessage('Dear Member,\n\nYour payment has been received and verified. Your membership is now active.\n\nThank you for your prompt payment.\n\nBest regards,\nKACCIMA Team');
    } else if (type === 'general') {
      setSubject('Important Announcement');
      setMessage('Dear Member,\n\nWe have an important announcement to share with you.\n\nBest regards,\nKACCIMA Team');
    }
  };

  const deleteNotification = async (id) => {
    try {
      const { error } = await supabase
        .from('organization_notifications')
        .delete()
        .eq('id', id);

      if (error) throw error;

      // Update local state
      setNotifications(notifications.filter(n => n.id !== id));
      showAlert('success', 'Notification deleted');
    } catch (error) {
      console.error('Error deleting notification:', error);
      showAlert('error', 'Failed to delete notification');
    }
  };

  const getRecipientCompanyName = async (organizationId) => {
    try {
      const { data } = await supabase
        .from('organizations')
        .select('company_name')
        .eq('id', organizationId)
        .single();
      
      return data?.company_name || 'Unknown';
    } catch {
      return 'Unknown';
    }
  };

  const groupNotificationsByRecipient = () => {
    const grouped = {};
    notifications.forEach(notif => {
      if (!grouped[notif.id]) {
        grouped[notif.id] = notif;
      }
    });
    return Object.values(grouped);
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
                  Send reminders and announcements to members
                </Typography>
              </Box>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setDialogOpen(true)}
                sx={{ bgcolor: '#15e420', '&:hover': { bgcolor: '#12c21e' } }}
              >
                New Notification
              </Button>
            </Box>

            {/* Stats */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
              <Grid item xs={12} md={4}>
                <StyledCard>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Avatar sx={{ bgcolor: '#15e420', width: 48, height: 48 }}>
                        <EmailIcon />
                      </Avatar>
                      <Box>
                        <Typography variant="body2" sx={{ color: '#666' }}>
                          Total Organizations
                        </Typography>
                        <Typography variant="h4" sx={{ fontWeight: 700 }}>
                          {organizations.length}
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </StyledCard>
              </Grid>
              <Grid item xs={12} md={4}>
                <StyledCard>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Avatar sx={{ bgcolor: '#ffc107', width: 48, height: 48 }}>
                        <ScheduleIcon />
                      </Avatar>
                      <Box>
                        <Typography variant="body2" sx={{ color: '#666' }}>
                          Scheduled
                        </Typography>
                        <Typography variant="h4" sx={{ fontWeight: 700 }}>
                          {notifications.filter(n => n.status === 'scheduled').length}
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </StyledCard>
              </Grid>
              <Grid item xs={12} md={4}>
                <StyledCard>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Avatar sx={{ bgcolor: '#28a745', width: 48, height: 48 }}>
                        <CheckCircleIcon />
                      </Avatar>
                      <Box>
                        <Typography variant="body2" sx={{ color: '#666' }}>
                          Sent
                        </Typography>
                        <Typography variant="h4" sx={{ fontWeight: 700 }}>
                          {notifications.filter(n => n.status === 'sent').length}
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </StyledCard>
              </Grid>
            </Grid>

            {/* Recent Notifications */}
            <StyledCard>
              <CardContent>
                <Typography variant="h6" sx={{ fontFamily: '"Poppins", sans-serif', mb: 2 }}>
                  Recent Notifications
                </Typography>
                
                {notifications.length === 0 ? (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <NotificationsActiveIcon sx={{ fontSize: 48, color: '#ccc', mb: 2 }} />
                    <Typography color="textSecondary">No notifications sent yet</Typography>
                  </Box>
                ) : (
                  <List>
                    {groupNotificationsByRecipient().map((notification, index) => (
                      <React.Fragment key={notification.id}>
                        <ListItem
                          secondaryAction={
                            <IconButton edge="end" onClick={() => deleteNotification(notification.id)}>
                              <DeleteIcon />
                            </IconButton>
                          }
                        >
                          <ListItemIcon>
                            {notification.type === 'renewal' ? <ScheduleIcon /> :
                             notification.type === 'payment' ? <PaymentIcon /> :
                             <NotificationsActiveIcon />}
                          </ListItemIcon>
                          <ListItemText
                            primary={
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                                <Typography variant="subtitle2">{notification.subject}</Typography>
                                <Chip
                                  label={notification.status}
                                  size="small"
                                  color={notification.status === 'sent' ? 'success' : 'warning'}
                                  sx={{ height: 20, fontSize: '0.7rem' }}
                                />
                                <Chip
                                  label={notification.type}
                                  size="small"
                                  variant="outlined"
                                  sx={{ height: 20, fontSize: '0.7rem' }}
                                />
                              </Box>
                            }
                            secondary={
                              <Box>
                                <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
                                  {notification.message.substring(0, 120)}...
                                </Typography>
                                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                                  <Typography variant="caption" color="textSecondary">
                                    To: {notification.recipients} organization(s)
                                  </Typography>
                                  <Typography variant="caption" color="textSecondary">
                                    <AccessTimeIcon sx={{ fontSize: 12, mr: 0.5, verticalAlign: 'middle' }} />
                                    {notification.scheduledFor ? 
                                      `Scheduled: ${new Date(notification.scheduledFor).toLocaleString()}` :
                                      `Sent: ${new Date(notification.sentAt).toLocaleString()}`}
                                  </Typography>
                                </Box>
                              </Box>
                            }
                          />
                        </ListItem>
                        {index < notifications.length - 1 && <Divider />}
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
                  onChange={(e) => {
                    setNotificationType(e.target.value);
                    getTemplate(e.target.value);
                  }}
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
    </>
  );
};

export default AdminNotifications;