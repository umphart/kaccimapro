import { useState } from 'react';
import { supabase } from '../../supabaseClient';

export const useOrganizationActions = (organizationId, organization, documents, documentStatus, showAlert, onSuccess) => {
  const [processing, setProcessing] = useState(false);
  const [approveOrgDialog, setApproveOrgDialog] = useState(false);
  const [rejectOrgDialog, setRejectOrgDialog] = useState(false);
  const [orgRejectReason, setOrgRejectReason] = useState('');

  const checkAllDocumentsApproved = () => {
    return documents.every(doc => documentStatus[doc.key] === 'approved');
  };

  const handleApproveOrganization = async () => {
    if (processing) return;
    
    try {
      setProcessing(true);
      
      const allApproved = checkAllDocumentsApproved();
      
      if (!allApproved) {
        showAlert('error', 'All documents must be approved before approving the organization');
        setApproveOrgDialog(false);
        return;
      }

      const { error: orgError } = await supabase
        .from('organizations')
        .update({ 
          status: 'approved',
          updated_at: new Date().toISOString()
        })
        .eq('id', organizationId);

      if (orgError) throw orgError;

      await supabase
        .from('organization_notifications')
        .insert([{
          organization_id: organizationId,
          type: 'success',
          title: 'Organization Approved',
          message: 'Your organization has been fully approved! You can now access all features.',
          category: 'registration',
          action_url: '/dashboard',
          read: false
        }]);

      showAlert('success', 'Organization approved successfully');
      setApproveOrgDialog(false);
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error('Error approving organization:', error);
      showAlert('error', 'Failed to approve organization');
    } finally {
      setProcessing(false);
    }
  };

  const handleRejectOrganization = async () => {
    if (!orgRejectReason.trim()) return;
    if (processing) return;

    try {
      setProcessing(true);
      
      const { error: orgError } = await supabase
        .from('organizations')
        .update({ 
          status: 'rejected',
          updated_at: new Date().toISOString()
        })
        .eq('id', organizationId);

      if (orgError) throw orgError;

      await supabase
        .from('organization_notifications')
        .insert([{
          organization_id: organizationId,
          type: 'error',
          title: 'Organization Rejected',
          message: `Your organization registration has been rejected. Reason: ${orgRejectReason}`,
          category: 'registration',
          action_url: '/contact',
          read: false
        }]);

      showAlert('success', 'Organization rejected successfully');
      setRejectOrgDialog(false);
      setOrgRejectReason('');
      if (onSuccess) onSuccess();
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