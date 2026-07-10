const express = require('express');
const { load } = require('../db');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();
router.use(verifyToken);

function countByStatus(rows) {
  return rows.reduce((acc, r) => {
    acc[r.status] = (acc[r.status] || 0) + 1;
    return acc;
  }, {});
}

router.get('/', (req, res) => {
  const db = load();
  const all = [...db.docReports, ...db.rpfpRecords];

  const overall = {
    total: all.length,
    pending: all.filter((r) => r.status === 'Pending').length,
    forReview: all.filter((r) => r.status === 'For Review').length,
    forApproval: all.filter((r) => r.status === 'For Approval').length,
    approved: all.filter((r) => r.status === 'Approved').length,
  };

  const byMunicipality = {};
  db.docReports.forEach((r) => {
    const key = r.cityMunicipality || 'Unspecified';
    byMunicipality[key] = byMunicipality[key] || { total: 0, pending: 0, forReview: 0, forApproval: 0, approved: 0 };
    byMunicipality[key].total++;
    if (r.status === 'Pending') byMunicipality[key].pending++;
    if (r.status === 'For Review') byMunicipality[key].forReview++;
    if (r.status === 'For Approval') byMunicipality[key].forApproval++;
    if (r.status === 'Approved') byMunicipality[key].approved++;
  });
  db.rpfpRecords.forEach((r) => {
    const key = r.municipality || 'Unspecified';
    byMunicipality[key] = byMunicipality[key] || { total: 0, pending: 0, forReview: 0, forApproval: 0, approved: 0 };
    byMunicipality[key].total++;
    if (r.status === 'Pending') byMunicipality[key].pending++;
    if (r.status === 'For Review') byMunicipality[key].forReview++;
    if (r.status === 'For Approval') byMunicipality[key].forApproval++;
    if (r.status === 'Approved') byMunicipality[key].approved++;
  });

  res.json({
    overall,
    docReports: { total: db.docReports.length, byStatus: countByStatus(db.docReports) },
    rpfpRecords: { total: db.rpfpRecords.length, byStatus: countByStatus(db.rpfpRecords) },
    byMunicipality,
  });
});

module.exports = router;
