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
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Divider,
  Avatar,
  Chip,
  Tooltip
} from '@mui/material';
import {
  Settings as SettingsIcon,
  PersonAdd as PersonAddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  AdminPanelSettings as AdminIcon,
  Security as SecurityIcon,
  Email as EmailIcon,
  Refresh as RefreshIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Lock as LockIcon,
  VpnKey as VpnKeyIcon
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import AdminSidebar from './AdminSidebar';

const StyledCard = styled(Card)(({ theme }) => ({
  borderRadius: '16px',
  boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)',
  marginBottom: theme.spacing(3)
}));

const AdminSettings = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState({ open: false, type: 'success', message: '' });
  const [admins, setAdmins] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState(null);
  const [formData, setFormData] = useState({
    email: '',
    fullName: '',
    adminType: 'reviewer',
    password: '',
    confirmPassword: ''
  });
  const [settings, setSettings] = useState({
    emailNotifications: true,
    autoApprovePayments: false,
    requireDocumentVerification: true,
    renewalReminderDays: 30,
    sessionTimeout: 60,
    twoFactorAuth: false
  });

  useEffect(() => {
    fetchAdmins();
    loadSettings();
  }, []);

  const showAlert = (type, message) => {
    setAlert({ open: true, type, message });
  };

  const handleCloseAlert = () => {
    setAlert({ ...alert, open: false });
  };

  const fetchAdmins = async () => {
    try {
      const { data, error } = await supabase
        .from('admin_users')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAdmins(data || []);
    } catch (error) {
      console.error('Error fetching admins:', error);
      showAlert('error', 'Failed to load admins');
    } finally {
      setLoading(false);
    }
  };

  const loadSettings = () => {
    const savedSettings = localStorage.getItem('adminSettings');
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings));
    }
  };

  const saveSettings = () => {
    localStorage.setItem('adminSettings', JSON.stringify(settings));
    showAlert('success', 'Settings saved successfully');
  };

  const handleCreateAdmin = async () => {
    if (formData.password !== formData.confirmPassword) {
      showAlert('error', 'Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      showAlert('error', 'Password must be at least 6 characters');
      return;
    }

    try {
      // Create user in auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.fullName,
            is_admin: true
          }
        }
      });

      if (authError) throw authError;

      // Add to admin_users table
      const { error: adminError } = await supabase
        .from('admin_users')
        .insert([{
          user_id: authData.user.id,
          email: formData.email,
          full_name: formData.fullName,
          admin_type: formData.adminType,
          permissions: formData.adminType === 'approver' 
            ? { can_approve: true, can_review: true }
            : { can_review: true, can_approve: false }
        }]);

      if (adminError) throw adminError;

      showAlert('success', 'Admin created successfully');
      setDialogOpen(false);
      resetForm();
      fetchAdmins();

    } catch (error) {
      console.error('Error creating admin:', error);
      showAlert('error', error.message);
    }
  };

  const handleUpdateAdmin = async () => {
    if (!editingAdmin) return;

    try {
      const { error } = await supabase
        .from('admin_users')
        .update({
          full_name: formData.fullName,
          admin_type: formData.adminType,
          permissions: formData.adminType === 'approver' 
            ? { can_approve: true, can_review: true }
            : { can_review: true, can_approve: false }
        })
        .eq('id', editingAdmin.id);

      if (error) throw error;

      showAlert('success', 'Admin updated successfully');
      setDialogOpen(false);
      resetForm();
      fetchAdmins();

    } catch (error) {
      console.error('Error updating admin:', error);
      showAlert('error', error.message);
    }
  };

  const handleDeleteAdmin = async (adminId) => {
    if (!window.confirm('Are you sure you want to delete this admin?')) return;

    try {
      const { error } = await supabase
        .from('admin_users')
        .delete()
        .eq('id', adminId);

      if (error) throw error;

      showAlert('success', 'Admin deleted successfully');
      fetchAdmins();

    } catch (error) {
      console.error('Error deleting admin:', error);
      showAlert('error', error.message);
    }
  };

  const resetForm = () => {
    setFormData({
      email: '',
      fullName: '',
      adminType: 'reviewer',
      password: '',
      confirmPassword: ''
    });
    setEditingAdmin(null);
  };

  const openEditDialog = (admin) => {
    setEditingAdmin(admin);
    setFormData({
      email: admin.email,
      fullName: admin.full_name,
      adminType: admin.admin_type,
      password: '',
      confirmPassword: ''
    });
    setDialogOpen(true);
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
                  Settings
                </Typography>
                <Typography 
                  variant="body1" 
                  sx={{ 
                    fontFamily: '"Inter", sans-serif',
                    color: '#666'
                  }}
                >
                  Manage system settings and administrators
                </Typography>
              </Box>
            </Box>

            {/* Admin Management */}
            <StyledCard>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                  <Typography variant="h6" sx={{ fontFamily: '"Poppins", sans-serif' }}>
                    Administrator Management
                  </Typography>
                  <Button
                    variant="contained"
                    startIcon={<PersonAddIcon />}
                    onClick={() => {
                      resetForm();
                      setDialogOpen(true);
                    }}
                    sx={{ bgcolor: '#15e420', '&:hover': { bgcolor: '#12c21e' } }}
                  >
                    Add Admin
                  </Button>
                </Box>

                <List>
                  {admins.map((admin, index) => (
                    <React.Fragment key={admin.id}>
                      <ListItem
                        secondaryAction={
                          <Box>
                            <Tooltip title="Edit">
                              <IconButton onClick={() => openEditDialog(admin)} sx={{ color: '#15e420' }}>
                                <EditIcon />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Delete">
                              <IconButton onClick={() => handleDeleteAdmin(admin.id)} sx={{ color: '#dc3545' }}>
                                <DeleteIcon />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        }
                      >
                        <ListItemIcon>
                          <Avatar sx={{ bgcolor: admin.admin_type === 'approver' ? '#667eea' : '#f093fb' }}>
                            <AdminIcon />
                          </Avatar>
                        </ListItemIcon>
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Typography variant="subtitle2">{admin.full_name}</Typography>
                              <Chip
                                label={admin.admin_type}
                                size="small"
                                sx={{
                                  backgroundColor: admin.admin_type === 'approver' ? '#667eea' : '#f093fb',
                                  color: 'white'
                                }}
                              />
                            </Box>
                          }
                          secondary={
                            <Box>
                              <Typography variant="body2" color="textSecondary">
                                {admin.email}
                              </Typography>
                              <Typography variant="caption" color="textSecondary">
                                Last login: {admin.last_login ? new Date(admin.last_login).toLocaleString() : 'Never'}
                              </Typography>
                            </Box>
                          }
                        />
                      </ListItem>
                      {index < admins.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>
              </CardContent>
            </StyledCard>

            {/* System Settings */}
            <StyledCard>
              <CardContent>
                <Typography variant="h6" sx={{ fontFamily: '"Poppins", sans-serif', mb: 3 }}>
                  System Settings
                </Typography>

                <Grid container spacing={3}>
                  <Grid item xs={12}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={settings.emailNotifications}
                          onChange={(e) => setSettings({ ...settings, emailNotifications: e.target.checked })}
                          sx={{
                            '& .MuiSwitch-switchBase.Mui-checked': {
                              color: '#15e420',
                            },
                            '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                              backgroundColor: '#15e420',
                            },
                          }}
                        />
                      }
                      label="Enable Email Notifications"
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={settings.autoApprovePayments}
                          onChange={(e) => setSettings({ ...settings, autoApprovePayments: e.target.checked })}
                        />
                      }
                      label="Auto-approve Payments (Not Recommended)"
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={settings.requireDocumentVerification}
                          onChange={(e) => setSettings({ ...settings, requireDocumentVerification: e.target.checked })}
                        />
                      }
                      label="Require Document Verification"
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={settings.twoFactorAuth}
                          onChange={(e) => setSettings({ ...settings, twoFactorAuth: e.target.checked })}
                        />
                      }
                      label="Require Two-Factor Authentication for Admins"
                    />
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      type="number"
                      label="Renewal Reminder (days before)"
                      value={settings.renewalReminderDays}
                      onChange={(e) => setSettings({ ...settings, renewalReminderDays: parseInt(e.target.value) })}
                    />
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      type="number"
                      label="Session Timeout (minutes)"
                      value={settings.sessionTimeout}
                      onChange={(e) => setSettings({ ...settings, sessionTimeout: parseInt(e.target.value) })}
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <Button
                      variant="contained"
                      onClick={saveSettings}
                      sx={{ bgcolor: '#15e420', '&:hover': { bgcolor: '#12c21e' } }}
                    >
                      Save Settings
                    </Button>
                  </Grid>
                </Grid>
              </CardContent>
            </StyledCard>
          </Box>
        </Box>
      </Container>

      {/* Create/Edit Admin Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontFamily: '"Poppins", sans-serif' }}>
          {editingAdmin ? 'Edit Admin' : 'Create New Admin'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Full Name"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                required
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                disabled={!!editingAdmin}
              />
            </Grid>

            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Admin Type</InputLabel>
                <Select
                  value={formData.adminType}
                  onChange={(e) => setFormData({ ...formData, adminType: e.target.value })}
                  label="Admin Type"
                >
                  <MenuItem value="reviewer">Reviewer (Can review documents & payments)</MenuItem>
                  <MenuItem value="approver">Approver (Full access including final approvals)</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {!editingAdmin && (
              <>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                    helperText="Minimum 6 characters"
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Confirm Password"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    required
                  />
                </Grid>
              </>
            )}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={editingAdmin ? handleUpdateAdmin : handleCreateAdmin}
            variant="contained"
            sx={{ bgcolor: '#15e420', '&:hover': { bgcolor: '#12c21e' } }}
          >
            {editingAdmin ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default AdminSettings;