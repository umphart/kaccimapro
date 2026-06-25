import React from 'react';

const DocumentsStep = ({ 
  formData, 
  handleInputChange, 
  handleFileChange, 
  fileNames, 
  onPrev, 
  onSubmit,
  loading 
}) => {
  // Check if all required documents are uploaded
  const isFormValid = () => {
    const requiredFields = [
      'nin',
      'ninDocument',
      'coverLetter',
      'registrationCert',
      'incorporationCert',
      'companyLogo',
      'passport'
    ];
    
    for (let field of requiredFields) {
      if (field === 'nin') {
        if (!formData.nin || formData.nin.length !== 11) return false;
      } else if (!fileNames[field]) {
        return false;
      }
    }
    return true;
  };

  return (
    <div className="form-step active">
      <h2>Upload Required Documents</h2>
      <p className="form-instruction">
        Please upload all required documents in PDF format (except logo and passport which can be JPG/PNG).
        Maximum file size: 10MB for PDFs, 5MB for images.
      </p>
      
      {/* NIN Section - Only means of identification */}
      <div className="form-section">
        <h3>National Identification Number (NIN) *</h3>
        <div className="form-row">
          <div className="form-group">
            <label>NIN Number *</label>
            <input
              type="text"
              name="nin"
              value={formData.nin || ''}
              onChange={handleInputChange}
              placeholder="Enter your 11-digit NIN"
              pattern="[0-9]{11}"
              maxLength="11"
              required
            />
            <small className="field-hint">NIN must be exactly 11 digits</small>
          </div>
          <div className="form-group">
            <label>NIN ID Document *</label>
            <input
              type="file"
              name="ninDocument"
              onChange={handleFileChange}
              accept=".pdf,.jpg,.jpeg,.png"
              required
            />
            {fileNames.ninDocument && (
              <small className="file-name">✅ Selected: {fileNames.ninDocument}</small>
            )}
            <small className="field-hint">Accepted formats: PDF, JPG, JPEG, PNG</small>
          </div>
        </div>
      </div>

      {/* Company Documents */}
      <div className="form-section">
        <h3>Company Documents</h3>
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
              <small className="file-name">✅ Selected: {fileNames.coverLetter}</small>
            )}
          </div>
          <div className="form-group">
            <label>Memorandum & Articles <span style={{ color: '#666', fontWeight: 'normal' }}>(Optional)</span></label>
            <input
              type="file"
              name="memorandum"
              accept=".pdf"
              onChange={handleFileChange}
            />
            {fileNames.memorandum && (
              <small className="file-name">✅ Selected: {fileNames.memorandum}</small>
            )}
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Registration Certificate *</label>
            <input
              type="file"
              name="registrationCert"
              accept=".pdf"
              onChange={handleFileChange}
              required
            />
            {fileNames.registrationCert && (
              <small className="file-name">✅ Selected: {fileNames.registrationCert}</small>
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
              <small className="file-name">✅ Selected: {fileNames.incorporationCert}</small>
            )}
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Business Premises Certificate <span style={{ color: '#666', fontWeight: 'normal' }}>(Optional)</span></label>
            <input
              type="file"
              name="premisesCert"
              accept=".pdf"
              onChange={handleFileChange}
            />
            {fileNames.premisesCert && (
              <small className="file-name">✅ Selected: {fileNames.premisesCert}</small>
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
              <small className="file-name">✅ Selected: {fileNames.companyLogo}</small>
            )}
            <small className="field-hint">Recommended: 200x200px, JPG/PNG format</small>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Form C07 <span style={{ color: '#666', fontWeight: 'normal' }}>(Optional)</span></label>
            <input
              type="file"
              name="formC07"
              accept=".pdf"
              onChange={handleFileChange}
            />
            {fileNames.formC07 && (
              <small className="file-name">✅ Selected: {fileNames.formC07}</small>
            )}
          </div>
          <div className="form-group">
            <label>Passport Photograph *</label>
            <input
              type="file"
              name="passport"
              accept=".jpg,.jpeg,.png"
              onChange={handleFileChange}
              required
            />
            {fileNames.passport && (
              <small className="file-name">✅ Selected: {fileNames.passport}</small>
            )}
            <small className="field-hint">Accepted formats: JPG, JPEG, PNG</small>
          </div>
        </div>
      </div>

      {/* Validation Summary */}
      <div className="validation-summary">
        <h4>Required Documents Status:</h4>
        <ul>
          <li className={formData.nin && formData.nin.length === 11 ? 'valid' : 'invalid'}>
            {formData.nin && formData.nin.length === 11 ? '✅' : '❌'} NIN Number (11 digits)
          </li>
          <li className={fileNames.ninDocument ? 'valid' : 'invalid'}>
            {fileNames.ninDocument ? '✅' : '❌'} NIN ID Document
          </li>
          <li className={fileNames.coverLetter ? 'valid' : 'invalid'}>
            {fileNames.coverLetter ? '✅' : '❌'} Covering Letter
          </li>
          <li className={fileNames.registrationCert ? 'valid' : 'invalid'}>
            {fileNames.registrationCert ? '✅' : '❌'} Registration Certificate
          </li>
          <li className={fileNames.incorporationCert ? 'valid' : 'invalid'}>
            {fileNames.incorporationCert ? '✅' : '❌'} Incorporation Certificate
          </li>
          <li className={fileNames.companyLogo ? 'valid' : 'invalid'}>
            {fileNames.companyLogo ? '✅' : '❌'} Company Logo
          </li>
          <li className={fileNames.passport ? 'valid' : 'invalid'}>
            {fileNames.passport ? '✅' : '❌'} Passport Photograph
          </li>
        </ul>
      </div>

      <div className="form-navigation">
        <button type="button" className="btn prev-step" onClick={onPrev}>
          Previous
        </button>
        <button 
          type="button" 
          className="btn submit" 
          onClick={onSubmit} 
          disabled={loading || !isFormValid()}
        >
          {loading ? (
            <>
              <span className="spinner"></span>
              Submitting...
            </>
          ) : (
            'Submit Registration'
          )}
        </button>
      </div>

      <style jsx>{`
        .field-hint {
          display: block;
          color: #999;
          font-size: 11px;
          margin-top: 4px;
          font-style: italic;
        }
        
        .file-name {
          display: inline-block;
          margin-top: 5px;
          padding: 4px 8px;
          background-color: #e8f5e9;
          color: #2e7d32;
          border-radius: 4px;
          font-size: 12px;
        }
        
        .form-section {
          background-color: #f9f9f9;
          padding: 20px;
          border-radius: 8px;
          margin: 20px 0;
          border: 1px solid #e0e0e0;
        }
        
        .form-section h3 {
          color: #333;
          margin-bottom: 15px;
          border-bottom: 2px solid #15e420;
          padding-bottom: 10px;
        }
        
        .validation-summary {
          margin: 20px 0;
          padding: 15px;
          background-color: #f5f5f5;
          border-radius: 8px;
          border: 1px solid #e0e0e0;
        }
        
        .validation-summary h4 {
          margin-top: 0;
          color: #333;
        }
        
        .validation-summary ul {
          list-style: none;
          padding: 0;
          margin: 10px 0;
        }
        
        .validation-summary li {
          padding: 4px 0;
          font-size: 14px;
        }
        
        .validation-summary li.valid {
          color: #2e7d32;
        }
        
        .validation-summary li.invalid {
          color: #c62828;
        }
        
        .btn.submit:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        
        .spinner {
          display: inline-block;
          width: 16px;
          height: 16px;
          border: 2px solid white;
          border-top-color: transparent;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
          margin-right: 8px;
        }
        
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default DocumentsStep;