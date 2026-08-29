import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './config/db.js';
import { errorHandler } from './middleware/errorHandler.js';

import authRoutes from './routes/authRoutes.js';
import requestRoutes from './routes/requestRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import certificateRoutes from './routes/certificateRoutes.js';
import publicRoutes from './routes/publicRoutes.js';
import studentRoutes from './routes/studentRoutes.js';

dotenv.config();

const app = express();

// 1. Universal CORS Header Middleware (Essential for Vercel Serverless Preflight OPTIONS)
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  next();
});

// 2. Standard CORS Middleware Fallback
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 3. Database Connection Middleware (Ensures DB connection on every Vercel Serverless request)
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    console.error('Database connection error in request:', err);
    next();
  }
});

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'UP', message: 'MERN Certificate Generator API Server Running' });
});

// Root Route Fallback
app.get('/', (req, res) => {
  res.json({ status: 'UP', message: 'MERN Certificate Generator API Server Root' });
});

// API Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/requests', requestRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/certificates', certificateRoutes);
app.use('/api/v1/public', publicRoutes);
app.use('/api/v1/student', studentRoutes);

// Error Handler Middleware
app.use(errorHandler);

const PORT = process.env.PORT || 8080;

if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`====================================================`);
    console.log(`[MERN Backend] Server running on http://localhost:${PORT}`);
    console.log(`====================================================`);
  });
}

export default app;
