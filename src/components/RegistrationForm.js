import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import './RegistrationForm.css';

const RegistrationForm = () => {
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

  // Business nature options
  const businessNatureOptions = [
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
  ];

  // Column name mapping (form field -> database column)
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

  // Load saved form data on mount
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

  // Save form data to localStorage periodically
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
        console.log('User authenticated:', user.id);
        
        // Pre-fill email if available
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
      console.log(`File selected for ${name}:`, file.name, file.type, file.size);
    }
  };

  const validateStep = () => {
    const requiredFields = {
      1: ['companyName', 'officeAddress', 'businessNature'],
      2: ['nigerianDirectors', 'nonNigerianDirectors', 'nigerianEmployees', 
          'nonNigerianEmployees', 'bankers', 'contactPerson', 'representative', 
          'email', 'cacNumber', 'phoneNumber'],
      3: ['referee1Name', 'referee1Business', 'referee1Phone', 'referee1RegNumber',
          'referee2Name', 'referee2Business', 'referee2Phone', 'referee2RegNumber'],
      4: ['idType']
    };

    const currentRequired = requiredFields[currentStep];
    for (const field of currentRequired) {
      if (!formData[field] || formData[field].trim() === '') {
        showAlert('error', `Please fill in all required fields`);
        return false;
      }
    }

    // Validate email format
    if (currentStep === 2 && formData.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        showAlert('error', 'Please enter a valid email address');
        return false;
      }
    }

    // Validate phone number
    if (currentStep === 2 && formData.phoneNumber) {
      const phoneRegex = /^\+?[\d\s-]{10,}$/;
      if (!phoneRegex.test(formData.phoneNumber)) {
        showAlert('error', 'Please enter a valid phone number');
        return false;
      }
    }

    // Validate files on step 4
    if (currentStep === 4) {
      const requiredFiles = ['coverLetter', 'memorandum', 'registrationCert', 'incorporationCert', 
                            'premisesCert', 'companyLogo', 'formC07', 'idDocument'];
      for (const file of requiredFiles) {
        if (!files[file]) {
          showAlert('error', `Please upload all required documents`);
          return false;
        }
      }
    }

    return true;
  };

  const uploadFile = async (file, fieldName) => {
    try {
      if (!user) {
        throw new Error('You must be logged in to upload files');
      }

      console.log(`Uploading ${fieldName}:`, {
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        userId: user.id
      });

      // Validate file
      if (!file) {
        throw new Error('No file provided');
      }

      // Check file size (10MB limit for documents, 5MB for images)
      const maxSize = file.type.startsWith('image/') ? 5 * 1024 * 1024 : 10 * 1024 * 1024;
      if (file.size > maxSize) {
        throw new Error(`File ${file.name} is too large. Maximum size is ${maxSize/(1024*1024)}MB`);
      }

      // Create a clean filename
      const timestamp = Date.now();
      const cleanFileName = file.name
        .replace(/[^a-zA-Z0-9.]/g, '_')
        .replace(/\s+/g, '_');
      const fileName = `${timestamp}_${cleanFileName}`;
      
      // Use folder structure: user_id/fieldName/filename
      const filePath = `${user.id}/${fieldName}/${fileName}`;
      
      // Determine bucket based on file type
      const bucket = file.type.startsWith('image/') ? 'logos' : 'documents';
      
      console.log(`Uploading to bucket: ${bucket}, path: ${filePath}`);
      
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        console.error('Storage error details:', error);
        
        // Handle specific error cases
        if (error.message.includes('row-level security')) {
          throw new Error('Permission denied. Please contact support.');
        } else if (error.message.includes('bucket')) {
          throw new Error(`Storage bucket not found.`);
        } else {
          throw error;
        }
      }
      
      console.log('Upload successful:', data);
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

      if (error && error.code !== 'PGRST116') {
        console.error('Error checking existing registration:', error);
      }

      return data;
    } catch (error) {
      console.error('Error:', error);
      return null;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!user) {
      showAlert('error', 'Please log in to complete registration');
      navigate('/login');
      return;
    }

    if (!validateStep()) return;

    setLoading(true);
    try {
      // Check if user already has a registration
      const existingReg = await checkExistingRegistration(user.id);
      if (existingReg) {
        showAlert('error', `You have already submitted a registration. Status: ${existingReg.status}`);
        setTimeout(() => navigate('/dashboard'), 2000);
        return;
      }

      // Upload all files first
      const filePaths = {};
      let uploadErrors = [];
      let successfulUploads = 0;
      
      for (const [key, file] of Object.entries(files)) {
        if (file) {
          try {
            const path = await uploadFile(file, key);
            const dbColumnName = columnNameMapping[key];
            if (dbColumnName) {
              filePaths[dbColumnName] = path;
              successfulUploads++;
              console.log(`✅ Uploaded ${key} to ${dbColumnName}:`, path);
            }
          } catch (uploadError) {
            console.error(`❌ Error uploading ${key}:`, uploadError);
            uploadErrors.push(`${key}: ${uploadError.message}`);
          }
        }
      }

      if (uploadErrors.length > 0) {
        throw new Error(`File upload errors: ${uploadErrors.join(', ')}`);
      }

      if (successfulUploads !== Object.keys(files).length) {
        throw new Error('Not all files were uploaded successfully');
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

      console.log('Inserting organization data:', organizationData);

      const { data, error: insertError } = await supabase
        .from('organizations')
        .insert([organizationData])
        .select();

      if (insertError) {
        console.error('Insert error:', insertError);
        
        if (insertError.code === '23505') {
          throw new Error('An organization with this email already exists');
        } else if (insertError.message.includes('row-level security')) {
          throw new Error('Permission denied. Please make sure you are logged in correctly.');
        } else {
          throw insertError;
        }
      }

      console.log('✅ Registration successful:', data);
      
      // Clear saved form data
      localStorage.removeItem('registrationFormData');
      
      showAlert('success', 'Registration successful! Redirecting to dashboard...');
      
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
      
    } catch (error) {
      console.error('❌ Error details:', error);
      showAlert('error', error.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => {
    if (validateStep()) {
      setCurrentStep(prev => Math.min(prev + 1, 4));
      window.scrollTo(0, 0);
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
    window.scrollTo(0, 0);
  };

  const testStorageUpload = async () => {
    try {
      if (!user) {
        showAlert('error', 'Please login first');
        return;
      }

      showAlert('info', 'Testing storage upload...');

      // Create a test file
      const testContent = 'This is a test file';
      const testFile = new File([testContent], 'test.txt', { type: 'text/plain' });
      const testPath = `${user.id}/test/test_${Date.now()}.txt`;
      
      console.log('Testing upload to documents bucket...');
      
      const { data, error } = await supabase.storage
        .from('documents')
        .upload(testPath, testFile);

      if (error) {
        console.error('Test upload failed:', error);
        showAlert('error', `Storage test failed: ${error.message}`);
        return;
      }
      
      console.log('Test upload successful:', data);
      showAlert('success', 'Storage is working! Test file uploaded.');
      
      // Clean up - delete test file
      await supabase.storage.from('documents').remove([testPath]);
      
    } catch (error) {
      console.error('Test error:', error);
      showAlert('error', `Test error: ${error.message}`);
    }
  };

  if (!user) {
    return (
      <div className="registration-container">
        <div className="auth-message">
          <h2>Please Log In</h2>
          <p>You need to be logged in to complete the registration.</p>
          <button onClick={() => navigate('/login')} className="btn">
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="registration-container">
      {alert && (
        <div className={`mui-alert mui-alert-${alert.type}`}>
          <span className="material-icons mui-alert-icon">
            {alert.type === 'success' ? 'check_circle' : alert.type === 'info' ? 'info' : 'error'}
          </span>
          <span>{alert.message}</span>
        </div>
      )}

      <center>
        <h1 style={{ color: '#15e420' }}>KACCIMA Member Registration</h1>
        <p className="registration-progress">Step {currentStep} of 4</p>
        <button 
          type="button" 
          onClick={testStorageUpload}
          className="btn outline"
          style={{ marginBottom: '20px', marginRight: '10px' }}
        >
          Test Storage
        </button>
      </center>
      
      <form onSubmit={handleSubmit}>
        {/* Step 1 - Company Information */}
        {currentStep === 1 && (
          <div className="form-step active">
            <h2>Company Information</h2>
            <div className="form-row">
              <div className="form-group">
                <label>Company Name *</label>
                <input
                  type="text"
                  name="companyName"
                  value={formData.companyName}
                  onChange={handleInputChange}
                  required
                  placeholder="Enter your company name"
                />
              </div>
              <div className="form-group">
                <label>Office Address *</label>
                <input
                  type="text"
                  name="officeAddress"
                  value={formData.officeAddress}
                  onChange={handleInputChange}
                  required
                  placeholder="Enter office address"
                />
              </div>
            </div>
            
            <div className="form-group">
              <label>Nature of Business *</label>
              <div className="business-options">
                {businessNatureOptions.map((option, index) => (
                  <label key={index} className="business-option">
                    <input
                      type="radio"
                      name="businessNature"
                      value={option}
                      checked={formData.businessNature === option}
                      onChange={handleInputChange}
                      required
                    />
                    {option}
                  </label>
                ))}
              </div>
            </div>
            
            <div className="form-navigation">
              <button type="button" className="btn next-step" onClick={nextStep}>
                Next Step
              </button>
            </div>
          </div>
        )}

        {/* Step 2 - Company Details */}
        {currentStep === 2 && (
          <div className="form-step active">
            <h2>Company Details</h2>
            <div className="form-row">
              <div className="form-group">
                <label>Number of directors *</label>
                <div className="inline-inputs">
                  <input
                    type="number"
                    name="nigerianDirectors"
                    placeholder="Nigerian"
                    value={formData.nigerianDirectors}
                    onChange={handleInputChange}
                    min="0"
                    required
                  />
                  <input
                    type="number"
                    name="nonNigerianDirectors"
                    placeholder="Non-Nigerian"
                    value={formData.nonNigerianDirectors}
                    onChange={handleInputChange}
                    min="0"
                    required
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Number of employees *</label>
                <div className="inline-inputs">
                  <input
                    type="number"
                    name="nigerianEmployees"
                    placeholder="Nigerian"
                    value={formData.nigerianEmployees}
                    onChange={handleInputChange}
                    min="0"
                    required
                  />
                  <input
                    type="number"
                    name="nonNigerianEmployees"
                    placeholder="Non-Nigerian"
                    value={formData.nonNigerianEmployees}
                    onChange={handleInputChange}
                    min="0"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Bankers *</label>
                <input
                  type="text"
                  name="bankers"
                  value={formData.bankers}
                  onChange={handleInputChange}
                  required
                  placeholder="Name of your bank"
                />
              </div>
              <div className="form-group">
                <label>Contact person *</label>
                <input
                  type="text"
                  name="contactPerson"
                  value={formData.contactPerson}
                  onChange={handleInputChange}
                  required
                  placeholder="Primary contact person"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Representative *</label>
                <input
                  type="text"
                  name="representative"
                  value={formData.representative}
                  onChange={handleInputChange}
                  required
                  placeholder="Company representative"
                />
              </div>
              <div className="form-group">
                <label>Email Address *</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="company@example.com"
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>CAC Registration Number *</label>
                <input
                  type="text"
                  name="cacNumber"
                  value={formData.cacNumber}
                  onChange={handleInputChange}
                  placeholder="e.g. RC1234567"
                  required
                />
              </div>
              <div className="form-group">
                <label>Phone Number *</label>
                <input
                  type="tel"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleInputChange}
                  placeholder="+234xxxxxxxxxx"
                  pattern="^\+?\d{10,15}$"
                  required
                />
              </div>
            </div>

            <div className="form-navigation">
              <button type="button" className="btn prev-step" onClick={prevStep}>
                Previous
              </button>
              <button type="button" className="btn next-step" onClick={nextStep}>
                Next Step
              </button>
            </div>
          </div>
        )}

        {/* Step 3 - Referees */}
        {currentStep === 3 && (
          <div className="form-step active">
            <h2>Referees Information</h2>
            <p className="form-instruction">
              Please provide details of two financial members of the Chamber who will serve as your referees.
            </p>
            
            <div className="form-section">
              <h3>Referee 1 *</h3>
              <div className="form-row">
                <div className="form-group">
                  <label>Full Name</label>
                  <input
                    type="text"
                    name="referee1Name"
                    value={formData.referee1Name}
                    onChange={handleInputChange}
                    required
                    placeholder="Referee's full name"
                  />
                </div>
                <div className="form-group">
                  <label>Business Name</label>
                  <input
                    type="text"
                    name="referee1Business"
                    value={formData.referee1Business}
                    onChange={handleInputChange}
                    required
                    placeholder="Referee's business name"
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Phone Number</label>
                  <input
                    type="tel"
                    name="referee1Phone"
                    value={formData.referee1Phone}
                    onChange={handleInputChange}
                    required
                    placeholder="+234xxxxxxxxxx"
                  />
                </div>
                <div className="form-group">
                  <label>Chamber Registration Number</label>
                  <input
                    type="text"
                    name="referee1RegNumber"
                    value={formData.referee1RegNumber}
                    onChange={handleInputChange}
                    required
                    placeholder="Referee's registration number"
                  />
                </div>
              </div>
            </div>

            <div className="form-section">
              <h3>Referee 2 *</h3>
              <div className="form-row">
                <div className="form-group">
                  <label>Full Name</label>
                  <input
                    type="text"
                    name="referee2Name"
                    value={formData.referee2Name}
                    onChange={handleInputChange}
                    required
                    placeholder="Referee's full name"
                  />
                </div>
                <div className="form-group">
                  <label>Business Name</label>
                  <input
                    type="text"
                    name="referee2Business"
                    value={formData.referee2Business}
                    onChange={handleInputChange}
                    required
                    placeholder="Referee's business name"
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Phone Number</label>
                  <input
                    type="tel"
                    name="referee2Phone"
                    value={formData.referee2Phone}
                    onChange={handleInputChange}
                    required
                    placeholder="+234xxxxxxxxxx"
                  />
                </div>
                <div className="form-group">
                  <label>Chamber Registration Number</label>
                  <input
                    type="text"
                    name="referee2RegNumber"
                    value={formData.referee2RegNumber}
                    onChange={handleInputChange}
                    required
                    placeholder="Referee's registration number"
                  />
                </div>
              </div>
            </div>

            <div className="form-navigation">
              <button type="button" className="btn prev-step" onClick={prevStep}>
                Previous
              </button>
              <button type="button" className="btn next-step" onClick={nextStep}>
                Next Step
              </button>
            </div>
          </div>
        )}

        {/* Step 4 - Documents */}
        {currentStep === 4 && (
          <div className="form-step active">
            <h2>Upload Required Documents</h2>
            <p className="form-instruction">
              Please upload all required documents in PDF format (except logo which can be JPG/PNG).
              Maximum file size: 10MB for PDFs, 5MB for images.
            </p>
            
            <div className="form-row">
              <div className="form-group">
                <label>Covering Letter *</label>
                <input
                  type="file"
                  name="coverLetter"
                  accept=".pdf"
                  onChange={handleFileChange}
                  required
                />
                {fileNames.coverLetter && (
                  <small className="file-name">Selected: {fileNames.coverLetter}</small>
                )}
              </div>
              <div className="form-group">
                <label>Memorandum & Articles *</label>
                <input
                  type="file"
                  name="memorandum"
                  accept=".pdf"
                  onChange={handleFileChange}
                  required
                />
                {fileNames.memorandum && (
                  <small className="file-name">Selected: {fileNames.memorandum}</small>
                )}
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Business Name Certificate *</label>
                <input
                  type="file"
                  name="registrationCert"
                  accept=".pdf"
                  onChange={handleFileChange}
                  required
                />
                {fileNames.registrationCert && (
                  <small className="file-name">Selected: {fileNames.registrationCert}</small>
                )}
              </div>
              <div className="form-group">
                <label>Incorporation Certificate *</label>
                <input
                  type="file"
                  name="incorporationCert"
                  accept=".pdf"
                  onChange={handleFileChange}
                  required
                />
                {fileNames.incorporationCert && (
                  <small className="file-name">Selected: {fileNames.incorporationCert}</small>
                )}
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Business Premises Certificate *</label>
                <input
                  type="file"
                  name="premisesCert"
                  accept=".pdf"
                  onChange={handleFileChange}
                  required
                />
                {fileNames.premisesCert && (
                  <small className="file-name">Selected: {fileNames.premisesCert}</small>
                )}
              </div>
              <div className="form-group">
                <label>Company Logo *</label>
                <input
                  type="file"
                  name="companyLogo"
                  accept=".jpg,.jpeg,.png"
                  onChange={handleFileChange}
                  required
                />
                {fileNames.companyLogo && (
                  <small className="file-name">Selected: {fileNames.companyLogo}</small>
                )}
              </div>
            </div>

            <div className="form-section">
              <h3>Means of Identification</h3>
              <div className="form-row">
                <div className="form-group">
                  <label>Select Identification Type *</label>
                  <select
                    name="idType"
                    value={formData.idType}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">-- Select One --</option>
                    <option value="national_id">National ID</option>
                    <option value="driver_license">Driver's License</option>
                    <option value="voter_card">Voter's Card</option>
                    <option value="international_passport">International Passport</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Form C07 *</label>
                  <input
                    type="file"
                    name="formC07"
                    accept=".pdf"
                    onChange={handleFileChange}
                    required
                  />
                  {fileNames.formC07 && (
                    <small className="file-name">Selected: {fileNames.formC07}</small>
                  )}
                </div>
                <div className="form-group">
                  <label>ID Document *</label>
                  <input
                    type="file"
                    name="idDocument"
                    accept=".pdf"
                    onChange={handleFileChange}
                    required
                  />
                  {fileNames.idDocument && (
                    <small className="file-name">Selected: {fileNames.idDocument}</small>
                  )}
                </div>
              </div>
            </div>

            <div className="form-navigation">
              <button type="button" className="btn prev-step" onClick={prevStep}>
                Previous
              </button>
              <button type="submit" className="btn submit" disabled={loading}>
                {loading ? 'Submitting...' : 'Submit Registration'}
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
};

export default RegistrationForm;