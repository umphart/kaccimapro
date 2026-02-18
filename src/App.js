import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import Login from './components/Login';
import Register from './components/Register';
import ForgotPassword from './components/ForgotPassword';
import ResetPassword from './components/ResetPassword';
import RegistrationForm from './components/RegistrationForm';
import Dashboard from './components/Dashboard';
import Payment from './components/Payment';
import Profile from './components/Profile';
import OrganizationProfile from './components/OrganizationProfile';
import ProtectedRoute from './components/ProtectedRoute';
import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <Header />
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
        <Footer />
      </div>
    </Router>
  );
}

export default App;