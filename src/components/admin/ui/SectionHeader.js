import React from 'react';
import { Box, Typography, Paper } from '@mui/material';
import { Business, People, Assignment, Payment, Description } from '@mui/icons-material';

const icons = {
  basic: Business,
  personnel: People,
  referee: Assignment,
  documents: Description,
  payment: Payment
};

const SectionHeader = ({ title, icon, subtitle }) => {
  const IconComponent = icons[icon] || Business;

  return (
    <Box sx={{ mb: 3, mt: 2 }}>
      <Box display="flex" alignItems="center" gap={1.5}>
        <Paper
          elevation={0}
          sx={{
            p: 1,
            bgcolor: '#e8f5e9',
            borderRadius: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <IconComponent sx={{ color: '#15e420', fontSize: 24 }} />
        </Paper>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 600, color: '#1a1a1a' }}>
            {title}
          </Typography>
          {subtitle && (
            <Typography variant="body2" color="textSecondary">
              {subtitle}
            </Typography>
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default SectionHeader;