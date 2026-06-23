// components/ProtectedRoute.jsx
import React, { useState, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { Box, CircularProgress } from '@mui/material';

const ProtectedRoute = ({ children }) => {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const location = useLocation();

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        setUser(user);
        const role = user.user_metadata?.role || 'organization';
        setUserRole(role);
        
        // Check if user is trying to access admin routes
        if (location.pathname.startsWith('/admin') && role !== 'admin') {
          // Redirect organization users to their dashboard
          window.location.href = '/dashboard';
          return;
        }
      } else {
        // Not logged in, redirect to login
        window.location.href = '/login';
        return;
      }
    } catch (error) {
      console.error('Error checking user:', error);
      window.location.href = '/login';
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress style={{ color: '#15e420' }} />
      </Box>
    );
  }

  return user ? children : <Navigate to="/login" />;
};

export default ProtectedRoute;