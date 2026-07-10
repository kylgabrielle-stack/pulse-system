import React, { useEffect, useState } from 'react';
import { api } from '../api.js';

function currentMonth() {
  return new Date().toISOString().slice(0, 7);
}

export default function MonthlySummary() {
  const [month, setMonth] = useState(currentMonth());
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState('');
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    api.get(`/summary?month=${month}`).then(setSummary).catch((e) => setError(e.message));
  }, [month]);

  async function handleDownload() {
    setDownloading(true);
    try {
      await api.downloadPdf(`/summary/pdf?month=${month}`);
    } catch (e) {
      alert(e.message);
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Monthly Summary</h1>
          <p className="page-subtitle">Auto-generated from approved records only &mdash; no manual re-tallying. For submission to POPCOM Region 4A by the 15th of the month.</p>
        </div>
        <div className="page-actions">
          <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} />
          <button className="btn btn-primary" onClick={handleDownload} disabled={downloading}>{downloading ? 'Generating...' : 'Export PDF'}</button>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {!summary ? (
        <div className="page-loading">Loading summary...</div>
      ) : (
        <>
          <div className="stat-grid">
            <div className="stat-card tone-approved">
              <div className="stat-value">{summary.totals.rpfpParticipants}</div>
              <div className="stat-label">Approved RPFP Participants</div>
            </div>
            <div className="stat-card tone-approved">
              <div className="stat-value">{summary.totals.seminarsHeld}</div>
              <div className="stat-label">Approved Seminars/Activities</div>
            </div>
          </div>

          <div className="panel">
            <h2>RPFP Form 1 &ndash; by Municipality / Barangay</h2>
            <table className="data-table">
              <thead>
                <tr><th>Municipality</th><th>Barangay</th><th>Total</th><th>Male</th><th>Female</th><th>Modern FP Users</th><th>Traditional FP Users</th></tr>
              </thead>
              <tbody>
                {summary.rpfpRows.map((r, i) => (
                  <tr key={i}>
                    <td>{r.municipality}</td><td>{r.barangay}</td><td>{r.total}</td><td>{r.male}</td><td>{r.female}</td>
                    <td>{r.modernFpUsers}</td><td>{r.traditionalFpUsers}</td>
                  </tr>
                ))}
                {summary.rpfpRows.length === 0 && <tr><td colSpan={7} className="empty-cell">No approved RPFP records this month.</td></tr>}
              </tbody>
            </table>
          </div>

          <div className="panel">
            <h2>Documentation Reports &ndash; by Municipality / Barangay</h2>
            <table className="data-table">
              <thead>
                <tr><th>Municipality</th><th>Barangay</th><th>Seminars Held</th><th>Target</th><th>Actual</th><th>Male</th><th>Female</th></tr>
              </thead>
              <tbody>
                {summary.docReportRows.map((r, i) => (
                  <tr key={i}>
                    <td>{r.municipality}</td><td>{r.barangay}</td><td>{r.seminarsHeld}</td>
                    <td>{r.targetParticipants}</td><td>{r.actualParticipants}</td><td>{r.male}</td><td>{r.female}</td>
                  </tr>
                ))}
                {summary.docReportRows.length === 0 && <tr><td colSpan={7} className="empty-cell">No approved documentation reports this month.</td></tr>}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
