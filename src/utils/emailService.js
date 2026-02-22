import emailjs from '@emailjs/browser';

// Your EmailJS credentials
const EMAILJS_CONFIG = {
  publicKey: process.env.REACT_APP_EMAILJS_PUBLIC_KEY || 'vEb1fxTEwxzpmcNmm',
  serviceId: process.env.REACT_APP_EMAILJS_SERVICE_ID || 'service_hoj7fzf',
  templates: {
    admin: 'template_kwa5fnl',     // For admin notifications (new registrations)
    org: 'template_orimz2f'         // For organization notifications
  }
};

// Initialize EmailJS
emailjs.init(EMAILJS_CONFIG.publicKey);

// Admin email
const ADMIN_EMAIL = 'pharouq900@gmail.com';

// Configuration flags
const EMAIL_CONFIG = {
  SEND_REJECTION_EMAILS: process.env.REACT_APP_SEND_REJECTION_EMAILS === 'true' || false, // Disabled by default
};

// ============================================
// ADMIN NOTIFICATIONS (New Registrations ONLY)
// ============================================

export const sendAdminRegistrationNotification = async (orgData) => {
  try {
    const templateParams = {
      to_email: ADMIN_EMAIL,
      company_name: orgData.company_name,
      message: `A new organization has registered on the platform.

Registration Details:
• Company: ${orgData.company_name}
• Email: ${orgData.email}
• Phone: ${orgData.phone_number || 'N/A'}
• CAC Number: ${orgData.cac_number || 'N/A'}
• Business Nature: ${orgData.business_nature || 'N/A'}
• Registration Date: ${new Date().toLocaleString()}`,
      action_url: `${window.location.origin}/admin/organizations/${orgData.id}`,
      action_text: 'Review Registration',
      reply_to: orgData.email
    };

    console.log('📧 Sending admin registration notification');

    const response = await emailjs.send(
      EMAILJS_CONFIG.serviceId,
      EMAILJS_CONFIG.templates.admin,
      templateParams
    );

    console.log('✅ Admin registration notification sent');
    return { success: true, data: response };
  } catch (error) {
    console.error('❌ Failed to send admin notification:', error);
    return { success: false, error: error.message };
  }
};

// ============================================
// PAYMENT APPROVAL EMAIL - ENHANCED VERSION
// ============================================

export const sendPaymentApprovedEmail = async (email, companyName, amount, organizationStatus = 'pending') => {
  try {
    if (!email) {
      throw new Error('Recipient email is required');
    }

    // Determine if this is first-time approval or renewal
    const isFirstTimeApproval = organizationStatus === 'pending' || organizationStatus === 'pending_approval';
    
    // Enhanced congratulatory messages
    const mainMessage = isFirstTimeApproval 
      ? `🎉 Congratulations ${companyName}! Your payment of ₦${amount?.toLocaleString()} has been successfully approved and your organization is now fully activated on our platform.`
      : `🎉 Great news ${companyName}! Your payment of ₦${amount?.toLocaleString()} has been approved. Thank you for your continued partnership.`;
    
    const detailsMessage = isFirstTimeApproval
      ? `Your organization has been officially verified and activated. You now have complete access to all features including: document management, compliance tracking, notifications, and full dashboard functionality. We're excited to have you on board!`
      : `Your renewal payment has been processed successfully. Your access to all platform features remains active. Thank you for your continued trust in our services.`;

    const templateParams = {
      to_email: email,
      company_name: companyName,
      main_message: mainMessage,
      details: detailsMessage,
      action_url: `${window.location.origin}/dashboard`,
      action_text: 'Access Your Dashboard',
      reply_to: 'support@pharouq900.com'
    };

    console.log('📧 Sending enhanced payment approval email to:', email);

    const response = await emailjs.send(
      EMAILJS_CONFIG.serviceId,
      EMAILJS_CONFIG.templates.org,
      templateParams
    );

    console.log('✅ Enhanced payment approval email sent successfully');
    return { success: true, data: response };
  } catch (error) {
    console.error('❌ Failed to send payment approval email:', error);
    return { success: false, error: error.message };
  }
};

// ============================================
// PAYMENT REJECTION EMAIL - OPTIONAL
// ============================================

// ============================================
// PAYMENT REJECTION EMAIL - WITH OVERRIDE OPTION
// ============================================

export const sendPaymentRejectedEmail = async (email, companyName, amount, rejectionReason, forceSend = false) => {
  try {
    if (!email) {
      throw new Error('Recipient email is required');
    }

    // Check if rejection emails are enabled - allow force send
    if (!EMAIL_CONFIG.SEND_REJECTION_EMAILS && !forceSend) {
      console.log('ℹ️ Rejection emails are disabled by configuration');
      return { success: true, skipped: true, message: 'Rejection emails disabled' };
    }

    const templateParams = {
      to_email: email,
      company_name: companyName,
      main_message: `Update regarding your payment of ₦${amount?.toLocaleString()}`,
      details: `We regret to inform you that your payment has been rejected. 
      
Reason for rejection: ${rejectionReason || 'Not specified'}

Please contact our support team for assistance or to resolve any issues with your payment.`,
      action_url: `${window.location.origin}/support`,
      action_text: 'Contact Support',
      reply_to: 'support@pharouq900.com'
    };

    console.log('📧 Sending payment rejection email to:', email);

    const response = await emailjs.send(
      EMAILJS_CONFIG.serviceId,
      EMAILJS_CONFIG.templates.org,
      templateParams
    );

    console.log('✅ Payment rejection email sent successfully');
    return { success: true, data: response };
  } catch (error) {
    console.error('❌ Failed to send payment rejection email:', error);
    return { success: false, error: error.message };
  }
};