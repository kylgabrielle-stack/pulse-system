const express = require('express');
const { load } = require('../db');
const {
  STATUSES, CIVIL_STATUS, EDUCATION, TRADITIONAL_FP_TYPE,
  NON_MODERN_STATUS, REASON_FOR_USING, ACTIVITIES_UNDERTAKEN, SEMINAR_TYPES,
} = require('../constants');

const router = express.Router();

// Public-ish (still requires login at the frontend router level) lookup bundle so the
// frontend has a single source of truth for every dropdown in the system.
router.get('/', (req, res) => {
  const db = load();
  res.json({
    statuses: STATUSES,
    civilStatus: CIVIL_STATUS,
    education: EDUCATION,
    traditionalFpType: TRADITIONAL_FP_TYPE,
    nonModernStatus: NON_MODERN_STATUS,
    reasonForUsing: REASON_FOR_USING,
    activitiesUndertaken: ACTIVITIES_UNDERTAKEN,
    seminarTypes: SEMINAR_TYPES,
    fpMethods: db.fpMethods,
    barangays: db.barangays,
    personnel: db.personnel,
    municipalities: [...new Set(db.barangays.map((b) => b.municipality))],
  });
});

module.exports = router;
