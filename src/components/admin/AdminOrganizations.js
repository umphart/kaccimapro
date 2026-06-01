import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box, Container, Typography, Alert, Snackbar, CircularProgress,
  Dialog, DialogTitle, DialogContent, DialogActions, Button, Chip,
  Paper, Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, TablePagination, IconButton, Tooltip
} from '@mui/material';
import {
  Description as DescriptionIcon, CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon, Warning as WarningIcon, Pending as PendingIcon,
  Visibility as VisibilityIcon, PictureAsPdf as PdfIcon,
  TableChart as ExcelIcon, Refresh as RefreshIcon
} from '@mui/icons-material';
import { supabase } from '../../supabaseClient';
import AdminSidebar from './AdminSidebar';
import OrganizationStats from './OrganizationStats';
import OrganizationFilters from './OrganizationFilters';
import OrganizationTable from './OrganizationTable';
import { documentFields } from './organizationConstants';
import { exportToPDFA2, exportToExcel } from './reports/exportUtils';

const AdminOrganizations = () => {
  const navigate = useNavigate();
  const { filter } = useParams();
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [organizations, setOrganizations] = useState([]);
  const [allOrganizations, setAllOrganizations] = useState([]); // For full export
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [alert, setAlert] = useState({ open: false, type: 'success', message: '' });
  const [approveDialog, setApproveDialog] = useState({ open: false, org: null, documentStatus: {} });
  const [stats, setStats] = useState({ total: 0, pending: 0, approved: 0, rejected: 0 });

  const isDetailedView = statusFilter === 'approved' || statusFilter === 'rejected';

  useEffect(() => {
    if (filter === 'pending') setStatusFilter('pending');
    else if (filter === 'approved') setStatusFilter('approved');
    else if (filter === 'rejected') setStatusFilter('rejected');
    else setStatusFilter('all');
    setPage(0);
  }, [filter]);

  useEffect(() => {
    fetchOrganizations();
    if (!isDetailedView) fetchStats();
  }, [page, rowsPerPage, searchTerm, statusFilter]);

  // Fetch ALL organizations (no limit) for export
  useEffect(() => {
    if (isDetailedView) {
      fetchAllOrganizationsForExport();
    }
  }, [statusFilter, searchTerm]);

  const showAlert = (type, message) => setAlert({ open: true, type, message });
  const handleCloseAlert = () => setAlert({ ...alert, open: false });

  const fetchOrganizations = async () => {
    setLoading(true);
    try {
      let query = supabase.from('organizations').select('*, payments(*)', { count: 'exact' });
      if (statusFilter !== 'all') query = query.eq('status', statusFilter);
      if (searchTerm) query = query.or(`company_name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,cac_number.ilike.%${searchTerm}%`);
      
      const from = page * rowsPerPage;
      const to = from + rowsPerPage - 1;
      const { data, error, count } = await query.order('created_at', { ascending: false }).range(from, to);
      if (error) throw error;

      let orgsWithDocStatus = data || [];
      if (statusFilter === 'pending') {
        orgsWithDocStatus = await Promise.all((data || []).map(async (org) => {
          const docStatus = await checkDocumentStatus(org.id);
          return { ...org, documentStatus: docStatus };
        }));
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

  // Fetch ALL organizations for export (no pagination)
  const fetchAllOrganizationsForExport = async () => {
    try {
      let query = supabase.from('organizations').select('*');
      if (statusFilter !== 'all') query = query.eq('status', statusFilter);
      if (searchTerm) query = query.or(`company_name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,cac_number.ilike.%${searchTerm}%`);
      
      const { data, error } = await query.order('created_at', { ascending: false });
      if (error) throw error;
      setAllOrganizations(data || []);
    } catch (error) {
      console.error('Error fetching all organizations:', error);
    }
  };

  const checkDocumentStatus = async (organizationId) => {
    try {
      const { data: org } = await supabase.from('organizations').select(documentFields.map(f => f.key).join(',')).eq('id', organizationId).single();
      const { data: notifications } = await supabase.from('organization_notifications').select('*').eq('organization_id', organizationId).in('type', ['document_rejected', 'document_approved']).order('created_at', { ascending: false });
      
      const documentStatus = {};
      documentFields.forEach(field => {
        const hasDocument = !!org[field.key];
        const rejectedNotification = notifications?.find(n => n.type === 'document_rejected' && n.title?.includes(field.name));
        const approvedNotification = notifications?.find(n => n.type === 'document_approved' && n.title?.includes(field.name));
        if (!hasDocument) documentStatus[field.key] = 'missing';
        else if (rejectedNotification && (!approvedNotification || new Date(rejectedNotification.created_at) > new Date(approvedNotification.created_at))) documentStatus[field.key] = 'rejected';
        else if (approvedNotification) documentStatus[field.key] = 'approved';
        else documentStatus[field.key] = 'pending';
      });
      return documentStatus;
    } catch (error) { return {}; }
  };

  const fetchStats = async () => {
    try {
      const { count: total } = await supabase.from('organizations').select('*', { count: 'exact', head: true });
      const { count: pending } = await supabase.from('organizations').select('*', { count: 'exact', head: true }).eq('status', 'pending');
      const { count: approved } = await supabase.from('organizations').select('*', { count: 'exact', head: true }).eq('status', 'approved');
      const { count: rejected } = await supabase.from('organizations').select('*', { count: 'exact', head: true }).eq('status', 'rejected');
      setStats({ total: total || 0, pending: pending || 0, approved: approved || 0, rejected: rejected || 0 });
    } catch (error) { console.error('Error fetching stats:', error); }
  };

  const handleChangePage = (event, newPage) => setPage(newPage);
  const handleChangeRowsPerPage = (event) => { setRowsPerPage(parseInt(event.target.value, 10)); setPage(0); };
  const handleSearch = (event) => { setSearchTerm(event.target.value); setPage(0); };
  
  const handleStatusFilter = (event) => {
    const newFilter = event.target.value;
    setStatusFilter(newFilter);
    setPage(0);
    navigate(newFilter === 'all' ? '/admin/organizations' : `/admin/organizations/filter/${newFilter}`);
  };

  const handleViewOrganization = (id) => navigate(`/admin/organizations/${id}`);

  // PDF Export with ALL data on A2 paper
  const handlePDFExport = async () => {
    setExporting(true);
    const dataToExport = allOrganizations.length > 0 ? allOrganizations : organizations;
    await exportToPDFA2('organizations', dataToExport, { start: '2024-01-01', end: new Date().toISOString().split('T')[0] }, { search: searchTerm }, setExporting, showAlert);
  };

  const handleExcelExport = async () => {
    setExporting(true);
    const dataToExport = allOrganizations.length > 0 ? allOrganizations : organizations;
    await exportToExcel('organizations', dataToExport, { start: '2024-01-01', end: new Date().toISOString().split('T')[0] }, { search: searchTerm }, setExporting, showAlert);
  };

  const checkAllDocumentsApproved = (documentStatus) => {
    if (!documentStatus) return false;
    return documentFields.every(field => documentStatus[field.key] === 'approved');
  };

  const handleApproveClick = (org) => {
    if (!checkAllDocumentsApproved(org.documentStatus)) {
      setApproveDialog({ open: true, org, documentStatus: org.documentStatus });
    } else {
      confirmApproveOrganization(org);
    }
  };

  const confirmApproveOrganization = async (org) => {
    try {
      await supabase.from('organizations').update({ status: 'approved', updated_at: new Date().toISOString() }).eq('id', org.id);
      await supabase.from('organization_notifications').insert([{ organization_id: org.id, type: 'success', title: 'Organization Approved', message: 'Your organization has been fully approved!', category: 'registration', action_url: '/dashboard', read: false }]);
      showAlert('success', `${org.company_name} approved`);
      fetchOrganizations(); fetchStats();
    } catch (error) { showAlert('error', 'Failed to approve'); }
  };

  const handleRejectOrganization = async (org) => {
    try {
      await supabase.from('organizations').update({ status: 'rejected', updated_at: new Date().toISOString() }).eq('id', org.id);
      await supabase.from('organization_notifications').insert([{ organization_id: org.id, type: 'error', title: 'Organization Rejected', message: 'Your registration has been rejected.', category: 'registration', action_url: '/contact', read: false }]);
      showAlert('success', `${org.company_name} rejected`);
      fetchOrganizations(); fetchStats();
      setApproveDialog({ open: false, org: null, documentStatus: {} });
    } catch (error) { showAlert('error', 'Failed to reject'); }
  };

  const getDocumentStatusSummary = (documentStatus) => {
    if (!documentStatus) return { approved: 0, pending: 0, rejected: 0, missing: 0 };
    const counts = { approved: 0, pending: 0, rejected: 0, missing: 0 };
    Object.values(documentStatus).forEach(status => { counts[status]++; });
    return counts;
  };

  if (loading && organizations.length === 0) {
    return <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px"><CircularProgress style={{ color: '#15e420' }} /></Box>;
  }

  return (
    <>
      <Snackbar open={alert.open} autoHideDuration={6000} onClose={handleCloseAlert} anchorOrigin={{ vertical: 'top', horizontal: 'right' }}>
        <Alert onClose={handleCloseAlert} severity={alert.type} sx={{ width: '100%' }}>{alert.message}</Alert>
      </Snackbar>

      <Container maxWidth="xl" sx={{ py: { xs: 1, md: 2 }, px: { xs: 1, md: 2 } }}>
        <Box sx={{ display: 'flex', gap: { xs: 1, md: 3 } }}>
          <AdminSidebar />
          
          <Box sx={{ flex: 1, bgcolor: '#f8f9fa', p: { xs: 1.5, md: 2 }, borderRadius: '16px', minWidth: 0, overflow: 'hidden' }}>
            {/* Header */}
            <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, color: '#333', fontSize: { xs: '1rem', md: '1.25rem' } }}>
                {isDetailedView ? `${statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)} Organizations` : 'Organizations'}
              </Typography>
              
              {isDetailedView && (
                <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
                  <Typography variant="caption" sx={{ color: '#666', mr: 1 }}>
                    {allOrganizations.length} records
                  </Typography>
                  <Tooltip title="Export PDF (A2 - Full Details)">
                    <IconButton onClick={handlePDFExport} disabled={exporting} sx={{ color: '#dc3545' }}>
                      {exporting ? <CircularProgress size={18} /> : <PdfIcon />}
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Export Excel">
                    <IconButton onClick={handleExcelExport} disabled={exporting} sx={{ color: '#28a745' }}>
                      {exporting ? <CircularProgress size={18} /> : <ExcelIcon />}
                    </IconButton>
                  </Tooltip>
                </Box>
              )}
            </Box>

            {!isDetailedView && <OrganizationStats stats={stats} />}

            <OrganizationFilters searchTerm={searchTerm} onSearchChange={handleSearch} statusFilter={statusFilter} onStatusFilterChange={handleStatusFilter} onRefresh={fetchOrganizations} />
            
            {isDetailedView ? (
              <SimpleOrganizationsTable 
                organizations={organizations} 
                totalCount={totalCount} 
                page={page} 
                rowsPerPage={rowsPerPage} 
                onPageChange={handleChangePage} 
                onRowsPerPageChange={handleChangeRowsPerPage} 
                onViewDetails={handleViewOrganization} 
              />
            ) : (
              <OrganizationTable 
                organizations={organizations} totalCount={totalCount} page={page} rowsPerPage={rowsPerPage}
                onPageChange={handleChangePage} onRowsPerPageChange={handleChangeRowsPerPage}
                onViewDetails={handleViewOrganization} onApproveClick={handleApproveClick} onReject={handleRejectOrganization}
                statusFilter={statusFilter} checkAllDocumentsApproved={checkAllDocumentsApproved} getDocumentStatusSummary={getDocumentStatusSummary}
              />
            )}
          </Box>
        </Box>
      </Container>

      <Dialog open={approveDialog.open} onClose={() => setApproveDialog({ open: false, org: null, documentStatus: {} })} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 600 }}>Cannot Approve Organization</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>All documents must be approved first.</Alert>
          {documentFields.map(field => {
            const status = approveDialog.documentStatus?.[field.key] || 'missing';
            return (
              <Box key={field.key} sx={{ display: 'flex', justifyContent: 'space-between', p: 0.75, mb: 0.5, bgcolor: status === 'approved' ? '#e8f5e9' : status === 'rejected' ? '#ffebee' : status === 'missing' ? '#f5f5f5' : '#fff3e0', borderRadius: 1 }}>
                <Typography variant="body2">{field.name}</Typography>
                <Chip size="small" label={status} color={status === 'approved' ? 'success' : status === 'rejected' ? 'error' : status === 'missing' ? 'default' : 'warning'} />
              </Box>
            );
          })}
        </DialogContent>
        <DialogActions><Button onClick={() => setApproveDialog({ open: false, org: null, documentStatus: {} })}>Close</Button></DialogActions>
      </Dialog>
    </>
  );
};

