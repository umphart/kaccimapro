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
  Business as BusinessIcon,
  Payment as PaymentIcon,
  Notifications as NotificationsIcon,
  Settings as SettingsIcon,
  Logout as LogoutIcon,
  Menu as MenuIcon,
  AdminPanelSettings as AdminIcon,
  Assessment as AssessmentIcon,
  Description as DescriptionIcon,
  AddCircle as AddCircleIcon  // <-- ADD THIS
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { supabase } from '../../supabaseClient';

const drawerWidth = 260;

const StyledSidebar = styled(Paper)(({ theme }) => ({
  width: drawerWidth,
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

const SidebarHeader = styled(Box)(({ admintype }) => ({
  padding: '24px 20px',
  background: admintype === 'approver' 
    ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    : 'linear-gradient(135deg, #15e420 0%, #0fa819 100%)',
  color: 'white',
  textAlign: 'center'
}));

const StyledListItem = styled(ListItem)(({ active }) => ({
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
  },
  '& .MuiListItemText-primary': {
    fontWeight: active ? 600 : 400,
    fontSize: '0.9rem'
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

const AdminSidebar = ({ onLogout }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [adminData, setAdminData] = useState(null);
  const [pendingCounts, setPendingCounts] = useState({
    organizations: 0,
    payments: 0
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
        payments: paymentCount || 0
      });
    } catch (error) {
      console.error('Error fetching counts:', error);
    }
  };

  // Check if a route is active
  const isActive = (path) => {
    const currentPath = location.pathname;
    
    // Exact match for dashboard
    if (path === '/admin/dashboard') {
      return currentPath === '/admin/dashboard';
    }
    
    // For organizations - match any organizations path
    if (path === '/admin/organizations') {
      return currentPath === '/admin/organizations' || 
             currentPath.startsWith('/admin/organizations/filter/') ||
             currentPath.startsWith('/admin/organizations/');
    }
    
    // For pending organizations
    if (path === '/admin/organizations/filter/pending') {
      return currentPath === '/admin/organizations/filter/pending';
    }
    
    // For payments
    if (path === '/admin/payments') {
      return currentPath === '/admin/payments' || 
             currentPath.startsWith('/admin/payments/');
    }
    
    // For documents
    if (path === '/admin/documents') {
      return currentPath === '/admin/documents' || 
             currentPath.startsWith('/admin/documents/');
    }
    
    // For manage organizations
    if (path === '/admin/manage-organizations') {
      return currentPath === '/admin/manage-organizations';
    }
    
    // For notifications
    if (path === '/admin/notifications') {
      return currentPath === '/admin/notifications';
    }
    
    // For reports
    if (path === '/admin/reports') {
      return currentPath === '/admin/reports';
    }
    
    // For settings
    if (path === '/admin/settings') {
      return currentPath === '/admin/settings';
    }
    
    // Default exact match
    return currentPath === path;
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
      sessionStorage.removeItem('adminData');
      sessionStorage.removeItem('adminRole');
      sessionStorage.removeItem('adminPermissions');
      navigate('/admin/login');
      if (onLogout) onLogout();
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const sidebarContent = (
    <>
      <SidebarHeader admintype={adminData?.admin_type}>
        <Avatar
          sx={{
            width: 70,
            height: 70,
            margin: '0 auto 12px',
            border: '3px solid white',
            bgcolor: 'rgba(255,255,255,0.2)'
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
        {/* Dashboard */}
        <StyledListItem
          active={isActive('/admin/dashboard') ? 1 : 0}
          onClick={() => handleNavigation(() => navigate('/admin/dashboard'))}
        >
          <ListItemIcon>
            <DashboardIcon />
          </ListItemIcon>
          <ListItemText 
            primary="Dashboard"
            primaryTypographyProps={{
              fontFamily: '"Inter", sans-serif'
            }}
          />
        </StyledListItem>

        {/* Organizations */}
        <StyledListItem
          active={isActive('/admin/organizations') ? 1 : 0}
          onClick={() => handleNavigation(() => navigate('/admin/organizations'))}
        >
          <ListItemIcon>
            <BusinessIcon />
          </ListItemIcon>
          <ListItemText 
            primary="Organizations"
            primaryTypographyProps={{
              fontFamily: '"Inter", sans-serif'
            }}
          />
        </StyledListItem>

        {/* Pending Review */}
        <StyledListItem
          active={isActive('/admin/organizations/filter/pending') ? 1 : 0}
          onClick={() => handleNavigation(() => navigate('/admin/organizations/filter/pending'))}
        >
          <ListItemIcon>
            <Badge 
              badgeContent={pendingCounts.organizations} 
              color="error"
              sx={{
                '& .MuiBadge-badge': {
                  fontSize: '10px',
                  height: '18px',
                  minWidth: '18px',
                  padding: '0 4px'
                }
              }}
            >
              <PeopleIcon />
            </Badge>
          </ListItemIcon>
          <ListItemText 
            primary="Pending Review"
            primaryTypographyProps={{
              fontFamily: '"Inter", sans-serif'
            }}
          />
          {pendingCounts.organizations > 0 && (
            <Chip
              label={pendingCounts.organizations}
              size="small"
              color="error"
              sx={{ 
                height: '20px', 
                fontSize: '10px',
                '& .MuiChip-label': { px: 1 }
              }}
            />
          )}
        </StyledListItem>

        <Divider sx={{ my: 1 }} />

        {/* Manage Organizations - Super Admin only */}
        {adminData?.admin_type === 'super_admin' && (
          <StyledListItem
            active={isActive('/admin/manage-organizations') ? 1 : 0}
            onClick={() => handleNavigation(() => navigate('/admin/manage-organizations'))}
          >
            <ListItemIcon>
              <AddCircleIcon />
            </ListItemIcon>
            <ListItemText 
              primary="Manage Orgs"
              primaryTypographyProps={{
                fontFamily: '"Inter", sans-serif'
              }}
            />
          </StyledListItem>
        )}

        {/* Payments */}
        <StyledListItem
          active={isActive('/admin/payments') ? 1 : 0}
          onClick={() => handleNavigation(() => navigate('/admin/payments'))}
        >
          <ListItemIcon>
            <Badge 
              badgeContent={pendingCounts.payments} 
              color="error"
              sx={{
                '& .MuiBadge-badge': {
                  fontSize: '10px',
                  height: '18px',
                  minWidth: '18px',
                  padding: '0 4px'
                }
              }}
            >
              <PaymentIcon />
            </Badge>
          </ListItemIcon>
          <ListItemText 
            primary="Payments"
            primaryTypographyProps={{
              fontFamily: '"Inter", sans-serif'
            }}
          />
          {pendingCounts.payments > 0 && (
            <Chip
              label={pendingCounts.payments}
              size="small"
              color="error"
              sx={{ 
                height: '20px', 
                fontSize: '10px',
                '& .MuiChip-label': { px: 1 }
              }}
            />
          )}
        </StyledListItem>

        {/* Documents */}
        <StyledListItem
          active={isActive('/admin/documents') ? 1 : 0}
          onClick={() => handleNavigation(() => navigate('/admin/documents'))}
        >
          <ListItemIcon>
            <DescriptionIcon />
          </ListItemIcon>
          <ListItemText 
            primary="Documents"
            primaryTypographyProps={{
              fontFamily: '"Inter", sans-serif'
            }}
          />
        </StyledListItem>

        {/* Reports */}
        <StyledListItem
          active={isActive('/admin/reports') ? 1 : 0}
          onClick={() => handleNavigation(() => navigate('/admin/reports'))}
        >
          <ListItemIcon>
            <AssessmentIcon />
          </ListItemIcon>
          <ListItemText 
            primary="Reports"
            primaryTypographyProps={{
              fontFamily: '"Inter", sans-serif'
            }}
          />
        </StyledListItem>

        {/* Notifications */}
        <StyledListItem
          active={isActive('/admin/notifications') ? 1 : 0}
          onClick={() => handleNavigation(() => navigate('/admin/notifications'))}
        >
          <ListItemIcon>
            <NotificationsIcon />
          </ListItemIcon>
          <ListItemText 
            primary="Notifications"
            primaryTypographyProps={{
              fontFamily: '"Inter", sans-serif'
            }}
          />
        </StyledListItem>

        {/* Settings */}
        <StyledListItem
          active={isActive('/admin/settings') ? 1 : 0}
          onClick={() => handleNavigation(() => navigate('/admin/settings'))}
        >
          <ListItemIcon>
            <SettingsIcon />
          </ListItemIcon>
          <ListItemText 
            primary="Settings"
            primaryTypographyProps={{
              fontFamily: '"Inter", sans-serif'
            }}
          />
        </StyledListItem>

        <Divider sx={{ my: 2 }} />

        {/* Logout */}
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
      </List>

      <Box sx={{ p: 2, textAlign: 'center', borderTop: '1px solid #eaeef2' }}>
        <Typography variant="caption" sx={{ color: '#999', fontSize: '10px' }}>
          KACCIMA Admin Panel v1.0
        </Typography>
      </Box>
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
            width: drawerWidth,
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