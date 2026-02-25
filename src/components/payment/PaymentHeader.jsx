import React from 'react';
import { Box, Typography, IconButton } from '@mui/material';
import { ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import { PAYMENT_TYPES } from './paymentConstants';

const PaymentHeader = ({ paymentType, companyName, onBack }) => {
  const getTitle = () => {
    switch(paymentType) {
      case PAYMENT_TYPES.FIRST:
        return 'First Time Payment';
      case PAYMENT_TYPES.RENEWAL:
        return 'Annual Renewal';
      case PAYMENT_TYPES.NOT_DUE:
        return 'Membership Status';
      default:
        return 'Payment';
    }
  };

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
      <IconButton 
        onClick={onBack}
        sx={{ 
          color: '#15e420', 
          bgcolor: 'white',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          '&:hover': { bgcolor: '#f0f0f0' }
        }}
      >
        <ArrowBackIcon />
      </IconButton>
      <Box>
        <Typography 
          variant="h4" 
          sx={{ 
            fontFamily: '"Poppins", sans-serif',
            fontWeight: 700,
            color: '#333',
            mb: 0.5
          }}
        >
          {getTitle()}
        </Typography>
        <Typography variant="body1" sx={{ color: '#666' }}>
          {companyName}
        </Typography>
      </Box>
    </Box>
  );
};

export default PaymentHeader;