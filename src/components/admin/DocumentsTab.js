import React from 'react';
import {
  Grid,
  Typography,
  Box,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  IconButton,
  Tooltip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  TextField,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import {
  Description as DescriptionIcon,
  Upload as UploadIcon,
  AttachFile as AttachFileIcon,
  PictureAsPdf as PdfIcon,
  Image as ImageIcon,
  Info as InfoIcon,
  Delete as DeleteIcon,
  Warning as WarningIcon,
  Person as PersonIcon,
} from '@mui/icons-material';

const FormSection = styled(Box)(({ theme }) => ({
  padding: theme.spacing(3),
  marginBottom: theme.spacing(3),
  backgroundColor: '#fafafa',
  borderRadius: '12px',
  border: '1px solid #e0e0e0'
}));

const SectionTitle = styled(Typography)(({ theme }) => ({
  fontWeight: 600,
  fontSize: '1rem',
  color: '#333',
  marginBottom: theme.spacing(2),
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1)
}));

const FileUploadArea = styled(Box)(({ theme }) => ({
  border: '2px dashed #ddd',
  borderRadius: '12px',
  padding: theme.spacing(3),
  textAlign: 'center',
  cursor: 'pointer',
  transition: 'all 0.2s ease',
  '&:hover': {
    borderColor: '#15e420',
    backgroundColor: 'rgba(21, 228, 32, 0.04)'
  },
  ...(theme?.disabled && {
    opacity: 0.5,
    cursor: 'not-allowed',
    '&:hover': {
      borderColor: '#ddd',
      backgroundColor: 'transparent'
    }
  })
}));

const FileItem = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  padding: theme.spacing(1, 2),
  backgroundColor: '#f8f9fa',
  borderRadius: '8px',
  marginBottom: theme.spacing(1),
  '&:hover': {
    backgroundColor: '#f0f0f0'
  }
}));

const getDocumentIcon = (docType) => {
  switch (docType) {
    case 'cover_letter':
    case 'memorandum':
    case 'registration_cert':
    case 'incorporation_cert':
    case 'premises_cert':
    case 'form_c07':
      return <PdfIcon sx={{ color: '#f44336' }} />;
    case 'company_logo':
    case 'nin_document':
      return <ImageIcon sx={{ color: '#4caf50' }} />;
    default:
      return <DescriptionIcon sx={{ color: '#2196f3' }} />;
  }
};

const getDocumentLabel = (docType) => {
  const labels = {
    cover_letter: 'Covering Letter',
    memorandum: 'Memorandum & Articles',
    registration_cert: 'Registration Certificate',
    incorporation_cert: 'Incorporation Certificate',
    premises_cert: 'Business Premises Certificate',
    company_logo: 'Company Logo',
    form_c07: 'Form C07',
    nin_document: 'NIN Document'
  };
  return labels[docType] || docType;
};

