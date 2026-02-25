import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const PaymentHistory = ({ previousPayments = [] }) => {  // Add default value here
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
        return 'Approved';
      case 'pending':
        return 'Pending Verification';
      case 'rejected':
        return 'Rejected';
      default:
        return status;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-NG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getTooltipText = (status) => {
    switch(status) {
      case 'pending':
        return 'Your payment is being verified. This usually takes 24-48 hours.';
      case 'approved':
        return 'Payment verified successfully';
      case 'rejected':
        return 'Payment verification failed. Please contact support.';
      default:
        return '';
    }
  };

  // Safely calculate pending count
  const pendingCount = previousPayments?.filter(p => p?.status === 'pending')?.length || 0;

  // Don't render if no payments
  if (!previousPayments || previousPayments.length === 0) {
    return null;
  }

  return (
    <div className="payment-history">
      <h3>
        <span>Payment History</span>
        {pendingCount > 0 && (
          <span className="pending-count">
            {pendingCount} pending
          </span>
        )}
      </h3>
      
      <div className="history-list">
        <AnimatePresence>
          {previousPayments.slice(0, 3).map((payment, index) => {
            // Skip if payment is null or undefined
            if (!payment) return null;
            
            return (
              <motion.div
                key={payment.id || `payment-${index}`}
                className={`history-item ${getStatusClass(payment?.status)}`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.02 }}
              >
                <div className="history-date">{formatDate(payment?.created_at)}</div>
                <div className="history-amount">
                  ₦{payment?.amount?.toLocaleString() || '0'}.00
                </div>
                <div 
                  className={`history-status ${getStatusClass(payment?.status)}`}
                  data-tooltip={getTooltipText(payment?.status)}
                >
                  {getStatusText(payment?.status)}
                  {payment?.status === 'pending' && (
                    <span className="pending-dots">
                      <span></span>
                      <span></span>
                      <span></span>
                    </span>
                  )}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
      
      {previousPayments.length > 3 && (
        <motion.div 
          className="history-more"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => {/* Handle view all */}}
        >
          +{previousPayments.length - 3} more payment{previousPayments.length - 3 > 1 ? 's' : ''}
        </motion.div>
      )}
    </div>
  );
};

export default PaymentHistory;