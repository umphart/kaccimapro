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
  Alert,
  Badge,
  Fade
} from '@mui/material';
import {
  Visibility as VisibilityIcon,
  Download as DownloadIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Pending as PendingIcon,
  Warning as WarningIcon,
  Refresh as RefreshIcon,
  PictureAsPdf as PdfIcon,
  Image as ImageIcon,
  Description as DescriptionIcon,
  History as HistoryIcon,
  Error as ErrorIcon
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';

const StyledDocumentCard = styled(Card)(({ theme, status, isReuploaded, hasRejection }) => ({
  height: '220px', // Reduced height
  borderRadius: '12px',
  boxShadow: '0 5px 15px rgba(0, 0, 0, 0.08)',
  transition: 'all 0.3s',
  position: 'relative',
  overflow: 'visible',
  display: 'flex',
  flexDirection: 'column',
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: hasRejection 
      ? '0 15px 30px rgba(220, 53, 69, 0.15)'
      : isReuploaded
        ? '0 15px 30px rgba(23, 162, 184, 0.15)'
        : status === 'approved'
          ? '0 15px 30px rgba(40, 167, 69, 0.15)'
          : '0 15px 30px rgba(21, 228, 32, 0.15)'
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
                isReuploaded ? '#17a2b8' : '#ffc107',
    borderTopLeftRadius: '12px',
    borderTopRightRadius: '12px'
  },
  ...(isReuploaded && {
    animation: 'pulse 2s infinite',
    '@keyframes pulse': {
      '0%': {
        boxShadow: '0 0 0 0 rgba(23, 162, 184, 0.4)'
      },
      '70%': {
        boxShadow: '0 0 0 6px rgba(23, 162, 184, 0)'
      },
      '100%': {
        boxShadow: '0 0 0 0 rgba(23, 162, 184, 0)'
      }
    }
  })
}));

const StatusChip = styled(Chip)(({ status, isReuploaded }) => ({
  position: 'absolute',
  top: '12px',
  right: '12px',
  height: '22px',
  fontSize: '0.65rem',
  fontWeight: 600,
  zIndex: 3,
  backgroundColor: status === 'approved' ? 'rgba(40, 167, 69, 0.1)' :
                  status === 'rejected' ? 'rgba(220, 53, 69, 0.1)' :
                  isReuploaded ? 'rgba(23, 162, 184, 0.1)' :
                  'rgba(255, 193, 7, 0.1)',
  color: status === 'approved' ? '#28a745' :
         status === 'rejected' ? '#dc3545' :
         isReuploaded ? '#17a2b8' :
         '#ffc107',
  border: `1px solid ${status === 'approved' ? '#28a745' :
                     status === 'rejected' ? '#dc3545' :
                     isReuploaded ? '#17a2b8' :
                     '#ffc107'}`
}));

const ReuploadBadge = styled(Box)(({ theme }) => ({
  position: 'absolute',
  top: '12px',
  left: '12px',
  zIndex: 3,
  '& .MuiBadge-badge': {
    backgroundColor: '#17a2b8',
    color: 'white',
    fontSize: '0.6rem',
    padding: '0 4px',
    animation: 'pulse 2s infinite',
    '@keyframes pulse': {
      '0%': {
        transform: 'scale(1)',
      },
      '50%': {
        transform: 'scale(1.05)',
      },
      '100%': {
        transform: 'scale(1)',
      }
    }
  }
}));

const ReuploadCountBadge = styled(Box)(({ theme }) => ({
  position: 'absolute',
  bottom: '8px',
  right: '8px',
  zIndex: 2,
  '& .MuiBadge-badge': {
    backgroundColor: '#17a2b8',
    color: 'white',
    fontSize: '0.55rem',
    padding: '0 4px'
  }
}));

const DocumentTypeIcon = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  width: '40px',
  height: '40px',
  borderRadius: '50%',
  margin: '0 auto 8px',
  backgroundColor: '#f5f5f5',
  transition: 'all 0.3s',
  '&:hover': {
    transform: 'scale(1.1)',
    backgroundColor: '#e8f5e9'
  }
}));

