import React from 'react';
import { Paper, Box, Typography, Grid, Avatar } from '@mui/material';
import {
  Business as BusinessIcon,
  LocationOn as LocationIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  Badge as BadgeIcon,
  Description as DescriptionIcon
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import InfoItem from './InfoItem';

const StyledCard = styled(Paper)({
  padding: '20px',
  borderRadius: '20px',
  background: 'white',
  boxShadow: '0 5px 15px rgba(0, 0, 0, 0.05)',
  height: '100%',
  marginBottom: '20px'
});

const CardHeader = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  marginBottom: '16px',
  paddingBottom: '12px',
  borderBottom: '1px solid #f0f0f0'
});

const HeaderTitle = styled(Typography)({
  fontFamily: '"Poppins", sans-serif',
  fontWeight: 600,
  fontSize: '1.1rem',
  color: '#333'
});

const PhotoWrapper = styled(Box)({
  display: 'flex',
  justifyContent: 'center',
  marginBottom: '20px'
});

const ProfilePhoto = styled(Avatar)({
  width: '90px',
  height: '90px',
  border: '3px solid #15e420',
  boxShadow: '0 8px 20px rgba(21, 228, 32, 0.2)'
});

const OrganizationInfo = ({ organization, logoUrl, userEmail, isMobile }) => {
  // Log props for debugging
  console.log('OrganizationInfo props:', { 
    organization, 
    logoUrl, 
    userEmail, 
    isMobile,
    hasLogo: !!logoUrl,
    logoUrlValue: logoUrl
  });

  return (
    <StyledCard>
      <CardHeader>
        <Avatar sx={{ bgcolor: '#15e420', width: isMobile ? 36 : 40, height: isMobile ? 36 : 40 }}>
          <BusinessIcon fontSize="small" />
        </Avatar>
        <HeaderTitle>
          Organization Details
        </HeaderTitle>
      </CardHeader>

      <PhotoWrapper>
        <ProfilePhoto src={logoUrl}>
          {!logoUrl && <BusinessIcon sx={{ fontSize: '2.5rem' }} />}
        </ProfilePhoto>
        {/* Add a small text to show logo status */}
        <Typography variant="caption" sx={{ display: 'block', textAlign: 'center', mt: 1, color: '#999' }}>
          {logoUrl ? 'Logo loaded' : 'No logo available'}
        </Typography>
      </PhotoWrapper>


      <Grid container spacing={1.5}>
        <Grid item xs={12}>
          <InfoItem
            icon={<BusinessIcon />}
            label="Company Name"
            value={organization?.company_name || 'N/A'}
            delay={0.1}
          />
        </Grid>

        <Grid item xs={12}>
          <InfoItem
            icon={<LocationIcon />}
            label="Office Address"
            value={organization?.office_address || 'N/A'}
            delay={0.15}
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <InfoItem
            icon={<PhoneIcon />}
            label="Phone"
            value={organization?.phone_number || 'N/A'}
            delay={0.2}
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <InfoItem
            icon={<EmailIcon />}
            label="Email"
            value={organization?.email || userEmail || 'N/A'}
            delay={0.25}
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <InfoItem
            icon={<BadgeIcon />}
            label="CAC Number"
            value={organization?.cac_number || 'N/A'}
            delay={0.3}
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <InfoItem
            icon={<DescriptionIcon />}
            label="Business Nature"
            value={organization?.business_nature || 'N/A'}
            delay={0.35}
          />
        </Grid>
      </Grid>
    </StyledCard>
  );
};

export default OrganizationInfo;