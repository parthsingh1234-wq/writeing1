const express = require('express');
const fs = require('fs');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

const { connectDB } = require('./config/db');
const seedData = require('./utils/seed');

// Initialize Express app
const app = express();

// Connect Database & seed initial data
connectDB().then(() => {
  seedData();
});

// Security Middlewares with Strict Security Headers
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: false,
  frameguard: { action: 'deny' },
  xssFilter: true,
  noSniff: true
}));

const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',')
  : ['http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:5000', 'http://127.0.0.1:5000'];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin) || process.env.NODE_ENV !== 'production') {
      callback(null, true);
    } else {
      callback(new Error('CORS policy violation: Origin not allowed'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body Parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Sanitize against NoSQL injection
app.use(mongoSanitize());

// Global API Rate Limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX) || 500,
  message: { success: false, error: 'Too many requests from this IP, please try again later.' }
});
app.use('/api', limiter);

// Strict Rate Limiter for Authentication Endpoints (Brute-Force Protection)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 mins
  max: 15, // max 15 requests per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many authentication attempts. Please try again after 15 minutes.' }
});
app.use('/api/v1/auth/login', authLimiter);
app.use('/api/v1/auth/register', authLimiter);
app.use('/api/v1/auth/forgot-password', authLimiter);

// Serve static uploaded files fallback
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// API Routes Registration
app.use('/api/v1/auth', require('./routes/authRoutes'));
app.use('/api/v1/articles', require('./routes/articleRoutes'));
app.use('/api/v1/categories', require('./routes/categoryRoutes'));
app.use('/api/v1/tags', require('./routes/tagRoutes'));
app.use('/api/v1/images', require('./routes/imageRoutes'));
app.use('/api/v1/dashboard', require('./routes/dashboardRoutes'));
app.use('/api/v1/admin', require('./routes/adminRoutes'));

// Health check endpoint
app.get('/api/v1/health', (req, res) => {
  res.status(200).json({
    success: true,
    status: 'Healthy',
    timestamp: new Date().toISOString(),
    service: 'Article Vault Backend API'
  });
});

// Production Client Static Serving (Single-Port Online Deployment)
const clientDistPath = path.join(__dirname, '../../client/dist');
if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) return next();
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
}

// 404 Route Handler
app.use((req, res) => {
  res.status(404).json({ success: false, error: 'Endpoint not found' });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled Error:', err.stack);
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal Server Error'
  });
});

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`🚀 Article Vault Server running on port ${PORT}`);
  console.log(`🌍 Health Check: http://localhost:${PORT}/api/v1/health`);
  console.log(`====================================================`);
});

module.exports = app;
