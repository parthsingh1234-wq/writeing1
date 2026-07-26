const { isFallbackMode, getStore, saveStore } = require('../config/db');
const User = require('./User');
const Article = require('./Article');
const Category = require('./Category');
const Tag = require('./Tag');
const Image = require('./Image');
const ArticleVersion = require('./ArticleVersion');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');

const generateId = () => crypto.randomBytes(12).toString('hex');

const populateArticle = (article, store) => {
  if (!article) return null;
  const populated = { ...article };

  // Populate author
  if (populated.author) {
    const authorId = typeof populated.author === 'object' ? (populated.author._id || populated.author.id) : populated.author;
    const userObj = store.users.find(u => u._id === authorId || u.id === authorId);
    if (userObj) {
      populated.author = {
        _id: userObj._id || userObj.id,
        id: userObj._id || userObj.id,
        name: userObj.name,
        email: userObj.email,
        avatar: userObj.avatar,
        role: userObj.role
      };
    } else {
      populated.author = {
        _id: authorId,
        id: authorId,
        name: 'Parth Singh',
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200'
      };
    }
  } else {
    populated.author = {
      name: 'Parth Singh',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200'
    };
  }

  // Populate category
  if (populated.category) {
    const catId = typeof populated.category === 'object' ? (populated.category._id || populated.category.id) : populated.category;
    const catObj = store.categories.find(c => c._id === catId || c.id === catId);
    if (catObj) {
      populated.category = catObj;
    }
  }

  // Populate tags
  if (Array.isArray(populated.tags)) {
    populated.tags = populated.tags.map(t => {
      const tagId = typeof t === 'object' ? (t._id || t.id) : t;
      return store.tags.find(tag => tag._id === tagId || tag.id === tagId) || t;
    });
  }

  return populated;
};