const getFileIcon = (fileName, status) => {
  if (status === 'rejected') {
    return <ErrorIcon sx={{ fontSize: 24, color: '#dc3545' }} />;
  }
  
  const ext = fileName?.split('.').pop()?.toLowerCase();
  if (ext === 'pdf') return <PdfIcon sx={{ fontSize: 24, color: '#dc3545' }} />;
  if (['jpg', 'jpeg', 'png', 'gif', 'svg'].includes(ext)) return <ImageIcon sx={{ fontSize: 24, color: '#15e420' }} />;
  return <DescriptionIcon sx={{ fontSize: 24, color: '#17a2b8' }} />;
};

const getFileNameFromPath = (path) => {
  if (!path) return '';
  if (path.includes('/')) {
    const parts = path.split('/');
    return parts[parts.length - 1];
  }
  return path;
};

const DocumentCard = ({ 
  document, 
  status, 
  rejectionReason,
  isReuploaded = false,
  reuploadCount = 0,
  organizationStatus,
  processing,
  onView,
  onDownload,
  onApprove,
  onReject,
  showHistory = false,
  onHistoryClick
}) => {
  const getStatusIcon = () => {
    if (isReuploaded) return <RefreshIcon sx={{ fontSize: 14, color: '#17a2b8' }} />;
    switch (status) {
      case 'approved':
        return <CheckCircleIcon sx={{ fontSize: 14, color: '#28a745' }} />;
      case 'rejected':
        return <CancelIcon sx={{ fontSize: 14, color: '#dc3545' }} />;
      default:
        return <PendingIcon sx={{ fontSize: 14, color: '#ffc107' }} />;
    }
  };

  const getStatusLabel = () => {
    if (isReuploaded) return 'RE-UPLOADED';
    return status?.toUpperCase() || 'PENDING';
  };

  const fileName = getFileNameFromPath(document.path);
  const hasRejection = !!rejectionReason && !isReuploaded;

  const handleViewClick = () => {
    onView(document);
  };

  const handleDownloadClick = () => {
    onDownload(document);
  };

  return (
    <Fade in timeout={500}>
      <StyledDocumentCard 
        status={status} 
        isReuploaded={isReuploaded}
        hasRejection={hasRejection}
      >
        {/* Re-upload badge */}
        {isReuploaded && (
          <ReuploadBadge>
            <Badge badgeContent="NEW" color="info">
              <RefreshIcon sx={{ opacity: 0 }} />
            </Badge>
          </ReuploadBadge>
        )}

        {/* Re-upload count badge */}
        {reuploadCount > 0 && (
          <ReuploadCountBadge>
            <Badge badgeContent={`${reuploadCount}x`} color="info">
              <HistoryIcon sx={{ opacity: 0 }} />
            </Badge>
          </ReuploadCountBadge>
        )}
        
        <StatusChip
          status={status}
          isReuploaded={isReuploaded}
          icon={getStatusIcon()}
          label={getStatusLabel()}
          size="small"
        />

        <CardContent sx={{ pt: 4, pb: 0.5, flex: 1 }}>
          <DocumentTypeIcon>
            {getFileIcon(document.path, status)}
          </DocumentTypeIcon>

          <Typography 
            variant="subtitle2" 
            align="center"
            sx={{ 
              fontWeight: 600,
              mb: 0.5,
              fontSize: '0.85rem',
              lineHeight: 1.2,
              height: '32px',
              overflow: 'hidden',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical'
            }}
          >
            {document.name}
          </Typography>
          {/* Re-uploaded alert */}
          {isReuploaded && (
            <Alert 
              severity="info" 
              icon={<RefreshIcon sx={{ fontSize: 14 }} />}
              sx={{ 
                py: 0, 
                px: 0.5, 
                mt: 0.5,
                bgcolor: 'rgba(23, 162, 184, 0.1)',
                border: '1px solid rgba(23, 162, 184, 0.2)',
                '& .MuiAlert-message': { 
                  fontSize: '0.6rem',
                  fontWeight: 600,
                  padding: '4px 0'
                },
                '& .MuiAlert-icon': {
                  mr: 0.5,
                  py: 0.5
                }
              }}
            >
              Pending review
            </Alert>
          )}

          {/* Rejection reason alert */}
          {rejectionReason && !isReuploaded && (
            <Tooltip 
              title={
                <Box sx={{ p: 1 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                    Rejection Reason:
                  </Typography>
                  <Typography variant="body2">
                    {rejectionReason}
                  </Typography>
                </Box>
              } 
              arrow
              placement="top"
            >
              <Alert 
                severity="error" 
                icon={<WarningIcon sx={{ fontSize: 14 }} />}
                sx={{ 
                  py: 0, 
                  px: 0.5, 
                  mt: 0.5,
                  cursor: 'help',
                  border: '1px solid rgba(220, 53, 69, 0.2)',
                  '& .MuiAlert-message': { 
                    fontSize: '0.6rem',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    padding: '4px 0'
                  },
                  '& .MuiAlert-icon': {
                    mr: 0.5,
                    py: 0.5
                  }
                }}
              >
                {rejectionReason.length > 20 
                  ? rejectionReason.substring(0, 20) + '...' 
                  : rejectionReason}
              </Alert>
            </Tooltip>
          )}
        </CardContent>

        <Divider sx={{ my: 0.5 }} />

        <CardActions sx={{ justifyContent: 'space-between', p: 0.5 }}>
          <Box>
            <Tooltip title="View Document" arrow>
              <IconButton 
                size="small" 
                onClick={handleViewClick}
                sx={{ 
                  color: '#15e420',
                  p: 0.5,
                  '&:hover': {
                    bgcolor: 'rgba(21, 228, 32, 0.1)'
                  }
                }}
                disabled={status === 'rejected' && !isReuploaded}
              >
                <VisibilityIcon sx={{ fontSize: 18 }} />
              </IconButton>
            </Tooltip>
            <Tooltip title="Download" arrow>
              <IconButton 
                size="small" 
                onClick={handleDownloadClick}
                sx={{ 
                  color: '#15e420',
                  p: 0.5,
                  '&:hover': {
                    bgcolor: 'rgba(21, 228, 32, 0.1)'
                  }
                }}
                disabled={status === 'rejected' && !isReuploaded}
              >
                <DownloadIcon sx={{ fontSize: 18 }} />
              </IconButton>
            </Tooltip>
          </Box>

          <Box>
            {/* History button */}
            {showHistory && onHistoryClick && (
              <Tooltip title="View History" arrow>
                <IconButton
                  size="small"
                  onClick={() => onHistoryClick(document)}
                  sx={{ 
                    color: '#17a2b8',
                    p: 0.5,
                    mr: 0.5,
                    '&:hover': {
                      bgcolor: 'rgba(23, 162, 184, 0.1)'
                    }
                  }}
                >
                  <HistoryIcon sx={{ fontSize: 18 }} />
                </IconButton>
              </Tooltip>
            )}

            {/* Approve/Reject buttons */}
            {(status === 'pending' || isReuploaded) && organizationStatus === 'pending' && (
              <>
                <Tooltip title="Reject Document" arrow>
                  <IconButton
                    size="small"
                    onClick={() => onReject(document)}
                    disabled={processing}
                    sx={{ 
                      color: '#dc3545',
                      p: 0.5,
                      '&:hover': {
                        bgcolor: 'rgba(220, 53, 69, 0.1)'
                      }
                    }}
                  >
                    <CancelIcon sx={{ fontSize: 18 }} />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Approve Document" arrow>
                  <IconButton
                    size="small"
                    onClick={() => onApprove(document)}
                    disabled={processing}
                    sx={{ 
                      color: '#28a745',
                      p: 0.5,
                      '&:hover': {
                        bgcolor: 'rgba(40, 167, 69, 0.1)'
                      }
                    }}
                  >
                    <CheckCircleIcon sx={{ fontSize: 18 }} />
                  </IconButton>
                </Tooltip>
              </>
            )}
          </Box>
        </CardActions>
      </StyledDocumentCard>
    </Fade>
  );
};

export default DocumentCard;