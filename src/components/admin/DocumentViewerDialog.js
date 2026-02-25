import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Button,
  Box,
  IconButton,
  Typography,
  CircularProgress,
  Alert
} from '@mui/material';
import {
  Close as CloseIcon,
  Download as DownloadIcon,
  PictureAsPdf as PdfIcon,
  Image as ImageIcon,
  Error as ErrorIcon,
  Description as DescriptionIcon
} from '@mui/icons-material';
import { supabase } from '../../supabaseClient';

const DocumentViewerDialog = ({ 
  open, 
  onClose, 
  document, 
  documentUrl, 
  companyName,
  onDownload 
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewerUrl, setViewerUrl] = useState(null);

  useEffect(() => {
    if (open && document) {
      loadDocument();
    }
    
    return () => {
      if (viewerUrl && !viewerUrl.startsWith('http')) {
        URL.revokeObjectURL(viewerUrl);
      }
    };
  }, [open, document]);

  const getDocumentUrl = () => {
    // If documentUrl is provided directly
    if (documentUrl) {
      return documentUrl;
    }

    // If we have fullUrl from the document object
    if (document.fullUrl) {
      return document.fullUrl;
    }

    // If it's already a full URL
    if (document.path?.startsWith('http')) {
      return document.path;
    }

    // If we have bucket and path, construct the public URL
    if (document.bucket && document.path) {
      const { data } = supabase.storage
        .from(document.bucket)
        .getPublicUrl(document.path);
      
      if (data?.publicUrl) {
        return data.publicUrl;
      }
    }

    return null;
  };

  const loadDocument = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('Loading document details:', {
        name: document.name,
        bucket: document.bucket,
        path: document.path,
        hasFullUrl: !!document.fullUrl
      });

      const url = getDocumentUrl();
      
      if (!url) {
        throw new Error('Could not generate document URL');
      }

      console.log('Using URL:', url);
      
      // Test if the URL is accessible
      try {
        const response = await fetch(url, { method: 'HEAD' });
        if (!response.ok) {
          throw new Error(`Document not accessible (${response.status})`);
        }
      } catch (fetchError) {
        console.warn('URL test failed, but will try to load anyway:', fetchError);
      }

      setViewerUrl(url);
      
    } catch (err) {
      console.error('Error loading document:', err);
      setError(err.message || 'Failed to load document');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (viewerUrl && !viewerUrl.startsWith('http')) {
      URL.revokeObjectURL(viewerUrl);
    }
    setViewerUrl(null);
    setError(null);
    onClose();
  };

  const handleDownload = () => {
    if (onDownload) {
      onDownload(document);
    } else if (viewerUrl) {
      const link = document.createElement('a');
      link.href = viewerUrl;
      link.download = document.name || 'document';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const getFileIcon = () => {
    const ext = document?.path?.split('.').pop()?.toLowerCase();
    if (ext === 'pdf') return <PdfIcon sx={{ fontSize: 48, color: '#dc3545' }} />;
    if (['jpg', 'jpeg', 'png', 'gif'].includes(ext)) return <ImageIcon sx={{ fontSize: 48, color: '#15e420' }} />;
    return <DescriptionIcon sx={{ fontSize: 48, color: '#17a2b8' }} />;
  };

  const isPdf = document?.path?.toLowerCase().endsWith('.pdf');
  const isImage = ['jpg', 'jpeg', 'png', 'gif'].some(ext => 
    document?.path?.toLowerCase().endsWith(ext)
  );

  if (!document) return null;

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: {
          height: '90vh',
          borderRadius: '16px',
          overflow: 'hidden'
        }
      }}
    >
      <DialogTitle sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        borderBottom: '1px solid #e0e0e0',
        py: 2,
        px: 3
      }}>
        <Box sx={{ overflow: 'hidden' }}>
          <Typography variant="h6" sx={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {document?.name || 'Document Viewer'}
          </Typography>
          {companyName && (
            <Typography variant="caption" color="textSecondary">
              {companyName}
            </Typography>
          )}
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <IconButton 
            onClick={handleDownload} 
            sx={{ 
              color: '#15e420',
              '&:hover': {
                bgcolor: 'rgba(21, 228, 32, 0.1)'
              }
            }}
          >
            <DownloadIcon />
          </IconButton>
          <IconButton 
            onClick={handleClose}
            sx={{ 
              color: '#666',
              '&:hover': {
                bgcolor: 'rgba(0, 0, 0, 0.05)'
              }
            }}
          >
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ p: 0, bgcolor: '#f5f5f5', height: 'calc(100% - 73px)' }}>
        {loading && (
          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column',
            justifyContent: 'center', 
            alignItems: 'center', 
            height: '100%',
            gap: 2
          }}>
            <CircularProgress sx={{ color: '#15e420' }} />
            <Typography color="textSecondary">Loading document...</Typography>
          </Box>
        )}

        {error && (
          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column',
            justifyContent: 'center', 
            alignItems: 'center', 
            height: '100%',
            gap: 2,
            p: 3
          }}>
            <ErrorIcon sx={{ fontSize: 64, color: '#dc3545' }} />
            <Alert severity="error" sx={{ maxWidth: 500 }}>
              {error}
            </Alert>
            <Button 
              variant="outlined" 
              onClick={loadDocument}
              sx={{ 
                mt: 2,
                borderColor: '#15e420',
                color: '#15e420',
                '&:hover': {
                  borderColor: '#12c21e',
                  bgcolor: 'rgba(21, 228, 32, 0.1)'
                }
              }}
            >
              Try Again
            </Button>
          </Box>
        )}

        {viewerUrl && !loading && !error && (
          <Box sx={{ height: '100%', bgcolor: '#fff' }}>
            {isPdf ? (
              <iframe
                src={`${viewerUrl}#toolbar=0`}
                width="100%"
                height="100%"
                style={{ border: 'none' }}
                title={document?.name}
              />
            ) : isImage ? (
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center', 
                height: '100%',
                p: 2,
                bgcolor: '#fafafa'
              }}>
                <img 
                  src={viewerUrl} 
                  alt={document?.name}
                  style={{ 
                    maxWidth: '100%', 
                    maxHeight: '100%', 
                    objectFit: 'contain' 
                  }} 
                />
              </Box>
            ) : (
              <Box sx={{ 
                display: 'flex', 
                flexDirection: 'column',
                justifyContent: 'center', 
                alignItems: 'center', 
                height: '100%',
                gap: 2,
                p: 3
              }}>
                {getFileIcon()}
                <Typography variant="h6" sx={{ color: '#666', textAlign: 'center' }}>
                  Cannot preview this file type
                </Typography>
                <Typography variant="body2" color="textSecondary" sx={{ mb: 2, textAlign: 'center' }}>
                  This file format cannot be previewed directly. Please download to view.
                </Typography>
                <Button
                  variant="contained"
                  onClick={handleDownload}
                  sx={{ 
                    bgcolor: '#15e420',
                    '&:hover': {
                      bgcolor: '#12c21e'
                    }
                  }}
                >
                  Download to View
                </Button>
              </Box>
            )}
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default DocumentViewerDialog;