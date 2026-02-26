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
  Chip
} from '@mui/material';

const PaymentsTable = ({ payments }) => {
  if (payments.length === 0) {
    return (
      <Typography align="center" sx={{ py: 4, color: '#666' }}>
        No payments data available
      </Typography>
    );
  }

  return (
    <TableContainer>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>S/N</TableCell>
            <TableCell>Company</TableCell>
            <TableCell>Amount</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Date</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {payments.slice(0, 10).map((payment, index) => (
            <TableRow key={payment.id}>
              <TableCell>{index + 1}</TableCell>
              <TableCell>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {payment.organizations?.company_name}
                </Typography>
              </TableCell>
              <TableCell>₦{payment.amount?.toLocaleString()}</TableCell>
              <TableCell>
                <Chip
                  label={payment.status}
                  size="small"
                  color={payment.status === 'approved' ? 'success' : 
                         payment.status === 'pending' ? 'warning' : 'error'}
                />
              </TableCell>
              <TableCell>{new Date(payment.created_at).toLocaleDateString()}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      
      {payments.length > 10 && (
        <Box sx={{ p: 2, textAlign: 'center' }}>
          <Typography variant="caption" sx={{ color: '#999' }}>
            Showing 10 of {payments.length} payments
          </Typography>
        </Box>
      )}
    </TableContainer>
  );
};

export default PaymentsTable;