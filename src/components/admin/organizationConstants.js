import {
  Description as DescriptionIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Warning as WarningIcon,
  Pending as PendingIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';

// Document types that match the organization_documents table
export const documentFields = [
  { 
    key: 'cover_letter', 
    name: 'Cover Letter', 
    required: true,
    bucket: 'organization-docs'
  },
  { 
    key: 'memorandum', 
    name: 'Memorandum & Articles', 
    required: false,
    bucket: 'organization-docs'
  },
  { 
    key: 'registration_cert', 
    name: 'Registration Certificate', 
    required: true,
    bucket: 'organization-docs'
  },
  { 
    key: 'incorporation_cert', 
    name: 'Incorporation Certificate', 
    required: true,
    bucket: 'organization-docs'
  },
  { 
    key: 'premises_cert', 
    name: 'Business Premises Certificate', 
    required: false,
    bucket: 'organization-docs'
  },
  { 
    key: 'company_logo', 
    name: 'Company Logo', 
    required: true,
    bucket: 'organization-docs'
  },
  { 
    key: 'form_c07', 
    name: 'Form C07', 
    required: false,
    bucket: 'organization-docs'
  },
  { 
    key: 'id_document', 
    name: 'ID Document', 
    required: true,
    bucket: 'organization-docs'
  }
];

// Get required document keys (only the required ones)
export const requiredDocumentKeys = documentFields
  .filter(f => f.required)
  .map(f => f.key);

// Get all document keys (for reference)
export const allDocumentKeys = documentFields.map(f => f.key);

// Status configurations
export const statusConfig = {
  pending: { color: 'warning', icon: PendingIcon, label: 'Pending' },
  approved: { color: 'success', icon: CheckCircleIcon, label: 'Approved' },
  rejected: { color: 'error', icon: CancelIcon, label: 'Rejected' },
  active: { color: 'success', icon: CheckCircleIcon, label: 'Active' },
  draft: { color: 'default', icon: PendingIcon, label: 'Draft' }
};

export const documentStatusIcons = {
  approved: { icon: CheckCircleIcon, color: 'success' },
  rejected: { icon: CancelIcon, color: 'error' },
  missing: { icon: WarningIcon, color: 'default' },
  pending: { icon: PendingIcon, color: 'warning' },
  reuploaded: { icon: RefreshIcon, color: 'info' }
};

export const tableColumns = {
  all: ['Company', 'Email', 'Phone', 'CAC', 'Status', 'Documents', 'Payment', 'Actions'],
  pending: ['Company', 'Email', 'Phone', 'CAC', 'Documents', 'Status', 'Actions'],
  approved: ['Company', 'Email', 'Phone', 'CAC', 'Status', 'Actions'],
  rejected: ['Company', 'Email', 'Phone', 'CAC', 'Status', 'Actions']
};

// Helper function to get document status from organization_documents
export const getDocumentStatus = (documents, docKey) => {
  if (!documents || !Array.isArray(documents)) return 'missing';
  const doc = documents.find(d => d.document_type === docKey);
  if (!doc) return 'missing';
  // Check if document exists - since there's no is_verified column, 
  // consider any uploaded document as 'pending' until verified
  return 'pending';
};

// Helper function to check if all required documents are approved
export const areAllRequiredDocumentsApproved = (documents) => {
  if (!documents || !Array.isArray(documents)) return false;
  const requiredKeys = documentFields.filter(f => f.required).map(f => f.key);
  return requiredKeys.every(key => {
    const doc = documents.find(d => d.document_type === key);
    return doc && doc.status === 'approved';
  });
};

// Helper to get document summary - ONLY counts required documents
export const getDocumentSummary = (documents) => {
  // Initialize with all required documents as missing
  const summary = { approved: 0, pending: 0, missing: 0, total: 0 };
  
  // If no documents, all required documents are missing
  if (!documents || !Array.isArray(documents) || documents.length === 0) {
    summary.missing = requiredDocumentKeys.length;
    summary.total = requiredDocumentKeys.length;
    return summary;
  }
  
  // Check each required document type
  requiredDocumentKeys.forEach(key => {
    const doc = documents.find(d => d.document_type === key);
    if (doc) {
      // Document exists - check its status
      if (doc.status === 'approved') {
        summary.approved++;
      } else if (doc.status === 'rejected') {
        // Rejected documents still count as uploaded but not approved
        summary.pending++;
      } else {
        summary.pending++; // pending or any other status
      }
    } else {
      summary.missing++;
    }
    summary.total++;
  });
  
  return summary;
};

// Helper to get document by key
export const getDocumentByKey = (documents, key) => {
  if (!documents || !Array.isArray(documents)) return null;
  return documents.find(d => d.document_type === key);
};

// Helper to check if organization can be approved
export const canApproveOrganization = (documents) => {
  if (!documents || !Array.isArray(documents)) return false;
  const summary = getDocumentSummary(documents);
  return summary.approved === requiredDocumentKeys.length && summary.missing === 0;
};

// Helper to get document status label
export const getDocumentStatusLabel = (status) => {
  const labels = {
    approved: 'Approved',
    pending: 'Pending Review',
    missing: 'Not Uploaded',
    rejected: 'Rejected',
    active: 'Active'
  };
  return labels[status] || status;
};

// Helper to check if all required documents are uploaded
export const areAllRequiredDocumentsUploaded = (documents) => {
  if (!documents || !Array.isArray(documents)) return false;
  const requiredKeys = documentFields.filter(f => f.required).map(f => f.key);
  const uploadedKeys = documents.map(d => d.document_type);
  return requiredKeys.every(key => uploadedKeys.includes(key));
};

// Helper to get uploaded document types
export const getUploadedDocumentTypes = (documents) => {
  if (!documents || !Array.isArray(documents)) return [];
  return documents.map(d => d.document_type);
};