const express = require('express');
const router = express.Router();
const {
  getArticles,
  getArticleByIdOrSlug,
  createArticle,
  updateArticle,
  deleteArticle,
  restoreArticle,
  permanentDeleteArticle,
  getArticleVersions,
  restoreVersion,
  restoreArticleVersion,
  getRecycleBin,
  approveArticle,
  rejectArticle
} = require('../controllers/articleController');
const { protect, authorize, optionalAuth } = require('../middleware/auth');
const upload = require('../middleware/upload');

// Handle optional multipart file uploads for articles gracefully
const optionalImageUpload = (req, res, next) => {
  upload.fields([
    { name: 'coverImage', maxCount: 1 },
    { name: 'images', maxCount: 10 }
  ])(req, res, (err) => {
    if (err) {
      console.warn('Multipart upload notice:', err.message);
    }
    next();
  });
};

router.get('/', getArticles);
router.get('/recycle-bin', optionalAuth, getRecycleBin);
router.get('/trash', optionalAuth, getRecycleBin);
router.get('/:idOrSlug', getArticleByIdOrSlug);

router.post('/', optionalAuth, optionalImageUpload, createArticle);
router.put('/:id', optionalAuth, optionalImageUpload, updateArticle);

router.put('/:id/approve', protect, authorize('admin'), approveArticle);
router.put('/:id/reject', protect, authorize('admin'), rejectArticle);

router.delete('/:id', optionalAuth, deleteArticle);
router.put('/:id/restore', optionalAuth, restoreArticle);
router.delete('/:id/permanent', optionalAuth, permanentDeleteArticle);

router.get('/:id/versions', protect, getArticleVersions);
router.post('/:id/versions/:versionId/restore', protect, restoreVersion || restoreArticleVersion);

module.exports = router;
