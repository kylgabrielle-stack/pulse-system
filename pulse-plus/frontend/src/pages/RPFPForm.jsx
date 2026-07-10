import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../api.js';

const empty = {
  municipality: '', barangay: '', participantName: '', sex: '', civilStatusCode: '', birthdate: '',
  address: '', householdId: '', educationCode: '', noOfChildren: '', fpMethodCode: '', intentionToShift: '',
  traditionalFpTypeCode: '', nonModernStatusCode: '', reasonCode: '', consentChecked: false, preparedBy: '',
};

export default function RPFPForm() {
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
    api.get(`/rpfp/${id}`).then((r) => setForm({ ...empty, ...r })).catch((e) => setError(e.message));
  }, [id]);

  const barangayOptions = useMemo(() => {
    if (!constants) return [];
    return constants.barangays.filter((b) => !form.municipality || b.municipality === form.municipality);
  }, [constants, form.municipality]);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      if (id) {
        await api.put(`/rpfp/${id}`, form);
        navigate(`/rpfp/${id}`);
      } else {
        const created = await api.post('/rpfp', form);
        navigate(`/rpfp/${created.id}`);
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
          <h1>{id ? 'Edit' : 'New'} RPFP Form 1</h1>
          <p className="page-subtitle">Participant/couple record. Saved as Pending until submitted for review.</p>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <form className="panel form-grid" onSubmit={handleSubmit}>
        <label>
          Municipality
          <select required value={form.municipality} onChange={(e) => update('municipality', e.target.value)}>
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
          Name of Participant/Couple
          <input required value={form.participantName} onChange={(e) => update('participantName', e.target.value)} />
        </label>
        <label>
          Sex
          <select required value={form.sex} onChange={(e) => update('sex', e.target.value)}>
            <option value="">Select...</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
          </select>
        </label>
        <label>
          Civil Status
          <select required value={form.civilStatusCode} onChange={(e) => update('civilStatusCode', e.target.value)}>
            <option value="">Select...</option>
            {constants.civilStatus.map((c) => <option key={c.code} value={c.code}>{c.label}</option>)}
          </select>
        </label>
        <label>
          Birthdate (age auto-computed)
          <input type="date" required value={form.birthdate} onChange={(e) => update('birthdate', e.target.value)} />
        </label>
        <label className="field-span-2">
          Address / Household ID Number
          <input value={form.address} onChange={(e) => update('address', e.target.value)} placeholder="Address" />
        </label>
        <label>
          Household ID Number
          <input value={form.householdId} onChange={(e) => update('householdId', e.target.value)} />
        </label>
        <label>
          Highest Educational Attainment
          <select value={form.educationCode} onChange={(e) => update('educationCode', e.target.value)}>
            <option value="">Select...</option>
            {constants.education.map((c) => <option key={c.code} value={c.code}>{c.label}</option>)}
          </select>
        </label>
        <label>
          No. of Children
          <input type="number" min="0" value={form.noOfChildren} onChange={(e) => update('noOfChildren', e.target.value)} />
        </label>
        <label>
          Modern FP Method Used
          <select value={form.fpMethodCode} onChange={(e) => update('fpMethodCode', e.target.value)}>
            <option value="">None / not applicable</option>
            {constants.fpMethods.map((m) => <option key={m.id} value={m.code}>{m.label} ({m.category})</option>)}
          </select>
        </label>
        <label>
          Intention to shift to other FP Method
          <select value={form.intentionToShift} onChange={(e) => update('intentionToShift', e.target.value)}>
            <option value="">Select...</option>
            <option value="No">No</option>
            <option value="Yes">Yes</option>
          </select>
        </label>
        <label>
          Traditional FP User Type
          <select value={form.traditionalFpTypeCode} onChange={(e) => update('traditionalFpTypeCode', e.target.value)}>
            <option value="">None / not applicable</option>
            {constants.traditionalFpType.map((c) => <option key={c.code} value={c.code}>{c.label}</option>)}
          </select>
        </label>
        <label>
          Non-Modern FP User Status
          <select value={form.nonModernStatusCode} onChange={(e) => update('nonModernStatusCode', e.target.value)}>
            <option value="">Not applicable</option>
            {constants.nonModernStatus.map((c) => <option key={c.code} value={c.code}>{c.code} - {c.label}</option>)}
          </select>
        </label>
        <label>
          Reason for Using FP / Intending to Use
          <select value={form.reasonCode} onChange={(e) => update('reasonCode', e.target.value)}>
            <option value="">Select...</option>
            {constants.reasonForUsing.map((c) => <option key={c.code} value={c.code}>{c.label}</option>)}
          </select>
        </label>
        <label>
          Prepared by
          <select value={form.preparedBy} onChange={(e) => update('preparedBy', e.target.value)}>
            <option value="">Select...</option>
            {constants.personnel.map((p) => <option key={p.id} value={p.fullName}>{p.fullName}</option>)}
          </select>
        </label>

        <div className="field-span-2 consent-box">
          <label className="checkbox-item">
            <input type="checkbox" checked={form.consentChecked} onChange={(e) => update('consentChecked', e.target.checked)} />
            Participant's Signature Consent (timestamped in place of a full e-signature)
          </label>
        </div>

        <div className="field-span-2 form-actions">
          <button className="btn btn-primary" type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save as Pending'}</button>
          <button className="btn btn-ghost" type="button" onClick={() => navigate(-1)}>Cancel</button>
        </div>
      </form>
    </div>
  );
}
