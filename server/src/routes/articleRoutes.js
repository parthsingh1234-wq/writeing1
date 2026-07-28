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
  restoreArticleVersion,
  approveArticle,
  rejectArticle
} = require('../controllers/articleController');
const { protect, authorize, optionalAuth } = require('../middleware/auth');

router.get('/', getArticles);
router.get('/:idOrSlug', getArticleByIdOrSlug);
router.post('/', optionalAuth, createArticle);
router.put('/:id', optionalAuth, updateArticle);
router.put('/:id/approve', protect, authorize('admin'), approveArticle);
router.put('/:id/reject', protect, authorize('admin'), rejectArticle);
router.delete('/:id', protect, deleteArticle);
router.put('/:id/restore', protect, restoreArticle);
router.delete('/:id/permanent', protect, permanentDeleteArticle);
router.get('/:id/versions', protect, getArticleVersions);
router.post('/:id/versions/:versionId/restore', protect, restoreArticleVersion);

module.exports = router;
