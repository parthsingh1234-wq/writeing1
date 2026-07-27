const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const app = express();

app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: false
}));

app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use((req, res, next) => {
  try {
    mongoSanitize()(req, res, next);
  } catch (e) {
    next();
  }
});

const { connectDB } = require('../server/src/config/db');
const seedData = require('../server/src/utils/seed');

connectDB().then(() => seedData()).catch(() => {});

// URL normalization for Vercel Serverless Function rewrites
app.use((req, res, next) => {
  if (req.url.startsWith('/v1/')) {
    req.url = '/api' + req.url;
  }
  next();
});

app.use('/api/v1/auth', require('../server/src/routes/authRoutes'));
app.use('/api/v1/articles', require('../server/src/routes/articleRoutes'));
app.use('/api/v1/categories', require('../server/src/routes/categoryRoutes'));
app.use('/api/v1/tags', require('../server/src/routes/tagRoutes'));
app.use('/api/v1/images', require('../server/src/routes/imageRoutes'));
app.use('/api/v1/dashboard', require('../server/src/routes/dashboardRoutes'));
app.use('/api/v1/admin', require('../server/src/routes/adminRoutes'));

app.get('/api/v1/health', (req, res) => {
  res.status(200).json({ success: true, status: 'Healthy', timestamp: new Date().toISOString() });
});

app.use((req, res) => {
  res.status(404).json({ success: false, error: 'Endpoint not found' });
});

module.exports = app;
