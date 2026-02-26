import { useState } from 'react';

export const useAlert = () => {
  const [alert, setAlert] = useState({ open: false, type: 'success', message: '' });

  const showAlert = (type, message) => {
    setAlert({ open: true, type, message });
  };

  const handleCloseAlert = () => {
    setAlert({ ...alert, open: false });
  };

  return { alert, showAlert, handleCloseAlert };
};