import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Person as PersonIcon,
  Business as BusinessIcon,
  Notifications as NotificationsIcon,
  Payment as PaymentIcon,
  Description as DescriptionIcon,
  Settings as SettingsIcon,
  Logout as LogoutIcon
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { supabase } from '../supabaseClient';

const StyledSidebar = styled(Paper)(({ theme }) => ({
  width: 280,
  borderRadius: '16px',
  boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)',
  overflow: 'hidden',
  position: 'sticky',
  top: 20,
  height: 'fit-content'
}));

const SidebarHeader = styled(Box)(({ theme }) => ({
  padding: '24px 20px',
  background: 'linear-gradient(135deg, #15e420 0%, #12c21e 100%)',
  color: 'white',
  textAlign: 'center'
}));

const StyledListItem = styled(ListItem)(({ active }) => ({
  padding: '12px 20px',
  margin: '4px 8px',
  borderRadius: '8px',
  cursor: 'pointer',
  backgroundColor: active ? '#e8f5e9' : 'transparent',
  color: active ? '#15e420' : '#333',
  '&:hover': {
    backgroundColor: active ? '#e8f5e9' : '#f5f5f5',
  },
  '& .MuiListItemIcon-root': {
    color: active ? '#15e420' : '#666',
    minWidth: 40
  }
}));

const Sidebar = ({ onLogout }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    { path: '/dashboard', label: 'Dashboard', icon: <DashboardIcon /> },
    { path: '/profile', label: 'Profile', icon: <PersonIcon /> },
    { path: '/organization', label: 'Organization Profile', icon: <BusinessIcon /> },
    { path: '/notifications', label: 'Notifications', icon: <NotificationsIcon /> },
    { path: '/payment', label: 'Payment', icon: <PaymentIcon /> },
    { path: '/documents', label: 'Documents', icon: <DescriptionIcon /> },
    { path: '/settings', label: 'Settings', icon: <SettingsIcon /> }
  ];

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      navigate('/login');
      if (onLogout) onLogout();
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  return (
    <StyledSidebar elevation={0}>
      <SidebarHeader>
        <img 
          src="/static/logo.png" 
          alt="KACCIMA Logo" 
          style={{ width: 60, height: 60, marginBottom: 12 }} 
        />
        <Typography variant="h6" sx={{ fontWeight: 700 }}>
          KACCIMA
        </Typography>
        <Typography variant="body2" sx={{ opacity: 0.9 }}>
          Kano Chamber of Commerce
        </Typography>
      </SidebarHeader>

      <List sx={{ p: 2 }}>
        {menuItems.map((item) => (
          <StyledListItem
            key={item.path}
            active={location.pathname === item.path ? 1 : 0}
            onClick={() => navigate(item.path)}
          >
            <ListItemIcon>{item.icon}</ListItemIcon>
            <ListItemText 
              primary={item.label}
              primaryTypographyProps={{
                fontWeight: location.pathname === item.path ? 600 : 400
              }}
            />
          </StyledListItem>
        ))}

        <Divider sx={{ my: 2 }} />

        <StyledListItem onClick={handleLogout}>
          <ListItemIcon>
            <LogoutIcon />
          </ListItemIcon>
          <ListItemText primary="Logout" />
        </StyledListItem>
      </List>
    </StyledSidebar>
  );
};

export default Sidebar;