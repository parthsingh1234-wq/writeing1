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
const initStore = () => {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  if (!fs.existsSync(storePath)) {
    fs.writeFileSync(storePath, JSON.stringify(defaultData, null, 2));
  }
};

const getStore = () => {
  initStore();
  try {
    const raw = fs.readFileSync(storePath, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    return defaultData;
  }
};

const saveStore = (data) => {
  initStore();
  fs.writeFileSync(storePath, JSON.stringify(data, null, 2));
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
  initStore();
  console.log(`Local DB Store ready at: ${storePath}`);
};

const isFallbackMode = () => isInMemoryMode;

module.exports = {
  connectDB,
  isFallbackMode,
  getStore,
  saveStore
};
