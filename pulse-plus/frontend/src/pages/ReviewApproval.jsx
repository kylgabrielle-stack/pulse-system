import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';
import StatusBadge from '../components/StatusBadge.jsx';

export default function ReviewApproval() {
  const { user } = useAuth();
  const [queue, setQueue] = useState([]);
  const [error, setError] = useState('');
  const [remarksFor, setRemarksFor] = useState(null);
  const [remarksText, setRemarksText] = useState('');

  function load() {
    api.get('/reviews/queue').then(setQueue).catch((e) => setError(e.message));
  }

  useEffect(load, []);

  async function decide(record, action, remarks) {
    try {
      await api.post(`/reviews/${record.recordType}/${record.id}/decision`, { action, remarks });
      setQueue((q) => q.filter((r) => !(r.id === record.id && r.recordType === record.recordType)));
      setRemarksFor(null);
      setRemarksText('');
    } catch (e) {
      alert(e.message);
    }
  }

  const queueLabel = user.role === 'section_head' ? 'Awaiting Section Head Review' : 'Awaiting Population Officer Approval';

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Review &amp; Approval</h1>
          <p className="page-subtitle">{queueLabel}</p>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="panel">
        <table className="data-table">
          <thead>
            <tr>
              <th>Type</th>
              <th>Reference</th>
              <th>Municipality / Barangay</th>
              <th>Submitted</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {queue.map((r) => (
              <tr key={`${r.recordType}-${r.id}`}>
                <td>{r.recordType === 'docReport' ? 'Documentation Report' : 'RPFP Form 1'}</td>
                <td>{r.recordType === 'docReport' ? r.venue : r.participantName}</td>
                <td>{(r.recordType === 'docReport' ? r.cityMunicipality : r.municipality)} / {r.barangay}</td>
                <td>{new Date(r.updatedAt).toLocaleString()}</td>
                <td><StatusBadge status={r.status} /></td>
                <td className="row-actions">
                  <Link className="btn btn-sm" to={r.recordType === 'docReport' ? `/doc-reports/${r.id}` : `/rpfp/${r.id}`}>Open Details</Link>
                  <button className="btn btn-sm btn-primary" onClick={() => decide(r, 'approve', '')}>Approve</button>
                  <button className="btn btn-sm btn-danger" onClick={() => setRemarksFor(r)}>Reject</button>
                </td>
              </tr>
            ))}
            {queue.length === 0 && <tr><td colSpan={6} className="empty-cell">Nothing waiting in your queue.</td></tr>}
          </tbody>
        </table>
      </div>

      {remarksFor && (
        <div className="modal-backdrop" onClick={() => setRemarksFor(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Reject record</h3>
            <p>Remarks are required so the staff member knows what to correct.</p>
            <textarea rows={4} value={remarksText} onChange={(e) => setRemarksText(e.target.value)} placeholder="e.g. Missing signature consent, please re-check headcount..." />
            <div className="form-actions">
              <button className="btn btn-ghost" onClick={() => setRemarksFor(null)}>Cancel</button>
              <button className="btn btn-danger" disabled={!remarksText.trim()} onClick={() => decide(remarksFor, 'reject', remarksText.trim())}>Confirm Reject</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
