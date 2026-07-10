const express = require('express');
const { load } = require('../db');
const { verifyToken } = require('../middleware/auth');
const { renderSummaryPdf } = require('../utils/pdf');

const router = express.Router();
router.use(verifyToken);

// Builds the auto-consolidated monthly summary from APPROVED records only.
// month is expected as "YYYY-MM"; defaults to current month.
function buildSummary(db, month) {
  const [year, mm] = month.split('-').map(Number);
  const inMonth = (isoDate) => {
    if (!isoDate) return false;
    const d = new Date(isoDate);
    return d.getFullYear() === year && d.getMonth() + 1 === mm;
  };

  const approvedRpfp = db.rpfpRecords.filter((r) => r.status === 'Approved' && inMonth(r.updatedAt));
  const approvedDocReports = db.docReports.filter((r) => r.status === 'Approved' && inMonth(r.updatedAt));

  const rpfpKey = (r) => `${r.municipality}||${r.barangay}`;
  const rpfpGroups = {};
  approvedRpfp.forEach((r) => {
    const key = rpfpKey(r);
    rpfpGroups[key] = rpfpGroups[key] || { municipality: r.municipality, barangay: r.barangay, total: 0, male: 0, female: 0, modernFpUsers: 0, traditionalFpUsers: 0 };
    const g = rpfpGroups[key];
    g.total++;
    if (r.sex === 'Male') g.male++;
    if (r.sex === 'Female') g.female++;
    if (r.fpMethodCode) g.modernFpUsers++;
    if (r.traditionalFpTypeCode) g.traditionalFpUsers++;
  });

  const docKey = (r) => `${r.cityMunicipality}||${r.barangay}`;
  const docGroups = {};
  approvedDocReports.forEach((r) => {
    const key = docKey(r);
    docGroups[key] = docGroups[key] || { municipality: r.cityMunicipality, barangay: r.barangay, seminarsHeld: 0, targetParticipants: 0, actualParticipants: 0, male: 0, female: 0 };
    const g = docGroups[key];
    g.seminarsHeld++;
    g.targetParticipants += r.targetParticipants || 0;
    g.actualParticipants += r.actualParticipants || 0;
    g.male += r.maleCount || 0;
    g.female += r.femaleCount || 0;
  });

  return {
    month,
    rpfpRows: Object.values(rpfpGroups),
    docReportRows: Object.values(docGroups),
    totals: {
      rpfpParticipants: approvedRpfp.length,
      seminarsHeld: approvedDocReports.length,
    },
  };
}

router.get('/', (req, res) => {
  const db = load();
  const month = req.query.month || new Date().toISOString().slice(0, 7);
  res.json(buildSummary(db, month));
});

router.get('/pdf', (req, res) => {
  const db = load();
  const month = req.query.month || new Date().toISOString().slice(0, 7);
  const summary = buildSummary(db, month);
  renderSummaryPdf(res, summary);
});

module.exports = router;
