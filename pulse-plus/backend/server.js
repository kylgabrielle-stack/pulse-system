const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');

const authRoutes = require('./routes/auth');
const constantsRoutes = require('./routes/constants');
const adminRoutes = require('./routes/admin');
const docReportRoutes = require('./routes/docreports');
const rpfpRoutes = require('./routes/rpfp');
const reviewRoutes = require('./routes/reviews');
const dashboardRoutes = require('./routes/dashboard');
const summaryRoutes = require('./routes/summary');

const app = express();
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

app.use('/api/auth', authRoutes);
app.use('/api/constants', constantsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/doc-reports', docReportRoutes);
app.use('/api/rpfp', rpfpRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/summary', summaryRoutes);

app.get('/api/health', (req, res) => res.json({ ok: true, service: 'PULSE+ API' }));

// Optionally serve the built frontend (run `npm run build` in /frontend first,
// then this will serve the static files so the whole app runs from one port).
const frontendDist = path.join(__dirname, '..', 'frontend', 'dist');
app.use(express.static(frontendDist));
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) return next();
  res.sendFile(path.join(frontendDist, 'index.html'), (err) => {
    if (err) next();
  });
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`PULSE+ API listening on http://localhost:${PORT}`);
});
