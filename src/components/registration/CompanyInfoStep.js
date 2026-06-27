import React, { useState } from 'react';
import { states, getLgasByState } from './nigerianStates';

const businessNatureOptions = [
  'Manufacturing and Small-Scale/Cottage Industries',
  'Banking, Insurance, and Financial Institutions',
  'Distributive Trade and Commerce',
  'Construction, Engineering, Real Estate, Furniture, and Contractors',
  'Medical, Pharmaceuticals, and Allied Products',
  'Agricultural and Agro-Allied Products',
  'Automobile, Transport, Oil & Gas, and Allied Products',
  'Hotel, Trade Agencies, Tourism, Clearing & Forwarding, Air Courier Services',
  'Solid Minerals and Natural Resources',
  'Interrelationship, Business Promotion, Printing, and Publicity',
  'Women/Youth Development and Entrepreneurship Associations',
  'ICT, Telecommunications, and Digital Innovation'
];

const CompanyInfoStep = ({ formData, handleInputChange, onNext }) => {
  // Get LGAs for selected state
  const lgaOptions = formData.state ? getLgasByState(formData.state) : [];
  
  // State for dropdown open/close
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Toggle dropdown
  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

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

  // Remove a selected option
  const removeOption = (option) => {
    const newValues = formData.businessNature.filter(v => v !== option);
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

      {/* Nature of Business - Mobile-friendly dropdown with checkboxes */}
      <div className="form-group">
        <label>Nature of Business * (Select all that apply)</label>
        <div className="dropdown-container">
          <div className="dropdown-header" onClick={toggleDropdown}>
            <span className="dropdown-selected">
              {formData.businessNature && formData.businessNature.length > 0 
                ? `${formData.businessNature.length} selected` 
                : 'Select business nature...'}
            </span>
            <span className={`dropdown-arrow ${isDropdownOpen ? 'open' : ''}`}>▼</span>
          </div>
          
          {isDropdownOpen && (
            <div className="dropdown-options">
              {businessNatureOptions.map((option) => (
                <label key={option} className="dropdown-option">
                  <input
                    type="checkbox"
                    checked={(formData.businessNature || []).includes(option)}
                    onChange={() => handleBusinessNatureCheckbox(option)}
                  />
                  {option}
                </label>
              ))}
            </div>
          )}
        </div>
        
        {/* Selected chips display */}
        {formData.businessNature && formData.businessNature.length > 0 && (
          <div className="selected-chips">
            {formData.businessNature.map((value) => (
              <span key={value} className="chip">
                {value}
                <button
                  type="button"
                  className="chip-remove"
                  onClick={() => removeOption(value)}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}
        <small className="field-hint">Tap to select all that apply to your company</small>
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
        
        /* Dropdown Styles */
        .dropdown-container {
          position: relative;
          width: 100%;
        }
        
        .dropdown-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 10px 12px;
          border: 1px solid #ddd;
          border-radius: 6px;
          background-color: white;
          cursor: pointer;
          transition: border-color 0.2s ease;
          min-height: 44px;
        }
        
        .dropdown-header:hover {
          border-color: #15e420;
        }
        
        .dropdown-header:focus {
          outline: none;
          border-color: #15e420;
          box-shadow: 0 0 0 3px rgba(21, 228, 32, 0.1);
        }
        
        .dropdown-selected {
          color: #666;
          font-size: 0.9rem;
        }
        
        .dropdown-selected.has-selection {
          color: #333;
          font-weight: 500;
        }
        
        .dropdown-arrow {
          font-size: 0.7rem;
          color: #999;
          transition: transform 0.3s ease;
        }
        
        .dropdown-arrow.open {
          transform: rotate(180deg);
        }
        
        .dropdown-options {
          position: absolute;
          top: calc(100% + 4px);
          left: 0;
          right: 0;
          max-height: 250px;
          overflow-y: auto;
          background-color: white;
          border: 1px solid #ddd;
          border-radius: 6px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          z-index: 1000;
        }
        
        .dropdown-options::-webkit-scrollbar {
          width: 6px;
        }
        
        .dropdown-options::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 3px;
        }
        
        .dropdown-options::-webkit-scrollbar-thumb {
          background: #15e420;
          border-radius: 3px;
        }
        
        .dropdown-option {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 14px;
          cursor: pointer;
          transition: background-color 0.2s ease;
          font-size: 0.9rem;
          border-bottom: 1px solid #f5f5f5;
        }
        
        .dropdown-option:hover {
          background-color: #f5f5f5;
        }
        
        .dropdown-option:last-child {
          border-bottom: none;
        }
        
        .dropdown-option input[type="checkbox"] {
          width: 18px;
          height: 18px;
          cursor: pointer;
          accent-color: #15e420;
          flex-shrink: 0;
        }
        
        .dropdown-option input[type="checkbox"]:checked + label {
          font-weight: 500;
        }
        
        /* Selected Chips */
        .selected-chips {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-top: 10px;
          padding: 10px;
          background-color: #f8f9fa;
          border-radius: 8px;
          border: 1px solid #e0e0e0;
          min-height: 20px;
        }
        
        .chip {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 4px 10px;
          background-color: #e8f5e9;
          color: #2e7d32;
          border-radius: 16px;
          font-size: 0.8rem;
          font-weight: 500;
          border: 1px solid #c8e6c9;
        }
        
        .chip-remove {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 18px;
          height: 18px;
          border: none;
          border-radius: 50%;
          background: rgba(0, 0, 0, 0.1);
          color: #666;
          cursor: pointer;
          font-size: 14px;
          font-weight: 700;
          transition: all 0.2s ease;
          padding: 0;
          line-height: 1;
        }
        
        .chip-remove:hover {
          background: rgba(0, 0, 0, 0.2);
          color: #333;
        }
        
        /* Address Section */
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
        
        .form-row {
          display: flex;
          gap: 20px;
          margin-bottom: 20px;
          flex-wrap: wrap;
        }
        
        .form-group {
          flex: 1;
          min-width: 200px;
        }
        
        .form-group label {
          display: block;
          margin-bottom: 6px;
          font-weight: 600;
          font-size: 0.9rem;
          color: #333;
        }
        
        .form-group input,
        .form-group select,
        .form-group textarea {
          width: 100%;
          padding: 10px 12px;
          border: 1px solid #ddd;
          border-radius: 6px;
          font-size: 0.9rem;
          transition: border-color 0.2s ease;
          background-color: white;
        }
        
        .form-group input:focus,
        .form-group select:focus,
        .form-group textarea:focus {
          outline: none;
          border-color: #15e420;
          box-shadow: 0 0 0 3px rgba(21, 228, 32, 0.1);
        }
        
        .form-navigation {
          display: flex;
          justify-content: flex-end;
          margin-top: 30px;
          padding-top: 20px;
          border-top: 1px solid #e0e0e0;
        }
        
        .btn {
          padding: 12px 32px;
          border: none;
          border-radius: 8px;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
        }
        
        .btn.next-step {
          background: linear-gradient(135deg, #15e420 0%, #0fa819 100%);
          color: white;
        }
        
        .btn.next-step:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(21, 228, 32, 0.3);
        }
        
        .btn.next-step:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }
        
        /* Mobile Responsive */
        @media (max-width: 600px) {
          .form-row {
            flex-direction: column;
            gap: 15px;
          }
          
          .form-group {
            min-width: 100%;
          }
          
          .dropdown-options {
            max-height: 200px;
          }
          
          .dropdown-option {
            padding: 12px 14px;
            font-size: 0.95rem;
          }
          
          .dropdown-header {
            min-height: 48px;
            padding: 12px;
          }
        }
      `}</style>
    </div>
  );
};

export default CompanyInfoStep;