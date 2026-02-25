import React from 'react';
import { Chip } from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Pending as PendingIcon,
  Error as ErrorIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import { 
  PAYMENT_STATUS, 
  PAYMENT_TYPES,  // Added this import
  PAYMENT_CONSTANTS, 
  FILE_CONSTANTS 
} from '../components/payment/paymentConstants';

// Format currency
export const formatCurrency = (amount) => {
  return `₦${amount?.toLocaleString() || 0}.00`;
};

// Format date
export const formatDate = (dateString, format = 'short') => {
  const options = format === 'long' 
    ? { year: 'numeric', month: 'long', day: 'numeric' }
    : { year: 'numeric', month: 'short', day: 'numeric' };
  
  return new Date(dateString).toLocaleDateString('en-NG', options);
};

// Get status icon
export const getStatusIcon = (status) => {
  switch(status) {
    case PAYMENT_STATUS.APPROVED:
    case PAYMENT_STATUS.ACCEPTED:
      return <CheckCircleIcon />;
    case PAYMENT_STATUS.PENDING:
      return <PendingIcon />;
    case PAYMENT_STATUS.REJECTED:
      return <ErrorIcon />;
    default:
      return <InfoIcon />;
  }
};

// Get status color
export const getStatusColor = (status) => {
  switch(status) {
    case PAYMENT_STATUS.APPROVED:
    case PAYMENT_STATUS.ACCEPTED:
      return '#28a745';
    case PAYMENT_STATUS.PENDING:
      return '#ffc107';
    case PAYMENT_STATUS.REJECTED:
      return '#dc3545';
    default:
      return '#15e420';
  }
};

// Get status chip component
export const getStatusChip = (status) => {
  const config = {
    [PAYMENT_STATUS.APPROVED]: { color: '#28a745', bgcolor: '#d4edda', label: 'Approved' },
    [PAYMENT_STATUS.ACCEPTED]: { color: '#28a745', bgcolor: '#d4edda', label: 'Approved' },
    [PAYMENT_STATUS.PENDING]: { color: '#ff9800', bgcolor: '#fff3e0', label: 'Pending' },
    [PAYMENT_STATUS.REJECTED]: { color: '#dc3545', bgcolor: '#ffebee', label: 'Rejected' }
  };

  const chipConfig = config[status] || { color: '#15e420', bgcolor: '#e8f5e9', label: status };

  return (
    <Chip
      size="small"
      icon={getStatusIcon(status)}
      label={chipConfig.label}
      sx={{
        fontWeight: 600,
        fontSize: '0.75rem',
        background: chipConfig.bgcolor,
        color: chipConfig.color,
        '& .MuiChip-icon': {
          fontSize: '1rem',
          color: chipConfig.color
        }
      }}
    />
  );
};

// Validate file
export const validateFile = (file) => {
  if (!file) {
    return { valid: false, error: 'No file selected' };
  }

  if (file.size > FILE_CONSTANTS.MAX_SIZE) {
    return { valid: false, error: 'File size must be less than 5MB' };
  }

  if (!FILE_CONSTANTS.ALLOWED_TYPES.includes(file.type)) {
    return { valid: false, error: 'Please upload JPG, PNG, or PDF files only' };
  }

  return { valid: true };
};

// Calculate payment details
export const calculatePaymentDetails = (paymentType, isRenewal, isNotDue) => {
  const registrationFee = !isRenewal && !isNotDue ? PAYMENT_CONSTANTS.REGISTRATION_FEE : 0;
  const subscriptionFee = !isRenewal && !isNotDue 
    ? PAYMENT_CONSTANTS.SUBSCRIPTION_FEE 
    : (isRenewal ? PAYMENT_CONSTANTS.RENEWAL_AMOUNT : 0);

  return {
    registrationFee,
    subscriptionFee,
    total: registrationFee + subscriptionFee
  };
};

// Get payment type label
export const getPaymentTypeLabel = (type) => {
  switch(type) {
    case PAYMENT_TYPES.FIRST:
      return 'First Payment';
    case PAYMENT_TYPES.RENEWAL:
      return 'Annual Renewal';
    case PAYMENT_TYPES.NOT_DUE:
      return 'No Payment Due';
    default:
      return type;
  }
};