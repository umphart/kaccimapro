import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  FaExclamationCircle, 
  FaRedo, 
  FaHeadset, 
  FaMoneyBillWave,
  FaArrowRight,
  FaClock,
  FaCheckCircle,
  FaQuestionCircle
} from 'react-icons/fa';
import './PendingStates.css';

const RejectedPayment = ({ onProceedToPayment }) => {
  const [showHelp, setShowHelp] = useState(false);

  const commonReasons = [
    "Illegible receipt image",
    "Incorrect amount paid",
    "Missing transaction reference",
    "Payment from wrong bank account"
  ];

  return (
    <motion.div 
      className="rejected-container"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Error Status Card */}
      <motion.div 
        className="status-card error"
        initial={{ scale: 0.95 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.2 }}
      >
        <div className="status-icon-wrapper error">
          <motion.div
            animate={{ 
              rotate: [0, 5, -5, 5, 0],
              scale: [1, 1.1, 1]
            }}
            transition={{ 
              duration: 1.5,
              repeat: Infinity,
              repeatDelay: 2
            }}
          >
            <FaExclamationCircle className="status-icon" />
          </motion.div>
        </div>
        
        <h2 className="status-title">Payment Verification Failed</h2>
        
        <p className="status-message">
          We couldn't verify your payment with the receipt provided. 
          Don't worry - this is often due to simple issues that can be easily fixed.
        </p>

        <div className="status-badge-container">
          <span className="status-badge error-badge">
            <FaExclamationCircle /> Verification Failed
          </span>
        </div>
      </motion.div>

      {/* Help and Resolution Card */}
      <motion.div 
        className="resolution-card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <h3 className="resolution-title">
          <FaQuestionCircle className="title-icon" />
          How to resolve this
        </h3>

        {/* Common Reasons */}
        <div className="common-reasons">
          <h4>Common reasons for rejection:</h4>
          <ul className="reasons-list">
            {commonReasons.map((reason, index) => (
              <motion.li 
                key={index}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + index * 0.1 }}
              >
                <FaExclamationCircle className="reason-icon" />
                {reason}
              </motion.li>
            ))}
          </ul>
        </div>

        {/* Action Cards */}
        <div className="action-cards">
          <motion.div 
            className="action-card"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="action-icon green">
              <FaRedo />
            </div>
            <div className="action-content">
              <h4>Resubmit Payment</h4>
              <p>Upload a new, clearer receipt with correct details</p>
              <button onClick={onProceedToPayment} className="action-button card-button">
                Resubmit Now <FaArrowRight />
              </button>
            </div>
          </motion.div>

          <motion.div 
            className="action-card"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowHelp(!showHelp)}
          >
            <div className="action-icon blue">
              <FaHeadset />
            </div>
            <div className="action-content">
              <h4>Contact Support</h4>
              <p>Speak with our team for personalized assistance</p>
              <button className="action-button card-button outline">
                Get Help <FaArrowRight />
              </button>
            </div>
          </motion.div>
        </div>

        {/* Support Options (Expandable) */}
        {showHelp && (
          <motion.div 
            className="support-options"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
          >
            <div className="support-option">
              <strong>📞 Phone:</strong> +234 706 317 4462
            </div>
            <div className="support-option">
              <strong>✉️ Email:</strong> payments@kaccima.ng
            </div>
            <div className="support-option">
              <strong>💬 Live Chat:</strong> Available 9am-5pm
            </div>
          </motion.div>
        )}

        {/* Quick Tips */}
        <div className="quick-tips">
          <h4>
            <FaCheckCircle className="tips-icon" />
            Tips for successful payment verification:
          </h4>
          <ul>
            <li>📸 Take a clear, well-lit photo of your receipt</li>
            <li>💰 Ensure the amount paid matches the required fee</li>
            <li>🏦 Include the complete bank transaction details</li>
            <li>📅 Submit within 24 hours of payment</li>
          </ul>
        </div>
      </motion.div>

      {/* Bank Details for Reference */}
      <motion.div 
        className="bank-details-card"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
      >
        <h4>Bank Account Details</h4>
        <div className="bank-details-grid">
          <div className="bank-detail">
            <span>Bank:</span>
            <strong>Jaiz Bank</strong>
          </div>
          <div className="bank-detail">
            <span>Account Name:</span>
            <strong>KANO CHAMBER OF COMMERCE</strong>
          </div>
          <div className="bank-detail">
            <span>Account Number:</span>
            <strong>0000374891</strong>
          </div>
          <div className="bank-detail">
            <span>Amount:</span>
            <strong>₦25,000 (First time) / ₦15,000 (Renewal)</strong>
          </div>
        </div>
      </motion.div>

      {/* Resubmit Button (Prominent) */}
      <motion.div 
        className="resubmit-section"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
      >
        <button onClick={onProceedToPayment} className="resubmit-button">
          <FaRedo className="button-icon" />
          Resubmit Payment Proof
          <FaArrowRight className="button-icon right" />
        </button>
        <p className="resubmit-note">
          Make sure your new receipt clearly shows the transaction details
        </p>
      </motion.div>
    </motion.div>
  );
};

export default RejectedPayment;