const dbAdapter = require('../models/dataStoreAdapter');

const getUserDashboardStats = async (req, res) => {
  try {
    const articles = await dbAdapter.findArticles();
    const activeArticles = articles.filter(a => !a.isDeleted);
    
    let totalArticles = 0;
    let draftsCount = 0;
    let publishedCount = 0;
    let totalImages = 0;
    let recentArticles = [];

    if (req.user) {
      const userId = req.user._id || req.user.id;
      const userArticles = activeArticles.filter(a => {
        const authorId = a.author?._id || a.author?.id || a.author;
        return authorId === userId;
      });

      totalArticles = userArticles.length;
      draftsCount = userArticles.filter(a => a.status === 'draft').length;
      publishedCount = userArticles.filter(a => a.status === 'published').length;

      const userImages = await dbAdapter.getImages(userId);
      totalImages = userImages.length;

      userArticles.sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt));
      recentArticles = userArticles.slice(0, 5);
    } else {
      const publishedArticles = activeArticles.filter(a => a.status === 'published');
      totalArticles = publishedArticles.length;
      draftsCount = 0;
      publishedCount = publishedArticles.length;
      totalImages = 0;
      recentArticles = publishedArticles.slice(0, 5);
    }

    res.status(200).json({
      success: true,
      stats: {
        totalArticles,
        draftsCount,
        publishedCount,
        totalImages,
        recentArticles
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

module.exports = { getUserDashboardStats };
