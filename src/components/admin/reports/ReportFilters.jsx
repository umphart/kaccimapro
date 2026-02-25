import React, { useState, useEffect } from 'react';
import {
  Grid,
  TextField,
  InputAdornment,
  Paper,
  IconButton,
  Chip,
  Box,
  Typography,
  Collapse,
  Tooltip,
  Zoom,
  useMediaQuery,
  useTheme,
  Button
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  Clear as ClearIcon,
  Tune as TuneIcon,
  Close as CloseIcon,
  PictureAsPdf as PdfIcon,
  TableChart as ExcelIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { styled, keyframes } from '@mui/material/styles';

// Animations
const slideIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const pulseFilter = keyframes`
  0% {
    box-shadow: 0 0 0 0 rgba(21, 228, 32, 0.4);
  }
  70% {
    box-shadow: 0 0 0 10px rgba(21, 228, 32, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(21, 228, 32, 0);
  }
`;

const FilterContainer = styled(Paper)(({ theme, hasFilters }) => ({
  padding: theme.spacing(1.5, 2),
  background: 'linear-gradient(145deg, #ffffff 0%, #f8f9fa 100%)',
  borderRadius: '16px',
  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
  border: hasFilters 
    ? '2px solid #15e420' 
    : '1px solid rgba(21, 228, 32, 0.1)',
  transition: 'all 0.3s ease',
  position: 'relative',
  overflow: 'hidden',
  animation: hasFilters ? `${pulseFilter} 2s infinite` : 'none',
  width: '100%',
  '&:hover': {
    boxShadow: '0 8px 30px rgba(21, 228, 32, 0.15)',
  }
}));

const SearchField = styled(TextField)(({ theme }) => ({
  flex: 1,
  '& .MuiOutlinedInput-root': {
    borderRadius: '12px',
    backgroundColor: '#fff',
    transition: 'all 0.3s ease',
    height: '48px',
    '&:hover': {
      transform: 'translateY(-2px)',
      boxShadow: '0 6px 20px rgba(21, 228, 32, 0.15)',
      '& .MuiOutlinedInput-notchedOutline': {
        borderColor: '#15e420',
        borderWidth: '2px',
      }
    },
    '&.Mui-focused': {
      transform: 'translateY(-2px)',
      boxShadow: '0 6px 20px rgba(21, 228, 32, 0.2)',
      '& .MuiOutlinedInput-notchedOutline': {
        borderColor: '#15e420',
        borderWidth: '2px',
      }
    }
  },
  '& .MuiInputLabel-root': {
    fontFamily: '"Inter", sans-serif',
    '&.Mui-focused': {
      color: '#15e420',
      fontWeight: 600,
    }
  },
  animation: `${slideIn} 0.3s ease-out`,
}));

const ExportButton = styled(Button)(({ theme, exporttype }) => ({
  padding: '8px 20px',
  borderRadius: '12px',
  fontSize: '14px',
  fontWeight: 600,
  textTransform: 'none',
  fontFamily: '"Inter", sans-serif',
  letterSpacing: '0.3px',
  minWidth: '110px',
  height: '48px',
  position: 'relative',
  overflow: 'hidden',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  
  background: exporttype === 'pdf' 
    ? 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'
    : 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
  
  color: 'white',
  boxShadow: exporttype === 'pdf'
    ? '0 4px 15px rgba(240, 147, 251, 0.3)'
    : '0 4px 15px rgba(79, 172, 254, 0.3)',
  
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: '-100px',
    width: '100px',
    height: '100%',
    background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent)',
    transition: 'left 0.5s ease',
  },
  
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: exporttype === 'pdf'
      ? '0 8px 25px rgba(240, 147, 251, 0.5)'
      : '0 8px 25px rgba(79, 172, 254, 0.5)',
    '&::before': {
      left: '200px',
      transition: 'left 0.7s ease',
    }
  },
  
  '&:active': {
    transform: 'translateY(-1px)',
  },
  
  '&.Mui-disabled': {
    background: '#e0e0e0',
    boxShadow: 'none',
    color: '#999',
    '&::before': {
      display: 'none',
    }
  },

  [theme.breakpoints.down('sm')]: {
    minWidth: 'auto',
    padding: '8px 12px',
    fontSize: '13px',
  }
}));

const RefreshButton = styled(IconButton)({
  width: '48px',
  height: '48px',
  borderRadius: '12px',
  backgroundColor: '#fff',
  border: '1px solid #15e420',
  color: '#15e420',
  transition: 'all 0.3s ease',
  '&:hover': {
    backgroundColor: '#15e420',
    color: '#fff',
    transform: 'rotate(180deg)',
  }
});

