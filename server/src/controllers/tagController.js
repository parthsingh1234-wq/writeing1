const dbAdapter = require('../models/dataStoreAdapter');

const getTags = async (req, res) => {
  try {
    const tags = await dbAdapter.getTags();
    res.status(200).json({ success: true, tags });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

const createTag = async (req, res) => {
  try {
    const { name, color } = req.body;
    if (!name) return res.status(400).json({ success: false, error: 'Tag name is required' });

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    const tag = await dbAdapter.createTag({
      name,
      slug,
      color: color || '#3b82f6',
      createdBy: req.user._id || req.user.id
    });

    res.status(201).json({ success: true, tag });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

module.exports = { getTags, createTag };
