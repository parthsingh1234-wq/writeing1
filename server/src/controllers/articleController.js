const dbAdapter = require('../models/dataStoreAdapter');
const { cleanHtml, calculateReadingTime, generateSlug } = require('../utils/helpers');

// @desc    Get all articles (with search, filtering & pagination)
// @route   GET /api/v1/articles
const getArticles = async (req, res) => {
  try {
    const { q, category, tag, status, author, isDeleted, sort = 'createdAt', page = 1, limit = 20 } = req.query;

    let articles = await dbAdapter.findArticles();

    // Soft delete filter
    const showDeleted = isDeleted === 'true';
    articles = articles.filter(a => !!a.isDeleted === showDeleted);

    // Filter status (if provided)
    if (status) {
      articles = articles.filter(a => a.status === status);
    }

    // Filter author
    if (author) {
      articles = articles.filter(a => {
        const authorId = a.author?._id || a.author?.id || a.author;
        return authorId === author;
      });
    }

    // Filter category
    if (category) {
      articles = articles.filter(a => {
        const catId = a.category?._id || a.category?.id || a.category;
        return catId === category || a.category?.slug === category;
      });
    }

    // Filter tag
    if (tag) {
      articles = articles.filter(a => {
        if (!a.tags || !Array.isArray(a.tags)) return false;
        return a.tags.some(t => (t._id || t.id || t) === tag || t.slug === tag);
      });
    }

    // Search query (title, subtitle, content, rawText, tags)
    if (q && q.trim()) {
      const searchTerm = q.toLowerCase().trim();
      articles = articles.filter(a => {
        const titleMatch = a.title?.toLowerCase().includes(searchTerm);
        const subtitleMatch = a.subtitle?.toLowerCase().includes(searchTerm);
        const textMatch = a.rawText?.toLowerCase().includes(searchTerm) || a.content?.toLowerCase().includes(searchTerm);
        return titleMatch || subtitleMatch || textMatch;
      });
    }

    // Sorting
    articles.sort((a, b) => {
      if (sort === 'views') return (b.viewsCount || 0) - (a.viewsCount || 0);
      if (sort === 'updatedAt') return new Date(b.updatedAt) - new Date(a.updatedAt);
      return new Date(b.createdAt) - new Date(a.createdAt);
    });

    // Pagination
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const startIndex = (pageNum - 1) * limitNum;
    const total = articles.length;
    const paginatedArticles = articles.slice(startIndex, startIndex + limitNum);

    res.status(200).json({
      success: true,
      count: paginatedArticles.length,
      total,
      pages: Math.ceil(total / limitNum) || 1,
      currentPage: pageNum,
      articles: paginatedArticles
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @desc    Get single article by ID or Slug
// @route   GET /api/v1/articles/:idOrSlug
const getArticleByIdOrSlug = async (req, res) => {
  try {
    const article = await dbAdapter.findArticleByIdOrSlug(req.params.idOrSlug);

    if (!article) {
      return res.status(404).json({ success: false, error: 'Article not found' });
    }

    // Only increment view count if requested genuinely (e.g. ?incrementView=true)
    if (req.query.incrementView === 'true') {
      article.viewsCount = (article.viewsCount || 0) + 1;
      await dbAdapter.updateArticle(article._id || article.id, { viewsCount: article.viewsCount });
    }

    res.status(200).json({
      success: true,
      article
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @desc    Create new article
// @route   POST /api/v1/articles
const createArticle = async (req, res) => {
  try {
    const { title, subtitle, content, coverImage, category, tags, status, isPinned } = req.body;

    if (!title) {
      return res.status(400).json({ success: false, error: 'Article title is required' });
    }

    const cleanedContent = cleanHtml(content || '');
    const plainText = cleanedContent.replace(/<[^>]+>/g, ' ');
    const readingTime = calculateReadingTime(plainText);
    const wordCount = plainText.trim() ? plainText.trim().split(/\s+/).length : 0;
    const characterCount = plainText.length;
    const slug = generateSlug(title);

    const targetStatus = status || 'draft';
    const finalStatus = (targetStatus === 'published' && req.user?.role !== 'admin') ? 'pending' : targetStatus;

    const articleData = {
      title,
      subtitle: subtitle || '',
      slug,
      content: cleanedContent,
      rawText: plainText,
      coverImage: coverImage || '',
      author: req.user._id || req.user.id,
      category: category || null,
      tags: tags || [],
      status: finalStatus,
      isPinned: isPinned || false,
      readingTime,
      wordCount,
      characterCount,
      currentVersion: 1
    };

    const article = await dbAdapter.createArticle(articleData);

    // Initial version 1 snapshot
    await dbAdapter.createVersion({
      articleId: article._id || article.id,
      versionNumber: 1,
      title: article.title,
      subtitle: article.subtitle,
      content: article.content,
      coverImage: article.coverImage,
      category: article.category,
      tags: article.tags,
      savedBy: req.user._id || req.user.id,
      changeNote: 'Initial draft creation'
    });

    const isPending = finalStatus === 'pending';
    res.status(201).json({
      success: true,
      article,
      message: isPending ? 'Article submitted for Admin approval! Admin Parth Singh will review and publish it.' : 'Article created successfully'
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @desc    Update article
// @route   PUT /api/v1/articles/:id
const updateArticle = async (req, res) => {
  try {
    const { id } = req.params;
    const article = await dbAdapter.findArticleByIdOrSlug(id);

    if (!article) {
      return res.status(404).json({ success: false, error: 'Article not found' });
    }

    const { title, subtitle, content, coverImage, category, tags, status, isPinned, createVersionSnapshot } = req.body;

    const cleanedContent = content !== undefined ? cleanHtml(content) : article.content;
    const plainText = cleanedContent.replace(/<[^>]+>/g, ' ');
    const readingTime = calculateReadingTime(plainText);
    const wordCount = plainText.trim() ? plainText.trim().split(/\s+/).length : 0;
    const characterCount = plainText.length;

    const targetStatus = status || article.status;
    const finalStatus = (targetStatus === 'published' && req.user?.role !== 'admin') ? 'pending' : targetStatus;

    const updateData = {
      title: title || article.title,
      subtitle: subtitle !== undefined ? subtitle : article.subtitle,
      content: cleanedContent,
      rawText: plainText,
      coverImage: coverImage !== undefined ? coverImage : article.coverImage,
      category: category !== undefined ? category : article.category,
      tags: tags !== undefined ? tags : article.tags,
      status: finalStatus,
      isPinned: isPinned !== undefined ? isPinned : article.isPinned,
      readingTime,
      wordCount,
      characterCount
    };

    if (createVersionSnapshot) {
      updateData.currentVersion = (article.currentVersion || 1) + 1;
      await dbAdapter.createVersion({
        articleId: article._id || article.id,
        versionNumber: updateData.currentVersion,
        title: updateData.title,
        subtitle: updateData.subtitle,
        content: updateData.content,
        coverImage: updateData.coverImage,
        category: updateData.category,
        tags: updateData.tags,
        savedBy: req.user._id || req.user.id,
        changeNote: req.body.changeNote || `Version ${updateData.currentVersion} update`
      });
    }

    const updatedArticle = await dbAdapter.updateArticle(article._id || article.id, updateData);

    const isPending = finalStatus === 'pending';
    res.status(200).json({
      success: true,
      article: updatedArticle,
      message: isPending ? 'Article submitted for Admin approval! Admin Parth Singh will review and publish it.' : 'Article updated successfully'
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @desc    Soft delete article (Move to Recycle Bin)
// @route   DELETE /api/v1/articles/:id
const deleteArticle = async (req, res) => {
  try {
    const article = await dbAdapter.findArticleByIdOrSlug(req.params.id);
    if (!article) {
      return res.status(404).json({ success: false, error: 'Article not found' });
    }

    await dbAdapter.deleteArticle(article._id || article.id, false);
    res.status(200).json({ success: true, message: 'Article moved to Recycle Bin' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @desc    Restore soft-deleted article
// @route   PUT /api/v1/articles/:id/restore
const restoreArticle = async (req, res) => {
  try {
    const article = await dbAdapter.findArticleByIdOrSlug(req.params.id);
    if (!article) {
      return res.status(404).json({ success: false, error: 'Article not found' });
    }

    const restored = await dbAdapter.updateArticle(article._id || article.id, { isDeleted: false });
    res.status(200).json({ success: true, article: restored, message: 'Article restored successfully' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @desc    Permanently delete article
// @route   DELETE /api/v1/articles/:id/permanent
const permanentDeleteArticle = async (req, res) => {
  try {
    const article = await dbAdapter.findArticleByIdOrSlug(req.params.id);
    if (!article) {
      return res.status(404).json({ success: false, error: 'Article not found' });
    }

    await dbAdapter.deleteArticle(article._id || article.id, true);
    res.status(200).json({ success: true, message: 'Article permanently deleted' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @desc    Get version history for article
// @route   GET /api/v1/articles/:id/versions
const getArticleVersions = async (req, res) => {
  try {
    const versions = await dbAdapter.getArticleVersions(req.params.id);
    res.status(200).json({ success: true, versions });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @desc    Restore specific version
// @route   POST /api/v1/articles/:id/versions/:versionId/restore
const restoreArticleVersion = async (req, res) => {
  try {
    const versions = await dbAdapter.getArticleVersions(req.params.id);
    const targetVersion = versions.find(v => (v._id || v.id) === req.params.versionId);

    if (!targetVersion) {
      return res.status(404).json({ success: false, error: 'Version not found' });
    }

    const updatedArticle = await dbAdapter.updateArticle(req.params.id, {
      title: targetVersion.title,
      subtitle: targetVersion.subtitle,
      content: targetVersion.content,
      coverImage: targetVersion.coverImage,
      category: targetVersion.category,
      tags: targetVersion.tags
    });

    res.status(200).json({ success: true, article: updatedArticle, message: `Restored version ${targetVersion.versionNumber}` });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @desc    Approve pending article (Admin only)
// @route   PUT /api/v1/articles/:id/approve
const approveArticle = async (req, res) => {
  try {
    const { id } = req.params;
    const article = await dbAdapter.findArticleByIdOrSlug(id);
    if (!article) {
      return res.status(404).json({ success: false, error: 'Article not found' });
    }

    const updated = await dbAdapter.updateArticle(article._id || article.id, { status: 'published' });
    res.status(200).json({ success: true, article: updated, message: 'Article approved and published!' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @desc    Reject pending article (Admin only)
// @route   PUT /api/v1/articles/:id/reject
const rejectArticle = async (req, res) => {
  try {
    const { id } = req.params;
    const article = await dbAdapter.findArticleByIdOrSlug(id);
    if (!article) {
      return res.status(404).json({ success: false, error: 'Article not found' });
    }

    const updated = await dbAdapter.updateArticle(article._id || article.id, { status: 'draft' });
    res.status(200).json({ success: true, article: updated, message: 'Article rejected and returned to draft status.' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

module.exports = {
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
};