const ActiveFilterChip = styled(Chip)(({ theme }) => ({
  background: 'linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%)',
  color: '#15e420',
  fontWeight: 600,
  fontSize: '0.8rem',
  height: '28px',
  border: '1px solid #15e420',
  '& .MuiChip-deleteIcon': {
    color: '#15e420',
    '&:hover': {
      color: '#dc3545',
    }
  },
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: '0 4px 12px rgba(21, 228, 32, 0.2)',
  },
  transition: 'all 0.3s ease',
}));

const ReportFilters = ({ 
  filters, 
  onFilterChange, 
  onRefresh,
  exporting,
  onPDFExport,
  onExcelExport,
  recordCount 
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [searchValue, setSearchValue] = useState(filters.search || '');

  // Update local state when filters change
  useEffect(() => {
    setSearchValue(filters.search || '');
  }, [filters.search]);

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchValue(value);
    onFilterChange('search', value);
  };

  const handleClearSearch = () => {
    setSearchValue('');
    onFilterChange('search', '');
  };

  const hasActiveFilter = searchValue.length > 0;

  return (
    <Grid item xs={12}>
      <FilterContainer hasFilters={hasActiveFilter} elevation={0}>
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 1.5,
          flexWrap: { xs: 'wrap', md: 'nowrap' }
        }}>
          {/* Search Bar - Now filters by all fields */}
          <Tooltip 
            title="Search by company name, business nature, phone, address, contact person, or representative"
            arrow 
            placement="top"
            TransitionComponent={Zoom}
            TransitionProps={{ timeout: 300 }}
          >
            <SearchField
              fullWidth
              variant="outlined"
              placeholder="Search organizations by any field..."
              value={searchValue}
              onChange={handleSearchChange}
              size="small"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: '#15e420', fontSize: '1.2rem' }} />
                  </InputAdornment>
                ),
                endAdornment: searchValue && (
                  <InputAdornment position="end">
                    <IconButton
                      size="small"
                      onClick={handleClearSearch}
                      edge="end"
                      sx={{ color: '#999', '&:hover': { color: '#dc3545' } }}
                    >
                      <ClearIcon fontSize="small" />
                    </IconButton>
                  </InputAdornment>
                )
              }}
            />
          </Tooltip>

          {/* Action Buttons - All in the same row */}
          <Box sx={{ 
            display: 'flex', 
            gap: 1,
            flexShrink: 0,
            flexWrap: { xs: 'wrap', sm: 'nowrap' },
            justifyContent: { xs: 'flex-end', sm: 'flex-start' }
          }}>
            <Tooltip title="Refresh data" arrow placement="top" TransitionComponent={Zoom}>
              <RefreshButton onClick={onRefresh} size="small">
                <RefreshIcon />
              </RefreshButton>
            </Tooltip>

            <Tooltip title="Export as PDF" arrow placement="top" TransitionComponent={Zoom}>
              <span>
                <ExportButton
                  exporttype="pdf"
                  startIcon={<PdfIcon />}
                  onClick={onPDFExport}
                  disabled={exporting || recordCount === 0}
                  size="small"
                >
                  PDF
                </ExportButton>
              </span>
            </Tooltip>

            <Tooltip title="Export as Excel" arrow placement="top" TransitionComponent={Zoom}>
              <span>
                <ExportButton
                  exporttype="excel"
                  startIcon={<ExcelIcon />}
                  onClick={onExcelExport}
                  disabled={exporting || recordCount === 0}
                  size="small"
                >
                  Excel
                </ExportButton>
              </span>
            </Tooltip>
          </Box>
        </Box>

        {/* Active filter indicator */}
        {hasActiveFilter && (
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 1, 
            mt: 1.5,
            pt: 1,
            borderTop: '1px dashed #e0e0e0'
          }}>
            <Typography variant="caption" sx={{ color: '#666' }}>
              Active filter:
            </Typography>
            <ActiveFilterChip
              label={`Search: "${searchValue}"`}
              onDelete={handleClearSearch}
              deleteIcon={<CloseIcon />}
              size="small"
            />
            <Typography variant="caption" sx={{ color: '#999', ml: 'auto' }}>
              {recordCount} result(s) found
            </Typography>
          </Box>
        )}

        {/* Decorative gradient */}
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            right: 0,
            width: '150px',
            height: '150px',
            background: 'radial-gradient(circle at 100% 0%, rgba(21, 228, 32, 0.03) 0%, transparent 70%)',
            pointerEvents: 'none',
            borderRadius: '50%',
          }}
        />
      </FilterContainer>
    </Grid>
  );
};

export default ReportFilters;