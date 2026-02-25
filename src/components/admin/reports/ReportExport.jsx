import React from 'react';
import {
  Box,
  Button,
  CircularProgress,
  Paper,
  Tooltip,
  Zoom,
  Typography
} from '@mui/material';
import {
  PictureAsPdf as PdfIcon,
  TableChart as ExcelIcon,
  Analytics as AnalyticsIcon
} from '@mui/icons-material';
import { styled, keyframes } from '@mui/material/styles';

// Import the export utilities - make sure this path is correct
import { exportToPDF, exportToExcel } from './exportUtils';

// Animations
const pulseAnimation = keyframes`
  0% {
    box-shadow: 0 0 0 0 rgba(240, 147, 251, 0.7);
  }
  70% {
    box-shadow: 0 0 0 10px rgba(240, 147, 251, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(240, 147, 251, 0);
  }
`;

const ExportContainer = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2, 3),
  background: 'linear-gradient(145deg, #ffffff 0%, #f8f9fa 100%)',
  borderRadius: '16px',
  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(2),
  border: '1px solid rgba(21, 228, 32, 0.1)',
  position: 'relative',
  overflow: 'hidden',
  width: '100%',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '2px',
    background: 'linear-gradient(90deg, #f093fb, #4facfe)',
  }
}));

const ExportTitle = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  '& svg': {
    fontSize: '1.2rem',
    color: '#15e420'
  }
});

const ExportButton = styled(Button)(({ theme, exporttype, disabled }) => ({
  padding: '10px 24px',
  borderRadius: '12px',
  fontSize: '15px',
  fontWeight: 600,
  textTransform: 'none',
  fontFamily: '"Inter", sans-serif',
  letterSpacing: '0.3px',
  position: 'relative',
  overflow: 'hidden',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  minWidth: '130px',
  
  // Background based on type
  background: exporttype === 'pdf' 
    ? 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'
    : 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
  
  color: 'white',
  boxShadow: exporttype === 'pdf'
    ? '0 8px 20px rgba(240, 147, 251, 0.3)'
    : '0 8px 20px rgba(79, 172, 254, 0.3)',
  
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
    transform: 'translateY(-3px)',
    boxShadow: exporttype === 'pdf'
      ? '0 12px 30px rgba(240, 147, 251, 0.5)'
      : '0 12px 30px rgba(79, 172, 254, 0.5)',
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
    padding: '8px 16px',
    fontSize: '14px',
    minWidth: '100px',
  }
}));

const ExportStats = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1),
  padding: theme.spacing(0.5, 1.5),
  backgroundColor: '#e8f5e9',
  borderRadius: '20px',
  border: '1px solid #15e420',
  marginLeft: 'auto',
  [theme.breakpoints.down('md')]: {
    display: 'none',
  }
}));

const StatsDot = styled('span')({
  width: '8px',
  height: '8px',
  borderRadius: '50%',
  backgroundColor: '#15e420',
  animation: `${pulseAnimation} 2s infinite`,
});

const ReportExport = ({ 
  reportType, 
  data, 
  dateRange, 
  filters,
  exporting, 
  setExporting, 
  showAlert 
}) => {
  const handlePDFExport = async () => {
    if (!data || data.length === 0) {
      showAlert('error', 'No data to export');
      return;
    }
    await exportToPDF(reportType, data, dateRange, filters, setExporting, showAlert);
  };

  const handleExcelExport = async () => {
    if (!data || data.length === 0) {
      showAlert('error', 'No data to export');
      return;
    }
    await exportToExcel(reportType, data, dateRange, filters, setExporting, showAlert);
  };

  const getRecordCount = () => {
    return data?.length || 0;
  };

  const getReportTitle = () => {
    return reportType === 'payments' ? 'Payment' : 'Organization';
  };

  return (
    <ExportContainer elevation={0}>
      <ExportTitle>
        <AnalyticsIcon />
        <Box>
          <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#333' }}>
            Export {getReportTitle()} Reports
          </Typography>
          <Typography variant="caption" sx={{ color: '#666' }}>
            {getRecordCount()} records available
          </Typography>
        </Box>
      </ExportTitle>

      <ExportStats>
        <StatsDot />
        <Typography variant="caption" sx={{ color: '#15e420', fontWeight: 600 }}>
          {new Date(dateRange.start).toLocaleDateString()} - {new Date(dateRange.end).toLocaleDateString()}
        </Typography>
      </ExportStats>

      <Box sx={{ display: 'flex', gap: 1.5, ml: 'auto' }}>
        <Tooltip 
          title="Export as PDF document" 
          arrow 
          placement="top"
          TransitionComponent={Zoom}
          TransitionProps={{ timeout: 300 }}
        >
          <span>
            <ExportButton
              exporttype="pdf"
              startIcon={exporting ? <CircularProgress size={18} color="inherit" /> : <PdfIcon />}
              onClick={handlePDFExport}
              disabled={exporting || getRecordCount() === 0}
            >
              {exporting ? 'Exporting...' : 'PDF Report'}
            </ExportButton>
          </span>
        </Tooltip>

        <Tooltip 
          title="Export as Excel spreadsheet" 
          arrow 
          placement="top"
          TransitionComponent={Zoom}
          TransitionProps={{ timeout: 300 }}
        >
          <span>
            <ExportButton
              exporttype="excel"
              startIcon={exporting ? <CircularProgress size={18} color="inherit" /> : <ExcelIcon />}
              onClick={handleExcelExport}
              disabled={exporting || getRecordCount() === 0}
            >
              {exporting ? 'Exporting...' : 'Excel Report'}
            </ExportButton>
          </span>
        </Tooltip>
      </Box>

      {/* Filter indicator if filters are applied */}
      {filters?.search && (
        <Box
          sx={{
            position: 'absolute',
            top: 8,
            right: 8,
            backgroundColor: '#15e420',
            borderRadius: '12px',
            padding: '2px 8px',
          }}
        >
          <Typography variant="caption" sx={{ color: 'white', fontWeight: 600 }}>
            Filtered
          </Typography>
        </Box>
      )}

      {/* Decorative element */}
      <Box
        sx={{
          position: 'absolute',
          bottom: 0,
          right: 0,
          width: '150px',
          height: '150px',
          background: 'radial-gradient(circle at 100% 100%, rgba(21, 228, 32, 0.05) 0%, transparent 70%)',
          pointerEvents: 'none',
          borderRadius: '50%',
          zIndex: 0,
        }}
      />

      {/* Decorative line */}
      <Box
        sx={{
          position: 'absolute',
          top: '50%',
          left: 0,
          width: '100%',
          height: '1px',
          background: 'linear-gradient(90deg, transparent, rgba(21, 228, 32, 0.2), transparent)',
          transform: 'translateY(-50%)',
          pointerEvents: 'none',
        }}
      />
    </ExportContainer>
  );
};

export default ReportExport;