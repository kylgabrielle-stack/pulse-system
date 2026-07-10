import React from 'react';

const COLORS = {
  Pending: '#8a8f98',
  'For Review': '#c98a1c',
  'For Approval': '#2563eb',
  Approved: '#1a8a4a',
  Rejected: '#c62828',
};

export default function StatusBadge({ status }) {
  const color = COLORS[status] || '#8a8f98';
  return (
    <span className="status-badge" style={{ backgroundColor: `${color}1a`, color, borderColor: `${color}55` }}>
      {status}
    </span>
  );
}
