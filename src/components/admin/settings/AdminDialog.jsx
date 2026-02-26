import React from 'react';
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
  Tooltip
} from '@mui/material';
import {
  PersonAdd as PersonAddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  AdminPanelSettings as AdminIcon
} from '@mui/icons-material';
import { handleDeleteAdmin } from './settingsUtils';

const AdminManagement = ({ admins, onAdd, onEdit, onDelete, showAlert }) => {
  const handleDelete = async (adminId) => {
    if (!window.confirm('Are you sure you want to delete this admin?')) return;
    
    const success = await handleDeleteAdmin(adminId, showAlert);
    if (success) {
      onDelete(adminId);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6" sx={{ fontFamily: '"Poppins", sans-serif' }}>
          Administrator Management
        </Typography>
        <Button
          variant="contained"
          startIcon={<PersonAddIcon />}
          onClick={onAdd}
          sx={{ bgcolor: '#15e420', '&:hover': { bgcolor: '#12c21e' } }}
        >
          Add Admin
        </Button>
      </Box>

      <List>
        {admins.map((admin, index) => (
          <React.Fragment key={admin.id}>
            <ListItem
              secondaryAction={
                <Box>
                  <Tooltip title="Edit">
                    <IconButton onClick={() => onEdit(admin)} sx={{ color: '#15e420' }}>
                      <EditIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Delete">
                    <IconButton onClick={() => handleDelete(admin.id)} sx={{ color: '#dc3545' }}>
                      <DeleteIcon />
                    </IconButton>
                  </Tooltip>
                </Box>
              }
            >
              <ListItemIcon>
                <Avatar sx={{ bgcolor: admin.admin_type === 'approver' ? '#667eea' : '#f093fb' }}>
                  <AdminIcon />
                </Avatar>
              </ListItemIcon>
              <ListItemText
                primary={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="subtitle2">{admin.full_name}</Typography>
                    <Chip
                      label={admin.admin_type}
                      size="small"
                      sx={{
                        backgroundColor: admin.admin_type === 'approver' ? '#667eea' : '#f093fb',
                        color: 'white'
                      }}
                    />
                  </Box>
                }
                secondary={
                  <Box>
                    <Typography variant="body2" color="textSecondary">
                      {admin.email}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      Last login: {admin.last_login ? new Date(admin.last_login).toLocaleString() : 'Never'}
                    </Typography>
                  </Box>
                }
              />
            </ListItem>
            {index < admins.length - 1 && <Divider />}
          </React.Fragment>
        ))}
        
        {admins.length === 0 && (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="body1" color="textSecondary">
              No administrators found
            </Typography>
          </Box>
        )}
      </List>
    </Box>
  );
};

export default AdminManagement;