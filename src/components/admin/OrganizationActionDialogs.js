import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  TextField,
  Box,
  Alert
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Warning as WarningIcon
} from '@mui/icons-material';

const OrganizationActionDialogs = ({
  approveOpen,
  rejectOpen,
  onApproveClose,
  onRejectClose,
  onApproveConfirm,
  onRejectConfirm,
  allDocumentsApproved,
  orgRejectReason,
  setOrgRejectReason,
  processing
}) => {
  return (
    <>
      {/* Approve Organization Dialog */}
      <Dialog 
        open={approveOpen} 
        onClose={onApproveClose} 
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
            <CheckCircleIcon sx={{ color: '#28a745' }} />
            <Typography variant="h6">Approve Organization</Typography>
          </Box>
        </DialogTitle>

        <DialogContent sx={{ pt: 3 }}>
          {!allDocumentsApproved && (
            <Alert severity="warning" icon={<WarningIcon />} sx={{ mb: 2 }}>
              Not all documents have been approved. Please review all documents before approving.
            </Alert>
          )}
          <Typography variant="body2" sx={{ color: '#666' }}>
            Are you sure you want to approve this organization? 
            {allDocumentsApproved && ' All documents have been reviewed and approved.'}
          </Typography>
        </DialogContent>

        <DialogActions sx={{ p: 3 }}>
          <Button onClick={onApproveClose} disabled={processing}>
            Cancel
          </Button>
          <Button
            onClick={onApproveConfirm}
            variant="contained"
            disabled={!allDocumentsApproved || processing}
            sx={{
              bgcolor: '#28a745',
              '&:hover': {
                bgcolor: '#218838'
              },
              '&.Mui-disabled': {
                bgcolor: '#ccc'
              }
            }}
          >
            {processing ? 'Processing...' : 'Approve Organization'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Reject Organization Dialog */}
      <Dialog 
        open={rejectOpen} 
        onClose={onRejectClose} 
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
            <Typography variant="h6">Reject Organization</Typography>
          </Box>
        </DialogTitle>

        <DialogContent sx={{ pt: 3 }}>
          <Typography variant="body2" sx={{ mb: 2, color: '#666' }}>
            Please provide a reason for rejecting this organization.
          </Typography>
          <TextField
            autoFocus
            margin="dense"
            label="Rejection Reason"
            fullWidth
            multiline
            rows={4}
            value={orgRejectReason}
            onChange={(e) => setOrgRejectReason(e.target.value)}
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
          <Button onClick={onRejectClose} disabled={processing}>
            Cancel
          </Button>
          <Button
            onClick={onRejectConfirm}
            color="error"
            variant="contained"
            disabled={!orgRejectReason.trim() || processing}
          >
            {processing ? 'Processing...' : 'Reject Organization'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default OrganizationActionDialogs;