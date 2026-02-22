import { useState } from 'react';
import { supabase } from '../../supabaseClient';

export const useDocumentStatus = (organization) => {
  const [documentStatus, setDocumentStatus] = useState({});
  const [allDocumentsApproved, setAllDocumentsApproved] = useState(false);
  const [documentsWithIssues, setDocumentsWithIssues] = useState([]);
  const [documentSummary, setDocumentSummary] = useState({ approved: 0, pending: 0, rejected: 0 });

  const documentFields = [
    { key: 'cover_letter_path', name: 'Cover Letter', required: true },
    { key: 'memorandum_path', name: 'Memorandum', required: true },
    { key: 'registration_cert_path', name: 'Registration Certificate', required: true },
    { key: 'incorporation_cert_path', name: 'Incorporation Certificate', required: true },
    { key: 'premises_cert_path', name: 'Premises Certificate', required: true },
    { key: 'company_logo_path', name: 'Company Logo', required: true },
    { key: 'form_c07_path', name: 'Form C07', required: true },
    { key: 'id_document_path', name: 'ID Document', required: true }
  ];

  const checkDocumentApprovalStatus = async (organizationId, documents) => {
    try {
      const { data: notifications, error: notifError } = await supabase
        .from('organization_notifications')
        .select('*')
        .eq('organization_id', organizationId)
        .in('type', ['document_approved', 'document_rejected'])
        .order('created_at', { ascending: false });

      if (notifError) throw notifError;

      const status = {};
      const issues = [];

      documentFields.forEach(field => {
        if (documents.some(doc => doc.key === field.key)) {
          const docNotifications = notifications?.filter(n => 
            n.title?.includes(field.name)
          );

          if (docNotifications && docNotifications.length > 0) {
            const latest = docNotifications[0];
            if (latest.type === 'document_approved') {
              status[field.key] = 'approved';
            } else if (latest.type === 'document_rejected') {
              status[field.key] = 'rejected';
              const reason = latest.message?.split('Reason: ')[1] || 'Document was rejected';
              issues.push({ name: field.name, reason });
            } else {
              status[field.key] = 'pending';
              issues.push({ name: field.name, reason: 'Pending review' });
            }
          } else {
            status[field.key] = 'pending';
            issues.push({ name: field.name, reason: 'Not yet reviewed' });
          }
        }
      });

      setDocumentStatus(status);
      setDocumentsWithIssues(issues);

      const approved = Object.values(status).filter(s => s === 'approved').length;
      const pending = Object.values(status).filter(s => s === 'pending').length;
      const rejected = Object.values(status).filter(s => s === 'rejected').length;

      setDocumentSummary({ approved, pending, rejected });
      
      const allApproved = documents.every(doc => status[doc.key] === 'approved');
      setAllDocumentsApproved(allApproved);

    } catch (error) {
      console.error('Error checking document status:', error);
    }
  };

  return {
    documentStatus,
    allDocumentsApproved,
    documentsWithIssues,
    documentSummary,
    checkDocumentApprovalStatus
  };
};