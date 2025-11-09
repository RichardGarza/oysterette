/**
 * Redis Client Singleton
 *
 * Provides a resilient Redis connection with automatic reconnect.
 */

import Redis, { RedisOptions } from 'ioredis';
import logger from '../utils/logger';

const REDIS_ENABLED = process.env.REDIS_HOST ? true : false;

const REDIS_CONFIG: RedisOptions = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  maxRetriesPerRequest: 3,
  retryStrategy: (times: number) => {
    // Stop retrying after 3 attempts
    if (times > 3) {
      logger.warn('Redis connection failed after 3 attempts, giving up');
      return null;
    }
    const delay = Math.min(times * 200, 1000);
    return delay;
  },
  enableOfflineQueue: false,
  lazyConnect: true,
  connectTimeout: 2000,
};

class RedisClient {
  private static instance: Redis | null = null;
  private static connecting = false;

  static async getInstance(): Promise<Redis | null> {
    // If Redis not configured, return null immediately
    if (!REDIS_ENABLED) {
      return null;
    }

    if (this.instance && this.instance.status === 'ready') {
      return this.instance;
    }

    if (this.connecting) {
      // Wait for existing connection attempt
      await new Promise((resolve) => setTimeout(resolve, 100));
      return this.getInstance();
    }

    try {
      this.connecting = true;

      if (!this.instance) {
        this.instance = new Redis(REDIS_CONFIG);

        this.instance.on('connect', () => {
          logger.info('✅ Redis connected');
        });

        this.instance.on('ready', () => {
          logger.info('✅ Redis ready');
        });

        this.instance.on('error', () => {
          // Silent - errors logged at connection level
        });

        this.instance.on('close', () => {
          // Silent - expected when Redis unavailable
        });

        this.instance.on('reconnecting', () => {
          // Silent - stop spam
        });
      }

      await this.instance.connect();
      return this.instance;
    } catch (error) {
      logger.warn('Redis not available, using in-memory cache only');
      this.instance = null;
      return null;
    } finally {
      this.connecting = false;
    }
  }

  static async disconnect(): Promise<void> {
    if (this.instance) {
      await this.instance.quit();
      this.instance = null;
    }
  }

  static async healthCheck(): Promise<{ status: 'healthy' | 'unhealthy'; latency?: number }> {
    try {
      const redis = await this.getInstance();
      if (!redis) {
        return { status: 'unhealthy' };
      }

      const start = Date.now();
      await redis.ping();
      const latency = Date.now() - start;

      return { status: 'healthy', latency };
    } catch (error) {
      logger.error('Redis health check failed:', error);
      return { status: 'unhealthy' };
    }
  }
}

export default RedisClient;
