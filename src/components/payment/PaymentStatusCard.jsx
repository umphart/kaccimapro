import React from 'react';
import { motion } from 'framer-motion';
import { Typography, Chip } from '@mui/material';
import {
  Payment as PaymentIcon,
  Pending as PendingIcon,
  Verified as VerifiedIcon
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { PAYMENT_TYPES } from './paymentConstants';
import { formatCurrency } from '../../utils/paymentUtils';

const StatusCard = styled(motion.div)(({ status }) => ({
  background: 'white',
  borderRadius: '24px',
  padding: '2rem',
  marginBottom: '2rem',
  boxShadow: '0 10px 40px rgba(0, 0, 0, 0.1)',
  textAlign: 'center',
  position: 'relative',
  overflow: 'hidden',
  border: '1px solid rgba(0, 0, 0, 0.05)',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '4px',
    background: status === 'active' ? 'linear-gradient(90deg, #15e420, #0fa819)' :
                status === 'first' ? 'linear-gradient(90deg, #ffc107, #ff9800)' :
                'linear-gradient(90deg, #ffc107, #ff9800)'
  }
}));

const StatusIconWrapper = styled('div')(({ status }) => ({
  width: '100px',
  height: '100px',
  background: status === 'active' ? 'rgba(21, 228, 32, 0.1)' :
              status === 'first' ? 'rgba(255, 193, 7, 0.1)' :
              'rgba(255, 193, 7, 0.1)',
  borderRadius: '50%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  margin: '0 auto 1.5rem',
  '& svg': {
    fontSize: '3.5rem',
    color: status === 'active' ? '#15e420' :
           status === 'first' ? '#ffc107' :
           '#ffc107'
  }
}));

const PaymentStatusCard = ({ 
  paymentType, 
  paymentAmount, 
  isFirstPayment, 
  isRenewal, 
  isNotDue 
}) => {
  const getStatusType = () => {
    if (isNotDue) return 'active';
    if (isFirstPayment) return 'first';
    return 'renewal';
  };

  const getIcon = () => {
    if (isNotDue) return <VerifiedIcon sx={{ fontSize: '3.5rem' }} />;
    if (isFirstPayment) return <PaymentIcon sx={{ fontSize: '3.5rem' }} />;
    return <PendingIcon sx={{ fontSize: '3.5rem' }} />;
  };

  const getTitle = () => {
    if (isFirstPayment) return 'First Time Payment Required';
    if (isRenewal) return 'Annual Renewal Due';
    return 'Membership Active';
  };

  const getMessage = () => {
    if (isFirstPayment) {
      return 'Complete your registration by making your first payment. This one-time payment covers your registration and first year membership.';
    }
    if (isRenewal) {
      return 'Your annual renewal is due. Please complete payment to maintain your active membership status.';
    }
    return 'Your membership is in good standing. No payment is required at this time.';
  };

  return (
    <StatusCard
      status={getStatusType()}
      initial={{ scale: 0.95 }}
      animate={{ scale: 1 }}
      transition={{ delay: 0.2 }}
    >
      <StatusIconWrapper status={getStatusType()}>
        <motion.div
          animate={isFirstPayment ? { 
            rotate: [0, 10, -10, 10, 0],
            scale: [1, 1.1, 1]
          } : {}}
          transition={{ 
            duration: 2,
            repeat: isFirstPayment ? Infinity : 0,
            repeatDelay: 3
          }}
        >
          {getIcon()}
        </motion.div>
      </StatusIconWrapper>
      
      <Typography variant="h5" sx={{ fontWeight: 700, color: '#333', mb: 1 }}>
        {getTitle()}
      </Typography>
      
      <Typography variant="body1" sx={{ color: '#666', mb: 2, maxWidth: '600px', mx: 'auto' }}>
        {getMessage()}
      </Typography>

      {!isNotDue && (
        <Chip
          icon={isFirstPayment ? <PaymentIcon /> : <PendingIcon />}
          label={`Amount Due: ${formatCurrency(paymentAmount)}`}
          sx={{
            bgcolor: isFirstPayment ? 'rgba(21, 228, 32, 0.1)' : 'rgba(255, 193, 7, 0.1)',
            color: isFirstPayment ? '#15e420' : '#ff9800',
            fontWeight: 600,
            fontSize: '1rem',
            p: 2
          }}
        />
      )}
    </StatusCard>
  );
};

export default PaymentStatusCard;