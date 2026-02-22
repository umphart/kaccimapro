import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
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
  IconButton,
  Chip,
  CircularProgress
} from '@mui/material';
import {
  Email as EmailIcon,
  Lock as LockIcon,
  Visibility,
  VisibilityOff,
  AdminPanelSettings as AdminIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Security as SecurityIcon
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';

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

const AdminAuth = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState({ open: false, type: 'success', message: '' });
  const [showPassword, setShowPassword] = useState(false);

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
      // First, authenticate with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password
      });

      if (authError) {
        throw new Error(authError.message);
      }

      if (!authData?.user) {
        throw new Error('No user data returned');
      }

   
      // Then check if user is an admin with better error handling
      const { data: adminData, error: adminError } = await supabase
        .from('admin_users')
        .select('*')
        .eq('user_id', authData.user.id)
        .maybeSingle(); // Use maybeSingle instead of single to avoid error when no record found

      if (adminError) {
        console.error('Admin query error:', adminError);
        throw new Error(`Database error: ${adminError.message}`);
      }

      if (!adminData) {
        // Sign out if not admin
        await supabase.auth.signOut();
        throw new Error('Access denied. You are not registered as an administrator.');
      }

      if (!adminData.is_active) {
        await supabase.auth.signOut();
        throw new Error('Your admin account has been deactivated. Please contact super admin.');
      }

      // Update last login
      const { error: updateError } = await supabase
        .from('admin_users')
        .update({ last_login: new Date().toISOString() })
        .eq('user_id', authData.user.id);

      if (updateError) {
        console.error('Error updating last login:', updateError);
        // Don't throw, just log - it's not critical
      }

      showAlertMessage('success', `Welcome back, ${adminData.full_name}! Redirecting...`);
      
      setTimeout(() => {
        navigate('/admin/dashboard');
      }, 1500);
    } catch (error) {
      console.error('Login error:', error);
      showAlertMessage('error', error.message);
      
      // Ensure user is signed out on error
      await supabase.auth.signOut();
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
        autoHideDuration={6000}
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
        
        }}
      >
        <StyledPaper elevation={3}>
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Box sx={{ position: 'relative', display: 'inline-block' }}>
              <img 
                src="/static/logo.png" 
                alt="KACCIMA Logo" 
                style={{ width: '80px', height: '80px', marginBottom: '16px' }} 
              />
              <Chip
                label="ADMIN"
                size="small"
                sx={{
                  position: 'absolute',
                  top: -10,
                  right: -20,
                  backgroundColor: '#dc3545',
                  color: 'white',
                  fontWeight: 700,
                  fontSize: '10px'
                }}
              />
            </Box>
            <Typography 
              variant="h4" 
              sx={{ 
                fontWeight: 700, 
                color: '#15e420',
                fontFamily: '"Poppins", sans-serif'
              }}
            >
              Admin Portal
            </Typography>
            <Typography 
              variant="body2" 
              sx={{ 
                color: '#666',
                fontFamily: '"Inter", sans-serif',
                mt: 1
              }}
            >
              Secure access for KACCIMA administrators
            </Typography>
          </Box>

          <form onSubmit={handleSubmit}>
            <TextField
              fullWidth
              name="email"
              label="Admin Email"
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
              startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <AdminIcon />}
              sx={{ mt: 3, mb: 2 }}
            >
              {loading ? 'Authenticating...' : 'Access Admin Panel'}
            </StyledButton>

            <Box sx={{ textAlign: 'center', mt: 2 }}>
              <Typography 
                variant="body2" 
                sx={{ 
                  fontFamily: '"Inter", sans-serif',
                  color: '#666'
                }}
              >
                <SecurityIcon sx={{ fontSize: 14, verticalAlign: 'middle', mr: 0.5 }} />
                Restricted to authorized personnel only
              </Typography>
            </Box>
          </form>
        </StyledPaper>
      </Container>
    </>
  );
};

export default AdminAuth;