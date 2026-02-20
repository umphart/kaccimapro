import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Footer from './components/Footer';
import Login from './components/Login';
import Register from './components/Register';
import ForgotPassword from './components/ForgotPassword';
import ResetPassword from './components/ResetPassword';
import RegistrationForm from './components/registration/RegistrationForm';
import Dashboard from './components/Dashboard';
import Payment from './components/payment/Payment';
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
import AdminFinalApprovals from './components/admin/AdminFinalApprovals';
import AdminRoute from './components/admin/AdminRoute';
import AdminOrganizationDetail from './components/admin/AdminOrganizationDetail';
import AdminPaymentDetail from './components/admin/AdminPaymentDetail';
import AdminOrganizationDocuments from './components/admin/AdminOrganizationDocuments';

import { Box } from '@mui/material';
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
          <Route path="/admin/organizations/pending" element={
            <AdminRoute>
              <AdminOrganizations filter="pending" />
            </AdminRoute>
          } />
          <Route path="/admin/organizations/approved" element={
            <AdminRoute>
              <AdminOrganizations filter="approved" />
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
          <Route path="/admin/documents" element={
            <AdminRoute>
              <AdminDocuments />
            </AdminRoute>
          } />
          <Route path="/admin/final-approvals" element={
            <AdminRoute requiredType="approver">
              <AdminFinalApprovals />
            </AdminRoute>
          } />
          
          {/* Protected User Routes */}
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Dashboard />
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
          <Route path="/payment" element={
            <ProtectedRoute>
              <Payment />
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