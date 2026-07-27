const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

const dbAdapter = require('../server/src/models/dataStoreAdapter');

app.get('/api/v1/health', (req, res) => {
  res.status(200).json({ success: true, status: 'Healthy', timestamp: new Date().toISOString() });
});

app.get('/api/v1/articles', async (req, res) => {
  try {
    const articles = await dbAdapter.findArticles();
    const activeArticles = articles.filter(a => !a.isDeleted && a.status === 'published');
    res.status(200).json({ success: true, count: activeArticles.length, articles: activeArticles });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/v1/dashboard/stats', async (req, res) => {
  try {
    const articles = await dbAdapter.findArticles();
    const publishedArticles = articles.filter(a => !a.isDeleted && a.status === 'published');
    res.status(200).json({
      success: true,
      stats: {
        totalArticles: publishedArticles.length,
        draftsCount: 0,
        publishedCount: publishedArticles.length,
        totalImages: 0,
        recentArticles: publishedArticles.slice(0, 5)
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

const authRoutes = require('../server/src/routes/authRoutes');
const articleRoutes = require('../server/src/routes/articleRoutes');
const categoryRoutes = require('../server/src/routes/categoryRoutes');
const tagRoutes = require('../server/src/routes/tagRoutes');
const imageRoutes = require('../server/src/routes/imageRoutes');
const dashboardRoutes = require('../server/src/routes/dashboardRoutes');
const adminRoutes = require('../server/src/routes/adminRoutes');

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/articles', articleRoutes);
app.use('/api/v1/categories', categoryRoutes);
app.use('/api/v1/tags', tagRoutes);
app.use('/api/v1/images', imageRoutes);
app.use('/api/v1/dashboard', dashboardRoutes);
app.use('/api/v1/admin', adminRoutes);

app.use((req, res) => {
  res.status(404).json({ success: false, error: 'Endpoint not found' });
});

module.exports = app;
