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
import recommendationRoutes from './routes/recommendationRoutes';
import favoriteRoutes from './routes/favoriteRoutes';
import uploadRoutes from './routes/uploadRoutes';
import friendRoutes from './routes/friendRoutes';
import xpRoutes from './routes/xpRoutes';
import healthRoutes from './routes/health';
import prisma from './lib/prisma';
import logger from './utils/logger';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './config/swagger';
import {
  getSentryRequestHandler,
  getSentryTracingHandler,
  setupSentryErrorHandler,
} from './utils/sentry';

const app: Express = express();
const PORT = process.env.PORT || 3000;

// Trust proxy headers from Railway (required for rate limiting to work correctly)
// Railway uses a reverse proxy, so we trust the first proxy in the chain
// Setting to 1 is more secure than 'true' as it only trusts the immediate proxy
app.set('trust proxy', 1);

// Rate limiting with proper validation
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 requests per window per IP
  message: 'Too many authentication attempts, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  // Validate that we can get a real IP address
  validate: { trustProxy: false }, // Disable built-in validation, we configured trust proxy above
});

const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 60, // 60 requests per minute per IP (industry standard)
  message: 'Too many requests, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  validate: { trustProxy: false }, // Disable built-in validation, we configured trust proxy above
});

// Middleware
// Sentry request handler (must be first middleware)
app.use(getSentryRequestHandler());
app.use(getSentryTracingHandler());

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Simple health check for Railway
app.get('/health', (req: Request, res: Response) => {
  res.status(200).send('OK');
});

// Health check routes (no rate limiting for monitoring)
app.use('/api/health', healthRoutes);

// Routes
app.get('/', (req: Request, res: Response) => {
  res.json({
    message: 'Oysterette API Server',
    version: '2.0.0',
    documentation: '/api-docs',
    endpoints: {
      auth: '/api/auth',
      oysters: '/api/oysters',
      reviews: '/api/reviews',
      users: '/api/users',
      votes: '/api/reviews/:reviewId/vote',
      recommendations: '/api/recommendations',
      favorites: '/api/favorites',
      upload: '/api/upload',
      friends: '/api/friends',
      health: '/api/health',
    },
  });
});

app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/oysters', apiLimiter, oysterRoutes);
app.use('/api/reviews', apiLimiter, reviewRoutes);
app.use('/api/users', apiLimiter, userRoutes);
app.use('/api/recommendations', apiLimiter, recommendationRoutes);
app.use('/api/favorites', apiLimiter, favoriteRoutes);
app.use('/api/upload', apiLimiter, uploadRoutes);
app.use('/api/friends', apiLimiter, friendRoutes);
app.use('/api/xp', apiLimiter, xpRoutes);
app.use('/api', apiLimiter, voteRoutes);

// API Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

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
