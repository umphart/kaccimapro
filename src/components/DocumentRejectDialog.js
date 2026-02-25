import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  TextField,
  Box
} from '@mui/material';
import { Cancel as CancelIcon } from '@mui/icons-material';

const DocumentRejectDialog = ({ 
  open, 
  onClose, 
  onReject, 
  document, 
  rejectReason, 
  setRejectReason,
  processing 
}) => {
  if (!document) return null;

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="sm" 
      fullWidth
      PaperProps={{
        sx: { borderRadius: '16px' }
      }}
    >
      <DialogTitle sx={{ 
        fontFamily: '"Poppins", sans-serif',
        borderBottom: '1px solid #e0e0e0',
        pb: 2
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <CancelIcon sx={{ color: '#dc3545' }} />
          <Typography variant="h6">Reject Document</Typography>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ pt: 3 }}>
        <Typography variant="body2" sx={{ mb: 2, color: '#666' }}>
          Please provide a reason for rejecting <strong>{document.name}</strong>
        </Typography>
        <TextField
          autoFocus
          margin="dense"
          label="Rejection Reason"
          fullWidth
          multiline
          rows={4}
          value={rejectReason}
          onChange={(e) => setRejectReason(e.target.value)}
          variant="outlined"
          placeholder="Enter detailed reason for rejection..."
          disabled={processing}
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: '8px'
            }
          }}
        />
      </DialogContent>

      <DialogActions sx={{ p: 3, pt: 0 }}>
        <Button 
          onClick={onClose}
          disabled={processing}
          sx={{ color: '#666' }}
        >
          Cancel
        </Button>
        <Button 
          onClick={onReject} 
          color="error" 
          variant="contained"
          disabled={!rejectReason.trim() || processing}
          sx={{
            borderRadius: '8px',
            px: 3
          }}
        >
          {processing ? 'Processing...' : 'Reject'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DocumentRejectDialog;