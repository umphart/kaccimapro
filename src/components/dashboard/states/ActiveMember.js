import React from 'react';
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

  const handleCertificateClick = () => {
    if (!certificateDownloaded) {
      onDownloadClick('certificate');
    }
  };

  const handleReceiptClick = () => {
    if (!receiptDownloaded) {
      onDownloadClick('receipt');
    }
  };

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
              id="downloadCertificate"
            >
              Download Certificate
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
              Certificate Downloaded
            </button>
          )}

          {!receiptDownloaded ? (
            <button 
              onClick={handleReceiptClick} 
              className="btn outline" 
              id="downloadReceipt"
            >
              Download Receipt
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
              Receipt Downloaded
            </button>
          )}
        </div>
      </div>

      {/* Hidden generators that will be triggered by the events */}
      <div style={{ display: 'none' }}>
        <CertificateGenerator 
          organization={organization}
          payment={payment}
          onSuccess={() => onSuccessfulDownload('certificate')}
          onError={(msg) => onShowAlert('error', msg)}
          trigger={certificateDownloaded ? false : true}
          id="certificate-generator"
        />
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