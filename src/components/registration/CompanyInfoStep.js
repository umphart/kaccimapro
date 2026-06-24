import React from 'react';
import { states, getLgasByState } from './nigerianStates'; // Correct import path

const CompanyInfoStep = ({ formData, handleInputChange, businessNatureOptions, onNext }) => {
  // Get LGAs for selected state
  const lgaOptions = formData.state ? getLgasByState(formData.state) : [];

  // Handle checkbox change for Nature of Business
  const handleBusinessNatureCheckbox = (option) => {
    const currentValues = formData.businessNature || [];
    let newValues;
    
    if (currentValues.includes(option)) {
      newValues = currentValues.filter(value => value !== option);
    } else {
      newValues = [...currentValues, option];
    }
    
    handleInputChange({
      target: {
        name: 'businessNature',
        value: newValues
      }
    });
  };

  return (
    <div className="form-step active">
      <h2>Company Information</h2>
      
      <div className="form-row">
        <div className="form-group">
          <label>Company Name *</label>
          <input
            type="text"
            name="companyName"
            value={formData.companyName || ''}
            onChange={handleInputChange}
            required
            placeholder="Enter your company name"
          />
        </div>
        <div className="form-group">
          <label>Email Address *</label>
          <input
            type="email"
            name="email"
            value={formData.email || ''}
            onChange={handleInputChange}
            placeholder="company@example.com"
            required
          />
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label>Phone Number *</label>
          <input
            type="tel"
            name="phoneNumber"
            value={formData.phoneNumber || ''}
            onChange={handleInputChange}
            placeholder="+234xxxxxxxxxx"
            pattern="^\+?\d{10,15}$"
            required
          />
        </div>
        <div className="form-group">
          <label>CAC Registration Number *</label>
          <input
            type="text"
            name="cacNumber"
            value={formData.cacNumber || ''}
            onChange={handleInputChange}
            placeholder="e.g., RC1234567"
            required
          />
        </div>
      </div>

      <div className="form-group">
        <label>Nature of Business * (Select all that apply)</label>
        <div className="checkbox-grid">
          {businessNatureOptions.map((option, index) => (
            <label key={index} className="checkbox-option">
              <input
                type="checkbox"
                checked={(formData.businessNature || []).includes(option)}
                onChange={() => handleBusinessNatureCheckbox(option)}
              />
              {option}
            </label>
          ))}
        </div>
        <small className="field-hint">Select all business nature categories that apply to your company</small>
      </div>

      <div className="form-group">
        <label>Specified Type of Goods Sold</label>
        <input
          type="text"
          name="specifiedGoods"
          value={formData.specifiedGoods || ''}
          onChange={handleInputChange}
          placeholder="e.g., Electronics, Food Items, Machinery, etc."
        />
      </div>

      <div className="form-group">
        <label>Additional Details about Goods Sold</label>
        <textarea
          name="goodsDetails"
          value={formData.goodsDetails || ''}
          onChange={handleInputChange}
          placeholder="Please provide additional details about the goods you sell, including any specific categories, brands, or specializations..."
          rows="3"
        />
      </div>

      {/* Address Section - State first, then LGA */}
      <div className="address-section">
        <h3>Company Address</h3>
        
        <div className="form-row">
          <div className="form-group">
            <label>House Number *</label>
            <input
              type="text"
              name="houseNumber"
              value={formData.houseNumber || ''}
              onChange={handleInputChange}
              placeholder="e.g., 12A"
              required
            />
          </div>
          <div className="form-group">
            <label>Street Name *</label>
            <input
              type="text"
              name="streetName"
              value={formData.streetName || ''}
              onChange={handleInputChange}
              placeholder="e.g., Awolowo Road, Ikeja"
              required
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>State *</label>
            <select
              name="state"
              value={formData.state || ''}
              onChange={handleInputChange}
              required
            >
              <option value="">Select State</option>
              {states.map(state => (
                <option key={state} value={state}>{state}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Local Government Area (LGA) *</label>
            <select
              name="lga"
              value={formData.lga || ''}
              onChange={handleInputChange}
              required
              disabled={!formData.state}
            >
              <option value="">{formData.state ? 'Select LGA' : 'Select State first'}</option>
              {lgaOptions.map(lga => (
                <option key={lga} value={lga}>{lga}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="form-group">
          <label>Landmark</label>
          <input
            type="text"
            name="landmark"
            value={formData.landmark || ''}
            onChange={handleInputChange}
            placeholder="e.g., Near First Bank, Opposite Shopping Mall, Beside Church"
          />
        </div>
      </div>

      <div className="form-navigation">
        <button type="button" className="btn next-step" onClick={onNext}>
          Next Step
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
        .checkbox-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 10px;
          padding: 10px 0;
        }
        .checkbox-option {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 12px;
          border: 1px solid #ddd;
          border-radius: 4px;
          cursor: pointer;
          transition: all 0.2s ease;
          background-color: white;
        }
        .checkbox-option:hover {
          background-color: #f0f0f0;
          border-color: #15e420;
        }
        .checkbox-option input[type="checkbox"] {
          width: 18px;
          height: 18px;
          cursor: pointer;
          accent-color: #15e420;
        }
        .address-section {
          background-color: #f9f9f9;
          padding: 20px;
          border-radius: 8px;
          margin: 20px 0;
          border: 1px solid #e0e0e0;
        }
        .address-section h3 {
          color: #333;
          margin-bottom: 15px;
          border-bottom: 2px solid #15e420;
          padding-bottom: 10px;
        }
        textarea {
          width: 100%;
          padding: 10px;
          border: 1px solid #ddd;
          border-radius: 4px;
          resize: vertical;
          min-height: 80px;
          font-family: inherit;
        }
        textarea:focus {
          outline: none;
          border-color: #15e420;
          box-shadow: 0 0 0 2px rgba(21, 228, 32, 0.1);
        }
        select:disabled {
          background-color: #f5f5f5;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
};

export default CompanyInfoStep;