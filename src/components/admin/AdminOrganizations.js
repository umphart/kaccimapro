import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Alert,
  Snackbar,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Chip // Add Chip import
} from '@mui/material';
import {
  Description as DescriptionIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Warning as WarningIcon,
  Pending as PendingIcon
} from '@mui/icons-material'; // Import icons from correct package
import { supabase } from '../../supabaseClient';
import AdminSidebar from './AdminSidebar';
import OrganizationStats from './OrganizationStats';
import OrganizationFilters from './OrganizationFilters';
import OrganizationTable from './OrganizationTable';
import { documentFields } from './organizationConstants'; // Fix import path

const AdminOrganizations = () => {
  const navigate = useNavigate();
  const { filter } = useParams();
  const [loading, setLoading] = useState(true);
  const [organizations, setOrganizations] = useState([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [alert, setAlert] = useState({ open: false, type: 'success', message: '' });
  const [approveDialog, setApproveDialog] = useState({ open: false, org: null, documentStatus: {} });
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0
  });

  // Update statusFilter based on URL filter param
  useEffect(() => {
    if (filter === 'pending') {
      setStatusFilter('pending');
    } else if (filter === 'approved') {
      setStatusFilter('approved');
    } else if (filter === 'rejected') {
      setStatusFilter('rejected');
    } else {
      setStatusFilter('all');
    }
    setPage(0);
  }, [filter]);

  // Fetch data when dependencies change
  useEffect(() => {
    fetchOrganizations();
    fetchStats();
  }, [page, rowsPerPage, searchTerm, statusFilter]);

  const showAlert = (type, message) => {
    setAlert({ open: true, type, message });
  };

  const handleCloseAlert = () => {
    setAlert({ ...alert, open: false });
  };

  const fetchOrganizations = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('organizations')
        .select('*, payments(*)', { count: 'exact' });

      // Apply status filter from state
      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      // Apply search
      if (searchTerm) {
        query = query.or(`company_name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,cac_number.ilike.%${searchTerm}%`);
      }

      // Apply pagination
      const from = page * rowsPerPage;
      const to = from + rowsPerPage - 1;

      const { data, error, count } = await query
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) throw error;

      // Only fetch document status for pending organizations
      let orgsWithDocStatus = data || [];
      
      if (statusFilter === 'pending') {
        orgsWithDocStatus = await Promise.all(
          (data || []).map(async (org) => {
            const docStatus = await checkDocumentStatus(org.id);
            return { ...org, documentStatus: docStatus };
          })
        );
      }

      setOrganizations(orgsWithDocStatus || []);
      setTotalCount(count || 0);
    } catch (error) {
      console.error('Error fetching organizations:', error);
      showAlert('error', 'Failed to load organizations');
    } finally {
      setLoading(false);
    }
  };

  const checkDocumentStatus = async (organizationId) => {
    try {
      const { data: org, error } = await supabase
        .from('organizations')
        .select(documentFields.map(f => f.key).join(','))
        .eq('id', organizationId)
        .single();

      if (error) throw error;

      const { data: notifications } = await supabase
        .from('organization_notifications')
        .select('*')
        .eq('organization_id', organizationId)
        .in('type', ['document_rejected', 'document_approved'])
        .order('created_at', { ascending: false });

      const documentStatus = {};

      documentFields.forEach(field => {
        const hasDocument = !!org[field.key];
        const rejectedNotification = notifications?.find(n => 
          n.type === 'document_rejected' && n.title?.includes(field.name)
        );
        const approvedNotification = notifications?.find(n => 
          n.type === 'document_approved' && n.title?.includes(field.name)
        );

        if (!hasDocument) {
          documentStatus[field.key] = 'missing';
        } else if (rejectedNotification && (!approvedNotification || new Date(rejectedNotification.created_at) > new Date(approvedNotification.created_at))) {
          documentStatus[field.key] = 'rejected';
        } else if (approvedNotification) {
          documentStatus[field.key] = 'approved';
        } else {
          documentStatus[field.key] = 'pending';
        }
      });

      return documentStatus;
    } catch (error) {
      console.error('Error checking document status:', error);
      return {};
    }
  };

  const fetchStats = async () => {
    try {
      const { count: total } = await supabase
        .from('organizations')
        .select('*', { count: 'exact', head: true });

      const { count: pending } = await supabase
        .from('organizations')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');

      const { count: approved } = await supabase
        .from('organizations')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'approved');

      const { count: rejected } = await supabase
        .from('organizations')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'rejected');

      setStats({
        total: total || 0,
        pending: pending || 0,
        approved: approved || 0,
        rejected: rejected || 0
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleSearch = (event) => {
    setSearchTerm(event.target.value);
    setPage(0);
  };

  const handleStatusFilter = (event) => {
    const newFilter = event.target.value;
    setStatusFilter(newFilter);
    setPage(0);
    
    if (newFilter === 'all') {
      navigate('/admin/organizations');
    } else {
      navigate(`/admin/organizations/filter/${newFilter}`);
    }
  };

  const handleViewOrganization = (id) => {
    navigate(`/admin/organizations/${id}`);
  };

  const checkAllDocumentsApproved = (documentStatus) => {
    if (!documentStatus) return false;
    return documentFields.every(field => 
      documentStatus[field.key] === 'approved'
    );
  };

  const handleApproveClick = (org) => {
    const allApproved = checkAllDocumentsApproved(org.documentStatus);
    
    if (!allApproved) {
      setApproveDialog({ open: true, org, documentStatus: org.documentStatus });
    } else {
      confirmApproveOrganization(org);
    }
  };

  const confirmApproveOrganization = async (org) => {
    try {
      const { error } = await supabase
        .from('organizations')
        .update({ status: 'approved', updated_at: new Date().toISOString() })
        .eq('id', org.id);

      if (error) throw error;

      await supabase
        .from('organization_notifications')
        .insert([{
          organization_id: org.id,
          type: 'success',
          title: 'Organization Approved',
          message: 'Your organization has been fully approved! You can now access all features.',
          category: 'registration',
          action_url: '/dashboard',
          read: false
        }]);

      showAlert('success', `${org.company_name} has been approved successfully`);
      fetchOrganizations();
      fetchStats();
    } catch (error) {
      console.error('Error approving organization:', error);
      showAlert('error', 'Failed to approve organization');
    }
  };

  const handleRejectOrganization = async (org) => {
    try {
      const { error } = await supabase
        .from('organizations')
        .update({ status: 'rejected', updated_at: new Date().toISOString() })
        .eq('id', org.id);

      if (error) throw error;

      await supabase
        .from('organization_notifications')
        .insert([{
          organization_id: org.id,
          type: 'error',
          title: 'Organization Rejected',
          message: 'Your organization registration has been rejected. Please contact support for more information.',
          category: 'registration',
          action_url: '/contact',
          read: false
        }]);

      showAlert('success', `${org.company_name} has been rejected`);
      fetchOrganizations();
      fetchStats();
      setApproveDialog({ open: false, org: null, documentStatus: {} });
    } catch (error) {
      console.error('Error rejecting organization:', error);
      showAlert('error', 'Failed to reject organization');
    }
  };

  const getDocumentStatusSummary = (documentStatus) => {
    if (!documentStatus) return { approved: 0, pending: 0, rejected: 0, missing: 0 };
    
    const counts = { approved: 0, pending: 0, rejected: 0, missing: 0 };
    
    Object.values(documentStatus).forEach(status => {
      counts[status]++;
    });
    
    return counts;
  };

  if (loading && organizations.length === 0) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress style={{ color: '#15e420' }} />
      </Box>
    );
  }

  return (
    <>
      <Snackbar
        open={alert.open}
        autoHideDuration={6000}
        onClose={handleCloseAlert}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert onClose={handleCloseAlert} severity={alert.type} sx={{ width: '100%' }}>
          {alert.message}
        </Alert>
      </Snackbar>

      {/* Approval Warning Dialog */}
      <Dialog 
        open={approveDialog.open} 
        onClose={() => setApproveDialog({ open: false, org: null, documentStatus: {} })}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ fontFamily: '"Poppins", sans-serif', fontWeight: 600 }}>
          Cannot Approve Organization
        </DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 3 }}>
            All documents must be approved before approving the organization.
          </Alert>
          
          <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600 }}>
            Document Status for {approveDialog.org?.company_name}:
          </Typography>
          
          <Box sx={{ mt: 2 }}>
            {documentFields.map(field => {
              const status = approveDialog.documentStatus?.[field.key] || 'missing';
              return (
                <Box 
                  key={field.key}
                  sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between',
                    mb: 1,
                    p: 1,
                    bgcolor: status === 'approved' ? '#e8f5e9' : 
                            status === 'rejected' ? '#ffebee' : 
                            status === 'missing' ? '#f5f5f5' : '#fff3e0',
                    borderRadius: 1
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <DescriptionIcon fontSize="small" />
                    <Typography variant="body2">{field.name}</Typography>
                  </Box>
                  <Chip
                    size="small"
                    label={status}
                    icon={
                      status === 'approved' ? <CheckCircleIcon /> :
                      status === 'rejected' ? <CancelIcon /> :
                      status === 'missing' ? <WarningIcon /> :
                      <PendingIcon />
                    }
                    color={
                      status === 'approved' ? 'success' :
                      status === 'rejected' ? 'error' :
                      status === 'missing' ? 'default' :
                      'warning'
                    }
                    sx={{ textTransform: 'capitalize' }}
                  />
                </Box>
              );
            })}
          </Box>

          {approveDialog.org?.status === 'pending' && (
            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
              <Button 
                variant="outlined" 
                color="error"
                onClick={() => handleRejectOrganization(approveDialog.org)}
              >
                Reject Organization
              </Button>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setApproveDialog({ open: false, org: null, documentStatus: {} })}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', gap: 3 }}>
          <AdminSidebar />
          
          <Box sx={{ flex: 1, bgcolor: '#f8f9fa', p: 3, borderRadius: '16px' }}>
            {/* Header */}
            <Box sx={{ mb: 4 }}>
              <Typography 
                variant="h4" 
                sx={{ 
                  fontFamily: '"Poppins", sans-serif',
                  fontWeight: 700,
                  color: '#333',
                  mb: 1
                }}
              >
                Organizations Management
              </Typography>
              <Typography 
                variant="body1" 
                sx={{ 
                  fontFamily: '"Inter", sans-serif',
                  color: '#666'
                }}
              >
                {statusFilter === 'pending' ? 'Review new organizations waiting for approval' :
                 statusFilter === 'approved' ? 'View all approved organizations' :
                 statusFilter === 'rejected' ? 'View all rejected organizations' :
                 'Review and manage all registered organizations'}
              </Typography>
            </Box>

            {/* Stats Cards */}
            <OrganizationStats stats={stats} />

            {/* Filters */}
            <OrganizationFilters
              searchTerm={searchTerm}
              onSearchChange={handleSearch}
              statusFilter={statusFilter}
              onStatusFilterChange={handleStatusFilter}
              onRefresh={fetchOrganizations}
            />
            
            {/* Table */}
            <OrganizationTable
              organizations={organizations}
              totalCount={totalCount}
              page={page}
              rowsPerPage={rowsPerPage}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              onViewDetails={handleViewOrganization}
              onApproveClick={handleApproveClick}
              onReject={handleRejectOrganization}
              statusFilter={statusFilter}
              checkAllDocumentsApproved={checkAllDocumentsApproved}
              getDocumentStatusSummary={getDocumentStatusSummary}
            />
          </Box>
        </Box>
      </Container>
    </>
  );
};

export default AdminOrganizations;