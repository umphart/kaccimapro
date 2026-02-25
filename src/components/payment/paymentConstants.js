export const PAYMENT_CONSTANTS = {
  FIRST_PAYMENT: 25000,
  RENEWAL_AMOUNT: 15000,
  REGISTRATION_FEE: 10000,
  SUBSCRIPTION_FEE: 15000,
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_FILE_TYPES: ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf']
};

export const PAYMENT_TYPES = {
  FIRST: 'first',
  RENEWAL: 'renewal',
  NOT_DUE: 'not_due'
};

export const PAYMENT_STATUS = {
  APPROVED: 'approved',
  ACCEPTED: 'accepted',
  PENDING: 'pending',
  REJECTED: 'rejected'
};

export const PAYMENT_STEPS = [
  {
    label: 'Review Payment Summary',
    description: 'Confirm your payment details and amount'
  },
  {
    label: 'Make Bank Transfer',
    description: 'Transfer the exact amount to the provided bank account'
  },
  {
    label: 'Upload Payment Receipt',
    description: 'Upload your payment receipt for verification'
  },
  {
    label: 'Submit for Verification',
    description: 'Our team will verify your payment within 24-48 hours'
  }
];

export const FILE_CONSTANTS = {
  MAX_SIZE: 5 * 1024 * 1024,
  ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'],
  ALLOWED_EXTENSIONS: ['.jpg', '.jpeg', '.png', '.pdf']
};