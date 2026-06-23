import React, { useState, useEffect } from 'react';
import {
  Box,
  Dialog,
  DialogContent,
  DialogActions,
  Button,
  Stepper,
  Step,
  StepLabel,
  Paper,
  Typography,
  IconButton,
  CircularProgress,
  Alert,
} from '@mui/material';
import { Close as CloseIcon, Save as SaveIcon } from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { supabase } from '../../supabaseClient';
import BasicInfoTab from './BasicInfoTab';
import ContactRefereesTab from './ContactRefereesTab';
import DocumentsTab from './DocumentsTab';
import { getLgasByState } from './nigerianStates';
import { sendOrganizationCredentials, generateRandomPassword } from '../../utils/emailService';

// The bucket name that exists in your Supabase Storage
const BUCKET_NAME = 'organization-docs';

const DialogHeader = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: theme.spacing(2, 3),
  borderBottom: '1px solid #e0e0e0',
  backgroundColor: '#f8f9fa'
}));

const StyledStepper = styled(Stepper)(({ theme }) => ({
  padding: theme.spacing(3, 3, 2, 3),
  backgroundColor: 'transparent',
  '& .MuiStepLabel-root': {
    cursor: 'pointer'
  }
}));

const StepContentContainer = styled(Box)(({ theme }) => ({
  padding: theme.spacing(0, 3, 3, 3),
  minHeight: '400px',
  maxHeight: '500px',
  overflowY: 'auto',
  '&::-webkit-scrollbar': {
    width: '6px',
  },
  '&::-webkit-scrollbar-track': {
    background: '#f1f1f1',
    borderRadius: '3px',
  },
  '&::-webkit-scrollbar-thumb': {
    background: '#15e420',
    borderRadius: '3px',
  },
  '&::-webkit-scrollbar-thumb:hover': {
    background: '#12c21e',
  }
}));

const NavigationButtons = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'space-between',
  padding: theme.spacing(2, 3),
  borderTop: '1px solid #e0e0e0',
  backgroundColor: '#fafafa',
  borderRadius: '0 0 16px 16px'
}));

// Function to check if bucket exists
const checkBucketAccess = async () => {
  try {
    console.log(`Checking access to bucket: ${BUCKET_NAME}`);
    
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .list('', {
        limit: 1,
        offset: 0,
      });
    
    if (error) {
      console.error('Error accessing bucket:', error);
      
      if (error.message?.includes('bucket not found') || error.message?.includes('not found')) {
        console.log(`Bucket ${BUCKET_NAME} does not exist`);
        return false;
      }
      
      if (error.message?.includes('permission')) {
        console.log(`Bucket ${BUCKET_NAME} exists but no list permission`);
        return true;
      }
      
      return false;
    }
    
    console.log(`✅ Bucket ${BUCKET_NAME} is accessible`);
    return true;
  } catch (error) {
    console.error('Error checking bucket access:', error);
    return false;
  }
};

