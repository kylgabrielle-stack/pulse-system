import React, { useMemo } from 'react';
import BarChartCard from './BarChartCard';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';

function sumBy(records, key) {
  return records.reduce((acc, r) => acc + (Number(r[key]) || 0), 0);
}

export default function DocumentationCharts({ documentationReports = [], includePendingReviewed = false }) {
  const filtered = useMemo(() => {
    if (includePendingReviewed) {
      return documentationReports.filter((r) => ['Approved', 'Pending', 'Reviewed'].includes(r.status));
    }
    return documentationReports.filter((r) => r.status === 'Approved');
  }, [documentationReports, includePendingReviewed]);

  const participantsBySex = useMemo(() => {
    const male = sumBy(filtered, 'maleCount');
    const female = sumBy(filtered, 'femaleCount');
    return [
      { name: 'Male', count: male },
      { name: 'Female', count: female }
    ];
  }, [filtered]);

  const participantsByAge = useMemo(() => {
    const a10 = sumBy(filtered, 'ageBracket1014');
    const a15 = sumBy(filtered, 'ageBracket1519');
    const a20 = sumBy(filtered, 'ageBracket20plus');
    return [
      { name: '10-14', count: a10 },
      { name: '15-19', count: a15 },
      { name: '20+', count: a20 }
    ];
  }, [filtered]);

  const activitiesFrequency = useMemo(() => {
    const map = new Map();
    filtered.forEach((r) => {
      (r.activitiesUndertaken || []).forEach((act) => {
        map.set(act, (map.get(act) || 0) + 1);
      });
    });
    return Array.from(map.entries()).map(([name, count]) => ({ name, count }));
  }, [filtered]);

  const activitiesBySeminarType = useMemo(() => {
    const map = new Map();
    filtered.forEach((r) => {
      const k = r.seminarType || 'Unknown';
      map.set(k, (map.get(k) || 0) + ((r.activitiesUndertaken || []).length));
    });
    return Array.from(map.entries()).map(([name, count]) => ({ name, count }));
  }, [filtered]);

  const referralsByMunicipality = useMemo(() => {
    const map = new Map();
    filtered.forEach((r) => {
      const k = r.municipality || 'Unknown';
      map.set(k, (map.get(k) || 0) + (Number(r.referralsCount) || 0));
    });
    return Array.from(map.entries()).map(([name, count]) => ({ name, count }));
  }, [filtered]);

  const recordsByStatus = useMemo(() => {
    const map = new Map();
    filtered.forEach((r) => {
      const k = r.status || 'Unknown';
      map.set(k, (map.get(k) || 0) + 1);
    });
    return Array.from(map.entries()).map(([name, count]) => ({ name, count }));
  }, [filtered]);

  const targetVsActual = useMemo(() => {
    // Aggregate by seminarType to create paired bars
    const map = new Map();
    filtered.forEach((r) => {
      const k = r.seminarType || 'Unknown';
      const cur = map.get(k) || { name: k, target: 0, actual: 0 };
      cur.target += Number(r.targetParticipants) || 0;
      cur.actual += Number(r.actualParticipants) || 0;
      map.set(k, cur);
    });
    return Array.from(map.values());
  }, [filtered]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="text-sm font-medium text-gray-700 mb-2">Target vs Actual Participants</h3>
        <div className="h-56">
          {targetVsActual.length ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={targetVsActual} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="target" name="Target" fill="#93c5fd" />
                <Bar dataKey="actual" name="Actual" fill="#2563eb" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-gray-500">No data for this selection</div>
          )}
        </div>
      </div>

      <div className="min-h-[220px]"><BarChartCard title="Participants by Sex" data={participantsBySex} color="#2563eb" /></div>

      <div className="min-h-[220px]"><BarChartCard title="Participants by Age Bracket" data={participantsByAge} color="#2563eb" /></div>

      <div className="min-h-[220px]"><BarChartCard title="Activities by Seminar Type" data={activitiesBySeminarType} color="#2563eb" /></div>

      <div className="min-h-[220px]"><BarChartCard title="Activities Undertaken Frequency" data={activitiesFrequency} color="#2563eb" /></div>

      <div className="min-h-[220px]"><BarChartCard title="Referrals Made" data={referralsByMunicipality} color="#2563eb" /></div>

      <div className="min-h-[220px]"><BarChartCard title="Records by Status" data={recordsByStatus} color="#2563eb" /></div>
    </div>
  );
}
