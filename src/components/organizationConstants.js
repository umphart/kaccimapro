import {
  Description as DescriptionIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Warning as WarningIcon,
  Pending as PendingIcon,
  Refresh as RefreshIcon
  
} from '@mui/icons-material';

export const documentFields = [
  { 
    key: 'cover_letter_path', 
    name: 'Cover Letter', 
    required: true,
    rejectionField: 'cover_letter_rejection_reason',
    bucket: 'documents'
  },
  { 
    key: 'memorandum_path', 
    name: 'Memorandum', 
    required: false,
    rejectionField: 'memorandum_rejection_reason',
    bucket: 'documents'
  },
  { 
    key: 'registration_cert_path', 
    name: 'Registration Certificate', 
    required: true,
    rejectionField: 'registration_cert_rejection_reason',
    bucket: 'documents'
  },
  { 
    key: 'incorporation_cert_path', 
    name: 'Incorporation Certificate', 
    required: true,
    rejectionField: 'incorporation_cert_rejection_reason',
    bucket: 'documents'
  },
  { 
    key: 'premises_cert_path', 
    name: 'Premises Certificate', 
    required: false,
    rejectionField: 'premises_cert_rejection_reason',
    bucket: 'documents'
  },
  { 
    key: 'company_logo_path', 
    name: 'Company Logo', 
    required: true,
    rejectionField: 'company_logo_rejection_reason',
    bucket: 'logos'
  },
  { 
    key: 'form_c07_path', 
    name: 'Form C07', 
    required: false,
    rejectionField: 'form_c07_rejection_reason',
    bucket: 'documents'
  },
  { 
    key: 'id_document_path', 
    name: 'ID Document', 
    required: true,
    rejectionField: 'id_document_rejection_reason',
    bucket: 'documents'
  }
];

export const statusConfig = {
  pending: { color: 'warning', icon: PendingIcon, label: 'Pending' },
  approved: { color: 'success', icon: CheckCircleIcon, label: 'Approved' },
  rejected: { color: 'error', icon: CancelIcon, label: 'Rejected' }
};

export const documentStatusIcons = {
  approved: { icon: CheckCircleIcon, color: 'success' },
  rejected: { icon: CancelIcon, color: 'error' },
  missing: { icon: WarningIcon, color: 'default' },
  pending: { icon: PendingIcon, color: 'warning' },
  reuploaded: { icon: RefreshIcon, color: 'info' }
};

export const tableColumns = {
  all: ['Company', 'Email', 'Phone', 'CAC', 'Reg Date', 'Status'],
  pending: ['Company', 'Email', 'Phone', 'CAC', 'Reg Date', 'Documents', 'Status', 'Actions'],
  approved: ['Company', 'Email', 'Phone', 'CAC', 'Reg Date', 'Status'],
  rejected: ['Company', 'Email', 'Phone', 'CAC', 'Reg Date', 'Status']
};