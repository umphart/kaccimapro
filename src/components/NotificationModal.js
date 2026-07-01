// src/components/NotificationModal.js
import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Box,
  Chip,
  Button,
  IconButton,
  Avatar,
  Divider
} from '@mui/material';
import {
  Close as CloseIcon,
  CheckCircle as CheckCircleIcon,
  Pending as PendingIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  Payment as PaymentIcon,
  Business as BusinessIcon,
  Description as DescriptionIcon,
  AccessTime as AccessTimeIcon,
  OpenInNew as OpenInNewIcon
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';

const StyledDialog = styled(Dialog)(({ theme }) => ({
  '& .MuiDialog-paper': {
    borderRadius: '16px',
    maxWidth: '600px',
    width: '100%',
    padding: theme.spacing(1)
  }
}));

const HeaderBox = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(2),
  padding: theme.spacing(2, 3)
}));

const ContentBox = styled(Box)(({ theme }) => ({
  padding: theme.spacing(3)
}));

const MessageBox = styled(Box)(({ theme }) => ({
  backgroundColor: '#f8f9fa',
  borderRadius: '8px',
  padding: theme.spacing(3),
  marginTop: theme.spacing(2),
  whiteSpace: 'pre-wrap',
  wordBreak: 'break-word',
  maxHeight: '400px',
  overflowY: 'auto',
  fontFamily: '"Inter", sans-serif',
  lineHeight: 1.8,
  fontSize: '0.95rem',
  color: '#333'
}));

const getNotificationIcon = (type, title, category) => {
  if (type === 'document_rejected' || 
      title?.toLowerCase().includes('reject') && category === 'document') {
    return <ErrorIcon sx={{ color: '#dc3545', fontSize: 32 }} />;
  }
  
  switch (type) {
    case 'success':
    case 'approved':
      return <CheckCircleIcon sx={{ color: '#28a745', fontSize: 32 }} />;
    case 'pending':
      return <PendingIcon sx={{ color: '#ffc107', fontSize: 32 }} />;
    case 'error':
    case 'rejected':
      return <ErrorIcon sx={{ color: '#dc3545', fontSize: 32 }} />;
    case 'payment':
      return <PaymentIcon sx={{ color: '#17a2b8', fontSize: 32 }} />;
    case 'renewal':
      return <AccessTimeIcon sx={{ color: '#ffc107', fontSize: 32 }} />;
    case 'registration':
      return <BusinessIcon sx={{ color: '#15e420', fontSize: 32 }} />;
    case 'document':
      return <DescriptionIcon sx={{ color: '#15e420', fontSize: 32 }} />;
    default:
      return <InfoIcon sx={{ color: '#17a2b8', fontSize: 32 }} />;
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

const formatTime = (timestamp) => {
  if (!timestamp) return '';
  return new Date(timestamp).toLocaleString('en-NG', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const NotificationModal = ({ 
  open, 
  notification, 
  onClose, 
  onActionClick 
}) => {
  if (!notification) return null;

  const isRejectedDocument = 
    notification.type === 'document_rejected' || 
    (notification.title?.toLowerCase().includes('reject') && 
     notification.category === 'document');

  return (
    <StyledDialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ p: 0 }}>
        <HeaderBox>
          <Avatar sx={{ 
            bgcolor: `${getNotificationColor(notification.type, notification.title, notification.category)}20`,
            width: 56,
            height: 56
          }}>
            {getNotificationIcon(notification.type, notification.title, notification.category)}
          </Avatar>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, color: '#333' }}>
              {notification.title}
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, mt: 0.5, flexWrap: 'wrap' }}>
              <Chip
                label={notification.category || 'general'}
                size="small"
                sx={{ height: 20, fontSize: '0.65rem' }}
              />
              {isRejectedDocument && (
                <Chip
                  label="Rejected"
                  size="small"
                  sx={{ height: 20, fontSize: '0.65rem', bgcolor: '#dc3545', color: 'white' }}
                />
              )}
              {!notification.read && (
                <Chip
                  label="New"
                  size="small"
                  sx={{ height: 20, fontSize: '0.65rem', bgcolor: '#15e420', color: 'white' }}
                />
              )}
            </Box>
          </Box>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </HeaderBox>
      </DialogTitle>

      <Divider />

      <DialogContent sx={{ p: 0 }}>
        <ContentBox>
          <Typography variant="caption" color="textSecondary" sx={{ display: 'block', mb: 1 }}>
            Received: {formatTime(notification.timestamp)}
          </Typography>
          
          <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#666', mb: 1 }}>
            Message:
          </Typography>
          
          <MessageBox>
            {notification.message}
          </MessageBox>

          {notification.amount && (
            <Box sx={{ mt: 2, p: 2, bgcolor: '#e8f5e9', borderRadius: '8px' }}>
              <Typography variant="body2" sx={{ color: '#2e7d32' }}>
                Amount: ₦{notification.amount.toLocaleString()}
              </Typography>
            </Box>
          )}

          {notification.documentName && (
            <Box sx={{ mt: 2, p: 2, bgcolor: '#e3f2fd', borderRadius: '8px' }}>
              <Typography variant="body2" sx={{ color: '#1565c0' }}>
                Document: {notification.documentName}
              </Typography>
            </Box>
          )}
        </ContentBox>
      </DialogContent>

      <DialogActions sx={{ p: 3, pt: 0, gap: 1 }}>
        <Button onClick={onClose} sx={{ color: '#666' }}>
          Close
        </Button>
        {notification.actionUrl && (
          <Button
            variant="contained"
            onClick={() => onActionClick(notification)}
            endIcon={<OpenInNewIcon />}
            sx={{
              bgcolor: '#15e420',
              '&:hover': { bgcolor: '#12c21e' }
            }}
          >
            View Details
          </Button>
        )}
        {isRejectedDocument && notification.documentField && (
          <Button
            variant="outlined"
            onClick={() => {
              onClose();
              // The reupload will be handled by the parent component
            }}
            sx={{ borderColor: '#15e420', color: '#15e420' }}
          >
            Re-upload
          </Button>
        )}
      </DialogActions>
    </StyledDialog>
  );
};

export default NotificationModal;