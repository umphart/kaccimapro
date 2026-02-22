import React from 'react';
import {
  Chip
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Pending as PendingIcon
} from '@mui/icons-material';

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

export const getStatusChip = (status) => {
  const config = {
    pending: { color: 'warning', icon: <PendingIcon />, label: 'Pending' },
    approved: { color: 'success', icon: <CheckCircleIcon />, label: 'Approved' },
    rejected: { color: 'error', icon: <CancelIcon />, label: 'Rejected' }
  };
  const statusConfig = config[status?.toLowerCase()] || config.pending;

  return (
    <Chip
      icon={statusConfig.icon}
      label={statusConfig.label}
      color={statusConfig.color}
      sx={{ fontFamily: '"Inter", sans-serif', fontWeight: 500 }}
    />
  );
};