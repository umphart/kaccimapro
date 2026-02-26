import React, { useState, useEffect } from 'react';
import { Grid, Box, CircularProgress, Alert, Typography } from '@mui/material';
import { supabase } from '../../../supabaseClient';
import BasicInfoSection from './BasicInfoSection';
import PersonnelSection from './PersonnelSection';
import RefereeSection from './RefereeSection';
import DocumentsSection from './DocumentsSection';
import PaymentSection from './PaymentSection';

const OrganizationForm = ({ formData, setFormData, isEditing, showAlert }) => {
  const [uploading, setUploading] = useState(false);
  const [businessNatureOptions, setBusinessNatureOptions] = useState([]);
  const [fileNames, setFileNames] = useState({});

  useEffect(() => {
    fetchBusinessNatureOptions();
  }, []);

  const fetchBusinessNatureOptions = async () => {
    try {
      const { data, error } = await supabase
        .from('settings')
        .select('value')
        .eq('key', 'business_nature_options')
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching business nature options:', error);
      }

      if (data?.value) {
        setBusinessNatureOptions(data.value);
      } else {
        setBusinessNatureOptions([
          'Agriculture',
          'Manufacturing',
          'Trade & Commerce',
          'Services',
          'Mining & Solid Minerals',
          'Construction & Real Estate',
          'Transportation & Logistics',
          'Technology & IT',
          'Financial Services',
          'Education',
          'Healthcare',
          'Hospitality & Tourism',
          'Energy & Power',
          'Others'
        ]);
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleChange = (field) => (e) => {
    setFormData({ ...formData, [field]: e.target.value });
  };

  const handleCheckboxChange = (field) => (e) => {
    setFormData({ ...formData, [field]: e.target.checked });
  };

  const handleFileUpload = async (field, file) => {
    if (!file) return;

    try {
      setUploading(true);
      
      const maxSize = field.includes('logo') ? 5 * 1024 * 1024 : 10 * 1024 * 1024;
      if (file.size > maxSize) {
        showAlert('error', `File size must be less than ${maxSize / (1024 * 1024)}MB`);
        return;
      }

      const allowedTypes = field.includes('logo') 
        ? ['image/jpeg', 'image/png', 'image/jpg']
        : ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
      
      if (!allowedTypes.includes(file.type)) {
        showAlert('error', field.includes('logo') 
          ? 'Please upload JPG or PNG files only'
          : 'Please upload PDF, JPG, or PNG files only');
        return;
      }

      const timestamp = Date.now();
      const cleanFileName = file.name.replace(/[^a-zA-Z0-9.]/g, '_');
      const fileName = `${timestamp}_${cleanFileName}`;
      const filePath = `organizations/${formData.company_name || 'temp'}/${field}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('documents')
        .getPublicUrl(filePath);

      setFormData({ ...formData, [field]: filePath });
      setFileNames({ ...fileNames, [field]: file.name });

      showAlert('success', 'File uploaded successfully');
    } catch (error) {
      console.error('Upload error:', error);
      showAlert('error', 'Failed to upload file');
    } finally {
      setUploading(false);
    }
  };

  return (
    <Box sx={{ position: 'relative' }}>
      <Grid container spacing={4}>
        <BasicInfoSection 
          formData={formData}
          handleChange={handleChange}
          businessNatureOptions={businessNatureOptions}
        />
        
        <PersonnelSection 
          formData={formData}
          handleChange={handleChange}
        />
        
        <RefereeSection 
          formData={formData}
          handleChange={handleChange}
          refereeNumber={1}
        />
        
        <RefereeSection 
          formData={formData}
          handleChange={handleChange}
          refereeNumber={2}
        />
        
        <DocumentsSection 
          formData={formData}
          setFormData={setFormData}
          fileNames={fileNames}
          uploading={uploading}
          handleFileUpload={handleFileUpload}
        />
        
        <PaymentSection 
          formData={formData}
          handleChange={handleChange}
          handleCheckboxChange={handleCheckboxChange}
          fileNames={fileNames}
          uploading={uploading}
          handleFileUpload={handleFileUpload}
          isEditing={isEditing}
        />
        
        {uploading && (
          <Grid item xs={12}>
            <Box display="flex" justifyContent="center" alignItems="center" gap={2} py={2}>
              <CircularProgress size={24} sx={{ color: '#15e420' }} />
              <Typography variant="body2" color="textSecondary">Uploading file...</Typography>
            </Box>
          </Grid>
        )}
      </Grid>
    </Box>
  );
};

export default OrganizationForm;