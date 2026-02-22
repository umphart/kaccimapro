import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Box,
  Typography,
  Button
} from '@mui/material';
import {
  Close as CloseIcon,
  Download as DownloadIcon
} from '@mui/icons-material';

const DocumentViewerDialog = ({ open, onClose, document, documentUrl, companyName, onDownload }) => {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        fontFamily: '"Poppins", sans-serif'
      }}>
        {document?.name} - {companyName}
        <IconButton onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers>
        <Box sx={{ position: 'relative', minHeight: 600 }}>
          <Box
            sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              opacity: 0.1,
              pointerEvents: 'none',
              zIndex: 0
            }}
          >
            <img src="/static/logo.png" alt="Watermark" width={200} />
          </Box>
          {documentUrl ? (
            document?.key === 'company_logo_path' ? (
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center', 
                height: 600,
                position: 'relative',
                zIndex: 1
              }}>
                <img 
                  src={documentUrl} 
                  alt={document.name}
                  style={{ 
                    maxWidth: '100%', 
                    maxHeight: '100%', 
                    objectFit: 'contain' 
                  }} 
                />
              </Box>
            ) : (
              <iframe
                src={documentUrl}
                title={document.name}
                width="100%"
                height="600px"
                style={{ border: 'none', position: 'relative', zIndex: 1 }}
              />
            )
          ) : (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 600 }}>
              <Typography>Loading document...</Typography>
            </Box>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button 
          onClick={() => onDownload(document)}
          startIcon={<DownloadIcon />}
          sx={{ color: '#15e420' }}
        >
          Download
        </Button>
        <Button onClick={onClose}>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DocumentViewerDialog;