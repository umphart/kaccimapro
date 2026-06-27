import React, { useState } from 'react';
import { supabase } from '../../supabaseClient';
import { sendRefereeConfirmationEmail } from '../../utils/emailService';

const RefereesStep = ({ formData, handleInputChange, onPrev, onNext }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [refereeStatus, setRefereeStatus] = useState(null);
  const [emailError, setEmailError] = useState(null);
  
  // Custom confirmation modal state
  const [confirmationModal, setConfirmationModal] = useState({
    open: false,
    title: '',
    message: '',
    type: 'success', // 'success', 'error', 'warning'
    onConfirm: null
  });

  // Show confirmation modal
  const showConfirmation = (title, message, type = 'info', onConfirm = null) => {
    setConfirmationModal({
      open: true,
      title,
      message,
      type,
      onConfirm
    });
  };

  const closeConfirmation = () => {
    setConfirmationModal({
      open: false,
      title: '',
      message: '',
      type: 'info',
      onConfirm: null
    });
  };

  // Handle referee registration number input with auto-fill
  const handleRefereeRegChange = async (e) => {
    const value = e.target.value;
    
    // Update the form data
    handleInputChange(e);
    
    // If the input is cleared, reset the form
    if (!value || value.length < 3) {
      setSearchResults([]);
      setShowResults(false);
      setRefereeStatus(null);
      return;
    }

    // Search for matching organizations
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('organizations_registry')
        .select('registration_number, company_name, referee_name, referee_business, referee_phone, email, phone_number1, status, id')
        .ilike('registration_number', `%${value}%`)
        .limit(5);

      if (error) throw error;
      
      setSearchResults(data || []);
      setShowResults(data && data.length > 0);
      setRefereeStatus(null);
    } catch (error) {
      console.error('Error searching for referee:', error);
      setSearchResults([]);
      setShowResults(false);
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-fill referee details when a result is selected
  const autoFillRefereeDetails = (referee) => {
    // Update form data with referee details
    handleInputChange({
      target: {
        name: 'refereeName',
        value: referee.referee_name || referee.company_name || ''
      }
    });

    handleInputChange({
      target: {
        name: 'refereeBusiness',
        value: referee.referee_business || referee.company_name || ''
      }
    });

    handleInputChange({
      target: {
        name: 'refereePhone',
        value: referee.referee_phone || referee.phone_number1 || ''
      }
    });

    handleInputChange({
      target: {
        name: 'refereeEmail',
        value: referee.email || ''
      }
    });

    handleInputChange({
      target: {
        name: 'refereeRegNumber',
        value: referee.registration_number
      }
    });

    handleInputChange({
      target: {
        name: 'refereeId',
        value: referee.id
      }
    });

    // Set referee status
    setRefereeStatus(referee.status || 'active');
    setEmailError(null);

    // Hide search results
    setShowResults(false);
    setSearchResults([]);
  };

  // Send confirmation email to referee
  const sendRefereeConfirmation = async () => {
    const refereeEmail = formData.refereeEmail;
    const refereeName = formData.refereeName;
    const applicantName = formData.companyName || 'A company';
    const applicantRegNumber = formData.cacNumber || 'N/A';

    if (!refereeEmail) {
      setEmailError('Please select a referee first');
      return;
    }

    setEmailError(null);
    setIsSendingEmail(true);
    try {
      const result = await sendRefereeConfirmationEmail({
        refereeEmail,
        refereeName,
        applicantName,
        applicantRegNumber,
        applicantPhone: formData.phoneNumber || 'N/A',
        applicantEmail: formData.email || 'N/A',
        status: refereeStatus || 'pending'
      });

      if (result.success) {
        setEmailSent(true);
        handleInputChange({
          target: {
            name: 'refereeEmailSent',
            value: true
          }
        });
        
        // Show custom success modal instead of alert
        showConfirmation(
          'Email Sent!',
          `Confirmation email has been sent to ${refereeName} (${refereeEmail})`,
          'success'
        );
      } else {
        setEmailError('Failed to send confirmation email. Please try again.');
        showConfirmation(
          '❌ Failed to Send',
          'There was an error sending the confirmation email. Please try again.',
          'error'
        );
      }
    } catch (error) {
      console.error('Error sending referee confirmation:', error);
      setEmailError('Error sending email. Please try again.');
      showConfirmation(
        '❌ Error',
        'An unexpected error occurred while sending the email. Please try again.',
        'error'
      );
    } finally {
      setIsSendingEmail(false);
    }
  };

  return (
    <div className="form-step active">
      <h2>Referee Information</h2>
      <p className="form-instruction">
        Please provide details of one financial member of the Chamber who will serve as your referee.
        Enter their Chamber Registration Number to auto-fill their details.
      </p>
      
      <div className="form-section">
        <h3>Referee Details *</h3>
        
        <div className="form-row">
          <div className="form-group">
            <label>Chamber Registration Number *</label>
            <div className="referee-search-container">
              <input
                type="text"
                name="refereeRegNumber"
                value={formData.refereeRegNumber || ''}
                onChange={handleRefereeRegChange}
                required
                placeholder="Enter KACCIMA registration number to search"
                className={isLoading ? 'loading' : ''}
              />
              {isLoading && <span className="loading-spinner">Searching...</span>}
              
              {/* Search Results Dropdown */}
              {showResults && searchResults.length > 0 && (
                <div className="search-results-dropdown">
                  {searchResults.map((result, index) => (
                    <div 
                      key={index}
                      className="search-result-item"
                      onClick={() => autoFillRefereeDetails(result)}
                    >
                      <div className="result-main">
                        <strong>{result.registration_number}</strong>
                        <span>{result.company_name}</span>
                      </div>
                      <div className="result-detail">
                        {result.referee_name && `Referee: ${result.referee_name}`}
                        {result.email && ` | ${result.email}`}
                        {result.status && (
                          <span className={`status-badge status-${result.status}`}>
                            {result.status}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              {showResults && searchResults.length === 0 && !isLoading && (
                <div className="search-results-dropdown no-results">
                  <span>No matching organization found</span>
                </div>
              )}
            </div>
            <small className="field-hint">Start typing the Chamber Registration Number to search</small>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Full Name *</label>
            <input
              type="text"
              name="refereeName"
              value={formData.refereeName || ''}
              onChange={handleInputChange}
              required
              placeholder="Referee's full name"
              readOnly={!!formData.refereeId}
              className={formData.refereeId ? 'auto-filled' : ''}
            />
            {formData.refereeId && (
              <small className="auto-filled-label">Auto-filled from database</small>
            )}
          </div>
          <div className="form-group">
            <label>Business Name *</label>
            <input
              type="text"
              name="refereeBusiness"
              value={formData.refereeBusiness || ''}
              onChange={handleInputChange}
              required
              placeholder="Referee's business name"
              readOnly={!!formData.refereeId}
              className={formData.refereeId ? 'auto-filled' : ''}
            />
            {formData.refereeId && (
              <small className="auto-filled-label">Auto-filled from database</small>
            )}
          </div>
        </div>
        
        <div className="form-row">
          <div className="form-group">
            <label>Phone Number *</label>
            <input
              type="tel"
              name="refereePhone"
              value={formData.refereePhone || ''}
              onChange={handleInputChange}
              required
              placeholder="+234xxxxxxxxxx"
              readOnly={!!formData.refereeId}
              className={formData.refereeId ? 'auto-filled' : ''}
            />
            {formData.refereeId && (
              <small className="auto-filled-label">Auto-filled from database</small>
            )}
          </div>
          <div className="form-group">
            <label>Email Address *</label>
            <input
              type="email"
              name="refereeEmail"
              value={formData.refereeEmail || ''}
              onChange={handleInputChange}
              required
              placeholder="referee@example.com"
              readOnly={!!formData.refereeId}
              className={formData.refereeId ? 'auto-filled' : ''}
            />
            {formData.refereeId && (
              <small className="auto-filled-label">Auto-filled from database</small>
            )}
          </div>
        </div>

        {emailError && (
          <div className="email-error">
            <span className="material-icons">error</span>
            <span>{emailError}</span>
          </div>
        )}

        {/* Send Email Button */}
        {formData.refereeId && !emailSent && (
          <div className="email-action-section">
            <button
              type="button"
              className="btn-send-email"
              onClick={sendRefereeConfirmation}
              disabled={isSendingEmail}
            >
              {isSendingEmail ? (
                <>
                  <span className="spinner"></span>
                  Sending Confirmation...
                </>
              ) : (
                <>
                  <span className="material-icons">email</span>
                  Send Confirmation Email to Referee
                </>
              )}
            </button>
            <p className="email-instruction">
              A confirmation email will be sent to the referee requesting their acceptance.
            </p>
          </div>
        )}

        {emailSent && (
          <div className="email-sent-success">
            <span className="material-icons">check_circle</span>
            <div>
              <strong>Confirmation email sent!</strong>
              <p>The referee has been notified and is awaiting their confirmation.</p>
            </div>
          </div>
        )}
      </div>

      <div className="form-navigation">
        <button type="button" className="btn prev-step" onClick={onPrev}>
          Previous
        </button>
        <button 
          type="button" 
          className="btn next-step" 
          onClick={onNext}
          disabled={!!formData.refereeId && !emailSent}
        >
          Next Step
          {!!formData.refereeId && !emailSent && (
            <span className="required-hint"> (Send email first)</span>
          )}
        </button>
      </div>

      {/* Custom Confirmation Modal */}
      {confirmationModal.open && (
        <div className="confirmation-overlay" onClick={closeConfirmation}>
          <div className="confirmation-modal" onClick={(e) => e.stopPropagation()}>
            <div className={`confirmation-header confirmation-${confirmationModal.type}`}>
              <span className="confirmation-icon">
                {confirmationModal.type === 'success' && '✅'}
                {confirmationModal.type === 'error' && '❌'}
                {confirmationModal.type === 'warning' && '⚠️'}
                {confirmationModal.type === 'info' && 'ℹ️'}
              </span>
              <h3>{confirmationModal.title}</h3>
              <button className="confirmation-close" onClick={closeConfirmation}>
                ×
              </button>
            </div>
            <div className="confirmation-body">
              <p>{confirmationModal.message}</p>
            </div>
            <div className="confirmation-footer">
              <button 
                className="confirmation-btn confirmation-btn-primary"
                onClick={() => {
                  if (confirmationModal.onConfirm) {
                    confirmationModal.onConfirm();
                  }
                  closeConfirmation();
                }}
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .field-hint {
          display: block;
          color: #999;
          font-size: 11px;
          margin-top: 4px;
          font-style: italic;
        }
        
        .referee-search-container {
          position: relative;
          width: 100%;
        }
        
        .referee-search-container input.loading {
          background-image: linear-gradient(to right, #f0f0f0 30%, #e0e0e0 50%, #f0f0f0 70%);
          background-size: 200% 100%;
          animation: shimmer 1.5s infinite;
        }
        
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        
        .loading-spinner {
          position: absolute;
          right: 10px;
          top: 50%;
          transform: translateY(-50%);
          font-size: 12px;
          color: #999;
        }
        
        .search-results-dropdown {
          position: absolute;
          top: 100%;
          left: 0;
          right: 0;
          background: white;
          border: 1px solid #ddd;
          border-radius: 4px;
          max-height: 200px;
          overflow-y: auto;
          z-index: 1000;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          margin-top: 4px;
        }
        
        .search-results-dropdown.no-results {
          padding: 12px;
          color: #999;
          text-align: center;
        }
        
        .search-result-item {
          padding: 10px 12px;
          cursor: pointer;
          border-bottom: 1px solid #f0f0f0;
          transition: background-color 0.2s;
        }
        
        .search-result-item:hover {
          background-color: #f5f5f5;
        }
        
        .search-result-item:last-child {
          border-bottom: none;
        }
        
        .result-main {
          display: flex;
          gap: 10px;
          align-items: center;
          margin-bottom: 4px;
          flex-wrap: wrap;
        }
        
        .result-main strong {
          color: #15e420;
          font-weight: 600;
          min-width: 100px;
        }
        
        .result-main span {
          color: #333;
        }
        
        .result-detail {
          font-size: 12px;
          color: #666;
        }

        .status-badge {
          display: inline-block;
          padding: 2px 8px;
          border-radius: 12px;
          font-size: 10px;
          font-weight: 600;
          margin-left: 8px;
        }

        .status-badge.status-active {
          background-color: #e8f5e9;
          color: #2e7d32;
        }

        .status-badge.status-pending {
          background-color: #fff3e0;
          color: #e65100;
        }

        .status-badge.status-inactive {
          background-color: #ffebee;
          color: #c62828;
        }

        .auto-filled {
          background-color: #f5f5f5;
          color: #666;
        }

        .auto-filled-label {
          display: block;
          color: #999;
          font-size: 10px;
          margin-top: 2px;
        }

        .email-action-section {
          margin-top: 20px;
          padding: 16px;
          background-color: #f5f5f5;
          border-radius: 8px;
          border: 1px solid #e0e0e0;
        }

        .btn-send-email {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 24px;
          background-color: #1976d2;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
          transition: all 0.3s ease;
          width: 100%;
          justify-content: center;
        }

        .btn-send-email:hover:not(:disabled) {
          background-color: #1565c0;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(25, 118, 210, 0.3);
        }

        .btn-send-email:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .btn-send-email .spinner {
          display: inline-block;
          width: 16px;
          height: 16px;
          border: 2px solid white;
          border-top-color: transparent;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .email-instruction {
          margin-top: 8px;
          font-size: 12px;
          color: #666;
          text-align: center;
        }

        .email-sent-success {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          padding: 16px;
          margin-top: 16px;
          background-color: #e8f5e9;
          border-radius: 8px;
          border: 1px solid #4caf50;
        }

        .email-sent-success .material-icons {
          color: #4caf50;
          font-size: 24px;
        }

        .email-sent-success strong {
          color: #2e7d32;
        }

        .email-sent-success p {
          margin: 4px 0 0 0;
          font-size: 13px;
          color: #555;
        }

        .required-hint {
          font-size: 12px;
          color: #ff5722;
          font-weight: normal;
          margin-left: 4px;
        }

        .email-error {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 16px;
          margin-top: 12px;
          background-color: #ffebee;
          color: #c62828;
          border-radius: 4px;
          border: 1px solid #ef9a9a;
          font-size: 14px;
        }

        .email-error .material-icons {
          font-size: 20px;
        }

        /* ========================================
           CONFIRMATION MODAL
           ======================================== */
        .confirmation-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          backdrop-filter: blur(4px);
          -webkit-backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 9999;
          animation: fadeIn 0.2s ease;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        .confirmation-modal {
          background: white;
          border-radius: 12px;
          max-width: 420px;
          width: 90%;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
          animation: slideUp 0.3s ease;
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        .confirmation-header {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 16px 20px;
          border-bottom: 1px solid #f0f0f0;
          border-radius: 12px 12px 0 0;
        }

        .confirmation-header.confirmation-success {
          background: #e8f5e9;
          border-color: #c8e6c9;
        }

        .confirmation-header.confirmation-error {
          background: #ffebee;
          border-color: #ffcdd2;
        }

        .confirmation-header.confirmation-warning {
          background: #fff3e0;
          border-color: #ffe0b2;
        }

        .confirmation-header.confirmation-info {
          background: #e3f2fd;
          border-color: #bbdefb;
        }

        .confirmation-icon {
          font-size: 24px;
        }

        .confirmation-header h3 {
          flex: 1;
          margin: 0;
          font-size: 16px;
          font-weight: 600;
          color: #333;
          font-family: 'Inter', sans-serif;
        }

        .confirmation-close {
          background: none;
          border: none;
          font-size: 24px;
          color: #999;
          cursor: pointer;
          padding: 0 4px;
          line-height: 1;
          transition: color 0.2s ease;
        }

        .confirmation-close:hover {
          color: #333;
        }

        .confirmation-body {
          padding: 20px;
        }

        .confirmation-body p {
          margin: 0;
          font-size: 15px;
          line-height: 1.6;
          color: #444;
          font-family: 'Inter', sans-serif;
        }

        .confirmation-footer {
          display: flex;
          justify-content: flex-end;
          padding: 12px 20px 20px;
          gap: 8px;
        }

        .confirmation-btn {
          padding: 8px 24px;
          border: none;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          font-family: 'Inter', sans-serif;
        }

        .confirmation-btn-primary {
          background: linear-gradient(135deg, #15e420, #0fa819);
          color: white;
        }

        .confirmation-btn-primary:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 16px rgba(21, 228, 32, 0.3);
        }

        .confirmation-btn-secondary {
          background: #f0f0f0;
          color: #666;
        }

        .confirmation-btn-secondary:hover {
          background: #e0e0e0;
        }

        @media (max-width: 480px) {
          .confirmation-modal {
            width: 95%;
            margin: 10px;
          }

          .confirmation-header {
            padding: 14px 16px;
          }

          .confirmation-header h3 {
            font-size: 15px;
          }

          .confirmation-body {
            padding: 16px;
          }

          .confirmation-body p {
            font-size: 14px;
          }

          .confirmation-footer {
            padding: 10px 16px 16px;
          }

          .confirmation-btn {
            padding: 10px 20px;
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
};

export default RefereesStep;