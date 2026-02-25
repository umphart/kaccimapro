import {
  CheckCircle as CheckCircleIcon,
  Pending as PendingIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  Payment as PaymentIcon,
  Business as BusinessIcon,
  Description as DescriptionIcon,
  AccessTime as AccessTimeIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';

export const documentFields = [
  { key: 'cover_letter_path', name: 'Cover Letter', required: true },
  { key: 'memorandum_path', name: 'Memorandum', required: false },
  { key: 'registration_cert_path', name: 'Registration Certificate', required: true },
  { key: 'incorporation_cert_path', name: 'Incorporation Certificate', required: true },
  { key: 'premises_cert_path', name: 'Premises Certificate', required: false },
  { key: 'company_logo_path', name: 'Company Logo', required: true },
  { key: 'form_c07_path', name: 'Form C07', required: false },
  { key: 'id_document_path', name: 'ID Document', required: true }
];

export const getNotificationIcon = (type, category) => {
  switch (type) {
    case 'success':
    case 'approved':
    case 'document_approved':
      return CheckCircleIcon;
    case 'pending':
      return PendingIcon;
    case 'error':
    case 'rejected':
    case 'document_rejected':
      return ErrorIcon;
    case 'payment':
      return PaymentIcon;
    case 'renewal':
      return AccessTimeIcon;
    case 'registration':
      return BusinessIcon;
    case 'document':
    case 'document_reuploaded':
      return DescriptionIcon;
    case 'info':
    default:
      return InfoIcon;
  }
};

export const getNotificationColor = (type) => {
  switch (type) {
    case 'success':
    case 'approved':
    case 'document_approved':
      return '#28a745';
    case 'pending':
      return '#ffc107';
    case 'error':
    case 'rejected':
    case 'document_rejected':
      return '#dc3545';
    case 'payment':
      return '#17a2b8';
    case 'renewal':
      return '#ffc107';
    case 'registration':
      return '#15e420';
    case 'document':
    case 'document_reuploaded':
      return '#15e420';
    case 'info':
    default:
      return '#17a2b8';
  }
};

export const formatTimeAgo = (timestamp) => {
  if (!timestamp) return '';
  
  const date = new Date(timestamp);
  const now = new Date();
  const seconds = Math.floor((now - date) / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const months = Math.floor(days / 30);
  const years = Math.floor(months / 12);

  if (years > 0) return `${years} year${years > 1 ? 's' : ''} ago`;
  if (months > 0) return `${months} month${months > 1 ? 's' : ''} ago`;
  if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
  if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  if (seconds > 30) return `${seconds} seconds ago`;
  return 'Just now';
};

export const isRejectedDocument = (notification) => {
  return notification.type === 'document_rejected' || 
         (notification.title?.toLowerCase().includes('reject') && 
          notification.category === 'document') ||
         (notification.message?.toLowerCase().includes('rejected') && 
          notification.category === 'document') ||
         (notification.title?.toLowerCase().includes('document rejected'));
};

export const isReuploadedDocument = (notification) => {
  return notification.type === 'document_reuploaded' ||
         notification.title?.toLowerCase().includes('re-upload') ||
         notification.message?.toLowerCase().includes('re-uploaded');
};