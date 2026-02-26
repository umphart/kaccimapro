import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
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
  Grid
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  Business as BusinessIcon,
  Edit as EditIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import { supabase } from '../../supabaseClient';
import OrganizationForm from './OrganizationForm';

const OrganizationManagement = ({ showAlert, navigate }) => {
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
    password: ''
  });

  useEffect(() => {
    fetchOrganizations();
  }, []);

  useEffect(() => {
    filterOrganizations();
  }, [organizations, orgSearchTerm, orgStatusFilter]);

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

  const filterOrganizations = () => {
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
  };

 const handleCreateOrganization = async () => {
  try {
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

    // Prepare organization data
    const organizationData = {
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
      status: orgFormData.payment_confirmed ? 'payment_pending' : orgFormData.status || 'pending',
      user_id: userId,
      
      // Document paths
      cover_letter_path: orgFormData.cover_letter_path,
      memorandum_path: orgFormData.memorandum_path,
      registration_cert_path: orgFormData.registration_cert_path,
      incorporation_cert_path: orgFormData.incorporation_cert_path,
      premises_cert_path: orgFormData.premises_cert_path,
      company_logo_path: orgFormData.company_logo_path,
      form_c07_path: orgFormData.form_c07_path,
      id_document_path: orgFormData.id_document_path,
      
      // Additional fields
      re_upload_count: 0,
      document_rejection_reasons: {}
    };

    // Insert organization
    const { data, error } = await supabase
      .from('organizations')
      .insert([organizationData])
      .select();

    if (error) throw error;

    // If payment receipt was uploaded, create payment record
    if (orgFormData.payment_receipt_path && orgFormData.payment_confirmed) {
      const { error: paymentError } = await supabase
        .from('payments')
        .insert([{
          organization_id: data[0].id,
          user_id: userId,
          amount: 25000, // Registration + Subscription fee
          payment_method: 'Bank Transfer',
          receipt_path: orgFormData.payment_receipt_path,
          status: 'pending',
          payment_type: 'first'
        }]);

      if (paymentError) throw paymentError;
    }

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
    // Prepare update data
    const updateData = {
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
      status: orgFormData.payment_confirmed ? 'payment_pending' : orgFormData.status
    };

    // Only update document paths if they were changed
    if (orgFormData.cover_letter_path) updateData.cover_letter_path = orgFormData.cover_letter_path;
    if (orgFormData.memorandum_path) updateData.memorandum_path = orgFormData.memorandum_path;
    if (orgFormData.registration_cert_path) updateData.registration_cert_path = orgFormData.registration_cert_path;
    if (orgFormData.incorporation_cert_path) updateData.incorporation_cert_path = orgFormData.incorporation_cert_path;
    if (orgFormData.premises_cert_path) updateData.premises_cert_path = orgFormData.premises_cert_path;
    if (orgFormData.company_logo_path) updateData.company_logo_path = orgFormData.company_logo_path;
    if (orgFormData.form_c07_path) updateData.form_c07_path = orgFormData.form_c07_path;
    if (orgFormData.id_document_path) updateData.id_document_path = orgFormData.id_document_path;

    const { error } = await supabase
      .from('organizations')
      .update(updateData)
      .eq('id', editingOrg.id);

    if (error) throw error;

    // If payment receipt was uploaded and payment confirmed, create payment record
    if (orgFormData.payment_receipt_path && orgFormData.payment_confirmed && !editingOrg.payment_receipt_path) {
      const { error: paymentError } = await supabase
        .from('payments')
        .insert([{
          organization_id: editingOrg.id,
          user_id: editingOrg.user_id,
          amount: 25000,
          payment_method: 'Bank Transfer',
          receipt_path: orgFormData.payment_receipt_path,
          status: 'pending',
          payment_type: 'first'
        }]);

      if (paymentError) throw paymentError;
    }

    showAlert('success', 'Organization updated successfully');
    setOrgDialogOpen(false);
    resetOrgForm();
    fetchOrganizations();
  } catch (error) {
    console.error('Error updating organization:', error);
    showAlert('error', error.message);
  }
};

// Update resetOrgForm function
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
    password: '',
    
    // Document fields
    cover_letter_path: '',
    memorandum_path: '',
    registration_cert_path: '',
    incorporation_cert_path: '',
    premises_cert_path: '',
    company_logo_path: '',
    form_c07_path: '',
    id_document_path: '',
    
    // Payment fields
    payment_receipt_path: '',
    payment_confirmed: false
  });
  setEditingOrg(null);
};

// Update openEditOrgDialog function
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
    password: '',
    
    // Document fields
    cover_letter_path: org.cover_letter_path || '',
    memorandum_path: org.memorandum_path || '',
    registration_cert_path: org.registration_cert_path || '',
    incorporation_cert_path: org.incorporation_cert_path || '',
    premises_cert_path: org.premises_cert_path || '',
    company_logo_path: org.company_logo_path || '',
    form_c07_path: org.form_c07_path || '',
    id_document_path: org.id_document_path || '',
    
    // Payment fields
    payment_receipt_path: org.payment_receipt_path || '',
    payment_confirmed: false
  });
  setOrgDialogOpen(true);
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


  return (
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

      {/* Organization Dialog */}
      <Dialog open={orgDialogOpen} onClose={() => setOrgDialogOpen(false)} maxWidth="md" fullWidth scroll="paper">
        <DialogTitle sx={{ fontFamily: '"Poppins", sans-serif' }}>
          {editingOrg ? 'Edit Organization' : 'Create New Organization'}
        </DialogTitle>
        <DialogContent dividers>
          <OrganizationForm 
            formData={orgFormData}
            setFormData={setOrgFormData}
            isEditing={!!editingOrg}
          />
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
    </Box>
  );
};

export default OrganizationManagement;