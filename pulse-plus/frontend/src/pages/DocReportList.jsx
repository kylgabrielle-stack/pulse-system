import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';
import StatusBadge from '../components/StatusBadge.jsx';

export default function DocReportList() {
  const { user } = useAuth();
  const [rows, setRows] = useState([]);
  const [constants, setConstants] = useState(null);
  const [filters, setFilters] = useState({ municipality: '', barangay: '', status: '', q: '' });
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/constants').then(setConstants).catch(() => {});
  }, []);

  useEffect(() => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => v && params.set(k, v));
    api.get(`/doc-reports?${params.toString()}`).then(setRows).catch((e) => setError(e.message));
  }, [filters]);

  const barangayOptions = useMemo(() => {
    if (!constants) return [];
    return constants.barangays.filter((b) => !filters.municipality || b.municipality === filters.municipality);
  }, [constants, filters.municipality]);

  async function handleSubmitForReview(id) {
    try {
      await api.post(`/doc-reports/${id}/submit`);
      setRows((rs) => rs.map((r) => (r.id === id ? { ...r, status: 'For Review' } : r)));
    } catch (e) {
      alert(e.message);
    }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Documentation Reports</h1>
          <p className="page-subtitle">Seminar / activity-level reports.</p>
        </div>
        {user.role === 'staff' && <Link className="btn btn-primary" to="/doc-reports/new">+ New Documentation Report</Link>}
      </div>

      <div className="filters-bar">
        <select value={filters.municipality} onChange={(e) => setFilters((f) => ({ ...f, municipality: e.target.value, barangay: '' }))}>
          <option value="">All Municipalities</option>
          {constants?.municipalities.map((m) => <option key={m} value={m}>{m}</option>)}
        </select>
        <select value={filters.barangay} onChange={(e) => setFilters((f) => ({ ...f, barangay: e.target.value }))}>
          <option value="">All Barangays</option>
          {barangayOptions.map((b) => <option key={b.id} value={b.barangay}>{b.barangay}</option>)}
        </select>
        <select value={filters.status} onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}>
          <option value="">All Statuses</option>
          {constants?.statuses.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <input placeholder="Search venue, seminar, topic..." value={filters.q} onChange={(e) => setFilters((f) => ({ ...f, q: e.target.value }))} />
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="panel">
        <table className="data-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Municipality</th>
              <th>Barangay</th>
              <th>Venue</th>
              <th>Seminar</th>
              <th>Participants</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td>{r.dateConducted}</td>
                <td>{r.cityMunicipality}</td>
                <td>{r.barangay}</td>
                <td>{r.venue}</td>
                <td>{r.seminarConducted}</td>
                <td>{r.actualParticipants}/{r.targetParticipants}</td>
                <td><StatusBadge status={r.status} /></td>
                <td className="row-actions">
                  <Link className="btn btn-sm" to={`/doc-reports/${r.id}`}>Open Details</Link>
                  {user.role === 'staff' && r.status === 'Pending' && (
                    <>
                      <Link className="btn btn-sm btn-ghost" to={`/doc-reports/${r.id}/edit`}>Edit</Link>
                      <button className="btn btn-sm btn-secondary" onClick={() => handleSubmitForReview(r.id)}>Submit</button>
                    </>
                  )}
                </td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td colSpan={8} className="empty-cell">No documentation reports found.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
