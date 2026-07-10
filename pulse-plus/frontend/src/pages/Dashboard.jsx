import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';

export default function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/dashboard').then(setData).catch((e) => setError(e.message));
  }, []);

  if (error) return <div className="alert alert-error">{error}</div>;
  if (!data) return <div className="page-loading">Loading dashboard...</div>;

  const cards = [
    { label: 'Total Records', value: data.overall.total, tone: 'default' },
    { label: 'Pending', value: data.overall.pending, tone: 'pending' },
    { label: 'For Review', value: data.overall.forReview, tone: 'review' },
    { label: 'For Approval', value: data.overall.forApproval, tone: 'approval' },
    { label: 'Approved', value: data.overall.approved, tone: 'approved' },
  ];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Dashboard</h1>
          <p className="page-subtitle">Overview of RPFP documentation across the province.</p>
        </div>
        <div className="page-actions">
          {user.role === 'staff' && (
            <>
              <Link className="btn btn-primary" to="/doc-reports/new">+ Documentation Report</Link>
              <Link className="btn btn-secondary" to="/rpfp/new">+ RPFP Form 1</Link>
            </>
          )}
        </div>
      </div>

      <div className="stat-grid">
        {cards.map((c) => (
          <div key={c.label} className={`stat-card tone-${c.tone}`}>
            <div className="stat-value">{c.value}</div>
            <div className="stat-label">{c.label}</div>
          </div>
        ))}
      </div>

      <div className="panel">
        <h2>By Municipality</h2>
        <table className="data-table">
          <thead>
            <tr>
              <th>Municipality</th>
              <th>Total</th>
              <th>Pending</th>
              <th>For Review</th>
              <th>For Approval</th>
              <th>Approved</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(data.byMunicipality).map(([muni, s]) => (
              <tr key={muni}>
                <td>{muni}</td>
                <td>{s.total}</td>
                <td>{s.pending}</td>
                <td>{s.forReview}</td>
                <td>{s.forApproval}</td>
                <td>{s.approved}</td>
              </tr>
            ))}
            {Object.keys(data.byMunicipality).length === 0 && (
              <tr><td colSpan={6} className="empty-cell">No records yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="two-col">
        <div className="panel">
          <h2>Documentation Reports</h2>
          <p>Total: {data.docReports.total}</p>
          <ul className="mini-list">
            {Object.entries(data.docReports.byStatus).map(([k, v]) => (
              <li key={k}><span>{k}</span><span>{v}</span></li>
            ))}
          </ul>
        </div>
        <div className="panel">
          <h2>RPFP Form 1 Records</h2>
          <p>Total: {data.rpfpRecords.total}</p>
          <ul className="mini-list">
            {Object.entries(data.rpfpRecords.byStatus).map(([k, v]) => (
              <li key={k}><span>{k}</span><span>{v}</span></li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
