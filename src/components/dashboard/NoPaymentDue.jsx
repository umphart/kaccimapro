// components/dashboard/states/NoPaymentDue.jsx
import React from 'react';
import { Box, Typography, Button, Paper } from '@mui/material';
import { Payment as PaymentIcon, Verified as VerifiedIcon } from '@mui/icons-material';

const NoPaymentDue = ({ organization, onProceedToPayment }) => {
  return (
    <Paper 
      elevation={3}
      sx={{ 
        p: 4, 
        borderRadius: '16px',
        textAlign: 'center',
        maxWidth: 600,
        mx: 'auto'
      }}
    >
      <Box sx={{ mb: 3 }}>
        <VerifiedIcon sx={{ fontSize: 80, color: '#15e420', mb: 2 }} />
      </Box>
      
      <Typography variant="h5" sx={{ fontWeight: 700, color: '#333', mb: 2 }}>
        Organization Approved! 🎉
      </Typography>
      
      <Typography variant="body1" sx={{ color: '#666', mb: 1 }}>
        Your organization <strong>{organization?.company_name}</strong> has been approved!
      </Typography>
      
      <Typography variant="body2" sx={{ color: '#666', mb: 3 }}>
        To activate your full membership benefits, please complete your first payment.
      </Typography>

      <Box sx={{ 
        bgcolor: '#f0fdf0', 
        p: 3, 
        borderRadius: '12px',
        mb: 3,
        textAlign: 'left'
      }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#15e420', mb: 1 }}>
          Next Steps:
        </Typography>
        <Typography variant="body2" sx={{ color: '#666' }}>
          1. Make payment of ₦25,000 (Registration + First Year Subscription)
        </Typography>
        <Typography variant="body2" sx={{ color: '#666' }}>
          2. Upload your payment receipt for verification
        </Typography>
        <Typography variant="body2" sx={{ color: '#666' }}>
          3. Get instant access to all membership benefits
        </Typography>
      </Box>

      <Button
        variant="contained"
        size="large"
        startIcon={<PaymentIcon />}
        onClick={onProceedToPayment}
        sx={{
          bgcolor: '#15e420',
          '&:hover': { bgcolor: '#12c21e' },
          px: 4,
          py: 1.5,
          borderRadius: '12px',
          fontWeight: 600
        }}
      >
        Proceed to Payment
      </Button>
    </Paper>
  );
};

export default NoPaymentDue;