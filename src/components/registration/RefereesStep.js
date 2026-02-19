import React from 'react';

const RefereesStep = ({ formData, handleInputChange, onPrev, onNext }) => {
  return (
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

export default RefereesStep;