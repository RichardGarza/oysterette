/**
 * XP Integration Tests
 */

import request from 'supertest';
import express from 'express';
import cors from 'cors';
import xpRoutes from '../../routes/xpRoutes';
import authRoutes from '../../routes/authRoutes';
import reviewRoutes from '../../routes/reviewRoutes';
import prisma from '../../lib/prisma';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'test-secret';

const app = express();
app.use(cors());
app.use(express.json());
app.use('/api/xp', xpRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/reviews', reviewRoutes);

describe('XP System', () => {
  let userToken: string;
  let userId: string;
  let oysterId: string;

  beforeAll(async () => {
    const user = await prisma.user.create({
      data: {
        name: 'XP Test User',
        email: `xp-test-${Date.now()}@test.com`,
        password: 'hashedpass',
      },
    });

    userId = user.id;
    userToken = jwt.sign({ userId }, JWT_SECRET, { expiresIn: '1h' });

    const oyster = await prisma.oyster.create({
      data: {
        name: `XP Test Oyster ${Date.now()}`,
        species: 'Pacific',
        origin: 'Test Origin',
      },
    });

    oysterId = oyster.id;
  });

  afterAll(async () => {
    await prisma.review.deleteMany({ where: { userId } });
    await prisma.oyster.deleteMany({ where: { id: oysterId } });
    await prisma.userAchievement.deleteMany({ where: { userId } });
    await prisma.user.deleteMany({ where: { id: userId } });
    await prisma.$disconnect();
  });

  describe('GET /api/xp/stats', () => {
    it('should return user XP stats', async () => {
      const res = await request(app)
        .get('/api/xp/stats')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('xp');
      expect(res.body.data).toHaveProperty('level');
      expect(res.body.data).toHaveProperty('currentStreak');
      expect(res.body.data).toHaveProperty('achievements');
    });

    it('should require authentication', async () => {
      const res = await request(app).get('/api/xp/stats');

      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/xp/leaderboard', () => {
    it('should return leaderboard', async () => {
      const res = await request(app).get('/api/xp/leaderboard');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('should respect limit parameter', async () => {
      const res = await request(app).get('/api/xp/leaderboard?limit=5');

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeLessThanOrEqual(5);
    });
  });

  describe('GET /api/xp/achievements', () => {
    it('should return all achievements', async () => {
      const res = await request(app).get('/api/xp/achievements');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  describe('XP Integration with Reviews', () => {
    it('should award XP when creating a review', async () => {
      const beforeStats = await request(app)
        .get('/api/xp/stats')
        .set('Authorization', `Bearer ${userToken}`);

      const beforeXP = beforeStats.body.data.xp;

      await request(app)
        .post('/api/reviews')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          oysterId,
          rating: 'LOVE_IT',
          size: 5,
          body: 5,
          sweetBrininess: 5,
          flavorfulness: 5,
          creaminess: 5,
        });

      const afterStats = await request(app)
        .get('/api/xp/stats')
        .set('Authorization', `Bearer ${userToken}`);

      const afterXP = afterStats.body.data.xp;

      expect(afterXP).toBeGreaterThan(beforeXP);
    });

    it('should unlock first review achievement', async () => {
      const stats = await request(app)
        .get('/api/xp/stats')
        .set('Authorization', `Bearer ${userToken}`);

      const achievements = stats.body.data.achievements;
      const firstReview = achievements.find((a: any) => a.key === 'first_review');

      expect(firstReview).toBeDefined();
      expect(firstReview.name).toBe('First Taste');
    });
  });
});
