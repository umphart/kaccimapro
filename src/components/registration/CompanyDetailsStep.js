import React from 'react';

const CompanyDetailsStep = ({ formData, handleInputChange, onPrev, onNext }) => {
  return (
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