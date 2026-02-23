import React from 'react';
import { motion } from 'framer-motion';
import { 
  FaMoneyBillWave, 
  FaCreditCard, 
  FaCalendarAlt,
  FaClock,
  FaCheckCircle,
  FaExclamationTriangle,
  FaQrcode,
  FaPrint,
  FaDownload
} from 'react-icons/fa';
import './PendingStates.css';

const PendingPayment = ({ payment }) => {
  const formatAmount = (amount) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN'
    }).format(amount || 0);
  };

  const paymentDate = payment?.day && payment?.month && payment?.year
    ? new Date(payment.year, payment.month - 1, payment.day).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    : 'N/A';

  return (
    <motion.div 
      className="pending-container"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Status Card */}
      <motion.div 
        className="status-card warning"
        initial={{ scale: 0.95 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.2 }}
      >
        <div className="status-icon-wrapper payment-icon">
          <motion.div
            animate={{ 
              y: [0, -5, 0],
              rotate: [0, 5, -5, 0]
            }}
            transition={{ 
              duration: 2,
              repeat: Infinity,
              repeatType: "reverse"
            }}
          >
            <FaMoneyBillWave className="status-icon" />
          </motion.div>
        </div>
        
        <h2 className="status-title">Payment Under Verification</h2>
        
        <p className="status-message">
          Your payment receipt has been received and is currently being verified 
          by our finance team. This process typically takes 24-48 hours.
        </p>

        <div className="status-badge-container">
          <span className="status-badge pending-badge">
            <FaClock /> Verification in Progress
          </span>
        </div>

        {/* Payment Amount Highlight */}
        <div className="amount-highlight">
          <span className="amount-label">Amount Paid:</span>
          <span className="amount-value">{formatAmount(payment?.amount)}</span>
        </div>

        {/* Estimated Timeline */}
        <div className="timeline-info payment-timeline">
          <div className="timeline-item">
            <span className="timeline-dot"></span>
            <div className="timeline-content">
              <strong>Submitted:</strong> {paymentDate}
            </div>
          </div>
          <div className="timeline-item active">
            <span className="timeline-dot pulse"></span>
            <div className="timeline-content">
              <strong>Verifying:</strong> In Progress
            </div>
          </div>
          <div className="timeline-item">
            <span className="timeline-dot"></span>
            <div className="timeline-content">
              <strong>Completion:</strong> ~{new Date(Date.now() + 2*24*60*60*1000).toLocaleDateString()}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Payment Details Card */}
      <motion.div 
        className="info-card payment-card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <h3 className="info-title">
          <FaCheckCircle className="info-title-icon" />
          Payment Details
        </h3>

        <div className="payment-details-grid">
          <div className="payment-detail-item highlight">
            <div className="detail-icon">
              <FaMoneyBillWave />
            </div>
            <div className="detail-content">
              <span className="detail-label">Amount</span>
              <span className="detail-value large">{formatAmount(payment?.amount)}</span>
            </div>
          </div>

          <div className="payment-detail-item">
            <div className="detail-icon">
              <FaCreditCard />
            </div>
            <div className="detail-content">
              <span className="detail-label">Method</span>
              <span className="detail-value">{payment?.method || 'Bank Transfer'}</span>
            </div>
          </div>

          <div className="payment-detail-item">
            <div className="detail-icon">
              <FaCalendarAlt />
            </div>
            <div className="detail-content">
              <span className="detail-label">Date</span>
              <span className="detail-value">{paymentDate}</span>
            </div>
          </div>

          <div className="payment-detail-item full-width">
            <div className="detail-label">Reference Number</div>
            <div className="detail-value mono">
              {payment?.id ? payment.id.substring(0, 8).toUpperCase() : 'N/A'}
            </div>
          </div>
        </div>

        {/* Receipt Preview */}
        {payment?.receipt_path && (
          <div className="receipt-preview">
            <div className="preview-header">
              <span>Uploaded Receipt</span>
              <button className="preview-button">
                <FaDownload /> Download
              </button>
            </div>
            <div className="preview-placeholder">
              <FaQrcode />
              <span>Receipt: {payment.receipt_path.split('/').pop()}</span>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="quick-actions payment-actions">
          <button className="action-button primary" onClick={() => window.location.reload()}>
            <FaClock /> Check Status
          </button>
          <button className="action-button outline" onClick={() => window.location.href = '/support'}>
            Need Help?
          </button>
          <button className="action-button icon-only" title="Print Details">
            <FaPrint />
          </button>
        </div>
      </motion.div>

      {/* What Happens Next */}
      <motion.div 
        className="next-steps-card"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        <h4>What happens next?</h4>
        <div className="steps-grid">
          <div className="step">
            <div className="step-number">1</div>
            <div className="step-text">Finance team verifies your payment</div>
          </div>
          <div className="step">
            <div className="step-number">2</div>
            <div className="step-text">You'll receive a confirmation email</div>
          </div>
          <div className="step">
            <div className="step-number">3</div>
            <div className="step-text">Your membership is activated</div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default PendingPayment;