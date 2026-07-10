const express = require('express');
const { load, persist, nextId } = require('../db');
const { verifyToken, requireRole } = require('../middleware/auth');

const router = express.Router();
router.use(verifyToken);

function getCollection(db, type) {
  if (type === 'docReport') return db.docReports;
  if (type === 'rpfp') return db.rpfpRecords;
  return null;
}

// Queue: Section Head sees "For Review", Population Officer sees "For Approval"
router.get('/queue', requireRole('section_head', 'population_officer'), (req, res) => {
  const db = load();
  const targetStatus = req.user.role === 'section_head' ? 'For Review' : 'For Approval';
  const docReports = db.docReports.filter((r) => r.status === targetStatus).map((r) => ({ ...r, recordType: 'docReport' }));
  const rpfp = db.rpfpRecords.filter((r) => r.status === targetStatus).map((r) => ({ ...r, recordType: 'rpfp' }));
  res.json([...docReports, ...rpfp].sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1)));
});

// Decision: action = "approve" | "reject", remarks required on reject
router.post('/:type/:id/decision', requireRole('section_head', 'population_officer'), (req, res) => {
  const { type, id } = req.params;
  const { action, remarks } = req.body || {};
  if (!['approve', 'reject'].includes(action)) return res.status(400).json({ error: 'Action must be approve or reject' });
  if (action === 'reject' && !remarks) return res.status(400).json({ error: 'Remarks are required when rejecting a record' });

  const db = load();
  const collection = getCollection(db, type);
  if (!collection) return res.status(400).json({ error: 'Invalid record type' });
  const record = collection.find((r) => r.id === Number(id));
  if (!record) return res.status(404).json({ error: 'Record not found' });

  const role = req.user.role;
  if (role === 'section_head') {
    if (record.status !== 'For Review') return res.status(400).json({ error: 'Record is not awaiting Section Head review' });
    if (action === 'approve') {
      record.status = 'For Approval';
      record.reviewedBy = req.user.fullName;
      db.reviewLogs.push({ id: nextId(db, 'reviewLogs'), recordType: type, recordId: record.id, action: 'Reviewed (approved by Section Head)', remarks: remarks || '', reviewerId: req.user.id, reviewerName: req.user.fullName, createdAt: new Date().toISOString() });
    } else {
      record.status = 'Pending';
      db.reviewLogs.push({ id: nextId(db, 'reviewLogs'), recordType: type, recordId: record.id, action: 'Rejected by Section Head', remarks, reviewerId: req.user.id, reviewerName: req.user.fullName, createdAt: new Date().toISOString() });
    }
  } else {
    // population_officer
    if (record.status !== 'For Approval') return res.status(400).json({ error: 'Record is not awaiting Population Officer approval' });
    if (action === 'approve') {
      record.status = 'Approved';
      record.approvedBy = req.user.fullName;
      db.reviewLogs.push({ id: nextId(db, 'reviewLogs'), recordType: type, recordId: record.id, action: 'Approved by Population Officer', remarks: remarks || '', reviewerId: req.user.id, reviewerName: req.user.fullName, createdAt: new Date().toISOString() });
    } else {
      record.status = 'Pending';
      db.reviewLogs.push({ id: nextId(db, 'reviewLogs'), recordType: type, recordId: record.id, action: 'Rejected by Population Officer', remarks, reviewerId: req.user.id, reviewerName: req.user.fullName, createdAt: new Date().toISOString() });
    }
  }
  record.updatedAt = new Date().toISOString();
  persist();
  res.json(record);
});

module.exports = router;
