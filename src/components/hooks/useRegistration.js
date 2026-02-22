import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import { sendAdminRegistrationNotification } from '../../utils/emailService'; // Updated import

export const useRegistration = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [alert, setAlert] = useState(null);
  const [formData, setFormData] = useState({
    // Step 1 - Company Information
    companyName: '',
    officeAddress: '',
    businessNature: '',
    
    // Step 2 - Company Details
    nigerianDirectors: '',
    nonNigerianDirectors: '',
    nigerianEmployees: '',
    nonNigerianEmployees: '',
    bankers: '',
    contactPerson: '',
    representative: '',
    email: '',
    cacNumber: '',
    phoneNumber: '',
    
    // Step 3 - Referees
    referee1Name: '',
    referee1Business: '',
    referee1Phone: '',
    referee1RegNumber: '',
    referee2Name: '',
    referee2Business: '',
    referee2Phone: '',
    referee2RegNumber: '',
    
    // Step 4 - Documents
    idType: '',
  });

  const [files, setFiles] = useState({
    coverLetter: null,
    memorandum: null,
    registrationCert: null,
    incorporationCert: null,
    premisesCert: null,
    companyLogo: null,
    formC07: null,
    idDocument: null,
  });

  const [fileNames, setFileNames] = useState({
    coverLetter: '',
    memorandum: '',
    registrationCert: '',
    incorporationCert: '',
    premisesCert: '',
    companyLogo: '',
    formC07: '',
    idDocument: '',
  });

  const [organizationId, setOrganizationId] = useState(null);
  const [paymentStep, setPaymentStep] = useState(false);

  // Column name mapping
  const columnNameMapping = {
    coverLetter: 'cover_letter_path',
    memorandum: 'memorandum_path',
    registrationCert: 'registration_cert_path',
    incorporationCert: 'incorporation_cert_path',
    premisesCert: 'premises_cert_path',
    companyLogo: 'company_logo_path',
    formC07: 'form_c07_path',
    idDocument: 'id_document_path'
  };

  useEffect(() => {
    checkUser();
  }, []);

  useEffect(() => {
    const savedData = localStorage.getItem('registrationFormData');
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        setFormData(prev => ({ ...prev, ...parsed }));
      } catch (e) {
        console.error('Error loading saved data:', e);
      }
    }
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (Object.values(formData).some(value => value)) {
        localStorage.setItem('registrationFormData', JSON.stringify(formData));
      }
    }, 1000);
    
    return () => clearTimeout(timeoutId);
  }, [formData]);

  const showAlert = (type, message) => {
    setAlert({ type, message });
    setTimeout(() => setAlert(null), 5000);
  };

  const checkUser = async () => {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) throw error;
      
      if (!user) {
        showAlert('error', 'Please log in to register');
        setTimeout(() => navigate('/login'), 2000);
      } else {
        setUser(user);
        setFormData(prev => ({
          ...prev,
          email: user.email || ''
        }));
      }
    } catch (error) {
      console.error('Error checking user:', error);
      showAlert('error', 'Authentication error');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const { name, files: fileList } = e.target;
    if (fileList.length > 0) {
      const file = fileList[0];
      setFiles(prev => ({ ...prev, [name]: file }));
      setFileNames(prev => ({ ...prev, [name]: file.name }));
    }
  };

  const uploadFile = async (file, fieldName) => {
    try {
      if (!user) throw new Error('You must be logged in to upload files');

      const maxSize = file.type.startsWith('image/') ? 5 * 1024 * 1024 : 10 * 1024 * 1024;
      if (file.size > maxSize) {
        throw new Error(`File ${file.name} is too large. Maximum size is ${maxSize/(1024*1024)}MB`);
      }

      const timestamp = Date.now();
      const cleanFileName = file.name.replace(/[^a-zA-Z0-9.]/g, '_').replace(/\s+/g, '_');
      const fileName = `${timestamp}_${cleanFileName}`;
      const filePath = `${user.id}/${fieldName}/${fileName}`;
      const bucket = file.type.startsWith('image/') ? 'logos' : 'documents';
      
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(filePath, file, { cacheControl: '3600', upsert: false });

      if (error) throw error;
      return filePath;
      
    } catch (error) {
      console.error('Upload error:', error);
      throw error;
    }
  };

  const checkExistingRegistration = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('organizations')
        .select('id, status')
        .eq('user_id', userId)
        .maybeSingle();
      
      return data;
    } catch (error) {
      console.error('Error:', error);
      return null;
    }
  };

  const submitRegistration = async () => {
    setLoading(true);
    try {
      const existingReg = await checkExistingRegistration(user.id);
      if (existingReg) {
        showAlert('error', `You have already submitted a registration. Status: ${existingReg.status}`);
        setTimeout(() => navigate('/dashboard'), 2000);
        return;
      }

      // Upload files
      const filePaths = {};
      let uploadErrors = [];
      
      for (const [key, file] of Object.entries(files)) {
        if (file) {
          try {
            const path = await uploadFile(file, key);
            const dbColumnName = columnNameMapping[key];
            if (dbColumnName) filePaths[dbColumnName] = path;
          } catch (uploadError) {
            uploadErrors.push(`${key}: ${uploadError.message}`);
          }
        }
      }

      if (uploadErrors.length > 0) {
        throw new Error(`File upload errors: ${uploadErrors.join(', ')}`);
      }

      // Prepare organization data
      const organizationData = {
        user_id: user.id,
        company_name: formData.companyName.trim(),
        office_address: formData.officeAddress.trim(),
        business_nature: formData.businessNature,
        nigerian_directors: parseInt(formData.nigerianDirectors) || 0,
        non_nigerian_directors: parseInt(formData.nonNigerianDirectors) || 0,
        nigerian_employees: parseInt(formData.nigerianEmployees) || 0,
        non_nigerian_employees: parseInt(formData.nonNigerianEmployees) || 0,
        bankers: formData.bankers.trim(),
        contact_person: formData.contactPerson.trim(),
        representative: formData.representative.trim(),
        email: formData.email.trim().toLowerCase(),
        cac_number: formData.cacNumber.trim(),
        phone_number: formData.phoneNumber.trim(),
        referee1_name: formData.referee1Name.trim(),
        referee1_business: formData.referee1Business.trim(),
        referee1_phone: formData.referee1Phone.trim(),
        referee1_reg_number: formData.referee1RegNumber.trim(),
        referee2_name: formData.referee2Name.trim(),
        referee2_business: formData.referee2Business.trim(),
        referee2_phone: formData.referee2Phone.trim(),
        referee2_reg_number: formData.referee2RegNumber.trim(),
        id_type: formData.idType,
        status: 'pending',
        ...filePaths
      };

      const { data, error: insertError } = await supabase
        .from('organizations')
        .insert([organizationData])
        .select();

      if (insertError) throw insertError;

      const newOrganizationId = data[0].id;
      setOrganizationId(newOrganizationId);
      localStorage.removeItem('registrationFormData');

      // Send admin notification email about new registration
      try {
        const notificationData = {
          id: newOrganizationId,
          company_name: formData.companyName.trim(),
          email: formData.email.trim().toLowerCase(),
          phone_number: formData.phoneNumber.trim(),
          cac_number: formData.cacNumber.trim(),
          business_nature: formData.businessNature
        };
        
        await sendAdminRegistrationNotification(notificationData);
        console.log('✅ Admin notification sent for new registration');
      } catch (emailError) {
        // Don't block registration if email fails
        console.warn('⚠️ Admin notification failed:', emailError);
      }
      
      return newOrganizationId;
      
    } catch (error) {
      console.error('Error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => {
    setCurrentStep(prev => Math.min(prev + 1, 5));
    window.scrollTo(0, 0);
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
    window.scrollTo(0, 0);
  };

  const goToPayment = () => {
    setPaymentStep(true);
    setCurrentStep(5);
  };

  return {
    user,
    currentStep,
    loading,
    alert,
    formData,
    files,
    fileNames,
    organizationId,
    paymentStep,
    businessNatureOptions: [
      "Manufacturing and Small-Scale/Cottage Industries",
      "Banking, Insurance, and Financial Institutions",
      "Distributive Trade and Commerce",
      "Construction, Engineering, Real Estate, Furniture, and Contractors",
      "Medical, Pharmaceuticals, and Allied Products",
      "Agricultural and Agro-Allied Products",
      "Automobile, Transport, Oil & Gas, and Allied Products",
      "Hotel, Trade Agencies, Tourism, Clearing & Forwarding, Air Courier Services",
      "Solid Minerals and Natural Resources",
      "Interrelationship, Business Promotion, Printing, and Publicity",
      "Women/Youth Development and Entrepreneurship Associations",
      "ICT, Telecommunications, and Digital Innovation"
    ],
    showAlert,
    handleInputChange,
    handleFileChange,
    submitRegistration,
    nextStep,
    prevStep,
    goToPayment,
    setAlert
  };
};