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
  Avatar,
  Badge,
  Chip
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  Description as DescriptionIcon,
  Payment as PaymentIcon,
  CheckCircle as CheckCircleIcon,
  Pending as PendingIcon,
  HourglassEmpty as HourglassIcon,
  Settings as SettingsIcon,
  Logout as LogoutIcon,
  Menu as MenuIcon,
  AdminPanelSettings as AdminIcon,
  Assessment as AssessmentIcon,
  Notifications as NotificationsIcon,
  Business as BusinessIcon
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { supabase } from '../../supabaseClient';

const StyledSidebar = styled(Paper)(({ theme }) => ({
  width: 300,
  borderRadius: '16px',
  boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)',
  overflow: 'hidden',
  position: 'sticky',
  top: 20,
  height: 'fit-content',
  fontFamily: '"Poppins", sans-serif',
  [theme.breakpoints.down('md')]: {
    display: 'none'
  }
}));

const SidebarHeader = styled(Box)(({ theme, admintype }) => ({
  padding: '24px 20px',
  background: admintype === 'approver' 
    ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    : 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  color: 'white',
  textAlign: 'center'
}));

const StyledListItem = styled(ListItem)(({ active, theme }) => ({
  padding: '12px 20px',
  margin: '4px 8px',
  borderRadius: '8px',
  cursor: 'pointer',
  backgroundColor: active ? 'rgba(21, 228, 32, 0.1)' : 'transparent',
  color: active ? '#15e420' : '#333',
  transition: 'all 0.3s ease',
  fontFamily: '"Inter", sans-serif',
  '&:hover': {
    backgroundColor: active ? 'rgba(21, 228, 32, 0.15)' : '#f5f5f5',
    transform: 'translateX(4px)'
  },
  '& .MuiListItemIcon-root': {
    color: active ? '#15e420' : '#666',
    minWidth: 40
  }
}));

const MenuButton = styled(IconButton)(({ theme }) => ({
  position: 'fixed',
  top: 16, // Changed from 80 to 16
  left: 16,
  zIndex: 1200, // Increased z-index
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

const AdminSidebar = ({ onLogout }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [adminData, setAdminData] = useState(null);
  const [pendingCounts, setPendingCounts] = useState({
    organizations: 0,
    payments: 0,
    documents: 0
  });

  useEffect(() => {
    fetchAdminData();
    fetchPendingCounts();
  }, []);

  const fetchAdminData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from('admin_users')
          .select('*')
          .eq('user_id', user.id)
          .single();
        setAdminData(data);
      }
    } catch (error) {
      console.error('Error fetching admin data:', error);
    }
  };

  const fetchPendingCounts = async () => {
    try {
      // Count pending organizations
      const { count: orgCount } = await supabase
        .from('organizations')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');

      // Count pending payments
      const { count: paymentCount } = await supabase
        .from('payments')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');

      setPendingCounts({
        organizations: orgCount || 0,
        payments: paymentCount || 0,
        documents: 0
      });
    } catch (error) {
      console.error('Error fetching counts:', error);
    }
  };

  const isActive = (path) => {
    if (path === '/admin/organizations') {
      return location.pathname === '/admin/organizations' || 
             location.pathname.startsWith('/admin/organizations/filter/');
    }
    return location.pathname === path;
  };

  const getMenuItems = () => {
    const isApprover = adminData?.admin_type === 'approver';
    
    // Base items for all admins
    const items = [
      { 
        path: '/admin/dashboard', 
        label: 'Dashboard', 
        icon: <DashboardIcon />,
        badge: null,
        onClick: () => navigate('/admin/dashboard')
      },
      { 
        path: '/admin/organizations', 
        label: 'All Organizations', 
        icon: <PeopleIcon />,
        badge: null,
        onClick: () => navigate('/admin/organizations')
      },
      { 
        path: '/admin/organizations/filter/pending', 
        label: 'Pending Review', 
        icon: <HourglassIcon />,
        badge: pendingCounts.organizations,
        onClick: () => navigate('/admin/organizations/filter/pending')
      },
      { 
        path: '/admin/organizations/filter/approved', 
        label: 'Approved', 
        icon: <CheckCircleIcon />,
        badge: null,
        onClick: () => navigate('/admin/organizations/filter/approved')
      }
    ];

    // Payments - only show to approvers
    if (isApprover) {
      items.push(
        { 
          path: '/admin/payments', 
          label: 'Payments', 
          icon: <PaymentIcon />,
          badge: pendingCounts.payments,
          onClick: () => navigate('/admin/payments')
        }
      );
    }

    // Documents - show to all admins
    items.push(
      { 
        path: '/admin/documents', 
        label: 'Documents', 
        icon: <DescriptionIcon />,
        badge: pendingCounts.documents,
        onClick: () => navigate('/admin/documents')
      }
    );

    // Add common items for all admins
    items.push(
      { 
        path: '/admin/reports', 
        label: 'Reports', 
        icon: <AssessmentIcon />,
        badge: null,
        onClick: () => navigate('/admin/reports')
      },
      { 
        path: '/admin/notifications', 
        label: 'Notifications', 
        icon: <NotificationsIcon />,
        badge: null,
        onClick: () => navigate('/admin/notifications')
      },
      { 
        path: '/admin/settings', 
        label: 'Settings', 
        icon: <SettingsIcon />,
        badge: null,
        onClick: () => navigate('/admin/settings')
      }
    );

    return items;
  };

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleNavigation = (onClick) => {
    onClick();
    if (isMobile) {
      setMobileOpen(false);
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      navigate('/admin/login');
      if (onLogout) onLogout();
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const menuItems = getMenuItems();

  const sidebarContent = (
    <>
      <SidebarHeader admintype={adminData?.admin_type}>
        <Avatar
          sx={{
            width: 70,
            height: 70,
            margin: '0 auto 12px',
            border: '3px solid white'
          }}
        >
          <AdminIcon sx={{ fontSize: 40 }} />
        </Avatar>
        <Typography variant="h6" sx={{ fontWeight: 700, fontFamily: '"Poppins", sans-serif' }}>
          {adminData?.full_name || 'Admin'}
        </Typography>
        <Chip
          label={adminData?.admin_type === 'approver' ? 'Approver' : 'Reviewer'}
          size="small"
          sx={{
            mt: 1,
            backgroundColor: 'rgba(255,255,255,0.2)',
            color: 'white',
            fontWeight: 600,
            textTransform: 'uppercase',
            fontSize: '10px'
          }}
        />
      </SidebarHeader>

      <List sx={{ p: 2 }}>
        {menuItems.map((item) => (
          <StyledListItem
            key={item.path}
            active={isActive(item.path) ? 1 : 0}
            onClick={() => handleNavigation(item.onClick)}
          >
            <ListItemIcon>
              {item.badge ? (
                <Badge badgeContent={item.badge} color="error">
                  {item.icon}
                </Badge>
              ) : (
                item.icon
              )}
            </ListItemIcon>
            <ListItemText 
              primary={item.label}
              primaryTypographyProps={{
                fontFamily: '"Inter", sans-serif',
                fontSize: '14px'
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
      <MenuButton onClick={handleDrawerToggle} size="large">
        <MenuIcon />
      </MenuButton>

      <StyledSidebar elevation={0}>
        {sidebarContent}
      </StyledSidebar>

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
            width: 300,
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

export default AdminSidebar;