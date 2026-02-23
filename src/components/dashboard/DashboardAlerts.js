import React from 'react';

const DashboardAlerts = ({ alert }) => {
  if (!alert) return null;

  return (
    <div className={`mui-alert mui-alert-${alert.type}`}>
      <span className="material-icons mui-alert-icon">
        {alert.type === 'success' ? '' : alert.type === 'info' ? 'info' : 'error'}
      </span>
      <span>{alert.message}</span>
    </div>
  );
};

export default DashboardAlerts;