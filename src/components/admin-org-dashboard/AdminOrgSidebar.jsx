// components/admin-org-dashboard/AdminOrgSidebar.jsx
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
  Chip,
  Avatar,
  Tooltip
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Business as BusinessIcon,
  Notifications as NotificationsIcon,
  Payment as PaymentIcon,
  Description as DescriptionIcon,
  Settings as SettingsIcon,
  Logout as LogoutIcon,
  Menu as MenuIcon,
  Close as CloseIcon,
  Verified as VerifiedIcon,
  Pending as PendingIcon,
  Error as ErrorIcon,
  CalendarToday as CalendarIcon,
  Assignment as AssignmentIcon,
  Receipt as ReceiptIcon,
  AccountBalance as AccountBalanceIcon,
  Help as HelpIcon,
  People as PeopleIcon
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { supabase } from '../../supabaseClient';

// Styled Components specific to Admin Org Sidebar
const StyledSidebar = styled(Paper)(({ theme }) => ({
  width: 280,
  borderRadius: '16px',
  boxShadow: '0 10px 40px rgba(21, 228, 32, 0.1)',
  overflow: 'hidden',
  position: 'sticky',
  top: 10,
  height: 'fit-content',
  border: '1px solid rgba(21, 228, 32, 0.1)',
  fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, sans-serif',
  [theme.breakpoints.down('md')]: {
    display: 'none'
  }
}));

const SidebarHeader = styled(Box)(({ theme }) => ({
  padding: '24px 20px',
  background: 'linear-gradient(135deg, #15e420 0%, #0fa819 100%)',
  color: 'white',
  textAlign: 'center',
  position: 'relative',
  overflow: 'hidden',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: '-20px',
    right: '-20px',
    width: '100px',
    height: '100px',
    borderRadius: '50%',
    background: 'rgba(255, 255, 255, 0.1)'
  },
  '&::after': {
    content: '""',
    position: 'absolute',
    bottom: '-30px',
    left: '-30px',
    width: '120px',
    height: '120px',
    borderRadius: '50%',
    background: 'rgba(255, 255, 255, 0.05)'
  }
}));

const MobileSidebarHeader = styled(Box)(({ theme }) => ({
  padding: '16px 20px',
  background: 'linear-gradient(135deg, #15e420 0%, #0fa819 100%)',
  color: 'white',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  position: 'relative',
  overflow: 'hidden'
}));

