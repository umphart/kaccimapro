import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { Box, CircularProgress, Paper, Typography, Button } from '@mui/material';
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
import RefereesManagement from './components/referees/RefereesManagement';

import Layout from './components/Layout';

// Admin Org Dashboard Components
import AdminOrgProfile from './components/admin-org-dashboard/AdminOrgProfile';
import AdminOrgOrganizationProfile from './components/admin-org-dashboard/AdminOrgOrganizationProfile';
import AdminOrgNotifications from './components/admin-org-dashboard/AdminOrgNotifications';
import AdminOrgDocuments from './components/admin-org-dashboard/AdminOrgDocuments';
import AdminOrgSettings from './components/admin-org-dashboard/AdminOrgSettings';

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

// Helper function to check if user belongs to admin-created organization
const checkAdminOrg = async (user) => {
  if (!user) return false;

  // Check by organization_id in user metadata
  if (user.user_metadata?.organization_id) {
    const { data } = await supabase
      .from('organizations_registry')
      .select('id')
      .eq('id', user.user_metadata.organization_id)
      .maybeSingle();
    if (data) return true;
  }

  // Check by created_by
  const { data: byCreator } = await supabase
    .from('organizations_registry')
    .select('id')
    .eq('created_by', user.id)
    .maybeSingle();
  if (byCreator) return true;

  // Check by email
  if (user.email) {
    const { data: byEmail } = await supabase
      .from('organizations_registry')
      .select('id')
      .eq('email', user.email)
      .maybeSingle();
    if (byEmail) return true;
  }

  return false;
};

// Smart Dashboard Router Component
const DashboardRouter = () => {
  const [loading, setLoading] = useState(true);
  const [isAdminCreated, setIsAdminCreated] = useState(false);
  const [hasOrganization, setHasOrganization] = useState(false);
  const [showNoOrgMessage, setShowNoOrgMessage] = useState(false);
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
        
        const { data: metaOrg } = await supabase
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
        
        const { data: adminOrgData } = await supabase
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
        
        const { data: emailOrg } = await supabase
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
        setShowNoOrgMessage(false);
      } else {
        // Check if user has a self-created organization
        console.log('🔍 Checking for self-created organization...');
        
        const { data: selfOrg } = await supabase
          .from('organizations')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        if (selfOrg) {
          console.log('✅ Self-created organization found:', selfOrg.company_name);
          setIsAdminCreated(false);
          setHasOrganization(true);
          setShowNoOrgMessage(false);
        } else {
          console.log('❌ No organization found. Showing notification...');
          setIsAdminCreated(false);
          setHasOrganization(false);
          setShowNoOrgMessage(true);
        }
      }
    } catch (error) {
      console.error('❌ Error checking organization:', error);
      setShowNoOrgMessage(true);
    } finally {
      setLoading(false);
    }
  };

  // Handle registration navigation
  const handleRegister = () => {
    navigate('/organization-registration');
  };

  // Handle logout
  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      navigate('/login');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress style={{ color: '#15e420' }} />
      </Box>
    );
  }

  // Show "No Organization" message
  if (showNoOrgMessage) {
    return (
      <Layout>
        <Box 
          display="flex" 
          justifyContent="center" 
          alignItems="center" 
          minHeight="400px"
          sx={{ padding: 3 }}
        >
          <Paper 
            elevation={3} 
            sx={{ 
              maxWidth: 600, 
              width: '100%', 
              padding: 4,
              textAlign: 'center',
              borderRadius: 2
            }}
          >
            <Typography variant="h5" gutterBottom sx={{ color: '#15e420', fontWeight: 600 }}>
              Welcome to KACCIMA!
            </Typography>
            
            <Box sx={{ my: 3 }}>
              <Box 
                sx={{ 
                  width: 80, 
                  height: 80, 
                  margin: '0 auto',
                  backgroundColor: '#e8f5e9',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mb: 2
                }}
              >
                <span className="material-icons" style={{ fontSize: 48, color: '#15e420' }}>
                  business
                </span>
              </Box>
            </Box>
            
            <Typography variant="body1" sx={{ mb: 2, color: '#666' }}>
              You haven't registered any organization yet. To become a member of KACCIMA and access all features, please complete the registration process.
            </Typography>
            
            <Typography variant="body2" sx={{ mb: 3, color: '#999' }}>
              Registration is quick and easy. You'll need to provide your company details, upload required documents, and complete the payment process.
            </Typography>
            
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Button
                variant="contained"
                onClick={handleRegister}
                sx={{
                  backgroundColor: '#15e420',
                  '&:hover': {
                    backgroundColor: '#0fb815',
                  },
                  padding: '12px 30px',
                  fontSize: '16px',
                  textTransform: 'none',
                  borderRadius: '8px'
                }}
              >
                <span className="material-icons" style={{ marginRight: 8 }}>add_business</span>
                Register Your Organization
              </Button>
              
              <Button
                variant="outlined"
                onClick={handleLogout}
                sx={{
                  borderColor: '#15e420',
                  color: '#15e420',
                  '&:hover': {
                    borderColor: '#0fb815',
                    backgroundColor: 'rgba(21, 228, 32, 0.05)'
                  },
                  padding: '12px 30px',
                  fontSize: '16px',
                  textTransform: 'none',
                  borderRadius: '8px'
                }}
              >
                Logout
              </Button>
            </Box>
          </Paper>
        </Box>
      </Layout>
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

      isAdminCreated = await checkAdminOrg(user);
      setIsAdminCreated(isAdminCreated);
      
      console.log(isAdminCreated ? '✅ Admin-created organization found for payment' : 'ℹ️ Self-created organization detected for payment');
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

// Smart Profile Router Component
const ProfileRouter = () => {
  const [loading, setLoading] = useState(true);
  const [isAdminCreated, setIsAdminCreated] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    checkOrgType();
  }, []);

  const checkOrgType = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/login');
        return;
      }

      const isAdmin = await checkAdminOrg(user);
      setIsAdminCreated(isAdmin);
    } catch (error) {
      console.error('Error checking organization type:', error);
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

  return isAdminCreated ? <AdminOrgProfile /> : <Profile />;
};

