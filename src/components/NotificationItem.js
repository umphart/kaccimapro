import React from 'react';
import {
  ListItem,
  ListItemAvatar,
  Avatar,
  ListItemText,
  Typography,
  Box,
  Chip,
  IconButton,
  Button
} from '@mui/material';
import {
  DoneAll as DoneAllIcon,
  Delete as DeleteIcon,
  AccessTime as AccessTimeIcon,
  Upload as UploadIcon
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { getNotificationIcon, getTimeAgo } from '../utils/notificationUtils';

const StyledNotificationItem = styled(ListItem)(({ read }) => ({
  backgroundColor: read ? 'transparent' : '#e8f5e9',
  borderRadius: '8px',
  marginBottom: '8px',
  transition: 'all 0.3s',
  '&:hover': {
    backgroundColor: read ? '#f5f5f5' : '#d4edda',
    transform: 'translateX(4px)'
  }
}));

const NotificationItem = ({ 
  notification, 
  onMarkRead, 
  onDelete, 
  onClick,
  showReuploadButton = false,
  onReupload
}) => {
  const handleReuploadClick = (e) => {
    e.stopPropagation();
    if (onReupload) {
      onReupload(notification);
    }
  };

  return (
    <StyledNotificationItem
      read={notification.read}
      secondaryAction={
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {showReuploadButton && notification.type === 'document_rejected' && (
            <Button
              size="small"
              startIcon={<UploadIcon />}
              onClick={handleReuploadClick}
              sx={{
                backgroundColor: '#15e420',
                color: 'white',
                '&:hover': {
                  backgroundColor: '#12c21e'
                }
              }}
            >
              Re-upload
            </Button>
          )}
          <IconButton
            edge="end"
            onClick={(e) => {
              e.stopPropagation();
              onMarkRead(notification.id);
            }}
            disabled={notification.read}
            sx={{ color: '#15e420' }}
          >
            <DoneAllIcon />
          </IconButton>
          <IconButton
            edge="end"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(notification.id);
            }}
            sx={{ color: '#dc3545' }}
          >
            <DeleteIcon />
          </IconButton>
        </Box>
      }
      onClick={() => onClick(notification)}
      sx={{ cursor: 'pointer' }}
    >
      <ListItemAvatar>
        <Avatar sx={{ bgcolor: 'transparent' }}>
          {getNotificationIcon(notification.type)}
        </Avatar>
      </ListItemAvatar>
      <ListItemText
        primary={
          <Typography
            variant="subtitle1"
            sx={{
              fontWeight: notification.read ? 400 : 600,
              color: notification.read ? '#666' : '#333'
            }}
          >
            {notification.title}
            {notification.isFromAdmin && (
              <Chip
                label="Admin"
                size="small"
                sx={{
                  ml: 1,
                  height: 20,
                  fontSize: '10px',
                  backgroundColor: '#15e420',
                  color: 'white'
                }}
              />
            )}
          </Typography>
        }
        secondary={
          <Box>
            <Typography
              variant="body2"
              sx={{
                color: '#666',
                mb: 0.5
              }}
            >
              {notification.message}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
              <AccessTimeIcon sx={{ fontSize: 14, color: '#999' }} />
              <Typography variant="caption" sx={{ color: '#999' }}>
                {getTimeAgo(notification.timestamp)}
              </Typography>
              <Chip
                label={notification.category}
                size="small"
                sx={{
                  height: 20,
                  fontSize: '10px',
                  backgroundColor: 
                    notification.category === 'payment' ? '#e3f2fd' :
                    notification.category === 'registration' ? '#e8f5e9' :
                    notification.category === 'document' ? '#fff3e0' : '#f3e5f5',
                  color: 
                    notification.category === 'payment' ? '#1976d2' :
                    notification.category === 'registration' ? '#2e7d32' :
                    notification.category === 'document' ? '#ed6c02' : '#9c27b0'
                }}
              />
              {notification.type === 'document_rejected' && (
                <Chip
                  label="Rejected"
                  size="small"
                  sx={{
                    height: 20,
                    fontSize: '10px',
                    backgroundColor: '#ffebee',
                    color: '#c62828'
                  }}
                />
              )}
              {notification.type === 'document_approved' && (
                <Chip
                  label="Approved"
                  size="small"
                  sx={{
                    height: 20,
                    fontSize: '10px',
                    backgroundColor: '#e8f5e9',
                    color: '#2e7d32'
                  }}
                />
              )}
            </Box>
          </Box>
        }
      />
    </StyledNotificationItem>
  );
};

export default NotificationItem;