const OrganizationForm = ({ open, onClose, editingOrg, onSaveSuccess, showAlert }) => {
  const [activeStep, setActiveStep] = useState(0);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [fileNames, setFileNames] = useState({});
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [formErrors, setFormErrors] = useState({});
  const [availableLgas, setAvailableLgas] = useState([]);
  const [skipDocuments, setSkipDocuments] = useState(false);
  const [bucketReady, setBucketReady] = useState(false);
  const [bucketChecked, setBucketChecked] = useState(false);

  // Check bucket on mount
  useEffect(() => {
    const init = async () => {
      const accessible = await checkBucketAccess();
      setBucketReady(accessible);
      setBucketChecked(true);
      if (accessible) {
        console.log(`✅ Bucket ${BUCKET_NAME} is ready for use`);
      } else {
        console.warn(`❌ Bucket ${BUCKET_NAME} is not accessible`);
        showAlert('warning', 'Storage bucket not available. Documents cannot be uploaded. Please ensure the organization-docs bucket exists and is public.');
      }
    };
    init();
  }, []);

  const [formData, setFormData] = useState({
    company_name: '',
    registration_number: '',
    cac_number: '',
    house_number: '',
    street: '',
    lga: '',
    state: '',
    landmark: '',
    business_nature: [],
    phone_number1: '',
    phone_number2: '',
    email: '',
    registration_date: new Date().toISOString().split('T')[0],
    contact_person: '',
    representative: '',
    nigerian_directors: 0,
    non_nigerian_directors: 0,
    nigerian_employees: 0,
    non_nigerian_employees: 0,
    id_type: '',
    referee_name: '',
    referee_business: '',
    referee_phone: '',
    referee_reg_number: '',
    cover_letter: null,
    memorandum: null,
    registration_cert: null,
    incorporation_cert: null,
    premises_cert: null,
    company_logo: null,
    form_c07: null,
    id_document: null
  });

  useEffect(() => {
    if (formData.state) {
      const lgas = getLgasByState(formData.state);
      setAvailableLgas(lgas);
    } else {
      setAvailableLgas([]);
    }
  }, [formData.state]);

  useEffect(() => {
    if (editingOrg) {
      let businessNature = editingOrg.business_nature || [];
      if (typeof businessNature === 'string') {
        try {
          businessNature = JSON.parse(businessNature);
        } catch (e) {
          businessNature = [];
        }
      }
      
      setFormData({
        company_name: editingOrg.company_name || '',
        registration_number: editingOrg.registration_number || '',
        cac_number: editingOrg.cac_number || '',
        house_number: editingOrg.house_number || '',
        street: editingOrg.street || '',
        lga: editingOrg.lga || '',
        state: editingOrg.state || '',
        landmark: editingOrg.landmark || '',
        business_nature: businessNature,
        phone_number1: editingOrg.phone_number1 || '',
        phone_number2: editingOrg.phone_number2 || '',
        email: editingOrg.email || '',
        registration_date: editingOrg.registration_date || new Date().toISOString().split('T')[0],
        contact_person: editingOrg.contact_person || '',
        representative: editingOrg.representative || '',
        nigerian_directors: editingOrg.nigerian_directors || 0,
        non_nigerian_directors: editingOrg.nigerian_directors || 0,
        nigerian_employees: editingOrg.nigerian_employees || 0,
        non_nigerian_employees: editingOrg.non_nigerian_employees || 0,
        id_type: editingOrg.id_type || '',
        referee_name: editingOrg.referee_name || '',
        referee_business: editingOrg.referee_business || '',
        referee_phone: editingOrg.referee_phone || '',
        referee_reg_number: editingOrg.referee_reg_number || '',
        cover_letter: null,
        memorandum: null,
        registration_cert: null,
        incorporation_cert: null,
        premises_cert: null,
        company_logo: null,
        form_c07: null,
        id_document: null
      });
      
      if (editingOrg.id) {
        fetchOrganizationDocuments(editingOrg.id);
      }
    } else {
      generateRegistrationNumber();
      setFormData({
        company_name: '',
        registration_number: '',
        cac_number: '',
        house_number: '',
        street: '',
        lga: '',
        state: '',
        landmark: '',
        business_nature: [],
        phone_number1: '',
        phone_number2: '',
        email: '',
        registration_date: new Date().toISOString().split('T')[0],
        contact_person: '',
        representative: '',
        nigerian_directors: 0,
        non_nigerian_directors: 0,
        nigerian_employees: 0,
        non_nigerian_employees: 0,
        id_type: '',
        referee_name: '',
        referee_business: '',
        referee_phone: '',
        referee_reg_number: '',
        cover_letter: null,
        memorandum: null,
        registration_cert: null,
        incorporation_cert: null,
        premises_cert: null,
        company_logo: null,
        form_c07: null,
        id_document: null
      });
      setAvailableLgas([]);
      setUploadedFiles([]);
      setFileNames({});
      setSkipDocuments(false);
    }
    setFormErrors({});
    setActiveStep(0);
  }, [editingOrg, open]);

  const generateRegistrationNumber = async () => {
    try {
      const year = new Date().getFullYear();
      const { count } = await supabase
        .from('organizations_registry')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', `${year}-01-01`)
        .lt('created_at', `${year + 1}-01-01`);

      const serialNumber = String((count || 0) + 1).padStart(4, '0');
      setFormData(prev => ({ ...prev, registration_number: `KCC/${year}/${serialNumber}` }));
    } catch (error) {
      console.error('Error generating registration number:', error);
      const timestamp = Date.now().toString().slice(-4);
      setFormData(prev => ({ ...prev, registration_number: `KCC/${new Date().getFullYear()}/${timestamp}` }));
    }
  };

  const fetchOrganizationDocuments = async (orgId) => {
    try {
      console.log('Fetching documents for org:', orgId);
      const { data, error } = await supabase
        .from('organization_documents')
        .select('*')
        .eq('organization_id', orgId);

      if (error) {
        console.error('Error fetching documents:', error);
        throw error;
      }
      
      console.log('Documents found:', data);
      setUploadedFiles(data || []);
    } catch (error) {
      console.error('Error fetching documents:', error);
    }
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleBusinessNatureChange = (event) => {
    const { value } = event.target;
    setFormData(prev => ({ ...prev, business_nature: value }));
    if (formErrors.business_nature) {
      setFormErrors(prev => ({ ...prev, business_nature: '' }));
    }
  };

  const handleStateChange = (e) => {
    const state = e.target.value;
    setFormData(prev => ({ ...prev, state: state, lga: '' }));
    if (formErrors.state) {
      setFormErrors(prev => ({ ...prev, state: '' }));
    }
  };

  const handleFileChange = (e) => {
    const { name, files } = e.target;
    if (files && files[0]) {
      const file = files[0];
      console.log('File selected:', name, file.name, file.size);
      setFormData(prev => ({ ...prev, [name]: file }));
      setFileNames(prev => ({ ...prev, [name]: file.name }));
    }
  };

  const handleSkipDocuments = () => {
    setSkipDocuments(true);
    handleSaveOrganization(true);
  };

  // Check if any documents are uploaded
  const hasDocumentsUploaded = () => {
    const documentFields = [
      'cover_letter',
      'memorandum', 
      'registration_cert',
      'incorporation_cert',
      'premises_cert',
      'company_logo',
      'form_c07',
      'id_document'
    ];
    
    return documentFields.some(field => formData[field] instanceof File);
  };

  const validateStep1 = () => {
    const errors = {};
    if (!formData.company_name?.trim()) errors.company_name = 'Company name is required';
    if (!formData.registration_number?.trim()) errors.registration_number = 'Registration number is required';
    if (!formData.business_nature || formData.business_nature.length === 0) {
      errors.business_nature = 'At least one business nature is required';
    }
    if (!formData.house_number?.trim()) errors.house_number = 'House number is required';
    if (!formData.street?.trim()) errors.street = 'Street is required';
    if (!formData.lga) errors.lga = 'Local Government Area is required';
    if (!formData.state) errors.state = 'State is required';
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Invalid email format';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateStep2 = () => {
    return true;
  };

  const handleNext = () => {
    if (activeStep === 0) {
      if (validateStep1()) {
        setActiveStep((prev) => prev + 1);
      }
    } else if (activeStep === 1) {
      if (validateStep2()) {
        setActiveStep((prev) => prev + 1);
      }
    }
  };

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
  };

  const uploadDocument = async (file, orgId, docType) => {
    if (!file) {
      console.log('No file to upload for:', docType);
      return null;
    }

    try {
      console.log('Uploading document:', docType, file.name);
      
      if (!bucketReady) { 
        const accessible = await checkBucketAccess();
        setBucketReady(accessible);
        if (!accessible) {
          throw new Error('Storage bucket is not available. Please contact administrator.');
        }
      }

      const timestamp = Date.now();
      const fileExt = file.name.split('.').pop();
      const fileName = `${orgId}/${docType}_${timestamp}.${fileExt}`;
      const filePath = `organization_documents/${fileName}`;

      console.log('Uploading to path:', filePath);
      console.log('Using bucket:', BUCKET_NAME);

      const { error: uploadError, data: uploadData } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw uploadError;
      }

      console.log('Upload successful:', uploadData);

      const { data: { publicUrl } } = supabase.storage
        .from(BUCKET_NAME)
        .getPublicUrl(filePath);

      console.log('Public URL:', publicUrl);

      const docRecord = {
        organization_id: orgId,
        document_type: docType,
        file_name: file.name,
        file_path: filePath,
        file_url: publicUrl,
        status: 'pending',
        uploaded_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      console.log('Saving document record:', docRecord);

      const { data: docData, error: docError } = await supabase
        .from('organization_documents')
        .insert([docRecord])
        .select()
        .single();

      if (docError) {
        console.error('Document record error:', docError);
        
        if (uploadData) {
          await supabase.storage
            .from(BUCKET_NAME)
            .remove([filePath]);
        }
        
        throw new Error(`Failed to save document record: ${docError.message}`);
      }

      console.log('Document record saved:', docData);
      return docData;
    } catch (error) {
      console.error('Error in uploadDocument:', error);
      throw error;
    }
  };

const handleSaveOrganization = async (skipDocs = false) => {
  setUploadLoading(true);
  try {
    const { data: { user } } = await supabase.auth.getUser();
    const now = new Date().toISOString();

    // Generate a random password for the organization
    const generatedPassword = generateRandomPassword();
    console.log('Generated password for organization:', generatedPassword);

    // Determine organization status based on documents
    let orgStatus;
    let statusChanged = false;
    
    if (editingOrg) {
      // Check if documents are being uploaded
      const hasNewDocuments = hasDocumentsUploaded();
      const currentStatus = editingOrg.status || 'pending';
      
      // If documents are being uploaded and current status is pending or rejected
      if (hasNewDocuments) {
        // Check if there are any existing documents in the database
        const { data: existingDocs, error: docsError } = await supabase
          .from('organization_documents')
          .select('*')
          .eq('organization_id', editingOrg.id);

        if (docsError) {
          console.error('Error checking existing documents:', docsError);
        }

        // If there are existing documents OR new documents being uploaded
        const hasExistingDocs = existingDocs && existingDocs.length > 0;
        
        if (hasExistingDocs || hasNewDocuments) {
          // Check if all required documents are uploaded
          // For now, we'll consider that if any documents exist, it's approved
          // You can make this more strict by checking specific document types
          orgStatus = 'approved';
          statusChanged = true;
        } else {
          orgStatus = currentStatus;
        }
      } else {
        // No new documents uploaded, keep existing status
        orgStatus = currentStatus;
      }
    } else {
      // For new organizations
      // Check if documents are uploaded (not skipped)
      if (!skipDocs && !skipDocuments && hasDocumentsUploaded()) {
        orgStatus = 'approved';
      } else {
        orgStatus = 'pending';
      }
    }

    const orgData = {
      company_name: formData.company_name?.trim() || '',
      registration_number: formData.registration_number?.trim() || '',
      cac_number: formData.cac_number?.trim() || '',
      house_number: formData.house_number?.trim() || '',
      street: formData.street?.trim() || '',
      lga: formData.lga || '',
      state: formData.state || '',
      landmark: formData.landmark?.trim() || '',
      business_nature: JSON.stringify(formData.business_nature || []),
      phone_number1: formData.phone_number1?.trim() || '',
      phone_number2: formData.phone_number2?.trim() || '',
      email: formData.email?.trim() || '',
      registration_date: formData.registration_date || new Date().toISOString().split('T')[0],
      contact_person: formData.contact_person?.trim() || '',
      representative: formData.representative?.trim() || '',
      nigerian_directors: parseInt(formData.nigerian_directors) || 0,
      non_nigerian_directors: parseInt(formData.non_nigerian_directors) || 0,
      nigerian_employees: parseInt(formData.nigerian_employees) || 0,
      non_nigerian_employees: parseInt(formData.non_nigerian_employees) || 0,
      id_type: formData.id_type || '',
      referee_name: formData.referee_name?.trim() || '',
      referee_business: formData.referee_business?.trim() || '',
      referee_phone: formData.referee_phone?.trim() || '',
      referee_reg_number: formData.referee_reg_number?.trim() || '',
      status: orgStatus,
      updated_at: now
    };

    let orgId;

    if (editingOrg) {
      const { error } = await supabase
        .from('organizations_registry')
        .update(orgData)
        .eq('id', editingOrg.id);

      if (error) throw error;
      orgId = editingOrg.id;
      
      if (statusChanged) {
        showAlert('success', `✅ Organization updated successfully! Status changed to: ${orgStatus.toUpperCase()}`);
      } else {
        showAlert('success', `Organization updated successfully. Current status: ${orgStatus}`);
      }
    } else {
      orgData.created_by = user?.id || null;
      orgData.created_at = now;

      // First, create the organization record
      const { data, error } = await supabase
        .from('organizations_registry')
        .insert([orgData])
        .select()
        .single();

      if (error) throw error;
      orgId = data.id;
      
      // Create user using signUp - NO EMAIL will be sent by Supabase
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email?.trim(),
        password: generatedPassword,
        options: {
          data: {
            company_name: formData.company_name?.trim(),
            organization_id: orgId,
            role: 'organization'
          }
        }
      });

      if (authError) {
        console.error('Error creating auth user:', authError);
        // If auth user creation fails, delete the organization record
        await supabase
          .from('organizations_registry')
          .delete()
          .eq('id', orgId);
        throw new Error(`Failed to create user account: ${authError.message}`);
      }

      console.log('Auth user created successfully:', authData);

      // Send ONLY EmailJS email with credentials (no Supabase email)
      const emailSent = await sendOrganizationCredentials(
        formData.email?.trim(),
        formData.company_name?.trim(),
        generatedPassword,
        formData.registration_number
      );

      if (emailSent.success) {
        showAlert('success', `✅ Organization created! Status: ${orgStatus.toUpperCase()}. Login credentials sent to organization email.`);
      } else {
        console.warn('Failed to send credentials email:', emailSent.error);
        showAlert('warning', `⚠️ Organization created (Status: ${orgStatus}) but credential email could not be sent.`);
      }
    }

    // Upload documents if not skipped
    if (!skipDocs && !skipDocuments && orgId) {
      console.log('Uploading documents for org:', orgId);
      
      const documentTypes = {
        cover_letter: 'cover_letter',
        memorandum: 'memorandum',
        registration_cert: 'registration_cert',
        incorporation_cert: 'incorporation_cert',
        premises_cert: 'premises_cert',
        company_logo: 'company_logo',
        form_c07: 'form_c07',
        id_document: 'id_document'
      };

      let uploadedCount = 0;
      let errors = [];

      for (const [key, docType] of Object.entries(documentTypes)) {
        if (formData[key] instanceof File) {
          try {
            console.log(`Uploading ${docType}...`);
            await uploadDocument(formData[key], orgId, docType);
            uploadedCount++;
          } catch (error) {
            console.error(`Failed to upload ${docType}:`, error);
            errors.push(`${docType}: ${error.message}`);
          }
        }
      }
      
      if (uploadedCount > 0 && errors.length === 0) {
        // After documents are uploaded, update status to approved if it's still pending
        if (orgStatus === 'pending') {
          const { error: statusUpdateError } = await supabase
            .from('organizations_registry')
            .update({ status: 'approved' })
            .eq('id', orgId);
          
          if (!statusUpdateError) {
            orgStatus = 'approved';
            showAlert('success', `${uploadedCount} document(s) uploaded successfully. Organization status updated to APPROVED!`);
          } else {
            showAlert('success', `${uploadedCount} document(s) uploaded successfully.`);
          }
        } else {
          showAlert('success', `${uploadedCount} document(s) uploaded successfully.`);
        }
      } else if (uploadedCount > 0 && errors.length > 0) {
        showAlert('warning', `${uploadedCount} document(s) uploaded. ${errors.length} failed: ${errors.join(', ')}`);
      } else if (errors.length > 0) {
        showAlert('error', `Failed to upload documents: ${errors.join(', ')}`);
      }
    }

    // Refresh documents list
    if (orgId) {
      await fetchOrganizationDocuments(orgId);
    }

    onSaveSuccess();
  } catch (error) {
    console.error('Error saving organization:', error);
    if (error.code === '23505') {
      showAlert('error', 'Registration number or CAC number already exists');
    } else if (error.message?.includes('Could not find')) {
      showAlert('error', 'Database column missing. Please run database migrations.');
    } else if (error.message?.includes('bucket') || error.message?.includes('storage')) {
      showAlert('error', 'Storage issue. Please ensure the organization-docs bucket exists.');
    } else if (error.message?.includes('rate limit')) {
      showAlert('error', 'Rate limit hit. Please wait a moment and try again.');
    } else {
      showAlert('error', 'Failed to save organization: ' + error.message);
    }
  } finally {
    setUploadLoading(false);
  }
};

  const handleDeleteDocument = async (docId, filePath) => {
    if (!window.confirm('Are you sure you want to delete this document?')) return;

    try {
      const { error: storageError } = await supabase.storage
        .from(BUCKET_NAME)
        .remove([filePath]);

      if (storageError) {
        console.error('Storage delete error:', storageError);
      }

      const { error } = await supabase
        .from('organization_documents')
        .delete()
        .eq('id', docId);

      if (error) throw error;

      setUploadedFiles(prev => prev.filter(d => d.id !== docId));
      showAlert('success', 'Document deleted successfully');
    } catch (error) {
      console.error('Error deleting document:', error);
      showAlert('error', 'Failed to delete document');
    }
  };

  const steps = ['Company & Address', 'Contact & Referee', 'Documents'];

  const getStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <BasicInfoTab
            formData={formData}
            formErrors={formErrors}
            availableLgas={availableLgas}
            onFormChange={handleFormChange}
            onBusinessNatureChange={handleBusinessNatureChange}
            onStateChange={handleStateChange}
          />
        );
      case 1:
        return (
          <ContactRefereesTab
            formData={formData}
            formErrors={formErrors}
            onFormChange={handleFormChange}
          />
        );
      case 2:
        return (
          <DocumentsTab
            formData={formData}
            formErrors={formErrors}
            fileNames={fileNames}
            uploadedFiles={uploadedFiles}
            editingOrg={editingOrg}
            onFileChange={handleFileChange}
            onDeleteDocument={handleDeleteDocument}
            onFormChange={handleFormChange}
            bucketReady={bucketReady}
          />
        );
      default:
        return 'Unknown step';
    }
  };

  const isLastStep = activeStep === steps.length - 1;

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{ 
        sx: { 
          borderRadius: '16px',
          maxHeight: '90vh'
        } 
      }}
    >
      <DialogHeader>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 700, fontFamily: '"Inter", sans-serif' }}>
            {editingOrg ? 'Edit Organization' : 'Create New Organization'}
          </Typography>
          <Typography variant="caption" sx={{ color: '#666' }}>
            {editingOrg ? 'Update organization details and documents' : 'Add a new organization to the registry'}
          </Typography>
        </Box>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogHeader>

      <DialogContent sx={{ p: 0 }}>
        <StyledStepper activeStep={activeStep} alternativeLabel>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </StyledStepper>

        <StepContentContainer>
          {getStepContent(activeStep)}
        </StepContentContainer>
      </DialogContent>

      <NavigationButtons>
        <Button
          onClick={handleBack}
          disabled={activeStep === 0}
          variant="outlined"
          sx={{ textTransform: 'none' }}
        >
          Back
        </Button>

        <Box sx={{ display: 'flex', gap: 2 }}>
          {isLastStep ? (
            <>
              <Button
                onClick={handleSkipDocuments}
                variant="outlined"
                disabled={uploadLoading}
                sx={{ 
                  textTransform: 'none',
                  borderColor: '#ff9800',
                  color: '#ff9800',
                  '&:hover': {
                    borderColor: '#e65100',
                    backgroundColor: 'rgba(255, 152, 0, 0.04)'
                  }
                }}
              >
                Skip Documents (Set to Pending)
              </Button>
              <Button
                onClick={() => handleSaveOrganization(false)}
                variant="contained"
                disabled={uploadLoading}
                startIcon={uploadLoading ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
                sx={{
                  bgcolor: '#15e420',
                  textTransform: 'none',
                  '&:hover': { bgcolor: '#12c21e' }
                }}
              >
                {uploadLoading ? 'Saving...' : (editingOrg ? 'Update' : 'Save All')}
              </Button>
            </>
          ) : (
            <Button
              onClick={handleNext}
              variant="contained"
              sx={{
                bgcolor: '#15e420',
                textTransform: 'none',
                '&:hover': { bgcolor: '#12c21e' }
              }}
            >
              Next
            </Button>
          )}
        </Box>
      </NavigationButtons>
    </Dialog>
  );
};

export default OrganizationForm;