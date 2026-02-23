import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography } from '@mui/material';

const DownloadDialog = ({ open, type, onClose, onConfirm }) => {
  const getTitle = () => {
    return type === 'certificate' ? 'Certificate Already Downloaded' : 'Receipt Already Downloaded';
  };

  const getMessage = () => {
    if (type === 'certificate') {
      return 'You have already downloaded your membership certificate. Certificates can only be downloaded once for security reasons. If you need a replacement, please contact the KACCIMA admin.';
    } else {
      return 'You have already downloaded your payment receipt. Receipts can only be downloaded once for security reasons. If you need a replacement, please contact the KACCIMA admin.';
    }
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle sx={{ fontFamily: '"Poppins", sans-serif' }}>
        {getTitle()}
      </DialogTitle>
      <DialogContent>
        <Typography>
          {getMessage()}
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
        <Button 
          onClick={onConfirm} 
          variant="contained"
          sx={{ bgcolor: '#15e420', '&:hover': { bgcolor: '#12c21e' } }}
        >
          Contact Admin
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DownloadDialog;