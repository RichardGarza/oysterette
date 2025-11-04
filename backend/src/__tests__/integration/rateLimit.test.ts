import request from 'supertest';
import express, { Express } from 'express';
import rateLimit from 'express-rate-limit';

/**
 * Rate Limiting Tests
 * Ensures rate limits protect against API abuse
 */

describe('Rate Limiting', () => {
  let app: Express;

  describe('Auth Rate Limiter (10 requests per window)', () => {
    beforeEach(() => {
      app = express();
      app.use(express.json());

      const authLimiter = rateLimit({
        windowMs: 60 * 1000, // 1 minute for testing (production: 15 minutes)
        max: 10,
        message: 'Too many authentication attempts, please try again later',
        standardHeaders: true,
        legacyHeaders: false,
      });

      app.post('/auth/test', authLimiter, (req, res) => {
        res.json({ success: true });
      });
    });

    it('should allow requests under the limit', async () => {
      for (let i = 0; i < 10; i++) {
        const response = await request(app).post('/auth/test').send({});
        expect(response.status).toBe(200);
      }
    });

    it('should block requests over the limit', async () => {
      // Make 10 successful requests
      for (let i = 0; i < 10; i++) {
        await request(app).post('/auth/test').send({});
      }

      // 11th request should be blocked
      const response = await request(app).post('/auth/test').send({});
      expect(response.status).toBe(429); // Too Many Requests
      expect(response.body.message || response.text).toContain('Too many');
    });

    it('should set rate limit headers', async () => {
      const response = await request(app).post('/auth/test').send({});

      expect(response.headers['ratelimit-limit']).toBeDefined();
      expect(response.headers['ratelimit-remaining']).toBeDefined();
      expect(response.headers['ratelimit-reset']).toBeDefined();
    });

    it('should decrement remaining count with each request', async () => {
      const response1 = await request(app).post('/auth/test').send({});
      const remaining1 = parseInt(response1.headers['ratelimit-remaining']);

      const response2 = await request(app).post('/auth/test').send({});
      const remaining2 = parseInt(response2.headers['ratelimit-remaining']);

      expect(remaining2).toBe(remaining1 - 1);
    });
  });

  describe('API Rate Limiter (100 requests per window)', () => {
    beforeEach(() => {
      app = express();
      app.use(express.json());

      const apiLimiter = rateLimit({
        windowMs: 60 * 1000, // 1 minute for testing
        max: 100,
        message: 'Too many requests, please try again later',
        standardHeaders: true,
        legacyHeaders: false,
      });

      app.get('/api/test', apiLimiter, (req, res) => {
        res.json({ success: true });
      });
    });

    it('should allow requests under the limit', async () => {
      for (let i = 0; i < 50; i++) {
        const response = await request(app).get('/api/test');
        expect(response.status).toBe(200);
      }
    });

    it('should block requests over the limit', async () => {
      // Make 100 successful requests
      for (let i = 0; i < 100; i++) {
        await request(app).get('/api/test');
      }

      // 101st request should be blocked
      const response = await request(app).get('/api/test');
      expect(response.status).toBe(429);
    });

    it('should set correct limit in headers', async () => {
      const response = await request(app).get('/api/test');
      expect(response.headers['ratelimit-limit']).toBe('100');
    });
  });

  describe('Rate Limit per IP', () => {
    beforeEach(() => {
      app = express();
      app.set('trust proxy', true); // Required for X-Forwarded-For header
      app.use(express.json());

      const limiter = rateLimit({
        windowMs: 60 * 1000,
        max: 5,
        standardHeaders: true,
        legacyHeaders: false,
      });

      app.get('/test', limiter, (req, res) => {
        res.json({ success: true });
      });
    });

    it('should track different IPs separately', async () => {
      // Requests from first IP
      for (let i = 0; i < 5; i++) {
        const response = await request(app)
          .get('/test')
          .set('X-Forwarded-For', '192.168.1.1');
        expect(response.status).toBe(200);
      }

      // 6th request from first IP should be blocked
      const blocked = await request(app)
        .get('/test')
        .set('X-Forwarded-For', '192.168.1.1');
      expect(blocked.status).toBe(429);

      // But request from second IP should succeed
      const newIP = await request(app)
        .get('/test')
        .set('X-Forwarded-For', '192.168.1.2');
      expect(newIP.status).toBe(200);
    });
  });

  describe('Rate Limit Headers', () => {
    beforeEach(() => {
      app = express();
      app.use(express.json());

      const limiter = rateLimit({
        windowMs: 60 * 1000,
        max: 10,
        standardHeaders: true,
        legacyHeaders: false,
      });

      app.get('/test', limiter, (req, res) => {
        res.json({ success: true });
      });
    });

    it('should include X-RateLimit-* headers (standard)', async () => {
      const response = await request(app).get('/test');

      expect(response.headers['ratelimit-limit']).toBeDefined();
      expect(response.headers['ratelimit-remaining']).toBeDefined();
      expect(response.headers['ratelimit-reset']).toBeDefined();
    });

    it('should not include legacy X-RateLimit-* headers', async () => {
      const response = await request(app).get('/test');

      expect(response.headers['x-ratelimit-limit']).toBeUndefined();
      expect(response.headers['x-ratelimit-remaining']).toBeUndefined();
      expect(response.headers['x-ratelimit-reset']).toBeUndefined();
    });

    it('should show remaining count of 9 after first request', async () => {
      const response = await request(app).get('/test');
      expect(response.headers['ratelimit-remaining']).toBe('9');
    });

    it('should show remaining count of 0 when limit reached', async () => {
      // Make 10 requests
      let lastResponse;
      for (let i = 0; i < 10; i++) {
        lastResponse = await request(app).get('/test');
      }

      expect(lastResponse!.headers['ratelimit-remaining']).toBe('0');
    });
  });

  describe('Rate Limit Window Reset', () => {
    it('should reset after window expires', async () => {
      app = express();
      app.use(express.json());

      const limiter = rateLimit({
        windowMs: 1000, // 1 second window for testing
        max: 3,
        standardHeaders: true,
      });

      app.get('/test', limiter, (req, res) => {
        res.json({ success: true });
      });

      // Use up the limit
      for (let i = 0; i < 3; i++) {
        const response = await request(app).get('/test');
        expect(response.status).toBe(200);
      }

      // Next request should be blocked
      const blocked = await request(app).get('/test');
      expect(blocked.status).toBe(429);

      // Wait for window to reset
      await new Promise((resolve) => setTimeout(resolve, 1100));

      // Should be able to make requests again
      const afterReset = await request(app).get('/test');
      expect(afterReset.status).toBe(200);
    }, 10000);
  });

  describe('Rate Limit Error Messages', () => {
    it('should return custom error message for auth limiter', async () => {
      app = express();
      app.use(express.json());

      const authLimiter = rateLimit({
        windowMs: 60 * 1000,
        max: 2,
        message: 'Too many authentication attempts, please try again later',
      });

      app.post('/auth/test', authLimiter, (req, res) => {
        res.json({ success: true });
      });

      // Use up limit
      await request(app).post('/auth/test');
      await request(app).post('/auth/test');

      // Get error message
      const response = await request(app).post('/auth/test');
      expect(response.text).toContain('authentication attempts');
    });

    it('should return custom error message for API limiter', async () => {
      app = express();
      app.use(express.json());

      const apiLimiter = rateLimit({
        windowMs: 60 * 1000,
        max: 2,
        message: 'Too many requests, please try again later',
      });

      app.get('/api/test', apiLimiter, (req, res) => {
        res.json({ success: true });
      });

      // Use up limit
      await request(app).get('/api/test');
      await request(app).get('/api/test');

      // Get error message
      const response = await request(app).get('/api/test');
      expect(response.text).toContain('Too many requests');
    });
  });
});
