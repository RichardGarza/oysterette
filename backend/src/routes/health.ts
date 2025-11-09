/**
 * Health Check Endpoint
 *
 * Monitors backend and database connectivity
 * Used for Railway health checks and monitoring
 */

import { Router } from 'express';
import { prisma } from '../lib/prisma';

const router = Router();

/**
 * GET /api/health
 * Basic health check - returns 200 if server is running
 */
router.get('/', (_req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

/**
 * GET /api/health/db
 * Database connectivity check
 */
router.get('/db', async (_req, res) => {
  try {
    // Simple query to check database connection
    await prisma.$queryRaw`SELECT 1`;

    res.status(200).json({
      status: 'ok',
      database: 'connected',
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('❌ [Health] Database health check failed:', error);

    res.status(503).json({
      status: 'error',
      database: 'disconnected',
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * GET /api/health/detailed
 * Detailed health check with metrics
 */
router.get('/detailed', async (_req, res) => {
  try {
    const startTime = Date.now();

    // Check database connectivity with a simple query
    await prisma.$queryRaw`SELECT 1`;

    const dbLatency = Date.now() - startTime;

    // Get database stats
    const userCount = await prisma.user.count();
    const oysterCount = await prisma.oyster.count();
    const reviewCount = await prisma.review.count();

    res.status(200).json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: {
        status: 'connected',
        latency: `${dbLatency}ms`,
        stats: {
          users: userCount,
          oysters: oysterCount,
          reviews: reviewCount,
        },
      },
      environment: process.env.NODE_ENV,
      version: process.env.npm_package_version || '2.0.0',
    });
  } catch (error: any) {
    console.error('❌ [Health] Detailed health check failed:', error);

    res.status(503).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: {
        status: 'disconnected',
        error: error.message,
      },
      environment: process.env.NODE_ENV,
    });
  }
});

export default router;
