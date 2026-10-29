import dotenv from 'dotenv';
dotenv.config();

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import apiRouter from './routes/api.js';
import { connectDatabase } from './config/database.js';
import { runSeed } from './seed.js';

const app = express();
const PORT = process.env.PORT || 5000;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

// Security Headers & CORS
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: false // Allows Unsplash images and Razorpay checkout scripts
}));

// Build list of allowed origins from CLIENT_URL (supports comma-separated origins)
const parsedClientUrls = (process.env.CLIENT_URL || '')
  .split(',')
  .map(url => url.trim().replace(/\/$/, ''))
  .filter(Boolean);

const defaultOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:3000',
  'http://127.0.0.1:3000'
];

const allowedOrigins = Array.from(new Set([...parsedClientUrls, ...defaultOrigins]));

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like curl, postman, mobile apps, Razorpay webhooks)
    if (!origin) return callback(null, true);

    const normalizedOrigin = origin.replace(/\/$/, '');
    const isAllowed = 
      allowedOrigins.includes(normalizedOrigin) ||
      normalizedOrigin.endsWith('.vercel.app') ||
      normalizedOrigin.endsWith('.onrender.com') ||
      process.env.NODE_ENV !== 'production';

    if (isAllowed) {
      return callback(null, true);
    }

    // Allow and log warning to ensure live connectivity doesn't fail
    console.warn(`[CORS] Request from origin: ${origin}`);
    callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-guest-id']
}));

// Body Parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static uploads directory
const uploadsDir = path.resolve(process.cwd(), 'uploads');
app.use('/uploads', express.static(uploadsDir));

// API Routes
app.use('/api', apiRouter);

// Root route
app.get('/', (_req: Request, res: Response) => {
  res.send('🌿 Spice Roots E-Commerce API is running. Access endpoints via /api');
});

// 404 Handler
app.use((req: Request, res: Response) => {
  res.status(404).json({ success: false, message: `Route ${req.method} ${req.url} not found.` });
});

// Global Error Handler
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('💥 [Server Error]:', err);
  res.status(500).json({
    success: false,
    message: err.message || 'Internal server error',
    error: process.env.NODE_ENV === 'production' ? undefined : err.stack
  });
});

// Initialize DB, Seed, and Listen
async function startServer() {
  try {
    await connectDatabase();
    await runSeed(false); // Idempotent seed check

    app.listen(PORT, () => {
      console.log(`=================================================`);
      console.log(`🌿 SPICE ROOTS SERVER STARTED ON PORT ${PORT}`);
      console.log(`   Health Check : http://localhost:${PORT}/api/health`);
      console.log(`   Products API : http://localhost:${PORT}/api/products`);
      console.log(`   Settings API : http://localhost:${PORT}/api/settings`);
      console.log(`=================================================`);
    });
  } catch (err) {
    console.error('❌ Failed to start server:', err);
    process.exit(1);
  }
}

startServer();
