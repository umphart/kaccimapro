import React from 'react';
import { useRegistration } from '../hooks/useRegistration';
import CompanyInfoStep from './CompanyInfoStep';
import CompanyDetailsStep from './CompanyDetailsStep';
import RefereesStep from './RefereesStep';
import DocumentsStep from './DocumentsStep';
import PaymentStep from './PaymentStep';
import './RegistrationForm.css';
import { useNavigate } from 'react-router-dom';

const RegistrationForm = () => {
  const {
    user,
    currentStep,
    loading,
    alert,
    formData,
    fileNames,
    organizationId,
    paymentStep,
    businessNatureOptions,
    showAlert,
    handleInputChange,
    handleFileChange,
    submitRegistration,
    nextStep,
    prevStep,
    setAlert
  } = useRegistration();
  const navigate = useNavigate();

  const handleSubmitRegistration = async () => {
    try {
      const id = await submitRegistration();
      if (id) {
        setAlert({ type: 'success', message: 'Registration submitted! Redirecting to payment...' });
        navigate('/payment', { 
          state: { 
            organizationId: id,
            fromRegistration: true 
          } 
        });
      }
    } catch (error) {
      showAlert('error', error.message);
    }
  };

// In RegistrationForm.js
const handleGoBack = () => {
  if (currentStep > 1) {
    prevStep();
  } else {
    // Navigate to dashboard (which will show the notification)
    navigate('/dashboard');
  }
};

const handleCancelRegistration = () => {
  if (window.confirm('Are you sure you want to cancel the registration? All entered data will be lost.')) {
    navigate('/dashboard');
  }
};

  return (
    <div className="registration-container">
      {/* Header with Back and Cancel buttons */}
      <div className="registration-header">
        <div className="header-left">
          <button 
            className="btn-back" 
            onClick={handleGoBack}
            title={currentStep > 1 ? "Go to previous step" : "Go back to login"}
          >
            <span className="material-icons">arrow_back</span>
            {currentStep > 1 ? 'Back' : 'Login'}
          </button>
        </div>
        <div className="header-right">
          <button 
            className="btn-cancel" 
            onClick={handleCancelRegistration}
            title="Cancel registration"
          >
            <span className="material-icons">close</span>
            Cancel Registration
          </button>
        </div>
      </div>

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
        <p className="registration-progress">
          Step {currentStep} of {paymentStep ? '5' : '4'}
          {paymentStep && ' - Payment'}
        </p>
        {/* Progress bar */}
        <div className="progress-bar-container">
          <div 
            className="progress-bar" 
            style={{ 
              width: `${(currentStep / (paymentStep ? 5 : 4)) * 100}%` 
            }}
          />
        </div>
      </center>
      
      <form>
        {currentStep === 1 && (
          <CompanyInfoStep
            formData={formData}
            handleInputChange={handleInputChange}
            businessNatureOptions={businessNatureOptions}
            onNext={nextStep}
          />
        )}

        {currentStep === 2 && (
          <CompanyDetailsStep
            formData={formData}
            handleInputChange={handleInputChange}
            onPrev={prevStep}
            onNext={nextStep}
          />
        )}

        {currentStep === 3 && (
          <RefereesStep
            formData={formData}
            handleInputChange={handleInputChange}
            onPrev={prevStep}
            onNext={nextStep}
          />
        )}

        {currentStep === 4 && !paymentStep && (
          <DocumentsStep
            formData={formData}
            handleInputChange={handleInputChange}
            handleFileChange={handleFileChange}
            fileNames={fileNames}
            onPrev={prevStep}
            onSubmit={handleSubmitRegistration}
            loading={loading}
          />
        )}

        {currentStep === 5 && paymentStep && (
          <PaymentStep
            organizationId={organizationId}
            user={user}
            showAlert={showAlert}
          />
        )}
      </form>
    </div>
  );
};

export default RegistrationForm;