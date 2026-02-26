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
  Tooltip,
  Tab,
  Tabs
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
  VpnKey as VpnKeyIcon,
  Business as BusinessIcon,
  Add as AddIcon,
  Search as SearchIcon,
  FilterList as FilterIcon
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import AdminSidebar from './AdminSidebar';

const StyledCard = styled(Card)(({ theme }) => ({
  borderRadius: '16px',
  boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)',
  marginBottom: theme.spacing(3)
}));

const TabPanel = ({ children, value, index, ...other }) => (
  <div
    role="tabpanel"
    hidden={value !== index}
    id={`settings-tabpanel-${index}`}
    aria-labelledby={`settings-tab-${index}`}
    {...other}
  >
    {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
  </div>
);

const AdminSettings = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState({ open: false, type: 'success', message: '' });
  const [tabValue, setTabValue] = useState(0);
  
  // Admins state
  const [admins, setAdmins] = useState([]);
  const [adminDialogOpen, setAdminDialogOpen] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState(null);
  const [adminFormData, setAdminFormData] = useState({
    email: '',
    fullName: '',
    adminType: 'reviewer',
    password: '',
    confirmPassword: ''
  });

  // Organizations state
  const [organizations, setOrganizations] = useState([]);
  const [filteredOrganizations, setFilteredOrganizations] = useState([]);
  const [orgDialogOpen, setOrgDialogOpen] = useState(false);
  const [editingOrg, setEditingOrg] = useState(null);
  const [orgSearchTerm, setOrgSearchTerm] = useState('');
  const [orgStatusFilter, setOrgStatusFilter] = useState('all');
  const [orgFormData, setOrgFormData] = useState({
    company_name: '',
    email: '',
    phone_number: '',
    office_address: '',
    business_nature: '',
    cac_number: '',
    contact_person: '',
    representative: '',
    nigerian_directors: 0,
    non_nigerian_directors: 0,
    nigerian_employees: 0,
    non_nigerian_employees: 0,
    bankers: '',
    referee1_name: '',
    referee1_business: '',
    referee1_phone: '',
    referee1_reg_number: '',
    referee2_name: '',
    referee2_business: '',
    referee2_phone: '',
    referee2_reg_number: '',
    id_type: '',
    status: 'pending',
    password: '' // For creating user account
  });

  // Settings state
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
    fetchOrganizations();
    loadSettings();
  }, []);

  useEffect(() => {
    // Filter organizations based on search and status
    let filtered = [...organizations];
    
    if (orgSearchTerm) {
      const searchLower = orgSearchTerm.toLowerCase();
      filtered = filtered.filter(org => 
        org.company_name?.toLowerCase().includes(searchLower) ||
        org.email?.toLowerCase().includes(searchLower) ||
        org.cac_number?.toLowerCase().includes(searchLower) ||
        org.contact_person?.toLowerCase().includes(searchLower)
      );
    }
    
    if (orgStatusFilter !== 'all') {
      filtered = filtered.filter(org => org.status === orgStatusFilter);
    }
    
    setFilteredOrganizations(filtered);
  }, [organizations, orgSearchTerm, orgStatusFilter]);

  const showAlert = (type, message) => {
    setAlert({ open: true, type, message });
  };

  const handleCloseAlert = () => {
    setAlert({ ...alert, open: false });
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  // ============ ADMIN FUNCTIONS ============
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

  const handleCreateAdmin = async () => {
    if (adminFormData.password !== adminFormData.confirmPassword) {
      showAlert('error', 'Passwords do not match');
      return;
    }

    if (adminFormData.password.length < 6) {
      showAlert('error', 'Password must be at least 6 characters');
      return;
    }

    try {
      // Create user in auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: adminFormData.email,
        password: adminFormData.password,
        options: {
          data: {
            full_name: adminFormData.fullName,
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
          email: adminFormData.email,
          full_name: adminFormData.fullName,
          admin_type: adminFormData.adminType,
          permissions: adminFormData.adminType === 'approver' 
            ? { can_approve: true, can_review: true }
            : { can_review: true, can_approve: false }
        }]);

      if (adminError) throw adminError;

      showAlert('success', 'Admin created successfully');
      setAdminDialogOpen(false);
      resetAdminForm();
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
          full_name: adminFormData.fullName,
          admin_type: adminFormData.adminType,
          permissions: adminFormData.adminType === 'approver' 
            ? { can_approve: true, can_review: true }
            : { can_review: true, can_approve: false }
        })
        .eq('id', editingAdmin.id);

      if (error) throw error;

      showAlert('success', 'Admin updated successfully');
      setAdminDialogOpen(false);
      resetAdminForm();
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

  const resetAdminForm = () => {
    setAdminFormData({
      email: '',
      fullName: '',
      adminType: 'reviewer',
      password: '',
      confirmPassword: ''
    });
    setEditingAdmin(null);
  };

  const openEditAdminDialog = (admin) => {
    setEditingAdmin(admin);
    setAdminFormData({
      email: admin.email,
      fullName: admin.full_name,
      adminType: admin.admin_type,
      password: '',
      confirmPassword: ''
    });
    setAdminDialogOpen(true);
  };

  // ============ ORGANIZATION FUNCTIONS ============
  const fetchOrganizations = async () => {
    try {
      const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrganizations(data || []);
    } catch (error) {
      console.error('Error fetching organizations:', error);
      showAlert('error', 'Failed to load organizations');
    }
  };

  const handleCreateOrganization = async () => {
    try {
      // First create auth user if password is provided
      let userId = null;
      if (orgFormData.password) {
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: orgFormData.email,
          password: orgFormData.password,
          options: {
            data: {
              full_name: orgFormData.contact_person,
              company_name: orgFormData.company_name
            }
          }
        });

        if (authError) throw authError;
        userId = authData.user.id;
      }

      // Create organization record
      const { data, error } = await supabase
        .from('organizations')
        .insert([{
          ...orgFormData,
          user_id: userId,
          nigerian_directors: parseInt(orgFormData.nigerian_directors) || 0,
          non_nigerian_directors: parseInt(orgFormData.non_nigerian_directors) || 0,
          nigerian_employees: parseInt(orgFormData.nigerian_employees) || 0,
          non_nigerian_employees: parseInt(orgFormData.non_nigerian_employees) || 0,
          re_upload_count: 0,
          document_rejection_reasons: {}
        }])
        .select();

      if (error) throw error;

      showAlert('success', 'Organization created successfully');
      setOrgDialogOpen(false);
      resetOrgForm();
      fetchOrganizations();

    } catch (error) {
      console.error('Error creating organization:', error);
      showAlert('error', error.message);
    }
  };

  const handleUpdateOrganization = async () => {
    if (!editingOrg) return;

    try {
      const { error } = await supabase
        .from('organizations')
        .update({
          company_name: orgFormData.company_name,
          email: orgFormData.email,
          phone_number: orgFormData.phone_number,
          office_address: orgFormData.office_address,
          business_nature: orgFormData.business_nature,
          cac_number: orgFormData.cac_number,
          contact_person: orgFormData.contact_person,
          representative: orgFormData.representative,
          nigerian_directors: parseInt(orgFormData.nigerian_directors) || 0,
          non_nigerian_directors: parseInt(orgFormData.non_nigerian_directors) || 0,
          nigerian_employees: parseInt(orgFormData.nigerian_employees) || 0,
          non_nigerian_employees: parseInt(orgFormData.non_nigerian_employees) || 0,
          bankers: orgFormData.bankers,
          referee1_name: orgFormData.referee1_name,
          referee1_business: orgFormData.referee1_business,
          referee1_phone: orgFormData.referee1_phone,
          referee1_reg_number: orgFormData.referee1_reg_number,
          referee2_name: orgFormData.referee2_name,
          referee2_business: orgFormData.referee2_business,
          referee2_phone: orgFormData.referee2_phone,
          referee2_reg_number: orgFormData.referee2_reg_number,
          id_type: orgFormData.id_type,
          status: orgFormData.status
        })
        .eq('id', editingOrg.id);

      if (error) throw error;

      showAlert('success', 'Organization updated successfully');
      setOrgDialogOpen(false);
      resetOrgForm();
      fetchOrganizations();

    } catch (error) {
      console.error('Error updating organization:', error);
      showAlert('error', error.message);
    }
  };

  const handleDeleteOrganization = async (orgId, companyName) => {
    if (!window.confirm(`Are you sure you want to delete ${companyName}? This action cannot be undone.`)) return;

    try {
      const { error } = await supabase
        .from('organizations')
        .delete()
        .eq('id', orgId);

      if (error) throw error;

      showAlert('success', 'Organization deleted successfully');
      fetchOrganizations();

    } catch (error) {
      console.error('Error deleting organization:', error);
      showAlert('error', error.message);
    }
  };

  const resetOrgForm = () => {
    setOrgFormData({
      company_name: '',
      email: '',
      phone_number: '',
      office_address: '',
      business_nature: '',
      cac_number: '',
      contact_person: '',
      representative: '',
      nigerian_directors: 0,
      non_nigerian_directors: 0,
      nigerian_employees: 0,
      non_nigerian_employees: 0,
      bankers: '',
      referee1_name: '',
      referee1_business: '',
      referee1_phone: '',
      referee1_reg_number: '',
      referee2_name: '',
      referee2_business: '',
      referee2_phone: '',
      referee2_reg_number: '',
      id_type: '',
      status: 'pending',
      password: ''
    });
    setEditingOrg(null);
  };

  const openEditOrgDialog = (org) => {
    setEditingOrg(org);
    setOrgFormData({
      company_name: org.company_name || '',
      email: org.email || '',
      phone_number: org.phone_number || '',
      office_address: org.office_address || '',
      business_nature: org.business_nature || '',
      cac_number: org.cac_number || '',
      contact_person: org.contact_person || '',
      representative: org.representative || '',
      nigerian_directors: org.nigerian_directors || 0,
      non_nigerian_directors: org.non_nigerian_directors || 0,
      nigerian_employees: org.nigerian_employees || 0,
      non_nigerian_employees: org.non_nigerian_employees || 0,
      bankers: org.bankers || '',
      referee1_name: org.referee1_name || '',
      referee1_business: org.referee1_business || '',
      referee1_phone: org.referee1_phone || '',
      referee1_reg_number: org.referee1_reg_number || '',
      referee2_name: org.referee2_name || '',
      referee2_business: org.referee2_business || '',
      referee2_phone: org.referee2_phone || '',
      referee2_reg_number: org.referee2_reg_number || '',
      id_type: org.id_type || '',
      status: org.status || 'pending',
      password: ''
    });
    setOrgDialogOpen(true);
  };

  // ============ SETTINGS FUNCTIONS ============
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
                Settings
              </Typography>
              <Typography 
                variant="body1" 
                sx={{ 
                  fontFamily: '"Inter", sans-serif',
                  color: '#666'
                }}
              >
                Manage system settings, administrators, and organizations
              </Typography>
            </Box>

            {/* Tabs */}
            <Paper sx={{ borderRadius: '16px', overflow: 'hidden' }}>
              <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <Tabs 
                  value={tabValue} 
                  onChange={handleTabChange}
                  sx={{
                    '& .MuiTab-root': {
                      fontFamily: '"Inter", sans-serif',
                      fontWeight: 600,
                      textTransform: 'none',
                      fontSize: '16px',
                      minWidth: '200px'
                    },
                    '& .Mui-selected': {
                      color: '#15e420 !important'
                    },
                    '& .MuiTabs-indicator': {
                      backgroundColor: '#15e420'
                    }
                  }}
                >
                  <Tab icon={<AdminIcon />} label="Administrators" iconPosition="start" />
                  <Tab icon={<BusinessIcon />} label="Organizations" iconPosition="start" />
                  <Tab icon={<SettingsIcon />} label="System Settings" iconPosition="start" />
                </Tabs>
              </Box>

              {/* Admin Management Tab */}
              <TabPanel value={tabValue} index={0}>
                <Box sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                    <Typography variant="h6" sx={{ fontFamily: '"Poppins", sans-serif' }}>
                      Administrator Management
                    </Typography>
                    <Button
                      variant="contained"
                      startIcon={<PersonAddIcon />}
                      onClick={() => {
                        resetAdminForm();
                        setAdminDialogOpen(true);
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
                                <IconButton onClick={() => openEditAdminDialog(admin)} sx={{ color: '#15e420' }}>
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
                </Box>
              </TabPanel>

              {/* Organizations Management Tab */}
              <TabPanel value={tabValue} index={1}>
                <Box sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                    <Typography variant="h6" sx={{ fontFamily: '"Poppins", sans-serif' }}>
                      Organization Management
                    </Typography>
                    <Button
                      variant="contained"
                      startIcon={<AddIcon />}
                      onClick={() => {
                        resetOrgForm();
                        setOrgDialogOpen(true);
                      }}
                      sx={{ bgcolor: '#15e420', '&:hover': { bgcolor: '#12c21e' } }}
                    >
                      Add Organization
                    </Button>
                  </Box>

                  {/* Search and Filter */}
                  <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
                    <TextField
                      fullWidth
                      size="small"
                      placeholder="Search organizations..."
                      value={orgSearchTerm}
                      onChange={(e) => setOrgSearchTerm(e.target.value)}
                      InputProps={{
                        startAdornment: <SearchIcon sx={{ color: '#999', mr: 1 }} />
                      }}
                    />
                    <FormControl size="small" sx={{ minWidth: 150 }}>
                      <InputLabel>Status</InputLabel>
                      <Select
                        value={orgStatusFilter}
                        onChange={(e) => setOrgStatusFilter(e.target.value)}
                        label="Status"
                      >
                        <MenuItem value="all">All Status</MenuItem>
                        <MenuItem value="pending">Pending</MenuItem>
                        <MenuItem value="approved">Approved</MenuItem>
                        <MenuItem value="rejected">Rejected</MenuItem>
                      </Select>
                    </FormControl>
                  </Box>

                  {/* Organizations List */}
                  <List>
                    {filteredOrganizations.map((org, index) => (
                      <React.Fragment key={org.id}>
                        <ListItem
                          secondaryAction={
                            <Box>
                              <Tooltip title="View Details">
                                <IconButton 
                                  onClick={() => navigate(`/admin/organizations/${org.id}`)} 
                                  sx={{ color: '#17a2b8' }}
                                >
                                  <BusinessIcon />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Edit">
                                <IconButton onClick={() => openEditOrgDialog(org)} sx={{ color: '#15e420' }}>
                                  <EditIcon />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Delete">
                                <IconButton onClick={() => handleDeleteOrganization(org.id, org.company_name)} sx={{ color: '#dc3545' }}>
                                  <DeleteIcon />
                                </IconButton>
                              </Tooltip>
                            </Box>
                          }
                        >
                          <ListItemIcon>
                            <Avatar sx={{ bgcolor: org.status === 'approved' ? '#28a745' : org.status === 'rejected' ? '#dc3545' : '#ffc107' }}>
                              <BusinessIcon />
                            </Avatar>
                          </ListItemIcon>
                          <ListItemText
                            primary={
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                                <Typography variant="subtitle2">{org.company_name}</Typography>
                                <Chip
                                  label={org.status}
                                  size="small"
                                  sx={{
                                    backgroundColor: org.status === 'approved' ? '#d4edda' :
                                                    org.status === 'rejected' ? '#ffebee' : '#fff3e0',
                                    color: org.status === 'approved' ? '#28a745' :
                                           org.status === 'rejected' ? '#dc3545' : '#ff9800'
                                  }}
                                />
                                {org.cac_number && (
                                  <Chip
                                    label={`CAC: ${org.cac_number}`}
                                    size="small"
                                    variant="outlined"
                                    sx={{ fontSize: '0.7rem' }}
                                  />
                                )}
                              </Box>
                            }
                            secondary={
                              <Box>
                                <Typography variant="body2" color="textSecondary">
                                  {org.email} • {org.phone_number || 'No phone'}
                                </Typography>
                                <Typography variant="caption" color="textSecondary">
                                  Contact: {org.contact_person || 'N/A'} • Registered: {new Date(org.created_at).toLocaleDateString()}
                                </Typography>
                              </Box>
                            }
                          />
                        </ListItem>
                        {index < filteredOrganizations.length - 1 && <Divider />}
                      </React.Fragment>
                    ))}
                    
                    {filteredOrganizations.length === 0 && (
                      <Box sx={{ textAlign: 'center', py: 4 }}>
                        <BusinessIcon sx={{ fontSize: 48, color: '#ccc', mb: 2 }} />
                        <Typography variant="body1" color="textSecondary">
                          No organizations found
                        </Typography>
                      </Box>
                    )}
                  </List>
                </Box>
              </TabPanel>

              {/* System Settings Tab */}
              <TabPanel value={tabValue} index={2}>
                <Box sx={{ p: 3 }}>
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
                </Box>
              </TabPanel>
            </Paper>
          </Box>
        </Box>
      </Container>

      {/* Create/Edit Admin Dialog */}
      <Dialog open={adminDialogOpen} onClose={() => setAdminDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontFamily: '"Poppins", sans-serif' }}>
          {editingAdmin ? 'Edit Admin' : 'Create New Admin'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Full Name"
                value={adminFormData.fullName}
                onChange={(e) => setAdminFormData({ ...adminFormData, fullName: e.target.value })}
                required
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={adminFormData.email}
                onChange={(e) => setAdminFormData({ ...adminFormData, email: e.target.value })}
                required
                disabled={!!editingAdmin}
              />
            </Grid>

            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Admin Type</InputLabel>
                <Select
                  value={adminFormData.adminType}
                  onChange={(e) => setAdminFormData({ ...adminFormData, adminType: e.target.value })}
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
                    value={adminFormData.password}
                    onChange={(e) => setAdminFormData({ ...adminFormData, password: e.target.value })}
                    required
                    helperText="Minimum 6 characters"
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Confirm Password"
                    type="password"
                    value={adminFormData.confirmPassword}
                    onChange={(e) => setAdminFormData({ ...adminFormData, confirmPassword: e.target.value })}
                    required
                  />
                </Grid>
              </>
            )}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAdminDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={editingAdmin ? handleUpdateAdmin : handleCreateAdmin}
            variant="contained"
            sx={{ bgcolor: '#15e420', '&:hover': { bgcolor: '#12c21e' } }}
          >
            {editingAdmin ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Create/Edit Organization Dialog */}
      <Dialog open={orgDialogOpen} onClose={() => setOrgDialogOpen(false)} maxWidth="md" fullWidth scroll="paper">
        <DialogTitle sx={{ fontFamily: '"Poppins", sans-serif' }}>
          {editingOrg ? 'Edit Organization' : 'Create New Organization'}
        </DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2} sx={{ mt: 0 }}>
            {/* Basic Information */}
            <Grid item xs={12}>
              <Typography variant="subtitle2" sx={{ color: '#15e420', fontWeight: 600, mb: 1 }}>
                Basic Information
              </Typography>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Company Name"
                value={orgFormData.company_name}
                onChange={(e) => setOrgFormData({ ...orgFormData, company_name: e.target.value })}
                required
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={orgFormData.email}
                onChange={(e) => setOrgFormData({ ...orgFormData, email: e.target.value })}
                required
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Phone Number"
                value={orgFormData.phone_number}
                onChange={(e) => setOrgFormData({ ...orgFormData, phone_number: e.target.value })}
                required
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="CAC Number"
                value={orgFormData.cac_number}
                onChange={(e) => setOrgFormData({ ...orgFormData, cac_number: e.target.value })}
                required
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Office Address"
                value={orgFormData.office_address}
                onChange={(e) => setOrgFormData({ ...orgFormData, office_address: e.target.value })}
                required
                multiline
                rows={2}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Business Nature"
                value={orgFormData.business_nature}
                onChange={(e) => setOrgFormData({ ...orgFormData, business_nature: e.target.value })}
                required
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Bankers"
                value={orgFormData.bankers}
                onChange={(e) => setOrgFormData({ ...orgFormData, bankers: e.target.value })}
                required
              />
            </Grid>

            {/* Personnel Information */}
            <Grid item xs={12}>
              <Typography variant="subtitle2" sx={{ color: '#15e420', fontWeight: 600, mb: 1, mt: 2 }}>
                Personnel Information
              </Typography>
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Contact Person"
                value={orgFormData.contact_person}
                onChange={(e) => setOrgFormData({ ...orgFormData, contact_person: e.target.value })}
                required
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Representative"
                value={orgFormData.representative}
                onChange={(e) => setOrgFormData({ ...orgFormData, representative: e.target.value })}
                required
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="number"
                label="Nigerian Directors"
                value={orgFormData.nigerian_directors}
                onChange={(e) => setOrgFormData({ ...orgFormData, nigerian_directors: e.target.value })}
                required
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="number"
                label="Non-Nigerian Directors"
                value={orgFormData.non_nigerian_directors}
                onChange={(e) => setOrgFormData({ ...orgFormData, non_nigerian_directors: e.target.value })}
                required
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="number"
                label="Nigerian Employees"
                value={orgFormData.nigerian_employees}
                onChange={(e) => setOrgFormData({ ...orgFormData, nigerian_employees: e.target.value })}
                required
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="number"
                label="Non-Nigerian Employees"
                value={orgFormData.non_nigerian_employees}
                onChange={(e) => setOrgFormData({ ...orgFormData, non_nigerian_employees: e.target.value })}
                required
              />
            </Grid>

            {/* Referee 1 */}
            <Grid item xs={12}>
              <Typography variant="subtitle2" sx={{ color: '#15e420', fontWeight: 600, mb: 1, mt: 2 }}>
                Referee 1 Details
              </Typography>
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Referee 1 Name"
                value={orgFormData.referee1_name}
                onChange={(e) => setOrgFormData({ ...orgFormData, referee1_name: e.target.value })}
                required
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Referee 1 Business"
                value={orgFormData.referee1_business}
                onChange={(e) => setOrgFormData({ ...orgFormData, referee1_business: e.target.value })}
                required
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Referee 1 Phone"
                value={orgFormData.referee1_phone}
                onChange={(e) => setOrgFormData({ ...orgFormData, referee1_phone: e.target.value })}
                required
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Referee 1 Reg Number"
                value={orgFormData.referee1_reg_number}
                onChange={(e) => setOrgFormData({ ...orgFormData, referee1_reg_number: e.target.value })}
                required
              />
            </Grid>

            {/* Referee 2 */}
            <Grid item xs={12}>
              <Typography variant="subtitle2" sx={{ color: '#15e420', fontWeight: 600, mb: 1, mt: 2 }}>
                Referee 2 Details
              </Typography>
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Referee 2 Name"
                value={orgFormData.referee2_name}
                onChange={(e) => setOrgFormData({ ...orgFormData, referee2_name: e.target.value })}
                required
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Referee 2 Business"
                value={orgFormData.referee2_business}
                onChange={(e) => setOrgFormData({ ...orgFormData, referee2_business: e.target.value })}
                required
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Referee 2 Phone"
                value={orgFormData.referee2_phone}
                onChange={(e) => setOrgFormData({ ...orgFormData, referee2_phone: e.target.value })}
                required
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Referee 2 Reg Number"
                value={orgFormData.referee2_reg_number}
                onChange={(e) => setOrgFormData({ ...orgFormData, referee2_reg_number: e.target.value })}
                required
              />
            </Grid>

            {/* Additional Fields */}
            <Grid item xs={12}>
              <Typography variant="subtitle2" sx={{ color: '#15e420', fontWeight: 600, mb: 1, mt: 2 }}>
                Additional Information
              </Typography>
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="ID Type"
                value={orgFormData.id_type}
                onChange={(e) => setOrgFormData({ ...orgFormData, id_type: e.target.value })}
                placeholder="e.g., Passport, Driver's License"
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={orgFormData.status}
                  onChange={(e) => setOrgFormData({ ...orgFormData, status: e.target.value })}
                  label="Status"
                >
                  <MenuItem value="pending">Pending</MenuItem>
                  <MenuItem value="approved">Approved</MenuItem>
                  <MenuItem value="rejected">Rejected</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Password for new user (only when creating) */}
            {!editingOrg && (
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Password (for user account)"
                  type="password"
                  value={orgFormData.password}
                  onChange={(e) => setOrgFormData({ ...orgFormData, password: e.target.value })}
                  helperText="Leave blank to create without user account"
                />
              </Grid>
            )}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOrgDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={editingOrg ? handleUpdateOrganization : handleCreateOrganization}
            variant="contained"
            sx={{ bgcolor: '#15e420', '&:hover': { bgcolor: '#12c21e' } }}
          >
            {editingOrg ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default AdminSettings;