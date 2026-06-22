import React from 'react';
import {
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  IconButton,
  Chip,
  Button,
  Grid,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Paper,
  Tooltip,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Cancel as CancelIcon,
  Business as BusinessIcon,
  LocationOn as LocationOnIcon,
  Person as PersonIcon,
  People as PeopleIcon,
  ContactMail as ContactMailIcon,
  Description as DescriptionIcon,
  PictureAsPdf as PdfIcon,
  Image as ImageIcon,
  Warning as WarningIcon,
  Visibility as VisibilityIcon,
  Download as DownloadIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { documentFields } from './organizationConstants';

const DetailRow = styled(Box)(({ theme }) => ({
  display: 'flex',
  padding: theme.spacing(1, 0),
  borderBottom: '1px solid #f0f0f0',
  '&:last-child': {
    borderBottom: 'none'
  }
}));

const DetailLabel = styled(Typography)(({ theme }) => ({
  fontWeight: 600,
  color: '#666',
  minWidth: '140px',
  fontSize: '0.85rem'
}));

const DetailValue = styled(Typography)(({ theme }) => ({
  color: '#333',
  fontSize: '0.85rem',
  flex: 1
}));

const DocumentCard = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2),
  marginBottom: theme.spacing(1),
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  borderRadius: '8px',
  border: '1px solid #e0e0e0',
  backgroundColor: '#fafafa',
  '&:hover': {
    backgroundColor: '#f5f5f5',
    borderColor: '#15e420'
  }
}));

const getDocumentIcon = (docType) => {
  const pdfTypes = ['cover_letter', 'memorandum', 'registration_cert', 'incorporation_cert', 'premises_cert', 'form_c07'];
  if (pdfTypes.includes(docType)) {
    return <PdfIcon sx={{ color: '#f44336' }} />;
  }
  return <ImageIcon sx={{ color: '#4caf50' }} />;
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
    id_document: 'ID Document'
  };
  return labels[docType] || docType;
};

