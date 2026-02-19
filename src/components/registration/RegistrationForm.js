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
    files,
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
    goToPayment,
    setAlert
  } = useRegistration();
  const navigate = useNavigate();

 // In RegistrationForm.js - Update the handleSubmitRegistration function
const handleSubmitRegistration = async () => {
  try {
    const id = await submitRegistration();
    if (id) {
      setAlert({ type: 'success', message: 'Registration submitted! Redirecting to payment...' });
      // Navigate directly to payment with organization ID
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

  return (
    <div className="registration-container">
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