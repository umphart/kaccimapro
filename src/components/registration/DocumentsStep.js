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
  return (
    <div className="form-step active">
      <h2>Upload Required Documents</h2>
      <p className="form-instruction">
        Please upload all required documents in PDF format (except logo which can be JPG/PNG).
        Maximum file size: 10MB for PDFs, 5MB for images.
        <br />

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
          <label>Memorandum & Articles <span style={{ color: '#666', fontWeight: 'normal' }}>(Optional)</span></label>
          <input
            type="file"
            name="memorandum"
            accept=".pdf"
            onChange={handleFileChange}
          />
          {fileNames.memorandum && (
            <small className="file-name">Selected: {fileNames.memorandum}</small>
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
          <label>Business Premises Certificate <span style={{ color: '#666', fontWeight: 'normal' }}>(Optional)</span></label>
          <input
            type="file"
            name="premisesCert"
            accept=".pdf"
            onChange={handleFileChange}
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
            <label>Form C07 <span style={{ color: '#666', fontWeight: 'normal' }}>(Optional)</span></label>
            <input
              type="file"
              name="formC07"
              accept=".pdf"
              onChange={handleFileChange}
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
              accept=".pdf,.jpg,.jpeg,.png"
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
        <button type="button" className="btn prev-step" onClick={onPrev}>
          Previous
        </button>
        <button type="button" className="btn submit" onClick={onSubmit} disabled={loading}>
          {loading ? 'Submitting...' : 'Submit Registration'}
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
      `}</style>
    </div>
  );
};

export default DocumentsStep;