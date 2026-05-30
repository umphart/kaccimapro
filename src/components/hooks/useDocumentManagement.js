import { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';

const documentFields = [
  { key: 'cover_letter_path', name: 'Cover Letter' },
  { key: 'memorandum_path', name: 'Memorandum' },
  { key: 'registration_cert_path', name: 'Registration Certificate' },
  { key: 'incorporation_cert_path', name: 'Incorporation Certificate' },
  { key: 'premises_cert_path', name: 'Premises Certificate' },
  { key: 'company_logo_path', name: 'Company Logo' },
  { key: 'form_c07_path', name: 'Form C07' },
  { key: 'id_document_path', name: 'ID Document' }
];

export const useDocumentManagement = (organizationId, showAlert) => {
  const [documentStatus, setDocumentStatus] = useState({});
  const [rejectionReasons, setRejectionReasons] = useState({});
  const [reuploadStatus, setReuploadStatus] = useState({});
  const [processing, setProcessing] = useState(false);
  const [viewDocument, setViewDocument] = useState(null);
  const [documentUrl, setDocumentUrl] = useState(null);
  const [rejectDialog, setRejectDialog] = useState({ open: false, doc: null });
  const [rejectReason, setRejectReason] = useState('');

  const checkReuploadStatus = async () => {
    try {
      const { data: notifications, error } = await supabase
        .from('organization_notifications')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('type', 'document_reuploaded')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const reuploadMap = {};
      notifications?.forEach(notif => {
        const docName = notif.title.replace('Re-uploaded: ', '');
        const docField = documentFields.find(f => f.name === docName)?.key;
        if (docField) {
          reuploadMap[docField] = true;
        }
      });

      setReuploadStatus(reuploadMap);
    } catch (error) {
      console.error('Error checking reupload status:', error);
    }
  };

  // Handle view document - FIXED
// In useDocumentManagement.js, update handleViewDocument:

const handleViewDocument = async (doc) => {
    try {
      // All documents are now in the public 'documents' bucket
      const bucket = 'documents';
      const path = doc.path;
      
      console.log('Getting public URL for:', { bucket, path });
      
      const { data } = supabase.storage
        .from(bucket)
        .getPublicUrl(path);
      
      console.log('Public URL:', data.publicUrl);
      
      setViewDocument(doc);
      setDocumentUrl(data.publicUrl);
    } catch (error) {
      console.error('Error getting document URL:', error);
      showAlert('error', 'Could not load document');
    }
  };

  const handleDownloadDocument = async (doc) => {
    try {
      const bucket = 'documents';
      const path = doc.path;
      
      const { data, error } = await supabase.storage
        .from(bucket)
        .download(path);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${doc.name}.${path.split('.').pop()}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading document:', error);
      showAlert('error', 'Failed to download document');
    }
  };

  // Handle approve document
  const handleApproveDocument = async (doc) => {
    setProcessing(true);
    try {
      const { error: notificationError } = await supabase
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

      if (notificationError) throw notificationError;

      setReuploadStatus(prev => {
        const newStatus = { ...prev };
        delete newStatus[doc.key];
        return newStatus;
      });

      setDocumentStatus(prev => ({ ...prev, [doc.key]: 'approved' }));

      showAlert('success', `${doc.name} approved successfully`);
    } catch (error) {
      console.error('Error approving document:', error);
      showAlert('error', 'Failed to approve document');
    } finally {
      setProcessing(false);
    }
  };

  // Handle reject document
  const handleRejectDocument = async () => {
    if (!rejectDialog.doc || !rejectReason) return;
    
    setProcessing(true);
    try {
      const doc = rejectDialog.doc;
      
      const { error: notificationError } = await supabase
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

      if (notificationError) throw notificationError;

      setReuploadStatus(prev => {
        const newStatus = { ...prev };
        delete newStatus[doc.key];
        return newStatus;
      });

      setDocumentStatus(prev => ({ ...prev, [doc.key]: 'rejected' }));
      setRejectionReasons(prev => ({ ...prev, [doc.key]: rejectReason }));

      showAlert('success', `${doc.name} rejected successfully`);
      setRejectDialog({ open: false, doc: null });
      setRejectReason('');
    } catch (error) {
      console.error('Error rejecting document:', error);
      showAlert('error', 'Failed to reject document');
    } finally {
      setProcessing(false);
    }
  };

  useEffect(() => {
    if (organizationId) {
      checkReuploadStatus();
    }
  }, [organizationId]);

  return {
    documentStatus,
    rejectionReasons,
    reuploadStatus,
    processing,
    viewDocument,
    documentUrl,
    rejectDialog,
    rejectReason,
    setDocumentStatus,
    setRejectionReasons,
    setReuploadStatus,
    setProcessing,
    setViewDocument,
    setDocumentUrl,
    setRejectDialog,
    setRejectReason,
    handleApproveDocument,
    handleRejectDocument,
    handleViewDocument,
    handleDownloadDocument,
    checkReuploadStatus
  };
};