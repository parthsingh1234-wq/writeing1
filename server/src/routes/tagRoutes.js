const express = require('express');
const router = express.Router();
const { getTags, createTag } = require('../controllers/tagController');
const { protect } = require('../middleware/auth');

router.get('/', getTags);
router.post('/', protect, createTag);

module.exports = router;
