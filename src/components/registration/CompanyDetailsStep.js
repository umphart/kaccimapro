import React from 'react';

const CompanyDetailsStep = ({ formData, handleInputChange, onPrev, onNext }) => {
  return (
    <div className="form-step active">
      <h2>Company Details</h2>
      
      <div className="form-row">
        <div className="form-group">
          <label>Number of Directors *</label>
          <div className="inline-inputs">
            <input
              type="number"
              name="nigerianDirectors"
              placeholder="Nigerian"
              value={formData.nigerianDirectors || ''}
              onChange={handleInputChange}
              min="0"
              required
            />
            <input
              type="number"
              name="nonNigerianDirectors"
              placeholder="Non-Nigerian"
              value={formData.nonNigerianDirectors || ''}
              onChange={handleInputChange}
              min="0"
              required
            />
          </div>
        </div>
        <div className="form-group">
          <label>Number of Employees *</label>
          <div className="inline-inputs">
            <input
              type="number"
              name="nigerianEmployees"
              placeholder="Nigerian"
              value={formData.nigerianEmployees || ''}
              onChange={handleInputChange}
              min="0"
              required
            />
            <input
              type="number"
              name="nonNigerianEmployees"
              placeholder="Non-Nigerian"
              value={formData.nonNigerianEmployees || ''}
              onChange={handleInputChange}
              min="0"
              required
            />
          </div>
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label>Contact Person *</label>
          <input
            type="text"
            name="contactPerson"
            value={formData.contactPerson || ''}
            onChange={handleInputChange}
            required
            placeholder="Primary contact person's full name"
          />
        </div>
        <div className="form-group">
          <label>Representative *</label>
          <input
            type="text"
            name="representative"
            value={formData.representative || ''}
            onChange={handleInputChange}
            required
            placeholder="Company representative's full name"
          />
        </div>
      </div>

      <div className="form-navigation">
        <button type="button" className="btn prev-step" onClick={onPrev}>
          Previous
        </button>
        <button type="button" className="btn next-step" onClick={onNext}>
          Next Step
        </button>
      </div>
    </div>
  );
};

export default CompanyDetailsStep;