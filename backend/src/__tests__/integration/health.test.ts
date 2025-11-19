/**
 * Health Check Endpoint Tests
 */

import request from 'supertest';
import express from 'express';
import healthRouter from '../../routes/health';
import { prisma } from '../../lib/prisma';
import RedisClient from '../../lib/redis';

// Mock Prisma
jest.mock('../../lib/prisma', () => ({
  prisma: {
    $queryRaw: jest.fn().mockResolvedValue([{}]),
    user: { count: jest.fn().mockResolvedValue(5) },
    oyster: { count: jest.fn().mockResolvedValue(131) },
    review: { count: jest.fn().mockResolvedValue(50) },
  },
}));

// Mock Redis
jest.mock('../../lib/redis', () => ({
  default: {
    healthCheck: jest.fn().mockResolvedValue({ status: 'healthy', latency: 2 }),
    getInstance: jest.fn().mockResolvedValue({
      ping: jest.fn().mockResolvedValue('PONG'),
      status: 'ready',
    }),
    disconnect: jest.fn().mockResolvedValue(undefined),
  },
}));

const app = express();
app.use('/api/health', healthRouter);

describe('Health Endpoints Integration Tests', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should return 200 for basic health check', async () => {
    const response = await request(app).get('/api/health');
    expect(response.status).toBe(200);
    expect(response.body.status).toBe('ok');
    expect(response.body.timestamp).toBeDefined();
    expect(response.body.uptime).toBeDefined();
  });

  it('should return 200 for database health check', async () => {
    const response = await request(app).get('/api/health/db');
    expect(response.status).toBe(200);
    expect(response.body.status).toBe('ok');
    expect(response.body.database).toBe('connected');
    expect(response.body.timestamp).toBeDefined();
  });

  it('should return 200 for Redis health check', async () => {
    const response = await request(app).get('/api/health/redis');
    expect(response.status).toBe(200);
    expect(response.body.status).toBe('ok');
    expect(response.body.redis).toBe('connected');
    expect(response.body.latency).toBeDefined();
    expect(response.body.timestamp).toBeDefined();
  });

  it('should return 200 for detailed health check', async () => {
    const response = await request(app).get('/api/health/detailed');
    expect(response.status).toBe(200);
    expect(response.body.status).toBe('ok');
    expect(response.body.database.status).toBe('connected');
    expect(response.body.database.stats.users).toBe(5);
    expect(response.body.database.stats.oysters).toBe(131);
    expect(response.body.database.stats.reviews).toBe(50);
    expect(response.body.redis.status).toBe('connected');
    expect(response.body.environment).toBeDefined();
    expect(response.body.version).toBeDefined();
  });

  it('should handle database error gracefully', async () => {
    (prisma.$queryRaw as jest.Mock).mockRejectedValueOnce(new Error('DB error'));
    const response = await request(app).get('/api/health/db');
    expect(response.status).toBe(503);
    expect(response.body.status).toBe('error');
    expect(response.body.database).toBe('disconnected');
  });

  it('should handle Redis error gracefully', async () => {
    (RedisClient.healthCheck as jest.Mock).mockRejectedValueOnce(new Error('Redis error'));
    const response = await request(app).get('/api/health/redis');
    expect(response.status).toBe(503);
    expect(response.body.status).toBe('error');
    expect(response.body.redis).toBe('disconnected');
  });
});

export default {};
