const express = require('express');
const { load, persist, nextId } = require('../db');
const { verifyToken, requireRole } = require('../middleware/auth');

const router = express.Router();
router.use(verifyToken);

// List with filters: municipality, barangay, dateFrom, dateTo, status, q (search)
router.get('/', (req, res) => {
  const db = load();
  let rows = db.docReports;
  const { municipality, barangay, dateFrom, dateTo, status, q } = req.query;
  if (municipality) rows = rows.filter((r) => r.cityMunicipality === municipality);
  if (barangay) rows = rows.filter((r) => r.barangay === barangay);
  if (status) rows = rows.filter((r) => r.status === status);
  if (dateFrom) rows = rows.filter((r) => r.dateConducted >= dateFrom);
  if (dateTo) rows = rows.filter((r) => r.dateConducted <= dateTo);
  if (q) {
    const needle = q.toLowerCase();
    rows = rows.filter((r) =>
      [r.venue, r.seminarConducted, r.topicDiscussed].filter(Boolean).some((f) => f.toLowerCase().includes(needle))
    );
  }
  res.json(rows.slice().sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)));
});

router.get('/:id', (req, res) => {
  const db = load();
  const record = db.docReports.find((r) => r.id === Number(req.params.id));
  if (!record) return res.status(404).json({ error: 'Documentation Report not found' });
  const history = db.reviewLogs.filter((l) => l.recordType === 'docReport' && l.recordId === record.id);
  res.json({ ...record, history });
});

router.post('/', requireRole('staff'), (req, res) => {
  const db = load();
  const b = req.body || {};
  const required = ['cityMunicipality', 'barangay', 'venue', 'seminarConducted', 'dateConducted'];
  for (const f of required) {
    if (!b[f]) return res.status(400).json({ error: `Field "${f}" is required` });
  }
  const record = {
    id: nextId(db, 'docReports'),
    cityMunicipality: b.cityMunicipality,
    barangay: b.barangay,
    venue: b.venue,
    seminarConducted: b.seminarConducted,
    dateConducted: b.dateConducted,
    targetParticipants: Number(b.targetParticipants) || 0,
    actualParticipants: Number(b.actualParticipants) || 0,
    maleCount: Number(b.maleCount) || 0,
    femaleCount: Number(b.femaleCount) || 0,
    age10to14: Number(b.age10to14) || 0,
    age15to19: Number(b.age15to19) || 0,
    age20plus: Number(b.age20plus) || 0,
    noOfSpeakers: Number(b.noOfSpeakers) || 0,
    nameOfSpeakers: Array.isArray(b.nameOfSpeakers) ? b.nameOfSpeakers : [],
    topicDiscussed: b.topicDiscussed || '',
    rating: b.rating || '',
    activitiesUndertaken: Array.isArray(b.activitiesUndertaken) ? b.activitiesUndertaken : [],
    personsResponsible: b.personsResponsible || '',
    remarks: b.remarks || '',
    documentedBy: b.documentedBy || '',
    reviewedBy: '',
    approvedBy: '',
    status: 'Pending',
    createdBy: req.user.id,
    createdByName: req.user.fullName,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  db.docReports.push(record);
  persist();
  res.status(201).json(record);
});

router.put('/:id', requireRole('staff'), (req, res) => {
  const db = load();
  const record = db.docReports.find((r) => r.id === Number(req.params.id));
  if (!record) return res.status(404).json({ error: 'Documentation Report not found' });
  if (record.status !== 'Pending') return res.status(400).json({ error: 'Only records with Pending status can be edited' });
  const b = req.body || {};
  const editable = [
    'cityMunicipality', 'barangay', 'venue', 'seminarConducted', 'dateConducted', 'targetParticipants',
    'actualParticipants', 'maleCount', 'femaleCount', 'age10to14', 'age15to19', 'age20plus', 'noOfSpeakers',
    'nameOfSpeakers', 'topicDiscussed', 'rating', 'activitiesUndertaken', 'personsResponsible', 'remarks', 'documentedBy',
  ];
  editable.forEach((f) => { if (b[f] !== undefined) record[f] = b[f]; });
  record.updatedAt = new Date().toISOString();
  persist();
  res.json(record);
});

// Staff submits a Pending record into the review pipeline
router.post('/:id/submit', requireRole('staff'), (req, res) => {
  const db = load();
  const record = db.docReports.find((r) => r.id === Number(req.params.id));
  if (!record) return res.status(404).json({ error: 'Documentation Report not found' });
  if (record.status !== 'Pending') return res.status(400).json({ error: 'Only Pending records can be submitted for review' });
  record.status = 'For Review';
  record.updatedAt = new Date().toISOString();
  db.reviewLogs.push({
    id: nextId(db, 'reviewLogs'), recordType: 'docReport', recordId: record.id, action: 'Submitted for Review',
    remarks: '', reviewerId: req.user.id, reviewerName: req.user.fullName, createdAt: new Date().toISOString(),
  });
  persist();
  res.json(record);
});

router.delete('/:id', requireRole('staff', 'admin'), (req, res) => {
  const db = load();
  const record = db.docReports.find((r) => r.id === Number(req.params.id));
  if (!record) return res.status(404).json({ error: 'Documentation Report not found' });
  if (record.status !== 'Pending' && req.user.role !== 'admin') {
    return res.status(400).json({ error: 'Only Pending records can be deleted' });
  }
  db.docReports = db.docReports.filter((r) => r.id !== record.id);
  persist();
  res.status(204).end();
});

module.exports = router;
