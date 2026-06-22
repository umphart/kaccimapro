import emailjs from '@emailjs/browser';

// Your EmailJS credentials
const EMAILJS_CONFIG = {
  publicKey: process.env.REACT_APP_EMAILJS_PUBLIC_KEY || 'vEb1fxTEwxzpmcNmm',
  serviceId: process.env.REACT_APP_EMAILJS_SERVICE_ID || 'service_hoj7fzf',
  templates: {
    admin: 'template_kwa5fnl',  // Used for both admin notifications AND organization credentials
    org: 'template_orimz2f'      // Used for organization notifications (payment approvals, etc.)
  }
};

// Initialize EmailJS
emailjs.init(EMAILJS_CONFIG.publicKey);

// Admin email
const ADMIN_EMAIL = 'pharouq900@gmail.com';

// Configuration flags
const EMAIL_CONFIG = {
  SEND_REJECTION_EMAILS: process.env.REACT_APP_SEND_REJECTION_EMAILS === 'true' || false,
};

// ============================================
// SEND ORGANIZATION CREDENTIALS EMAIL
// Uses the admin template (template_kwa5fnl) with modified content
// ============================================

export const sendOrganizationCredentials = async (email, companyName, password, registrationNumber) => {
  try {
    if (!email) {
      throw new Error('Recipient email is required');
    }

    const loginUrl = `${window.location.origin}/login`;
    const dashboardUrl = `${window.location.origin}/dashboard`;

    // Format the details with the password and registration info
    const credentialsMessage = `
🔑 **Your Login Credentials:**
• Email: ${email}
• Password: ${password}

📋 **Registration Details:**
• Company: ${companyName}
• Registration Number: ${registrationNumber}

⚠️ **Important:** Please change your password after your first login for security.

🔐 **Security Notice:**
• This password is temporary. Please change it immediately after logging in.
• Never share your password with anyone.
• If you suspect unauthorized access, contact support immediately.

For security reasons, we recommend changing your password immediately upon first login.
    `;

    const templateParams = {
      to_email: email,  // Send to the organization email
      company_name: companyName,
      message: `Welcome to KACCIMA! Your organization account has been created.

${credentialsMessage}`,
      action_url: loginUrl,
      action_text: 'Login to Your Account',
      reply_to: 'pharouq900@gmail.com'
    };

    const response = await emailjs.send(
      EMAILJS_CONFIG.serviceId,
      EMAILJS_CONFIG.templates.admin,  // Using the admin template
      templateParams
    );

    console.log('✅ Organization credentials email sent successfully');
    return { success: true, data: response };
  } catch (error) {
    console.error('❌ Failed to send credentials email:', error);
    return { success: false, error: error.message };
  }
};

// ============================================
// ADMIN NOTIFICATIONS (New Registrations)
// Uses the admin template (template_kwa5fnl)
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
// ADMIN PAYMENT NOTIFICATION
// Uses the admin template (template_kwa5fnl)
// ============================================

export const sendAdminPaymentNotification = async (paymentData, organization) => {
  try {
    const templateParams = {
      to_email: ADMIN_EMAIL,
      company_name: organization.company_name,
      message: `A new payment has been submitted and requires review.

Payment Details:
• Organization: ${organization.company_name}
• Amount: ₦${paymentData.amount?.toLocaleString()}
• Payment Type: ${paymentData.payment_type === 'first' ? 'First Payment' : 'Renewal'}
• Payment Method: ${paymentData.payment_method || 'Bank Transfer'}
• Payment Reference: ${paymentData.reference || 'N/A'}
• Payment Year: ${paymentData.payment_year || new Date().getFullYear()}
• Submission Date: ${new Date(paymentData.created_at).toLocaleString()}
• Status: ${paymentData.status || 'pending'}

Review this payment in the admin dashboard.`,
      action_url: `${window.location.origin}/admin/payments/${paymentData.id}`,
      action_text: 'Review Payment',
      reply_to: organization.email
    };

    const response = await emailjs.send(
      EMAILJS_CONFIG.serviceId,
      EMAILJS_CONFIG.templates.admin,
      templateParams
    );

    console.log('✅ Admin payment notification sent successfully');
    return { success: true, data: response };
  } catch (error) {
    console.error('❌ Failed to send admin payment notification:', error);
    return { success: false, error: error.message };
  }
};

