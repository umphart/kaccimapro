import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography
} from '@mui/material';

const DocumentRejectDialog = ({ 
  open, 
  onClose, 
  onReject, 
  document, 
  rejectReason, 
  setRejectReason, 
  processing 
}) => {
  return (
    <Dialog open={open} onClose={() => !processing && onClose()} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontFamily: '"Poppins", sans-serif' }}>
        Reject {document?.name}
      </DialogTitle>
      <DialogContent>
        <Typography variant="body2" sx={{ mb: 2, color: '#666' }}>
          Please provide a reason for rejecting this document:
        </Typography>
        <TextField
          autoFocus
          multiline
          rows={4}
          fullWidth
          value={rejectReason}
          onChange={(e) => setRejectReason(e.target.value)}
          placeholder="Enter rejection reason..."
          variant="outlined"
          disabled={processing}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={processing}>Cancel</Button>
        <Button 
          onClick={onReject} 
          color="error" 
          variant="contained"
          disabled={!rejectReason.trim() || processing}
        >
          {processing ? 'Processing...' : 'Reject Document'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DocumentRejectDialog;