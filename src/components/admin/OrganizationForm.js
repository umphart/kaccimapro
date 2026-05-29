import React from 'react';
import {
  Grid,
  TextField,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
  Box,
  Avatar,
  Chip,
  Divider,
  useTheme,
  alpha,
  InputAdornment,
  Tooltip
} from '@mui/material';
import {
  BusinessCenter,
  Email,
  Phone,
  AssignmentInd,
  LocationCity,
  AccountBalance,
  People,
  Badge,
  Description,
  Person,
  Numbers,
  Receipt,
  Lock,
  CheckCircle
} from '@mui/icons-material';

const OrganizationForm = ({ formData, setFormData, isEditing }) => {
  const theme = useTheme();
  
  const handleChange = (field) => (e) => {
    setFormData({ ...formData, [field]: e.target.value });
  };

  const SectionHeader = ({ icon: Icon, title, subtitle }) => (
    <Box sx={{ mb: 3, mt: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Avatar
          sx={{
            bgcolor: alpha('#15e420', 0.1),
            color: '#15e420',
            width: 40,
            height: 40
          }}
        >
          <Icon />
        </Avatar>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 600, color: '#1a1a1a' }}>
            {title}
          </Typography>
          {subtitle && (
            <Typography variant="body2" sx={{ color: '#666' }}>
              {subtitle}
            </Typography>
          )}
        </Box>
      </Box>
      <Divider sx={{ mt: 1.5, borderColor: alpha('#15e420', 0.2) }} />
    </Box>
  );

  const StyledTextField = ({ icon: Icon, tooltip, ...props }) => (
    <Tooltip title={tooltip || ''} arrow placement="top">
      <TextField
        {...props}
        fullWidth
        variant="outlined"
        InputProps={{
          startAdornment: Icon && (
            <InputAdornment position="start">
              <Icon sx={{ color: alpha('#15e420', 0.7), fontSize: 20 }} />
            </InputAdornment>
          ),
          sx: {
            borderRadius: 2,
            '&:hover': {
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: '#15e420',
              }
            },
            '&.Mui-focused': {
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: '#15e420',
                borderWidth: 2
              }
            }
          }
        }}
        InputLabelProps={{
          sx: {
            '&.Mui-focused': {
              color: '#15e420'
            }
          }
        }}
      />
    </Tooltip>
  );

  return (
    <Box sx={{ p: { xs: 1, sm: 2 } }}>
      {/* Basic Information Section */}
      <Paper 
        elevation={0} 
        sx={{ 
          p: 3, 
          mb: 4, 
          borderRadius: 3,
          border: '1px solid',
          borderColor: alpha('#15e420', 0.2),
          background: `linear-gradient(145deg, #ffffff 0%, ${alpha('#15e420', 0.02)} 100%)`
        }}
      >
        <SectionHeader 
          icon={BusinessCenter} 
          title="Basic Information" 
          subtitle="Company details and contact information"
        />
        
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <StyledTextField
              icon={BusinessCenter}
              tooltip="Enter your registered company name"
              label="Company Name"
              value={formData.company_name}
              onChange={handleChange('company_name')}
              required
              placeholder="e.g., ABC Enterprises Ltd"
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <StyledTextField
              icon={Email}
              tooltip="Official company email address"
              label="Email"
              type="email"
              value={formData.email}
              onChange={handleChange('email')}
              required
              placeholder="company@example.com"
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <StyledTextField
              icon={Phone}
              tooltip="Primary contact phone number"
              label="Phone Number"
              value={formData.phone_number}
              onChange={handleChange('phone_number')}
              required
              placeholder="+234 XXX XXX XXXX"
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <StyledTextField
              icon={Receipt}
              tooltip="Corporate Affairs Commission registration number"
              label="CAC Number"
              value={formData.cac_number}
              onChange={handleChange('cac_number')}
              required
              placeholder="RC-XXXXX"
            />
          </Grid>

          <Grid item xs={12}>
            <StyledTextField
              icon={LocationCity}
              tooltip="Full office address"
              label="Office Address"
              value={formData.office_address}
              onChange={handleChange('office_address')}
              required
              multiline
              rows={2}
              placeholder="Enter complete office address"
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <StyledTextField
              icon={Description}
              tooltip="Nature of your business operations"
              label="Business Nature"
              value={formData.business_nature}
              onChange={handleChange('business_nature')}
              required
              placeholder="e.g., Manufacturing, Trading, Services"
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <StyledTextField
              icon={AccountBalance}
              tooltip="Your company's bankers"
              label="Bankers"
              value={formData.bankers}
              onChange={handleChange('bankers')}
              required
              placeholder="e.g., First Bank, GTBank"
            />
          </Grid>
        </Grid>
      </Paper>

      {/* Personnel Information Section */}
      <Paper 
        elevation={0} 
        sx={{ 
          p: 3, 
          mb: 4, 
          borderRadius: 3,
          border: '1px solid',
          borderColor: alpha('#15e420', 0.2),
          background: `linear-gradient(145deg, #ffffff 0%, ${alpha('#15e420', 0.02)} 100%)`
        }}
      >
        <SectionHeader 
          icon={People} 
          title="Personnel Information" 
          subtitle="Key personnel and staff details"
        />
        
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <StyledTextField
              icon={Person}
              label="Contact Person"
              value={formData.contact_person}
              onChange={handleChange('contact_person')}
              required
              placeholder="Primary contact name"
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <StyledTextField
              icon={Badge}
              label="Representative"
              value={formData.representative}
              onChange={handleChange('representative')}
              required
              placeholder="Company representative name"
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <StyledTextField
              icon={Numbers}
              type="number"
              label="Nigerian Directors"
              value={formData.nigerian_directors}
              onChange={handleChange('nigerian_directors')}
              required
              InputProps={{ inputProps: { min: 0 } }}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <StyledTextField
              icon={Numbers}
              type="number"
              label="Non-Nigerian Directors"
              value={formData.non_nigerian_directors}
              onChange={handleChange('non_nigerian_directors')}
              required
              InputProps={{ inputProps: { min: 0 } }}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <StyledTextField
              icon={Numbers}
              type="number"
              label="Nigerian Employees"
              value={formData.nigerian_employees}
              onChange={handleChange('nigerian_employees')}
              required
              InputProps={{ inputProps: { min: 0 } }}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <StyledTextField
              icon={Numbers}
              type="number"
              label="Non-Nigerian Employees"
              value={formData.non_nigerian_employees}
              onChange={handleChange('non_nigerian_employees')}
              required
              InputProps={{ inputProps: { min: 0 } }}
            />
          </Grid>
        </Grid>
      </Paper>

      {/* Referees Section */}
      <Paper 
        elevation={0} 
        sx={{ 
          p: 3, 
          mb: 4, 
          borderRadius: 3,
          border: '1px solid',
          borderColor: alpha('#15e420', 0.2),
          background: `linear-gradient(145deg, #ffffff 0%, ${alpha('#15e420', 0.02)} 100%)`
        }}
      >
        <SectionHeader 
          icon={AssignmentInd} 
          title="Referee Details" 
          subtitle="Two business referees required"
        />
        
        <Box sx={{ mb: 4 }}>
          <Chip 
            label="Referee 1" 
            sx={{ 
              mb: 2, 
              bgcolor: alpha('#15e420', 0.1),
              color: '#15e420',
              fontWeight: 600,
              '& .MuiChip-label': { px: 2 }
            }} 
          />
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <StyledTextField
                label="Referee 1 Name"
                value={formData.referee1_name}
                onChange={handleChange('referee1_name')}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <StyledTextField
                label="Referee 1 Business"
                value={formData.referee1_business}
                onChange={handleChange('referee1_business')}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <StyledTextField
                icon={Phone}
                label="Referee 1 Phone"
                value={formData.referee1_phone}
                onChange={handleChange('referee1_phone')}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <StyledTextField
                icon={Receipt}
                label="Referee 1 Reg Number"
                value={formData.referee1_reg_number}
                onChange={handleChange('referee1_reg_number')}
                required
              />
            </Grid>
          </Grid>
        </Box>

        <Box>
          <Chip 
            label="Referee 2" 
            sx={{ 
              mb: 2, 
              bgcolor: alpha('#15e420', 0.1),
              color: '#15e420',
              fontWeight: 600,
              '& .MuiChip-label': { px: 2 }
            }} 
          />
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <StyledTextField
                label="Referee 2 Name"
                value={formData.referee2_name}
                onChange={handleChange('referee2_name')}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <StyledTextField
                label="Referee 2 Business"
                value={formData.referee2_business}
                onChange={handleChange('referee2_business')}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <StyledTextField
                icon={Phone}
                label="Referee 2 Phone"
                value={formData.referee2_phone}
                onChange={handleChange('referee2_phone')}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <StyledTextField
                icon={Receipt}
                label="Referee 2 Reg Number"
                value={formData.referee2_reg_number}
                onChange={handleChange('referee2_reg_number')}
                required
              />
            </Grid>
          </Grid>
        </Box>
      </Paper>

      {/* Additional Information Section */}
      <Paper 
        elevation={0} 
        sx={{ 
          p: 3, 
          mb: 4, 
          borderRadius: 3,
          border: '1px solid',
          borderColor: alpha('#15e420', 0.2),
          background: `linear-gradient(145deg, #ffffff 0%, ${alpha('#15e420', 0.02)} 100%)`
        }}
      >
        <SectionHeader 
          icon={Description} 
          title="Additional Information" 
          subtitle="Other relevant details"
        />
        
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <StyledTextField
              icon={Badge}
              label="ID Type"
              value={formData.id_type}
              onChange={handleChange('id_type')}
              placeholder="e.g., Passport, Driver's License, National ID"
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <FormControl fullWidth variant="outlined">
              <InputLabel sx={{ '&.Mui-focused': { color: '#15e420' } }}>
                Status
              </InputLabel>
              <Select
                value={formData.status}
                onChange={handleChange('status')}
                label="Status"
                sx={{
                  borderRadius: 2,
                  '&:hover': {
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#15e420',
                    }
                  },
                  '&.Mui-focused': {
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#15e420',
                      borderWidth: 2
                    }
                  }
                }}
              >
                <MenuItem value="pending">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#ff9800' }} />
                    Pending
                  </Box>
                </MenuItem>
                <MenuItem value="approved">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CheckCircle sx={{ color: '#4caf50', fontSize: 16 }} />
                    Approved
                  </Box>
                </MenuItem>
                <MenuItem value="rejected">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#f44336' }} />
                    Rejected
                  </Box>
                </MenuItem>
              </Select>
            </FormControl>
          </Grid>

          {!isEditing && (
            <Grid item xs={12}>
              <StyledTextField
                icon={Lock}
                type="password"
                label="Password (for user account)"
                value={formData.password}
                onChange={handleChange('password')}
                helperText={
                  <Typography variant="caption" sx={{ color: '#666' }}>
                    Leave blank to create without user account
                  </Typography>
                }
              />
            </Grid>
          )}
        </Grid>
      </Paper>
    </Box>
  );
};

export default OrganizationForm;