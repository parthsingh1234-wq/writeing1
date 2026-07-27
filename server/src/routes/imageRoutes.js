const express = require('express');
const router = express.Router();
const { uploadImages, getImages, deleteImage } = require('../controllers/imageController');
const { protect, optionalAuth } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.post('/upload', optionalAuth, upload.array('images', 10), uploadImages);
router.get('/', protect, getImages);
router.delete('/:id', protect, deleteImage);

module.exports = router;