// Adapter methods for File-backed DB fallback
const dbAdapter = {
  // User methods
  async findUser(filter) {
    if (!isFallbackMode()) return await User.find(filter);
    const store = getStore();
    return store.users.filter(u => Object.keys(filter).every(k => u[k] === filter[k]));
  },

  async findUserById(id) {
    if (!isFallbackMode()) return await User.findById(id);
    const store = getStore();
    return store.users.find(u => u._id === id || u.id === id);
  },

  async findUserByEmail(email, selectPassword = false) {
    if (!isFallbackMode()) {
      return selectPassword
        ? await User.findOne({ email }).select('+password')
        : await User.findOne({ email });
    }
    const store = getStore();
    return store.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  },

  async createUser(userData) {
    if (!isFallbackMode()) return await User.create(userData);
    const store = getStore();
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(userData.password, salt);
    
    const newUser = {
      _id: generateId(),
      name: userData.name,
      email: userData.email.toLowerCase(),
      password: hashedPassword,
      role: userData.role || 'user',
      avatar: userData.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200',
      bio: userData.bio || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    store.users.push(newUser);
    saveStore(store);
    return newUser;
  },

  async updateUser(id, updateData) {
    if (updateData.password) {
      const salt = await bcrypt.genSalt(10);
      updateData.password = await bcrypt.hash(updateData.password, salt);
    }
    if (!isFallbackMode()) return await User.findByIdAndUpdate(id, updateData, { new: true });
    const store = getStore();
    const index = store.users.findIndex(u => u._id === id);
    if (index === -1) return null;
    store.users[index] = { ...store.users[index], ...updateData, updatedAt: new Date().toISOString() };
    saveStore(store);
    return store.users[index];
  },

  async deleteUser(id) {
    if (!isFallbackMode()) return await User.findByIdAndDelete(id);
    const store = getStore();
    store.users = store.users.filter(u => u._id !== id);
    saveStore(store);
    return true;
  },

  // Article methods
  async findArticles(query = {}) {
    if (!isFallbackMode()) return await Article.find(query).populate('author', 'name email avatar').populate('category').populate('tags');
    const store = getStore();
    let results = store.articles.filter(a => !a.isDeleted);

    if (query.status) results = results.filter(a => a.status === query.status);
    if (query.author) results = results.filter(a => (a.author._id || a.author) === query.author);
    if (query.category) results = results.filter(a => (a.category?._id || a.category) === query.category);
    if (query.isDeleted !== undefined) results = store.articles.filter(a => a.isDeleted === query.isDeleted);
    
    return results.map(a => populateArticle(a, store));
  },

  async findArticleByIdOrSlug(identifier) {
    if (!isFallbackMode()) {
      const isId = mongoose.Types.ObjectId.isValid(identifier);
      const filter = isId ? { _id: identifier } : { slug: identifier };
      return await Article.findOne(filter).populate('author', 'name email avatar').populate('category').populate('tags');
    }
    const store = getStore();
    const article = store.articles.find(a => a._id === identifier || a.slug === identifier);
    return populateArticle(article, store);
  },

  async createArticle(data) {
    if (!isFallbackMode()) return await Article.create(data);
    const store = getStore();
    const newArticle = {
      _id: generateId(),
      ...data,
      isDeleted: false,
      viewsCount: 0,
      currentVersion: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    store.articles.push(newArticle);
    saveStore(store);
    return populateArticle(newArticle, store);
  },

  async updateArticle(id, data) {
    if (!isFallbackMode()) return await Article.findByIdAndUpdate(id, data, { new: true });
    const store = getStore();
    const index = store.articles.findIndex(a => a._id === id);
    if (index === -1) return null;
    store.articles[index] = { ...store.articles[index], ...data, updatedAt: new Date().toISOString() };
    saveStore(store);
    return populateArticle(store.articles[index], store);
  },

  async deleteArticle(id, hardDelete = false) {
    if (!isFallbackMode()) {
      if (hardDelete) return await Article.findByIdAndDelete(id);
      return await Article.findByIdAndUpdate(id, { isDeleted: true }, { new: true });
    }
    const store = getStore();
    if (hardDelete) {
      store.articles = store.articles.filter(a => a._id !== id);
    } else {
      const index = store.articles.findIndex(a => a._id === id);
      if (index !== -1) store.articles[index].isDeleted = true;
    }
    saveStore(store);
    return true;
  },

  // Category & Tag methods
  async getCategories() {
    if (!isFallbackMode()) return await Category.find();
    return getStore().categories;
  },

  async createCategory(data) {
    if (!isFallbackMode()) return await Category.create(data);
    const store = getStore();
    const cat = { _id: generateId(), ...data, createdAt: new Date().toISOString() };
    store.categories.push(cat);
    saveStore(store);
    return cat;
  },

  async getTags() {
    if (!isFallbackMode()) return await Tag.find();
    return getStore().tags;
  },

  async createTag(data) {
    if (!isFallbackMode()) return await Tag.create(data);
    const store = getStore();
    const tag = { _id: generateId(), ...data, createdAt: new Date().toISOString() };
    store.tags.push(tag);
    saveStore(store);
    return tag;
  },

  // Images
  async getImages(userId) {
    if (!isFallbackMode()) {
      const avatarUrls = (await User.find({}).distinct('avatar')).filter(Boolean);
      return await Image.find({
        uploadedBy: userId,
        isAvatar: { $ne: true },
        url: { $nin: avatarUrls }
      });
    }
    const store = getStore();
    const avatarUrls = store.users.map(u => u.avatar).filter(Boolean);
    return getStore().images.filter(img => {
      const isUserMatch = (img.uploadedBy._id || img.uploadedBy) === userId;
      const isNotAvatarFlag = !img.isAvatar;
      const isNotUserAvatarUrl = !avatarUrls.includes(img.url);
      return isUserMatch && isNotAvatarFlag && isNotUserAvatarUrl;
    });
  },

  async createImage(data) {
    if (!isFallbackMode()) return await Image.create(data);
    const store = getStore();
    const img = { _id: generateId(), ...data, createdAt: new Date().toISOString() };
    store.images.push(img);
    saveStore(store);
    return img;
  },

  async deleteImageRecord(id) {
    if (!isFallbackMode()) return await Image.findByIdAndDelete(id);
    const store = getStore();
    const img = store.images.find(i => i._id === id);
    store.images = store.images.filter(i => i._id !== id);
    saveStore(store);
    return img;
  },

  // Versions
  async createVersion(data) {
    if (!isFallbackMode()) return await ArticleVersion.create(data);
    const store = getStore();
    const ver = { _id: generateId(), ...data, createdAt: new Date().toISOString() };
    store.versions.push(ver);
    saveStore(store);
    return ver;
  },

  async getArticleVersions(articleId) {
    if (!isFallbackMode()) return await ArticleVersion.find({ articleId }).sort({ versionNumber: -1 });
    const store = getStore();
    return store.versions.filter(v => v.articleId === articleId).sort((a, b) => b.versionNumber - a.versionNumber);
  }
};

module.exports = dbAdapter;
