import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import { sendAdminRegistrationNotification } from '../../utils/emailService';

export const useRegistration = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [alert, setAlert] = useState(null);
  const [formData, setFormData] = useState({
    companyName: '',
    email: '',
    phoneNumber: '',
    cacNumber: '',
    businessNature: [],
    specifiedGoods: '',
    goodsDetails: '',
    houseNumber: '',
    streetName: '',
    lga: '',
    state: '',
    landmark: '',
    nigerianDirectors: '',
    nonNigerianDirectors: '',
    nigerianEmployees: '',
    nonNigerianEmployees: '',
    contactPerson: '',
    representative: '',
    refereeName: '',
    refereeBusiness: '',
    refereePhone: '',
    refereeEmail: '',
    refereeRegNumber: '',
    refereeId: '',
    refereeEmailSent: false,
    nin: '',
  });

  const [files, setFiles] = useState({
    ninDocument: null,
    coverLetter: null,
    memorandum: null,
    registrationCert: null,
    incorporationCert: null,
    premisesCert: null,
    companyLogo: null,
    formC07: null,
    passport: null,
  });

  const [fileNames, setFileNames] = useState({
    ninDocument: '',
    coverLetter: '',
    memorandum: '',
    registrationCert: '',
    incorporationCert: '',
    premisesCert: '',
    companyLogo: '',
    formC07: '',
    passport: '',
  });

  const [organizationId, setOrganizationId] = useState(null);
  const [paymentStep, setPaymentStep] = useState(false);
  const [registrationNumber, setRegistrationNumber] = useState(null);

  const documentTypeMapping = {
    ninDocument: 'nin_document',
    coverLetter: 'cover_letter',
    memorandum: 'memorandum',
    registrationCert: 'registration_cert',
    incorporationCert: 'incorporation_cert',
    premisesCert: 'premises_cert',
    companyLogo: 'company_logo',
    formC07: 'form_c07',
    passport: 'passport'
  };

  const requiredDocuments = ['ninDocument', 'coverLetter', 'registrationCert', 'incorporationCert', 'companyLogo', 'passport'];

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
        setFormData(prev => ({ ...prev, email: user.email || '' }));
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

  const uploadFile = async (file, documentType, organizationId) => {
    try {
      if (!user) throw new Error('You must be logged in to upload files');
      if (!file) throw new Error('No file provided');

      const maxSize = file.type.startsWith('image/') ? 5 * 1024 * 1024 : 10 * 1024 * 1024;
      if (file.size > maxSize) {
        throw new Error(`File ${file.name} is too large. Maximum size is ${maxSize/(1024*1024)}MB`);
      }

      const timestamp = Date.now();
      const randomStr = Math.random().toString(36).substring(2, 8);
      const cleanFileName = file.name.replace(/[^a-zA-Z0-9.]/g, '_').replace(/\s+/g, '_');
      const fileName = `${timestamp}_${randomStr}_${cleanFileName}`;
      
      const bucket = 'organization-docs';
      const folder = file.type.startsWith('image/') ? 'logos' : 'documents';
      const filePath = `${folder}/${user.id}/${documentType}/${fileName}`;
      
      const { error } = await supabase.storage
        .from(bucket)
        .upload(filePath, file, { 
          cacheControl: '3600', 
          upsert: false,
          contentType: file.type
        });

      if (error) throw error;
      
      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath);
      
      return {
        file_path: filePath,
        file_url: publicUrl
      };
      
    } catch (error) {
      console.error('❌ Upload error:', error);
      throw new Error(`Failed to upload ${file.name}: ${error.message}`);
    }
  };

  const checkExistingRegistration = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('organizations_registry')
        .select('id, status, registration_number')
        .eq('user_id', userId)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error checking existing registration:', error);
      return null;
    }
  };

  // ============================================================
  // USER SELF-REGISTRATION - Status = 'pending'
  // Requires: Referee confirmation + Documents + Payment
  // ============================================================
  const submitRegistration = async () => {
    if (!user) {
      showAlert('error', 'You must be logged in to register');
      return null;
    }

    setLoading(true);
    setAlert(null);

    try {
      // Check for existing registration
      const existingReg = await checkExistingRegistration(user.id);
      if (existingReg) {
        showAlert('error', `You have already submitted a registration. Status: ${existingReg.status}`);
        setTimeout(() => navigate('/dashboard'), 2000);
        return null;
      }

      // Validate NIN
      if (!formData.nin || formData.nin.length !== 11) {
        showAlert('error', 'Please enter a valid 11-digit NIN');
        return null;
      }

      // Validate required files
      const missingFiles = requiredDocuments.filter(key => !files[key]);
      if (missingFiles.length > 0) {
        const missingNames = missingFiles.map(key => key.replace(/([A-Z])/g, ' $1').trim());
        showAlert('error', `Please upload all required documents: ${missingNames.join(', ')}`);
        return null;
      }

      // Check referee selection
      if (!formData.refereeId) {
        showAlert('error', 'Please select a referee from the chamber registry');
        return null;
      }

      // Check referee email sent
      if (!formData.refereeEmailSent) {
        showAlert('error', 'Please send confirmation email to the referee first');
        return null;
      }

      // ✅ SELF REGISTRATION: Status = 'pending'
      // Referee confirmation tracked via referee_confirmed field
      const organizationData = {
        user_id: user.id,
        company_name: formData.companyName.trim(),
        email: formData.email.trim().toLowerCase(),
        phone_number1: formData.phoneNumber.trim(),
        cac_number: formData.cacNumber.trim(),
        business_nature: formData.businessNature || [],
        specified_goods: formData.specifiedGoods?.trim() || '',
        goods_details: formData.goodsDetails?.trim() || '',
        house_number: formData.houseNumber?.trim() || '',
        street: formData.streetName?.trim() || '',
        lga: formData.lga?.trim() || '',
        state: formData.state?.trim() || '',
        landmark: formData.landmark?.trim() || '',
        nigerian_directors: parseInt(formData.nigerianDirectors) || 0,
        non_nigerian_directors: parseInt(formData.nonNigerianDirectors) || 0,
        nigerian_employees: parseInt(formData.nigerianEmployees) || 0,
        non_nigerian_employees: parseInt(formData.nonNigerianEmployees) || 0,
        contact_person: formData.contactPerson?.trim() || '',
        representative: formData.representative?.trim() || '',
        referee_name: formData.refereeName?.trim() || '',
        referee_business: formData.refereeBusiness?.trim() || '',
        referee_phone: formData.refereePhone?.trim() || '',
        referee_email: formData.refereeEmail?.trim() || '',
        referee_reg_number: formData.refereeRegNumber?.trim() || '',
        referee_id: formData.refereeId,
        // ✅ Referee starts as NOT confirmed
        referee_confirmed: false,
        nin: formData.nin.trim(),
        // ✅ Status: 'pending' (awaiting admin approval after referee confirms)
        status: 'pending',
        registration_type: 'self',
        payment_status: 'pending',
        registration_date: new Date().toISOString()
      };

      const { data: orgData, error: orgError } = await supabase
        .from('organizations_registry')
        .insert([organizationData])
        .select()
        .single();

      if (orgError) {
        console.error('Organization insert error:', orgError);
        throw orgError;
      }

      const newOrganizationId = orgData.id;
      const newRegistrationNumber = orgData.registration_number;
      setOrganizationId(newOrganizationId);
      setRegistrationNumber(newRegistrationNumber);

      // Upload documents
      const documentUploads = [];
      let uploadErrors = [];

      for (const [key, file] of Object.entries(files)) {
        if (file) {
          try {
            const documentType = documentTypeMapping[key];
            const uploadResult = await uploadFile(file, documentType, newOrganizationId);

            const docRecord = {
              organization_id: newOrganizationId,
              document_type: documentType,
              file_url: uploadResult.file_url,
              file_path: uploadResult.file_path,
              file_name: file.name,
              file_size: file.size,
              mime_type: file.type,
              uploaded_by: user.id,
              is_required: requiredDocuments.includes(key),
              is_latest: true,
              uploaded_at: new Date().toISOString()
            };

            documentUploads.push(docRecord);
          } catch (uploadError) {
            uploadErrors.push(`${key}: ${uploadError.message}`);
          }
        }
      }

      if (uploadErrors.length > 0) {
        throw new Error(`File upload errors: ${uploadErrors.join(', ')}`);
      }

      if (documentUploads.length > 0) {
        const { error: docsError } = await supabase
          .from('organization_documents')
          .insert(documentUploads);

        if (docsError) throw docsError;
      }

      // Audit log
      const { error: auditError } = await supabase
        .from('registration_audit_log')
        .insert([{
          organization_id: newOrganizationId,
          user_id: user.id,
          action: 'registration_submitted',
          new_data: { 
            status: 'pending',
            company_name: formData.companyName.trim(),
            registration_number: newRegistrationNumber,
            referee_id: formData.refereeId
          },
          created_at: new Date().toISOString()
        }]);

      if (auditError) console.warn('Audit log error:', auditError);

      localStorage.removeItem('registrationFormData');

      // Send admin notification
      try {
        await sendAdminRegistrationNotification({
          id: newOrganizationId,
          registration_number: newRegistrationNumber,
          company_name: formData.companyName.trim(),
          email: formData.email.trim().toLowerCase(),
          phone_number: formData.phoneNumber.trim(),
          cac_number: formData.cacNumber.trim(),
          business_nature: formData.businessNature,
          referee_name: formData.refereeName,
          referee_email: formData.refereeEmail
        });
      } catch (emailError) {
        console.warn('⚠️ Failed to send admin notification:', emailError);
      }
      
      showAlert('success', `✅ Registration submitted! Awaiting referee confirmation. Registration Number: ${newRegistrationNumber}`);
      return newOrganizationId;
      
    } catch (error) {
      console.error('Registration error:', error);
      showAlert('error', error.message || 'Failed to submit registration');
      return null;
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
    registrationNumber,
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