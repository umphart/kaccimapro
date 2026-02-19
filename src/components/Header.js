import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import './Header.css';

const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(null);

  // Check if this is an auth page - this is a normal variable, not a hook
  const isAuthPage = ['/login', '/register', '/forgot-password', '/reset-password'].includes(location.pathname);

  useEffect(() => {
    // Only set up auth if not on auth pages
    if (!isAuthPage) {
      checkUser();
      
      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        setUser(session?.user || null);
      });

      return () => subscription.unsubscribe();
    }
  }, [isAuthPage]); // Add isAuthPage as dependency

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  // Don't render header on auth pages
  if (isAuthPage) {
    return null;
  }

  return (
    <header>
      <nav>
        <div className="logo">
          <img src="/static/logo.png" alt="KACCIMA Logo" width="40" />
          <span className="logo-text">KACCIMA</span>
        </div>
        <ul>
          <li><Link to="/">Home</Link></li>
          <li><a href="https://kaccima.ng/about-kaccima/">About</a></li>
          <li><a href="https://kaccima.ng/templates/contact/">Contact</a></li>
          {user ? (
            <>
              <li><Link to="/dashboard">Dashboard</Link></li>
              <li><button onClick={handleLogout} className="btn-link">Logout</button></li>
            </>
          ) : (
            <>
              <li><Link to="/login">Login</Link></li>
              <li><Link to="/register">Register</Link></li>
            </>
          )}
        </ul>
      </nav>
    </header>
  );
};

export default Header;