// Simple table - Basic info only for screen view
const SimpleOrganizationsTable = ({ organizations, totalCount, page, rowsPerPage, onPageChange, onRowsPerPageChange, onViewDetails }) => {
  const columns = [
    { key: 'company_name', label: 'Company', w: 160 },
    { key: 'email', label: 'Email', w: 180 },
    { key: 'phone_number', label: 'Phone', w: 120 },
    { key: 'cac_number', label: 'CAC', w: 100 },
    { key: 'office_address', label: 'Address', w: 160 },
    { key: 'business_nature', label: 'Business Nature', w: 140 },
  
  ];

  return (
    <Paper sx={{ borderRadius: '12px', overflow: 'hidden' }}>
      <TableContainer sx={{ maxHeight: 'calc(100vh - 350px)' }}>
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem', py: 1, px: 1.5, bgcolor: '#f1f3f5', width: 40 }}>S/N</TableCell>
              {columns.map(col => (
                <TableCell key={col.key} sx={{ fontWeight: 600, fontSize: '0.75rem', py: 1, px: 1.5, bgcolor: '#f1f3f5', minWidth: col.w }}>
                  {col.label}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {organizations.length > 0 ? organizations.map((org, i) => (
              <TableRow key={org.id} hover onClick={() => onViewDetails(org.id)} sx={{ cursor: 'pointer', '&:nth-of-type(even)': { bgcolor: '#fafafa' }, '&:hover': { bgcolor: '#e8f5e9' } }}>
                <TableCell sx={{ fontSize: '0.75rem', py: 0.75, px: 1.5, textAlign: 'center', color: '#999' }}>
                  {page * rowsPerPage + i + 1}
                </TableCell>
                {columns.map(col => (
                  <TableCell key={col.key} sx={{ fontSize: '0.75rem', py: 0.75, px: 1.5, maxWidth: col.w, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {col.key === 'created_at' ? (
                      org[col.key] ? new Date(org[col.key]).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'
                    ) : (
                      <Tooltip title={String(org[col.key] || 'N/A')} arrow>
                        <span>{org[col.key] || '-'}</span>
                      </Tooltip>
                    )}
                  </TableCell>
                ))}
              </TableRow>
            )) : (
              <TableRow><TableCell colSpan={columns.length + 1} align="center" sx={{ py: 4 }}><Typography color="textSecondary">No organizations found</Typography></TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        rowsPerPageOptions={[10, 25, 50]} component="div" count={totalCount} rowsPerPage={rowsPerPage} page={page}
        onPageChange={onPageChange} onRowsPerPageChange={onRowsPerPageChange}
        sx={{ '.MuiTablePagination-toolbar': { minHeight: 40, px: 1.5 }, '.MuiTablePagination-selectLabel, .MuiTablePagination-input': { fontSize: '0.8rem' }, '.MuiTablePagination-displayedRows': { fontSize: '0.8rem' } }}
      />
    </Paper>
  );
};

export default AdminOrganizations;