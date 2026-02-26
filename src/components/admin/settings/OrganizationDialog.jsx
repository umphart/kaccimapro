import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Typography
} from '@mui/material';
import { handleCreateOrganization, handleUpdateOrganization } from './settingsUtils';

const OrganizationDialog = ({ open, onClose, editingOrg, formData, setFormData, onSuccess, showAlert }) => {
  const handleSubmit = async () => {
    if (editingOrg) {
      const updated = await handleUpdateOrganization(editingOrg.id, formData, showAlert);
      if (updated) {
        onSuccess(updated);
      }
    } else {
      const created = await handleCreateOrganization(formData, showAlert);
      if (created) {
        onSuccess(created);
      }
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth scroll="paper">
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
              value={formData.company_name}
              onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
              required
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Phone Number"
              value={formData.phone_number}
              onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
              required
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="CAC Number"
              value={formData.cac_number}
              onChange={(e) => setFormData({ ...formData, cac_number: e.target.value })}
              required
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Office Address"
              value={formData.office_address}
              onChange={(e) => setFormData({ ...formData, office_address: e.target.value })}
              required
              multiline
              rows={2}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Business Nature"
              value={formData.business_nature}
              onChange={(e) => setFormData({ ...formData, business_nature: e.target.value })}
              required
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Bankers"
              value={formData.bankers}
              onChange={(e) => setFormData({ ...formData, bankers: e.target.value })}
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
              value={formData.contact_person}
              onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
              required
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Representative"
              value={formData.representative}
              onChange={(e) => setFormData({ ...formData, representative: e.target.value })}
              required
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              type="number"
              label="Nigerian Directors"
              value={formData.nigerian_directors}
              onChange={(e) => setFormData({ ...formData, nigerian_directors: e.target.value })}
              required
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              type="number"
              label="Non-Nigerian Directors"
              value={formData.non_nigerian_directors}
              onChange={(e) => setFormData({ ...formData, non_nigerian_directors: e.target.value })}
              required
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              type="number"
              label="Nigerian Employees"
              value={formData.nigerian_employees}
              onChange={(e) => setFormData({ ...formData, nigerian_employees: e.target.value })}
              required
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              type="number"
              label="Non-Nigerian Employees"
              value={formData.non_nigerian_employees}
              onChange={(e) => setFormData({ ...formData, non_nigerian_employees: e.target.value })}
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
              value={formData.referee1_name}
              onChange={(e) => setFormData({ ...formData, referee1_name: e.target.value })}
              required
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Referee 1 Business"
              value={formData.referee1_business}
              onChange={(e) => setFormData({ ...formData, referee1_business: e.target.value })}
              required
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Referee 1 Phone"
              value={formData.referee1_phone}
              onChange={(e) => setFormData({ ...formData, referee1_phone: e.target.value })}
              required
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Referee 1 Reg Number"
              value={formData.referee1_reg_number}
              onChange={(e) => setFormData({ ...formData, referee1_reg_number: e.target.value })}
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
              value={formData.referee2_name}
              onChange={(e) => setFormData({ ...formData, referee2_name: e.target.value })}
              required
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Referee 2 Business"
              value={formData.referee2_business}
              onChange={(e) => setFormData({ ...formData, referee2_business: e.target.value })}
              required
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Referee 2 Phone"
              value={formData.referee2_phone}
              onChange={(e) => setFormData({ ...formData, referee2_phone: e.target.value })}
              required
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Referee 2 Reg Number"
              value={formData.referee2_reg_number}
              onChange={(e) => setFormData({ ...formData, referee2_reg_number: e.target.value })}
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
              value={formData.id_type}
              onChange={(e) => setFormData({ ...formData, id_type: e.target.value })}
              placeholder="e.g., Passport, Driver's License"
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
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
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                helperText="Leave blank to create without user account"
              />
            </Grid>
          )}
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          sx={{ bgcolor: '#15e420', '&:hover': { bgcolor: '#12c21e' } }}
        >
          {editingOrg ? 'Update' : 'Create'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default OrganizationDialog;