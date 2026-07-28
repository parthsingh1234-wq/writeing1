const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

let isInMemoryMode = false;
let inMemoryStoreCache = null;

// Path for persistent fallback JSON storage
const dataDir = path.join(__dirname, '../../data');
const storePath = path.join(dataDir, 'store.json');

const defaultData = {
  users: [],
  articles: [],
  categories: [],
  tags: [],
  images: [],
  versions: []
};

// Ensure data folder and store file exist
let bundledStore = defaultData;
try {
  bundledStore = require('../../data/store.json');
} catch (e) {}

const getStorePath = () => {
  if (process.env.VERCEL || process.env.NODE_ENV === 'production') {
    return path.join('/tmp', 'store.json');
  }
  return storePath;
};

const syncUserActualImages = (storeObj) => {
  if (!storeObj || !storeObj.articles || !bundledStore || !bundledStore.articles) return;
  const targetArt = storeObj.articles.find(a => a._id === '92d09d80c94b8136e508ffbe');
  const bundledArt = bundledStore.articles.find(a => a._id === '92d09d80c94b8136e508ffbe');
  if (targetArt && bundledArt) {
    if (targetArt.coverImage !== bundledArt.coverImage) {
      targetArt.coverImage = bundledArt.coverImage;
    }
    if (targetArt.content !== bundledArt.content) {
      targetArt.content = bundledArt.content;
    }
  }
};

const getStore = () => {
  if (inMemoryStoreCache && inMemoryStoreCache.articles && inMemoryStoreCache.articles.length > 0) {
    syncUserActualImages(inMemoryStoreCache);
    return inMemoryStoreCache;
  }
  
  const targetPath = getStorePath();
  try {
    if (fs.existsSync(targetPath)) {
      const raw = fs.readFileSync(targetPath, 'utf8');
      const loaded = JSON.parse(raw);
      if (loaded && Array.isArray(loaded.articles) && loaded.articles.length > 0) {
        inMemoryStoreCache = loaded;
        syncUserActualImages(inMemoryStoreCache);
        return inMemoryStoreCache;
      }
    }
  } catch (err) {}

  // Fallback to static bundled store if disk store is empty or invalid
  inMemoryStoreCache = JSON.parse(JSON.stringify(bundledStore || defaultData));
  syncUserActualImages(inMemoryStoreCache);
  saveStore(inMemoryStoreCache);
  return inMemoryStoreCache;
};

const saveStore = (data) => {
  inMemoryStoreCache = data;
  const targetPath = getStorePath();
  try {
    const dir = path.dirname(targetPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(targetPath, JSON.stringify(data, null, 2));
  } catch (err) {
    console.warn(`File store write warning (${err.message}). Retaining state in memory.`);
  }
};

const connectDB = async () => {
  if (process.env.MONGODB_URI) {
    try {
      const conn = await mongoose.connect(process.env.MONGODB_URI);
      console.log(`MongoDB Connected: ${conn.connection.host}`);
      return;
    } catch (error) {
      console.warn(`MongoDB Connection Failed (${error.message}). Falling back to file-backed DB store.`);
    }
  } else {
    console.log('No MONGODB_URI found in environment. Initializing file-backed local DB store.');
  }

  isInMemoryMode = true;
  getStore();
  console.log(`Local DB Store ready.`);
};

const isFallbackMode = () => {
  if (!process.env.MONGODB_URI) return true;
  if (mongoose.connection.readyState !== 1) return true;
  return isInMemoryMode;
};

module.exports = {
  connectDB,
  isFallbackMode,
  getStore,
  saveStore
};
