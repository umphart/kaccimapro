import React from 'react';
import { Box, Typography, Chip, IconButton, Button } from '@mui/material';
import {
  NotificationsActive as NotificationsActiveIcon,
  Refresh as RefreshIcon,
  DoneAll as DoneAllIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';

const NotificationHeader = ({
  unreadCount,
  onRefresh,
  refreshing,
  onMarkAllRead,
  onClearRead,
  hasReadNotifications
}) => {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <NotificationsActiveIcon sx={{ color: '#15e420', fontSize: 32 }} />
        <Typography variant="h5" sx={{ fontWeight: 700, color: '#333' }}>
          Notifications
        </Typography>
        {unreadCount > 0 && (
          <Chip
            label={`${unreadCount} new`}
            size="small"
            sx={{
              backgroundColor: '#15e420',
              color: 'white',
              fontWeight: 600
            }}
          />
        )}
      </Box>
      <Box sx={{ display: 'flex', gap: 1 }}>
        <IconButton 
          onClick={onRefresh} 
          disabled={refreshing}
          sx={{ color: '#15e420' }}
        >
          <RefreshIcon />
        </IconButton>
        <Button
          startIcon={<DoneAllIcon />}
          onClick={onMarkAllRead}
          disabled={unreadCount === 0}
          size="small"
          sx={{ color: '#15e420' }}
        >
          Mark all read
        </Button>
        <Button
          startIcon={<DeleteIcon />}
          onClick={onClearRead}
          disabled={!hasReadNotifications}
          size="small"
          sx={{ color: '#dc3545' }}
        >
          Clear read
        </Button>
      </Box>
    </Box>
  );
};

export default NotificationHeader;