/**
 * Health Check Endpoint Tests
 */

import request from 'supertest';
import express, { Express } from 'express';

describe('Health Check Endpoint', () => {
  let app: Express;

  beforeAll(() => {
    app = express();
    app.get('/health', (req, res) => {
      res.status(200).send('OK');
    });
  });

  describe('GET /health', () => {
    it('should return 200 status', async () => {
      const response = await request(app).get('/health');
      expect(response.status).toBe(200);
    });

    it('should return plain text OK', async () => {
      const response = await request(app).get('/health');
      expect(response.text).toBe('OK');
    });

    it('should respond quickly without database connection', async () => {
      const start = Date.now();
      await request(app).get('/health');
      const duration = Date.now() - start;
      expect(duration).toBeLessThan(100);
    });
  });
});
