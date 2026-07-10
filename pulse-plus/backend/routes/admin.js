const express = require('express');
const bcrypt = require('bcryptjs');
const { load, persist, nextId } = require('../db');
const { verifyToken, requireRole } = require('../middleware/auth');
const { ROLES } = require('../constants');

const router = express.Router();
router.use(verifyToken, requireRole('admin'));

// ---- Users ----
router.get('/users', (req, res) => {
  const db = load();
  res.json(db.users.map(({ passwordHash, ...u }) => u));
});

router.post('/users', (req, res) => {
  const { username, password, fullName, role } = req.body || {};
  if (!username || !password || !fullName || !role) return res.status(400).json({ error: 'All fields are required' });
  if (!ROLES.includes(role)) return res.status(400).json({ error: 'Invalid role' });

  const db = load();
  if (db.users.some((u) => u.username.toLowerCase() === username.toLowerCase())) {
    return res.status(409).json({ error: 'Username already exists' });
  }
  const user = {
    id: nextId(db, 'users'),
    username,
    passwordHash: bcrypt.hashSync(password, 10),
    fullName,
    role,
    createdAt: new Date().toISOString(),
  };
  db.users.push(user);
  persist();
  const { passwordHash, ...safe } = user;
  res.status(201).json(safe);
});

router.put('/users/:id', (req, res) => {
  const db = load();
  const user = db.users.find((u) => u.id === Number(req.params.id));
  if (!user) return res.status(404).json({ error: 'User not found' });
  const { fullName, role, password } = req.body || {};
  if (fullName) user.fullName = fullName;
  if (role) {
    if (!ROLES.includes(role)) return res.status(400).json({ error: 'Invalid role' });
    user.role = role;
  }
  if (password) user.passwordHash = bcrypt.hashSync(password, 10);
  persist();
  const { passwordHash, ...safe } = user;
  res.json(safe);
});

router.delete('/users/:id', (req, res) => {
  const db = load();
  const id = Number(req.params.id);
  if (id === req.user.id) return res.status(400).json({ error: 'You cannot delete your own account' });
  const before = db.users.length;
  db.users = db.users.filter((u) => u.id !== id);
  if (db.users.length === before) return res.status(404).json({ error: 'User not found' });
  persist();
  res.status(204).end();
});

// ---- Barangay list (Municipality -> Barangay reference data) ----
router.get('/barangays', (req, res) => res.json(load().barangays));

router.post('/barangays', (req, res) => {
  const { municipality, barangay } = req.body || {};
  if (!municipality || !barangay) return res.status(400).json({ error: 'Municipality and barangay are required' });
  const db = load();
  const entry = { id: nextId(db, 'barangays'), municipality, barangay };
  db.barangays.push(entry);
  persist();
  res.status(201).json(entry);
});

router.delete('/barangays/:id', (req, res) => {
  const db = load();
  db.barangays = db.barangays.filter((b) => b.id !== Number(req.params.id));
  persist();
  res.status(204).end();
});

// ---- Personnel list ----
router.get('/personnel', (req, res) => res.json(load().personnel));

router.post('/personnel', (req, res) => {
  const { fullName, position } = req.body || {};
  if (!fullName) return res.status(400).json({ error: 'Full name is required' });
  const db = load();
  const entry = { id: nextId(db, 'personnel'), fullName, position: position || '' };
  db.personnel.push(entry);
  persist();
  res.status(201).json(entry);
});

router.delete('/personnel/:id', (req, res) => {
  const db = load();
  db.personnel = db.personnel.filter((p) => p.id !== Number(req.params.id));
  persist();
  res.status(204).end();
});

// ---- FP method codes ----
router.get('/fp-methods', (req, res) => res.json(load().fpMethods));

router.post('/fp-methods', (req, res) => {
  const { code, label, category } = req.body || {};
  if (!code || !label) return res.status(400).json({ error: 'Code and label are required' });
  const db = load();
  const entry = { id: nextId(db, 'fpMethods'), code, label, category: category || '' };
  db.fpMethods.push(entry);
  persist();
  res.status(201).json(entry);
});

router.delete('/fp-methods/:id', (req, res) => {
  const db = load();
  db.fpMethods = db.fpMethods.filter((m) => m.id !== Number(req.params.id));
  persist();
  res.status(204).end();
});

module.exports = router;
