// components/admin/AdminOrganizationDashboardRedirect.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import { Box, CircularProgress, Typography, Alert } from '@mui/material';

const AdminOrganizationDashboardRedirect = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAndRedirect = async () => {
      try {
        // Get the current user
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) {
          navigate('/admin/login');
          return;
        }

        // Get the organization from the registry
        const { data: orgData, error: orgError } = await supabase
          .from('organizations_registry')
          .select('id, company_name')
          .eq('email', user.email)
          .single();

        if (orgError) {
          console.error('Error fetching organization:', orgError);
          setError('Organization not found. Please contact admin.');
          setTimeout(() => navigate('/admin/organizations'), 3000);
          return;
        }

        if (orgData?.id) {
          // Redirect to the organization dashboard with the ID
          navigate(`/admin/organization-dashboard/${orgData.id}/profile`);
        } else {
          setError('No organization found for this account.');
          setTimeout(() => navigate('/admin/organizations'), 3000);
        }
      } catch (error) {
        console.error('Error:', error);
        setError('Failed to load organization data.');
        setTimeout(() => navigate('/admin/organizations'), 3000);
      } finally {
        setLoading(false);
      }
    };

    fetchAndRedirect();
  }, [navigate]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100vh', gap: 3 }}>
        <CircularProgress sx={{ color: '#15e420' }} />
        <Typography variant="body2" color="textSecondary">Loading your organization dashboard...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100vh', gap: 2, p: 3 }}>
        <Alert severity="error" sx={{ maxWidth: 500 }}>
          {error}
        </Alert>
        <Typography variant="body2" color="textSecondary">Redirecting to admin dashboard...</Typography>
        <CircularProgress size={24} sx={{ color: '#15e420' }} />
      </Box>
    );
  }

  return null;
};

export default AdminOrganizationDashboardRedirect;