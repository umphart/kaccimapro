import React from 'react';
import {
  Paper,
  Grid,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button
} from '@mui/material';
import {
  Search as SearchIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';

const OrganizationFilters = ({
  searchTerm,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  onRefresh
}) => {
  return (
    <Paper sx={{ p: 2, mb: 3, borderRadius: '12px' }}>
      <Grid container spacing={2} alignItems="center">
        <Grid item xs={12} md={4}>
          <TextField
            fullWidth
            placeholder="Search by company, email, or CAC..."
            value={searchTerm}
            onChange={onSearchChange}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: '#15e420' }} />
                </InputAdornment>
              ),
            }}
            size="small"
          />
        </Grid>
        <Grid item xs={12} md={3}>
          <FormControl fullWidth size="small">
            <InputLabel>Status Filter</InputLabel>
            <Select
              value={statusFilter}
              onChange={onStatusFilterChange}
              label="Status Filter"
            >
              <MenuItem value="all">All Status</MenuItem>
              <MenuItem value="pending">Pending</MenuItem>
              <MenuItem value="approved">Approved</MenuItem>
              <MenuItem value="rejected">Rejected</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} md={5} sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={onRefresh}
            sx={{ borderColor: '#15e420', color: '#15e420' }}
          >
            Refresh
          </Button>
        </Grid>
      </Grid>
    </Paper>
  );
};

export default OrganizationFilters;