import React, { useEffect, useRef, useState } from 'react';
import CertificateGenerator from '../CertificateGenerator';
import ReceiptGenerator from '../ReceiptGenerator';

const ActiveMember = ({ 
  organization, 
  payment, 
  countdown, 
  certificateDownloaded, 
  receiptDownloaded,
  onDownloadClick,
  onShowAlert,
  onSuccessfulDownload 
}) => {
  const [showCertificatePreview, setShowCertificatePreview] = useState(false);
  const [certTrigger, setCertTrigger] = useState(false);
  const hasTriggeredPrint = useRef(false);

  const handleCertificateClick = () => {
    if (!certificateDownloaded && !hasTriggeredPrint.current) {
      hasTriggeredPrint.current = true;
      setShowCertificatePreview(true);
      setCertTrigger(prev => !prev);
      
      // Dispatch print event after a short delay
      setTimeout(() => {
        const event = new CustomEvent('printCertificate');
        document.dispatchEvent(event);
      }, 300);
      
      // Reset the trigger after a delay to allow future prints
      setTimeout(() => {
        hasTriggeredPrint.current = false;
      }, 3000);
    }
  };

  const handleReceiptClick = () => {
    if (!receiptDownloaded) {
      onDownloadClick('receipt');
    }
  };

  // Handle keyboard shortcut for printing (Ctrl+P / Cmd+P)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
        // If the certificate is available, trigger print
        if (!certificateDownloaded && organization) {
          e.preventDefault(); // Prevent default print dialog
          handleCertificateClick();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [certificateDownloaded, organization]);

  return (
    <>
      <div className="notification success">
        <p>Your membership is active! Status: <strong>Active Member</strong></p>
      </div>
      
      <div className="profile-card">
        <h3 className="section-title">Membership Subscription</h3>
        <div className="profile-grid">
          <div className="profile-field">
            <div className="field-label">Registration Date</div>
            <div className="field-value">{payment?.day}-{payment?.month}-{payment?.year}</div>
          </div>

          <div className="profile-field">
            <div className="field-label">Expected Renewal Date</div>
            <div className="field-value">
              January 1, {(payment?.year || new Date().getFullYear()) + 1}
              {countdown && <span className="countdown"> ({countdown} remaining)</span>}
            </div>
          </div>
        </div>

        <div className="button-group">
          {!certificateDownloaded ? (
            <button 
              onClick={handleCertificateClick} 
              className="btn outline"
              id="printCertificate"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                justifyContent: 'center',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.02)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
              }}
            >
              <span style={{ fontSize: '18px' }}>🖨️</span> Print Certificate
            </button>
          ) : (
            <button 
              className="btn outline downloaded"
              disabled
              style={{ 
                opacity: 0.5, 
                cursor: 'not-allowed',
                backgroundColor: '#e0e0e0',
                color: '#666'
              }}
            >
              ✅ Certificate Printed
            </button>
          )}

          {!receiptDownloaded ? (
            <button 
              onClick={handleReceiptClick} 
              className="btn outline" 
              id="downloadReceipt"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                justifyContent: 'center',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.02)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
              }}
            >
              <span style={{ fontSize: '18px' }}>📄</span> Download Receipt
            </button>
          ) : (
            <button 
              className="btn outline downloaded"
              disabled
              style={{ 
                opacity: 0.5, 
                cursor: 'not-allowed',
                backgroundColor: '#e0e0e0',
                color: '#666'
              }}
            >
              ✅ Receipt Downloaded
            </button>
          )}
        </div>

        {/* Info note about printing */}
        <div style={{ 
          marginTop: '15px', 
          padding: '10px 15px', 
          backgroundColor: '#f0f7ff', 
          borderRadius: '8px',
          borderLeft: '4px solid #15e420',
          fontSize: '14px',
          color: '#555'
        }}>
          <p style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '18px' }}>💡</span>
            <span>Certificate will open in a new window and automatically prompt for printing. Please allow pop-ups.</span>
          </p>
        </div>
      </div>

      {/* Certificate Generator - Now visible */}
      {showCertificatePreview && organization && (
        <div style={{ 
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          zIndex: 9999,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            maxWidth: '600px',
            width: '100%',
            maxHeight: '90vh',
            overflow: 'auto',
            padding: '20px',
            position: 'relative'
          }}>
            <button
              onClick={() => setShowCertificatePreview(false)}
              style={{
                position: 'absolute',
                top: '10px',
                right: '10px',
                background: 'none',
                border: 'none',
                fontSize: '24px',
                cursor: 'pointer',
                color: '#666',
                zIndex: 10
              }}
            >
              ✕
            </button>
            
            <h3 style={{ marginTop: 0, fontFamily: '"Inter", sans-serif' }}>
              🖨️ Certificate Preview
            </h3>
            
            <p style={{ color: '#666', fontFamily: '"Inter", sans-serif' }}>
              Your certificate is being generated. The print dialog will open automatically.
            </p>
            
            <CertificateGenerator 
              organization={organization}
              payment={payment}
              onSuccess={() => {
                onSuccessfulDownload('certificate');
                setTimeout(() => setShowCertificatePreview(false), 2000);
              }}
              onError={(msg) => {
                onShowAlert('error', msg);
                setShowCertificatePreview(false);
              }}
              trigger={certTrigger}
              id="certificate-generator"
            />
            
            <div style={{ 
              marginTop: '20px',
              padding: '15px',
              backgroundColor: '#f8f9fa',
              borderRadius: '8px',
              textAlign: 'center'
            }}>
              <p style={{ margin: 0, color: '#666', fontSize: '14px' }}>
                🔄 Generating certificate... Please wait.
              </p>
              <div style={{ 
                marginTop: '10px',
                height: '4px',
                backgroundColor: '#e0e0e0',
                borderRadius: '2px',
                overflow: 'hidden'
              }}>
                <div style={{
                  height: '100%',
                  backgroundColor: '#15e420',
                  width: '100%',
                  animation: 'progressAnimation 2s ease-in-out infinite'
                }} />
              </div>
            </div>
            
            <style>
              {`
                @keyframes progressAnimation {
                  0% { width: 0%; }
                  50% { width: 70%; }
                  100% { width: 100%; }
                }
              `}
            </style>
          </div>
        </div>
      )}

      {/* Hidden Receipt Generator */}
      <div style={{ display: 'none' }}>
        <ReceiptGenerator 
          organization={organization}
          payment={payment}
          onSuccess={() => onSuccessfulDownload('receipt')}
          onError={(msg) => onShowAlert('error', msg)}
          trigger={receiptDownloaded ? false : true}
          id="receipt-generator"
        />
      </div>
    </>
  );
};

export default ActiveMember;