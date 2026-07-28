const dbAdapter = require('../models/dataStoreAdapter');
const { saveImageFile, deleteImageFile } = require('../config/cloudinary');

// @desc    Upload image(s)
// @route   POST /api/v1/images/upload
const uploadImages = async (req, res) => {
  try {
    const files = req.files || (req.file ? [req.file] : []);
    if (files.length === 0) {
      return res.status(400).json({ success: false, error: 'No image files provided' });
    }

    const hostUrl = `${req.protocol}://${req.get('host')}`;
    const uploadedRecords = [];

    for (const file of files) {
      const storageResult = await saveImageFile(file, hostUrl);
      const imageRecord = await dbAdapter.createImage({
        url: storageResult.url,
        publicId: storageResult.publicId,
        originalName: storageResult.originalName,
        mimeType: storageResult.mimeType,
        size: storageResult.size,
        uploadedBy: req.user ? (req.user._id || req.user.id) : null,
        isUnused: true,
        isAvatar: req.query.isAvatar === 'true' || req.body.isAvatar === 'true' || req.body.isAvatar === true
      });
      uploadedRecords.push(imageRecord);
    }

    res.status(200).json({
      success: true,
      images: uploadedRecords,
      url: uploadedRecords[0]?.url // Helper for single image pickers
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @desc    Get user images library
// @route   GET /api/v1/images
const getImages = async (req, res) => {
  try {
    const userId = req.user ? (req.user._id || req.user.id) : null;
    const images = await dbAdapter.getImages(userId);
    res.status(200).json({ success: true, images });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @desc    Delete image
// @route   DELETE /api/v1/images/:id
const deleteImage = async (req, res) => {
  try {
    const record = await dbAdapter.deleteImageRecord(req.params.id);
    if (!record) {
      return res.status(404).json({ success: false, error: 'Image not found' });
    }

    await deleteImageFile(record.publicId);
    res.status(200).json({ success: true, message: 'Image deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

module.exports = {
  uploadImages,
  getImages,
  deleteImage
};
