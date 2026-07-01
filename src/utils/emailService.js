// src/utils/emailService.js
import emailjs from '@emailjs/browser';

// Your EmailJS credentials
const EMAILJS_CONFIG = {
  publicKey: process.env.REACT_APP_EMAILJS_PUBLIC_KEY || 'vEb1fxTEwxzpmcNmm',
  serviceId: process.env.REACT_APP_EMAILJS_SERVICE_ID || 'service_hoj7fzf',
  templates: {
    admin: 'template_kwa5fnl',
    org: 'template_orimz2f'
  }
};

// Initialize EmailJS
emailjs.init(EMAILJS_CONFIG.publicKey);

// ============================================
// SEND RAW EMAIL (No template, just raw content)
// ============================================

export const sendRawEmail = async ({
  toEmail,
  companyName,
  subject,
  message,
  actionUrl = null,
  actionText = null
}) => {
  try {
    if (!toEmail) {
      throw new Error('Recipient email is required');
    }

    // Build the full email with just the raw content
    let fullMessage = `
KACCIMA
Kano Chamber of Commerce, Industry, Mines & Agriculture

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Dear ${companyName || 'Member'},

${message}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

`;

    if (actionUrl && actionText) {
      fullMessage += `
${actionText}: ${actionUrl}

`;
    }

    fullMessage += `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Need help? Contact us:
📧 info@kaccima.ng
📞 +2347063174462

Best regards,
The KACCIMA Team
    `;

    const templateParams = {
      to_email: toEmail,
      company_name: companyName || 'Member',
      message: fullMessage,
      action_url: actionUrl || window.location.origin,
      action_text: actionText || 'Visit Dashboard',
      reply_to: 'info@kaccima.ng'
    };

    // Use the org template as a carrier for the raw message
    const response = await emailjs.send(
      EMAILJS_CONFIG.serviceId,
      EMAILJS_CONFIG.templates.org,
      templateParams
    );

    return { success: true, data: response };
  } catch (error) {
    console.error('Failed to send email:', error);
    return { success: false, error: error.message };
  }
};

// ============================================
// SEND REFEREE CONFIRMATION EMAIL (Using Raw Email)
// ============================================

export const sendRefereeConfirmationEmail = async ({ 
  refereeEmail, 
  refereeName, 
  applicantName, 
  applicantRegNumber,
  applicantPhone,
  applicantEmail,
  status = 'pending'
}) => {
  try {
    if (!refereeEmail) {
      throw new Error('Referee email is required');
    }

    const confirmUrl = `${window.location.origin}/referee-confirm?referee=${encodeURIComponent(refereeEmail)}&applicant=${encodeURIComponent(applicantName)}`;
    const rejectUrl = `${window.location.origin}/referee-reject?referee=${encodeURIComponent(refereeEmail)}&applicant=${encodeURIComponent(applicantName)}`;

    const message = `
We hope this message finds you well.

${applicantName} has submitted a membership application to KACCIMA and has kindly designated you as a referee. As a respected member of our Chamber, your professional endorsement is highly valued in this process.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 APPLICANT INFORMATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Company Name:        ${applicantName}
Registration Number: ${applicantRegNumber || 'N/A'}
Phone Number:        ${applicantPhone || 'N/A'}
Email Address:       ${applicantEmail || 'N/A'}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

We kindly request your professional assessment of the above-mentioned applicant. As a fellow member of the Chamber, your endorsement would significantly support their membership journey.

Please confirm: Do you know and endorse ${applicantName} for membership with KACCIMA?

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📌 ACTION REQUIRED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ CONFIRM & ENDORSE:
${confirmUrl}

❌ DECLINE REQUEST:
${rejectUrl}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📌 IMPORTANT NOTES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Your response will be treated with strict confidentiality
• This endorsement helps maintain the high standards of our Chamber membership
• If you have any concerns, please contact our membership team

Should you have any questions, please contact us:
📧 membership@kaccima.ng
📞 +2347063174462

Thank you for your continued support of KACCIMA.

Best regards,
The KACCIMA Membership Team
    `;

    // Use the raw email function
    const result = await sendRawEmail({
      toEmail: refereeEmail,
      companyName: refereeName || 'Valued Member',
      subject: `Referee Request: ${applicantName}`,
      message: message,
      actionUrl: confirmUrl,
      actionText: '✅ Confirm & Endorse'
    });

    return result;

  } catch (error) {
    console.error('Failed to send referee confirmation email:', error);
    return { success: false, error: error.message };
  }
};

