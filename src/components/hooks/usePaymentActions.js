import { useState } from 'react';
import { supabase } from '../../supabaseClient';
import { sendPaymentApprovedEmail } from '../../utils/emailService';
import emailjs from '@emailjs/browser';

export const usePaymentActions = (payment, organization, paymentId, showAlert, navigate) => {
  const [processing, setProcessing] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [sendRejectionEmail, setSendRejectionEmail] = useState(false);

  const logEmailToDatabase = async (orgId, emailType, recipient, status, metadata = {}, error = null) => {
    try {
      await supabase
        .from('email_logs')
        .insert([{
          organization_id: orgId,
          email_type: emailType,
          recipient: recipient,
          status: status,
          error: error,
          metadata: metadata,
          created_at: new Date().toISOString()
        }]);
    } catch (dbError) {
      console.warn('Failed to log email:', dbError);
    }
  };

  const handleApprove = async () => {
    if (processing) return;
    
    try {
      setProcessing(true);
      
      if (!paymentId || paymentId === 'undefined') {
        throw new Error('Invalid payment ID');
      }

      // Update payment status
      const { error: paymentError } = await supabase
        .from('payments')
        .update({ 
          status: 'approved',
          approved_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', paymentId);

      if (paymentError) throw paymentError;

      // Create notification for payment approval
      if (organization) {
        await supabase
          .from('organization_notifications')
          .insert([{
            organization_id: organization.id,
            type: 'payment_approved',
            title: 'Payment Approved',
            message: `Your payment of ₦${payment.amount?.toLocaleString()} has been approved.`,
            category: 'payment',
            read: false,
            created_at: new Date().toISOString()
          }]);
      }

      // When payment is approved, automatically approve the organization
      if (organization) {
        const wasPending = organization.status === 'pending' || organization.status === 'pending_approval';
        
        if (wasPending) {
          // Update organization status
          const { error: orgError } = await supabase
            .from('organizations')
            .update({ 
              status: 'approved',
              updated_at: new Date().toISOString()
            })
            .eq('id', organization.id);

          if (orgError) throw orgError;

          // Create notification for organization approval
          await supabase
            .from('organization_notifications')
            .insert([{
              organization_id: organization.id,
              type: 'success',
              title: 'Organization Fully Approved',
              message: 'Congratulations! Your organization has been fully approved and activated. You can now access all features.',
              category: 'registration',
              action_url: '/dashboard',
              read: false,
              created_at: new Date().toISOString()
            }]);
        }

        // Send PAYMENT APPROVAL EMAIL
        try {
          const emailResult = await sendPaymentApprovedEmail(
            organization.email,
            organization.company_name,
            payment.amount,
            organization.status
          );
          
          if (emailResult.success) {
            await logEmailToDatabase(
              organization.id,
              'payment_approved',
              organization.email,
              'sent',
              { 
                amount: payment.amount, 
                wasPending,
                payment_id: payment.id
              }
            );
            if (showAlert) showAlert('success', 'Payment approved and notification email sent successfully');
          } else {
            await logEmailToDatabase(
              organization.id,
              'payment_approved',
              organization.email,
              'failed',
              { amount: payment.amount, payment_id: payment.id },
              emailResult.error
            );
            if (showAlert) showAlert('warning', 'Payment approved but email notification failed');
          }
        } catch (emailError) {
          console.warn('Email notification failed:', emailError);
          await logEmailToDatabase(
            organization.id,
            'payment_approved',
            organization.email,
            'failed',
            { amount: payment.amount, payment_id: payment.id },
            emailError.message
          );
          if (showAlert) showAlert('warning', 'Payment approved but email notification failed');
        }
      } else {
        if (showAlert) showAlert('success', 'Payment approved successfully');
      }
      
      setTimeout(() => {
        navigate('/admin/payments');
      }, 3000);
    } catch (error) {
      console.error('Error approving payment:', error);
      if (showAlert) showAlert('error', error.message || 'Failed to approve payment');
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) return;
    if (processing) return;

    try {
      setProcessing(true);
      
      if (!paymentId || paymentId === 'undefined') {
        throw new Error('Invalid payment ID');
      }

      // Update payment status to rejected
      const { error: paymentError } = await supabase
        .from('payments')
        .update({ 
          status: 'rejected',
          rejection_reason: rejectReason,
          rejected_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', paymentId);

      if (paymentError) throw paymentError;

      // Create notification in Supabase
      if (organization) {
        await supabase
          .from('organization_notifications')
          .insert([{
            organization_id: organization.id,
            type: 'payment_rejected',
            title: 'Payment Rejected',
            message: `Your payment of ₦${payment.amount?.toLocaleString()} was rejected. Reason: ${rejectReason}`,
            category: 'payment',
            read: false,
            created_at: new Date().toISOString()
          }]);
      }

      // Send rejection email if enabled
      if (sendRejectionEmail && organization) {
        try {
          const templateParams = {
            to_email: organization.email,
            company_name: organization.company_name,
            main_message: `Update regarding your payment of ₦${payment.amount?.toLocaleString()}`,
            details: `We regret to inform you that your payment has been rejected. 
            
Reason for rejection: ${rejectReason}

Please contact our support team for assistance or to resolve any issues with your payment.`,
            action_url: `${window.location.origin}/support`,
            action_text: 'Contact Support',
            reply_to: 'support@pharouq900.com'
          };

          const response = await emailjs.send(
            'service_hoj7fzf',
            'template_orimz2f',
            templateParams
          );

          if (response) {
            await supabase
              .from('email_logs')
              .insert([{
                organization_id: organization.id,
                email_type: 'payment_rejected',
                recipient: organization.email,
                status: 'sent',
                metadata: { 
                  amount: payment.amount, 
                  reason: rejectReason,
                  payment_id: payment.id
                },
                created_at: new Date().toISOString()
              }]);
          }
        } catch (emailError) {
          console.warn('Failed to send rejection email:', emailError);
          await supabase
            .from('email_logs')
            .insert([{
              organization_id: organization.id,
              email_type: 'payment_rejected',
              recipient: organization.email,
              status: 'failed',
              error: emailError.message,
              metadata: { amount: payment.amount, reason: rejectReason, payment_id: payment.id },
              created_at: new Date().toISOString()
            }]);
        }
      }

      if (showAlert) showAlert('success', 'Payment rejected successfully');
      setRejectDialogOpen(false);
      setRejectReason('');
      setSendRejectionEmail(false);
      
      setTimeout(() => {
        navigate('/admin/payments');
      }, 3000);
    } catch (error) {
      console.error('Error rejecting payment:', error);
      if (showAlert) showAlert('error', error.message || 'Failed to reject payment');
    } finally {
      setProcessing(false);
    }
  };

  return {
    processing,
    rejectDialogOpen,
    rejectReason,
    sendRejectionEmail,
    setRejectDialogOpen,
    setRejectReason,
    setSendRejectionEmail,
    handleApprove,
    handleReject
  };
};