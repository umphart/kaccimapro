import React from 'react';
import { Paper, Box, Typography, Chip, Grid, LinearProgress } from '@mui/material';
import { styled } from '@mui/material/styles';
import {
  Verified as VerifiedIcon,
  Pending as PendingIcon,
  Error as ErrorIcon
} from '@mui/icons-material';

const StyledCard = styled(Paper)(({ status }) => ({
  padding: '20px',
  borderRadius: '20px',
  background: 'white',
  boxShadow: '0 8px 25px rgba(0, 0, 0, 0.08)',
  marginBottom: '24px',
  position: 'relative',
  overflow: 'hidden',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '3px',
    background: status === 'approved' ? 'linear-gradient(90deg, #28a745, #20c997)' :
                status === 'rejected' ? 'linear-gradient(90deg, #dc3545, #c82333)' :
                'linear-gradient(90deg, #ffc107, #ff9800)'
  }
}));

const StatusIcon = styled(Box)(({ status }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '40px',
  height: '40px',
  borderRadius: '10px',
  background: status === 'approved' ? 'rgba(40, 167, 69, 0.1)' :
              status === 'rejected' ? 'rgba(220, 53, 69, 0.1)' :
              'rgba(255, 193, 7, 0.1)',
  color: status === 'approved' ? '#28a745' :
         status === 'rejected' ? '#dc3545' :
         '#ff9800'
}));

const StatusBadge = styled(Chip)(({ status }) => ({
  fontWeight: 600,
  fontSize: '0.8rem',
  padding: '2px 8px',
  background: status === 'approved' ? '#d4edda' :
              status === 'rejected' ? '#ffebee' :
              '#fff3e0',
  color: status === 'approved' ? '#28a745' :
         status === 'rejected' ? '#dc3545' :
         '#ff9800',
  height: '28px'
}));

const getStatusIcon = (status) => {
  switch(status?.toLowerCase()) {
    case 'approved':
      return <VerifiedIcon sx={{ fontSize: '1.2rem' }} />;
    case 'rejected':
      return <ErrorIcon sx={{ fontSize: '1.2rem' }} />;
    default:
      return <PendingIcon sx={{ fontSize: '1.2rem' }} />;
  }
};

const getStatusMessage = (status) => {
  switch(status?.toLowerCase()) {
    case 'approved':
      return 'Your membership is active and in good standing.';
    case 'rejected':
      return 'Your registration has been rejected. Please contact support.';
    default:
      return 'Your registration is currently under review.';
  }
};

const StatusCard = ({ status, isMobile }) => {
  const statusLower = status?.toLowerCase() || 'pending';

  return (
    <StyledCard status={statusLower}>
      <Grid container spacing={2} alignItems="center">
        <Grid item xs={12} sm={8}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
            <StatusIcon status={statusLower}>
              {getStatusIcon(status)}
            </StatusIcon>
            <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1.1rem', color: '#333' }}>
              {status === 'approved' && 'Membership Active'}
              {status === 'rejected' && 'Registration Rejected'}
              {status === 'pending' && 'Registration Pending'}
            </Typography>
          </Box>
          <Typography variant="body2" sx={{ color: '#666', fontSize: '0.9rem', lineHeight: 1.5 }}>
            {getStatusMessage(status)}
          </Typography>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Box sx={{ display: 'flex', justifyContent: { xs: 'flex-start', sm: 'flex-end' } }}>
            <StatusBadge
              icon={getStatusIcon(status)}
              label={status || 'Pending'}
              status={statusLower}
              size="small"
            />
          </Box>
        </Grid>
      </Grid>

      {statusLower === 'pending' && (
        <Box sx={{ mt: 2.5 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
            <Typography variant="caption" sx={{ color: '#666', fontSize: '0.75rem' }}>
              Verification Progress
            </Typography>
            <Typography variant="caption" sx={{ color: '#15e420', fontWeight: 600, fontSize: '0.75rem' }}>
              60%
            </Typography>
          </Box>
          <LinearProgress 
            variant="determinate" 
            value={60}
            sx={{ 
              height: 6, 
              borderRadius: 3,
              bgcolor: '#e0e0e0',
              '& .MuiLinearProgress-bar': {
                bgcolor: '#15e420'
              }
            }}
          />
        </Box>
      )}
    </StyledCard>
  );
};

export default StatusCard;