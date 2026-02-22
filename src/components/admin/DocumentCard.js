import React from 'react';
import {
  Box,
  Paper,
  Typography,
  Chip,
  IconButton,
  Tooltip,
  Badge
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Pending as PendingIcon,
  Visibility as VisibilityIcon,
  Download as DownloadIcon,
  PictureAsPdf as PdfIcon,
  Image as ImageIcon,
  Description as DescriptionIcon,
  Info as InfoIcon
} from '@mui/icons-material';

const DocumentCard = ({ 
  document, 
  status, 
  rejectionReason, 
  organizationStatus, 
  processing,
  onView,
  onDownload,
  onApprove,
  onReject 
}) => {
  const getFileIcon = (fileName) => {
    const ext = fileName?.split('.').pop()?.toLowerCase();
    if (ext === 'pdf') return <PdfIcon sx={{ fontSize: 40, color: '#dc3545' }} />;
    if (['jpg', 'jpeg', 'png', 'gif'].includes(ext)) return <ImageIcon sx={{ fontSize: 40, color: '#15e420' }} />;
    return <DescriptionIcon sx={{ fontSize: 40, color: '#17a2b8' }} />;
  };

  const getStatusChip = (status) => {
    switch(status) {
      case 'approved':
        return <Chip size="small" icon={<CheckCircleIcon />} label="Approved" color="success" />;
      case 'rejected':
        return <Chip size="small" icon={<CancelIcon />} label="Rejected" color="error" />;
      default:
        return <Chip size="small" icon={<PendingIcon />} label="Pending" color="warning" />;
    }
  };

  const getStatusColor = (status) => {
    return status === 'rejected' ? '#dc3545' : 
           status === 'approved' ? '#28a745' : 
           '#ffc107';
  };

  const getStatusBgColor = (status) => {
    return status === 'rejected' ? '#ffebee' : 
           status === 'approved' ? '#e8f5e9' : 
           '#fff3e0';
  };

  return (
    <Paper sx={{ 
      p: 2, 
      borderRadius: '12px',
      border: `2px solid ${getStatusColor(status)}`,
      backgroundColor: getStatusBgColor(status),
      transition: 'all 0.3s',
      '&:hover': {
        transform: 'translateY(-4px)',
        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.15)'
      }
    }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {getFileIcon(document.path)}
          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
            {document.name}
          </Typography>
        </Box>
        <Badge
          color={
            status === 'approved' ? 'success' :
            status === 'rejected' ? 'error' : 'warning'
          }
          variant="dot"
        />
      </Box>

      <Box sx={{ mb: 2 }}>
        {getStatusChip(status)}
      </Box>

      {rejectionReason && (
        <Tooltip title={rejectionReason}>
          <Typography variant="caption" color="error" sx={{ display: 'block', mb: 1 }}>
            <InfoIcon fontSize="inherit" /> {rejectionReason.substring(0, 50)}...
          </Typography>
        </Tooltip>
      )}

      <Box sx={{ display: 'flex', gap: 1, justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <IconButton 
            size="small" 
            onClick={() => onView(document)} 
            sx={{ color: '#15e420' }}
            title="View Document"
          >
            <VisibilityIcon />
          </IconButton>
          <IconButton 
            size="small" 
            onClick={() => onDownload(document)} 
            sx={{ color: '#15e420' }}
            title="Download Document"
          >
            <DownloadIcon />
          </IconButton>
        </Box>
        
        {organizationStatus === 'pending' && status !== 'approved' && (
          <Box>
            {status !== 'rejected' && (
              <IconButton 
                size="small" 
                onClick={() => onReject(document)}
                sx={{ color: '#dc3545' }}
                title="Reject Document"
              >
                <CancelIcon />
              </IconButton>
            )}
            <IconButton 
              size="small" 
              onClick={() => onApprove(document)}
              sx={{ color: '#28a745' }}
              title="Approve Document"
            >
              <CheckCircleIcon />
            </IconButton>
          </Box>
        )}
      </Box>
    </Paper>
  );
};

export default DocumentCard;