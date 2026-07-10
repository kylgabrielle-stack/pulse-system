const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { load } = require('../db');
const { verifyToken, JWT_SECRET } = require('../middleware/auth');

const router = express.Router();

router.post('/login', (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) return res.status(400).json({ error: 'Username and password are required' });

  const db = load();
  const user = db.users.find((u) => u.username.toLowerCase() === String(username).toLowerCase());
  if (!user || !bcrypt.compareSync(password, user.passwordHash)) {
    return res.status(401).json({ error: 'Invalid username or password' });
  }

  const token = jwt.sign(
    { id: user.id, username: user.username, fullName: user.fullName, role: user.role },
    JWT_SECRET,
    { expiresIn: '12h' }
  );
  res.json({ token, user: { id: user.id, username: user.username, fullName: user.fullName, role: user.role } });
});

router.get('/me', verifyToken, (req, res) => {
  res.json({ user: req.user });
});

module.exports = router;
