import React from 'react';
import { Grid, Paper, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';

const MetricCard = styled(Paper)(({ bg }) => ({
  padding: '16px',
  borderRadius: '16px',
  background: bg || 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  color: 'white',
  textAlign: 'center',
  height: '100%',
  boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)'
}));

const MetricValue = styled(Typography)(({ theme }) => ({
  fontWeight: 700,
  fontSize: '1.5rem',
  marginBottom: '4px',
  [theme.breakpoints.down('sm')]: {
    fontSize: '1.25rem'
  }
}));

const MetricLabel = styled(Typography)({
  fontSize: '0.8rem',
  opacity: 0.9,
  textTransform: 'uppercase',
  letterSpacing: '0.02em'
});

const StatsCards = ({ stats, isMobile }) => {
  return (
    <Grid container spacing={2} sx={{ mb: 3 }}>
      <Grid item xs={6} md={3}>
        <MetricCard bg="linear-gradient(135deg, #667eea 0%, #764ba2 100%)">
          <MetricValue variant="h4">
            {stats.membershipDays}
          </MetricValue>
          <MetricLabel variant="body2">
            Days Active
          </MetricLabel>
        </MetricCard>
      </Grid>
      
      <Grid item xs={6} md={3}>
        <MetricCard bg="linear-gradient(135deg, #15e420 0%, #0fa819 100%)">
          <MetricValue variant="h4">
            {stats.approvedPayments}
          </MetricValue>
          <MetricLabel variant="body2">
            Payments Made
          </MetricLabel>
        </MetricCard>
      </Grid>
      
      <Grid item xs={6} md={3}>
        <MetricCard bg="linear-gradient(135deg, #ffc107 0%, #ff9800 100%)">
          <MetricValue variant="h4">
            ₦{stats.totalSpent.toLocaleString()}
          </MetricValue>
          <MetricLabel variant="body2">
            Total Spent
          </MetricLabel>
        </MetricCard>
      </Grid>
      
      <Grid item xs={6} md={3}>
        <MetricCard bg="linear-gradient(135deg, #17a2b8 0%, #138496 100%)">
          <MetricValue variant="h4">
            {stats.pendingPayments}
          </MetricValue>
          <MetricLabel variant="body2">
            Pending
          </MetricLabel>
        </MetricCard>
      </Grid>
    </Grid>
  );
};

export default StatsCards;