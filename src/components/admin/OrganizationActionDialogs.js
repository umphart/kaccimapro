import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  Alert
} from '@mui/material';

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
      {/* Organization Approve Confirmation Dialog */}
      <Dialog open={approveOpen} onClose={() => !processing && onApproveClose()} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontFamily: '"Poppins", sans-serif' }}>
          Approve Organization
        </DialogTitle>
        <DialogContent>
          {allDocumentsApproved ? (
            <Alert severity="success" sx={{ mb: 2 }}>
              All documents are approved. Ready to approve organization.
            </Alert>
          ) : (
            <Alert severity="warning" sx={{ mb: 2 }}>
              Not all documents are approved yet. Please approve all documents first.
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={onApproveClose} disabled={processing}>Cancel</Button>
          <Button 
            onClick={onApproveConfirm} 
            color="success" 
            variant="contained"
            disabled={!allDocumentsApproved || processing}
          >
            {processing ? 'Processing...' : 'Approve Organization'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Organization Reject Dialog */}
      <Dialog open={rejectOpen} onClose={() => !processing && onRejectClose()} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontFamily: '"Poppins", sans-serif' }}>
          Reject Organization
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2, color: '#666' }}>
            Please provide a reason for rejecting this organization:
          </Typography>
          <TextField
            autoFocus
            multiline
            rows={4}
            fullWidth
            value={orgRejectReason}
            onChange={(e) => setOrgRejectReason(e.target.value)}
            placeholder="Enter rejection reason..."
            variant="outlined"
            disabled={processing}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={onRejectClose} disabled={processing}>Cancel</Button>
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

export default OrganizationActionDialogs