// ============================================
// SEND ORGANIZATION CREDENTIALS EMAIL
// ============================================

export const sendOrganizationCredentials = async (email, companyName, password, registrationNumber) => {
  try {
    if (!email) {
      throw new Error('Recipient email is required');
    }

    const loginUrl = `${window.location.origin}/login`;

    const fullMessage = `
🎉 Welcome to KACCIMA!

Your organization "${companyName}" has been successfully registered on the Kano Chamber of Commerce platform.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔑 YOUR LOGIN CREDENTIALS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📧 Email: ${email}
🔒 Password: ${password}
📋 Registration Number: ${registrationNumber}
📅 Registration Date: ${new Date().toLocaleDateString()}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⚠️ IMPORTANT SECURITY NOTICE:
• This password is temporary. Please change it after your first login.
• Never share your password with anyone.
• If you suspect unauthorized access, contact support immediately.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔐 WHAT TO DO NEXT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. Click the "Login to Dashboard" button below
2. Use your email and the password above to login
3. Change your password immediately after logging in
4. Complete your organization profile
5. Upload any additional documents if needed

Need help? Contact our support team:
📧 info@kaccima.ng
📞 +2347063174462

We're excited to have you on board!

Best regards,
The KACCIMA Team
    `;

    const templateParams = {
      to_email: email,
      company_name: companyName,
      message: fullMessage,
      action_url: loginUrl,
      action_text: '🔐 Login to Dashboard',
      reply_to: 'info@kaccima.ng'
    };

    const response = await emailjs.send(
      EMAILJS_CONFIG.serviceId,
      EMAILJS_CONFIG.templates.org,
      templateParams
    );

    return { success: true, data: response };
  } catch (error) {
    console.error('Failed to send credentials email:', error);
    return { success: false, error: error.message };
  }
};

// ============================================
// ADMIN REGISTRATION NOTIFICATION
// ============================================

export const sendAdminRegistrationNotification = async (orgData) => {
  try {
    const fullMessage = `
🏢 NEW ORGANIZATION REGISTRATION

A new organization has registered on the platform and requires review.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 REGISTRATION DETAILS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Company:        ${orgData.company_name}
Email:          ${orgData.email}
Phone:          ${orgData.phone_number1 || 'N/A'}
CAC Number:     ${orgData.cac_number || 'N/A'}
Business Nature: ${orgData.business_nature || 'N/A'}
Registration Date: ${new Date().toLocaleString()}
Status:         ${orgData.status || 'Pending'}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Click the button below to review and approve this registration.`;

    const templateParams = {
      to_email: 'pharouq900@gmail.com',
      company_name: orgData.company_name,
      message: fullMessage,
      action_url: `${window.location.origin}/admin/organizations/${orgData.id}`,
      action_text: '📋 Review Registration',
      reply_to: orgData.email
    };

    const response = await emailjs.send(
      EMAILJS_CONFIG.serviceId,
      EMAILJS_CONFIG.templates.admin,
      templateParams
    );

    return { success: true, data: response };
  } catch (error) {
    console.error('Failed to send admin notification:', error);
    return { success: false, error: error.message };
  }
};

// ============================================
// ADMIN PAYMENT NOTIFICATION
// ============================================

export const sendAdminPaymentNotification = async (paymentData, organization) => {
  try {
    const fullMessage = `
💰 NEW PAYMENT RECEIVED

A new payment has been submitted and requires review.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💳 PAYMENT DETAILS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Organization:    ${organization.company_name}
Amount:          ₦${paymentData.amount?.toLocaleString()}
Payment Type:    ${paymentData.payment_type === 'first' ? 'First Payment' : 'Renewal'}
Payment Method:  ${paymentData.payment_method || 'Bank Transfer'}
Payment Reference: ${paymentData.payment_reference || 'N/A'}
Payment Year:    ${paymentData.payment_year || new Date().getFullYear()}
Submission Date: ${new Date(paymentData.created_at).toLocaleString()}
Status:          ${paymentData.status || 'pending'}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Click the button below to review this payment.`;

    const templateParams = {
      to_email: 'pharouq900@gmail.com',
      company_name: organization.company_name,
      message: fullMessage,
      action_url: `${window.location.origin}/admin/payments/${paymentData.id}`,
      action_text: '💰 Review Payment',
      reply_to: organization.email
    };

    const response = await emailjs.send(
      EMAILJS_CONFIG.serviceId,
      EMAILJS_CONFIG.templates.admin,
      templateParams
    );

    return { success: true, data: response };
  } catch (error) {
    console.error('Failed to send admin payment notification:', error);
    return { success: false, error: error.message };
  }
};

