import React from 'react';

export default function QuickCounts({ rpfpRecords = [], documentationReports = [] }) {
  const combined = [...rpfpRecords, ...documentationReports];

  const total = combined.length;
  const pending = combined.filter((r) => r.status === 'Pending').length;
  const reviewed = combined.filter((r) => r.status === 'Reviewed').length;
  const approved = combined.filter((r) => r.status === 'Approved').length;

  const card = (label, value, color = 'bg-white') => (
    <div className="bg-white rounded-lg shadow p-4 flex-1">
      <div className="text-xs text-gray-500">{label}</div>
      <div className="text-2xl font-semibold text-gray-800">{value}</div>
    </div>
  );

  return (
    <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
      {card('Total Records', total)}
      {card('Pending', pending)}
      {card('Reviewed', reviewed)}
      {card('Approved', approved)}
    </div>
  );
}
