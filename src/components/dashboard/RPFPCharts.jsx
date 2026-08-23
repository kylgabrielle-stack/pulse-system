import React, { useMemo } from 'react';
import BarChartCard from './BarChartCard';

function countBy(records, key) {
  const map = new Map();
  records.forEach((r) => {
    const val = r[key] || 'Unknown';
    map.set(val, (map.get(val) || 0) + 1);
  });
  return Array.from(map.entries()).map(([name, count]) => ({ name, count }));
}

export default function RPFPCharts({ rpfpRecords = [], includePendingReviewed = false }) {
  const filtered = useMemo(() => {
    if (includePendingReviewed) {
      return rpfpRecords.filter((r) => ['Approved', 'Pending', 'Reviewed'].includes(r.status));
    }
    return rpfpRecords.filter((r) => r.status === 'Approved');
  }, [rpfpRecords, includePendingReviewed]);

  const bySex = useMemo(() => countBy(filtered, 'sex'), [filtered]);
  const byAge = useMemo(() => countBy(filtered, 'ageBracket'), [filtered]);
  const byCivil = useMemo(() => countBy(filtered, 'civilStatus'), [filtered]);
  const byEducation = useMemo(() => countBy(filtered, 'educationLevel'), [filtered]);
  const byFPMethod = useMemo(() => countBy(filtered, 'fpMethod'), [filtered]);
  const byStatus = useMemo(() => countBy(filtered, 'status'), [filtered]);

  const cards = [
    { title: 'Participants by Sex', data: bySex },
    { title: 'Participants by Age Bracket', data: byAge },
    { title: 'Participants by Civil Status', data: byCivil },
    { title: 'Participants by Highest Educational Attainment', data: byEducation },
    { title: 'Participants by FP Method Used', data: byFPMethod },
    { title: 'Records by Status', data: byStatus }
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {cards.map((c) => (
        <div key={c.title} className="min-h-[220px]">
          <BarChartCard title={c.title} data={c.data} color="#2563eb" />
        </div>
      ))}
    </div>
  );
}
