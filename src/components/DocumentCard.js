import React from 'react';
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Box,
  IconButton,
  Chip,
  Tooltip,
  Divider,
  Alert
} from '@mui/material';
import {
  Visibility as VisibilityIcon,
  Download as DownloadIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Pending as PendingIcon,
  Warning as WarningIcon,
  PictureAsPdf as PdfIcon,
  Image as ImageIcon,
  Description as DescriptionIcon
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';

const StyledDocumentCard = styled(Card)(({ theme, status }) => ({
  height: '100%',
  borderRadius: '12px',
  boxShadow: '0 5px 15px rgba(0, 0, 0, 0.08)',
  transition: 'all 0.3s',
  position: 'relative',
  overflow: 'visible',
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: '0 15px 30px rgba(21, 228, 32, 0.15)'
  },
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '4px',
    background: status === 'approved' ? '#28a745' : 
                status === 'rejected' ? '#dc3545' : 
                '#ffc107',
    borderTopLeftRadius: '12px',
    borderTopRightRadius: '12px'
  }
}));

const StatusChip = styled(Chip)(({ status }) => ({
  position: 'absolute',
  top: '12px',
  right: '12px',
  height: '24px',
  fontSize: '0.7rem',
  fontWeight: 600,
  backgroundColor: status === 'approved' ? 'rgba(40, 167, 69, 0.1)' :
                  status === 'rejected' ? 'rgba(220, 53, 69, 0.1)' :
                  'rgba(255, 193, 7, 0.1)',
  color: status === 'approved' ? '#28a745' :
         status === 'rejected' ? '#dc3545' :
         '#ffc107',
  border: `1px solid ${status === 'approved' ? '#28a745' :
                     status === 'rejected' ? '#dc3545' :
                     '#ffc107'}`
}));

const getFileIcon = (fileName) => {
  const ext = fileName?.split('.').pop()?.toLowerCase();
  if (ext === 'pdf') return <PdfIcon sx={{ fontSize: 40, color: '#dc3545' }} />;
  if (['jpg', 'jpeg', 'png', 'gif'].includes(ext)) return <ImageIcon sx={{ fontSize: 40, color: '#15e420' }} />;
  return <DescriptionIcon sx={{ fontSize: 40, color: '#17a2b8' }} />;
};

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
  const getStatusIcon = () => {
    switch (status) {
      case 'approved':
        return <CheckCircleIcon sx={{ fontSize: 16, color: '#28a745' }} />;
      case 'rejected':
        return <CancelIcon sx={{ fontSize: 16, color: '#dc3545' }} />;
      default:
        return <PendingIcon sx={{ fontSize: 16, color: '#ffc107' }} />;
    }
  };

  return (
    <StyledDocumentCard status={status}>
      <StatusChip
        status={status}
        icon={getStatusIcon()}
        label={status?.toUpperCase()}
        size="small"
      />

      <CardContent sx={{ pt: 4, pb: 1 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
          {getFileIcon(document.path)}
        </Box>

        <Typography 
          variant="subtitle1" 
          align="center"
          sx={{ 
            fontWeight: 600,
            mb: 1,
            fontSize: '0.95rem',
            minHeight: '40px'
          }}
        >
          {document.name}
        </Typography>

        {rejectionReason && (
          <Tooltip title={rejectionReason} arrow>
            <Alert 
              severity="error" 
              icon={<WarningIcon />}
              sx={{ 
                py: 0, 
                px: 1, 
                mb: 1,
                '& .MuiAlert-message': { 
                  fontSize: '0.7rem',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }
              }}
            >
              {rejectionReason}
            </Alert>
          </Tooltip>
        )}
      </CardContent>

      <Divider />

      <CardActions sx={{ justifyContent: 'space-between', p: 1 }}>
        <Box>
          <Tooltip title="View Document">
            <IconButton 
              size="small" 
              onClick={() => onView(document)}
              sx={{ color: '#15e420' }}
            >
              <VisibilityIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Download">
            <IconButton 
              size="small" 
              onClick={() => onDownload(document)}
              sx={{ color: '#15e420' }}
            >
              <DownloadIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>

        {status === 'pending' && organizationStatus === 'pending' && (
          <Box>
            <Tooltip title="Reject">
              <IconButton
                size="small"
                onClick={() => onReject(document)}
                disabled={processing}
                sx={{ color: '#dc3545' }}
              >
                <CancelIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Approve">
              <IconButton
                size="small"
                onClick={() => onApprove(document)}
                disabled={processing}
                sx={{ color: '#28a745' }}
              >
                <CheckCircleIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        )}
      </CardActions>
    </StyledDocumentCard>
  );
};

export default DocumentCard;