// Smart Organization Profile Router Component
const OrganizationProfileRouter = () => {
  const [loading, setLoading] = useState(true);
  const [isAdminCreated, setIsAdminCreated] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    checkOrgType();
  }, []);

  const checkOrgType = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/login');
        return;
      }

      const isAdmin = await checkAdminOrg(user);
      setIsAdminCreated(isAdmin);
    } catch (error) {
      console.error('Error checking organization type:', error);
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

  return isAdminCreated ? <AdminOrgOrganizationProfile /> : <OrganizationProfile />;
};

// Smart Notifications Router Component
const NotificationsRouter = () => {
  const [loading, setLoading] = useState(true);
  const [isAdminCreated, setIsAdminCreated] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    checkOrgType();
  }, []);

  const checkOrgType = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/login');
        return;
      }

      const isAdmin = await checkAdminOrg(user);
      setIsAdminCreated(isAdmin);
    } catch (error) {
      console.error('Error checking organization type:', error);
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

  return isAdminCreated ? <AdminOrgNotifications /> : <Notifications />;
};

// Smart Documents Router Component
const DocumentsRouter = () => {
  const [loading, setLoading] = useState(true);
  const [isAdminCreated, setIsAdminCreated] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    checkOrgType();
  }, []);

  const checkOrgType = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/login');
        return;
      }

      const isAdmin = await checkAdminOrg(user);
      setIsAdminCreated(isAdmin);
    } catch (error) {
      console.error('Error checking organization type:', error);
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

  return isAdminCreated ? <AdminOrgDocuments /> : <Documents />;
};

