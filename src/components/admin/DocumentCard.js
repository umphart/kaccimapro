import React from 'react';
import {
  Box,
  Paper,
  Typography,
  Chip,
  IconButton,
  Tooltip,
  Divider,
  CardActions,
  CardContent,
  useMediaQuery,
  useTheme
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
  Info as InfoIcon,
  Warning as WarningIcon,
  Verified as VerifiedIcon
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';

// Styled Components with responsive design
const StyledCard = styled(Paper)(({ theme, status }) => ({
  height: '100%',
  borderRadius: '16px',
  boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)',
  transition: 'all 0.3s ease',
  display: 'flex',
  flexDirection: 'column',
  position: 'relative',
  overflow: 'visible',
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: '0 15px 35px rgba(21, 228, 32, 0.15)'
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
    borderTopLeftRadius: '16px',
    borderTopRightRadius: '16px'
  },
  [theme.breakpoints.down('sm')]: {
    borderRadius: '12px',
    '&:hover': {
      transform: 'translateY(-2px)'
    }
  }
}));

const DocumentIconWrapper = styled(Box)(({ theme, status }) => ({
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  width: '70px',
  height: '70px',
  borderRadius: '50%',
  margin: '0 auto 12px auto',
  background: status === 'approved' ? 'rgba(40, 167, 69, 0.1)' : 
              status === 'rejected' ? 'rgba(220, 53, 69, 0.1)' : 
              'rgba(255, 193, 7, 0.1)',
  border: `2px solid ${status === 'approved' ? '#28a745' : 
                      status === 'rejected' ? '#dc3545' : 
                      '#ffc107'}`,
  transition: 'all 0.3s ease',
  [theme.breakpoints.down('sm')]: {
    width: '60px',
    height: '60px',
    margin: '0 auto 8px auto',
    '& svg': {
      fontSize: '32px'
    }
  },
  [theme.breakpoints.down('md')]: {
    width: '65px',
    height: '65px',
  },
  '& svg': {
    fontSize: '36px',
    [theme.breakpoints.down('sm')]: {
      fontSize: '30px'
    }
  }
}));

const StatusBadge = styled(Box)(({ theme }) => ({
  position: 'absolute',
  top: '12px',
  right: '12px',
  zIndex: 1,
  [theme.breakpoints.down('sm')]: {
    top: '8px',
    right: '8px'
  }
}));

const DocumentStats = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: theme.spacing(0.75, 1.5),
  backgroundColor: '#f8f9fa',
  borderRadius: '8px',
  marginTop: theme.spacing(1),
  [theme.breakpoints.down('sm')]: {
    padding: theme.spacing(0.5, 1),
    marginTop: theme.spacing(0.75)
  }
}));

const DocumentMeta = styled(Typography)(({ theme }) => ({
  fontSize: '0.7rem',
  color: '#666',
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(0.5),
  marginTop: theme.spacing(0.5),
  [theme.breakpoints.down('sm')]: {
    fontSize: '0.65rem',
    marginTop: theme.spacing(0.25)
  }
}));

const ActionButton = styled(IconButton)(({ theme, actioncolor }) => ({
  backgroundColor: '#fff',
  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
  margin: theme.spacing(0, 0.25),
  transition: 'all 0.2s ease',
  padding: theme.spacing(0.75),
  [theme.breakpoints.down('sm')]: {
    padding: theme.spacing(0.5),
    margin: theme.spacing(0, 0.15),
    '& svg': {
      fontSize: '1rem'
    }
  },
  [theme.breakpoints.down('md')]: {
    padding: theme.spacing(0.6),
  },
  '&:hover': {
    backgroundColor: actioncolor === 'approve' ? '#28a745' :
                     actioncolor === 'reject' ? '#dc3545' :
                     '#15e420',
    transform: 'scale(1.1)',
    '& svg': {
      color: '#fff'
    }
  },
  '& svg': {
    fontSize: '1.1rem',
    color: actioncolor === 'approve' ? '#28a745' :
           actioncolor === 'reject' ? '#dc3545' :
           '#15e420'
  }
}));

const DocumentName = styled(Typography)(({ theme }) => ({
  fontWeight: 600,
  fontSize: '0.95rem',
  marginBottom: theme.spacing(1),
  minHeight: '42px',
  display: '-webkit-box',
  WebkitLineClamp: 2,
  WebkitBoxOrient: 'vertical',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  textAlign: 'center',
  [theme.breakpoints.down('sm')]: {
    fontSize: '0.85rem',
    minHeight: '38px',
    marginBottom: theme.spacing(0.75)
  },
  [theme.breakpoints.down('md')]: {
    fontSize: '0.9rem',
    minHeight: '40px',
  }
}));

const CompactChip = styled(Chip)(({ theme }) => ({
  height: '22px',
  fontSize: '0.65rem',
  '& .MuiChip-icon': {
    fontSize: '0.75rem',
    marginLeft: '4px'
  },
  [theme.breakpoints.down('sm')]: {
    height: '20px',
    fontSize: '0.6rem',
  }
}));

