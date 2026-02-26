import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  Avatar,
  Chip,
  Divider,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid
} from '@mui/material';
import {
  PersonAdd as PersonAddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  AdminPanelSettings as AdminIcon
} from '@mui/icons-material';
import { supabase } from '../../supabaseClient';

const AdminManagement = ({ showAlert }) => {
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

  useEffect(() => {
    fetchAdmins();
  }, []);

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

  return (
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
    </Box>
  );
};

export default AdminManagement;