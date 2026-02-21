import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';

import './Auth.css';

const ResetPassword = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState(null);
  const [session, setSession] = useState(null);

  useEffect(() => {
    // Get the hash from URL
    const hash = window.location.hash;
    
    if (hash && hash.includes('access_token')) {
      // Supabase automatically handles the session from the hash
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session) {
          setSession(session);
        } else {
          showAlert('error', 'Invalid or expired reset link. Please request a new one.');
        }
      });
    } else {
      showAlert('error', 'Invalid or expired reset link. Please request a new one.');
    }
  }, []);

  const showAlert = (type, message) => {
    setAlert({ type, message });
    setTimeout(() => setAlert(null), 5000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      showAlert('error', 'Passwords do not match');
      return;
    }

    if (password.length < 6) {
      showAlert('error', 'Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: password
      });

      if (error) throw error;

      showAlert('success', 'Password updated successfully!');
      
      // Sign out after password reset (optional)
      setTimeout(async () => {
        await supabase.auth.signOut();
        navigate('/login');
      }, 2000);
    } catch (error) {
      showAlert('error', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {alert && (
        <div className={`mui-alert mui-alert-${alert.type}`}>
          <span className="material-icons mui-alert-icon">
            {alert.type === 'success' ? 'check_circle' : 'error'}
          </span>
          <span>{alert.message}</span>
        </div>
      )}

      <main className="auth-container">
        <div className="auth-form">
          <h2>Reset Password</h2>
          {!session ? (
            <div className="alert alert-error">
              <p>Invalid or expired reset link. Please request a new one.</p>
              <Link to="/forgot-password" className="btn" style={{ marginTop: '1rem', display: 'inline-block' }}>
                Request New Link
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="password">New Password</label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  placeholder="New Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength="6"
                />
              </div>
              <div className="form-group">
                <label htmlFor="confirmPassword">Confirm New Password</label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  placeholder="Confirm New Password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength="6"
                />
              </div>
              <button type="submit" className="btn" disabled={loading}>
                {loading ? 'Updating...' : 'Update Password'}
              </button>
            </form>
          )}
          <div className="auth-links">
            <p><Link to="/login">Back to Login</Link></p>
          </div>
        </div>
      </main>
    </>
  );
};

export default ResetPassword;