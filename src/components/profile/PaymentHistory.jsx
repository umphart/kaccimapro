import React from 'react';
import { Paper, Box, Typography, Grid, Avatar, Chip, Button } from '@mui/material';
import {
  Payment as PaymentIcon,
  CheckCircle as CheckCircleIcon,
  Pending as PendingIcon,
  Error as ErrorIcon
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';
import InfoItem from './InfoItem';

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

const getStatusIcon = (status) => {
  switch(status) {
    case 'approved':
      return <CheckCircleIcon sx={{ fontSize: '0.9rem' }} />;
    case 'pending':
      return <PendingIcon sx={{ fontSize: '0.9rem' }} />;
    case 'rejected':
      return <ErrorIcon sx={{ fontSize: '0.9rem' }} />;
    default:
      return null;
  }
};

const getStatusChip = (status) => {
  const config = {
    approved: { bgcolor: '#d4edda', color: '#28a745', label: 'Approved' },
    pending: { bgcolor: '#fff3e0', color: '#ff9800', label: 'Pending' },
    rejected: { bgcolor: '#ffebee', color: '#dc3545', label: 'Rejected' }
  };

  const chip = config[status] || config.pending;

  return (
    <Chip
      size="small"
      icon={getStatusIcon(status)}
      label={chip.label}
      sx={{
        bgcolor: chip.bgcolor,
        color: chip.color,
        fontWeight: 600,
        fontSize: '0.7rem',
        height: '24px',
        '& .MuiChip-icon': {
          color: chip.color
        }
      }}
    />
  );
};

const PaymentHistory = ({ payments, isMobile }) => {
  const navigate = useNavigate();
  const displayPayments = payments.slice(0, 3);

  const formatAmount = (amount) => {
    return `₦${amount?.toLocaleString() || '0'}.00`;
  };

  const formatShortDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-NG', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <StyledCard>
      <CardHeader>
        <Avatar sx={{ bgcolor: '#15e420', width: isMobile ? 36 : 40, height: isMobile ? 36 : 40 }}>
          <PaymentIcon fontSize="small" />
        </Avatar>
        <HeaderTitle>
          Recent Payments
        </HeaderTitle>
      </CardHeader>

      <Grid container spacing={1.5}>
        {displayPayments.map((payment, index) => (
          <Grid item xs={12} key={payment.id}>
            <InfoItem
              icon={<PaymentIcon />}
              label={
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                  <span>{payment.payment_type === 'first' ? 'First Payment' : 'Annual Renewal'}</span>
                  {getStatusChip(payment.status)}
                </Box>
              }
              value={
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                  <span>{formatAmount(payment.amount)}</span>
                  <Typography variant="caption" sx={{ color: '#999', fontSize: '0.7rem' }}>
                    {formatShortDate(payment.created_at)}
                  </Typography>
                </Box>
              }
              delay={0.1 * index}
            />
          </Grid>
        ))}
      </Grid>

      {payments.length > 3 && (
        <Box sx={{ mt: 2, textAlign: 'center' }}>
          <Button
            onClick={() => navigate('/payment-history')}
            sx={{ 
              color: '#15e420',
              fontWeight: 600,
              fontSize: '0.85rem',
              textTransform: 'none'
            }}
          >
            View All {payments.length} Payments
          </Button>
        </Box>
      )}
    </StyledCard>
  );
};

export default PaymentHistory;