import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  FormControlLabel,
  Switch
} from '@mui/material';
import {
  Warning as WarningIcon,
  Cancel as CancelIcon
} from '@mui/icons-material';

const RejectPaymentDialog = ({
  open,
  onClose,
  onReject,
  rejectReason,
  setRejectReason,
  sendRejectionEmail,
  setSendRejectionEmail,
  processing
}) => {
  return (
    <Dialog open={open} onClose={() => !processing && onClose()} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontFamily: '"Poppins", sans-serif', display: 'flex', alignItems: 'center', gap: 1 }}>
        <WarningIcon color="error" />
        Reject Payment
      </DialogTitle>
      <DialogContent>
        <Typography variant="body2" sx={{ mb: 2, color: '#666' }}>
          Please provide a reason for rejecting this payment:
        </Typography>
        <TextField
          autoFocus
          margin="dense"
          label="Reason for Rejection"
          fullWidth
          multiline
          rows={4}
          value={rejectReason}
          onChange={(e) => setRejectReason(e.target.value)}
          variant="outlined"
          placeholder="Explain why this payment is being rejected..."
          disabled={processing}
          error={!rejectReason.trim()}
          helperText={!rejectReason.trim() ? 'Reason is required' : ''}
        />
        
        <Box sx={{ mt: 3, p: 2, bgcolor: '#f5f5f5', borderRadius: 2 }}>
          <FormControlLabel
            control={
              <Switch
                checked={sendRejectionEmail}
                onChange={(e) => setSendRejectionEmail(e.target.checked)}
                color="primary"
                disabled={processing}
              />
            }
            label={
              <Box>
                <Typography variant="body2" fontWeight={600}>Send rejection email to organization</Typography>
                <Typography variant="caption" color="textSecondary">
                  When enabled, the organization will receive an email notification about the rejection
                </Typography>
              </Box>
            }
          />
        </Box>
      </DialogContent>
      <DialogActions sx={{ p: 3 }}>
        <Button onClick={onClose} disabled={processing}>
          Cancel
        </Button>
        <Button 
          onClick={onReject} 
          color="error" 
          variant="contained"
          disabled={!rejectReason.trim() || processing}
          startIcon={<CancelIcon />}
        >
          {processing ? 'Processing...' : 'Reject Payment'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default RejectPaymentDialog;