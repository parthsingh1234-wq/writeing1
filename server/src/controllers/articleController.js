const dbAdapter = require('../models/dataStoreAdapter');
const { cleanHtml, calculateReadingTime, generateSlug } = require('../utils/helpers');
const { saveImageFile, deleteImageFile } = require('../config/cloudinary');

/**
 * Helper to process image uploads, base64 cover images, and HTML inline images.
 * Creates image records in dbAdapter/Image model and returns updated coverImage URL & image IDs list.
 */
const processArticleImages = async (req, coverImageInput, contentInput, existingImageIds = [], userId = null) => {
  const hostUrl = req ? `${req.protocol}://${req.get('host')}` : '';
  const imageIds = [...(existingImageIds || []).map(img => (typeof img === 'object' ? (img._id || img.id) : img))];

  let coverImageUrl = coverImageInput || '';

  // 1. Process uploaded files from multer (req.file or req.files)
  const filesToUpload = [];
  if (req?.file) {
    filesToUpload.push(req.file);
  }
  if (req?.files) {
    if (Array.isArray(req.files)) {
      filesToUpload.push(...req.files);
    } else if (typeof req.files === 'object') {
      Object.values(req.files).forEach(fileGroup => {
        if (Array.isArray(fileGroup)) filesToUpload.push(...fileGroup);
      });
    }
  }

  for (const file of filesToUpload) {
    try {
      const storageResult = await saveImageFile(file, hostUrl);
      const imageRecord = await dbAdapter.createImage({
        url: storageResult.url,
        publicId: storageResult.publicId,
        originalName: storageResult.originalName,
        mimeType: storageResult.mimeType,
        size: storageResult.size,
        uploadedBy: userId,
        isUnused: false
      });
      const imgId = imageRecord._id || imageRecord.id;
      if (imgId && !imageIds.includes(imgId)) {
        imageIds.push(imgId);
      }
      if (file.fieldname === 'coverImage' || !coverImageUrl) {
        coverImageUrl = storageResult.url;
      }
    } catch (err) {
      console.error('Error processing uploaded file:', err.message);
    }
  }

  // 2. Process Base64 Data URL for coverImage if provided in JSON body
  if (coverImageUrl && coverImageUrl.startsWith('data:image/')) {
    try {
      const mimeMatch = coverImageUrl.match(/^data:(image\/[a-zA-Z+]+);base64,/);
      const mimeType = mimeMatch ? mimeMatch[1] : 'image/jpeg';
      const base64Data = coverImageUrl.replace(/^data:image\/[a-zA-Z+]+;base64,/, '');
      const buffer = Buffer.from(base64Data, 'base64');
      const fakeFile = {
        buffer,
        mimetype: mimeType,
        originalname: `cover_${Date.now()}.jpg`
      };
      const storageResult = await saveImageFile(fakeFile, hostUrl);
      coverImageUrl = storageResult.url;

      const imageRecord = await dbAdapter.createImage({
        url: storageResult.url,
        publicId: storageResult.publicId,
        originalName: storageResult.originalName,
        mimeType: storageResult.mimeType,
        size: storageResult.size,
        uploadedBy: userId,
        isUnused: false
      });
      const imgId = imageRecord._id || imageRecord.id;
      if (imgId && !imageIds.includes(imgId)) {
        imageIds.push(imgId);
      }
    } catch (err) {
      console.error('Error processing base64 cover image:', err.message);
    }
  }

  // 3. Process inline base64 images in HTML content
  let processedContent = contentInput || '';
  if (processedContent) {
    const base64ImgRegex = /<img\s+[^>]*src=["'](data:image\/[a-zA-Z+]+;base64,[^"']+)["'][^>]*>/gi;
    let match;
    while ((match = base64ImgRegex.exec(processedContent)) !== null) {
      const base64Src = match[1];
      try {
        const mimeMatch = base64Src.match(/^data:(image\/[a-zA-Z+]+);base64,/);
        const mimeType = mimeMatch ? mimeMatch[1] : 'image/jpeg';
        const rawData = base64Src.replace(/^data:image\/[a-zA-Z+]+;base64,/, '');
        const buffer = Buffer.from(rawData, 'base64');
        const fakeFile = { buffer, mimetype: mimeType, originalname: `inline_${Date.now()}.jpg` };
        const storageResult = await saveImageFile(fakeFile, hostUrl);

        processedContent = processedContent.replace(base64Src, storageResult.url);

        const imageRecord = await dbAdapter.createImage({
          url: storageResult.url,
          publicId: storageResult.publicId,
          originalName: storageResult.originalName,
          mimeType: storageResult.mimeType,
          size: storageResult.size,
          uploadedBy: userId,
          isUnused: false
        });
        const imgId = imageRecord._id || imageRecord.id;
        if (imgId && !imageIds.includes(imgId)) {
          imageIds.push(imgId);
        }
      } catch (err) {
        console.error('Error processing inline base64 image:', err.message);
      }
    }

    // Process standard image URLs in content to record image references
    const stdImgRegex = /<img\s+[^>]*src=["'](https?:\/\/[^"']+)["'][^>]*>/gi;
    while ((match = stdImgRegex.exec(processedContent)) !== null) {
      const urlSrc = match[1];
      try {
        const userImages = await dbAdapter.getImages(userId);
        let existing = userImages.find(i => i.url === urlSrc);
        if (!existing) {
          existing = await dbAdapter.createImage({
            url: urlSrc,
            publicId: `img_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
            originalName: 'inline_image.jpg',
            mimeType: 'image/jpeg',
            size: 1024,
            uploadedBy: userId,
            isUnused: false
          });
        }
        const imgId = existing._id || existing.id;
        if (imgId && !imageIds.includes(imgId)) {
          imageIds.push(imgId);
        }
      } catch (e) {}
    }
  }

  return {
    coverImageUrl,
    processedContent,
    imageIds
  };
};

// @desc    Get all articles (with search, filtering & pagination)
// @route   GET /api/v1/articles
const getArticles = async (req, res) => {
  try {
    const { q, category, tag, status, author, isDeleted, sort = 'createdAt', page = 1, limit = 20 } = req.query;

    let articles = await dbAdapter.findArticles();

    // Soft delete filter
    const showDeleted = isDeleted === 'true';
    articles = articles.filter(a => !!a.isDeleted === showDeleted);

    if (status) {
      articles = articles.filter(a => a.status === status);
    }

    if (author) {
      articles = articles.filter(a => {
        const authorId = a.author?._id || a.author?.id || a.author;
        return authorId === author;
      });
    }

    if (category) {
      articles = articles.filter(a => {
        const catId = a.category?._id || a.category?.id || a.category;
        return catId === category || a.category?.slug === category;
      });
    }

    if (tag) {
      articles = articles.filter(a => {
        if (!a.tags || !Array.isArray(a.tags)) return false;
        return a.tags.some(t => (t._id || t.id || t) === tag || t.slug === tag);
      });
    }

    if (q && q.trim()) {
      const searchTerm = q.toLowerCase().trim();
      articles = articles.filter(a => {
        const titleMatch = a.title?.toLowerCase().includes(searchTerm);
        const subtitleMatch = a.subtitle?.toLowerCase().includes(searchTerm);
        const textMatch = a.rawText?.toLowerCase().includes(searchTerm) || a.content?.toLowerCase().includes(searchTerm);
        return titleMatch || subtitleMatch || textMatch;
      });
    }

    articles.sort((a, b) => {
      if (sort === 'views') return (b.viewsCount || 0) - (a.viewsCount || 0);
      if (sort === 'updatedAt') return new Date(b.updatedAt) - new Date(a.updatedAt);
      return new Date(b.createdAt) - new Date(a.createdAt);
    });

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
    const userId = req.user ? (req.user._id || req.user.id) : '8f413982e5b72186d23a1012';

    // Image processing: upload & extract images
    const { coverImageUrl, processedContent, imageIds } = await processArticleImages(
      req,
      coverImage,
      cleanedContent,
      [],
      userId
    );

    const plainText = processedContent.replace(/<[^>]+>/g, ' ');
    const readingTime = calculateReadingTime(plainText);
    const wordCount = plainText.trim() ? plainText.trim().split(/\s+/).length : 0;
    const characterCount = plainText.length;
    const slug = generateSlug(title);

    const targetStatus = status || 'published';
    const finalStatus = targetStatus;

    const articleData = {
      title,
      subtitle: subtitle || '',
      slug,
      content: processedContent,
      rawText: plainText,
      coverImage: coverImageUrl,
      images: imageIds,
      author: userId,
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
      images: article.images,
      category: article.category,
      tags: article.tags,
      savedBy: userId,
      changeNote: 'Initial article creation'
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
    const userId = req.user ? (req.user._id || req.user.id) : '8f413982e5b72186d23a1012';

    const rawContent = content !== undefined ? cleanHtml(content) : article.content;
    const coverInput = coverImage !== undefined ? coverImage : article.coverImage;

    // Image processing: upload & extract images
    const { coverImageUrl, processedContent, imageIds } = await processArticleImages(
      req,
      coverInput,
      rawContent,
      article.images || [],
      userId
    );

    const plainText = processedContent.replace(/<[^>]+>/g, ' ');
    const readingTime = calculateReadingTime(plainText);
    const wordCount = plainText.trim() ? plainText.trim().split(/\s+/).length : 0;
    const characterCount = plainText.length;

    const targetStatus = status || article.status;
    const finalStatus = targetStatus;

    const updateData = {
      title: title || article.title,
      subtitle: subtitle !== undefined ? subtitle : article.subtitle,
      content: processedContent,
      rawText: plainText,
      coverImage: coverImageUrl,
      images: imageIds,
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
        images: updateData.images,
        category: updateData.category,
        tags: updateData.tags,
        savedBy: userId,
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

    await dbAdapter.deleteArticle(article._id || article.id || article.slug, false);
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
const restoreVersion = async (req, res) => {
  try {
    const { id, versionId } = req.params;
    const versions = await dbAdapter.getArticleVersions(id);
    const targetVersion = versions.find(v => (v._id || v.id) === versionId || v.versionNumber === parseInt(versionId, 10));

    if (!targetVersion) {
      return res.status(404).json({ success: false, error: 'Version not found' });
    }

    const updatedArticle = await dbAdapter.updateArticle(id, {
      title: targetVersion.title,
      subtitle: targetVersion.subtitle,
      content: targetVersion.content,
      coverImage: targetVersion.coverImage || '',
      images: targetVersion.images || [],
      category: targetVersion.category,
      tags: targetVersion.tags
    });

    res.status(200).json({ success: true, article: updatedArticle, message: `Restored version ${targetVersion.versionNumber}` });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

const restoreArticleVersion = restoreVersion;

// @desc    Get Recycle Bin (Soft-deleted articles)
// @route   GET /api/v1/articles/recycle-bin
const getRecycleBin = async (req, res) => {
  try {
    const { q, sort = 'updatedAt', page = 1, limit = 50 } = req.query;
    let articles = await dbAdapter.findArticles({ isDeleted: true });

    if (q && q.trim()) {
      const searchTerm = q.toLowerCase().trim();
      articles = articles.filter(a => {
        const titleMatch = a.title?.toLowerCase().includes(searchTerm);
        const subtitleMatch = a.subtitle?.toLowerCase().includes(searchTerm);
        return titleMatch || subtitleMatch;
      });
    }

    articles.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

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

// @desc    Permanently delete article & cleanup unreferenced images
// @route   DELETE /api/v1/articles/:id/permanent
const permanentDeleteArticle = async (req, res) => {
  try {
    const article = await dbAdapter.findArticleByIdOrSlug(req.params.id);
    if (!article) {
      return res.status(404).json({ success: false, error: 'Article not found' });
    }

    const articleId = article._id || article.id;

    // Image cleanup: purge images referenced ONLY by this article
    const allArticles = await dbAdapter.findArticles({ isDeleted: undefined });
    const otherArticles = allArticles.filter(a => (a._id || a.id) !== articleId);

    const otherArticleImageUrls = new Set();
    const otherArticleImageIds = new Set();

    otherArticles.forEach(a => {
      if (a.coverImage) otherArticleImageUrls.add(a.coverImage);
      if (Array.isArray(a.images)) {
        a.images.forEach(img => {
          const imgId = typeof img === 'object' ? (img._id || img.id) : img;
          if (imgId) otherArticleImageIds.add(imgId);
          if (img?.url) otherArticleImageUrls.add(img.url);
        });
      }
    });

    if (Array.isArray(article.images)) {
      for (const img of article.images) {
        const imgObj = typeof img === 'object' ? img : null;
        const imgId = imgObj ? (imgObj._id || imgObj.id) : img;

        if (imgId && !otherArticleImageIds.has(imgId)) {
          if (imgObj && imgObj.publicId) {
            await deleteImageFile(imgObj.publicId);
          }
          await dbAdapter.deleteImageRecord(imgId);
        }
      }
    }

    await dbAdapter.deleteArticle(articleId, true);
    res.status(200).json({ success: true, message: 'Article and associated unused images permanently deleted' });
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
  restoreVersion,
  restoreArticleVersion,
  getRecycleBin,
  approveArticle,
  rejectArticle
};
