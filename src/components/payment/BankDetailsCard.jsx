import React from 'react';
import { Paper, Box, Typography, Divider } from '@mui/material';
import { AccountBalance as AccountBalanceIcon, Info as InfoIcon } from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { formatCurrency } from '../../utils/paymentUtils';

const BankDetailsCard = styled(Paper)({
  padding: '1.5rem',
  background: 'linear-gradient(145deg, #ffffff 0%, #f8f9fa 100%)',
  borderRadius: '16px',
  marginBottom: '2rem',
  border: '1px solid rgba(21, 228, 32, 0.1)',
  position: 'relative',
  overflow: 'hidden',
  '&::after': {
    content: '""',
    position: 'absolute',
    top: 0,
    right: 0,
    width: '100px',
    height: '100px',
    background: 'rgba(21, 228, 32, 0.03)',
    borderRadius: '50%',
    transform: 'translate(50%, -50%)'
  }
});

const BankDetailRow = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  padding: '0.75rem 0',
  borderBottom: '1px solid #f0f0f0',
  '&:last-child': {
    borderBottom: 'none'
  }
});

const BankLabel = styled(Typography)({
  minWidth: '140px',
  fontWeight: 600,
  color: '#666',
  fontSize: '0.9rem'
});

const BankValue = styled(Typography)({
  color: '#333',
  fontWeight: 500,
  fontSize: '1rem'
});

const BankDetails = ({ bankName, accountName, accountNumber, amount }) => {
  return (
    <BankDetailsCard elevation={2}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <AccountBalanceIcon sx={{ color: '#15e420' }} />
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          Bank Transfer Details
        </Typography>
      </Box>
      
      <BankDetailRow>
        <BankLabel>Bank Name:</BankLabel>
        <BankValue>{bankName}</BankValue>
      </BankDetailRow>
      
      <BankDetailRow>
        <BankLabel>Account Name:</BankLabel>
        <BankValue sx={{ fontWeight: 600 }}>
          {accountName}
        </BankValue>
      </BankDetailRow>
      
      <BankDetailRow>
        <BankLabel>Account Number:</BankLabel>
        <BankValue sx={{ fontSize: '1.2rem', fontWeight: 700, color: '#15e420' }}>
          {accountNumber}
        </BankValue>
      </BankDetailRow>
      
      <BankDetailRow>
        <BankLabel>Amount:</BankLabel>
        <BankValue sx={{ fontSize: '1.5rem', fontWeight: 700, color: '#15e420' }}>
          {formatCurrency(amount)}
        </BankValue>
      </BankDetailRow>
      
      <Divider sx={{ my: 2 }} />
      
      <Typography variant="body2" sx={{ color: '#666', display: 'flex', alignItems: 'center', gap: 1 }}>
        <InfoIcon sx={{ fontSize: '1rem', color: '#15e420' }} />
        Please transfer the exact amount and upload your receipt below
      </Typography>
    </BankDetailsCard>
  );
};

export default BankDetails;