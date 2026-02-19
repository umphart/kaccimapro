import React from 'react';
import './Payment.css';

const PaymentSummary = ({ 
  organization, 
  amount, 
  paymentType, 
  previousPayments, 
  lastPaymentDate, 
  nextRenewalDate,
  isRenewalDue 
}) => {
  const FIRST_PAYMENT_AMOUNT = 25000;
  const RENEWAL_AMOUNT = 15000;
  
  const currentAmount = amount || (paymentType === 'renewal' ? RENEWAL_AMOUNT : FIRST_PAYMENT_AMOUNT);
  const isRenewal = paymentType === 'renewal';
  const isNotDue = paymentType === 'not_due';
  
  // Calculate fee breakdown
  const registrationFee = !isRenewal && !isNotDue ? 10000 : 0;
  const subscriptionFee = !isRenewal && !isNotDue ? 15000 : (isRenewal ? RENEWAL_AMOUNT : 0);

  const getStatusClass = (status) => {
    switch(status) {
      case 'approved':
      case 'accepted':
        return 'status-approved';
      case 'pending':
        return 'status-pending';
      case 'rejected':
        return 'status-rejected';
      default:
        return '';
    }
  };

  const getStatusText = (status) => {
    switch(status) {
      case 'approved':
      case 'accepted':
        return 'Approved ✓';
      case 'pending':
        return 'Pending Verification';
      case 'rejected':
        return 'Rejected ✗';
      default:
        return status;
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-NG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatRenewalDate = (date) => {
    if (!date) return 'N/A';
    return date.toLocaleDateString('en-NG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <section className="payment-summary">
      <h2 className="section-title">
        {isNotDue ? 'Membership Status' : (isRenewal ? 'Annual Renewal Summary' : 'New Membership Summary')}
      </h2>
      
      <div className="summary-item">
        <span className="summary-label">Membership Type:</span>
        <span className="summary-value">
          {isNotDue ? 'Active Member' : (isRenewal ? 'Annual Renewal' : 'New Member Registration')}
        </span>
      </div>
      
      <div className="summary-item">
        <span className="summary-label">Company Name:</span>
        <span className="summary-value">{organization?.company_name || 'Loading...'}</span>
      </div>
      
      <div className="summary-item">
        <span className="summary-label">CAC Number:</span>
        <span className="summary-value">{organization?.cac_number || 'Loading...'}</span>
      </div>
      
      {!isNotDue && (
        <>
          {!isRenewal && (
            <>
              <div className="summary-item">
                <span className="summary-label">Registration Fee:</span>
                <span className="summary-value">₦{registrationFee.toLocaleString()}.00</span>
              </div>
              
              <div className="summary-item">
                <span className="summary-label">Subscription Fee:</span>
                <span className="summary-value">₦{subscriptionFee.toLocaleString()}.00</span>
              </div>
            </>
          )}
          
          {isRenewal && (
            <div className="summary-item">
              <span className="summary-label">Annual Renewal Fee:</span>
              <span className="summary-value">₦{RENEWAL_AMOUNT.toLocaleString()}.00</span>
            </div>
          )}
          
          <div className="summary-item total-amount">
            <span className="summary-label">Total Amount Due:</span>
            <span className="summary-value">₦{currentAmount.toLocaleString()}.00</span>
          </div>
        </>
      )}

      {/* Membership Period Information */}
      {lastPaymentDate && nextRenewalDate && (
        <div className="membership-period">
          <h3>Membership Period</h3>
          <div className="period-item">
            <span className="period-label">Last Payment:</span>
            <span className="period-value">{formatDate(lastPaymentDate)}</span>
          </div>
          <div className="period-item">
            <span className="period-label">Valid Until:</span>
            <span className="period-value">{formatRenewalDate(nextRenewalDate)}</span>
          </div>
          <div className="period-item">
            <span className="period-label">Next Renewal:</span>
            <span className="period-value">January 1, {nextRenewalDate.getFullYear()}</span>
          </div>
          {!isRenewalDue && (
            <div className="period-status active">
              ✓ Membership Active
            </div>
          )}
        </div>
      )}

      {/* Previous Payment History */}
      {previousPayments && previousPayments.length > 0 && (
        <div className="payment-history">
          <h3>Payment History</h3>
          <div className="history-list">
            {previousPayments.slice(0, 3).map((payment, index) => (
              <div key={index} className="history-item">
                <div className="history-date">{formatDate(payment.created_at)}</div>
                <div className="history-amount">₦{payment.amount?.toLocaleString() || '0'}.00</div>
                <div className={`history-status ${getStatusClass(payment.status)}`}>
                  {getStatusText(payment.status)}
                </div>
              </div>
            ))}
          </div>
          {previousPayments.length > 3 && (
            <div className="history-more">
              +{previousPayments.length - 3} more payment(s)
            </div>
          )}
        </div>
      )}
      
      <div className="payment-instructions">
        <h3>Annual Renewal Information</h3>
        {!isNotDue ? (
          <>
            {!isRenewal ? (
              <>
                <p>Complete your membership registration by making payment through bank transfer.</p>
                <p>Your membership will be valid from approval date until December 31st of the current year.</p>
                <p className="note">
                  <strong>Note:</strong> Annual renewals are due on January 1st of each year (₦15,000.00).
                </p>
              </>
            ) : (
              <>
                <p>Complete your annual renewal by making payment through bank transfer.</p>
                <p>Your renewed membership will be valid from January 1st to December 31st, {new Date().getFullYear()}.</p>
                <p className="note">
                  <strong>Note:</strong> Renewal must be completed by January 31st to avoid late fees.
                </p>
              </>
            )}
          </>
        ) : (
          <>
            <p>Your membership is active and in good standing.</p>
            <p>Your next renewal is due on <strong>January 1, {nextRenewalDate?.getFullYear()}</strong>.</p>
            <p className="note">
              <strong>Note:</strong> You will receive a reminder notification 30 days before your renewal date.
            </p>
          </>
        )}
      </div>
    </section>
  );
};

export default PaymentSummary;