const DocumentCard = ({ 
  document, 
  status, 
  rejectionReason, 
  organizationStatus, 
  processing,
  onView,
  onDownload,
  onApprove,
  onReject,
  uploadedAt = new Date().toISOString(),
  fileType 
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));
  
  const getFileIcon = (fileName, status) => {
    const iconColor = status === 'approved' ? '#28a745' : 
                      status === 'rejected' ? '#dc3545' : 
                      '#ffc107';
    
    const ext = fileName?.split('.').pop()?.toLowerCase();
    if (ext === 'pdf') return <PdfIcon sx={{ fontSize: 'inherit', color: iconColor }} />;
    if (['jpg', 'jpeg', 'png', 'gif'].includes(ext)) return <ImageIcon sx={{ fontSize: 'inherit', color: iconColor }} />;
    return <DescriptionIcon sx={{ fontSize: 'inherit', color: iconColor }} />;
  };

  const getStatusChip = (status) => {
    const config = {
      approved: { color: 'success', icon: <CheckCircleIcon />, label: 'Approved' },
      rejected: { color: 'error', icon: <CancelIcon />, label: 'Rejected' },
      pending: { color: 'warning', icon: <PendingIcon />, label: 'Pending' }
    };
    
    const chipConfig = config[status] || config.pending;
    
    return (
      <CompactChip
        size="small"
        icon={chipConfig.icon}
        label={isMobile ? '' : chipConfig.label}
        color={chipConfig.color}
        sx={{ 
          '& .MuiChip-icon': { 
            fontSize: isMobile ? '0.9rem' : '0.75rem',
            margin: isMobile ? '0' : '0 0 0 4px'
          },
          minWidth: isMobile ? '24px' : 'auto',
          justifyContent: 'center'
        }}
      />
    );
  };

  return (
    <StyledCard status={status}>
      <StatusBadge>
        {getStatusChip(status)}
      </StatusBadge>
      
      <CardContent sx={{ 
        flex: 1, 
        display: 'flex', 
        flexDirection: 'column', 
        pt: isMobile ? 2 : 3,
        p: isMobile ? 1.5 : 2
      }}>
        <DocumentIconWrapper status={status}>
          {getFileIcon(document.path, status)}
        </DocumentIconWrapper>
        
        <DocumentName>
          {document.name}
        </DocumentName>

        {!isMobile && (
          <>
            <DocumentMeta>
              <InfoIcon sx={{ fontSize: '0.7rem', color: '#999' }} />
              {new Date(uploadedAt).toLocaleDateString()}
            </DocumentMeta>

            {fileType && (
              <DocumentMeta>
                <DescriptionIcon sx={{ fontSize: '0.7rem', color: '#999' }} />
                {fileType.toUpperCase()}
              </DocumentMeta>
            )}
          </>
        )}

        {rejectionReason && (
          <Tooltip title={rejectionReason} arrow>
            <DocumentStats>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <WarningIcon sx={{ fontSize: isMobile ? '0.75rem' : '0.875rem', color: '#dc3545' }} />
                {!isMobile && (
                  <Typography variant="caption" sx={{ color: '#dc3545', fontWeight: 500, fontSize: '0.65rem' }}>
                    Rejected
                  </Typography>
                )}
              </Box>
            </DocumentStats>
          </Tooltip>
        )}
      </CardContent>

      <Divider />

      <CardActions sx={{ 
        justifyContent: 'space-between', 
        p: isMobile ? 1 : 2,
        gap: isMobile ? 0.5 : 1
      }}>
        <Box sx={{ display: 'flex', gap: isMobile ? 0.25 : 0.5 }}>
          <Tooltip title="View Document" arrow>
            <ActionButton 
              onClick={() => onView(document)} 
              size="small"
            >
              <VisibilityIcon />
            </ActionButton>
          </Tooltip>
          <Tooltip title="Download Document" arrow>
            <ActionButton 
              onClick={() => onDownload(document)} 
              size="small"
            >
              <DownloadIcon />
            </ActionButton>
          </Tooltip>
        </Box>
        
        {organizationStatus === 'pending' && status !== 'approved' && (
          <Box sx={{ display: 'flex', gap: isMobile ? 0.25 : 0.5 }}>
            {status !== 'rejected' && (
              <Tooltip title="Reject Document" arrow>
                <ActionButton 
                  onClick={() => onReject(document)} 
                  size="small"
                  actioncolor="reject"
                >
                  <CancelIcon />
                </ActionButton>
              </Tooltip>
            )}
            <Tooltip title="Approve Document" arrow>
              <ActionButton 
                onClick={() => onApprove(document)} 
                size="small"
                actioncolor="approve"
              >
                <CheckCircleIcon />
              </ActionButton>
            </Tooltip>
          </Box>
        )}
        
        {status === 'approved' && (
          <Tooltip title="Document Approved" arrow>
            <CompactChip
              icon={<VerifiedIcon />}
              label={isMobile ? '' : "Approved"}
              size="small"
              color="success"
              variant="outlined"
              sx={{ 
                height: '22px',
                '& .MuiChip-icon': { 
                  fontSize: isMobile ? '0.9rem' : '0.75rem',
                  margin: isMobile ? '0' : '0 0 0 4px'
                }
              }}
            />
          </Tooltip>
        )}
      </CardActions>
    </StyledCard>
  );
};

export default DocumentCard;