const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString('en-NG', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

const OrganizationDetailsDialog = ({ open, onClose, organization, navigate }) => {
  if (!organization) return null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{ sx: { borderRadius: '16px', maxHeight: '90vh' } }}
    >
      <DialogTitle sx={{ bgcolor: '#f8f9fa', borderBottom: '1px solid #e0e0e0' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              {organization.company_name}
            </Typography>
            <Typography variant="caption" sx={{ color: '#666' }}>
              Registration: {organization.registration_number}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Chip 
              label={organization.status?.toUpperCase() || 'ACTIVE'} 
              size="small"
              sx={{ 
                backgroundColor: organization.status === 'active' || organization.status === 'approved' ? '#e8f5e9' : '#fff3e0',
                color: organization.status === 'active' || organization.status === 'approved' ? '#2e7d32' : '#e65100',
                fontWeight: 600,
                height: '24px',
                fontSize: '0.7rem'
              }}
            />
            <IconButton onClick={onClose} size="small">
              <CancelIcon />
            </IconButton>
          </Box>
        </Box>
      </DialogTitle>
      
      <DialogContent sx={{ p: 0 }}>
        <Box sx={{ p: 3 }}>
          {/* Basic Information */}
          <Accordion defaultExpanded>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
                <BusinessIcon sx={{ color: '#15e420' }} /> Company Information
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <DetailRow>
                    <DetailLabel>Company Name</DetailLabel>
                    <DetailValue>{organization.company_name}</DetailValue>
                  </DetailRow>
                </Grid>
                <Grid item xs={12} md={6}>
                  <DetailRow>
                    <DetailLabel>Registration Number</DetailLabel>
                    <DetailValue>{organization.registration_number}</DetailValue>
                  </DetailRow>
                </Grid>
                <Grid item xs={12} md={6}>
                  <DetailRow>
                    <DetailLabel>CAC Number</DetailLabel>
                    <DetailValue>{organization.cac_number || 'N/A'}</DetailValue>
                  </DetailRow>
                </Grid>
                <Grid item xs={12} md={6}>
                  <DetailRow>
                    <DetailLabel>Registration Date</DetailLabel>
                    <DetailValue>{formatDate(organization.registration_date)}</DetailValue>
                  </DetailRow>
                </Grid>
                <Grid item xs={12}>
                  <DetailRow>
                    <DetailLabel>Business Nature</DetailLabel>
                    <DetailValue>
                      {(() => {
                        let nature = organization.business_nature || [];
                        if (typeof nature === 'string') {
                          try { nature = JSON.parse(nature); } catch (e) { nature = []; }
                        }
                        return Array.isArray(nature) ? nature.join(', ') : 'N/A';
                      })()}
                    </DetailValue>
                  </DetailRow>
                </Grid>
                <Grid item xs={12}>
                  <DetailRow>
                    <DetailLabel>ID Type</DetailLabel>
                    <DetailValue>{organization.id_type || 'N/A'}</DetailValue>
                  </DetailRow>
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>

          {/* Address Information */}
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
                <LocationOnIcon sx={{ color: '#15e420' }} /> Address Information
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <DetailRow>
                    <DetailLabel>House Number</DetailLabel>
                    <DetailValue>{organization.house_number || 'N/A'}</DetailValue>
                  </DetailRow>
                </Grid>
                <Grid item xs={12} md={6}>
                  <DetailRow>
                    <DetailLabel>Street</DetailLabel>
                    <DetailValue>{organization.street || 'N/A'}</DetailValue>
                  </DetailRow>
                </Grid>
                <Grid item xs={12} md={6}>
                  <DetailRow>
                    <DetailLabel>LGA</DetailLabel>
                    <DetailValue>{organization.lga || 'N/A'}</DetailValue>
                  </DetailRow>
                </Grid>
                <Grid item xs={12} md={6}>
                  <DetailRow>
                    <DetailLabel>State</DetailLabel>
                    <DetailValue>{organization.state || 'N/A'}</DetailValue>
                  </DetailRow>
                </Grid>
                <Grid item xs={12}>
                  <DetailRow>
                    <DetailLabel>Landmark</DetailLabel>
                    <DetailValue>{organization.landmark || 'N/A'}</DetailValue>
                  </DetailRow>
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>

          {/* Contact Information */}
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
                <PersonIcon sx={{ color: '#15e420' }} /> Contact Information
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <DetailRow>
                    <DetailLabel>Contact Person</DetailLabel>
                    <DetailValue>{organization.contact_person || 'N/A'}</DetailValue>
                  </DetailRow>
                </Grid>
                <Grid item xs={12} md={6}>
                  <DetailRow>
                    <DetailLabel>Representative</DetailLabel>
                    <DetailValue>{organization.representative || 'N/A'}</DetailValue>
                  </DetailRow>
                </Grid>
                <Grid item xs={12} md={6}>
                  <DetailRow>
                    <DetailLabel><PhoneIcon fontSize="small" sx={{ mr: 0.5 }} /> Phone 1</DetailLabel>
                    <DetailValue>{organization.phone_number1 || 'N/A'}</DetailValue>
                  </DetailRow>
                </Grid>
                <Grid item xs={12} md={6}>
                  <DetailRow>
                    <DetailLabel><PhoneIcon fontSize="small" sx={{ mr: 0.5 }} /> Phone 2</DetailLabel>
                    <DetailValue>{organization.phone_number2 || 'N/A'}</DetailValue>
                  </DetailRow>
                </Grid>
                <Grid item xs={12}>
                  <DetailRow>
                    <DetailLabel><EmailIcon fontSize="small" sx={{ mr: 0.5 }} /> Email</DetailLabel>
                    <DetailValue>{organization.email || 'N/A'}</DetailValue>
                  </DetailRow>
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>

          {/* Staff Information */}
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
                <PeopleIcon sx={{ color: '#15e420' }} /> Staff Information
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={2}>
                <Grid item xs={6} md={3}>
                  <DetailRow>
                    <DetailLabel>Nigerian Directors</DetailLabel>
                    <DetailValue>{organization.nigerian_directors || 0}</DetailValue>
                  </DetailRow>
                </Grid>
                <Grid item xs={6} md={3}>
                  <DetailRow>
                    <DetailLabel>Non-Nigerian Directors</DetailLabel>
                    <DetailValue>{organization.non_nigerian_directors || 0}</DetailValue>
                  </DetailRow>
                </Grid>
                <Grid item xs={6} md={3}>
                  <DetailRow>
                    <DetailLabel>Nigerian Employees</DetailLabel>
                    <DetailValue>{organization.nigerian_employees || 0}</DetailValue>
                  </DetailRow>
                </Grid>
                <Grid item xs={6} md={3}>
                  <DetailRow>
                    <DetailLabel>Non-Nigerian Employees</DetailLabel>
                    <DetailValue>{organization.non_nigerian_employees || 0}</DetailValue>
                  </DetailRow>
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>

          {/* Referee Information */}
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
                <ContactMailIcon sx={{ color: '#15e420' }} /> Referee Information
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>Referee</Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <DetailRow>
                    <DetailLabel>Full Name</DetailLabel>
                    <DetailValue>{organization.referee_name || 'N/A'}</DetailValue>
                  </DetailRow>
                </Grid>
                <Grid item xs={12} md={6}>
                  <DetailRow>
                    <DetailLabel>Business Name</DetailLabel>
                    <DetailValue>{organization.referee_business || 'N/A'}</DetailValue>
                  </DetailRow>
                </Grid>
                <Grid item xs={12} md={6}>
                  <DetailRow>
                    <DetailLabel>Phone Number</DetailLabel>
                    <DetailValue>{organization.referee_phone || 'N/A'}</DetailValue>
                  </DetailRow>
                </Grid>
                <Grid item xs={12} md={6}>
                  <DetailRow>
                    <DetailLabel>Registration Number</DetailLabel>
                    <DetailValue>{organization.referee_reg_number || 'N/A'}</DetailValue>
                  </DetailRow>
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>

          {/* Documents */}
          <Accordion defaultExpanded>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
                <DescriptionIcon sx={{ color: '#15e420' }} /> Documents ({organization.documents?.length || 0})
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              {organization.documents && organization.documents.length > 0 ? (
                <Box>
                  {documentFields.map((field) => {
                    const doc = organization.documents.find(d => d.document_type === field.key);
                    const hasDoc = !!doc;
                    
                    return (
                      <DocumentCard key={field.key}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          {hasDoc ? getDocumentIcon(field.key) : <WarningIcon sx={{ color: '#ff9800' }} />}
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                              {field.name}
                              {field.required && (
                                <Chip 
                                  label="Required" 
                                  size="small" 
                                  sx={{ ml: 1, height: '16px', fontSize: '0.55rem', backgroundColor: '#ffebee', color: '#c62828' }} 
                                />
                              )}
                            </Typography>
                            <Typography variant="caption" sx={{ color: '#666' }}>
                              {hasDoc ? `${doc.file_name} • ${formatDate(doc.uploaded_at)}` : 'Not uploaded'}
                            </Typography>
                          </Box>
                        </Box>
                        {hasDoc && (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Tooltip title="View Document">
                              <IconButton
                                size="small"
                                href={doc.file_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                sx={{ color: '#15e420' }}
                              >
                                <VisibilityIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Download">
                              <IconButton
                                size="small"
                                href={doc.file_url}
                                download
                                sx={{ color: '#2196f3' }}
                              >
                                <DownloadIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        )}
                      </DocumentCard>
                    );
                  })}
                </Box>
              ) : (
                <Typography variant="body2" sx={{ color: '#666', textAlign: 'center', py: 2 }}>
                  No documents uploaded
                </Typography>
              )}
            </AccordionDetails>
          </Accordion>
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 3, borderTop: '1px solid #e0e0e0' }}>
        <Button onClick={onClose} variant="outlined" sx={{ textTransform: 'none' }}>
          Close
        </Button>
        <Button
          variant="contained"
          sx={{
            bgcolor: '#15e420',
            textTransform: 'none',
            '&:hover': { bgcolor: '#12c21e' }
          }}
          onClick={() => navigate(`/admin/organizations/${organization.id}`)}
        >
          View Full Profile
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default OrganizationDetailsDialog;