import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { api } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';
import StatusBadge from '../components/StatusBadge.jsx';

export default function RecordDetails({ type }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [record, setRecord] = useState(null);
  const [constants, setConstants] = useState(null);
  const [error, setError] = useState('');

  const base = type === 'docReport' ? '/doc-reports' : '/rpfp';

  useEffect(() => {
    api.get('/constants').then(setConstants).catch(() => {});
    api.get(`${base}/${id}`).then(setRecord).catch((e) => setError(e.message));
  }, [id, type]);

  async function handleSubmit() {
    try {
      const updated = await api.post(`${base}/${id}/submit`);
      setRecord((r) => ({ ...r, ...updated }));
    } catch (e) {
      alert(e.message);
    }
  }

  if (error) return <div className="alert alert-error">{error}</div>;
  if (!record || !constants) return <div className="page-loading">Loading record...</div>;

  const lookup = (list, code) => list.find((c) => c.code === code)?.label || (code || '-');

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>{type === 'docReport' ? 'Documentation Report' : 'RPFP Form 1 Record'}</h1>
          <p className="page-subtitle">
            <StatusBadge status={record.status} />
          </p>
        </div>
        <div className="page-actions">
          <Link className="btn btn-ghost" to={base}>Back to list</Link>
          {user.role === 'staff' && record.status === 'Pending' && (
            <>
              <Link className="btn btn-secondary" to={`${base}/${id}/edit`}>Edit</Link>
              <button className="btn btn-primary" onClick={handleSubmit}>Submit for Review</button>
            </>
          )}
        </div>
      </div>

      <div className="panel">
        <h2>Details</h2>
        {type === 'docReport' ? (
          <div className="detail-grid">
            <Detail label="City/Municipality" value={record.cityMunicipality} />
            <Detail label="Barangay" value={record.barangay} />
            <Detail label="Venue" value={record.venue} />
            <Detail label="Seminar Conducted" value={record.seminarConducted} />
            <Detail label="Date Conducted" value={record.dateConducted} />
            <Detail label="Target / Actual Participants" value={`${record.targetParticipants} / ${record.actualParticipants}`} />
            <Detail label="Male / Female" value={`${record.maleCount} / ${record.femaleCount}`} />
            <Detail label="Age 10-14 / 15-19 / 20+" value={`${record.age10to14} / ${record.age15to19} / ${record.age20plus}`} />
            <Detail label="No. of Speakers" value={record.noOfSpeakers} />
            <Detail label="Name of Speakers" value={(record.nameOfSpeakers || []).join(', ') || '-'} />
            <Detail label="Topic Discussed" value={record.topicDiscussed} full />
            <Detail label="Rating" value={record.rating} />
            <Detail label="Activities Undertaken" value={(record.activitiesUndertaken || []).join(', ') || '-'} full />
            <Detail label="Persons Responsible" value={record.personsResponsible} />
            <Detail label="Remarks" value={record.remarks} full />
            <Detail label="Documented by" value={record.documentedBy} />
            <Detail label="Reviewed by" value={record.reviewedBy || '-'} />
            <Detail label="Approved by" value={record.approvedBy || '-'} />
          </div>
        ) : (
          <div className="detail-grid">
            <Detail label="Municipality" value={record.municipality} />
            <Detail label="Barangay" value={record.barangay} />
            <Detail label="Participant" value={record.participantName} />
            <Detail label="Sex" value={record.sex} />
            <Detail label="Civil Status" value={lookup(constants.civilStatus, record.civilStatusCode)} />
            <Detail label="Birthdate / Age" value={`${record.birthdate} (${record.age ?? '-'})`} />
            <Detail label="Address" value={record.address} />
            <Detail label="Household ID" value={record.householdId} />
            <Detail label="Education" value={lookup(constants.education, record.educationCode)} />
            <Detail label="No. of Children" value={record.noOfChildren} />
            <Detail label="Modern FP Method Used" value={constants.fpMethods.find((m) => m.code === record.fpMethodCode)?.label || '-'} />
            <Detail label="Intention to Shift" value={record.intentionToShift || '-'} />
            <Detail label="Traditional FP User Type" value={lookup(constants.traditionalFpType, record.traditionalFpTypeCode)} />
            <Detail label="Non-Modern FP User Status" value={lookup(constants.nonModernStatus, record.nonModernStatusCode)} />
            <Detail label="Reason for Using FP" value={lookup(constants.reasonForUsing, record.reasonCode)} />
            <Detail label="Consent" value={record.consentChecked ? `Given at ${new Date(record.consentTimestamp).toLocaleString()}` : 'Not given'} full />
            <Detail label="Prepared by" value={record.preparedBy} />
            <Detail label="Reviewed by" value={record.reviewedBy || '-'} />
            <Detail label="Approved by" value={record.approvedBy || '-'} />
          </div>
        )}
      </div>

      <div className="panel">
        <h2>Approval History</h2>
        {record.history && record.history.length > 0 ? (
          <ul className="timeline">
            {record.history.map((h) => (
              <li key={h.id}>
                <div className="timeline-title">{h.action}</div>
                <div className="timeline-meta">{h.reviewerName} &middot; {new Date(h.createdAt).toLocaleString()}</div>
                {h.remarks && <div className="timeline-remarks">"{h.remarks}"</div>}
              </li>
            ))}
          </ul>
        ) : (
          <p className="empty-cell">No review activity yet.</p>
        )}
      </div>
    </div>
  );
}

function Detail({ label, value, full }) {
  return (
    <div className={full ? 'detail-item full' : 'detail-item'}>
      <div className="detail-label">{label}</div>
      <div className="detail-value">{value === '' || value === undefined || value === null ? '-' : String(value)}</div>
    </div>
  );
}
