import request from 'supertest';
import express from 'express';
import cors from 'cors';
import authRoutes from '../../routes/authRoutes';
import recommendationRoutes from '../../routes/recommendationRoutes';
import prisma from '../../lib/prisma';
import { ReviewRating } from '@prisma/client';

// Create test app
const app = express();
app.use(cors());
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/recommendations', recommendationRoutes);

describe('Recommendations API Integration Tests', () => {
  let authToken: string;
  let userId: string;
  let otherUserToken: string;
  let otherUserId: string;
  let oyster1Id: string;
  let oyster2Id: string;
  let oyster3Id: string;

  const testUser = {
    email: 'rectest@oysterette.com',
    name: 'Recommendation Test User',
    password: 'TestPassword123',
  };

  const otherUser = {
    email: 'recother@oysterette.com',
    name: 'Other Rec User',
    password: 'TestPassword123',
  };

  // Setup: Create users and test oysters with reviews
  beforeAll(async () => {
    // Cleanup existing data
    await prisma.user.deleteMany({
      where: {
        email: { in: [testUser.email, otherUser.email] },
      },
    });

    await prisma.oyster.deleteMany({
      where: {
        name: {
          in: ['Rec Test Oyster 1', 'Rec Test Oyster 2', 'Rec Test Oyster 3'],
        },
      },
    });

    // Register test user
    const userResponse = await request(app)
      .post('/api/auth/register')
      .send(testUser);

    authToken = userResponse.body.data.token;
    userId = userResponse.body.data.user.id;

    // Register other user
    const otherResponse = await request(app)
      .post('/api/auth/register')
      .send(otherUser);

    otherUserToken = otherResponse.body.data.token;
    otherUserId = otherResponse.body.data.user.id;

    // Create test oysters with different attributes
    const oyster1 = await prisma.oyster.create({
      data: {
        name: 'Rec Test Oyster 1',
        species: 'Crassostrea gigas',
        origin: 'Test Bay 1',
        size: 3, // Small
        body: 4,
        sweetBrininess: 8, // Sweet
        flavorfulness: 7,
        creaminess: 6,
      },
    });
    oyster1Id = oyster1.id;

    const oyster2 = await prisma.oyster.create({
      data: {
        name: 'Rec Test Oyster 2',
        species: 'Crassostrea gigas',
        origin: 'Test Bay 2',
        size: 7, // Large
        body: 8,
        sweetBrininess: 3, // Briny
        flavorfulness: 9,
        creaminess: 8,
      },
    });
    oyster2Id = oyster2.id;

    const oyster3 = await prisma.oyster.create({
      data: {
        name: 'Rec Test Oyster 3',
        species: 'Crassostrea virginica',
        origin: 'Test Bay 3',
        size: 5,
        body: 6,
        sweetBrininess: 5,
        flavorfulness: 6,
        creaminess: 5,
      },
    });
    oyster3Id = oyster3.id;

    // Create baseline flavor profile for test user (likes sweet oysters)
    await prisma.user.update({
      where: { id: userId },
      data: {
        preferences: {
          baselineFlavorProfile: {
            size: 4,
            body: 5,
            sweetBrininess: 8, // Prefers sweet
            flavorfulness: 7,
            creaminess: 6,
          },
        },
      },
    });

    // Add a review for test user (to enable collaborative filtering)
    await prisma.review.create({
      data: {
        userId,
        oysterId: oyster1Id,
        rating: ReviewRating.LOVE_IT,
        size: 3,
        body: 4,
        sweetBrininess: 8,
        flavorfulness: 7,
        creaminess: 6,
        weightedScore: 1.0,
      },
    });

    // Add similar review from other user (for collaborative filtering)
    await prisma.review.create({
      data: {
        userId: otherUserId,
        oysterId: oyster1Id,
        rating: ReviewRating.LOVE_IT,
        size: 3,
        body: 4,
        sweetBrininess: 8,
        flavorfulness: 7,
        creaminess: 6,
        weightedScore: 1.0,
      },
    });

    // Other user also reviewed oyster2 positively
    await prisma.review.create({
      data: {
        userId: otherUserId,
        oysterId: oyster2Id,
        rating: ReviewRating.LIKE_IT,
        size: 7,
        body: 8,
        sweetBrininess: 3,
        flavorfulness: 9,
        creaminess: 8,
        weightedScore: 1.0,
      },
    });
  });

  // Cleanup after all tests
  afterAll(async () => {
    await prisma.review.deleteMany({
      where: {
        userId: { in: [userId, otherUserId] },
      },
    });

    await prisma.user.deleteMany({
      where: {
        email: { in: [testUser.email, otherUser.email] },
      },
    });

    await prisma.oyster.deleteMany({
      where: {
        id: { in: [oyster1Id, oyster2Id, oyster3Id] },
      },
    });

    await prisma.$disconnect();
  });

  describe('GET /api/recommendations', () => {
    it('should return attribute-based recommendations', async () => {
      const response = await request(app)
        .get('/api/recommendations')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.meta).toHaveProperty('count');
      expect(response.body.meta).toHaveProperty('hasRecommendations');
    });

    it('should respect limit parameter (default 10)', async () => {
      const response = await request(app)
        .get('/api/recommendations')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data.length).toBeLessThanOrEqual(10);
    });

    it('should respect custom limit parameter', async () => {
      const response = await request(app)
        .get('/api/recommendations?limit=5')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data.length).toBeLessThanOrEqual(5);
    });

    it('should enforce max limit of 50', async () => {
      const response = await request(app)
        .get('/api/recommendations?limit=100')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data.length).toBeLessThanOrEqual(50);
    });

    it('should exclude already reviewed oysters', async () => {
      const response = await request(app)
        .get('/api/recommendations')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Should not recommend oyster1 (already reviewed)
      const recommendedIds = response.body.data.map((r: any) => r.id);
      expect(recommendedIds).not.toContain(oyster1Id);
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .get('/api/recommendations')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('No token provided');
    });
  });

  describe('GET /api/recommendations/collaborative', () => {
    it('should return collaborative filtering recommendations', async () => {
      const response = await request(app)
        .get('/api/recommendations/collaborative')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.meta.type).toBe('collaborative');
      expect(response.body.meta).toHaveProperty('count');
    });

    it('should work with limit parameter', async () => {
      const response = await request(app)
        .get('/api/recommendations/collaborative?limit=3')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data.length).toBeLessThanOrEqual(3);
    });

    it('should exclude already reviewed oysters', async () => {
      const response = await request(app)
        .get('/api/recommendations/collaborative')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const recommendedIds = response.body.data.map((r: any) => r.id);
      expect(recommendedIds).not.toContain(oyster1Id);
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .get('/api/recommendations/collaborative')
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/recommendations/hybrid', () => {
    it('should return hybrid recommendations', async () => {
      const response = await request(app)
        .get('/api/recommendations/hybrid')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.meta.type).toBe('hybrid');
      expect(response.body.meta).toHaveProperty('count');
    });

    it('should work with limit parameter', async () => {
      const response = await request(app)
        .get('/api/recommendations/hybrid?limit=5')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data.length).toBeLessThanOrEqual(5);
    });

    it('should exclude already reviewed oysters', async () => {
      const response = await request(app)
        .get('/api/recommendations/hybrid')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const recommendedIds = response.body.data.map((r: any) => r.id);
      expect(recommendedIds).not.toContain(oyster1Id);
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .get('/api/recommendations/hybrid')
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/recommendations/similar-users', () => {
    it('should return similar users', async () => {
      const response = await request(app)
        .get('/api/recommendations/similar-users')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.meta).toHaveProperty('count');
    });

    it('should include similarity scores', async () => {
      const response = await request(app)
        .get('/api/recommendations/similar-users')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      if (response.body.data.length > 0) {
        const user = response.body.data[0];
        expect(user).toHaveProperty('id');
        expect(user).toHaveProperty('name');
        expect(user).toHaveProperty('similarity');
        expect(typeof user.similarity).toBe('number');
      }
    });

    it('should respect limit parameter (default 10, max 20)', async () => {
      const response = await request(app)
        .get('/api/recommendations/similar-users?limit=5')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data.length).toBeLessThanOrEqual(5);
    });

    it('should enforce max limit of 20', async () => {
      const response = await request(app)
        .get('/api/recommendations/similar-users?limit=50')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data.length).toBeLessThanOrEqual(20);
    });

    it('should not include the requesting user', async () => {
      const response = await request(app)
        .get('/api/recommendations/similar-users')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const userIds = response.body.data.map((u: any) => u.id);
      expect(userIds).not.toContain(userId);
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .get('/api/recommendations/similar-users')
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });
});
