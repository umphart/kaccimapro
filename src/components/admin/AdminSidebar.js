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
  AddCircle as AddCircleIcon
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

const NotificationBadge = styled(Badge)(({ theme }) => ({
  '& .MuiBadge-badge': {
    backgroundColor: '#ff1744',
    color: 'white',
    fontSize: '10px',
    height: '18px',
    minWidth: '18px',
    padding: '0 4px',
    fontWeight: 700,
    boxShadow: '0 2px 4px rgba(255, 23, 68, 0.4)',
    animation: 'pulse 2s infinite',
    '@keyframes pulse': {
      '0%': {
        transform: 'scale(1)',
      },
      '50%': {
        transform: 'scale(1.1)',
      },
      '100%': {
        transform: 'scale(1)',
      }
    }
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
    setupRealtimeSubscriptions();
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
      console.log('=== FETCHING PENDING COUNTS ===');
      
      // Count UNREGISTERED organizations (status = 'pending' OR status = 'pending_review')
      const { count: orgCount, error: orgError } = await supabase
        .from('organizations_registry')
        .select('*', { count: 'exact', head: true })
        .in('status', ['pending', 'pending_review']);

      if (orgError) {
        console.error('Error fetching pending organizations:', orgError);
      } else {
        console.log('Pending organizations (unapproved):', orgCount || 0);
      }

      // Count UNPAID payments from payments table (status = 'pending' OR status = 'unpaid')
      const { count: paymentCount1, error: paymentError1 } = await supabase
        .from('payments')
        .select('*', { count: 'exact', head: true })
        .in('status', ['pending', 'unpaid', 'processing']);

      if (paymentError1) {
        console.error('Error fetching pending payments from payments:', paymentError1);
      } else {
        console.log('Pending payments from payments table:', paymentCount1 || 0);
      }

      // Count UNPAID payments from admin_organization_payments table (status = 'pending' OR 'unpaid')
      const { count: paymentCount2, error: paymentError2 } = await supabase
        .from('admin_organization_payments')
        .select('*', { count: 'exact', head: true })
        .in('status', ['pending', 'unpaid']);

      if (paymentError2) {
        console.error('Error fetching pending payments from admin_organization_payments:', paymentError2);
      } else {
        console.log('Pending payments from admin_organization_payments table:', paymentCount2 || 0);
      }

      const totalPendingPayments = (paymentCount1 || 0) + (paymentCount2 || 0);
      
      console.log('=== SUMMARY ===');
      console.log('Total pending organizations (unapproved):', orgCount || 0);
      console.log('Total pending payments (unpaid):', totalPendingPayments);
      console.log('Total pending items:', (orgCount || 0) + totalPendingPayments);

      setPendingCounts({
        organizations: orgCount || 0,
        payments: totalPendingPayments
      });

    } catch (error) {
      console.error('Error fetching pending counts:', error);
    }
  };

  const setupRealtimeSubscriptions = () => {
    // Subscribe to organization changes
    const orgSubscription = supabase
      .channel('admin-org-pending-channel')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'organizations_registry'
        },
        () => {
          console.log('Organization change detected, refreshing counts...');
          fetchPendingCounts();
        }
      )
      .subscribe();

    // Subscribe to payments changes
    const paymentSubscription1 = supabase
      .channel('admin-payment-pending-channel-1')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'payments'
        },
        () => {
          console.log('Payment change detected (payments), refreshing counts...');
          fetchPendingCounts();
        }
      )
      .subscribe();

    const paymentSubscription2 = supabase
      .channel('admin-payment-pending-channel-2')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'admin_organization_payments'
        },
        () => {
          console.log('Payment change detected (admin_organization_payments), refreshing counts...');
          fetchPendingCounts();
        }
      )
      .subscribe();

    return () => {
      orgSubscription.unsubscribe();
      paymentSubscription1.unsubscribe();
      paymentSubscription2.unsubscribe();
    };
  };

  // Check if a route is active
  const isActive = (path) => {
    const currentPath = location.pathname;
    
    if (path === '/admin/dashboard') {
      return currentPath === '/admin/dashboard';
    }
    
    if (path === '/admin/organizations') {
      return currentPath === '/admin/organizations' || 
             currentPath.startsWith('/admin/organizations/filter/') ||
             currentPath.startsWith('/admin/organizations/');
    }
    
    if (path === '/admin/organizations/filter/pending') {
      return currentPath === '/admin/organizations/filter/pending';
    }
    
    if (path === '/admin/payments') {
      return currentPath === '/admin/payments' || 
             currentPath.startsWith('/admin/payments/');
    }
    
    if (path === '/admin/documents') {
      return currentPath === '/admin/documents' || 
             currentPath.startsWith('/admin/documents/');
    }
    
    if (path === '/admin/manage-organizations') {
      return currentPath === '/admin/manage-organizations';
    }
    
    if (path === '/admin/notifications') {
      return currentPath === '/admin/notifications';
    }
    
    if (path === '/admin/reports') {
      return currentPath === '/admin/reports';
    }
    
    if (path === '/admin/settings') {
      return currentPath === '/admin/settings';
    }
    
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

  const totalPending = pendingCounts.organizations + pendingCounts.payments;

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

        {/* Pending Review - Only shows unapproved organizations */}
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

        {/* Payments - Only shows unpaid payments */}
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

        {/* Notifications - Only shows when there are pending items */}
        <StyledListItem
          active={isActive('/admin/notifications') ? 1 : 0}
          onClick={() => {
            handleNavigation(() => navigate('/admin/notifications'));
          }}
        >
          <ListItemIcon>
            <NotificationBadge 
              badgeContent={totalPending > 0 ? totalPending : null}
              color="error"
              invisible={totalPending === 0}
            >
              <NotificationsIcon />
            </NotificationBadge>
          </ListItemIcon>
          <ListItemText 
            primary="Notifications"
            primaryTypographyProps={{
              fontFamily: '"Inter", sans-serif'
            }}
          />
          {totalPending > 0 && (
            <Chip
              label={totalPending}
              size="small"
              color="error"
              sx={{ 
                height: '20px', 
                fontSize: '10px',
                fontWeight: 700,
                '& .MuiChip-label': { px: 1 },
                animation: 'pulse 2s infinite'
              }}
            />
          )}
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