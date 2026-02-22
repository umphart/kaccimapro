import emailjs from '@emailjs/browser';

// Your EmailJS credentials
const EMAILJS_CONFIG = {
  publicKey: process.env.REACT_APP_EMAILJS_PUBLIC_KEY || 'vEb1fxTEwxzpmcNmm',
  serviceId: process.env.REACT_APP_EMAILJS_SERVICE_ID || 'service_hoj7fzf',
  // Template for admin notifications (registrations/payments)
  templateId: 'template_orimz2f'  // Using the simpler template
};

// Initialize EmailJS
emailjs.init(EMAILJS_CONFIG.publicKey);

// Admin email address
const ADMIN_EMAIL = 'pharouq900@gmail.com';

// Send notification to admin about new registration
export const sendAdminRegistrationNotification = async (orgData) => {
  try {
    const templateParams = {
      to_email: ADMIN_EMAIL,
      company_name: orgData.company_name,
      subject: '🚨 New Organization Registration',
      message: `A new organization has registered on the platform.

Registration Details:
• Company: ${orgData.company_name}
• Email: ${orgData.email}
• Phone: ${orgData.phone_number || 'N/A'}
• CAC Number: ${orgData.cac_number || 'N/A'}
• Business Nature: ${orgData.business_nature || 'N/A'}
• Registration Date: ${new Date().toLocaleString()}

Please review the registration in the admin dashboard.`,
      bg_color: '#fff3e0',
      action_url: `${window.location.origin}/admin/organizations/${orgData.id}`,
      action_text: '🔍 Review Registration',
      reply_to: orgData.email
    };

    console.log('📧 Sending admin registration notification:', templateParams);

    const response = await emailjs.send(
      EMAILJS_CONFIG.serviceId,
      EMAILJS_CONFIG.templateId,
      templateParams
    );

    console.log('✅ Admin registration notification sent');
    return { success: true, data: response };
  } catch (error) {
    console.error('❌ Failed to send admin notification:', error);
    return { success: false, error: error.message };
  }
};

// Send notification to admin about new payment
export const sendAdminPaymentNotification = async (paymentData, orgData) => {
  try {
    const templateParams = {
      to_email: ADMIN_EMAIL,
      company_name: orgData.company_name,
      subject: '💰 New Payment Submitted',
      message: `A new payment has been submitted and requires verification.

Payment Details:
• Organization: ${orgData.company_name}
• Amount: ₦${paymentData.amount?.toLocaleString()}
• Payment Type: ${paymentData.payment_type === 'first' ? 'First Payment' : 'Annual Renewal'}
• Payment Year: ${paymentData.payment_year}
• Date: ${new Date().toLocaleString()}

Please verify this payment in the admin dashboard.`,
      bg_color: '#e3f2fd',
      action_url: `${window.location.origin}/admin/payments/${paymentData.id}`,
      action_text: '✅ Verify Payment',
      reply_to: orgData.email,
      amount: paymentData.amount?.toLocaleString()
    };

    console.log('📧 Sending admin payment notification:', templateParams);

    const response = await emailjs.send(
      EMAILJS_CONFIG.serviceId,
      EMAILJS_CONFIG.templateId,
      templateParams
    );

    console.log('✅ Admin payment notification sent');
    return { success: true, data: response };
  } catch (error) {
    console.error('❌ Failed to send admin payment notification:', error);
    return { success: false, error: error.message };
  }
};

// Send notification to admin about document upload (if needed)
export const sendAdminDocumentNotification = async (orgData, documentName) => {
  try {
    const templateParams = {
      to_email: ADMIN_EMAIL,
      company_name: orgData.company_name,
      subject: '📄 New Document Uploaded',
      message: `A new document has been uploaded for review.

Document Details:
• Organization: ${orgData.company_name}
• Document: ${documentName}
• Upload Date: ${new Date().toLocaleString()}

Please review this document in the admin dashboard.`,
      bg_color: '#e8f5e9',
      action_url: `${window.location.origin}/admin/organizations/${orgData.id}`,
      action_text: '📄 Review Document',
      reply_to: orgData.email
    };

    console.log('📧 Sending admin document notification:', templateParams);

    const response = await emailjs.send(
      EMAILJS_CONFIG.serviceId,
      EMAILJS_CONFIG.templateId,
      templateParams
    );

    console.log('✅ Admin document notification sent');
    return { success: true, data: response };
  } catch (error) {
    console.error('❌ Failed to send admin document notification:', error);
    return { success: false, error: error.message };
  }
};