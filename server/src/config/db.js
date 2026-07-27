const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

let isInMemoryMode = false;

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
let inMemoryStoreCache = null;

const getStorePath = () => {
  if (process.env.VERCEL || process.env.NODE_ENV === 'production') {
    return path.join('/tmp', 'store.json');
  }
  return storePath;
};

const getStore = () => {
  if (inMemoryStoreCache) return inMemoryStoreCache;
  
  const targetPath = getStorePath();
  try {
    if (fs.existsSync(targetPath)) {
      const raw = fs.readFileSync(targetPath, 'utf8');
      inMemoryStoreCache = JSON.parse(raw);
      return inMemoryStoreCache;
    }
  } catch (err) {}

  // Fallback to bundled seed store.json
  try {
    if (fs.existsSync(storePath)) {
      const raw = fs.readFileSync(storePath, 'utf8');
      inMemoryStoreCache = JSON.parse(raw);
      return inMemoryStoreCache;
    }
  } catch (err) {}

  inMemoryStoreCache = defaultData;
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
