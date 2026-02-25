import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  IconButton,
  Drawer,
  useTheme,
  useMediaQuery,
  Badge
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Person as PersonIcon,
  Business as BusinessIcon,
  Notifications as NotificationsIcon,
  Payment as PaymentIcon,
  Description as DescriptionIcon,
  Settings as SettingsIcon,
  Logout as LogoutIcon,
  Menu as MenuIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { supabase } from '../supabaseClient';

// Styled components with Google Fonts
const StyledSidebar = styled(Paper)(({ theme }) => ({
  width: 280,
  borderRadius: '16px',
  boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)',
  overflow: 'hidden',
  position: 'sticky',
  top: 10,
  height: 'fit-content',
  fontFamily: '"Poppins", sans-serif',
  [theme.breakpoints.down('md')]: {
    display: 'none'
  }
}));

const MobileSidebarHeader = styled(Box)(({ theme }) => ({
  padding: '16px 20px',
  background: 'linear-gradient(135deg, #15e420 0%, #12c21e 100%)',
  color: 'white',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between'
}));

const SidebarHeader = styled(Box)(({ theme }) => ({
  padding: '24px 20px',
  background: 'linear-gradient(135deg, #15e420 0%, #12c21e 100%)',
  color: 'white',
  textAlign: 'center',
  fontFamily: '"Poppins", sans-serif'
}));

const StyledListItem = styled(ListItem)(({ active, theme }) => ({
  padding: '12px 20px',
  margin: '4px 8px',
  borderRadius: '8px',
  cursor: 'pointer',
  backgroundColor: active ? '#e8f5e9' : 'transparent',
  color: active ? '#15e420' : '#333',
  transition: 'all 0.3s ease',
  fontFamily: '"Inter", sans-serif',
  '&:hover': {
    backgroundColor: active ? '#e8f5e9' : '#f5f5f5',
    transform: 'translateX(4px)'
  },
  '& .MuiListItemIcon-root': {
    color: active ? '#15e420' : '#666',
    minWidth: 40
  },
  '& .MuiListItemText-primary': {
    fontWeight: active ? 600 : 400,
    fontSize: '14px'
  }
}));

const MenuButton = styled(IconButton)(({ theme }) => ({
  position: 'fixed',
  top: 16, // Changed from 80 to 16 to position at top
  left: 16,
  zIndex: 1200, // Increased z-index to ensure it's above other elements
  backgroundColor: '#15e420',
  color: 'white',
  '&:hover': {
    backgroundColor: '#12c21e',
    transform: 'scale(1.1)'
  },
  transition: 'all 0.3s ease',
  display: 'none',
  [theme.breakpoints.down('md')]: {
    display: 'flex'
  }
}));

const StyledBadge = styled(Badge)(({ theme }) => ({
  '& .MuiBadge-badge': {
    backgroundColor: '#f44336',
    color: 'white',
    fontSize: '10px',
    minWidth: '16px',
    height: '16px'
  }
}));