// ============================================
// PAYMENT APPROVAL EMAIL (To Organization)
// Uses the org template (template_orimz2f)
// ============================================

export const sendPaymentApprovedEmail = async (email, companyName, amount, organizationStatus = 'pending') => {
  try {
    if (!email) {
      throw new Error('Recipient email is required');
    }

    const isFirstTimeApproval = organizationStatus === 'pending' || organizationStatus === 'pending_approval';
    
    const mainMessage = isFirstTimeApproval 
      ? `🎉 Congratulations ${companyName}! Your payment of ₦${amount?.toLocaleString()} has been successfully approved and your organization is now fully activated on our platform.`
      : `🎉 Great news ${companyName}! Your payment of ₦${amount?.toLocaleString()} has been approved. Thank you for your continued partnership.`;
    
    const detailsMessage = isFirstTimeApproval
      ? `Your organization has been officially verified and activated. You now have complete access to all features including: document management, compliance tracking, notifications, and full dashboard functionality. We're excited to have you on board!

📋 **Important Documents Now Available:**
• Your Membership Certificate is now ready for download from your dashboard
• Payment Receipt/Invoice can be accessed and printed from the Payments section
• Organization profile documents are available for viewing and download

To access these documents:
1. Log in to your dashboard at: ${window.location.origin}/dashboard
2. Navigate to the "Documents" section to download your Membership Certificate
3. Go to "Payments" history to view and download your payment receipt
4. Visit "Organization Profile" to view all your registered details

These documents serve as official proof of your membership with KACCIMA.`
      : `Your renewal payment has been processed successfully. Your access to all platform features remains active. 

📋 **Updated Documents Available:**
• Your renewed Membership Certificate is now ready for download
• Payment receipt for this renewal is available in the Payments section
• Your membership validity has been extended for another year

To access your updated documents:
1. Log in to your dashboard at: ${window.location.origin}/dashboard
2. Download your renewed certificate from the "Documents" section
3. View/print your payment receipt from "Payments" history
4. Check your organization profile for updated membership expiry date

Thank you for your continued trust in our services.`;

    const templateParams = {
      to_email: email,
      company_name: companyName,
      main_message: mainMessage,
      details: detailsMessage,
      action_url: `${window.location.origin}/dashboard`,
      action_text: 'Access Your Dashboard & Download Documents',
      action_2_url: `${window.location.origin}/dashboard/documents`,
      action_2_text: 'Go to Documents Section',
      action_3_url: `${window.location.origin}/dashboard/payments`,
      action_3_text: 'View Payment History',
      reply_to: 'pharouq900@gmail.com',
      help_text: 'Having trouble downloading? Visit our support page or contact us directly.',
      support_email: 'info@kaccima.ng',
      support_phone: '+2347063174462'
    };

    const response = await emailjs.send(
      EMAILJS_CONFIG.serviceId,
      EMAILJS_CONFIG.templates.org,
      templateParams
    );

    console.log('✅ Payment approval email sent to organization with document download instructions');
    return { success: true, data: response };
  } catch (error) {
    console.error('❌ Failed to send payment approval email:', error);
    return { success: false, error: error.message };
  }
};

// ============================================
// PAYMENT REJECTION EMAIL (To Organization)
// Uses the org template (template_orimz2f)
// ============================================

export const sendPaymentRejectedEmail = async (email, companyName, amount, rejectionReason, forceSend = false) => {
  try {
    if (!email) {
      throw new Error('Recipient email is required');
    }

    if (!EMAIL_CONFIG.SEND_REJECTION_EMAILS && !forceSend) {
      console.log('⚠️ Rejection emails are disabled');
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
      reply_to: 'pharouq900@gmail.com'
    };

    const response = await emailjs.send(
      EMAILJS_CONFIG.serviceId,
      EMAILJS_CONFIG.templates.org,
      templateParams
    );

    console.log('✅ Payment rejection email sent to organization');
    return { success: true, data: response };
  } catch (error) {
    console.error('❌ Failed to send payment rejection email:', error);
    return { success: false, error: error.message };
  }
};

// ============================================
// GENERATE RANDOM PASSWORD (Utility)
// ============================================

export const generateRandomPassword = () => {
  const length = 12;
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
  let password = '';
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * charset.length);
    password += charset[randomIndex];
  }
  return password;
};