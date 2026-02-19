import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Header from './components/Header';
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
import { Box } from '@mui/material';
import './App.css';

// Layout component to conditionally show header and footer only
const AppLayout = ({ children }) => {
  const location = useLocation();
  const isAuthPage = ['/login', '/register', '/forgot-password', '/reset-password'].includes(location.pathname);

  return (
    <div className="App">
      {!isAuthPage && <Header />}
      <Box sx={{ minHeight: 'calc(100vh - 64px)' }}>
        {children}
      </Box>
      {!isAuthPage && <Footer />}
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
          
          {/* Protected Routes */}
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