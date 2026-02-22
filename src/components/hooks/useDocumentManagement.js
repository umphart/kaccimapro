import { useState } from 'react';
import { supabase } from '../../supabaseClient';

export const useDocumentManagement = (organizationId, showAlert) => {
  const [documentStatus, setDocumentStatus] = useState({});
  const [rejectionReasons, setRejectionReasons] = useState({});
  const [processing, setProcessing] = useState(false);
  const [viewDocument, setViewDocument] = useState(null);
  const [documentUrl, setDocumentUrl] = useState(null);
  const [rejectDialog, setRejectDialog] = useState({ open: false, doc: null });
  const [rejectReason, setRejectReason] = useState('');

  const handleViewDocument = async (doc) => {
    try {
      setViewDocument(doc);
      
      const bucket = doc.key === 'company_logo_path' ? 'logos' : 'documents';
      const { data } = supabase.storage
        .from(bucket)
        .getPublicUrl(doc.path);
      
      setDocumentUrl(data.publicUrl);
    } catch (error) {
      console.error('Error getting document URL:', error);
      if (showAlert) showAlert('error', 'Could not load document');
    }
  };

  const handleDownloadDocument = async (doc) => {
    try {
      const bucket = doc.key === 'company_logo_path' ? 'logos' : 'documents';
      const { data, error } = await supabase.storage
        .from(bucket)
        .download(doc.path);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${doc.name}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading document:', error);
      if (showAlert) showAlert('error', 'Failed to download document');
    }
  };

  const handleApproveDocument = async (doc) => {
    if (processing) return;
    
    try {
      setProcessing(true);
      
      const { error: notifError } = await supabase
        .from('organization_notifications')
        .insert([{
          organization_id: organizationId,
          type: 'document_approved',
          title: `${doc.name} Approved`,
          message: `Your ${doc.name} has been approved.`,
          category: 'document',
          action_url: '/documents',
          read: false
        }]);

      if (notifError) throw notifError;

      setDocumentStatus(prev => ({ ...prev, [doc.key]: 'approved' }));
      
      if (showAlert) showAlert('success', `${doc.name} approved successfully`);
    } catch (error) {
      console.error('Error approving document:', error);
      if (showAlert) showAlert('error', 'Failed to approve document');
    } finally {
      setProcessing(false);
    }
  };

  const handleRejectDocument = async () => {
    if (!rejectDialog.doc || !rejectReason.trim()) return;
    if (processing) return;

    try {
      setProcessing(true);
      const doc = rejectDialog.doc;

      const { error: notifError } = await supabase
        .from('organization_notifications')
        .insert([{
          organization_id: organizationId,
          type: 'document_rejected',
          title: `${doc.name} Rejected`,
          message: `Your ${doc.name} has been rejected. Reason: ${rejectReason}`,
          category: 'document',
          action_url: '/documents',
          read: false
        }]);

      if (notifError) throw notifError;

      setDocumentStatus(prev => ({ ...prev, [doc.key]: 'rejected' }));
      setRejectionReasons(prev => ({ ...prev, [doc.key]: rejectReason }));
      
      if (showAlert) showAlert('success', `${doc.name} rejected successfully`);
      setRejectDialog({ open: false, doc: null });
      setRejectReason('');
    } catch (error) {
      console.error('Error rejecting document:', error);
      if (showAlert) showAlert('error', 'Failed to reject document');
    } finally {
      setProcessing(false);
    }
  };

  return {
    documentStatus,
    rejectionReasons,
    processing,
    viewDocument,
    documentUrl,
    rejectDialog,
    rejectReason,
    setDocumentStatus,
    setRejectionReasons,
    setViewDocument,
    setDocumentUrl,
    setRejectDialog,
    setRejectReason,
    handleApproveDocument,
    handleRejectDocument,
    handleViewDocument,
    handleDownloadDocument
  };
};