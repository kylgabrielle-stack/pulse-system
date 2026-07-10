import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../api.js';

const empty = {
  cityMunicipality: '', barangay: '', venue: '', seminarConducted: '', dateConducted: '',
  targetParticipants: '', actualParticipants: '', maleCount: '', femaleCount: '',
  age10to14: '', age15to19: '', age20plus: '', noOfSpeakers: '', nameOfSpeakers: [''],
  topicDiscussed: '', rating: '', activitiesUndertaken: [], personsResponsible: '',
  remarks: '', documentedBy: '',
};

export default function DocReportForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [constants, setConstants] = useState(null);
  const [form, setForm] = useState(empty);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get('/constants').then(setConstants).catch(() => {});
  }, []);

  useEffect(() => {
    if (!id) return;
    api.get(`/doc-reports/${id}`).then((r) => setForm({ ...empty, ...r, nameOfSpeakers: r.nameOfSpeakers?.length ? r.nameOfSpeakers : [''] })).catch((e) => setError(e.message));
  }, [id]);

  const barangayOptions = useMemo(() => {
    if (!constants) return [];
    return constants.barangays.filter((b) => !form.cityMunicipality || b.municipality === form.cityMunicipality);
  }, [constants, form.cityMunicipality]);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function toggleActivity(act) {
    setForm((f) => ({
      ...f,
      activitiesUndertaken: f.activitiesUndertaken.includes(act)
        ? f.activitiesUndertaken.filter((a) => a !== act)
        : [...f.activitiesUndertaken, act],
    }));
  }

  function updateSpeaker(i, value) {
    setForm((f) => {
      const speakers = [...f.nameOfSpeakers];
      speakers[i] = value;
      return { ...f, nameOfSpeakers: speakers };
    });
  }

  function addSpeaker() {
    setForm((f) => ({ ...f, nameOfSpeakers: [...f.nameOfSpeakers, ''] }));
  }

  function removeSpeaker(i) {
    setForm((f) => ({ ...f, nameOfSpeakers: f.nameOfSpeakers.filter((_, idx) => idx !== i) }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const payload = { ...form, nameOfSpeakers: form.nameOfSpeakers.filter(Boolean) };
      if (id) {
        await api.put(`/doc-reports/${id}`, payload);
        navigate(`/doc-reports/${id}`);
      } else {
        const created = await api.post('/doc-reports', payload);
        navigate(`/doc-reports/${created.id}`);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  if (!constants) return <div className="page-loading">Loading form...</div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>{id ? 'Edit' : 'New'} Documentation Report</h1>
          <p className="page-subtitle">Seminar / activity-level report. Saved as Pending until submitted for review.</p>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <form className="panel form-grid" onSubmit={handleSubmit}>
        <label>
          City/Municipality
          <select required value={form.cityMunicipality} onChange={(e) => update('cityMunicipality', e.target.value)}>
            <option value="">Select...</option>
            {constants.municipalities.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
        </label>
        <label>
          Barangay
          <select required value={form.barangay} onChange={(e) => update('barangay', e.target.value)}>
            <option value="">Select...</option>
            {barangayOptions.map((b) => <option key={b.id} value={b.barangay}>{b.barangay}</option>)}
          </select>
        </label>
        <label>
          Venue
          <input required value={form.venue} onChange={(e) => update('venue', e.target.value)} />
        </label>
        <label>
          Seminar Conducted
          <select required value={form.seminarConducted} onChange={(e) => update('seminarConducted', e.target.value)}>
            <option value="">Select...</option>
            {constants.seminarTypes.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </label>
        <label>
          Date Conducted
          <input type="date" required value={form.dateConducted} onChange={(e) => update('dateConducted', e.target.value)} />
        </label>
        <label>
          Target Participants
          <input type="number" min="0" value={form.targetParticipants} onChange={(e) => update('targetParticipants', e.target.value)} />
        </label>
        <label>
          Actual Participants
          <input type="number" min="0" value={form.actualParticipants} onChange={(e) => update('actualParticipants', e.target.value)} />
        </label>
        <label>
          Male Count
          <input type="number" min="0" value={form.maleCount} onChange={(e) => update('maleCount', e.target.value)} />
        </label>
        <label>
          Female Count
          <input type="number" min="0" value={form.femaleCount} onChange={(e) => update('femaleCount', e.target.value)} />
        </label>
        <label>
          Age 10-14
          <input type="number" min="0" value={form.age10to14} onChange={(e) => update('age10to14', e.target.value)} />
        </label>
        <label>
          Age 15-19
          <input type="number" min="0" value={form.age15to19} onChange={(e) => update('age15to19', e.target.value)} />
        </label>
        <label>
          Age 20+
          <input type="number" min="0" value={form.age20plus} onChange={(e) => update('age20plus', e.target.value)} />
        </label>
        <label>
          No. of Speakers
          <input type="number" min="0" value={form.noOfSpeakers} onChange={(e) => update('noOfSpeakers', e.target.value)} />
        </label>

        <div className="field-span-2">
          <label>Name of Speakers</label>
          {form.nameOfSpeakers.map((s, i) => (
            <div className="repeatable-row" key={i}>
              <input value={s} onChange={(e) => updateSpeaker(i, e.target.value)} placeholder={`Speaker ${i + 1}`} />
              {form.nameOfSpeakers.length > 1 && <button type="button" className="btn btn-sm btn-ghost" onClick={() => removeSpeaker(i)}>Remove</button>}
            </div>
          ))}
          <button type="button" className="btn btn-sm btn-secondary" onClick={addSpeaker}>+ Add speaker</button>
        </div>

        <label className="field-span-2">
          Topic Discussed
          <textarea value={form.topicDiscussed} onChange={(e) => update('topicDiscussed', e.target.value)} rows={2} />
        </label>

        <label>
          Rating
          <input value={form.rating} onChange={(e) => update('rating', e.target.value)} placeholder="Encoded as-is from paper form" />
        </label>

        <label>
          Persons Responsible
          <input value={form.personsResponsible} onChange={(e) => update('personsResponsible', e.target.value)} />
        </label>

        <div className="field-span-2">
          <label>Activities Undertaken</label>
          <div className="checkbox-grid">
            {constants.activitiesUndertaken.map((act) => (
              <label key={act} className="checkbox-item">
                <input type="checkbox" checked={form.activitiesUndertaken.includes(act)} onChange={() => toggleActivity(act)} />
                {act}
              </label>
            ))}
          </div>
        </div>

        <label className="field-span-2">
          Remarks
          <textarea value={form.remarks} onChange={(e) => update('remarks', e.target.value)} rows={2} />
        </label>

        <label>
          Documented by
          <select value={form.documentedBy} onChange={(e) => update('documentedBy', e.target.value)}>
            <option value="">Select...</option>
            {constants.personnel.map((p) => <option key={p.id} value={p.fullName}>{p.fullName}</option>)}
          </select>
        </label>

        <div className="field-span-2 form-actions">
          <button className="btn btn-primary" type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save as Pending'}</button>
          <button className="btn btn-ghost" type="button" onClick={() => navigate(-1)}>Cancel</button>
        </div>
      </form>
    </div>
  );
}
