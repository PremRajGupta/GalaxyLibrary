import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import compression from 'compression';
import jwt from 'jsonwebtoken';

// Routes
import studentRoutes from './routes/studentRoutes.js';
import feeRoutes from './routes/feeRoutes.js';
import seatRoutes from './routes/seatRoutes.js';
import requestRoutes from './routes/requestRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import reportRoutes from './routes/reportRoutes.js';
import { getSiteContent, updateSiteContent } from './controllers/siteContentController.js';
import { getPublicStats, recordPublicVisit } from './controllers/publicStatsController.js';

// Middleware
import { verifyToken } from './middleware/auth.js';

dotenv.config();

const app = express();

// ===== CORS Configuration =====
const allowedOrigins = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://localhost:5174',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5174',
  'http://localhost:3001',
  'https://galaxylib.com',
  'https://app.galaxylib.com',
  'https://admin.galaxylib.com',
  'https://www.galaxyhub.in',
  'https://galaxyhub.in',
  process.env.FRONTEND_URL
].filter(Boolean);

const isLocalDevOrigin = (origin) => {
  if (process.env.NODE_ENV === 'production') return false;
  return /^https?:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin);
};

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin) || isLocalDevOrigin(origin)) {
      callback(null, true);
    } else {
      callback(new Error('CORS not allowed'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-api-key']
}));

// ===== Body Parser & Middleware =====
app.use(compression());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// ===== Request Logging =====
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// ===== Cache Control Headers (Prevent stale data) =====
app.use((req, res, next) => {
  // Disable caching for API responses
  if (req.path.startsWith('/api')) {
    res.set({
      'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0, s-maxage=0',
      'Pragma': 'no-cache',
      'Expires': '0'
    });
  }
  next();
});

// ===== Health Check Route (No Auth Required) =====
app.get('/api/health', (req, res) => {
  res.status(200).json({ 
    status: 'ok', 
    message: 'Library Management System API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// ===== Authentication Route =====
app.post('/login', (req, res) => {
  const { email, password } = req.body;
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@library.com';
  const adminPassword = process.env.ADMIN_PASSWORD || 'Password123!';

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  if (email !== adminEmail || password !== adminPassword) {
    return res.status(401).json({ message: 'Invalid email or password' });
  }

  const token = jwt.sign(
    {
      uid: 'admin',
      email,
      role: 'admin'
    },
    process.env.JWT_SECRET || 'your-secret-key',
    { expiresIn: '8h' }
  );

  const user = {
    uid: 'admin',
    email,
    displayName: 'Library Admin',
    role: 'admin'
  };

  return res.json({ token, user });
});

// ===== PUBLIC ROUTES (Before auth middleware) =====
// Public Website Content (No Auth — home page must load/save for all visitors)
app.get('/api/v1/site-content', getSiteContent);
app.get('/api/site-content', getSiteContent);
app.put('/api/v1/site-content', updateSiteContent);
app.put('/api/site-content', updateSiteContent);

// Public landing stats (visitors + admissions for index page)
app.get('/api/v1/public/stats', getPublicStats);
app.get('/api/public/stats', getPublicStats);
app.post('/api/v1/public/stats/visit', recordPublicVisit);
app.post('/api/public/stats/visit', recordPublicVisit);

// ===== AUTHENTICATION MIDDLEWARE (Protects all /api routes below this) =====
app.use('/api/v1', verifyToken);
app.use('/api', verifyToken);

// ===== PROTECTED API Routes (v1) =====
app.use('/api/v1/students', studentRoutes);
app.use('/api/v1/fees', feeRoutes);
app.use('/api/v1/seats', seatRoutes);
app.use('/api/v1/requests', requestRoutes);
app.use('/api/v1/dashboard', dashboardRoutes);
app.use('/api/v1/reports', reportRoutes);

// ===== API Routes (Legacy) =====
app.use('/api/students', studentRoutes);
app.use('/api/fees', feeRoutes);
app.use('/api/seats', seatRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/reports', reportRoutes);

// ===== Error Handling Middleware =====
app.use((err, req, res, next) => {
  console.error('Error:', err);
  
  if (err.message === 'CORS not allowed') {
    return res.status(403).json({ error: 'CORS not allowed' });
  }
  
  if (err.name === 'ValidationError') {
    return res.status(400).json({ error: err.message });
  }
  
  res.status(500).json({ 
    error: 'Internal Server Error',
    message: err.message 
  });
});

// ===== 404 Handler =====
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// ===== Database Connection =====
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/library_management';

// Only start server and connect to DB if not in test mode
if (process.env.NODE_ENV !== 'test') {
  // Start server
  app.listen(PORT, () => {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`✓ Server is running on port ${PORT}`);
    console.log(`✓ API available at http://localhost:${PORT}/api`);
    console.log(`✓ V1 API available at http://localhost:${PORT}/api/v1`);
    console.log(`✓ Health check at http://localhost:${PORT}/api/health`);
    console.log(`${'='.repeat(60)}\n`);
  });

  // Connect to MongoDB with retry mechanism
  const connectDB = async () => {
    try {
      await mongoose.connect(MONGODB_URI, {
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 5000,
        maxPoolSize: 10,
        minPoolSize: 5
      });
      console.log('✓ Connected to MongoDB successfully');
      console.log(`✓ Database: ${MONGODB_URI.split('/').pop()}\n`);
    } catch (error) {
      console.warn('⚠ MongoDB connection failed. Retrying in 5 seconds...');
      console.warn(`  Error: ${error.message}`);
      setTimeout(connectDB, 5000);
    }
  };

  connectDB();
}

// ===== Graceful Shutdown =====
process.on('SIGINT', async () => {
  console.log('\n✓ Shutting down gracefully...');
  await mongoose.connection.close();
  console.log('✓ MongoDB connection closed');
  process.exit(0);
});

export default app;
