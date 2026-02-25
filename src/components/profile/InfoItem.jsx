import React from 'react';
import { Box, Typography } from '@mui/material';
import { motion } from 'framer-motion';
import { styled } from '@mui/material/styles';

const ItemContainer = styled(motion.div)({
  display: 'flex',
  alignItems: 'flex-start',
  gap: '12px',
  padding: '10px 12px',
  borderRadius: '10px',
  background: '#f8f9fa',
  transition: 'all 0.2s ease',
  '&:hover': {
    background: '#f0f0f0',
    transform: 'translateX(4px)'
  }
});

const IconWrapper = styled(Box)({
  width: '32px',
  height: '32px',
  borderRadius: '8px',
  background: 'rgba(21, 228, 32, 0.1)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: '#15e420',
  flexShrink: 0,
  '& svg': {
    fontSize: '1rem'
  }
});

const ContentWrapper = styled(Box)({
  flex: 1,
  minWidth: 0
});

const Label = styled(Typography)({
  fontSize: '0.7rem',
  color: '#666',
  textTransform: 'uppercase',
  letterSpacing: '0.3px',
  fontWeight: 500,
  marginBottom: '2px'
});

const Value = styled(Typography)({
  fontSize: '0.85rem',
  color: '#333',
  fontWeight: 500,
  wordBreak: 'break-word',
  lineHeight: 1.4
});

const InfoItem = ({ icon, label, value, delay = 0 }) => {
  return (
    <ItemContainer
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay }}
    >
      <IconWrapper>
        {icon}
      </IconWrapper>
      <ContentWrapper>
        <Label variant="caption">{label}</Label>
        <Value variant="body2">{value}</Value>
      </ContentWrapper>
    </ItemContainer>
  );
};

export default InfoItem;