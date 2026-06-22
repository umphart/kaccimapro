import React from 'react';
import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  IconButton,
  Typography,
  Box,
  Tooltip
} from '@mui/material';
import {
  Visibility as VisibilityIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Verified as VerifiedIcon,
  Warning as WarningIcon,
  Pending as PendingIcon
} from '@mui/icons-material';
import { 
  documentFields, 
  areAllRequiredDocumentsApproved, 
  getDocumentSummary,
  statusConfig 
} from './organizationConstants';

const OrganizationTable = ({
  organizations,
  totalCount,
  page,
  rowsPerPage,
  onPageChange,
  onRowsPerPageChange,
  onViewDetails,
  onApproveClick,
  onReject,
  statusFilter
}) => {
  
  const getStatusChip = (status) => {
    const config = statusConfig[status?.toLowerCase()] || statusConfig.pending;
    const Icon = config.icon;
    
    return (
      <Chip
        icon={<Icon sx={{ fontSize: '12px !important' }} />}
        label={config.label}
        size="small"
        color={config.color}
        sx={{ height: 22, fontSize: '10px' }}
      />
    );
  };

  const renderDocumentChips = (documents) => {
    const summary = getDocumentSummary(documents || []);
    
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.3, flexWrap: 'wrap' }}>
        {summary.rejected > 0 && (
          <Chip
            size="small"
            icon={<CancelIcon sx={{ fontSize: '10px !important' }} />}
            label={summary.rejected}
            color="error"
            sx={{ height: 18, fontSize: '9px', '& .MuiChip-icon': { ml: 0.3, mr: -0.3 } }}
          />
        )}
        {summary.missing > 0 && (
          <Chip
            size="small"
            icon={<WarningIcon sx={{ fontSize: '10px !important' }} />}
            label={summary.missing}
            color="default"
            sx={{ height: 18, fontSize: '9px', '& .MuiChip-icon': { ml: 0.3, mr: -0.3 } }}
          />
        )}
        {summary.pending > 0 && (
          <Chip
            size="small"
            icon={<PendingIcon sx={{ fontSize: '10px !important' }} />}
            label={summary.pending}
            color="warning"
            sx={{ height: 18, fontSize: '9px', '& .MuiChip-icon': { ml: 0.3, mr: -0.3 } }}
          />
        )}
        {summary.approved > 0 && (
          <Chip
            size="small"
            icon={<CheckCircleIcon sx={{ fontSize: '10px !important' }} />}
            label={summary.approved}
            color="success"
            sx={{ height: 18, fontSize: '9px', '& .MuiChip-icon': { ml: 0.3, mr: -0.3 } }}
          />
        )}
        {summary.approved === documentFields.length && summary.missing === 0 && (
          <Chip
            size="small"
            icon={<VerifiedIcon sx={{ fontSize: '10px !important' }} />}
            label="All ✓"
            color="success"
            sx={{ height: 18, fontSize: '9px', '& .MuiChip-icon': { ml: 0.3, mr: -0.3 } }}
          />
        )}
      </Box>
    );
  };

  const renderDocumentTooltip = (documents) => {
    const summary = getDocumentSummary(documents || []);
    return (
      <Box sx={{ p: 0.5 }}>
        <Typography variant="caption" display="block" sx={{ fontSize: '10px', whiteSpace: 'nowrap' }}>
          ✅ Approved: {summary.approved}
        </Typography>
        <Typography variant="caption" display="block" sx={{ fontSize: '10px', whiteSpace: 'nowrap' }}>
          ⏳ Pending: {summary.pending}
        </Typography>
        <Typography variant="caption" display="block" sx={{ fontSize: '10px', whiteSpace: 'nowrap' }}>
          ❌ Rejected: {summary.rejected}
        </Typography>
        <Typography variant="caption" display="block" sx={{ fontSize: '10px', whiteSpace: 'nowrap' }}>
          📄 Missing: {summary.missing}
        </Typography>
      </Box>
    );
  };

  // Define columns based on status filter
  const getColumns = () => {
    const baseColumns = [
      { key: 'company_name', label: 'Company', width: '15%' },
      { key: 'email', label: 'Email', width: '18%' },
      { key: 'cac_number', label: 'CAC', width: '10%' },
      { key: 'created_at', label: 'Date', width: '10%' }
    ];

    if (statusFilter === 'pending') {
      return [
        ...baseColumns,
        { key: 'documents', label: 'Documents', width: '20%' },
        { key: 'status', label: 'Status', width: '10%' },
        { key: 'actions', label: 'Actions', width: '15%' }
      ];
    }

    return [
      ...baseColumns,
      { key: 'status', label: 'Status', width: '10%' }
    ];
  };

  const columns = getColumns();

  return (
    <Paper sx={{ borderRadius: '12px', overflow: 'hidden' }}>
      <TableContainer>
        <Table size="small">
          <TableHead sx={{ backgroundColor: '#f8f9fa' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 600, py: 1, px: 1, width: '5%' }}>#</TableCell>
              {columns.map((col) => (
                <TableCell 
                  key={col.key}
                  sx={{ 
                    fontWeight: 600, 
                    py: 1, 
                    px: 1,
                    width: col.width
                  }}
                >
                  {col.label}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {organizations.length > 0 ? (
              organizations.map((org, index) => {
                const allApproved = areAllRequiredDocumentsApproved(org.documents);
                const isPending = org.status?.toLowerCase() === 'pending';
                
                return (
                  <TableRow 
                    key={org.id} 
                    hover 
                    sx={{ 
                      '&:nth-of-type(even)': { bgcolor: '#fafafa' },
                      '&:hover': { bgcolor: '#e8f5e9' }
                    }}
                  >
                    <TableCell sx={{ py: 0.75, px: 1, color: '#999', fontSize: '0.75rem' }}>
                      {page * rowsPerPage + index + 1}
                    </TableCell>
                    
                    <TableCell sx={{ py: 0.75, px: 1 }}>
                      <Tooltip title={org.company_name} arrow>
                        <Typography variant="body2" noWrap sx={{ maxWidth: 120, fontSize: '0.8rem' }}>
                          {org.company_name || 'N/A'}
                        </Typography>
                      </Tooltip>
                    </TableCell>
                    
                    <TableCell sx={{ py: 0.75, px: 1 }}>
                      <Tooltip title={org.email} arrow>
                        <Typography variant="body2" noWrap sx={{ maxWidth: 140, fontSize: '0.8rem' }}>
                          {org.email || 'N/A'}
                        </Typography>
                      </Tooltip>
                    </TableCell>
                    
                    <TableCell sx={{ py: 0.75, px: 1 }}>
                      <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>
                        {org.cac_number || 'N/A'}
                      </Typography>
                    </TableCell>
                    
                    <TableCell sx={{ py: 0.75, px: 1 }}>
                      <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>
                        {new Date(org.created_at).toLocaleDateString('en-GB', { 
                          day: '2-digit', 
                          month: '2-digit', 
                          year: '2-digit' 
                        })}
                      </Typography>
                    </TableCell>
                    
                    {/* Documents column - only for pending */}
                    {statusFilter === 'pending' && (
                      <TableCell sx={{ py: 0.75, px: 1 }}>
                        <Tooltip title={renderDocumentTooltip(org.documents)} arrow>
                          {renderDocumentChips(org.documents)}
                        </Tooltip>
                      </TableCell>
                    )}
                    
                    <TableCell sx={{ py: 0.75, px: 1 }}>
                      {getStatusChip(org.status)}
                    </TableCell>
                    
                    {/* Actions column - only for pending */}
                    {statusFilter === 'pending' && isPending && (
                      <TableCell sx={{ py: 0.75, px: 1 }}>
                        <Box sx={{ display: 'flex', gap: 0.3, justifyContent: 'flex-start' }}>
                          <Tooltip title="View Details" arrow>
                            <IconButton
                              size="small"
                              onClick={() => onViewDetails(org.id)}
                              sx={{ color: '#15e420', p: 0.3 }}
                            >
                              <VisibilityIcon sx={{ fontSize: 16 }} />
                            </IconButton>
                          </Tooltip>
                          
                          <Tooltip title={allApproved ? "Approve Organization" : "Check Documents First"} arrow>
                            <span>
                              <IconButton
                                size="small"
                                onClick={() => onApproveClick(org)}
                                sx={{ 
                                  color: allApproved ? '#28a745' : '#ffc107', 
                                  p: 0.3,
                                  opacity: allApproved ? 1 : 0.7
                                }}
                              >
                                <CheckCircleIcon sx={{ fontSize: 16 }} />
                              </IconButton>
                            </span>
                          </Tooltip>
                          
                          <Tooltip title="Reject Organization" arrow>
                            <IconButton
                              size="small"
                              onClick={() => onReject(org)}
                              sx={{ color: '#dc3545', p: 0.3 }}
                            >
                              <CancelIcon sx={{ fontSize: 16 }} />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    )}
                    
                    {/* For non-pending status, show view only */}
                    {statusFilter !== 'pending' && (
                      <TableCell sx={{ py: 0.75, px: 1 }}>
                        <Tooltip title="View Details" arrow>
                          <IconButton
                            size="small"
                            onClick={() => onViewDetails(org.id)}
                            sx={{ color: '#15e420', p: 0.3 }}
                          >
                            <VisibilityIcon sx={{ fontSize: 16 }} />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    )}
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length + 1} align="center" sx={{ py: 4 }}>
                  <Typography sx={{ color: '#666', fontSize: '0.9rem' }}>
                    No organizations found
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        rowsPerPageOptions={[5, 10, 25, 50]}
        component="div"
        count={totalCount}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={onPageChange}
        onRowsPerPageChange={onRowsPerPageChange}
        sx={{ 
          '.MuiTablePagination-toolbar': { minHeight: 40, px: 1 },
          '.MuiTablePagination-selectLabel, .MuiTablePagination-input': { my: 0, fontSize: '0.8rem' },
          '.MuiTablePagination-displayedRows': { fontSize: '0.8rem', m: 0 }
        }}
      />
    </Paper>
  );
};

export default OrganizationTable;