import React from 'react';
import NoRegistration from './states/NoRegistration';
import PendingRegistration from './states/PendingRegistration';
import PendingPayment from './states/PendingPayment';
import RejectedPayment from './states/RejectedPayment';
import ActiveMember from './states/ActiveMember';
import '../Dashboard.css';

const DashboardContent = ({ 
  registrationStatus,
  organization,
  payment,
  countdown,
  certificateDownloaded,
  receiptDownloaded,
  onDownloadClick,
  onNavigate,
  onShowAlert,
  onSuccessfulDownload
}) => {
  
  const renderContent = () => {
    switch(registrationStatus) {
      case 'none':
        return <NoRegistration onNavigate={onNavigate} />;
      
      case 'pending':
        return <PendingRegistration organization={organization} />;
      
      default:
        // Check payment status
        if (!payment) {
          return <div>Loading payment information...</div>;
        }
        
        switch(payment.status) {
          case 'pending':
            return <PendingPayment payment={payment} />;
          
          case 'rejected':
            return <RejectedPayment onProceedToPayment={() => onNavigate('/payment', { state: { organization } })} />;
          
          case 'accepted':
          case 'approved':
            return (
              <ActiveMember 
                organization={organization}
                payment={payment}
                countdown={countdown}
                certificateDownloaded={certificateDownloaded}
                receiptDownloaded={receiptDownloaded}
                onDownloadClick={onDownloadClick}
                onShowAlert={onShowAlert}
                onSuccessfulDownload={onSuccessfulDownload}
              />
            );
          
          default:
            return <div>Loading your information...</div>;
        }
    }
  };

  return (
    <section className="dashboard-content">
      {renderContent()}

      {(payment?.status === 'accepted' || payment?.status === 'approved') && (
        <>
          <div className="profile-info">
            <h3 className="section-title">Membership Information</h3>
            <p>As a member of KACCIMA, you are entitled to various benefits including access to business resources, networking opportunities, and support for your business growth.</p>
          </div>

          <div className="profile-info">
            <h3 className="section-title">Contact Information</h3>
            <p>Contact us: info@kaccima.ng | +2347063174462</p>
          </div>
        </>
      )}
    </section>
  );
};

export default DashboardContent;