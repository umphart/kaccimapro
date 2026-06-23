// App.js - Complete with Smart Dashboard and Payment Routing
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { Box, CircularProgress } from '@mui/material';
import { supabase } from './supabaseClient';
import Footer from './components/Footer';
import Login from './components/Login';
import Register from './components/Register';
import ForgotPassword from './components/ForgotPassword';
import ResetPassword from './components/ResetPassword';
import RegistrationForm from './components/registration/RegistrationForm';
import Dashboard from './components/Dashboard';
import AdminOrgDashboard from './components/admin-org-dashboard/AdminOrgDashboard';
import Payment from './components/payment/Payment';
import AdminOrganizationPayment from './components/admin-org-payment/AdminOrganizationPayment';
import Profile from './components/Profile';
import OrganizationProfile from './components/OrganizationProfile';
import Notifications from './components/Notifications';
import Documents from './components/Documents';
import Settings from './components/Settings';
import ProtectedRoute from './components/ProtectedRoute';
import AdminAuth from './components/admin/AdminAuth';
import AdminDashboard from './components/admin/AdminDashboard';
import AdminOrganizations from './components/admin/AdminOrganizations';
import AdminPayments from './components/admin/AdminPayments';
import AdminDocuments from './components/admin/AdminDocuments';
import AdminRoute from './components/admin/AdminRoute';
import AdminOrganizationDetail from './components/admin/AdminOrganizationDetail';
import AdminPaymentDetail from './components/admin/AdminPaymentDetail';
import AdminOrganizationDocuments from './components/admin/AdminOrganizationDocuments';
import AdminReports from './components/admin/AdminReports';
import AdminNotifications from './components/admin/AdminNotifications';
import AdminSettings from './components/admin/AdminSettings';
import EmailConfirmed from './components/EmailConfirmed';
import AdminDocumentReview from './components/admin/AdminDocumentReview';
import AdminManageOrganizations from './components/admin/AdminManageOrganizations';
import './App.css';

// Layout component to conditionally show header and footer only
const AppLayout = ({ children }) => {
  const location = useLocation();
  const isAuthPage = ['/login', '/register', '/forgot-password', '/reset-password'].includes(location.pathname);
  const isAdminPage = location.pathname.startsWith('/admin');

  return (
    <div className="App">
      <Box sx={{ minHeight: 'calc(100vh - 64px)' }}>
        {children}
      </Box>
      {!isAuthPage && !isAdminPage && <Footer />}
    </div>
  );
};

// Smart Dashboard Router Component
const DashboardRouter = () => {
  const [loading, setLoading] = useState(true);
  const [isAdminCreated, setIsAdminCreated] = useState(false);
  const [hasOrganization, setHasOrganization] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    checkOrganizationType();
  }, []);

  const checkOrganizationType = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/login');
        return;
      }

      console.log('🔍 Checking organization for user:', user.id);
      console.log('📧 User email:', user.email);
      console.log('📋 User metadata:', user.user_metadata);

      let adminOrg = null;

      // METHOD 1: Check by organization_id in user metadata
      if (user.user_metadata?.organization_id) {
        console.log('🔍 Checking by organization_id from metadata:', user.user_metadata.organization_id);
        
        const { data: metaOrg, error: metaError } = await supabase
          .from('organizations_registry')
          .select('*')
          .eq('id', user.user_metadata.organization_id)
          .maybeSingle();

        if (metaOrg) {
          console.log('✅ Found organization by metadata ID:', metaOrg.company_name);
          adminOrg = metaOrg;
          
          // Update created_by if not set
          if (!metaOrg.created_by) {
            await supabase
              .from('organizations_registry')
              .update({ created_by: user.id })
              .eq('id', metaOrg.id);
            console.log('✅ Updated organization with created_by:', user.id);
          }
        }
      }

      // METHOD 2: Check by created_by (if not found above)
      if (!adminOrg) {
        console.log('🔍 Checking by created_by:', user.id);
        
        const { data: adminOrgData, error: adminOrgError } = await supabase
          .from('organizations_registry')
          .select('*')
          .eq('created_by', user.id)
          .maybeSingle();

        if (adminOrgData) {
          console.log('✅ Found organization by created_by:', adminOrgData.company_name);
          adminOrg = adminOrgData;
        }
      }

      // METHOD 3: Check by email (if not found above)
      if (!adminOrg) {
        console.log('🔍 Checking by email:', user.email);
        
        const { data: emailOrg, error: emailError } = await supabase
          .from('organizations_registry')
          .select('*')
          .eq('email', user.email)
          .maybeSingle();

        if (emailOrg) {
          console.log('✅ Found organization by email:', emailOrg.company_name);
          adminOrg = emailOrg;
          
          // Update created_by if not set
          if (!emailOrg.created_by) {
            await supabase
              .from('organizations_registry')
              .update({ created_by: user.id })
              .eq('id', emailOrg.id);
            console.log('✅ Updated organization with created_by:', user.id);
          }
        }
      }

      if (adminOrg) {
        console.log('✅ Admin-created organization found:', adminOrg.company_name);
        setIsAdminCreated(true);
        setHasOrganization(true);
      } else {
        // Check if user has a self-created organization
        console.log('🔍 Checking for self-created organization...');
        
        const { data: selfOrg, error: selfError } = await supabase
          .from('organizations')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        if (selfOrg) {
          console.log('✅ Self-created organization found:', selfOrg.company_name);
          setIsAdminCreated(false);
          setHasOrganization(true);
        } else {
          console.log('❌ No organization found. Redirecting to registration...');
          setHasOrganization(false);
          navigate('/organization-registration');
          return;
        }
      }
    } catch (error) {
      console.error('❌ Error checking organization:', error);
      navigate('/organization-registration');
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

  if (hasOrganization) {
    return isAdminCreated ? <AdminOrgDashboard /> : <Dashboard />;
  }

  return null;
};

