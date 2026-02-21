import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import {
  Alert,
  Button,
  Box,
  Typography,
  Paper,
  Container,
  CircularProgress
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Login as LoginIcon
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: '40px',
  borderRadius: '16px',
  boxShadow: '0 10px 40px rgba(0, 0, 0, 0.1)',
  background: 'white',
  width: '100%',
  maxWidth: '450px',
  textAlign: 'center'
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

const EmailConfirmed = () => {
  const navigate = useNavigate();
  const [status, setStatus] = useState('loading'); // loading, success, error
  const [message, setMessage] = useState('');

  useEffect(() => {
    const handleEmailConfirmation = async () => {
      const hash = window.location.hash;
      const query = new URLSearchParams(window.location.search);
      
      // Check for error in URL
      const error = query.get('error');
      const errorCode = query.get('error_code');
      const errorDescription = query.get('error_description');
      
      if (error || errorCode) {
        setStatus('error');
        setMessage(errorDescription || 'Email confirmation failed. The link may have expired.');
        return;
      }

      // Check if we have the access token in hash
      if (hash && hash.includes('access_token')) {
        try {
          // Get the session from the hash
          const { data, error } = await supabase.auth.getSession();
          
          if (error) throw error;
          
          if (data.session) {
            setStatus('success');
            setMessage('Your email has been successfully confirmed!');
            
            // Sign out the user after confirmation (optional)
            setTimeout(async () => {
              await supabase.auth.signOut();
            }, 1000);
          } else {
            setStatus('error');
            setMessage('Unable to confirm email. Please try again.');
          }
        } catch (error) {
          setStatus('error');
          setMessage(error.message);
        }
      } else {
        setStatus('error');
        setMessage('Invalid confirmation link. Please request a new one.');
      }
    };

    handleEmailConfirmation();
  }, []);

  return (
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
            Email Confirmation
          </Typography>
        </Box>

        {status === 'loading' && (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <CircularProgress sx={{ color: '#15e420', mb: 2 }} />
            <Typography variant="body1" sx={{ color: '#666' }}>
              Confirming your email...
            </Typography>
          </Box>
        )}

        {status === 'success' && (
          <Box sx={{ textAlign: 'center', py: 2 }}>
            <CheckCircleIcon sx={{ fontSize: 64, color: '#15e420', mb: 2 }} />
            <Typography variant="h6" sx={{ color: '#333', mb: 2, fontWeight: 600 }}>
              Email Confirmed!
            </Typography>
            <Typography variant="body1" sx={{ color: '#666', mb: 3 }}>
              {message}
            </Typography>
            <StyledButton
              fullWidth
              variant="contained"
              startIcon={<LoginIcon />}
              onClick={() => navigate('/login')}
            >
              Continue to Login
            </StyledButton>
          </Box>
        )}

        {status === 'error' && (
          <Box sx={{ textAlign: 'center', py: 2 }}>
            <ErrorIcon sx={{ fontSize: 64, color: '#dc3545', mb: 2 }} />
            <Typography variant="h6" sx={{ color: '#333', mb: 2, fontWeight: 600 }}>
              Confirmation Failed
            </Typography>
            <Typography variant="body1" sx={{ color: '#666', mb: 3 }}>
              {message}
            </Typography>
            <StyledButton
              fullWidth
              variant="contained"
              onClick={() => navigate('/register')}
              sx={{ mb: 2 }}
            >
              Register Again
            </StyledButton>
            <Link 
              to="/login" 
              style={{ 
                color: '#15e420', 
                textDecoration: 'none',
                fontFamily: '"Inter", sans-serif',
                display: 'block'
              }}
            >
              Back to Login
            </Link>
          </Box>
        )}
      </StyledPaper>
    </Container>
  );
};

export default EmailConfirmed;