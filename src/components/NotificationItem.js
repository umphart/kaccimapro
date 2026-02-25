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
  Tooltip
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Pending as PendingIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  Payment as PaymentIcon,
  Business as BusinessIcon,
  Description as DescriptionIcon,
  AccessTime as AccessTimeIcon,
  Refresh as RefreshIcon,
  Close as CloseIcon
} from '@mui/icons-material';

// Custom function to format time without date-fns
const formatTimeAgo = (timestamp) => {
  if (!timestamp) return '';
  
  const date = new Date(timestamp);
  const now = new Date();
  const seconds = Math.floor((now - date) / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const months = Math.floor(days / 30);
  const years = Math.floor(months / 12);

  if (years > 0) return `${years} year${years > 1 ? 's' : ''} ago`;
  if (months > 0) return `${months} month${months > 1 ? 's' : ''} ago`;
  if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
  if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  if (seconds > 30) return `${seconds} seconds ago`;
  return 'Just now';
};

const getNotificationIcon = (type, title, category) => {
  // Check for document rejection first
  if (type === 'document_rejected' || 
      title?.toLowerCase().includes('reject') && category === 'document' ||
      title?.toLowerCase().includes('document rejected')) {
    return <ErrorIcon sx={{ color: '#dc3545' }} />;
  }
  
  // Check for document approval
  if (type === 'document_approved' || 
      title?.toLowerCase().includes('approv') && category === 'document') {
    return <CheckCircleIcon sx={{ color: '#28a745' }} />;
  }
  
  switch (type) {
    case 'success':
    case 'approved':
      return <CheckCircleIcon sx={{ color: '#28a745' }} />;
    case 'pending':
      return <PendingIcon sx={{ color: '#ffc107' }} />;
    case 'error':
    case 'rejected':
      return <ErrorIcon sx={{ color: '#dc3545' }} />;
    case 'payment':
      return <PaymentIcon sx={{ color: '#17a2b8' }} />;
    case 'renewal':
      return <AccessTimeIcon sx={{ color: '#ffc107' }} />;
    case 'registration':
      return <BusinessIcon sx={{ color: '#15e420' }} />;
    case 'document':
      return <DescriptionIcon sx={{ color: '#15e420' }} />;
    default:
      return <InfoIcon sx={{ color: '#17a2b8' }} />;
  }
};

const getNotificationColor = (type, title, category) => {
  if (type === 'document_rejected' || 
      title?.toLowerCase().includes('reject') && category === 'document') {
    return '#dc3545';
  }
  
  switch (type) {
    case 'success':
    case 'approved':
    case 'document_approved':
      return '#28a745';
    case 'pending':
      return '#ffc107';
    case 'error':
    case 'rejected':
      return '#dc3545';
    default:
      return '#15e420';
  }
};

const NotificationItem = ({ 
  notification, 
  onMarkRead, 
  onDelete, 
  onClick,
  showReuploadButton = true,
  onReupload
}) => {
  const handleClick = () => {
    if (!notification.read) {
      onMarkRead(notification.id);
    }
    onClick(notification);
  };

  const handleReupload = (e) => {
    e.stopPropagation();
    console.log('Reupload clicked for notification:', notification); // Debug log
    if (onReupload) {
      onReupload(notification);
    }
  };

  // Check if this is a rejected document notification
  const isRejectedDocument = 
    notification.type === 'document_rejected' || 
    (notification.title?.toLowerCase().includes('reject') && 
     notification.category === 'document') ||
    (notification.message?.toLowerCase().includes('rejected') && 
     notification.category === 'document') ||
    (notification.title?.toLowerCase().includes('document rejected'));

  // Check if this is a pending document notification
  const isPendingDocument = notification.type === 'pending' && 
    notification.category === 'document';

  // Check if document has been re-uploaded (for showing different button maybe)
  const isReuploadedDocument = 
    notification.title?.toLowerCase().includes('re-upload') ||
    notification.message?.toLowerCase().includes('re-uploaded');

  const timeAgo = formatTimeAgo(notification.timestamp);

  // Debug log
  console.log('NotificationItem render:', {
    id: notification.id,
    title: notification.title,
    type: notification.type,
    category: notification.category,
    isRejectedDocument,
    showReuploadButton
  });

  return (
    <ListItem
      alignItems="flex-start"
      sx={{
        bgcolor: notification.read ? 'transparent' : 'rgba(21, 228, 32, 0.05)',
        borderRadius: '8px',
        mb: 1,
        cursor: 'pointer',
        '&:hover': {
          bgcolor: notification.read ? '#f5f5f5' : 'rgba(21, 228, 32, 0.1)'
        },
        position: 'relative'
      }}
      onClick={handleClick}
    >
      <ListItemAvatar>
        <Avatar sx={{ 
          bgcolor: `${getNotificationColor(notification.type, notification.title, notification.category)}20` 
        }}>
          {getNotificationIcon(notification.type, notification.title, notification.category)}
        </Avatar>
      </ListItemAvatar>
      
      <ListItemText
        primary={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', pr: 8 }}>
            <Typography
              variant="subtitle2"
              sx={{
                fontWeight: notification.read ? 400 : 600,
                color: notification.read ? '#666' : '#333'
              }}
            >
              {notification.title}
            </Typography>
            <Chip
              label={notification.category || 'general'}
              size="small"
              sx={{
                height: 20,
                fontSize: '0.65rem',
                bgcolor: '#f0f0f0'
              }}
            />
            {isRejectedDocument && (
              <Chip
                label="Rejected"
                size="small"
                sx={{
                  height: 20,
                  fontSize: '0.65rem',
                  bgcolor: '#dc3545',
                  color: 'white'
                }}
              />
            )}
            {isReuploadedDocument && (
              <Chip
                label="Re-uploaded"
                size="small"
                sx={{
                  height: 20,
                  fontSize: '0.65rem',
                  bgcolor: '#17a2b8',
                  color: 'white'
                }}
              />
            )}
            {!notification.read && !isRejectedDocument && !isReuploadedDocument && (
              <Chip
                label="New"
                size="small"
                sx={{
                  height: 20,
                  fontSize: '0.65rem',
                  bgcolor: '#15e420',
                  color: 'white'
                }}
              />
            )}
          </Box>
        }
        secondary={
          <Box>
            <Typography
              variant="body2"
              sx={{
                color: notification.read ? '#666' : '#333',
                mb: 0.5,
                display: 'block'
              }}
            >
              {notification.message}
            </Typography>
            <Typography variant="caption" sx={{ color: '#999' }}>
              {timeAgo}
            </Typography>
          </Box>
        }
      />

      <Box sx={{ position: 'absolute', right: 8, top: 8, display: 'flex', gap: 0.5 }}>
        {/* Show re-upload button for rejected documents */}
{showReuploadButton && isRejectedDocument && (
  <Tooltip title="Re-upload Document" arrow>
    <IconButton
      size="small"
      onClick={handleReupload}
      sx={{
        color: '#15e420',
        bgcolor: 'rgba(21, 228, 32, 0.1)',
        '&:hover': {
          bgcolor: '#15e420',
          color: 'white',
          transform: 'scale(1.1)'
        }
      }}
    >
      <RefreshIcon fontSize="small" />
    </IconButton>
  </Tooltip>
)}
        
        {/* Show delete button for other notifications */}
        {!isRejectedDocument && (
          <Tooltip title="Delete" arrow>
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(notification.id);
              }}
              sx={{
                color: '#dc3545',
                '&:hover': {
                  bgcolor: 'rgba(220, 53, 69, 0.1)'
                }
              }}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
      </Box>
    </ListItem>
  );
};

export default NotificationItem;