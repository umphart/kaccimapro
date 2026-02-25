import React from 'react';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Paper
} from '@mui/material';
import { styled } from '@mui/material/styles';

const HighlightedText = styled('span')({
  backgroundColor: 'rgba(21, 228, 32, 0.2)',
  fontWeight: 600,
  padding: '2px 4px',
  borderRadius: '4px',
});

const OrganizationsTable = ({ organizations, searchTerm }) => {
  if (organizations.length === 0) {
    return (
      <Typography align="center" sx={{ py: 4, color: '#666' }}>
        No organizations data available
        {searchTerm ? ' matching your search' : ''}
      </Typography>
    );
  }

  const highlightText = (text, search) => {
    if (!search || !text) return text;
    const parts = text.toString().split(new RegExp(`(${search})`, 'gi'));
    return parts.map((part, index) => 
      part.toLowerCase() === search.toLowerCase() ? 
        <HighlightedText key={index}>{part}</HighlightedText> : 
        part
    );
  };

  return (
    <TableContainer>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>S/N</TableCell>
            <TableCell>Company Name</TableCell>
            <TableCell>Phone</TableCell>
            <TableCell>Address</TableCell>
            <TableCell>Contact Person</TableCell>
            <TableCell>Rep.</TableCell>
            <TableCell>Business Nature</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {organizations.slice(0, 10).map((org, index) => (
            <TableRow key={org.id}>
              <TableCell>{index + 1}</TableCell>
              <TableCell>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {highlightText(org.company_name, searchTerm)}
                </Typography>
              </TableCell>
              <TableCell>{highlightText(org.phone_number || 'N/A', searchTerm)}</TableCell>
              <TableCell>{highlightText(org.office_address || 'N/A', searchTerm)}</TableCell>
              <TableCell>{highlightText(org.contact_person || 'N/A', searchTerm)}</TableCell>
              <TableCell>{highlightText(org.representative || 'N/A', searchTerm)}</TableCell>
              <TableCell>
                <Chip
                  label={org.business_nature || 'N/A'}
                  size="small"
                  sx={{
                    maxWidth: '150px',
                    backgroundColor: '#e8f5e9',
                    color: '#15e420',
                    fontSize: '0.7rem'
                  }}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      
      {organizations.length > 10 && (
        <Box sx={{ p: 2, textAlign: 'center' }}>
          <Typography variant="caption" sx={{ color: '#999' }}>
            Showing 10 of {organizations.length} organizations
          </Typography>
        </Box>
      )}
    </TableContainer>
  );
};

export default OrganizationsTable;