const Sidebar = ({ onLogout, initialUnreadCount = 0 }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(initialUnreadCount);
  const [user, setUser] = useState(null);
  const [organization, setOrganization] = useState(null);

  useEffect(() => {
    checkUser();
  }, []);

  useEffect(() => {
    if (user) {
      fetchOrganizationData();
    }
  }, [user]);

  // Set up real-time subscription for new notifications
  useEffect(() => {
    if (organization?.id) {
      // Subscribe to new notifications
      const subscription = supabase
        .channel('sidebar_notifications_channel')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'organization_notifications',
            filter: `organization_id=eq.${organization.id}`
          },
          (payload) => {
            // Increment unread count when new notification arrives
            setUnreadCount(prev => prev + 1);
          }
        )
        .subscribe();

      // Also subscribe to updates (when notifications are marked as read)
      const updateSubscription = supabase
        .channel('sidebar_notifications_update_channel')
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'organization_notifications',
            filter: `organization_id=eq.${organization.id}`
          },
          () => {
            // Refresh unread count when notifications are updated
            fetchUnreadCount();
          }
        )
        .subscribe();

      return () => {
        subscription.unsubscribe();
        updateSubscription.unsubscribe();
      };
    }
  }, [organization?.id]);

  const checkUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUser(user);
      }
    } catch (error) {
      console.error('Error checking user:', error);
    }
  };

  const fetchOrganizationData = async () => {
    try {
      const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching organization:', error);
      }

      if (data) {
        setOrganization(data);
        await fetchUnreadCount(data.id);
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const fetchUnreadCount = async (orgId = organization?.id) => {
    if (!orgId) return;
    
    try {
      const { count, error } = await supabase
        .from('organization_notifications')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', orgId)
        .eq('read', false);

      if (error) throw error;
      setUnreadCount(count || 0);
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  const menuItems = [
    { path: '/dashboard', label: 'Dashboard', icon: <DashboardIcon /> },
    { path: '/profile', label: 'Profile', icon: <PersonIcon /> },
    { path: '/organization', label: 'Organization Profile', icon: <BusinessIcon /> },
    { 
      path: '/notifications', 
      label: 'Notifications', 
      icon: (
        <StyledBadge badgeContent={unreadCount} color="error" invisible={unreadCount === 0}>
          <NotificationsIcon />
        </StyledBadge>
      ) 
    },
    { path: '/payment', label: 'Payment', icon: <PaymentIcon /> },
   
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

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleNavigation = (path) => {
    navigate(path);
    if (isMobile) {
      setMobileOpen(false);
    }
  };

  const sidebarContent = (
    <>
      {isMobile ? (
        <MobileSidebarHeader>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <img 
              src="/static/logo.png" 
              alt="KACCIMA Logo" 
              style={{ width: 40, height: 40 }} 
            />
            <Typography variant="h6" sx={{ fontWeight: 700, fontFamily: '"Poppins", sans-serif' }}>
              KACCIMA
            </Typography>
          </Box>
          <IconButton onClick={handleDrawerToggle} sx={{ color: 'white' }}>
            <CloseIcon />
          </IconButton>
        </MobileSidebarHeader>
      ) : (
        <SidebarHeader>
          <img 
            src="/static/logo.png" 
            alt="KACCIMA Logo" 
            style={{ width: 60, height: 60, marginBottom: 12 }} 
          />
          <Typography variant="h6" sx={{ fontWeight: 700, fontFamily: '"Poppins", sans-serif' }}>
            KACCIMA
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.9, fontFamily: '"Inter", sans-serif' }}>
            Kano Chamber of Commerce
          </Typography>
        </SidebarHeader>
      )}

      <List sx={{ p: 2 }}>
        {menuItems.map((item) => (
          <StyledListItem
            key={item.path}
            active={location.pathname === item.path ? 1 : 0}
            onClick={() => handleNavigation(item.path)}
          >
            <ListItemIcon>{item.icon}</ListItemIcon>
            <ListItemText 
              primary={item.label}
              primaryTypographyProps={{
                fontFamily: '"Inter", sans-serif'
              }}
            />
          </StyledListItem>
        ))}

        <Divider sx={{ my: 2 }} />

        <StyledListItem onClick={handleLogout}>
          <ListItemIcon>
            <LogoutIcon />
          </ListItemIcon>
          <ListItemText 
            primary="Logout"
            primaryTypographyProps={{
              fontFamily: '"Inter", sans-serif'
            }}
          />
        </StyledListItem>
      </List>
    </>
  );

  return (
    <>
      {/* Mobile Menu Button */}
      <MenuButton onClick={handleDrawerToggle} size="large">
        <MenuIcon />
      </MenuButton>

      {/* Desktop Sidebar */}
      <StyledSidebar elevation={0}>
        {sidebarContent}
      </StyledSidebar>

      {/* Mobile Drawer */}
      <Drawer
        variant="temporary"
        anchor="left"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{
          keepMounted: true
        }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': {
            width: 280,
            boxSizing: 'border-box',
            borderRadius: '0 16px 16px 0',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.2)'
          }
        }}
      >
        {sidebarContent}
      </Drawer>
    </>
  );
};

export default Sidebar;