const StyledListItem = styled(ListItem)(({ active, theme }) => ({
  padding: '12px 20px',
  margin: '4px 8px',
  borderRadius: '12px',
  cursor: 'pointer',
  backgroundColor: active ? '#e8f5e9' : 'transparent',
  color: active ? '#15e420' : '#333',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  fontFamily: '"Inter", sans-serif',
  position: 'relative',
  '&:hover': {
    backgroundColor: active ? '#e8f5e9' : '#f5f5f5',
    transform: 'translateX(8px)',
    '& .MuiListItemIcon-root': {
      transform: 'scale(1.1)'
    }
  },
  '& .MuiListItemIcon-root': {
    color: active ? '#15e420' : '#666',
    minWidth: 40,
    transition: 'transform 0.3s ease'
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
  boxShadow: '0 4px 12px rgba(21, 228, 32, 0.3)',
  '&:hover': {
    backgroundColor: '#12c21e',
    transform: 'scale(1.1) rotate(90deg)'
  },
  transition: 'all 0.3s ease',
  display: 'none',
  [theme.breakpoints.down('md')]: {
    display: 'flex'
  }
}));

const StyledBadge = styled(Badge)(({ theme }) => ({
  '& .MuiBadge-badge': {
    backgroundColor: '#dc3545',
    color: 'white',
    fontSize: '10px',
    minWidth: '18px',
    height: '18px',
    borderRadius: '9px',
    fontWeight: 600
  }
}));

const StatusBadge = styled(Chip)(({ status }) => ({
  backgroundColor: status === 'approved' || status === 'active' ? '#d4edda' :
                  status === 'pending' ? '#fff3e0' :
                  status === 'rejected' ? '#ffebee' : '#f0f0f0',
  color: status === 'approved' || status === 'active' ? '#28a745' :
         status === 'pending' ? '#ff9800' :
         status === 'rejected' ? '#dc3545' : '#666',
  fontWeight: 600,
  fontSize: '0.7rem',
  height: '24px',
  '& .MuiChip-icon': {
    fontSize: '16px',
    marginLeft: '4px'
  }
}));

const OrganizationInfo = styled(Box)(({ theme }) => ({
  padding: '12px 16px',
  margin: '8px',
  borderRadius: '12px',
  background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
  border: '1px solid #dee2e6'
}));

const AdminOrgSidebar = ({ onLogout, organization, membershipStatus }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  useEffect(() => {
    if (organization?.id) {
      fetchUnreadCount();
      setupRealtimeSubscription();
    }
  }, [organization?.id]);

  const setupRealtimeSubscription = () => {
    if (!organization?.id) return;

    const subscription = supabase
      .channel('admin_sidebar_notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'organization_notifications',
          filter: `organization_id=eq.${organization.id}`
        },
        () => {
          setUnreadNotifications(prev => prev + 1);
        }
      )
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
    };
  };

  const fetchUnreadCount = async () => {
    if (!organization?.id) return;

    try {
      const { count, error } = await supabase
        .from('organization_notifications')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', organization.id)
        .eq('read', false);

      if (!error) {
        setUnreadNotifications(count || 0);
      }
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case 'approved':
      case 'active':
        return <VerifiedIcon />;
      case 'pending':
        return <PendingIcon />;
      case 'rejected':
        return <ErrorIcon />;
      default:
        return <PendingIcon />;
    }
  };

  const menuItems = [
    {
      path: '/admin-org-dashboard',
      label: 'Dashboard',
      icon: <DashboardIcon />,
      active: location.pathname === '/admin-org-dashboard'
    },
    {
      path: '/organization',
      label: 'Organization Profile',
      icon: <BusinessIcon />,
      active: location.pathname === '/organization'
    },
    {
      path: '/referees',
      label: 'Referees',
      icon: <PeopleIcon />,
      active: location.pathname === '/referees'
    },
    {
      path: '/admin-org-payment',
      label: 'Payments',
      icon: <PaymentIcon />,
      active: location.pathname === '/admin-org-payment'
    },
    {
      path: '/documents',
      label: 'Documents',
      icon: <DescriptionIcon />,
      active: location.pathname === '/documents'
    },
    {
      path: '/notifications',
      label: 'Notifications',
      icon: (
        <StyledBadge badgeContent={unreadNotifications} invisible={unreadNotifications === 0}>
          <NotificationsIcon />
        </StyledBadge>
      ),
      active: location.pathname === '/notifications'
    },
    {
      path: '/settings',
      label: 'Settings',
      icon: <SettingsIcon />,
      active: location.pathname === '/settings'
    }
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
            <AccountBalanceIcon sx={{ fontSize: 32 }} />
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
                KACCIMA
              </Typography>
              <Typography variant="caption" sx={{ opacity: 0.9 }}>
                Organization Portal
              </Typography>
            </Box>
          </Box>
          <IconButton onClick={handleDrawerToggle} sx={{ color: 'white' }}>
            <CloseIcon />
          </IconButton>
        </MobileSidebarHeader>
      ) : (
        <SidebarHeader>
          <Avatar
            sx={{
              width: 70,
              height: 70,
              bgcolor: 'rgba(255,255,255,0.2)',
              margin: '0 auto 12px',
              border: '3px solid rgba(255,255,255,0.3)'
            }}
          >
            <BusinessIcon sx={{ fontSize: 36 }} />
          </Avatar>
          <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
            {organization?.company_name || 'Organization'}
          </Typography>
          <Typography variant="caption" sx={{ opacity: 0.9, display: 'block', mt: 0.5 }}>
            KACCIMA Member Portal
          </Typography>
          
          {membershipStatus && (
            <Box sx={{ mt: 1.5, display: 'flex', justifyContent: 'center' }}>
              <StatusBadge
                status={membershipStatus}
                icon={getStatusIcon(membershipStatus)}
                label={
                  membershipStatus === 'approved' ? 'Active Member' :
                  membershipStatus === 'pending' ? 'Pending' :
                  membershipStatus === 'rejected' ? 'Rejected' : 'Inactive'
                }
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
            active={item.active ? 1 : 0}
            onClick={() => handleNavigation(item.path)}
          >
            <ListItemIcon>{item.icon}</ListItemIcon>
            <ListItemText 
              primary={item.label}
              primaryTypographyProps={{
                fontFamily: '"Inter", sans-serif',
                fontSize: '14px'
              }}
            />
            {item.active && (
              <Box
                sx={{
                  width: 4,
                  height: 24,
                  borderRadius: 2,
                  bgcolor: '#15e420',
                  position: 'absolute',
                  right: 8
                }}
              />
            )}
          </StyledListItem>
        ))}
      </List>

      <Divider sx={{ mx: 2 }} />

      {/* Organization Quick Info */}
      {organization && (
        <OrganizationInfo>
          <Typography variant="caption" sx={{ color: '#666', fontWeight: 600, display: 'block', mb: 1 }}>
            Organization Info
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
            <BusinessIcon sx={{ fontSize: 16, color: '#15e420' }} />
            <Typography variant="caption" sx={{ color: '#333', fontWeight: 500 }}>
              {organization.registration_number || 'No Reg. Number'}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CalendarIcon sx={{ fontSize: 16, color: '#666' }} />
            <Typography variant="caption" sx={{ color: '#666' }}>
              {organization.created_at ? new Date(organization.created_at).toLocaleDateString() : 'N/A'}
            </Typography>
          </Box>
        </OrganizationInfo>
      )}

      <Box sx={{ p: 2 }}>
        <StyledListItem onClick={handleLogout}>
          <ListItemIcon>
            <LogoutIcon sx={{ color: '#dc3545' }} />
          </ListItemIcon>
          <ListItemText 
            primary="Logout"
            primaryTypographyProps={{
              fontFamily: '"Inter", sans-serif',
              color: '#dc3545',
              fontWeight: 500
            }}
          />
        </StyledListItem>
      </Box>
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

export default AdminOrgSidebar;