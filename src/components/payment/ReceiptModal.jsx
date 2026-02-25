import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  IconButton,
  Button,
  CircularProgress
} from '@mui/material';
import {
  Receipt as ReceiptIcon,
  Close as CloseIcon,
  Download as DownloadIcon
} from '@mui/icons-material';

const ReceiptModal = ({ open, onClose, payment, onDownload }) => {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: '16px',
          overflow: 'hidden'
        }
      }}
    >
      <DialogTitle sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        fontFamily: '"Poppins", sans-serif',
        fontWeight: 600,
        borderBottom: '1px solid #eee',
        bgcolor: '#f8f9fa'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <ReceiptIcon sx={{ color: '#15e420' }} />
          <span>Payment Receipt</span>
        </Box>
        <IconButton onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers sx={{ p: 0, bgcolor: '#f5f5f5' }}>
        <Box sx={{ position: 'relative', minHeight: '70vh' }}>
          <Box
            sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              opacity: 0.05,
              pointerEvents: 'none',
              zIndex: 0
            }}
          >
            <img src="/static/logo.png" alt="Watermark" width={200} />
          </Box>
          {payment?.url ? (
            <iframe
              src={payment.url}
              title="Payment Receipt"
              width="100%"
              height="70vh"
              style={{ 
                border: 'none', 
                position: 'relative', 
                zIndex: 1,
                backgroundColor: '#fff'
              }}
            />
          ) : (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '70vh' }}>
              <CircularProgress style={{ color: '#15e420' }} />
            </Box>
          )}
        </Box>
      </DialogContent>
      <DialogActions sx={{ p: 2, justifyContent: 'space-between' }}>
        <Button 
          onClick={() => payment && onDownload(payment)}
          startIcon={<DownloadIcon />}
          sx={{ color: '#15e420' }}
        >
          Download
        </Button>
        <Button onClick={onClose} variant="outlined">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ReceiptModal;