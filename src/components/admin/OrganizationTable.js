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
  Pending as PendingIcon,
  Description as DescriptionIcon
} from '@mui/icons-material';
import { documentFields } from './organizationConstants';

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
  statusFilter,
  checkAllDocumentsApproved,
  getDocumentStatusSummary
}) => {
  
  const getStatusChip = (status) => {
    const config = {
      pending: { color: 'warning', icon: <PendingIcon sx={{ fontSize: '12px !important' }} />, label: 'Pending' },
      approved: { color: 'success', icon: <CheckCircleIcon sx={{ fontSize: '12px !important' }} />, label: 'Approved' },
      rejected: { color: 'error', icon: <CancelIcon sx={{ fontSize: '12px !important' }} />, label: 'Rejected' }
    };
    const statusConfig = config[status] || config.pending;

    return (
      <Chip
        icon={statusConfig.icon}
        label={statusConfig.label}
        size="small"
        color={statusConfig.color}
        sx={{ height: 22, fontSize: '10px' }}
      />
    );
  };

  const renderDocumentChips = (docSummary, allApproved) => {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.3, flexWrap: 'wrap' }}>
        {docSummary.rejected > 0 && (
          <Chip
            size="small"
            icon={<CancelIcon sx={{ fontSize: '10px !important' }} />}
            label={docSummary.rejected}
            color="error"
            sx={{ height: 18, fontSize: '9px', '& .MuiChip-icon': { ml: 0.3, mr: -0.3 } }}
          />
        )}
        {docSummary.missing > 0 && (
          <Chip
            size="small"
            icon={<WarningIcon sx={{ fontSize: '10px !important' }} />}
            label={docSummary.missing}
            color="default"
            sx={{ height: 18, fontSize: '9px', '& .MuiChip-icon': { ml: 0.3, mr: -0.3 } }}
          />
        )}
        {docSummary.pending > 0 && (
          <Chip
            size="small"
            icon={<PendingIcon sx={{ fontSize: '10px !important' }} />}
            label={docSummary.pending}
            color="warning"
            sx={{ height: 18, fontSize: '9px', '& .MuiChip-icon': { ml: 0.3, mr: -0.3 } }}
          />
        )}
        {allApproved && (
          <Chip
            size="small"
            icon={<VerifiedIcon sx={{ fontSize: '10px !important' }} />}
            label="✓"
            color="success"
            sx={{ height: 18, fontSize: '9px', '& .MuiChip-icon': { ml: 0.3, mr: -0.3 } }}
          />
        )}
        {!allApproved && docSummary.approved > 0 && (
          <Chip
            size="small"
            icon={<CheckCircleIcon sx={{ fontSize: '10px !important' }} />}
            label={docSummary.approved}
            color="success"
            sx={{ height: 18, fontSize: '9px', '& .MuiChip-icon': { ml: 0.3, mr: -0.3 } }}
          />
        )}
      </Box>
    );
  };

  const renderDocumentTooltip = (docSummary) => (
    <Box sx={{ p: 0.5 }}>
      <Typography variant="caption" display="block" sx={{ fontSize: '10px', whiteSpace: 'nowrap' }}>
        ✅ Approved: {docSummary.approved}
      </Typography>
      <Typography variant="caption" display="block" sx={{ fontSize: '10px', whiteSpace: 'nowrap' }}>
        ⏳ Pending: {docSummary.pending}
      </Typography>
      <Typography variant="caption" display="block" sx={{ fontSize: '10px', whiteSpace: 'nowrap' }}>
        ❌ Rejected: {docSummary.rejected}
      </Typography>
      <Typography variant="caption" display="block" sx={{ fontSize: '10px', whiteSpace: 'nowrap' }}>
        📄 Missing: {docSummary.missing}
      </Typography>
    </Box>
  );

  const getTableColumns = () => {
    if (statusFilter === 'pending') {
      return ['Company', 'Email', 'CAC', 'Date', 'Documents', 'Status', 'Actions'];
    }
    return ['Company', 'Email',  'CAC', 'Date', 'Status'];
  };

  const columns = getTableColumns();

  return (
    <Paper sx={{ borderRadius: '12px', overflow: 'hidden' }}>
      <TableContainer>
        <Table size="small">
          <TableHead sx={{ backgroundColor: '#f8f9fa' }}>
            <TableRow>
              {columns.map((column) => (
                <TableCell 
                  key={column}
                  sx={{ 
                    fontFamily: '"Inter", sans-serif', 
                    fontWeight: 600, 
                    py: 1, 
                    px: 1,
                    width: column === 'Company' ? '15%' : 
                           column === 'Email' ? '18%' :          
                           column === 'CAC' ? '10%' : 
                           column === 'Reg Date' ? '10%' :
                           column === 'Documents' ? '20%' :
                           column === 'Status' ? '10%' : '15%'
                  }}
                >
                  {column}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {organizations.map((org) => {
              const docSummary = getDocumentStatusSummary(org.documentStatus);
              const allApproved = checkAllDocumentsApproved(org.documentStatus);
              
              return (
                <TableRow key={org.id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                  <TableCell sx={{ fontFamily: '"Inter", sans-serif', py: 0.75, px: 1 }}>
                    <Tooltip title={org.company_name} arrow>
                      <Typography variant="body2" noWrap sx={{ maxWidth: 120, fontSize: '0.8rem' }}>
                        {org.company_name}
                      </Typography>
                    </Tooltip>
                  </TableCell>
                  <TableCell sx={{ fontFamily: '"Inter", sans-serif', py: 0.75, px: 1 }}>
                    <Tooltip title={org.email} arrow>
                      <Typography variant="body2" noWrap sx={{ maxWidth: 140, fontSize: '0.8rem' }}>
                        {org.email}
                      </Typography>
                    </Tooltip>
                  </TableCell>
                  
                  
                  <TableCell sx={{ fontFamily: '"Inter", sans-serif', py: 0.75, px: 1 }}>
                    <Typography variant="body2" noWrap sx={{ fontSize: '0.8rem' }}>
                      {org.cac_number ? org.cac_number.substring(0, 8) + '...' : 'N/A'}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ fontFamily: '"Inter", sans-serif', py: 0.75, px: 1 }}>
                    <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>
                      {new Date(org.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: '2-digit' })}
                    </Typography>
                  </TableCell>
                  
                  {/* Documents column - only for pending */}
                  {statusFilter === 'pending' && (
                    <TableCell sx={{ py: 0.75, px: 1 }}>
                      <Tooltip title={renderDocumentTooltip(docSummary)} arrow>
                        {renderDocumentChips(docSummary, allApproved)}
                      </Tooltip>
                    </TableCell>
                  )}
                  
                  <TableCell sx={{ py: 0.75, px: 1 }}>
                    {getStatusChip(org.status)}
                  </TableCell>
                  
                  {/* Actions column - only for pending */}
                  {statusFilter === 'pending' && (
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
                </TableRow>
              );
            })}
            {organizations.length === 0 && (
              <TableRow>
                <TableCell colSpan={columns.length} align="center" sx={{ py: 3 }}>
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