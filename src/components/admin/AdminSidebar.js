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
  Verified as VerifiedIcon,
  Settings as SettingsIcon,
  Logout as LogoutIcon,
  Menu as MenuIcon,
  Close as CloseIcon,
  AdminPanelSettings as AdminIcon,
  Assessment as AssessmentIcon,
  Notifications as NotificationsIcon
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
  top: 80,
  left: 16,
  zIndex: 1100,
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
        documents: 0 // You can add document count logic here
      });
    } catch (error) {
      console.error('Error fetching counts:', error);
    }
  };

  const getMenuItems = () => {
    const baseItems = [
      { 
        path: '/admin/dashboard', 
        label: 'Dashboard', 
        icon: <DashboardIcon />,
        badge: null
      },
      { 
        path: '/admin/organizations', 
        label: 'Organizations', 
        icon: <PeopleIcon />,
        badge: pendingCounts.organizations
      },
      { 
        path: '/admin/organizations/pending', 
        label: 'Pending Review', 
        icon: <HourglassIcon />,
        badge: pendingCounts.organizations
      },
      { 
        path: '/admin/organizations/approved', 
        label: 'Approved', 
        icon: <CheckCircleIcon />,
        badge: null
      },
      { 
        path: '/admin/payments', 
        label: 'Payments', 
        icon: <PaymentIcon />,
        badge: pendingCounts.payments
      },
      { 
        path: '/admin/documents', 
        label: 'Documents', 
        icon: <DescriptionIcon />,
        badge: pendingCounts.documents
      }
    ];

    // Add approver-specific items
    if (adminData?.admin_type === 'approver') {
      baseItems.push(
        { 
          path: '/admin/final-approvals', 
          label: 'Final Approvals', 
          icon: <VerifiedIcon />,
          badge: null
        }
      );
    }

    // Add common items
    baseItems.push(
      { 
        path: '/admin/reports', 
        label: 'Reports', 
        icon: <AssessmentIcon />,
        badge: null
      },
      { 
        path: '/admin/notifications', 
        label: 'Notifications', 
        icon: <NotificationsIcon />,
        badge: null
      },
      { 
        path: '/admin/settings', 
        label: 'Settings', 
        icon: <SettingsIcon />,
        badge: null
      }
    );

    return baseItems;
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
            active={location.pathname === item.path ? 1 : 0}
            onClick={() => handleNavigation(item.path)}
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