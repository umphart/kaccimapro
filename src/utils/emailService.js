import emailjs from '@emailjs/browser';

// Your EmailJS credentials
const EMAILJS_CONFIG = {
  publicKey: process.env.REACT_APP_EMAILJS_PUBLIC_KEY || 'vEb1fxTEwxzpmcNmm',
  serviceId: process.env.REACT_APP_EMAILJS_SERVICE_ID || 'service_hoj7fzf',
  // Your actual template IDs
  templateIds: {
    organizationApproved: 'template_orimz2f',  // For approval emails
    organizationRejected: 'template_kwa5fnl',   // For rejection emails
    documentApproved: 'template_orimz2f',       // Using approval template for doc approval
    documentRejected: 'template_kwa5fnl',        // Using rejection template for doc rejection
    paymentApproved: 'template_orimz2f',         // Using approval template for payment approval
    paymentRejected: 'template_kwa5fnl'          // Using rejection template for payment rejection
  }
};

// Initialize EmailJS
emailjs.init(EMAILJS_CONFIG.publicKey);

// Main function to send emails
export const sendEmail = async (to_email, company_name, type, additionalData = {}) => {
  try {
    // Get the appropriate template ID for this email type
    const templateId = EMAILJS_CONFIG.templateIds[type];
    if (!templateId) {
      throw new Error(`No template configured for email type: ${type}`);
    }

    // Prepare template parameters
    const templateParams = {
      to_email: to_email,
      company_name: company_name,
      reply_to: 'pharouq900@gmail.com',
      amount: additionalData.amount ? additionalData.amount.toLocaleString() : '',
      reason: additionalData.reason || '',
      document_name: additionalData.document_name || '',
      action_url: additionalData.action_url || `${window.location.origin}/dashboard`,
      action_text: 'Go to Dashboard'
    };

    // Add subject and message based on email type
    if (type.includes('Approved')) {
      templateParams.subject = getApprovalSubject(type, additionalData);
      templateParams.message = getApprovalMessage(type, additionalData);
      templateParams.bg_color = '#e8f5e9';
    } else if (type.includes('Rejected')) {
      templateParams.subject = getRejectionSubject(type, additionalData);
      templateParams.message = getRejectionMessage(type, additionalData);
      templateParams.bg_color = '#ffebee';
    }

    console.log('📧 Sending email:', {
      to: to_email,
      type,
      templateId,
      subject: templateParams.subject
    });

    // Send email using EmailJS
    const response = await emailjs.send(
      EMAILJS_CONFIG.serviceId,
      templateId,
      templateParams
    );

    console.log('✅ Email sent successfully to:', to_email);
    return { success: true, data: response };
  } catch (error) {
    console.error('❌ Failed to send email:', error);
    return { success: false, error: error.message };
  }
};

// Helper functions for subjects and messages
const getApprovalSubject = (type, data) => {
  switch(type) {
    case 'organizationApproved':
      return '🎉 Your Organization Has Been Approved!';
    case 'documentApproved':
      return `✅ Document Approved: ${data.document_name}`;
    case 'paymentApproved':
      return `💰 Payment Confirmed: ₦${data.amount?.toLocaleString()}`;
    default:
      return 'Update from Pharouq900';
  }
};

const getApprovalMessage = (type, data) => {
  switch(type) {
    case 'organizationApproved':
      return 'Great news! Your organization registration has been APPROVED. You can now access all features and start using our platform.';
    case 'documentApproved':
      return `Your document "${data.document_name}" has been reviewed and APPROVED. All requirements have been met.`;
    case 'paymentApproved':
      return `Your payment of ₦${data.amount?.toLocaleString()} has been successfully processed and APPROVED. Thank you for your payment!`;
    default:
      return 'Your request has been approved.';
  }
};

const getRejectionSubject = (type, data) => {
  switch(type) {
    case 'organizationRejected':
      return '❌ Organization Registration Update';
    case 'documentRejected':
      return `📄 Document Needs Attention: ${data.document_name}`;
    case 'paymentRejected':
      return '❌ Payment Verification Failed';
    default:
      return 'Important Update from Pharouq900';
  }
};

const getRejectionMessage = (type, data) => {
  switch(type) {
    case 'organizationRejected':
      return 'We have reviewed your organization registration and it was REJECTED. Please see the reason below and take necessary action.';
    case 'documentRejected':
      return `Your document "${data.document_name}" requires your attention. It has been REJECTED.`;
    case 'paymentRejected':
      return `Your payment of ₦${data.amount?.toLocaleString()} could not be verified and has been REJECTED.`;
    default:
      return 'Your request could not be processed at this time.';
  }
};

// Helper functions for specific email types
export const sendOrganizationApproved = (email, companyName) => 
  sendEmail(email, companyName, 'organizationApproved');

export const sendOrganizationRejected = (email, companyName, reason) => 
  sendEmail(email, companyName, 'organizationRejected', { reason });

export const sendDocumentApproved = (email, companyName, documentName) => 
  sendEmail(email, companyName, 'documentApproved', { document_name: documentName });

export const sendDocumentRejected = (email, companyName, documentName, reason) => 
  sendEmail(email, companyName, 'documentRejected', { document_name: documentName, reason });

export const sendPaymentApproved = (email, companyName, amount) => 
  sendEmail(email, companyName, 'paymentApproved', { amount });

export const sendPaymentRejected = (email, companyName, amount, reason) => 
  sendEmail(email, companyName, 'paymentRejected', { amount, reason });