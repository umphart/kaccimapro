import emailjs from '@emailjs/browser';

// Your EmailJS credentials
const EMAILJS_CONFIG = {
  publicKey: process.env.REACT_APP_EMAILJS_PUBLIC_KEY || 'vEb1fxTEwxzpmcNmm',
  serviceId: process.env.REACT_APP_EMAILJS_SERVICE_ID || 'service_hoj7fzf',
  templateId: process.env.REACT_APP_EMAILJS_TEMPLATE_ID || 'template_orimz2f'
};

// Initialize EmailJS
emailjs.init(EMAILJS_CONFIG.publicKey);

// Email templates configuration
const emailTemplates = {
  organizationApproved: {
    subject: '🎉 Your Organization Has Been Approved!',
    bg_color: '#e8f5e9',
    message: 'Great news! Your organization registration has been APPROVED. You can now access all features.',
    action_text: 'Go to Dashboard',
    action_url: `${window.location.origin}/dashboard`
  },
  
  organizationRejected: {
    subject: '❌ Organization Registration Update',
    bg_color: '#ffebee',
    message: 'We have reviewed your organization registration and it was REJECTED.'
  },
  
  documentApproved: {
    subject: '✅ Document Approved',
    bg_color: '#e8f5e9',
    message: 'Your document "{{document_name}}" has been APPROVED.'
  },
  
  documentRejected: {
    subject: '📄 Document Needs Attention',
    bg_color: '#fff3e0',
    message: 'Your document "{{document_name}}" requires your attention.'
  },
  
  paymentApproved: {
    subject: '💰 Payment Confirmed',
    bg_color: '#e8f5e9',
    message: 'Your payment of ₦{{amount}} has been APPROVED.'
  },
  
  paymentRejected: {
    subject: '❌ Payment Verification Failed',
    bg_color: '#ffebee',
    message: 'Your payment of ₦{{amount}} could not be verified.'
  }
};

// Main function to send emails
export const sendEmail = async (to_email, company_name, type, additionalData = {}) => {
  try {
    // Get template configuration
    const template = emailTemplates[type];
    if (!template) {
      throw new Error(`Unknown email type: ${type}`);
    }

    // Process message to replace placeholders
    let message = template.message;
    if (additionalData.document_name) {
      message = message.replace('{{document_name}}', additionalData.document_name);
    }
    if (additionalData.amount) {
      message = message.replace('{{amount}}', additionalData.amount.toLocaleString());
    }

    // Prepare template parameters - MUST match template variables exactly
    const templateParams = {
      to_email: to_email,
      company_name: company_name,
      subject: template.subject,
      message: message,
      bg_color: template.bg_color,
      reason: additionalData.reason || '',
      document_name: additionalData.document_name || '',
      amount: additionalData.amount ? additionalData.amount.toLocaleString() : '',
      action_url: template.action_url || '',
      action_text: template.action_text || '',
      reply_to: 'pharouq900@gmail.com'
    };

    // Log the parameters for debugging
    console.log('📧 Sending email with params:', {
      serviceId: EMAILJS_CONFIG.serviceId,
      templateId: EMAILJS_CONFIG.templateId,
      templateParams
    });

    // For development, we'll actually send emails (comment this out if you want to mock)
    // if (process.env.NODE_ENV === 'development' && process.env.REACT_APP_MOCK_EMAILS === 'true') {
    //   console.log('📧 Email would be sent (mocked):', templateParams);
    //   return { success: true, mock: true };
    // }

    // Send email using EmailJS
    const response = await emailjs.send(
      EMAILJS_CONFIG.serviceId,
      EMAILJS_CONFIG.templateId,
      templateParams
    );

    console.log('✅ Email sent successfully:', response);
    return { success: true, data: response };
  } catch (error) {
    console.error('❌ Failed to send email:', error);
    // Log the full error for debugging
    if (error.text) {
      console.error('Error details:', error.text);
    }
    return { success: false, error: error.message || error.text || 'Unknown error' };
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