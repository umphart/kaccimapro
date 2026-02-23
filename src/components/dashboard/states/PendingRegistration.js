import React from 'react';
import { motion } from 'framer-motion';
import { 
  FaClock, 
  FaBuilding, 
  FaEnvelope, 
  FaCalendarAlt,
  FaCheckCircle,
  FaHourglassHalf,
  FaBell
} from 'react-icons/fa';
import './PendingStates.css';

const PendingRegistration = ({ organization }) => {
  const submissionDate = organization?.created_at 
    ? new Date(organization.created_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
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
        <div className="status-icon-wrapper">
          <motion.div
            animate={{ 
              rotate: [0, 10, -10, 10, 0],
              scale: [1, 1.1, 1]
            }}
            transition={{ 
              duration: 2,
              repeat: Infinity,
              repeatDelay: 3
            }}
          >
            <FaHourglassHalf className="status-icon" />
          </motion.div>
        </div>
        
        <h2 className="status-title">Registration Under Review</h2>
        
        <p className="status-message">
          Your organization registration has been submitted successfully and is now 
          pending approval from our verification team.
        </p>

        <div className="status-badge-container">
          <span className="status-badge pending-badge">
            <FaClock /> Pending Approval
          </span>
        </div>

        {/* Progress Tracker */}
        <div className="progress-tracker">
          <div className="progress-step completed">
            <div className="step-indicator">✓</div>
            <span className="step-label">Submitted</span>
          </div>
          <div className="progress-line"></div>
          <div className="progress-step active">
            <div className="step-indicator">2</div>
            <span className="step-label">Under Review</span>
          </div>
          <div className="progress-line"></div>
          <div className="progress-step">
            <div className="step-indicator">3</div>
            <span className="step-label">Approval</span>
          </div>
        </div>

        {/* Estimated Timeline */}
        <div className="timeline-info">
          <FaClock className="timeline-icon" />
          <span>Estimated review time: <strong>24-48 hours</strong></span>
        </div>
      </motion.div>

      {/* Submitted Information Card */}
      <motion.div 
        className="info-card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <h3 className="info-title">
          <FaCheckCircle className="info-title-icon" />
          Submitted Information
        </h3>

        <div className="info-grid">
          <div className="info-item">
            <div className="info-label">
              <FaBuilding className="info-icon" />
              Company Name
            </div>
            <div className="info-value">{organization?.company_name || 'N/A'}</div>
          </div>

          <div className="info-item">
            <div className="info-label">
              <FaEnvelope className="info-icon" />
              Email Address
            </div>
            <div className="info-value">{organization?.email || 'N/A'}</div>
          </div>

          <div className="info-item">
            <div className="info-label">
              <FaCalendarAlt className="info-icon" />
              Submission Date
            </div>
            <div className="info-value">{submissionDate}</div>
          </div>

          {organization?.cac_number && (
            <div className="info-item">
              <div className="info-label">CAC Number</div>
              <div className="info-value">{organization.cac_number}</div>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="quick-actions">
          <button className="action-button" onClick={() => window.location.reload()}>
            <FaClock /> Check Status
          </button>
          <button className="action-button outline" onClick={() => window.location.href = '/support'}>
            Contact Support
          </button>
        </div>
      </motion.div>

      {/* Notification Preferences */}
      <motion.div 
        className="notification-prefs"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        <FaBell className="notification-icon" />
        <div className="notification-text">
          <strong>Get notified when your status changes</strong>
          <p>We'll send you an email at {organization?.email || 'your email'} once your registration is reviewed.</p>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default PendingRegistration;