// Smart Settings Router Component
const SettingsRouter = () => {
  const [loading, setLoading] = useState(true);
  const [isAdminCreated, setIsAdminCreated] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    checkOrgType();
  }, []);

  const checkOrgType = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/login');
        return;
      }

      const isAdmin = await checkAdminOrg(user);
      setIsAdminCreated(isAdmin);
    } catch (error) {
      console.error('Error checking organization type:', error);
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

  return isAdminCreated ? <AdminOrgSettings /> : <Settings />;
};

// Smart Referees Router Component
const RefereesRouter = () => {
  const [loading, setLoading] = useState(true);
  const [isAdminCreated, setIsAdminCreated] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    checkOrgType();
  }, []);

  const checkOrgType = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/login');
        return;
      }

      const isAdmin = await checkAdminOrg(user);
      setIsAdminCreated(isAdmin);
      console.log(isAdmin ? '✅ Admin-created organization for referees' : 'ℹ️ Self-created organization for referees');
    } catch (error) {
      console.error('Error checking organization type for referees:', error);
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

  return <RefereesManagement />;
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
          
          <Route path="/admin/organizations/:id/documents" element={
            <AdminRoute>
              <AdminDocumentReview />
            </AdminRoute>
          } />
          
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
          
          {/* Protected User Routes with Smart Routing */}
          {/* Dashboard - Smart routing based on organization type */}
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <DashboardRouter />
            </ProtectedRoute>
          } />
          
          {/* Profile - Smart routing based on organization type */}
          <Route path="/profile" element={
            <ProtectedRoute>
              <ProfileRouter />
            </ProtectedRoute>
          } />
          
          {/* Organization Profile - Smart routing based on organization type */}
          <Route path="/organization" element={
            <ProtectedRoute>
              <OrganizationProfileRouter />
            </ProtectedRoute>
          } />
          
          {/* Notifications - Smart routing based on organization type */}
          <Route path="/notifications" element={
            <ProtectedRoute>
              <NotificationsRouter />
            </ProtectedRoute>
          } />
          
          {/* Documents - Smart routing based on organization type */}
          <Route path="/documents" element={
            <ProtectedRoute>
              <DocumentsRouter />
            </ProtectedRoute>
          } />
          
          {/* Settings - Smart routing based on organization type */}
          <Route path="/settings" element={
            <ProtectedRoute>
              <SettingsRouter />
            </ProtectedRoute>
          } />
          
          {/* Payment - Smart routing based on organization type */}
          <Route path="/payment" element={
            <ProtectedRoute>
              <PaymentRouter />
            </ProtectedRoute>
          } />
          
          {/* Referees - Smart routing based on organization type */}
          <Route path="/referees" element={
            <ProtectedRoute>
              <RefereesRouter />
            </ProtectedRoute>
          } />
          
          {/* Direct routes for admin-org pages (useful for explicit navigation) */}
          <Route path="/admin-org-dashboard" element={
            <ProtectedRoute>
              <AdminOrgDashboard />
            </ProtectedRoute>
          } />
          
          <Route path="/admin-org-profile" element={
            <ProtectedRoute>
              <AdminOrgProfile />
            </ProtectedRoute>
          } />
          
          <Route path="/admin-org-organization" element={
            <ProtectedRoute>
              <AdminOrgOrganizationProfile />
            </ProtectedRoute>
          } />
          
          <Route path="/admin-org-notifications" element={
            <ProtectedRoute>
              <AdminOrgNotifications />
            </ProtectedRoute>
          } />
          
          <Route path="/admin-org-documents" element={
            <ProtectedRoute>
              <AdminOrgDocuments />
            </ProtectedRoute>
          } />
          
          <Route path="/admin-org-settings" element={
            <ProtectedRoute>
              <AdminOrgSettings />
            </ProtectedRoute>
          } />
          
          {/* Direct route for admin-org payment */}
          <Route path="/admin-org-payment" element={
            <ProtectedRoute>
              <AdminOrganizationPayment />
            </ProtectedRoute>
          } />
          
          {/* Registration Route */}
          <Route path="/organization-registration" element={
            <ProtectedRoute>
              <RegistrationForm />
            </ProtectedRoute>
          } />
          
          {/* Success Route */}
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