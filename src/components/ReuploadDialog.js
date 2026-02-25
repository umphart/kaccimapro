import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Alert,
  LinearProgress,
  Paper
} from '@mui/material';
import { CloudUpload as UploadIcon, Warning as WarningIcon } from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { supabase } from '../supabaseClient';
import { documentFields } from './organizationConstants';

const UploadArea = styled(Paper)(({ theme }) => ({
  border: '2px dashed #ccc',
  backgroundColor: '#fafafa',
  padding: theme.spacing(3),
  textAlign: 'center',
  cursor: 'pointer',
  transition: 'all 0.3s',
  '&:hover': {
    borderColor: '#15e420',
    backgroundColor: '#e8f5e9'
  }
}));

const HiddenInput = styled('input')({
  display: 'none'
});

const ReuploadDialog = ({ open, onClose, notification, organization, onSuccess }) => {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Find document configuration based on notification
  const getDocumentConfig = () => {
    const title = notification?.title || '';
    const message = notification?.message || '';
    
    for (const field of documentFields) {
      if (title.includes(field.name) || message.includes(field.name)) {
        return field;
      }
    }
    return null;
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Validate file size (10MB max)
      if (file.size > 10 * 1024 * 1024) {
        setError('File size must be less than 10MB');
        return;
      }

      // Validate file type
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
      if (!allowedTypes.includes(file.type)) {
        setError('Please upload PDF or image files only');
        return;
      }

      setSelectedFile(file);
      setError('');
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError('Please select a file to upload');
      return;
    }

    const docConfig = getDocumentConfig();
    if (!docConfig) {
      setError('Could not determine document type');
      return;
    }

    setUploading(true);
    setError('');
    setUploadProgress(0);

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 300);

      // Generate unique filename
      const fileExt = selectedFile.name.split('.').pop();
      const timestamp = Date.now();
      const fileName = `${organization.id}/${docConfig.key}_${timestamp}.${fileExt}`;

      // Upload file to storage
      const { error: uploadError } = await supabase.storage
        .from(docConfig.bucket)
        .upload(fileName, selectedFile, {
          cacheControl: '3600',
          upsert: true
        });

      clearInterval(progressInterval);
      
      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw new Error(`Upload failed: ${uploadError.message}`);
      }

      setUploadProgress(100);

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from(docConfig.bucket)
        .getPublicUrl(fileName);

      // First, clear the rejection reason for this document
      const rejectionField = `${docConfig.key.replace('_path', '_rejection_reason')}`;
      
      // Update organization record
      const { error: updateError } = await supabase
        .from('organizations')
        .update({ 
          [docConfig.key]: publicUrl,
          [rejectionField]: null, // Clear rejection reason
          status: 'pending', // Reset to pending for re-review
          re_upload_count: (organization?.re_upload_count || 0) + 1,
          last_re_upload_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', organization.id);

      if (updateError) throw updateError;

      // Mark old rejection notifications as read
      await supabase
        .from('organization_notifications')
        .update({ read: true })
        .eq('organization_id', organization.id)
        .eq('type', 'document_rejected')
        .ilike('title', `%${docConfig.name}%`);

      // Create notification for admin about re-upload (without for_admin field if it doesn't exist)
      try {
        // First try with for_admin field
        const { error: adminNotifError } = await supabase
          .from('organization_notifications')
          .insert([{
            organization_id: organization.id,
            type: 'document_reuploaded',
            title: `Document Re-uploaded: ${docConfig.name}`,
            message: `${organization.company_name} has re-uploaded ${docConfig.name} for review.`,
            category: 'document',
            for_admin: true,
            read: false,
            action_url: `/admin/organizations/${organization.id}`,
            created_at: new Date().toISOString()
          }]);

        if (adminNotifError && adminNotifError.message.includes('for_admin')) {
          // If for_admin column doesn't exist, try without it
          console.log('for_admin column not found, inserting without it');
          await supabase
            .from('organization_notifications')
            .insert([{
              organization_id: organization.id,
              type: 'document_reuploaded',
              title: `Document Re-uploaded: ${docConfig.name}`,
              message: `${organization.company_name} has re-uploaded ${docConfig.name} for review.`,
              category: 'document',
              read: false,
              action_url: `/admin/organizations/${organization.id}`,
              created_at: new Date().toISOString()
            }]);
        }
      } catch (notifError) {
        console.error('Error creating admin notification:', notifError);
        // Continue even if notification fails
      }

      // Create notification for user confirming re-upload
      await supabase
        .from('organization_notifications')
        .insert([{
          organization_id: organization.id,
          type: 'document_reuploaded',
          title: 'Document Re-uploaded Successfully',
          message: `Your ${docConfig.name} has been re-uploaded and is pending admin review.`,
          category: 'document',
          read: false,
          action_url: '/documents',
          created_at: new Date().toISOString()
        }]);

      setTimeout(() => {
        onSuccess(docConfig.key, docConfig.name);
        onClose();
      }, 500);

    } catch (error) {
      console.error('Error uploading document:', error);
      setError(error.message);
      setUploadProgress(0);
    } finally {
      setUploading(false);
    }
  };

  if (!notification) return null;

  const docConfig = getDocumentConfig();

  return (
    <Dialog 
      open={open} 
      onClose={() => !uploading && onClose()} 
      maxWidth="sm" 
      fullWidth
      PaperProps={{
        sx: { borderRadius: '16px' }
      }}
    >
      <DialogTitle sx={{ 
        fontFamily: '"Poppins", sans-serif', 
        fontWeight: 600,
        borderBottom: '1px solid #e0e0e0',
        pb: 2
      }}>
        Re-upload Rejected Document
      </DialogTitle>
      
      <DialogContent sx={{ pt: 3 }}>
        {docConfig && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="body1" gutterBottom>
              <strong>Document:</strong> {docConfig.name}
            </Typography>
            <Typography variant="body2" color="textSecondary" paragraph>
              {notification.message}
            </Typography>
            
            <Alert 
              severity="warning" 
              icon={<WarningIcon />}
              sx={{ mb: 3 }}
            >
              Please upload a corrected version of this document. 
              The file will be reviewed again by an administrator.
            </Alert>
          </Box>
        )}

        <HiddenInput
          accept=".pdf,.jpg,.jpeg,.png"
          id="reupload-file-input"
          type="file"
          onChange={handleFileSelect}
          disabled={uploading}
        />
        
        <UploadArea 
          onClick={() => !uploading && document.getElementById('reupload-file-input').click()}
          sx={{ 
            opacity: uploading ? 0.6 : 1,
            cursor: uploading ? 'default' : 'pointer'
          }}
        >
          <UploadIcon sx={{ fontSize: 48, color: '#15e420', mb: 2 }} />
          <Typography variant="body1" sx={{ mb: 1 }}>
            {selectedFile ? selectedFile.name : 'Click to select a file'}
          </Typography>
          <Typography variant="caption" sx={{ color: '#666' }}>
            Supported formats: PDF, PNG, JPG, JPEG (Max: 10MB)
          </Typography>
        </UploadArea>

        {selectedFile && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="caption" color="textSecondary">
              File size: {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
            </Typography>
          </Box>
        )}

        {uploading && (
          <Box sx={{ width: '100%', mt: 3 }}>
            <LinearProgress 
              variant="determinate" 
              value={uploadProgress} 
              sx={{ 
                mb: 1,
                '& .MuiLinearProgress-bar': {
                  backgroundColor: '#15e420'
                }
              }} 
            />
            <Typography variant="caption" sx={{ color: '#666' }}>
              {uploadProgress}% uploaded
            </Typography>
          </Box>
        )}

        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 3, pt: 2 }}>
        <Button 
          onClick={onClose} 
          disabled={uploading}
          sx={{ color: '#666' }}
        >
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleUpload}
          disabled={!selectedFile || uploading}
          sx={{
            bgcolor: '#15e420',
            '&:hover': {
              bgcolor: '#12c21e'
            },
            '&.Mui-disabled': {
              bgcolor: '#ccc'
            }
          }}
        >
          {uploading ? 'Uploading...' : 'Upload & Re-submit'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ReuploadDialog;