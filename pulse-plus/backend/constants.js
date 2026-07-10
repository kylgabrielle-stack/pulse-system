// Fixed lookup values taken directly from the RPFP Form 1 code legend (System Requirements, section 6).
// These are NOT admin-editable (unlike barangays/personnel/FP methods) because they come straight
// from POPCOM's printed form and the codes must match what POPCOM's reporting format expects.

const STATUSES = ['Pending', 'For Review', 'For Approval', 'Approved', 'Rejected'];
// Note on workflow: "Reviewed" from the spec's status chain (Pending -> For Review -> Reviewed ->
// For Approval -> Approved) is implemented as an audit-log action rather than a resting status,
// since nothing in the process acts on a record while it sits at "Reviewed" - the Section Head's
// approval immediately forwards it into the Population Officer's "For Approval" queue. The
// "Reviewed" action is still recorded in reviewLogs for a full audit trail. See README.

const CIVIL_STATUS = [
  { code: '1', label: 'Married' },
  { code: '2', label: 'Single' },
  { code: '3', label: 'Widow/Widower' },
  { code: '4', label: 'Separated' },
  { code: '5', label: 'Live-in' },
];

const EDUCATION = [
  { code: '1', label: 'No Education' },
  { code: '2', label: 'Elementary Level' },
  { code: '3', label: 'Elementary Graduate' },
  { code: '4', label: 'High School Level' },
  { code: '5', label: 'High School Graduate' },
  { code: '6', label: 'Vocational' },
  { code: '7', label: 'College Level' },
  { code: '8', label: 'College Graduate' },
  { code: '9', label: 'Post Graduate' },
];

// Combined dropdown per the programmer's note: Artificial (1-7) + Modern NFP (8-12) methods
// are one single "Modern FP Method Used" dropdown. Seeded here but ALSO admin-editable
// via the fpMethods collection in db.json, since spec explicitly lists this as admin-managed
// reference data. This array is the seed/default only.
const DEFAULT_FP_METHODS = [
  { code: '1', label: 'Condom', category: 'Artificial' },
  { code: '2', label: 'IUD', category: 'Artificial' },
  { code: '3', label: 'Pills', category: 'Artificial' },
  { code: '4', label: 'Injectable', category: 'Artificial' },
  { code: '5', label: 'Vasectomy', category: 'Artificial' },
  { code: '6', label: 'Tubal Ligation', category: 'Artificial' },
  { code: '7', label: 'Implant', category: 'Artificial' },
  { code: '8', label: 'CMM / Billings', category: 'Modern NFP' },
  { code: '9', label: 'BBT', category: 'Modern NFP' },
  { code: '10', label: 'Sympto-Thermal', category: 'Modern NFP' },
  { code: '11', label: 'SDM', category: 'Modern NFP' },
  { code: '12', label: 'LAM', category: 'Modern NFP' },
];

const TRADITIONAL_FP_TYPE = [
  { code: '1', label: 'Withdrawal' },
  { code: '2', label: 'Rhythm' },
  { code: '3', label: 'Calendar' },
  { code: '4', label: 'Abstinence' },
  { code: '5', label: 'Herbal' },
  { code: '6', label: 'No Method' },
];

const NON_MODERN_STATUS = [
  { code: 'A', label: 'Expressing Intention to Use Modern FP Method' },
  { code: 'B', label: 'Undecided' },
  { code: 'C', label: 'Currently Pregnant' },
  { code: 'D', label: 'No Intention to Use' },
];

const REASON_FOR_USING = [
  { code: '1', label: 'Spacing' },
  { code: '2', label: 'Limiting' },
  { code: '3', label: 'Achieving' },
];

const ACTIVITIES_UNDERTAKEN = [
  'Registration',
  'Opening Remarks',
  'Seminar Proper',
  'One-on-One Counseling/Interview',
  'Closing Remarks',
  'Evaluation',
  'Referrals',
];

const SEMINAR_TYPES = ['Profiling', 'RPFP Seminar'];

const ROLES = ['staff', 'section_head', 'population_officer', 'admin'];

module.exports = {
  STATUSES,
  CIVIL_STATUS,
  EDUCATION,
  DEFAULT_FP_METHODS,
  TRADITIONAL_FP_TYPE,
  NON_MODERN_STATUS,
  REASON_FOR_USING,
  ACTIVITIES_UNDERTAKEN,
  SEMINAR_TYPES,
  ROLES,
};