// ============================================
// PAYMENT APPROVAL EMAIL (To Organization)
// ============================================

export const sendPaymentApprovedEmail = async (email, companyName, amount, organizationStatus = 'pending') => {
  try {
    if (!email) {
      throw new Error('Recipient email is required');
    }

    const isFirstTimeApproval = organizationStatus === 'pending' || organizationStatus === 'pending_approval';
    
    const fullMessage = isFirstTimeApproval 
      ? `🎉 Congratulations ${companyName}!

Your payment of ₦${amount?.toLocaleString()} has been successfully approved and your organization is now fully activated on our platform.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ ACCOUNT ACTIVATED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Your organization has been officially verified and activated. You now have complete access to all features including: document management, compliance tracking, notifications, and full dashboard functionality. We're excited to have you on board!

📋 IMPORTANT DOCUMENTS NOW AVAILABLE:
• Your Membership Certificate is now ready for download from your dashboard
• Payment Receipt/Invoice can be accessed and printed from the Payments section
• Organization profile documents are available for viewing and download

To access these documents:
1. Log in to your dashboard at: ${window.location.origin}/dashboard
2. Navigate to the "Documents" section to download your Membership Certificate
3. Go to "Payments" history to view and download your payment receipt
4. Visit "Organization Profile" to view all your registered details

These documents serve as official proof of your membership with KACCIMA.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Need help? Contact our support team:
📧 info@kaccima.ng
📞 +2347063174462

Best regards,
The KACCIMA Team`
      : `🎉 Great news ${companyName}!

Your payment of ₦${amount?.toLocaleString()} has been approved. Thank you for your continued partnership.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ RENEWAL COMPLETED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Your renewal payment has been processed successfully. Your access to all platform features remains active.

📋 UPDATED DOCUMENTS AVAILABLE:
• Your renewed Membership Certificate is now ready for download
• Payment receipt for this renewal is available in the Payments section
• Your membership validity has been extended for another year

To access your updated documents:
1. Log in to your dashboard at: ${window.location.origin}/dashboard
2. Download your renewed certificate from the "Documents" section
3. View/print your payment receipt from "Payments" history
4. Check your organization profile for updated membership expiry date

Thank you for your continued trust in our services.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Need help? Contact our support team:
📧 info@kaccima.ng
📞 +2347063174462

Best regards,
The KACCIMA Team`;

    const templateParams = {
      to_email: email,
      company_name: companyName,
      message: fullMessage,
      action_url: `${window.location.origin}/dashboard`,
      action_text: 'Access Your Dashboard & Download Documents',
      reply_to: 'info@kaccima.ng'
    };

    const response = await emailjs.send(
      EMAILJS_CONFIG.serviceId,
      EMAILJS_CONFIG.templates.org,
      templateParams
    );

    return { success: true, data: response };
  } catch (error) {
    console.error('Failed to send payment approval email:', error);
    return { success: false, error: error.message };
  }
};

// ============================================
// PAYMENT REJECTION EMAIL (To Organization)
// ============================================

export const sendPaymentRejectedEmail = async (email, companyName, amount, rejectionReason) => {
  try {
    if (!email) {
      throw new Error('Recipient email is required');
    }

    const fullMessage = `
Dear ${companyName},

We regret to inform you that your payment of ₦${amount?.toLocaleString()} has been rejected.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
❌ PAYMENT REJECTED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Reason for rejection: ${rejectionReason || 'Not specified'}

Please contact our support team for assistance or to resolve any issues with your payment.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Need help? Contact us:
📧 info@kaccima.ng
📞 +2347063174462

Best regards,
The KACCIMA Team`;

    const templateParams = {
      to_email: email,
      company_name: companyName,
      message: fullMessage,
      action_url: `${window.location.origin}/support`,
      action_text: 'Contact Support',
      reply_to: 'info@kaccima.ng'
    };

    const response = await emailjs.send(
      EMAILJS_CONFIG.serviceId,
      EMAILJS_CONFIG.templates.org,
      templateParams
    );

    return { success: true, data: response };
  } catch (error) {
    console.error('Failed to send payment rejection email:', error);
    return { success: false, error: error.message };
  }
};

// ============================================
// GENERATE RANDOM PASSWORD
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