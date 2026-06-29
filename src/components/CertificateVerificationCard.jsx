// components/CertificateVerificationCard.jsx
import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Alert,
  Card,
  CardContent,
  Chip,
  Divider,
  CircularProgress,
  Avatar
} from '@mui/material';
import { styled } from '@mui/material/styles';
import {
  Verified as VerifiedIcon,
  Warning as WarningIcon,
  QrCodeScanner as QrCodeScannerIcon,
  Search as SearchIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import { supabase } from '../supabaseClient';

const StyledCard = styled(Card)({
  borderRadius: '16px',
  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
  overflow: 'visible'
});

const VerifyButton = styled(Button)({
  borderRadius: '12px',
  padding: '12px 30px',
  fontWeight: 600,
  textTransform: 'none',
  background: 'linear-gradient(135deg, #15e420 0%, #0fa819 100%)',
  color: 'white',
  '&:hover': {
    background: 'linear-gradient(135deg, #12c21e 0%, #0d9216 100%)',
    boxShadow: '0 4px 15px rgba(21, 228, 32, 0.3)'
  }
});

const ResultCard = styled(Paper)({
  padding: '20px',
  borderRadius: '12px',
  backgroundColor: '#f8f9fa',
  marginTop: '16px'
});

const CertificateVerificationCard = () => {
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const handleVerify = async () => {
    if (!registrationNumber.trim()) {
      setError('Please enter a registration number');
      return;
    }

    setVerifying(true);
    setError('');
    setResult(null);

    try {
      // Query the organizations_registry table
      const { data: organization, error: orgError } = await supabase
        .from('organizations_registry')
        .select('*')
        .or(`registration_number.eq.${registrationNumber.trim()},cac_number.eq.${registrationNumber.trim()}`)
        .maybeSingle();

      if (orgError) throw orgError;

      if (!organization) {
        setResult({
          valid: false,
          message: 'No certificate found with this registration number',
          details: null
        });
        return;
      }

      // Check payment status
      const { data: payments } = await supabase
        .from('admin_organization_payments')
        .select('*')
        .eq('organization_id', organization.id)
        .eq('status', 'approved')
        .order('created_at', { ascending: false });

      const hasValidPayment = payments && payments.length > 0;
      const latestPayment = hasValidPayment ? payments[0] : null;

      // Determine certificate validity
      const isValid = organization.status === 'approved' && hasValidPayment;
      const isExpired = hasValidPayment && latestPayment && 
        new Date(latestPayment.created_at).getTime() + 365 * 24 * 60 * 60 * 1000 < Date.now();

      setResult({
        valid: isValid && !isExpired,
        message: isValid && !isExpired 
          ? 'Certificate is valid and active'
          : isExpired 
            ? 'Certificate has expired'
            : 'Certificate is not valid or organization is not approved',
        details: {
          companyName: organization.company_name,
          registrationNumber: organization.registration_number,
          cacNumber: organization.cac_number,
          status: organization.status,
          memberSince: hasValidPayment ? latestPayment.created_at : null,
          expiryDate: hasValidPayment && latestPayment 
            ? new Date(new Date(latestPayment.created_at).getTime() + 365 * 24 * 60 * 60 * 1000)
            : null,
          businessNature: organization.business_nature,
          address: `${organization.house_number || ''} ${organization.street || ''} ${organization.lga || ''} ${organization.state || ''}`.trim()
        }
      });

    } catch (error) {
      console.error('Verification error:', error);
      setError('Failed to verify certificate. Please try again.');
    } finally {
      setVerifying(false);
    }
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-NG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleVerify();
    }
  };

  return (
    <StyledCard>
      <CardContent sx={{ p: 4 }}>
        {/* Header */}
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Avatar
            sx={{
              width: 80,
              height: 80,
              bgcolor: 'rgba(21, 228, 32, 0.1)',
              margin: '0 auto',
              mb: 2
            }}
          >
            <VerifiedIcon sx={{ fontSize: 40, color: '#15e420' }} />
          </Avatar>
          <Typography
            variant="h5"
            sx={{
              fontWeight: 700,
              color: '#333',
              fontFamily: '"Poppins", sans-serif',
              mb: 1
            }}
          >
            Certificate Verification
          </Typography>
          <Typography
            variant="body2"
            sx={{
              color: '#666',
              fontFamily: '"Inter", sans-serif',
              maxWidth: 400,
              margin: '0 auto'
            }}
          >
            Verify the authenticity of any KACCIMA membership certificate by entering the registration number
          </Typography>
        </Box>

        {/* Search Input */}
        <Box sx={{ mb: 3 }}>
          <TextField
            fullWidth
            placeholder="Enter Registration Number or CAC Number"
            value={registrationNumber}
            onChange={(e) => {
              setRegistrationNumber(e.target.value);
              setError('');
              setResult(null);
            }}
            onKeyPress={handleKeyPress}
            InputProps={{
              startAdornment: (
                <SearchIcon sx={{ color: '#999', mr: 1 }} />
              ),
              sx: {
                borderRadius: '12px',
                fontFamily: '"Inter", sans-serif',
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#e0e0e0'
                },
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#15e420'
                },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#15e420'
                }
              }
            }}
            disabled={verifying}
          />
          {error && (
            <Typography
              variant="caption"
              sx={{ color: '#dc3545', mt: 0.5, display: 'block' }}
            >
              {error}
            </Typography>
          )}
        </Box>

        {/* Verify Button */}
        <VerifyButton
          fullWidth
          onClick={handleVerify}
          disabled={verifying || !registrationNumber.trim()}
          startIcon={
            verifying ? (
              <CircularProgress size={20} color="inherit" />
            ) : (
              <QrCodeScannerIcon />
            )
          }
        >
          {verifying ? 'Verifying...' : 'Verify Certificate'}
        </VerifyButton>

        {/* Verification Result */}
        {result && (
          <ResultCard elevation={0}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              {result.valid ? (
                <CheckCircleIcon sx={{ fontSize: 32, color: '#28a745' }} />
              ) : (
                <CancelIcon sx={{ fontSize: 32, color: '#dc3545' }} />
              )}
              <Box>
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 600,
                    color: result.valid ? '#28a745' : '#dc3545',
                    fontFamily: '"Poppins", sans-serif'
                  }}
                >
                  {result.valid ? 'Valid Certificate' : 'Invalid Certificate'}
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ color: '#666', fontFamily: '"Inter", sans-serif' }}
                >
                  {result.message}
                </Typography>
              </Box>
            </Box>

            {result.details && (
              <>
                <Divider sx={{ my: 2 }} />
                <Typography
                  variant="subtitle2"
                  sx={{
                    fontWeight: 600,
                    color: '#333',
                    mb: 2,
                    fontFamily: '"Poppins", sans-serif'
                  }}
                >
                  Certificate Details
                </Typography>

                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                  <Box>
                    <Typography variant="caption" sx={{ color: '#999' }}>
                      Company Name
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 500, fontFamily: '"Inter", sans-serif' }}>
                      {result.details.companyName}
                    </Typography>
                  </Box>

                  <Box>
                    <Typography variant="caption" sx={{ color: '#999' }}>
                      Registration Number
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 500, fontFamily: '"Inter", sans-serif' }}>
                      {result.details.registrationNumber}
                    </Typography>
                  </Box>

                  {result.details.cacNumber && (
                    <Box>
                      <Typography variant="caption" sx={{ color: '#999' }}>
                        CAC Number
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 500, fontFamily: '"Inter", sans-serif' }}>
                        {result.details.cacNumber}
                      </Typography>
                    </Box>
                  )}

                  <Box>
                    <Typography variant="caption" sx={{ color: '#999' }}>
                      Status
                    </Typography>
                    <Chip
                      label={result.details.status === 'approved' ? 'Active' : result.details.status}
                      size="small"
                      sx={{
                        bgcolor: result.valid ? '#d4edda' : '#ffebee',
                        color: result.valid ? '#28a745' : '#dc3545',
                        fontWeight: 500,
                        fontSize: '0.75rem'
                      }}
                    />
                  </Box>

                  {result.details.memberSince && (
                    <Box>
                      <Typography variant="caption" sx={{ color: '#999' }}>
                        Member Since
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 500, fontFamily: '"Inter", sans-serif' }}>
                        {formatDate(result.details.memberSince)}
                      </Typography>
                    </Box>
                  )}

                  {result.details.expiryDate && (
                    <Box>
                      <Typography variant="caption" sx={{ color: '#999' }}>
                        Valid Until
                      </Typography>
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          fontWeight: 500, 
                          fontFamily: '"Inter", sans-serif',
                          color: new Date(result.details.expiryDate) < new Date() ? '#dc3545' : '#28a745'
                        }}
                      >
                        {formatDate(result.details.expiryDate)}
                      </Typography>
                    </Box>
                  )}

                  {result.details.businessNature && (
                    <Box>
                      <Typography variant="caption" sx={{ color: '#999' }}>
                        Business Nature
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 500, fontFamily: '"Inter", sans-serif' }}>
                        {result.details.businessNature}
                      </Typography>
                    </Box>
                  )}

                  {result.details.address && (
                    <Box>
                      <Typography variant="caption" sx={{ color: '#999' }}>
                        Address
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 500, fontFamily: '"Inter", sans-serif' }}>
                        {result.details.address}
                      </Typography>
                    </Box>
                  )}
                </Box>
              </>
            )}
          </ResultCard>
        )}

        {/* Info Alert */}
        <Alert 
          severity="info" 
          icon={<InfoIcon />}
          sx={{ 
            mt: 3, 
            borderRadius: '12px',
            bgcolor: 'rgba(21, 228, 32, 0.05)',
            '& .MuiAlert-icon': {
              color: '#15e420'
            }
          }}
        >
          <Typography variant="body2" sx={{ fontFamily: '"Inter", sans-serif' }}>
            You can also scan the QR code on any certificate to verify it. The registration number can be found on the certificate.
          </Typography>
        </Alert>
      </CardContent>
    </StyledCard>
  );
};

export default CertificateVerificationCard;