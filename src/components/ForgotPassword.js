import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import {
  Alert,
  Snackbar,
  Button,
  TextField,
  Box,
  Typography,
  Paper,
  Container,
  InputAdornment,
  IconButton
} from '@mui/material';
import {
  Email as EmailIcon,
  ArrowBack as ArrowBackIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import './Auth.css';

// Styled components
const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: '40px',
  borderRadius: '16px',
  boxShadow: '0 10px 40px rgba(0, 0, 0, 0.1)',
  background: 'white',
  width: '100%',
  maxWidth: '450px'
}));

const StyledButton = styled(Button)(({ theme }) => ({
  backgroundColor: '#15e420',
  color: 'white',
  padding: '12px',
  fontSize: '16px',
  fontWeight: 600,
  textTransform: 'none',
  borderRadius: '8px',
  '&:hover': {
    backgroundColor: '#12c21e',
    transform: 'translateY(-2px)',
    boxShadow: '0 6px 20px rgba(21, 228, 32, 0.4)'
  },
  transition: 'all 0.3s ease'
}));

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState({ open: false, type: 'success', message: '' });

  const showAlert = (type, message) => {
    setAlert({ open: true, type, message });
  };

  const handleCloseAlert = () => {
    setAlert({ ...alert, open: false });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Get the current site URL (works in both development and production)
      const siteUrl = window.location.origin;
      
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${siteUrl}/reset-password`,
      });

      if (error) throw error;

      showAlert('success', 'Password reset instructions sent to your email!');
      setEmail(''); // Clear the email field
    } catch (error) {
      showAlert('error', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Snackbar
        open={alert.open}
        autoHideDuration={5000}
        onClose={handleCloseAlert}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert
          onClose={handleCloseAlert}
          severity={alert.type}
          iconMapping={{
            success: <CheckCircleIcon fontSize="inherit" />,
            error: <ErrorIcon fontSize="inherit" />
          }}
          sx={{
            width: '100%',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            '& .MuiAlert-icon': {
              alignItems: 'center'
            }
          }}
        >
          {alert.message}
        </Alert>
      </Snackbar>

      <Container 
        maxWidth="sm" 
        sx={{ 
          minHeight: '100vh', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          py: 4
        }}
      >
        <StyledPaper elevation={3}>
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <img 
              src="/static/logo.png" 
              alt="KACCIMA Logo" 
              style={{ width: '80px', height: '80px', marginBottom: '16px' }} 
            />
            <Typography 
              variant="h4" 
              sx={{ 
                fontWeight: 700, 
                color: '#15e420',
                fontFamily: '"Poppins", sans-serif'
              }}
            >
              Forgot Password
            </Typography>
            <Typography 
              variant="body2" 
              sx={{ 
                color: '#666',
                fontFamily: '"Inter", sans-serif',
                mt: 1
              }}
            >
              Enter your email address and we'll send you instructions to reset your password.
            </Typography>
          </Box>

          <form onSubmit={handleSubmit}>
            <TextField
              fullWidth
              id="email"
              name="email"
              label="Email Address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              margin="normal"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <EmailIcon sx={{ color: '#15e420' }} />
                  </InputAdornment>
                ),
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  '&:hover fieldset': {
                    borderColor: '#15e420',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#15e420',
                  },
                },
                '& .MuiInputLabel-root.Mui-focused': {
                  color: '#15e420',
                },
              }}
            />

            <StyledButton
              type="submit"
              fullWidth
              variant="contained"
              disabled={loading}
              sx={{ mt: 3, mb: 2 }}
            >
              {loading ? 'Sending...' : 'Send Reset Instructions'}
            </StyledButton>

            <Box sx={{ textAlign: 'center', mt: 2 }}>
              <Link 
                to="/login" 
                style={{ 
                  color: '#15e420', 
                  textDecoration: 'none',
                  fontFamily: '"Inter", sans-serif',
                  fontSize: '14px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <ArrowBackIcon fontSize="small" /> Back to Login
              </Link>
            </Box>
          </form>
        </StyledPaper>
      </Container>
    </>
  );
};

export default ForgotPassword;