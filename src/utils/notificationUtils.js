import {
  CheckCircle as CheckCircleIcon,
  Pending as PendingIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  Payment as PaymentIcon,
  Business as BusinessIcon,
  Verified as VerifiedIcon,
  Description as DescriptionIcon,
  Warning as WarningIcon,
  AccessTime as AccessTimeIcon
} from '@mui/icons-material';

export const getNotificationIcon = (type) => {
  switch(type) {
    case 'success':
      return <CheckCircleIcon sx={{ color: '#28a745' }} />;
    case 'pending':
      return <PendingIcon sx={{ color: '#ffc107' }} />;
    case 'error':
      return <ErrorIcon sx={{ color: '#dc3545' }} />;
    case 'payment':
      return <PaymentIcon sx={{ color: '#15e420' }} />;
    case 'registration':
      return <BusinessIcon sx={{ color: '#17a2b8' }} />;
    case 'approval':
      return <VerifiedIcon sx={{ color: '#15e420' }} />;
    case 'document':
      return <DescriptionIcon sx={{ color: '#15e420' }} />;
    case 'document_rejected':
      return <WarningIcon sx={{ color: '#dc3545' }} />;
    case 'document_approved':
      return <CheckCircleIcon sx={{ color: '#28a745' }} />;
    case 'renewal':
      return <AccessTimeIcon sx={{ color: '#ffc107' }} />;
    default:
      return <InfoIcon sx={{ color: '#17a2b8' }} />;
  }
};

export const getTimeAgo = (timestamp) => {
  if (!timestamp) return 'Unknown';
  
  const now = new Date();
  const then = new Date(timestamp);
  const diff = Math.floor((now - then) / 1000); // seconds

  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)} minutes ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
  if (diff < 2592000) return `${Math.floor(diff / 86400)} days ago`;
  if (diff < 31536000) return `${Math.floor(diff / 2592000)} months ago`;
  return `${Math.floor(diff / 31536000)} years ago`;
};

export const documentFields = [
  { key: 'cover_letter_path', name: 'Cover Letter', required: true },
  { key: 'memorandum_path', name: 'Memorandum', required: true },
  { key: 'registration_cert_path', name: 'Registration Certificate', required: true },
  { key: 'incorporation_cert_path', name: 'Incorporation Certificate', required: true },
  { key: 'premises_cert_path', name: 'Premises Certificate', required: true },
  { key: 'company_logo_path', name: 'Company Logo', required: true },
  { key: 'form_c07_path', name: 'Form C07', required: true },
  { key: 'id_document_path', name: 'ID Document', required: true }
];