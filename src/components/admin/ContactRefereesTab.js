import React from 'react';
import {
  Grid,
  TextField,
  Typography,
  Box,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { 
  Person as PersonIcon, 
  Verified as VerifiedIcon,
  ContactMail as ContactMailIcon 
} from '@mui/icons-material';

const FormSection = styled(Box)(({ theme }) => ({
  padding: theme.spacing(3),
  marginBottom: theme.spacing(3),
  backgroundColor: '#fafafa',
  borderRadius: '12px',
  border: '1px solid #e0e0e0'
}));

const SectionTitle = styled(Typography)(({ theme }) => ({
  fontWeight: 600,
  fontSize: '1rem',
  color: '#333',
  marginBottom: theme.spacing(2),
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1)
}));

const ContactRefereesTab = ({ formData, formErrors, onFormChange }) => {
  return (
    <>
      <FormSection>
        <SectionTitle>
          <PersonIcon sx={{ color: '#15e420' }} />
          Contact Information
        </SectionTitle>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Contact Person"
              name="contact_person"
              value={formData.contact_person}
              onChange={onFormChange}
              size="small"
              placeholder="Primary contact person"
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Representative"
              name="representative"
              value={formData.representative}
              onChange={onFormChange}
              size="small"
              placeholder="Company representative"
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Phone Number 1"
              name="phone_number1"
              value={formData.phone_number1}
              onChange={onFormChange}
              size="small"
              placeholder="e.g. 08012345678"
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Phone Number 2"
              name="phone_number2"
              value={formData.phone_number2}
              onChange={onFormChange}
              size="small"
              placeholder="e.g. 08012345678"
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Email"
              name="email"
              type="email"
              value={formData.email}
              onChange={onFormChange}
              error={!!formErrors.email}
              helperText={formErrors.email}
              size="small"
              placeholder="company@example.com"
            />
          </Grid>
        </Grid>
      </FormSection>

      <FormSection>
        <SectionTitle>
          <VerifiedIcon sx={{ color: '#15e420' }} />
          Staff Information
        </SectionTitle>
        <Grid container spacing={2}>
          <Grid item xs={6} md={3}>
            <TextField
              fullWidth
              label="Nigerian Directors"
              name="nigerian_directors"
              type="number"
              value={formData.nigerian_directors}
              onChange={onFormChange}
              size="small"
              InputProps={{ inputProps: { min: 0 } }}
            />
          </Grid>
          <Grid item xs={6} md={3}>
            <TextField
              fullWidth
              label="Non-Nigerian Directors"
              name="non_nigerian_directors"
              type="number"
              value={formData.non_nigerian_directors}
              onChange={onFormChange}
              size="small"
              InputProps={{ inputProps: { min: 0 } }}
            />
          </Grid>
          <Grid item xs={6} md={3}>
            <TextField
              fullWidth
              label="Nigerian Employees"
              name="nigerian_employees"
              type="number"
              value={formData.nigerian_employees}
              onChange={onFormChange}
              size="small"
              InputProps={{ inputProps: { min: 0 } }}
            />
          </Grid>
          <Grid item xs={6} md={3}>
            <TextField
              fullWidth
              label="Non-Nigerian Employees"
              name="non_nigerian_employees"
              type="number"
              value={formData.non_nigerian_employees}
              onChange={onFormChange}
              size="small"
              InputProps={{ inputProps: { min: 0 } }}
            />
          </Grid>
        </Grid>
      </FormSection>

      {/* Referee */}
      <FormSection>
        <SectionTitle>
          <ContactMailIcon sx={{ color: '#15e420' }} />
          Referee
        </SectionTitle>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Full Name"
              name="referee_name"
              value={formData.referee_name}
              onChange={onFormChange}
              size="small"
              placeholder="Referee's full name"
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Business Name"
              name="referee_business"
              value={formData.referee_business}
              onChange={onFormChange}
              size="small"
              placeholder="Referee's business name"
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Phone Number"
              name="referee_phone"
              value={formData.referee_phone}
              onChange={onFormChange}
              size="small"
              placeholder="e.g. 08012345678"
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Registration Number"
              name="referee_reg_number"
              value={formData.referee_reg_number}
              onChange={onFormChange}
              size="small"
              placeholder="Referee's registration number"
            />
          </Grid>
        </Grid>
      </FormSection>
    </>
  );
};

export default ContactRefereesTab;