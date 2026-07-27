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
connectDB().catch(() => {});

const authRoutes = require('../server/src/routes/authRoutes');
const articleRoutes = require('../server/src/routes/articleRoutes');
const categoryRoutes = require('../server/src/routes/categoryRoutes');
const tagRoutes = require('../server/src/routes/tagRoutes');
const imageRoutes = require('../server/src/routes/imageRoutes');
const dashboardRoutes = require('../server/src/routes/dashboardRoutes');
const adminRoutes = require('../server/src/routes/adminRoutes');

// Mount routes for dual path compatibility (/api/v1/* and /*)
app.use('/api/v1/auth', authRoutes);
app.use('/auth', authRoutes);

app.use('/api/v1/articles', articleRoutes);
app.use('/articles', articleRoutes);

app.use('/api/v1/categories', categoryRoutes);
app.use('/categories', categoryRoutes);

app.use('/api/v1/tags', tagRoutes);
app.use('/tags', tagRoutes);

app.use('/api/v1/images', imageRoutes);
app.use('/images', imageRoutes);

app.use('/api/v1/dashboard', dashboardRoutes);
app.use('/dashboard', dashboardRoutes);

app.use('/api/v1/admin', adminRoutes);
app.use('/admin', adminRoutes);

app.get(['/api/v1/health', '/health'], (req, res) => {
  res.status(200).json({ success: true, status: 'Healthy', timestamp: new Date().toISOString() });
});

app.use((req, res) => {
  res.status(404).json({ success: false, error: 'Endpoint not found' });
});

module.exports = app;
