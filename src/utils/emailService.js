import emailjs from '@emailjs/browser';

// Your EmailJS credentials
const EMAILJS_CONFIG = {
  publicKey: process.env.REACT_APP_EMAILJS_PUBLIC_KEY || 'vEb1fxTEwxzpmcNmm',
  serviceId: process.env.REACT_APP_EMAILJS_SERVICE_ID || 'service_hoj7fzf',
  // Template for organization notifications (approvals/rejections)
  templateId: 'template_kwa5fnl'  // Using the template with type conditions
};

// Initialize EmailJS
emailjs.init(EMAILJS_CONFIG.publicKey);

// Main function to send emails to organizations
export const sendEmail = async (options) => {
  try {
    const {
      to_email,
      type, // organizationApproved, organizationRejected, paymentApproved, paymentRejected
      company_name = '',
      amount = '',
      reason = '',
      action_url = '',
      action_text = 'Go to Dashboard'
    } = options;

    // Set background color based on type
    let bg_color = '#f5f5f5';
    if (type.includes('Approved')) {
      bg_color = '#e8f5e9';
    } else if (type.includes('Rejected')) {
      bg_color = '#ffebee';
    }

    const templateParams = {
      // Basic info
      type: type,
      isAdmin: false, // This is for organization, not admin
      to_email: to_email,
      company_name: company_name,
      
      // Content
      message: generateMessage(type, options),
      bg_color: bg_color,
      
      // Optional fields
      reason: reason || '',
      amount: amount ? (typeof amount === 'number' ? amount.toLocaleString() : amount) : '',
      
      // Action
      action_url: action_url || '',
      action_text: action_text
    };

    console.log('📧 Sending email to organization:', {
      to: to_email,
      type,
      templateId: EMAILJS_CONFIG.templateId
    });

    const response = await emailjs.send(
      EMAILJS_CONFIG.serviceId,
      EMAILJS_CONFIG.templateId,
      templateParams
    );

    console.log('✅ Email sent successfully to organization:', to_email);
    return { success: true, data: response };
  } catch (error) {
    console.error('❌ Failed to send email:', error);
    return { success: false, error: error.message };
  }
};

// Generate message based on email type
const generateMessage = (type, data) => {
  switch(type) {
    case 'organizationApproved':
      return `Great news! Your organization registration has been APPROVED. You can now access all features and start using our platform.`;
      
    case 'organizationRejected':
      return `We have reviewed your organization registration and it was REJECTED. Please see the reason below and take necessary action.`;
      
    case 'paymentApproved':
      return `Your payment of ₦${data.amount?.toLocaleString()} has been successfully processed and APPROVED. Thank you for your payment!`;
      
    case 'paymentRejected':
      return `Your payment of ₦${data.amount?.toLocaleString()} could not be verified and has been REJECTED.`;
      
    default:
      return 'Thank you for using our platform.';
  }
};

// Helper functions for specific email types
export const sendOrganizationApproved = (email, companyName) => 
  sendEmail({
    to_email: email,
    type: 'organizationApproved',
    company_name: companyName,
    action_url: `${window.location.origin}/dashboard`,
    action_text: 'Go to Dashboard'
  });

export const sendOrganizationRejected = (email, companyName, reason) => 
  sendEmail({
    to_email: email,
    type: 'organizationRejected',
    company_name: companyName,
    reason: reason,
    action_url: `${window.location.origin}/contact`,
    action_text: 'Contact Support'
  });

export const sendPaymentApproved = (email, companyName, amount) => 
  sendEmail({
    to_email: email,
    type: 'paymentApproved',
    company_name: companyName,
    amount: amount,
    action_url: `${window.location.origin}/dashboard`,
    action_text: 'View Dashboard'
  });

export const sendPaymentRejected = (email, companyName, amount, reason) => 
  sendEmail({
    to_email: email,
    type: 'paymentRejected',
    company_name: companyName,
    amount: amount,
    reason: reason,
    action_url: `${window.location.origin}/contact`,
    action_text: 'Contact Support'
  });

// Document functions removed - no emails will be sent for documents