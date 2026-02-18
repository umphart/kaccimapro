import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import './Profile.css';

const Profile = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [organization, setOrganization] = useState(null);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState(null);
  const [logoUrl, setLogoUrl] = useState(null);

  useEffect(() => {
    checkUser();
  }, []);

  useEffect(() => {
    if (user) {
      fetchOrganizationData();
    }
  }, [user]);

  const showAlert = (type, message) => {
    setAlert({ type, message });
    setTimeout(() => setAlert(null), 5000);
  };

  const checkUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/login');
      } else {
        setUser(user);
      }
    } catch (error) {
      console.error('Error checking user:', error);
      navigate('/login');
    }
  };

  const fetchOrganizationData = async () => {
    try {
      if (!user) return;

      const { data: orgData, error } = await supabase
        .from('organizations')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;

      setOrganization(orgData);

      // Load company logo if exists
      if (orgData.company_logo_path) {
        const { data } = supabase.storage
          .from('logos')
          .getPublicUrl(orgData.company_logo_path);
        setLogoUrl(data.publicUrl);
      }
    } catch (error) {
      console.error('Error fetching organization:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditOrganization = () => {
    navigate('/organization/edit');
  };

  const handleEditUserProfile = () => {
    navigate('/profile/edit');
  };

  if (loading) {
    return <div className="loading">Loading profile...</div>;
  }

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

      <main className="dashboard-container">
        {/* Sidebar */}
        <aside className="sidebar">
          <ul>
            <li><a href="/dashboard">Dashboard</a></li>
            <li className="active"><a href="/profile">Profile</a></li>
            <li><a href="/organization">Organization Profile</a></li>
            <li><a href="/notifications">Notifications</a></li>
          </ul>
        </aside>

        {/* Profile Content */}
        <section className="dashboard-content">
          <div className="profile-info">
            <h3>Profile Information</h3>
            
            {/* User Photo */}
            <div className="photo-container">
              {logoUrl ? (
                <img 
                  id="passportPhoto" 
                  src={logoUrl} 
                  alt="Company Logo" 
                  className="profile-photo" 
                  width="70px" 
                  height="70px" 
                />
              ) : (
                <div className="profile-photo-placeholder">
                  <span className="material-icons">business</span>
                </div>
              )}
            </div>

            <div className="info-item">
              <span className="label">Company Name:</span>
              <span className="value">{organization?.company_name || 'N/A'}</span>
            </div>

            <div className="info-item">
              <span className="label">Email:</span>
              <span className="value">{organization?.email || user?.email || 'N/A'}</span>
            </div>

            <div className="info-item">
              <span className="label">Office Address:</span>
              <span className="value">{organization?.office_address || 'N/A'}</span>
            </div>

            <div className="info-item">
              <span className="label">Phone Number:</span>
              <span className="value">{organization?.phone_number || 'N/A'}</span>
            </div>

            <div className="info-item">
              <span className="label">Membership Status:</span>
              <span className={`value status-badge status-${organization?.status?.toLowerCase() || 'pending'}`}>
                {organization?.status || 'Pending'}
              </span>
            </div>

            <button 
              onClick={handleEditOrganization} 
              className="btn outline"
            >
              Edit Organization Profile
            </button>

            <div className="profile-info-section">
              <h3>User Profile & Security</h3>
              
              <div className="info-item">
                <span className="label">User Email:</span>
                <span className="value">{user?.email || 'N/A'}</span>
              </div>

              <div className="info-item">
                <span className="label">Password:</span>
                <span className="value">••••••••</span>
              </div>

              <button 
                onClick={handleEditUserProfile} 
                className="btn outline"
              >
                Edit User Profile
              </button>
            </div>
          </div>
        </section>
      </main>
    </>
  );
};

export default Profile;