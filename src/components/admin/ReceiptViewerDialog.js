import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Box,
  Typography
} from '@mui/material';
import {
  Cancel as CancelIcon
} from '@mui/icons-material';

const ReceiptViewerDialog = ({ open, onClose, receiptUrl, companyName }) => {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
    >
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        Payment Receipt - {companyName}
        <IconButton onClick={onClose}>
          <CancelIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers>
        <Box sx={{ minHeight: 500 }}>
          {receiptUrl ? (
            receiptUrl.includes('.pdf') ? (
              <iframe
                src={receiptUrl}
                title="Payment Receipt"
                width="100%"
                height="600px"
                style={{ border: 'none' }}
              />
            ) : (
              <img 
                src={receiptUrl} 
                alt="Payment Receipt" 
                style={{ width: '100%', height: 'auto' }} 
              />
            )
          ) : (
            <Typography>Receipt not available</Typography>
          )}
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default ReceiptViewerDialog;