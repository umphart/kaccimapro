import emailjs from '@emailjs/browser';

// Your EmailJS credentials
const EMAILJS_CONFIG = {
  publicKey: process.env.REACT_APP_EMAILJS_PUBLIC_KEY || 'vEb1fxTEwxzpmcNmm',
  serviceId: process.env.REACT_APP_EMAILJS_SERVICE_ID || 'service_hoj7fzf',
  templates: {
    admin: 'template_kwa5fnl',     // For admin notifications (new registrations)
    org: 'template_orimz2f'         // For organization notifications (approvals/rejections)
  }
};

// Initialize EmailJS
emailjs.init(EMAILJS_CONFIG.publicKey);

// Admin email
const ADMIN_EMAIL = 'pharouq900@gmail.com';

// ============================================
// ADMIN NOTIFICATIONS (New Registrations ONLY)
// ============================================

// Send notification to admin about new registration
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
// ORGANIZATION NOTIFICATIONS (Approvals/Rejections)
// ============================================

// Main function to send emails to organizations
const sendOrgEmail = async (to_email, type, data) => {
  try {
    if (!to_email) {
      throw new Error('Recipient email is required');
    }

    let templateParams = {};

    if (type === 'organization_approved') {
      templateParams = {
        to_email: to_email,
        status: 'approved',
        title: 'Organization Approved',
        company_name: data.company_name,
        main_message: 'Congratulations! Your organization registration has been approved.',
        bg_color: '#e8f5e9',
        details: 'Your organization is now fully registered and you can access all features.',
        action_url: `${window.location.origin}/dashboard`,
        action_text: 'Go to Dashboard'
      };
    } 
    else if (type === 'organization_rejected') {
      templateParams = {
        to_email: to_email,
        status: 'rejected',
        title: 'Organization Rejected',
        company_name: data.company_name,
        main_message: 'We regret to inform you that your organization registration has been rejected.',
        bg_color: '#ffebee',
        details: 'Your organization registration could not be approved at this time.',
        reason: data.reason,
        action_url: `${window.location.origin}/contact`,
        action_text: 'Contact Support'
      };
    }

    console.log('📧 Sending email to organization:', {
      to: to_email,
      type
    });

    const response = await emailjs.send(
      EMAILJS_CONFIG.serviceId,
      EMAILJS_CONFIG.templates.org,
      templateParams
    );

    console.log('✅ Email sent successfully to organization:', to_email);
    return { success: true, data: response };
  } catch (error) {
    console.error('❌ Failed to send email:', error);
    return { success: false, error: error.message };
  }
};

// Helper functions for organization notifications
export const sendOrganizationApproved = (email, companyName) => {
  return sendOrgEmail(email, 'organization_approved', { company_name: companyName });
};

export const sendOrganizationRejected = (email, companyName, reason) => {
  return sendOrgEmail(email, 'organization_rejected', { company_name: companyName, reason });
};

// Note: Payment notification functions have been removed
// When payment is approved, organization is approved - use sendOrganizationApproved