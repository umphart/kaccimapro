import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Box,
  Typography,
  Alert
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Pending as PendingIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Info as InfoIcon
} from '@mui/icons-material';

const DocumentStatusDialog = ({ 
  open, 
  onClose, 
  documents, 
  documentStatus, 
  documentsWithIssues, 
  onReviewDocuments 
}) => {
  const hasRejected = documentsWithIssues.some(d => d.reason.includes('rejected'));

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ 
        fontFamily: '"Poppins", sans-serif', 
        display: 'flex', 
        alignItems: 'center', 
        gap: 1, 
        color: hasRejected ? '#d32f2f' : '#ed6c02'
      }}>
        {hasRejected ? (
          <ErrorIcon color="error" />
        ) : (
          <WarningIcon color="warning" />
        )}
        {hasRejected ? 'Documents Need Attention' : 'Documents Not Fully Approved'}
      </DialogTitle>
      <DialogContent>
        <Alert 
          severity={hasRejected ? 'error' : 'warning'} 
          sx={{ mb: 2 }}
        >
          {hasRejected 
            ? 'Some documents have been rejected and need to be re-uploaded before payment can be approved.'
            : 'All organization documents must be approved before payment can be approved.'}
        </Alert>
        
        <Typography variant="body2" sx={{ mb: 2, fontWeight: 600 }}>
          Document Status:
        </Typography>
        
        <List dense>
          {documents.map((doc) => (
            <ListItem key={doc.key}>
              <ListItemIcon>
                {documentStatus[doc.key] === 'approved' ? (
                  <CheckCircleIcon sx={{ color: '#28a745' }} fontSize="small" />
                ) : documentStatus[doc.key] === 'rejected' ? (
                  <CancelIcon sx={{ color: '#dc3545' }} fontSize="small" />
                ) : (
                  <PendingIcon sx={{ color: '#ffc107' }} fontSize="small" />
                )}
              </ListItemIcon>
              <ListItemText 
                primary={doc.name}
                secondary={
                  documentStatus[doc.key] === 'approved' ? 'Approved' : 
                  documentStatus[doc.key] === 'rejected' ? 'Rejected - Needs re-upload' : 'Pending Review'
                }
                secondaryTypographyProps={{
                  color: documentStatus[doc.key] === 'approved' ? 'success' :
                         documentStatus[doc.key] === 'rejected' ? 'error' : 'warning'
                }}
              />
            </ListItem>
          ))}
        </List>

        {documentsWithIssues.length > 0 && (
          <Box sx={{ mt: 2, p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
            <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <InfoIcon fontSize="small" color="info" />
              Details:
            </Typography>
            {documentsWithIssues.map((issue, index) => (
              <Typography key={index} variant="body2" sx={{ ml: 3, mb: 0.5 }}>
                • {issue.name}: {issue.reason}
              </Typography>
            ))}
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>
          Close
        </Button>
        <Button 
          onClick={onReviewDocuments}
          variant="contained"
          sx={{ bgcolor: '#15e420', '&:hover': { bgcolor: '#12c21e' } }}
        >
          Review Documents
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DocumentStatusDialog;