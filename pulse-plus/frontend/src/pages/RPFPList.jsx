import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';
import StatusBadge from '../components/StatusBadge.jsx';

export default function RPFPList() {
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
    api.get(`/rpfp?${params.toString()}`).then(setRows).catch((e) => setError(e.message));
  }, [filters]);

  const barangayOptions = useMemo(() => {
    if (!constants) return [];
    return constants.barangays.filter((b) => !filters.municipality || b.municipality === filters.municipality);
  }, [constants, filters.municipality]);

  const civilStatusLabel = (code) => constants?.civilStatus.find((c) => c.code === code)?.label || code;

  async function handleSubmitForReview(id) {
    try {
      await api.post(`/rpfp/${id}/submit`);
      setRows((rs) => rs.map((r) => (r.id === id ? { ...r, status: 'For Review' } : r)));
    } catch (e) {
      alert(e.message);
    }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>RPFP Records</h1>
          <p className="page-subtitle">RPFP Form 1 participant-level records.</p>
        </div>
        {user.role === 'staff' && <Link className="btn btn-primary" to="/rpfp/new">+ New RPFP Form 1</Link>}
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
        <input placeholder="Search participant name..." value={filters.q} onChange={(e) => setFilters((f) => ({ ...f, q: e.target.value }))} />
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="panel">
        <table className="data-table">
          <thead>
            <tr>
              <th>Participant</th>
              <th>Municipality</th>
              <th>Barangay</th>
              <th>Sex</th>
              <th>Civil Status</th>
              <th>Age</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td>{r.participantName}</td>
                <td>{r.municipality}</td>
                <td>{r.barangay}</td>
                <td>{r.sex}</td>
                <td>{civilStatusLabel(r.civilStatusCode)}</td>
                <td>{r.age ?? '-'}</td>
                <td><StatusBadge status={r.status} /></td>
                <td className="row-actions">
                  <Link className="btn btn-sm" to={`/rpfp/${r.id}`}>Open Details</Link>
                  {user.role === 'staff' && r.status === 'Pending' && (
                    <>
                      <Link className="btn btn-sm btn-ghost" to={`/rpfp/${r.id}/edit`}>Edit</Link>
                      <button className="btn btn-sm btn-secondary" onClick={() => handleSubmitForReview(r.id)}>Submit</button>
                    </>
                  )}
                </td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td colSpan={8} className="empty-cell">No RPFP records found.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
