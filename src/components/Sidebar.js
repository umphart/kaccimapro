// components/Sidebar.jsx
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
  Badge,
  Chip
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
  Close as CloseIcon,
  AdminPanelSettings as AdminIcon,
  People as PeopleIcon,
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
  top: 16,
  left: 16,
  zIndex: 1200,
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

const OrganizationTypeChip = styled(Chip)(({ theme }) => ({
  backgroundColor: 'rgba(255,255,255,0.2)',
  color: 'white',
  fontSize: '0.65rem',
  height: '20px',
  '& .MuiChip-label': {
    padding: '0 8px'
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
  const [orgType, setOrgType] = useState(null); // 'self' or 'admin'
  const [loading, setLoading] = useState(true);

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
            setUnreadCount(prev => prev + 1);
          }
        )
        .subscribe();

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
      setLoading(true);
      let orgData = null;
      let type = null;

      // Check for admin-created organization first (from organizations_registry)
      // Method 1: Check by organization_id in user metadata
      if (user.user_metadata?.organization_id) {
        const { data, error } = await supabase
          .from('organizations_registry')
          .select('*')
          .eq('id', user.user_metadata.organization_id)
          .maybeSingle();

        if (data) {
          orgData = data;
          type = 'admin';
        }
      }

      // Method 2: Check by email
      if (!orgData && user.email) {
        const { data, error } = await supabase
          .from('organizations_registry')
          .select('*')
          .eq('email', user.email)
          .maybeSingle();

        if (data) {
          orgData = data;
          type = 'admin';
          // Update created_by if not set
          if (!data.created_by) {
            await supabase
              .from('organizations_registry')
              .update({ created_by: user.id })
              .eq('id', data.id);
          }
        }
      }

      // Method 3: Check by created_by
      if (!orgData) {
        const { data, error } = await supabase
          .from('organizations_registry')
          .select('*')
          .eq('created_by', user.id)
          .maybeSingle();

        if (data) {
          orgData = data;
          type = 'admin';
        }
      }

      // If not found in admin orgs, check self-created organizations
      if (!orgData) {
        const { data, error } = await supabase
          .from('organizations')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        if (data) {
          orgData = data;
          type = 'self';
        }
      }

      if (orgData) {
        setOrganization(orgData);
        setOrgType(type);
        await fetchUnreadCount(orgData.id);
      }
    } catch (error) {
      console.error('Error fetching organization:', error);
    } finally {
      setLoading(false);
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

  // Menu items for organization users (both self and admin created)

const menuItems = [
  { path: '/dashboard', label: 'Dashboard', icon: <DashboardIcon /> },
  { path: '/profile', label: 'Profile', icon: <PersonIcon /> },
  { path: '/organization', label: 'Organization Profile', icon: <BusinessIcon /> },
  // Add referees link
  { path: '/referees', label: 'Referees', icon: <PeopleIcon /> },
  { 
    path: '/notifications', 
    label: 'Notifications', 
    icon: (
      <StyledBadge badgeContent={unreadCount} color="error" invisible={unreadCount === 0}>
        <NotificationsIcon />
      </StyledBadge>
    ) 
  },
  // Payment route differs based on organization type
  { 
    path: orgType === 'admin' ? '/admin-org-payment' : '/payment', 
    label: 'Payment', 
    icon: <PaymentIcon /> 
  },
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
          
          {/* Organization Type Badge */}
          {orgType && (
            <Box sx={{ mt: 1 }}>
              <OrganizationTypeChip
                label={orgType === 'admin' ? 'Admin Created' : 'Self Registered'}
                size="small"
              />
            </Box>
          )}
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

        {/* Organization Info */}
        {organization && (
          <Box sx={{ px: 2, py: 1 }}>
            <Typography variant="caption" sx={{ color: '#666', fontFamily: '"Inter", sans-serif' }}>
              {organization.company_name || organization.company_name}
            </Typography>
            <Typography variant="caption" sx={{ color: '#999', display: 'block', fontFamily: '"Inter", sans-serif' }}>
              {organization.registration_number || 'No registration number'}
            </Typography>
          </Box>
        )}

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