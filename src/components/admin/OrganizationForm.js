import React from 'react';
import {
  Grid,
  TextField,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';

const OrganizationForm = ({ formData, setFormData, isEditing }) => {
  const handleChange = (field) => (e) => {
    setFormData({ ...formData, [field]: e.target.value });
  };

  return (
    <Grid container spacing={2}>
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
          onChange={handleChange('company_name')}
          required
        />
      </Grid>

      <Grid item xs={12} md={6}>
        <TextField
          fullWidth
          label="Email"
          type="email"
          value={formData.email}
          onChange={handleChange('email')}
          required
        />
      </Grid>

      <Grid item xs={12} md={6}>
        <TextField
          fullWidth
          label="Phone Number"
          value={formData.phone_number}
          onChange={handleChange('phone_number')}
          required
        />
      </Grid>

      <Grid item xs={12} md={6}>
        <TextField
          fullWidth
          label="CAC Number"
          value={formData.cac_number}
          onChange={handleChange('cac_number')}
          required
        />
      </Grid>

      <Grid item xs={12}>
        <TextField
          fullWidth
          label="Office Address"
          value={formData.office_address}
          onChange={handleChange('office_address')}
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
          onChange={handleChange('business_nature')}
          required
        />
      </Grid>

      <Grid item xs={12} md={6}>
        <TextField
          fullWidth
          label="Bankers"
          value={formData.bankers}
          onChange={handleChange('bankers')}
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
          onChange={handleChange('contact_person')}
          required
        />
      </Grid>

      <Grid item xs={12} md={6}>
        <TextField
          fullWidth
          label="Representative"
          value={formData.representative}
          onChange={handleChange('representative')}
          required
        />
      </Grid>

      <Grid item xs={12} md={6}>
        <TextField
          fullWidth
          type="number"
          label="Nigerian Directors"
          value={formData.nigerian_directors}
          onChange={handleChange('nigerian_directors')}
          required
        />
      </Grid>

      <Grid item xs={12} md={6}>
        <TextField
          fullWidth
          type="number"
          label="Non-Nigerian Directors"
          value={formData.non_nigerian_directors}
          onChange={handleChange('non_nigerian_directors')}
          required
        />
      </Grid>

      <Grid item xs={12} md={6}>
        <TextField
          fullWidth
          type="number"
          label="Nigerian Employees"
          value={formData.nigerian_employees}
          onChange={handleChange('nigerian_employees')}
          required
        />
      </Grid>

      <Grid item xs={12} md={6}>
        <TextField
          fullWidth
          type="number"
          label="Non-Nigerian Employees"
          value={formData.non_nigerian_employees}
          onChange={handleChange('non_nigerian_employees')}
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
          onChange={handleChange('referee1_name')}
          required
        />
      </Grid>

      <Grid item xs={12} md={6}>
        <TextField
          fullWidth
          label="Referee 1 Business"
          value={formData.referee1_business}
          onChange={handleChange('referee1_business')}
          required
        />
      </Grid>

      <Grid item xs={12} md={6}>
        <TextField
          fullWidth
          label="Referee 1 Phone"
          value={formData.referee1_phone}
          onChange={handleChange('referee1_phone')}
          required
        />
      </Grid>

      <Grid item xs={12} md={6}>
        <TextField
          fullWidth
          label="Referee 1 Reg Number"
          value={formData.referee1_reg_number}
          onChange={handleChange('referee1_reg_number')}
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
          onChange={handleChange('referee2_name')}
          required
        />
      </Grid>

      <Grid item xs={12} md={6}>
        <TextField
          fullWidth
          label="Referee 2 Business"
          value={formData.referee2_business}
          onChange={handleChange('referee2_business')}
          required
        />
      </Grid>

      <Grid item xs={12} md={6}>
        <TextField
          fullWidth
          label="Referee 2 Phone"
          value={formData.referee2_phone}
          onChange={handleChange('referee2_phone')}
          required
        />
      </Grid>

      <Grid item xs={12} md={6}>
        <TextField
          fullWidth
          label="Referee 2 Reg Number"
          value={formData.referee2_reg_number}
          onChange={handleChange('referee2_reg_number')}
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
          onChange={handleChange('id_type')}
          placeholder="e.g., Passport, Driver's License"
        />
      </Grid>

      <Grid item xs={12} md={6}>
        <FormControl fullWidth>
          <InputLabel>Status</InputLabel>
          <Select
            value={formData.status}
            onChange={handleChange('status')}
            label="Status"
          >
            <MenuItem value="pending">Pending</MenuItem>
            <MenuItem value="approved">Approved</MenuItem>
            <MenuItem value="rejected">Rejected</MenuItem>
          </Select>
        </FormControl>
      </Grid>

      {/* Password for new user (only when creating) */}
      {!isEditing && (
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Password (for user account)"
            type="password"
            value={formData.password}
            onChange={handleChange('password')}
            helperText="Leave blank to create without user account"
          />
        </Grid>
      )}
    </Grid>
  );
};

export default OrganizationForm;