const DocumentsTab = ({ 
  formData, 
  formErrors, 
  fileNames, 
  uploadedFiles,
  editingOrg,
  onFileChange,
  onDeleteDocument,
  onFormChange,
  bucketReady = true
}) => {
  return (
    <>
      {!bucketReady && (
        <Alert severity="warning" sx={{ mb: 3, borderRadius: '8px' }}>
          <Typography variant="body2">
            <strong>Storage bucket not available.</strong> You can still save the organization, 
            but documents cannot be uploaded. Please contact your administrator.
          </Typography>
        </Alert>
      )}

      <Alert 
        severity="info" 
        icon={<WarningIcon />}
        sx={{ mb: 3, borderRadius: '8px' }}
      >
        <Typography variant="body2">
          <strong>Documents are optional for now.</strong> You can skip this step and upload documents later.
          Required documents: Covering Letter, Registration Certificate, Incorporation Certificate, 
          Company Logo, and NIN Document.
        </Typography>
      </Alert>

      {/* NIN Section */}
      <FormSection>
        <SectionTitle>
          <PersonIcon sx={{ color: '#15e420' }} />
          National Identification Number (NIN)
        </SectionTitle>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="NIN Number *"
              name="nin"
              value={formData.nin || ''}
              onChange={onFormChange}
              placeholder="Enter 11-digit NIN"
              required
              error={!!formErrors.nin}
              helperText={formErrors.nin || 'Must be exactly 11 digits'}
              size="small"
              inputProps={{
                maxLength: 11,
                pattern: '[0-9]{11}'
              }}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <FileUploadArea disabled={!bucketReady}>
              <input
                type="file"
                name="nin_document"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={onFileChange}
                style={{ display: 'none' }}
                id="nin_document_input"
                disabled={!bucketReady}
              />
              <label htmlFor="nin_document_input" style={{ cursor: bucketReady ? 'pointer' : 'not-allowed', display: 'block' }}>
                <AttachFileIcon sx={{ fontSize: 32, color: bucketReady ? '#15e420' : '#999' }} />
                <Typography variant="body2" sx={{ mt: 1, fontWeight: 500, color: bucketReady ? 'inherit' : '#999' }}>
                  {fileNames.nin_document || 'Upload NIN Document (PDF/JPG/PNG)'}
                </Typography>
                {fileNames.nin_document && (
                  <Chip
                    label={fileNames.nin_document}
                    size="small"
                    sx={{ mt: 1, maxWidth: 200 }}
                  />
                )}
                {formErrors.nin_document && (
                  <Typography variant="caption" color="error">{formErrors.nin_document}</Typography>
                )}
                {!bucketReady && (
                  <Typography variant="caption" color="warning" sx={{ display: 'block', mt: 1 }}>
                    Upload disabled - storage not available
                  </Typography>
                )}
              </label>
            </FileUploadArea>
          </Grid>
        </Grid>
      </FormSection>

      {/* Uploaded Documents */}
      {editingOrg && uploadedFiles.length > 0 && (
        <FormSection>
          <SectionTitle>
            <DescriptionIcon sx={{ color: '#15e420' }} />
            Uploaded Documents
          </SectionTitle>
          <List dense>
            {uploadedFiles.map((doc) => (
              <FileItem key={doc.id}>
                <ListItemIcon>
                  {getDocumentIcon(doc.document_type)}
                </ListItemIcon>
                <ListItemText
                  primary={getDocumentLabel(doc.document_type)}
                  secondary={doc.file_name}
                />
                <ListItemSecondaryAction>
                  <Tooltip title="View">
                    <IconButton
                      size="small"
                      href={doc.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      sx={{ mr: 1 }}
                    >
                      <InfoIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Delete">
                    <IconButton
                      size="small"
                      onClick={() => onDeleteDocument(doc.id, doc.file_path)}
                      sx={{ color: '#dc3545' }}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </ListItemSecondaryAction>
              </FileItem>
            ))}
          </List>
        </FormSection>
      )}

      {/* Document Upload Section */}
      <FormSection>
        <SectionTitle>
          <UploadIcon sx={{ color: '#15e420' }} />
          {editingOrg ? 'Upload New Documents' : 'Upload Required Documents (Optional)'}
        </SectionTitle>
        <Typography variant="caption" sx={{ color: '#666', display: 'block', mb: 2 }}>
          {editingOrg 
            ? 'Upload additional documents. Existing documents will be preserved.' 
            : 'You can skip this step and upload documents later from the organization profile.'}
          <br />
          <strong style={{ color: '#ff9800' }}>Maximum file size: 10MB for PDFs, 5MB for images.</strong>
        </Typography>

        <Grid container spacing={2}>
          {/* Cover Letter */}
          <Grid item xs={12} md={6}>
            <FileUploadArea disabled={!bucketReady}>
              <input
                type="file"
                name="cover_letter"
                accept=".pdf"
                onChange={onFileChange}
                style={{ display: 'none' }}
                id="cover_letter_input"
                disabled={!bucketReady}
              />
              <label htmlFor="cover_letter_input" style={{ cursor: bucketReady ? 'pointer' : 'not-allowed', display: 'block' }}>
                <AttachFileIcon sx={{ fontSize: 32, color: bucketReady ? '#15e420' : '#999' }} />
                <Typography variant="body2" sx={{ mt: 1, fontWeight: 500, color: bucketReady ? 'inherit' : '#999' }}>
                  {fileNames.cover_letter || 'Upload Covering Letter (PDF)'}
                </Typography>
                {fileNames.cover_letter && (
                  <Chip
                    label={fileNames.cover_letter}
                    size="small"
                    sx={{ mt: 1, maxWidth: 200 }}
                  />
                )}
                {formErrors.cover_letter && (
                  <Typography variant="caption" color="error">{formErrors.cover_letter}</Typography>
                )}
                {!bucketReady && (
                  <Typography variant="caption" color="warning" sx={{ display: 'block', mt: 1 }}>
                    Upload disabled - storage not available
                  </Typography>
                )}
              </label>
            </FileUploadArea>
          </Grid>

          {/* Memorandum */}
          <Grid item xs={12} md={6}>
            <FileUploadArea disabled={!bucketReady}>
              <input
                type="file"
                name="memorandum"
                accept=".pdf"
                onChange={onFileChange}
                style={{ display: 'none' }}
                id="memorandum_input"
                disabled={!bucketReady}
              />
              <label htmlFor="memorandum_input" style={{ cursor: bucketReady ? 'pointer' : 'not-allowed', display: 'block' }}>
                <AttachFileIcon sx={{ fontSize: 32, color: bucketReady ? '#15e420' : '#999' }} />
                <Typography variant="body2" sx={{ mt: 1, fontWeight: 500, color: bucketReady ? 'inherit' : '#999' }}>
                  {fileNames.memorandum || 'Upload Memorandum & Articles (PDF)'}
                </Typography>
                {fileNames.memorandum && (
                  <Chip
                    label={fileNames.memorandum}
                    size="small"
                    sx={{ mt: 1, maxWidth: 200 }}
                  />
                )}
                {!bucketReady && (
                  <Typography variant="caption" color="warning" sx={{ display: 'block', mt: 1 }}>
                    Upload disabled - storage not available
                  </Typography>
                )}
              </label>
            </FileUploadArea>
          </Grid>

          {/* Registration Certificate */}
          <Grid item xs={12} md={6}>
            <FileUploadArea disabled={!bucketReady}>
              <input
                type="file"
                name="registration_cert"
                accept=".pdf"
                onChange={onFileChange}
                style={{ display: 'none' }}
                id="registration_cert_input"
                disabled={!bucketReady}
              />
              <label htmlFor="registration_cert_input" style={{ cursor: bucketReady ? 'pointer' : 'not-allowed', display: 'block' }}>
                <AttachFileIcon sx={{ fontSize: 32, color: bucketReady ? '#15e420' : '#999' }} />
                <Typography variant="body2" sx={{ mt: 1, fontWeight: 500, color: bucketReady ? 'inherit' : '#999' }}>
                  {fileNames.registration_cert || 'Upload Registration Certificate (PDF)'}
                </Typography>
                {fileNames.registration_cert && (
                  <Chip
                    label={fileNames.registration_cert}
                    size="small"
                    sx={{ mt: 1, maxWidth: 200 }}
                  />
                )}
                {formErrors.registration_cert && (
                  <Typography variant="caption" color="error">{formErrors.registration_cert}</Typography>
                )}
                {!bucketReady && (
                  <Typography variant="caption" color="warning" sx={{ display: 'block', mt: 1 }}>
                    Upload disabled - storage not available
                  </Typography>
                )}
              </label>
            </FileUploadArea>
          </Grid>

          {/* Incorporation Certificate */}
          <Grid item xs={12} md={6}>
            <FileUploadArea disabled={!bucketReady}>
              <input
                type="file"
                name="incorporation_cert"
                accept=".pdf"
                onChange={onFileChange}
                style={{ display: 'none' }}
                id="incorporation_cert_input"
                disabled={!bucketReady}
              />
              <label htmlFor="incorporation_cert_input" style={{ cursor: bucketReady ? 'pointer' : 'not-allowed', display: 'block' }}>
                <AttachFileIcon sx={{ fontSize: 32, color: bucketReady ? '#15e420' : '#999' }} />
                <Typography variant="body2" sx={{ mt: 1, fontWeight: 500, color: bucketReady ? 'inherit' : '#999' }}>
                  {fileNames.incorporation_cert || 'Upload Incorporation Certificate (PDF)'}
                </Typography>
                {fileNames.incorporation_cert && (
                  <Chip
                    label={fileNames.incorporation_cert}
                    size="small"
                    sx={{ mt: 1, maxWidth: 200 }}
                  />
                )}
                {formErrors.incorporation_cert && (
                  <Typography variant="caption" color="error">{formErrors.incorporation_cert}</Typography>
                )}
                {!bucketReady && (
                  <Typography variant="caption" color="warning" sx={{ display: 'block', mt: 1 }}>
                    Upload disabled - storage not available
                  </Typography>
                )}
              </label>
            </FileUploadArea>
          </Grid>

          {/* Business Premises Certificate */}
          <Grid item xs={12} md={6}>
            <FileUploadArea disabled={!bucketReady}>
              <input
                type="file"
                name="premises_cert"
                accept=".pdf"
                onChange={onFileChange}
                style={{ display: 'none' }}
                id="premises_cert_input"
                disabled={!bucketReady}
              />
              <label htmlFor="premises_cert_input" style={{ cursor: bucketReady ? 'pointer' : 'not-allowed', display: 'block' }}>
                <AttachFileIcon sx={{ fontSize: 32, color: bucketReady ? '#15e420' : '#999' }} />
                <Typography variant="body2" sx={{ mt: 1, fontWeight: 500, color: bucketReady ? 'inherit' : '#999' }}>
                  {fileNames.premises_cert || 'Upload Business Premises Certificate (PDF)'}
                </Typography>
                {fileNames.premises_cert && (
                  <Chip
                    label={fileNames.premises_cert}
                    size="small"
                    sx={{ mt: 1, maxWidth: 200 }}
                  />
                )}
                {!bucketReady && (
                  <Typography variant="caption" color="warning" sx={{ display: 'block', mt: 1 }}>
                    Upload disabled - storage not available
                  </Typography>
                )}
              </label>
            </FileUploadArea>
          </Grid>

          {/* Company Logo */}
          <Grid item xs={12} md={6}>
            <FileUploadArea disabled={!bucketReady}>
              <input
                type="file"
                name="company_logo"
                accept=".jpg,.jpeg,.png"
                onChange={onFileChange}
                style={{ display: 'none' }}
                id="company_logo_input"
                disabled={!bucketReady}
              />
              <label htmlFor="company_logo_input" style={{ cursor: bucketReady ? 'pointer' : 'not-allowed', display: 'block' }}>
                <AttachFileIcon sx={{ fontSize: 32, color: bucketReady ? '#15e420' : '#999' }} />
                <Typography variant="body2" sx={{ mt: 1, fontWeight: 500, color: bucketReady ? 'inherit' : '#999' }}>
                  {fileNames.company_logo || 'Upload Company Logo (JPG/PNG)'}
                </Typography>
                {fileNames.company_logo && (
                  <Chip
                    label={fileNames.company_logo}
                    size="small"
                    sx={{ mt: 1, maxWidth: 200 }}
                  />
                )}
                {formErrors.company_logo && (
                  <Typography variant="caption" color="error">{formErrors.company_logo}</Typography>
                )}
                {!bucketReady && (
                  <Typography variant="caption" color="warning" sx={{ display: 'block', mt: 1 }}>
                    Upload disabled - storage not available
                  </Typography>
                )}
              </label>
            </FileUploadArea>
          </Grid>

          {/* Form C07 */}
          <Grid item xs={12} md={6}>
            <FileUploadArea disabled={!bucketReady}>
              <input
                type="file"
                name="form_c07"
                accept=".pdf"
                onChange={onFileChange}
                style={{ display: 'none' }}
                id="form_c07_input"
                disabled={!bucketReady}
              />
              <label htmlFor="form_c07_input" style={{ cursor: bucketReady ? 'pointer' : 'not-allowed', display: 'block' }}>
                <AttachFileIcon sx={{ fontSize: 32, color: bucketReady ? '#15e420' : '#999' }} />
                <Typography variant="body2" sx={{ mt: 1, fontWeight: 500, color: bucketReady ? 'inherit' : '#999' }}>
                  {fileNames.form_c07 || 'Upload Form C07 (PDF)'}
                </Typography>
                {fileNames.form_c07 && (
                  <Chip
                    label={fileNames.form_c07}
                    size="small"
                    sx={{ mt: 1, maxWidth: 200 }}
                  />
                )}
                {!bucketReady && (
                  <Typography variant="caption" color="warning" sx={{ display: 'block', mt: 1 }}>
                    Upload disabled - storage not available
                  </Typography>
                )}
              </label>
            </FileUploadArea>
          </Grid>
        </Grid>
      </FormSection>
    </>
  );
};

export default DocumentsTab;