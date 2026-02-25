import React from 'react';
import { Paper, Box, Typography, Grid, Avatar, Button } from '@mui/material';
import {
  Verified as VerifiedIcon,
  CheckCircle as CheckCircleIcon,
  Groups as GroupsIcon,
  BusinessCenter as BusinessIcon,
  SupportAgent as SupportIcon
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';

const StyledCard = styled(Paper)({
  padding: '20px',
  borderRadius: '20px',
  background: 'white',
  boxShadow: '0 5px 15px rgba(0, 0, 0, 0.05)',
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

const BenefitItem = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  padding: '10px 12px',
  background: '#f8f9fa',
  borderRadius: '10px',
  height: '100%'
});

const BenefitIcon = styled(Box)({
  width: '36px',
  height: '36px',
  borderRadius: '8px',
  background: 'rgba(21, 228, 32, 0.1)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: '#15e420',
  '& svg': {
    fontSize: '1.2rem'
  }
});

const BenefitTitle = styled(Typography)({
  fontWeight: 600,
  fontSize: '0.9rem',
  color: '#333',
  marginBottom: '2px'
});

const BenefitDesc = styled(Typography)({
  fontSize: '0.75rem',
  color: '#666',
  lineHeight: 1.3
});

const MembershipBenefits = ({ isMobile }) => {
  const navigate = useNavigate();

  const benefits = [
    {
      icon: <GroupsIcon />,
      title: 'Networking',
      description: 'Connect with business leaders and potential partners'
    },
    {
      icon: <BusinessIcon />,
      title: 'Resources',
      description: 'Access to market research and business tools'
    },
    {
      icon: <SupportIcon />,
      title: 'Support',
      description: 'Business advocacy and support services'
    }
  ];

  return (
    <StyledCard>
      <CardHeader>
        <Avatar sx={{ bgcolor: '#15e420', width: isMobile ? 36 : 40, height: isMobile ? 36 : 40 }}>
          <VerifiedIcon fontSize="small" />
        </Avatar>
        <HeaderTitle>
          Membership Benefits
        </HeaderTitle>
      </CardHeader>
      
      <Grid container spacing={1.5}>
        {benefits.map((benefit, index) => (
          <Grid item xs={12} md={4} key={index}>
            <BenefitItem>
              <BenefitIcon>
                {benefit.icon}
              </BenefitIcon>
              <Box>
                <BenefitTitle variant="subtitle2">
                  {benefit.title}
                </BenefitTitle>
                <BenefitDesc variant="caption">
                  {benefit.description}
                </BenefitDesc>
              </Box>
            </BenefitItem>
          </Grid>
        ))}
      </Grid>

      <Box sx={{ mt: 2.5, textAlign: 'center' }}>
        <Button
          onClick={() => navigate('/contact')}
          sx={{ 
            color: '#15e420',
            fontWeight: 600,
            fontSize: '0.85rem',
            textTransform: 'none'
          }}
        >
          Contact Support for More Information
        </Button>
      </Box>
    </StyledCard>
  );
};

export default MembershipBenefits;