// src/components/dashboard/PrintButton.js
import React from 'react';
import { Button } from '@mui/material';

const PrintButton = ({ onClick, label = 'Print Certificate', variant = 'contained', color = 'primary', ...props }) => {
  const handlePrint = () => {
    // Dispatch print event
    const event = new CustomEvent('printCertificate');
    document.dispatchEvent(event);
    
    if (onClick) onClick();
  };

  return (
    <Button
      variant={variant}
      onClick={handlePrint}
      startIcon={<span className="material-icons">print</span>}
      sx={{
        backgroundColor: variant === 'contained' ? '#15e420' : undefined,
        '&:hover': {
          backgroundColor: variant === 'contained' ? '#0fb815' : undefined,
        },
        textTransform: 'none',
        borderRadius: '8px',
        padding: '10px 24px',
        ...props.sx
      }}
      {...props}
    >
      {label}
    </Button>
  );
};

export default PrintButton;