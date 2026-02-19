import React from 'react';

const CompanyInfoStep = ({ formData, handleInputChange, businessNatureOptions, onNext }) => {
  return (
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
        <button type="button" className="btn next-step" onClick={onNext}>
          Next Step
        </button>
      </div>
    </div>
  );
};

export default CompanyInfoStep;