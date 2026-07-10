const express = require('express');
const { load, persist, nextId } = require('../db');
const { verifyToken, requireRole } = require('../middleware/auth');

const router = express.Router();
router.use(verifyToken);

function computeAge(birthdate) {
  if (!birthdate) return null;
  const b = new Date(birthdate);
  if (Number.isNaN(b.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - b.getFullYear();
  const m = now.getMonth() - b.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < b.getDate())) age--;
  return age;
}

router.get('/', (req, res) => {
  const db = load();
  let rows = db.rpfpRecords;
  const { municipality, barangay, dateFrom, dateTo, status, q } = req.query;
  if (municipality) rows = rows.filter((r) => r.municipality === municipality);
  if (barangay) rows = rows.filter((r) => r.barangay === barangay);
  if (status) rows = rows.filter((r) => r.status === status);
  if (dateFrom) rows = rows.filter((r) => r.createdAt.slice(0, 10) >= dateFrom);
  if (dateTo) rows = rows.filter((r) => r.createdAt.slice(0, 10) <= dateTo);
  if (q) {
    const needle = q.toLowerCase();
    rows = rows.filter((r) => (r.participantName || '').toLowerCase().includes(needle));
  }
  res.json(rows.slice().sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)));
});

router.get('/:id', (req, res) => {
  const db = load();
  const record = db.rpfpRecords.find((r) => r.id === Number(req.params.id));
  if (!record) return res.status(404).json({ error: 'RPFP Form 1 record not found' });
  const history = db.reviewLogs.filter((l) => l.recordType === 'rpfp' && l.recordId === record.id);
  res.json({ ...record, history });
});

router.post('/', requireRole('staff'), (req, res) => {
  const db = load();
  const b = req.body || {};
  const required = ['municipality', 'barangay', 'participantName', 'sex', 'civilStatusCode', 'birthdate'];
  for (const f of required) {
    if (!b[f]) return res.status(400).json({ error: `Field "${f}" is required` });
  }
  const record = {
    id: nextId(db, 'rpfpRecords'),
    municipality: b.municipality,
    barangay: b.barangay,
    participantName: b.participantName,
    sex: b.sex,
    civilStatusCode: b.civilStatusCode,
    birthdate: b.birthdate,
    age: computeAge(b.birthdate),
    address: b.address || '',
    householdId: b.householdId || '',
    educationCode: b.educationCode || '',
    noOfChildren: Number(b.noOfChildren) || 0,
    fpMethodCode: b.fpMethodCode || '',
    intentionToShift: b.intentionToShift || '',
    traditionalFpTypeCode: b.traditionalFpTypeCode || '',
    nonModernStatusCode: b.nonModernStatusCode || '',
    reasonCode: b.reasonCode || '',
    consentChecked: !!b.consentChecked,
    consentTimestamp: b.consentChecked ? new Date().toISOString() : null,
    preparedBy: b.preparedBy || '',
    reviewedBy: '',
    approvedBy: '',
    status: 'Pending',
    createdBy: req.user.id,
    createdByName: req.user.fullName,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  db.rpfpRecords.push(record);
  persist();
  res.status(201).json(record);
});

router.put('/:id', requireRole('staff'), (req, res) => {
  const db = load();
  const record = db.rpfpRecords.find((r) => r.id === Number(req.params.id));
  if (!record) return res.status(404).json({ error: 'RPFP Form 1 record not found' });
  if (record.status !== 'Pending') return res.status(400).json({ error: 'Only records with Pending status can be edited' });
  const b = req.body || {};
  const editable = [
    'municipality', 'barangay', 'participantName', 'sex', 'civilStatusCode', 'birthdate', 'address', 'householdId',
    'educationCode', 'noOfChildren', 'fpMethodCode', 'intentionToShift', 'traditionalFpTypeCode', 'nonModernStatusCode',
    'reasonCode', 'consentChecked', 'preparedBy',
  ];
  editable.forEach((f) => { if (b[f] !== undefined) record[f] = b[f]; });
  if (b.birthdate) record.age = computeAge(b.birthdate);
  if (b.consentChecked && !record.consentTimestamp) record.consentTimestamp = new Date().toISOString();
  record.updatedAt = new Date().toISOString();
  persist();
  res.json(record);
});

router.post('/:id/submit', requireRole('staff'), (req, res) => {
  const db = load();
  const record = db.rpfpRecords.find((r) => r.id === Number(req.params.id));
  if (!record) return res.status(404).json({ error: 'RPFP Form 1 record not found' });
  if (record.status !== 'Pending') return res.status(400).json({ error: 'Only Pending records can be submitted for review' });
  record.status = 'For Review';
  record.updatedAt = new Date().toISOString();
  db.reviewLogs.push({
    id: nextId(db, 'reviewLogs'), recordType: 'rpfp', recordId: record.id, action: 'Submitted for Review',
    remarks: '', reviewerId: req.user.id, reviewerName: req.user.fullName, createdAt: new Date().toISOString(),
  });
  persist();
  res.json(record);
});

router.delete('/:id', requireRole('staff', 'admin'), (req, res) => {
  const db = load();
  const record = db.rpfpRecords.find((r) => r.id === Number(req.params.id));
  if (!record) return res.status(404).json({ error: 'RPFP Form 1 record not found' });
  if (record.status !== 'Pending' && req.user.role !== 'admin') {
    return res.status(400).json({ error: 'Only Pending records can be deleted' });
  }
  db.rpfpRecords = db.rpfpRecords.filter((r) => r.id !== record.id);
  persist();
  res.status(204).end();
});

module.exports = router;
