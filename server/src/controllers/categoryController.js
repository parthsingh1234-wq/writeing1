const dbAdapter = require('../models/dataStoreAdapter');

const getCategories = async (req, res) => {
  try {
    const categories = await dbAdapter.getCategories();
    res.status(200).json({ success: true, categories });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

const createCategory = async (req, res) => {
  try {
    const { name, description, color, icon } = req.body;
    if (!name) return res.status(400).json({ success: false, error: 'Category name is required' });

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    const category = await dbAdapter.createCategory({
      name,
      slug,
      description: description || '',
      color: color || '#6366f1',
      icon: icon || 'Folder',
      createdBy: req.user._id || req.user.id
    });

    res.status(201).json({ success: true, category });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

module.exports = { getCategories, createCategory };
