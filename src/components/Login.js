import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
  Lock as LockIcon,
  Visibility,
  VisibilityOff,
  Login as LoginIcon,
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

const Login = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState({ open: false, type: 'success', message: '' });
  const [showPassword, setShowPassword] = useState(false);
useEffect(() => {
  // Check if user just verified their email
  const query = new URLSearchParams(window.location.search);
  if (query.get('verified') === 'true') {
    showAlertMessage('success', 'Email verified successfully! You can now log in.');
    // Remove the query parameter from URL
    window.history.replaceState({}, document.title, '/login');
  }
}, []);
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const showAlertMessage = (type, message) => {
    setAlert({ open: true, type, message });
  };

  const handleCloseAlert = () => {
    setAlert({ ...alert, open: false });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password
      });

      if (error) throw error;

      showAlertMessage('success', 'Login successful! Redirecting...');
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
    } catch (error) {
      showAlertMessage('error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleClickShowPassword = () => {
    setShowPassword(!showPassword);
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
              Welcome Back
            </Typography>
            <Typography 
              variant="body2" 
              sx={{ 
                color: '#666',
                fontFamily: '"Inter", sans-serif',
                mt: 1
              }}
            >
              Sign in to your KACCIMA account
            </Typography>
          </Box>

          <form onSubmit={handleSubmit}>
            <TextField
              fullWidth
              id="loginEmail"
              name="email"
              label="Email Address"
              type="email"
              value={formData.email}
              onChange={handleChange}
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

            <TextField
              fullWidth
              id="loginPassword"
              name="password"
              label="Password"
              type={showPassword ? 'text' : 'password'}
              value={formData.password}
              onChange={handleChange}
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

            <StyledButton
              type="submit"
              fullWidth
              variant="contained"
              disabled={loading}
              startIcon={<LoginIcon />}
              sx={{ mt: 3, mb: 2 }}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </StyledButton>

            <Box sx={{ textAlign: 'center', mt: 2 }}>
              <Link 
                to="/forgot-password" 
                style={{ 
                  color: '#15e420', 
                  textDecoration: 'none',
                  fontFamily: '"Inter", sans-serif',
                  fontSize: '14px'
                }}
              >
                Forgot password?
              </Link>
              <Typography 
                variant="body2" 
                sx={{ 
                  mt: 2,
                  fontFamily: '"Inter", sans-serif',
                  color: '#666'
                }}
              >
                Don't have an account?{' '}
                <Link 
                  to="/register" 
                  style={{ 
                    color: '#15e420', 
                    textDecoration: 'none',
                    fontWeight: 600
                  }}
                >
                  Register
                </Link>
              </Typography>
            </Box>
          </form>
        </StyledPaper>
      </Container>
    </>
  );
};

export default Login;