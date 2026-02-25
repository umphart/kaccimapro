import { styled } from '@mui/material/styles';
import { Paper } from '@mui/material';

export const StyledCard = styled(Paper)(({ theme }) => ({
  borderRadius: '16px',
  boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)',
  overflow: 'hidden',
  padding: theme.spacing(2)
}));

export const documentFields = [
  { key: 'cover_letter_path', name: 'Cover Letter' },
  { key: 'memorandum_path', name: 'Memorandum' },
  { key: 'registration_cert_path', name: 'Registration Certificate' },
  { key: 'incorporation_cert_path', name: 'Incorporation Certificate' },
  { key: 'premises_cert_path', name: 'Premises Certificate' },
  { key: 'company_logo_path', name: 'Company Logo' },
  { key: 'form_c07_path', name: 'Form C07' },
  { key: 'id_document_path', name: 'ID Document' }
];