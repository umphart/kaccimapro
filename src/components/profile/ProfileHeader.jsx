import React from 'react';
import { Box, Typography, IconButton, Tooltip } from '@mui/material';
import { Logout as LogoutIcon } from '@mui/icons-material';
import { styled } from '@mui/material/styles';

const HeaderContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  marginBottom: theme.spacing(2.5),
  flexWrap: 'wrap',
  gap: theme.spacing(1.5)
}));

const Title = styled(Typography)(({ theme }) => ({
  fontFamily: '"Poppins", sans-serif',
  fontWeight: 600,
  fontSize: '1.5rem',
  color: '#333',
  [theme.breakpoints.down('sm')]: {
    fontSize: '1.25rem'
  }
}));

const Subtitle = styled(Typography)({
  fontSize: '0.85rem',
  color: '#666',
  marginTop: '4px'
});

const ProfileHeader = ({ organizationName, onLogout, isMobile }) => {
  return (
    <HeaderContainer>
      <Box>
        <Title variant="h4">
          My Profile
        </Title>
        <Subtitle variant="body2">
          {organizationName || 'Manage your account information'}
        </Subtitle>
      </Box>
      <Tooltip title="Logout">
        <IconButton 
          onClick={onLogout}
          size={isMobile ? "small" : "medium"}
          sx={{ 
            color: '#dc3545',
            bgcolor: 'white',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            '&:hover': { 
              bgcolor: '#dc3545',
              color: 'white'
            }
          }}
        >
          <LogoutIcon fontSize={isMobile ? "small" : "medium"} />
        </IconButton>
      </Tooltip>
    </HeaderContainer>
  );
};

export default ProfileHeader;