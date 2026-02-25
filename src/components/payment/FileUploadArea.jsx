import React, { useRef } from 'react';
import { motion } from 'framer-motion';
import { Box, Typography } from '@mui/material';
import { CloudUpload as CloudUploadIcon, CheckCircle as CheckCircleIcon } from '@mui/icons-material';

const FileUploadArea = ({ fileName, filePreview, onFileChange }) => {
  const fileInputRef = useRef(null);

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    onFileChange(file);
  };

  return (
    <Box sx={{ mb: 3 }}>
      <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
        <CloudUploadIcon sx={{ color: '#15e420' }} />
        Upload Payment Receipt
      </Typography>
      
      <Typography variant="body2" sx={{ color: '#666', mb: 2 }}>
        After making the transfer, upload your payment receipt here.
        <br />
        <small>Accepted formats: JPG, PNG, PDF (Max size: 5MB)</small>
      </Typography>
      
      <motion.div
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={handleClick}
        style={{
          border: '2px dashed #ccc',
          borderRadius: '16px',
          padding: '2rem',
          textAlign: 'center',
          background: '#fafafa',
          cursor: 'pointer',
          transition: 'all 0.3s ease'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = '#15e420';
          e.currentTarget.style.background = '#e8f5e9';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = '#ccc';
          e.currentTarget.style.background = '#fafafa';
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".jpg,.jpeg,.png,.pdf"
          onChange={handleFileChange}
          style={{ display: 'none' }}
        />
        
        {fileName ? (
          <Box>
            <CheckCircleIcon sx={{ fontSize: 48, color: '#15e420', mb: 1 }} />
            <Typography variant="body1" sx={{ fontWeight: 600, color: '#15e420' }}>
              {fileName}
            </Typography>
            <Typography variant="caption" sx={{ color: '#666' }}>
              Click to change file
            </Typography>
            
            {filePreview && (
              <Box sx={{ mt: 2, maxWidth: '200px', mx: 'auto' }}>
                <img src={filePreview} alt="Preview" style={{ maxWidth: '100%', borderRadius: '8px' }} />
              </Box>
            )}
          </Box>
        ) : (
          <Box>
            <CloudUploadIcon sx={{ fontSize: 48, color: '#15e420', mb: 1 }} />
            <Typography variant="body1" sx={{ fontWeight: 500, mb: 1 }}>
              Click to select file
            </Typography>
            <Typography variant="caption" sx={{ color: '#999' }}>
              or drag and drop
            </Typography>
          </Box>
        )}
      </motion.div>
    </Box>
  );
};

export default FileUploadArea;