// Smart Payment Router Component
const PaymentRouter = () => {
  const [loading, setLoading] = useState(true);
  const [isAdminCreated, setIsAdminCreated] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    checkOrganizationType();
  }, []);

  const checkOrganizationType = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/login');
        return;
      }

      // Check for admin-created organization
      let adminOrg = null;

      // Check by organization_id in metadata
      if (user.user_metadata?.organization_id) {
        const { data: metaOrg, error: metaError } = await supabase
          .from('organizations_registry')
          .select('id')
          .eq('id', user.user_metadata.organization_id)
          .maybeSingle();

        if (metaOrg) {
          adminOrg = metaOrg;
        }
      }

      // Check by created_by
      if (!adminOrg) {
        const { data: adminOrgData, error: adminOrgError } = await supabase
          .from('organizations_registry')
          .select('id')
          .eq('created_by', user.id)
          .maybeSingle();

        if (adminOrgData) {
          adminOrg = adminOrgData;
        }
      }

      // Check by email
      if (!adminOrg && user.email) {
        const { data: emailOrg, error: emailError } = await supabase
          .from('organizations_registry')
          .select('id')
          .eq('email', user.email)
          .maybeSingle();

        if (emailOrg) {
          adminOrg = emailOrg;
        }
      }

      if (adminOrg) {
        console.log('✅ Admin-created organization found for payment');
        setIsAdminCreated(true);
      } else {
        console.log('ℹ️ Self-created organization detected for payment');
        setIsAdminCreated(false);
      }
    } catch (error) {
      console.error('❌ Error checking organization type for payment:', error);
      setIsAdminCreated(false);
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

  return isAdminCreated ? <AdminOrganizationPayment /> : <Payment />;
};

function App() {
  return (
    <Router>
      <AppLayout>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Login />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/email-confirmed" element={<EmailConfirmed />} />
          
          {/* Admin Routes */}
          <Route path="/admin/login" element={<AdminAuth />} />
          <Route path="/admin/dashboard" element={
            <AdminRoute>
              <AdminDashboard />
            </AdminRoute>
          } />
          
          <Route path="/admin/organizations" element={
            <AdminRoute>
              <AdminOrganizations />
            </AdminRoute>
          } />
          
          <Route path="/admin/organizations/:id/documents" element={<AdminDocumentReview />} />
          
          <Route path="/admin/organizations/filter/:filter" element={
            <AdminRoute>
              <AdminOrganizations />
            </AdminRoute>
          } />
          
          <Route path="/admin/manage-organizations" element={
            <AdminRoute>
              <AdminManageOrganizations />
            </AdminRoute>
          } />

          <Route path="/admin/organizations/:id" element={
            <AdminRoute>
              <AdminOrganizationDetail />
            </AdminRoute>
          } />

          <Route path="/admin/payments" element={
            <AdminRoute>
              <AdminPayments />
            </AdminRoute>
          } />
          
          <Route path="/admin/payments/:id" element={
            <AdminRoute>
              <AdminPaymentDetail />
            </AdminRoute>
          } />
          
          <Route path="/admin/organizations/:id/documents" element={
            <AdminRoute>
              <AdminOrganizationDocuments />
            </AdminRoute>
          } />
          
          <Route path="/admin/reports" element={
            <AdminRoute>
              <AdminReports />
            </AdminRoute>
          } />

          <Route path="/admin/notifications" element={
            <AdminRoute>
              <AdminNotifications />
            </AdminRoute>
          } />

          <Route path="/admin/settings" element={
            <AdminRoute>
              <AdminSettings />
            </AdminRoute>
          } />
          
          <Route path="/admin/documents" element={
            <AdminRoute>
              <AdminDocuments />
            </AdminRoute>
          } />
          
          {/* Protected User Routes */}
          {/* Dashboard - Smart routing based on organization type */}
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <DashboardRouter />
            </ProtectedRoute>
          } />
          
          <Route path="/profile" element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          } />
          
          <Route path="/organization" element={
            <ProtectedRoute>
              <OrganizationProfile />
            </ProtectedRoute>
          } />
          
          <Route path="/notifications" element={
            <ProtectedRoute>
              <Notifications />
            </ProtectedRoute>
          } />
          
          <Route path="/documents" element={
            <ProtectedRoute>
              <Documents />
            </ProtectedRoute>
          } />
          
          <Route path="/settings" element={
            <ProtectedRoute>
              <Settings />
            </ProtectedRoute>
          } />
          
          {/* Payment - Smart routing based on organization type */}
          <Route path="/payment" element={
            <ProtectedRoute>
              <PaymentRouter />
            </ProtectedRoute>
          } />
          
          {/* Direct route for admin-org payment (optional) */}
          <Route path="/admin-org-payment" element={
            <ProtectedRoute>
              <AdminOrganizationPayment />
            </ProtectedRoute>
          } />
          
          <Route path="/organization-registration" element={
            <ProtectedRoute>
              <RegistrationForm />
            </ProtectedRoute>
          } />
          
          <Route path="/success" element={
            <ProtectedRoute>
              <div className="success-container">
                <h2>Registration Successful!</h2>
                <p>Thank you for registering. Your application is being reviewed.</p>
              </div>
            </ProtectedRoute>
          } />
        </Routes>
      </AppLayout>
    </Router>
  );
}

export default App;