import React from 'react';
import { motion } from 'framer-motion';
import { 
  FaHandshake, 
  FaArrowRight, 
  FaBuilding, 
  FaChartLine,
  FaUsers,
  FaAward 
} from 'react-icons/fa';
import './NoRegistration.css'; // We'll create this CSS file

const NoRegistration = ({ onNavigate }) => {
  const benefits = [
    { icon: <FaBuilding />, text: "Business Networking" },
    { icon: <FaChartLine />, text: "Growth Opportunities" },
    { icon: <FaUsers />, text: "Industry Connections" },
    { icon: <FaAward />, text: "Member Benefits" }
  ];

  return (
    <motion.div 
      className="no-registration-container"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      {/* Decorative Background Elements */}
      <div className="decorative-circle circle-1"></div>
      <div className="decorative-circle circle-2"></div>
      <div className="decorative-circle circle-3"></div>
      
      {/* Main Content Card */}
      <motion.div 
        className="welcome-card-enhanced"
        initial={{ scale: 0.95 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        {/* Animated Handshake Icon */}
        <motion.div 
          className="welcome-icon-wrapper"
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
          <FaHandshake className="welcome-icon" />
        </motion.div>

        {/* Welcome Text */}
        <motion.h1 
          className="welcome-title"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          Welcome to KACCIMA! 👋
        </motion.h1>

        <motion.p 
          className="welcome-subtitle"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          Your journey to business excellence starts here
        </motion.p>

        {/* Benefits Grid */}
        <motion.div 
          className="benefits-grid"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          {benefits.map((benefit, index) => (
            <motion.div 
              key={index}
              className="benefit-item"
              whileHover={{ scale: 1.05, y: -5 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <div className="benefit-icon">{benefit.icon}</div>
              <span className="benefit-text">{benefit.text}</span>
            </motion.div>
          ))}
        </motion.div>

        {/* Registration Card */}
        <motion.div 
          className="registration-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <div className="registration-content">
            <h2 className="registration-heading">
              Ready to get started?
            </h2>
            <p className="registration-description">
              Complete your organization registration in just a few minutes and unlock 
              exclusive benefits, networking opportunities, and business growth resources.
            </p>

            {/* Stats Row */}
            <div className="stats-row">
              <div className="stat-item">
                <span className="stat-number">5+</span>
                <span className="stat-label">Steps</span>
              </div>
              <div className="stat-divider"></div>
              <div className="stat-item">
                <span className="stat-number">10min</span>
                <span className="stat-label">Average time</span>
              </div>
              <div className="stat-divider"></div>
              <div className="stat-item">
                <span className="stat-number">1000+</span>
                <span className="stat-label">Members</span>
              </div>
            </div>

            {/* CTA Button */}
            <motion.button
              onClick={() => onNavigate('/organization-registration')}
              className="cta-button"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <span>Complete Registration</span>
              <motion.span
                animate={{ x: [0, 5, 0] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                style={{ display: 'inline-flex', marginLeft: '8px' }}
              >
                <FaArrowRight />
              </motion.span>
            </motion.button>

            {/* Trust Indicators */}
            <div className="trust-indicators">
              <span className="trust-badge">🔒 Secure & Encrypted</span>
              <span className="trust-badge">⚡ Fast & Easy</span>
              <span className="trust-badge">✅ No hidden fees</span>
            </div>
          </div>
        </motion.div>

        {/* Testimonial/Quote */}
        <motion.div 
          className="quote-section"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          <p className="quote-text">
            "Joining KACCIMA was the best decision for our business. 
            The networking opportunities and support are invaluable."
          </p>
          <div className="quote-author">
            <div className="author-avatar">👤</div>
            <div className="author-info">
              <span className="author-name">Alhaji Musa Ibrahim</span>
              <span className="author-title">CEO, Northern Ventures Ltd</span>
            </div>
          </div>
        </motion.div>

        {/* Help Section */}
        <motion.div 
          className="help-section"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9 }}
        >
          <p className="help-text">
            Need assistance? Our support team is here to help!
          </p>
          <div className="help-contacts">
            <span className="help-contact">📞 +234 706 317 4462</span>
            <span className="help-contact">✉️ info@kaccima.ng</span>
          </div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
};

export default NoRegistration;