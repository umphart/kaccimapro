import React from 'react';
import { Paper, Box, Typography, Grid, Avatar, Divider, Button } from '@mui/material';
import {
  Security as SecurityIcon,
  Email as EmailIcon,
  CalendarToday as CalendarIcon,
  AccessTime as AccessTimeIcon,
  Lock as LockIcon,
  ArrowForward as ArrowForwardIcon
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

const StyledButton = styled(Button)({
  borderRadius: '8px',
  padding: '8px 16px',
  fontWeight: 600,
  textTransform: 'none',
  fontSize: '0.9rem',
  background: 'linear-gradient(135deg, #15e420 0%, #0fa819 100%)',
  color: 'white',
  width: '100%',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: '0 8px 20px rgba(21, 228, 32, 0.3)'
  }
});

const ProfileSecurity = ({ user, onOpenPasswordModal, isMobile }) => {
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-NG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <StyledCard>
      <CardHeader>
        <Avatar sx={{ bgcolor: '#15e420', width: isMobile ? 36 : 40, height: isMobile ? 36 : 40 }}>
          <SecurityIcon fontSize="small" />
        </Avatar>
        <HeaderTitle>
          Profile & Security
        </HeaderTitle>
      </CardHeader>

      <Grid container spacing={1.5}>
        <Grid item xs={12}>
          <InfoItem
            icon={<EmailIcon />}
            label="Email Address"
            value={user?.email || 'N/A'}
            delay={0.1}
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <InfoItem
            icon={<CalendarIcon />}
            label="Last Sign In"
            value={formatDate(user?.last_sign_in_at)}
            delay={0.2}
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <InfoItem
            icon={<AccessTimeIcon />}
            label="Account Created"
            value={formatDate(user?.created_at)}
            delay={0.25}
          />
        </Grid>

        <Grid item xs={12}>
          <InfoItem
            icon={<LockIcon />}
            label="Password"
            value="••••••••"
            delay={0.3}
          />
        </Grid>
      </Grid>

      <Divider sx={{ my: 2.5 }} />

      <StyledButton
        onClick={onOpenPasswordModal}
        endIcon={<ArrowForwardIcon fontSize="small" />}
      >
        Change Password
      </StyledButton>
    </StyledCard>
  );
};

export default ProfileSecurity;