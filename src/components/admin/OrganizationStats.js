import React from 'react';
import {
  Grid,
  Card,
  CardContent,
  Box,
  Typography,
  Avatar
} from '@mui/material';
import {
  Business as BusinessIcon,
  Pending as PendingIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';

const StyledCard = styled(Card)(({ theme }) => ({
  height: '100%',
  borderRadius: '16px',
  boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)',
  transition: 'all 0.3s',
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: '0 15px 35px rgba(21, 228, 32, 0.15)'
  }
}));

const OrganizationStats = ({ stats }) => {
  return (
    <Grid container spacing={3} sx={{ mb: 4 }}>
      <Grid item xs={12} sm={6} md={3}>
        <StyledCard>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ bgcolor: '#15e420', width: 48, height: 48 }}>
                <BusinessIcon />
              </Avatar>
              <Box>
                <Typography variant="body2" sx={{ color: '#666' }}>
                  Total Organizations
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 700 }}>
                  {stats.total}
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </StyledCard>
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <StyledCard>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ bgcolor: '#ffc107', width: 48, height: 48 }}>
                <PendingIcon />
              </Avatar>
              <Box>
                <Typography variant="body2" sx={{ color: '#666' }}>
                  Pending Review
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 700 }}>
                  {stats.pending}
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </StyledCard>
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <StyledCard>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ bgcolor: '#28a745', width: 48, height: 48 }}>
                <CheckCircleIcon />
              </Avatar>
              <Box>
                <Typography variant="body2" sx={{ color: '#666' }}>
                  Approved
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 700 }}>
                  {stats.approved}
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </StyledCard>
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <StyledCard>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ bgcolor: '#dc3545', width: 48, height: 48 }}>
                <CancelIcon />
              </Avatar>
              <Box>
                <Typography variant="body2" sx={{ color: '#666' }}>
                  Rejected
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 700 }}>
                  {stats.rejected}
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </StyledCard>
      </Grid>
    </Grid>
  );
};

export default OrganizationStats;