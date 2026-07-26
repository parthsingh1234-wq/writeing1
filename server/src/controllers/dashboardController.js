const dbAdapter = require('../models/dataStoreAdapter');

const getUserDashboardStats = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const articles = await dbAdapter.findArticles();
    const userArticles = articles.filter(a => {
      const authorId = a.author?._id || a.author?.id || a.author;
      return authorId === userId && !a.isDeleted;
    });

    const totalArticles = userArticles.length;
    const draftsCount = userArticles.filter(a => a.status === 'draft').length;
    const publishedCount = userArticles.filter(a => a.status === 'published').length;

    const userImages = await dbAdapter.getImages(userId);
    const totalImages = userImages.length;

    userArticles.sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt));
    const recentArticles = userArticles.slice(0, 5);

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
