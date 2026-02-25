import { useState } from 'react';
import { supabase } from '../../supabaseClient';

export const useOrganizationActions = (organizationId, organization, documents, documentStatus, showAlert, fetchOrganizationDetails) => {
  const [processing, setProcessing] = useState(false);
  const [approveOrgDialog, setApproveOrgDialog] = useState(false);
  const [rejectOrgDialog, setRejectOrgDialog] = useState(false);
  const [orgRejectReason, setOrgRejectReason] = useState('');

  const handleApproveOrganization = async () => {
    setProcessing(true);
    try {
      // Update organization status
      const { error: updateError } = await supabase
        .from('organizations')
        .update({ 
          status: 'approved',
          updated_at: new Date().toISOString()
        })
        .eq('id', organizationId);

      if (updateError) throw updateError;

      // Mark all pending notifications as read
      await supabase
        .from('organization_notifications')
        .update({ read: true })
        .eq('organization_id', organizationId)
        .eq('type', 'pending');

      // Create approval notification
      await supabase
        .from('organization_notifications')
        .insert([{
          organization_id: organizationId,
          type: 'success',
          title: 'Organization Approved',
          message: 'Your organization has been approved. You can now proceed with payment.',
          category: 'registration',
          action_url: '/payment',
          read: false,
          created_at: new Date().toISOString()
        }]);

      // Create notification for admin
      await supabase
        .from('organization_notifications')
        .insert([{
          organization_id: organizationId,
          type: 'info',
          title: 'Organization Approved',
          message: `${organization?.company_name} has been approved.`,
          category: 'registration',
          for_admin: true,
          read: false,
          created_at: new Date().toISOString()
        }]);

      showAlert('success', 'Organization approved successfully');
      setApproveOrgDialog(false);
      fetchOrganizationDetails();
    } catch (error) {
      console.error('Error approving organization:', error);
      showAlert('error', 'Failed to approve organization');
    } finally {
      setProcessing(false);
    }
  };

  const handleRejectOrganization = async () => {
    if (!orgRejectReason) return;

    setProcessing(true);
    try {
      // Update organization status
      const { error: updateError } = await supabase
        .from('organizations')
        .update({ 
          status: 'rejected',
          rejection_reason: orgRejectReason,
          updated_at: new Date().toISOString()
        })
        .eq('id', organizationId);

      if (updateError) throw updateError;

      // Create rejection notification
      await supabase
        .from('organization_notifications')
        .insert([{
          organization_id: organizationId,
          type: 'error',
          title: 'Organization Rejected',
          message: `Your organization has been rejected. Reason: ${orgRejectReason}`,
          category: 'registration',
          action_url: '/organization',
          read: false,
          created_at: new Date().toISOString()
        }]);

      // Create notification for admin
      await supabase
        .from('organization_notifications')
        .insert([{
          organization_id: organizationId,
          type: 'info',
          title: 'Organization Rejected',
          message: `${organization?.company_name} has been rejected. Reason: ${orgRejectReason}`,
          category: 'registration',
          for_admin: true,
          read: false,
          created_at: new Date().toISOString()
        }]);

      showAlert('success', 'Organization rejected successfully');
      setRejectOrgDialog(false);
      setOrgRejectReason('');
      fetchOrganizationDetails();
    } catch (error) {
      console.error('Error rejecting organization:', error);
      showAlert('error', 'Failed to reject organization');
    } finally {
      setProcessing(false);
    }
  };

  return {
    processing,
    approveOrgDialog,
    rejectOrgDialog,
    orgRejectReason,
    setApproveOrgDialog,
    setRejectOrgDialog,
    setOrgRejectReason,
    handleApproveOrganization,
    handleRejectOrganization
  };
};