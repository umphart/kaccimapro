import emailjs from '@emailjs/browser';

// Your EmailJS credentials
const EMAILJS_CONFIG = {
  publicKey: process.env.REACT_APP_EMAILJS_PUBLIC_KEY || 'vEb1fxTEwxzpmcNmm',
  serviceId: process.env.REACT_APP_EMAILJS_SERVICE_ID || 'service_hoj7fzf',
  templates: {
    admin: 'template_kwa5fnl',     // For admin notifications (new registrations)
    org: 'template_orimz2f'         // For organization notifications (payment approvals ONLY)
  }
};

// Initialize EmailJS
emailjs.init(EMAILJS_CONFIG.publicKey);

// Admin email
const ADMIN_EMAIL = 'pharouq900@gmail.com';

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
// PAYMENT APPROVAL EMAIL ONLY
// ============================================

// Send email when payment is approved (organization gets approved)
export const sendPaymentApprovedEmail = async (email, companyName, amount) => {
  try {
    if (!email) {
      throw new Error('Recipient email is required');
    }

    const templateParams = {
      to_email: email,
      status: 'approved',
      title: 'Payment Approved! 🎉',
      company_name: companyName,
      main_message: `Congratulations! Your payment of ₦${amount?.toLocaleString()} has been approved and your organization is now fully activated.`,
      bg_color: '#e8f5e9',
      details: 'You can now access all features of your dashboard.',
      action_url: `${window.location.origin}/dashboard`,
      action_text: 'Go to Dashboard',
      reason: '' // Empty reason for approval
    };

    console.log('📧 Sending payment approval email to:', email);

    const response = await emailjs.send(
      EMAILJS_CONFIG.serviceId,
      EMAILJS_CONFIG.templates.org,
      templateParams
    );

    console.log('✅ Payment approval email sent successfully');
    return { success: true, data: response };
  } catch (error) {
    console.error('❌ Failed to send payment approval email:', error);
    return { success: false, error: error.message };
  }
};

// ============================================
// REMOVED FUNCTIONS (No emails for these):
// - sendOrganizationApproved
// - sendOrganizationRejected
// - sendPaymentRejected
// ============================================