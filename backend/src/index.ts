// IMPORTANT: Load environment variables FIRST
import dotenv from 'dotenv';
dotenv.config();

// IMPORTANT: Initialize Sentry BEFORE importing express
import './utils/sentry-init';

// Now import express and other modules
import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import authRoutes from './routes/authRoutes';
import oysterRoutes from './routes/oysterRoutes';
import reviewRoutes from './routes/reviewRoutes';
import userRoutes from './routes/userRoutes';
import voteRoutes from './routes/voteRoutes';
import prisma from './lib/prisma';
import logger from './utils/logger';
import {
  getSentryRequestHandler,
  getSentryTracingHandler,
  setupSentryErrorHandler,
} from './utils/sentry';

const app: Express = express();
const PORT = process.env.PORT || 3000;

// Rate limiting
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 requests per window per IP
  message: 'Too many authentication attempts, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window per IP
  message: 'Too many requests, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

// Middleware
// Sentry request handler (must be first middleware)
app.use(getSentryRequestHandler());
app.use(getSentryTracingHandler());

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.get('/', (req: Request, res: Response) => {
  res.json({
    message: 'Oysterette API Server',
    version: '2.0.0',
    endpoints: {
      auth: '/api/auth',
      oysters: '/api/oysters',
      reviews: '/api/reviews',
      users: '/api/users',
      votes: '/api/reviews/:reviewId/vote',
    },
  });
});

app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/oysters', apiLimiter, oysterRoutes);
app.use('/api/reviews', apiLimiter, reviewRoutes);
app.use('/api/users', apiLimiter, userRoutes);
app.use('/api', apiLimiter, voteRoutes);

// Health check endpoint
app.get('/health', async (req: Request, res: Response) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.status(200).json({ status: 'healthy', database: 'connected' });
  } catch (error) {
    res.status(500).json({ status: 'unhealthy', database: 'disconnected' });
  }
});

// Sentry error handler (must be after all routes)
setupSentryErrorHandler(app);

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, closing server gracefully');
  await prisma.$disconnect();
  process.exit(0);
});

// Start server
app.listen(PORT, () => {
  logger.info(`✅ Oysterette API Server running on port ${PORT}`);
  logger.info(`📊 Environment: ${process.env.NODE_ENV}`);
  logger.info(`🗄️  Database: PostgreSQL`);
});
