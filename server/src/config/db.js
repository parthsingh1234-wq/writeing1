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

const cleanStoreObject = (obj) => {
  if (!obj) return;
  const jsonStr = JSON.stringify(obj);
  if (jsonStr.includes('localhost:5000') || jsonStr.includes('127.0.0.1:5000')) {
    const cleanedStr = jsonStr
      .replace(/http:\/\/(?:localhost|127\.0\.0\.1):5000\/uploads\/1785079360742-image\.png/g, 'https://images.unsplash.com/photo-1532375810709-75b1da00537c?auto=format&fit=crop&q=80&w=1000')
      .replace(/http:\/\/(?:localhost|127\.0\.0\.1):5000\/uploads\/1785081515790-image\.png/g, 'https://images.unsplash.com/photo-1541872703-74c5e44368f9?auto=format&fit=crop&q=80&w=1000')
      .replace(/http:\/\/(?:localhost|127\.0\.0\.1):5000\/uploads\/[^\"]+/g, 'https://images.unsplash.com/photo-1532375810709-75b1da00537c?auto=format&fit=crop&q=80&w=1000');
    
    try {
      const parsed = JSON.parse(cleanedStr);
      Object.assign(obj, parsed);
    } catch (e) {}
  }
};

const getStore = () => {
  if (inMemoryStoreCache) {
    cleanStoreObject(inMemoryStoreCache);
    return inMemoryStoreCache;
  }
  
  const targetPath = getStorePath();
  try {
    if (fs.existsSync(targetPath)) {
      const raw = fs.readFileSync(targetPath, 'utf8');
      inMemoryStoreCache = JSON.parse(raw);
      cleanStoreObject(inMemoryStoreCache);
      return inMemoryStoreCache;
    }
  } catch (err) {}

  // Fallback to static bundled store
  inMemoryStoreCache = JSON.parse(JSON.stringify(bundledStore || defaultData));
  cleanStoreObject(inMemoryStoreCache);
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
