// Lightweight file-based JSON datastore.
// Chosen deliberately over sqlite3/better-sqlite3 so the project runs with a plain
// `npm install` and no native build toolchain (no python/make/g++ needed) - important
// since this needs to run on a student laptop or a shared OJT office PC without hassle.
// For a real production deployment, swap this module out for a proper database
// (PostgreSQL/MySQL) - the route files only talk to the functions exported here,
// so that swap does not require touching route logic.

const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const { DEFAULT_FP_METHODS } = require('./constants');

const DB_PATH = path.join(__dirname, 'database.json');

function seedData() {
  const now = new Date().toISOString();
  return {
    counters: { users: 4, barangays: 8, personnel: 5, fpMethods: 12, docReports: 0, rpfpRecords: 0, reviewLogs: 0 },
    users: [
      { id: 1, username: 'admin', passwordHash: bcrypt.hashSync('admin123', 10), fullName: 'System Administrator', role: 'admin', createdAt: now },
      { id: 2, username: 'staff', passwordHash: bcrypt.hashSync('staff123', 10), fullName: 'Juan Dela Cruz', role: 'staff', createdAt: now },
      { id: 3, username: 'sectionhead', passwordHash: bcrypt.hashSync('head123', 10), fullName: 'Maria Santos', role: 'section_head', createdAt: now },
      { id: 4, username: 'popofficer', passwordHash: bcrypt.hashSync('officer123', 10), fullName: 'Ramon Reyes', role: 'population_officer', createdAt: now },
    ],
    barangays: [
      { id: 1, municipality: 'Silang', barangay: 'Biga I' },
      { id: 2, municipality: 'Silang', barangay: 'Biga II' },
      { id: 3, municipality: 'Silang', barangay: 'Poblacion I' },
      { id: 4, municipality: 'Dasmariñas', barangay: 'Salawag' },
      { id: 5, municipality: 'Dasmariñas', barangay: 'Zone I (Poblacion)' },
      { id: 6, municipality: 'Tagaytay', barangay: 'Sungay East' },
      { id: 7, municipality: 'Tagaytay', barangay: 'Maharlika East' },
      { id: 8, municipality: 'Trece Martires', barangay: 'Cabezas' },
    ],
    personnel: [
      { id: 1, fullName: 'Juan Dela Cruz', position: 'Technical Section Staff' },
      { id: 2, fullName: 'Maria Santos', position: 'Technical Section Head' },
      { id: 3, fullName: 'Ramon Reyes', position: 'Provincial Population Officer' },
      { id: 4, fullName: 'Ana Lim', position: 'Technical Section Staff' },
      { id: 5, fullName: 'Pedro Bautista', position: 'Community Volunteer' },
    ],
    fpMethods: DEFAULT_FP_METHODS.map((m, i) => ({ id: i + 1, code: m.code, label: m.label, category: m.category })),
    docReports: [],
    rpfpRecords: [],
    reviewLogs: [],
  };
}

let cache = null;

function load() {
  if (cache) return cache;
  if (!fs.existsSync(DB_PATH)) {
    cache = seedData();
    save(cache);
  } else {
    cache = JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
  }
  return cache;
}

function save(db) {
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
}

function nextId(db, collection) {
  db.counters[collection] = (db.counters[collection] || 0) + 1;
  return db.counters[collection];
}

function persist() {
  save(cache);
}

module.exports = { load, persist, nextId };
