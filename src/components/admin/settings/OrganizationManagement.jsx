import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  Avatar,
  Chip,
  Divider,
  Tooltip,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Business as BusinessIcon,
  Search as SearchIcon
} from '@mui/icons-material';
import { handleDeleteOrganization } from './settingsUtils';

const OrganizationManagement = ({
  organizations,
  searchTerm,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  onAdd,
  onEdit,
  onDelete,
  showAlert
}) => {
  const navigate = useNavigate();

  const handleDelete = async (orgId, companyName) => {
    if (!window.confirm(`Are you sure you want to delete ${companyName}? This action cannot be undone.`)) return;
    
    const success = await handleDeleteOrganization(orgId, showAlert);
    if (success) {
      onDelete(orgId);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6" sx={{ fontFamily: '"Poppins", sans-serif' }}>
          Organization Management
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={onAdd}
          sx={{ bgcolor: '#15e420', '&:hover': { bgcolor: '#12c21e' } }}
        >
          Add Organization
        </Button>
      </Box>

      {/* Search and Filter */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
        <TextField
          fullWidth
          size="small"
          placeholder="Search organizations..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          InputProps={{
            startAdornment: <SearchIcon sx={{ color: '#999', mr: 1 }} />
          }}
        />
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Status</InputLabel>
          <Select
            value={statusFilter}
            onChange={(e) => onStatusFilterChange(e.target.value)}
            label="Status"
          >
            <MenuItem value="all">All Status</MenuItem>
            <MenuItem value="pending">Pending</MenuItem>
            <MenuItem value="approved">Approved</MenuItem>
            <MenuItem value="rejected">Rejected</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {/* Organizations List */}
      <List>
        {organizations.map((org, index) => (
          <React.Fragment key={org.id}>
            <ListItem
              secondaryAction={
                <Box>
                  <Tooltip title="View Details">
                    <IconButton 
                      onClick={() => navigate(`/admin/organizations/${org.id}`)} 
                      sx={{ color: '#17a2b8' }}
                    >
                      <BusinessIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Edit">
                    <IconButton onClick={() => onEdit(org)} sx={{ color: '#15e420' }}>
                      <EditIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Delete">
                    <IconButton onClick={() => handleDelete(org.id, org.company_name)} sx={{ color: '#dc3545' }}>
                      <DeleteIcon />
                    </IconButton>
                  </Tooltip>
                </Box>
              }
            >
              <ListItemIcon>
                <Avatar sx={{ 
                  bgcolor: org.status === 'approved' ? '#28a745' : 
                           org.status === 'rejected' ? '#dc3545' : '#ffc107' 
                }}>
                  <BusinessIcon />
                </Avatar>
              </ListItemIcon>
              <ListItemText
                primary={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                    <Typography variant="subtitle2">{org.company_name}</Typography>
                    <Chip
                      label={org.status}
                      size="small"
                      sx={{
                        backgroundColor: org.status === 'approved' ? '#d4edda' :
                                        org.status === 'rejected' ? '#ffebee' : '#fff3e0',
                        color: org.status === 'approved' ? '#28a745' :
                               org.status === 'rejected' ? '#dc3545' : '#ff9800'
                      }}
                    />
                    {org.cac_number && (
                      <Chip
                        label={`CAC: ${org.cac_number}`}
                        size="small"
                        variant="outlined"
                        sx={{ fontSize: '0.7rem' }}
                      />
                    )}
                  </Box>
                }
                secondary={
                  <Box>
                    <Typography variant="body2" color="textSecondary">
                      {org.email} • {org.phone_number || 'No phone'}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      Contact: {org.contact_person || 'N/A'} • Registered: {new Date(org.created_at).toLocaleDateString()}
                    </Typography>
                  </Box>
                }
              />
            </ListItem>
            {index < organizations.length - 1 && <Divider />}
          </React.Fragment>
        ))}
        
        {organizations.length === 0 && (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <BusinessIcon sx={{ fontSize: 48, color: '#ccc', mb: 2 }} />
            <Typography variant="body1" color="textSecondary">
              No organizations found
            </Typography>
          </Box>
        )}
      </List>
    </Box>
  );
};

export default OrganizationManagement;