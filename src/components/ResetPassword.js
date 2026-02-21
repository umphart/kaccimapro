import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
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
  Lock as LockIcon,
  Visibility,
  VisibilityOff,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  ArrowBack as ArrowBackIcon
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

const ResetPassword = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState({ open: false, type: 'success', message: '' });
  const [session, setSession] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    // Get the hash from URL
    const hash = window.location.hash;
    
    if (hash && hash.includes('access_token')) {
      // Supabase automatically handles the session from the hash
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session) {
          setSession(session);
        } else {
          showAlert('error', 'Invalid or expired reset link. Please request a new one.');
        }
      });
    } else {
      showAlert('error', 'Invalid or expired reset link. Please request a new one.');
    }
  }, []);

  const showAlert = (type, message) => {
    setAlert({ open: true, type, message });
  };

  const handleCloseAlert = () => {
    setAlert({ ...alert, open: false });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      showAlert('error', 'Passwords do not match');
      return;
    }

    if (password.length < 6) {
      showAlert('error', 'Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: password
      });

      if (error) throw error;

      showAlert('success', 'Password updated successfully!');
      
      // Sign out after password reset (optional)
      setTimeout(async () => {
        await supabase.auth.signOut();
        navigate('/login');
      }, 2000);
    } catch (error) {
      showAlert('error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleClickShowPassword = () => {
    setShowPassword(!showPassword);
  };

  const handleClickShowConfirmPassword = () => {
    setShowConfirmPassword(!showConfirmPassword);
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
              Reset Password
            </Typography>
            <Typography 
              variant="body2" 
              sx={{ 
                color: '#666',
                fontFamily: '"Inter", sans-serif',
                mt: 1
              }}
            >
              {session ? 'Enter your new password below' : 'Invalid or expired reset link'}
            </Typography>
          </Box>

          {!session ? (
            <Box sx={{ textAlign: 'center' }}>
              <Alert severity="error" sx={{ mb: 3, borderRadius: '8px' }}>
                Invalid or expired reset link. Please request a new one.
              </Alert>
              <Link to="/forgot-password" style={{ textDecoration: 'none' }}>
                <StyledButton
                  fullWidth
                  variant="contained"
                  startIcon={<ArrowBackIcon />}
                >
                  Request New Link
                </StyledButton>
              </Link>
            </Box>
          ) : (
            <form onSubmit={handleSubmit}>
              <TextField
                fullWidth
                id="password"
                name="password"
                label="New Password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                margin="normal"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockIcon sx={{ color: '#15e420' }} />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="toggle password visibility"
                        onClick={handleClickShowPassword}
                        edge="end"
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
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

              <TextField
                fullWidth
                id="confirmPassword"
                name="confirmPassword"
                label="Confirm New Password"
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                margin="normal"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockIcon sx={{ color: '#15e420' }} />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="toggle password visibility"
                        onClick={handleClickShowConfirmPassword}
                        edge="end"
                      >
                        {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
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
                {loading ? 'Updating...' : 'Update Password'}
              </StyledButton>

              <Box sx={{ textAlign: 'center', mt: 2 }}>
                <Typography 
                  variant="body2" 
                  sx={{ 
                    fontFamily: '"Inter", sans-serif',
                    color: '#666'
                  }}
                >
                  <Link 
                    to="/login" 
                    style={{ 
                      color: '#15e420', 
                      textDecoration: 'none',
                      fontWeight: 600
                    }}
                  >
                    Back to Login
                  </Link>
                </Typography>
              </Box>
            </form>
          )}
        </StyledPaper>
      </Container>
    </>
  );
};

export default ResetPassword;