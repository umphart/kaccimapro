import React from 'react';
import { Box, useTheme, useMediaQuery } from '@mui/material';
import Sidebar from './Sidebar';

const Layout = ({ children }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  return (
    <Box 
      sx={{ 
        display: 'flex', 
        gap: isMobile ? 0 : 3,
        position: 'relative',
        minHeight: '100%'
      }}
    >
      <Sidebar />
      <Box 
        sx={{ 
          flex: 1,
          ml: isMobile ? 0 : 0,
          transition: 'all 0.3s ease',
          width: '100%',
          overflowX: 'auto'
        }}
      >
        {children}
      </Box>
    </Box>
  );
};

export default Layout;