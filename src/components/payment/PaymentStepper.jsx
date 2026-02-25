import React from 'react';
import { Paper, Typography, Stepper, Step, StepLabel, StepContent } from '@mui/material';
import { Payment as PaymentIcon } from '@mui/icons-material';

const PaymentStepper = ({ activeStep, steps, isMobile }) => {
  return (
    <Paper sx={{ p: 3, borderRadius: '16px', mb: 4 }}>
      <Typography variant="h6" sx={{ fontWeight: 600, mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
        <PaymentIcon sx={{ color: '#15e420' }} /> Payment Process
      </Typography>
      
      <Stepper activeStep={activeStep} orientation={isMobile ? 'vertical' : 'horizontal'}>
        {steps.map((step, index) => (
          <Step key={step.label}>
            <StepLabel>
              <Typography sx={{ fontWeight: 600 }}>{step.label}</Typography>
            </StepLabel>
            {isMobile && (
              <StepContent>
                <Typography sx={{ color: '#666', mb: 2 }}>{step.description}</Typography>
              </StepContent>
            )}
          </Step>
        ))}
      </Stepper>
    </Paper>
  );
};

export default PaymentStepper;