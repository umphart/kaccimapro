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
  CircularProgress
} from '@mui/material';
import { Upload as UploadIcon } from '@mui/icons-material';
import { supabase } from '../supabaseClient';

const ReuploadDialog = ({ open, onClose, notification, organization, onSuccess }) => {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);

  // Extract document field from notification message
  const getDocumentField = () => {
    const message = notification?.message || '';
    const documentFields = {
      'Cover Letter': 'cover_letter_path',
      'Memorandum': 'memorandum_path',
      'Registration Certificate': 'registration_cert_path',
      'Incorporation Certificate': 'incorporation_cert_path',
      'Premises Certificate': 'premises_cert_path',
      'Company Logo': 'company_logo_path',
      'Form C07': 'form_c07_path',
      'ID Document': 'id_document_path'
    };

    for (const [docName, field] of Object.entries(documentFields)) {
      if (message.includes(docName)) {
        return field;
      }
    }
    return null;
  };

  // Determine which bucket to use based on document type
  const getBucketName = (documentField) => {
    // Use 'logos' bucket for company logo, 'documents' bucket for everything else
    return documentField === 'company_logo_path' ? 'logos' : 'documents';
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedFile(file);
      setError('');
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError('Please select a file to upload');
      return;
    }

    setUploading(true);
    setError('');

    try {
      const documentField = getDocumentField();
      if (!documentField) {
        throw new Error('Could not determine document type');
      }

      // Get the appropriate bucket name
      const bucketName = getBucketName(documentField);
      console.log('Using bucket:', bucketName);

      // Upload file to storage
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${organization.id}/${documentField}_${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from(bucketName)
        .upload(fileName, selectedFile, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('Upload error details:', uploadError);
        throw new Error(`Upload failed: ${uploadError.message}`);
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from(bucketName)
        .getPublicUrl(fileName);

      console.log('File uploaded successfully, URL:', publicUrl);

      // Update organization record with new document path
      const { error: updateError } = await supabase
        .from('organizations')
        .update({ 
          [documentField]: publicUrl,
          status: 'pending' // Set back to pending for review
        })
        .eq('id', organization.id);

      if (updateError) throw updateError;

      // Create notification for admin about re-upload
      await supabase
        .from('organization_notifications')
        .insert([{
          organization_id: organization.id,
          type: 'document',
          title: 'Document Re-uploaded',
          message: `${notification.title} has been re-uploaded and is pending review.`,
          category: 'document',
          for_admin: true,
          read: false
        }]);

      // Create notification for user
      await supabase
        .from('organization_notifications')
        .insert([{
          organization_id: organization.id,
          type: 'document',
          title: 'Document Re-uploaded Successfully',
          message: `Your ${notification.title} has been re-uploaded and is now pending review.`,
          category: 'document',
          action_url: '/documents',
          read: false
        }]);

      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error uploading document:', error);
      setError(error.message);
    } finally {
      setUploading(false);
    }
  };

  if (!notification) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontFamily: '"Poppins", sans-serif', fontWeight: 600 }}>
        Re-upload Document
      </DialogTitle>
      <DialogContent>
        <Box sx={{ mb: 3 }}>
          <Typography variant="body1" gutterBottom>
            <strong>Document:</strong> {notification.title}
          </Typography>
          <Typography variant="body2" color="textSecondary" paragraph>
            {notification.message}
          </Typography>
          <Alert severity="info" sx={{ mb: 2 }}>
            Please upload a corrected version of this document for re-review.
          </Alert>
        </Box>

        <Box
          sx={{
            border: '2px dashed #ccc',
            borderRadius: '8px',
            p: 3,
            textAlign: 'center',
            cursor: 'pointer',
            '&:hover': {
              borderColor: '#15e420'
            }
          }}
          onClick={() => document.getElementById('file-input').click()}
        >
          <input
            type="file"
            id="file-input"
            style={{ display: 'none' }}
            onChange={handleFileSelect}
            accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
          />
          <UploadIcon sx={{ fontSize: 48, color: '#15e420', mb: 1 }} />
          <Typography variant="body1">
            {selectedFile ? selectedFile.name : 'Click to select file'}
          </Typography>
          <Typography variant="caption" color="textSecondary">
            Supported formats: PDF, JPG, PNG, DOC, DOCX
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}
      </DialogContent>
      <DialogActions sx={{ p: 3 }}>
        <Button onClick={onClose} disabled={uploading}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleUpload}
          disabled={!selectedFile || uploading}
          sx={{
            backgroundColor: '#15e420',
            '&:hover': {
              backgroundColor: '#12c21e'
            }
          }}
        >
          {uploading ? <CircularProgress size={24} /> : 'Upload & Re-submit'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ReuploadDialog;