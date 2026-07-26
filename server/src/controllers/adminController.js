const dbAdapter = require('../models/dataStoreAdapter');

const getAdminStats = async (req, res) => {
  try {
    const users = await dbAdapter.findUser({});
    const articles = await dbAdapter.findArticles();

    const totalUsers = users.length;
    const totalArticles = articles.length;
    const publishedArticles = articles.filter(a => a.status === 'published' && !a.isDeleted).length;
    const draftArticles = articles.filter(a => a.status === 'draft' && !a.isDeleted).length;
    const deletedArticles = articles.filter(a => a.isDeleted).length;

    res.status(200).json({
      success: true,
      stats: {
        totalUsers,
        totalArticles,
        publishedArticles,
        draftArticles,
        deletedArticles
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

const getAllUsers = async (req, res) => {
  try {
    const users = await dbAdapter.findUser({});
    const safeUsers = users.map(u => ({
      id: u._id || u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      avatar: u.avatar,
      createdAt: u.createdAt
    }));
    res.status(200).json({ success: true, users: safeUsers });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

const deleteUser = async (req, res) => {
  try {
    await dbAdapter.deleteUser(req.params.id);
    res.status(200).json({ success: true, message: 'User deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

module.exports = {
  getAdminStats,
  getAllUsers,
  deleteUser
};
