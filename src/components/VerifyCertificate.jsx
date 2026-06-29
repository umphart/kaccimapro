// src/components/VerifyCertificate.jsx
import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Box,
  Container,
  Paper,
  Typography,
  CircularProgress,
  Alert,
  Chip,
  Card,
  CardContent,
  Grid,
  Avatar,
  Divider,
  Button,
} from '@mui/material';
import {
  Verified as VerifiedIcon,
  Error as ErrorIcon,
  Business as BusinessIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Download as DownloadIcon,
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { supabase } from '../supabaseClient';
import Layout from './Layout';

const VerifyContainer = styled(Paper)({
  maxWidth: 700,
  margin: '2rem auto',
  padding: '2.5rem',
  borderRadius: '16px',
  boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
});

const VerifyCertificate = () => {
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [organization, setOrganization] = useState(null);
  const [error, setError] = useState(null);
  const [verified, setVerified] = useState(false);

  const registrationNumber = searchParams.get('reg');

  useEffect(() => {
    if (registrationNumber) {
      verifyCertificate();
    } else {
      setLoading(false);
      setError('No registration number provided');
    }
  }, [registrationNumber]);

  const verifyCertificate = async () => {
    setLoading(true);
    try {
      // Search for organization by registration number
      const { data, error } = await supabase
        .from('organizations_registry')
        .select('*')
        .eq('registration_number', registrationNumber)
        .eq('status', 'approved')
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setOrganization(data);
        setVerified(true);
      } else {
        setError('Certificate not found or not active');
        setVerified(false);
      }
    } catch (err) {
      console.error('Verification error:', err);
      setError('Failed to verify certificate');
      setVerified(false);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress style={{ color: '#15e420' }} />
        </Box>
      </Layout>
    );
  }

  return (
    <Layout>
      <Container maxWidth="md">
        <VerifyContainer>
          <Box textAlign="center" mb={3}>
            <Avatar
              sx={{
                width: 80,
                height: 80,
                bgcolor: verified ? '#e8f5e9' : '#ffebee',
                mx: 'auto',
                mb: 2,
              }}
            >
              {verified ? (
                <VerifiedIcon sx={{ fontSize: 48, color: '#28a745' }} />
              ) : (
                <ErrorIcon sx={{ fontSize: 48, color: '#dc3545' }} />
              )}
            </Avatar>
            
            <Typography variant="h4" sx={{ fontWeight: 700, color: verified ? '#28a745' : '#dc3545' }}>
              {verified ? 'Certificate Verified ✓' : 'Certificate Not Found'}
            </Typography>
            
            <Typography variant="body1" sx={{ color: '#666', mt: 1 }}>
              {verified 
                ? 'This certificate is valid and issued by KACCIMA' 
                : 'This certificate could not be verified'}
            </Typography>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 3, borderRadius: '8px' }}>
              {error}
            </Alert>
          )}

          {verified && organization && (
            <>
              <Divider sx={{ my: 3 }} />
              
              <Card sx={{ borderRadius: '12px', bgcolor: '#f8f9fa' }}>
                <CardContent>
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <Box display="flex" alignItems="center" gap={1}>
                        <BusinessIcon sx={{ color: '#15e420' }} />
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                          {organization.company_name}
                        </Typography>
                      </Box>
                    </Grid>
                    
                    <Grid item xs={12} sm={6}>
                      <Typography variant="caption" sx={{ color: '#666' }}>Registration Number</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {organization.registration_number}
                      </Typography>
                    </Grid>
                    
                    <Grid item xs={12} sm={6}>
                      <Typography variant="caption" sx={{ color: '#666' }}>CAC Number</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {organization.cac_number || 'N/A'}
                      </Typography>
                    </Grid>
                    
                    <Grid item xs={12}>
                      <Typography variant="caption" sx={{ color: '#666' }}>Business Address</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {organization.house_number || ''} {organization.street || ''}
                        {organization.lga ? `, ${organization.lga}` : ''}
                        {organization.state ? `, ${organization.state}` : ''}
                      </Typography>
                    </Grid>
                    
                    <Grid item xs={12} sm={6}>
                      <Typography variant="caption" sx={{ color: '#666' }}>Status</Typography>
                      <Chip 
                        size="small" 
                        label="Active Member" 
                        icon={<CheckCircleIcon />}
                        sx={{ bgcolor: '#d4edda', color: '#28a745' }} 
                      />
                    </Grid>
                    
                    <Grid item xs={12} sm={6}>
                      <Typography variant="caption" sx={{ color: '#666' }}>Registration Date</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {organization.registration_date 
                          ? new Date(organization.registration_date).toLocaleDateString() 
                          : 'N/A'}
                      </Typography>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>

              <Box mt={3} display="flex" justifyContent="center" gap={2}>
                <Button
                  variant="outlined"
                  startIcon={<DownloadIcon />}
                  sx={{ borderColor: '#15e420', color: '#15e420' }}
                  onClick={() => {
                    // Navigate to dashboard or trigger download
                    window.location.href = '/dashboard';
                  }}
                >
                  Go to Dashboard
                </Button>
              </Box>
            </>
          )}

          {!verified && !error && (
            <Alert severity="warning" sx={{ mt: 2, borderRadius: '8px' }}>
              The certificate you're trying to verify could not be found. Please ensure you have the correct registration number.
            </Alert>
          )}
        </VerifyContainer>
      </Container>
    </Layout>
  );
};

export default VerifyCertificate;