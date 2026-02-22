import emailjs from '@emailjs/browser';

// Your EmailJS credentials
const EMAILJS_CONFIG = {
  publicKey: process.env.REACT_APP_EMAILJS_PUBLIC_KEY || 'vEb1fxTEwxzpmcNmm',
  serviceId: process.env.REACT_APP_EMAILJS_SERVICE_ID || 'service_hoj7fzf',
  // Template for organization notifications (approvals/rejections)
  templateId: 'template_orimz2f'
};

// Initialize EmailJS
emailjs.init(EMAILJS_CONFIG.publicKey);

// Main function to send emails to organizations
export const sendEmail = async (options) => {
  try {
    const {
      to_email,
      item_type, // 'organization' or 'payment'
      status, // 'approved' or 'rejected'
      company_name = '',
      amount = '',
      reason = '',
      action_url = '',
      action_text = 'Go to Dashboard'
    } = options;

    // Set values based on status and type
    const type = status; // 'approved' or 'rejected'
    const header_title = status === 'approved' 
      ? (item_type === 'organization' ? 'Organization Approved' : 'Payment Approved')
      : (item_type === 'organization' ? 'Organization Rejected' : 'Payment Rejected');
    
    const main_message = status === 'approved'
      ? `Congratulations! Your ${item_type === 'organization' ? 'organization registration' : 'payment'} has been approved.`
      : `We regret to inform you that your ${item_type === 'organization' ? 'organization registration' : 'payment'} has been rejected.`;
    
    const bg_color = status === 'approved' ? '#e8f5e9' : '#ffebee';

    const templateParams = {
      type: type,
      header_title: header_title,
      company_name: company_name,
      main_message: main_message,
      bg_color: bg_color,
      item_type: item_type,
      status: status === 'approved' ? 'APPROVED' : 'REJECTED',
      amount: amount ? (typeof amount === 'number' ? amount.toLocaleString() : amount) : '',
      reason: reason || '',
      action_url: action_url || '',
      action_text: action_text
    };

    console.log('📧 Sending email to organization:', {
      to: to_email,
      item_type,
      status
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

// Helper functions for specific email types
export const sendOrganizationApproved = (email, companyName) => 
  sendEmail({
    to_email: email,
    item_type: 'organization',
    status: 'approved',
    company_name: companyName,
    action_url: `${window.location.origin}/dashboard`,
    action_text: 'Go to Dashboard'
  });

export const sendOrganizationRejected = (email, companyName, reason) => 
  sendEmail({
    to_email: email,
    item_type: 'organization',
    status: 'rejected',
    company_name: companyName,
    reason: reason,
    action_url: `${window.location.origin}/contact`,
    action_text: 'Contact Support'
  });

export const sendPaymentApproved = (email, companyName, amount) => 
  sendEmail({
    to_email: email,
    item_type: 'payment',
    status: 'approved',
    company_name: companyName,
    amount: amount,
    action_url: `${window.location.origin}/dashboard`,
    action_text: 'View Dashboard'
  });

export const sendPaymentRejected = (email, companyName, amount, reason) => 
  sendEmail({
    to_email: email,
    item_type: 'payment',
    status: 'rejected',
    company_name: companyName,
    amount: amount,
    reason: reason,
    action_url: `${window.location.origin}/contact`,
    action_text: 'Contact Support'
  });