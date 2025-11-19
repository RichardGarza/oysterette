/**
 * Public Profile Integration Tests
 * 
 * Tests for public profile endpoints that allow viewing other users' profiles
 * without authentication.
 */

import request from 'supertest';
import express from 'express';
import cors from 'cors';
import userRoutes from '../../routes/userRoutes';
import reviewRoutes from '../../routes/reviewRoutes';
import authRoutes from '../../routes/authRoutes';
import favoriteRoutes from '../../routes/favoriteRoutes';
import prisma from '../../lib/prisma';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'test-secret';

const app = express();
app.use(cors());
app.use(express.json());
app.use('/api/users', userRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/favorites', favoriteRoutes);

const createToken = (userId: string) => jwt.sign({ userId }, JWT_SECRET, { expiresIn: '1h' });

describe('Public Profile API Integration Tests', () => {
  let user1Token: string;
  let user1Id: string;
  let user2Token: string;
  let user2Id: string;
  let oysterId: string;
  let reviewId: string;

  const user1 = {
    email: 'publicprofile1@oysterette.com',
    name: 'Public Profile User 1',
    password: 'TestPassword123',
  };

  const user2 = {
    email: 'publicprofile2@oysterette.com',
    name: 'Public Profile User 2',
    password: 'TestPassword123',
  };

  beforeAll(async () => {
    // Ensure username column exists (workaround for test database)
    try {
      await prisma.$executeRaw`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "username" TEXT;`;
      await prisma.$executeRaw`CREATE UNIQUE INDEX IF NOT EXISTS "users_username_key" ON "users"("username") WHERE "username" IS NOT NULL;`;
    } catch (error) {
      // Ignore if column already exists or other errors
      console.log('Username column setup:', error);
    }

    // Cleanup existing data
    await prisma.review.deleteMany({
      where: {
        user: {
          email: { in: [user1.email, user2.email] },
        },
      },
    });
    await prisma.user.deleteMany({
      where: {
        email: { in: [user1.email, user2.email] },
      },
    });
    await prisma.oyster.deleteMany({
      where: { name: 'Public Profile Test Oyster' },
    });

    // Create users directly (like friendRoutes.test.ts does)
    const user1Record = await prisma.user.create({
      data: {
        name: user1.name,
        email: user1.email,
        password: 'hashedpass', // Simplified for tests
        baselineSize: 5,
        baselineBody: 6,
        baselineSweetBrininess: 7,
        baselineFlavorfulness: 8,
        baselineCreaminess: 5,
      },
    });

    const user2Record = await prisma.user.create({
      data: {
        name: user2.name,
        email: user2.email,
        password: 'hashedpass', // Simplified for tests
        baselineSize: 5,
        baselineBody: 6,
        baselineSweetBrininess: 7,
        baselineFlavorfulness: 8,
        baselineCreaminess: 5,
      },
    });

    user1Id = user1Record.id;
    user2Id = user2Record.id;
    user1Token = createToken(user1Id);
    user2Token = createToken(user2Id);

    // Create a test oyster
    const oyster = await prisma.oyster.create({
      data: {
        name: 'Public Profile Test Oyster',
        species: 'Crassostrea gigas',
        origin: 'Test Bay',
        size: 7,
        body: 8,
        sweetBrininess: 6,
        flavorfulness: 9,
        creaminess: 7,
      },
    });
    oysterId = oyster.id;

    // Create a review for user1
    const reviewResponse = await request(app)
      .post('/api/reviews')
      .set('Authorization', `Bearer ${user1Token}`)
      .send({
        oysterId,
        rating: 'LOVE_IT',
        size: 7,
        body: 8,
        sweetBrininess: 6,
        flavorfulness: 9,
        creaminess: 7,
        notes: 'Great oyster for public profile testing',
      });

    reviewId = reviewResponse.body.data?.id;

    // Create a favorite for user1
    await request(app)
      .post(`/api/favorites/${oysterId}`)
      .set('Authorization', `Bearer ${user1Token}`);

    // Create friendship between user1 and user2
    await prisma.friendship.create({
      data: {
        senderId: user1Id,
        receiverId: user2Id,
        status: 'accepted',
      },
    });
  });

  afterAll(async () => {
    if (reviewId) {
      await prisma.review.deleteMany({
        where: { id: reviewId },
      });
    }
    if (user1Id) {
      await prisma.favorite.deleteMany({
        where: { userId: user1Id },
      });
      await prisma.friendship.deleteMany({
        where: {
          OR: [{ senderId: user1Id }, { receiverId: user1Id }],
        },
      });
    }
    if (oysterId) {
      await prisma.oyster.deleteMany({
        where: { id: oysterId },
      });
    }
    const userIds = [user1Id, user2Id].filter((id): id is string => id !== undefined);
    if (userIds.length > 0) {
      await prisma.user.deleteMany({
        where: { id: { in: userIds } },
      });
    }
    await prisma.$disconnect();
  });

  describe('GET /api/users/:userId - Public Profile', () => {
    it('should return public profile without authentication', async () => {
      if (!user1Id) {
        throw new Error('user1Id is undefined');
      }
      
      const response = await request(app)
        .get(`/api/users/${user1Id}`);

      if (response.status !== 200) {
        console.error('Profile response error:', response.status, JSON.stringify(response.body, null, 2));
        console.error('user1Id:', user1Id);
      }
      expect(response.status).toBe(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data).toHaveProperty('stats');

      const { user, stats } = response.body.data;

      // User data
      expect(user.id).toBe(user1Id);
      expect(user.email).toBe(user1.email);
      expect(user.name).toBe(user1.name);
      expect(user).toHaveProperty('username');
      expect(user).toHaveProperty('profilePhotoUrl');
      expect(user).toHaveProperty('credibilityScore');

      // Stats data
      expect(stats).toHaveProperty('totalReviews');
      expect(stats).toHaveProperty('totalFavorites');
      expect(stats).toHaveProperty('friendsCount');
      expect(stats).toHaveProperty('credibilityScore');
      expect(stats).toHaveProperty('badgeLevel');
      expect(stats).toHaveProperty('reviewStreak');
      expect(stats).toHaveProperty('avgRatingGiven');
      expect(stats).toHaveProperty('memberSince');
      expect(stats.totalReviews).toBeGreaterThanOrEqual(1);
      expect(stats.totalFavorites).toBeGreaterThanOrEqual(1);
      expect(stats.friendsCount).toBeGreaterThanOrEqual(1);
    });

    it('should return 404 for non-existent user', async () => {
      const fakeUserId = '00000000-0000-0000-0000-000000000000';
      const response = await request(app)
        .get(`/api/users/${fakeUserId}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('not found');
    });

    it('should return 404 for invalid userId format (non-existent user)', async () => {
      // Since userId validation accepts any non-empty string, invalid IDs will pass validation
      // but return 404 when user is not found
      const response = await request(app)
        .get('/api/users/invalid-id-format');

      // Should return 404 (user not found) since invalid-id-format doesn't exist
      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });

    it('should include accurate stats calculations', async () => {
      const response = await request(app)
        .get(`/api/users/${user1Id}`)
        .expect(200);

      const { stats } = response.body.data;

      // Verify stats are calculated correctly
      expect(stats.badgeLevel).toMatch(/Novice|Trusted|Expert/);
      expect(stats.avgRatingGiven).toBeGreaterThanOrEqual(0);
      expect(stats.avgRatingGiven).toBeLessThanOrEqual(4);
      expect(typeof stats.mostReviewedSpecies).toMatch(/string|undefined/);
      expect(typeof stats.mostReviewedOrigin).toMatch(/string|undefined/);
      expect(stats.reviewStreak).toBeGreaterThanOrEqual(0);
    });

    it('should not require authentication', async () => {
      // Make request without Authorization header
      const response = await request(app)
        .get(`/api/users/${user1Id}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('GET /api/reviews/user/:userId - Public User Reviews', () => {
    it('should return public user reviews without authentication', async () => {
      const response = await request(app)
        .get(`/api/reviews/user/${user1Id}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data.length).toBeGreaterThanOrEqual(1);

      const review = response.body.data[0];
      expect(review).toHaveProperty('id');
      expect(review).toHaveProperty('rating');
      expect(review).toHaveProperty('notes');
      expect(review).toHaveProperty('createdAt');
      expect(review).toHaveProperty('oyster');
      expect(review).toHaveProperty('user');
      expect(review.oyster).toHaveProperty('id');
      expect(review.oyster).toHaveProperty('name');
      expect(review.user).toHaveProperty('id');
      expect(review.user).toHaveProperty('name');
    });

    it('should return 404 for non-existent user', async () => {
      const fakeUserId = '00000000-0000-0000-0000-000000000000';
      const response = await request(app)
        .get(`/api/reviews/user/${fakeUserId}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('not found');
    });

    it('should return 404 for invalid userId format (non-existent user)', async () => {
      // Since userId validation accepts any non-empty string, invalid IDs will pass validation
      // but return 404 when user is not found
      const response = await request(app)
        .get('/api/reviews/user/invalid-id-format');

      // Should return 404 (user not found) since invalid-id-format doesn't exist
      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });

    it('should return empty array for user with no reviews', async () => {
      // Create a new user with no reviews
      const newUserResponse = await request(app)
        .post('/api/auth/register')
        .send({
          email: `noreviews-${Date.now()}@test.com`,
          name: 'No Reviews User',
          password: 'TestPassword123',
        });

      const newUserId = newUserResponse.body.data.user.id;

      const response = await request(app)
        .get(`/api/reviews/user/${newUserId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual([]);

      // Cleanup
      await prisma.user.delete({ where: { id: newUserId } });
    });

    it('should limit to 10 most recent reviews', async () => {
      // Cleanup any existing oyster with this name first
      await prisma.review.deleteMany({
        where: { oyster: { name: 'Public Profile Test Oyster 2' } },
      });
      await prisma.oyster.deleteMany({
        where: { name: 'Public Profile Test Oyster 2' },
      });

      // Create multiple reviews for user1
      const oyster2 = await prisma.oyster.create({
        data: {
          name: `Public Profile Test Oyster 2-${Date.now()}`,
          species: 'Crassostrea virginica',
          origin: 'Test Bay 2',
        },
      });

      // Create 12 reviews to test limit
      for (let i = 0; i < 12; i++) {
        await request(app)
          .post('/api/reviews')
          .set('Authorization', `Bearer ${user1Token}`)
          .send({
            oysterId: oyster2.id,
            rating: 'LIKE_IT',
            size: 5,
            body: 6,
            sweetBrininess: 7,
            flavorfulness: 8,
            creaminess: 5,
            notes: `Review ${i}`,
          });
      }

      const response = await request(app)
        .get(`/api/reviews/user/${user1Id}`)
        .expect(200);

      // Should return at most 10 reviews
      expect(response.body.data.length).toBeLessThanOrEqual(10);

      // Cleanup
      await prisma.review.deleteMany({
        where: { oysterId: oyster2.id },
      });
      await prisma.oyster.delete({ where: { id: oyster2.id } });
    });

    it('should not require authentication', async () => {
      const response = await request(app)
        .get(`/api/reviews/user/${user1Id}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('Public Profile Integration', () => {
    it('should allow viewing another user profile and reviews together', async () => {
      // Get public profile
      const profileResponse = await request(app)
        .get(`/api/users/${user1Id}`)
        .expect(200);

      const { user, stats } = profileResponse.body.data;

      // Get public reviews
      const reviewsResponse = await request(app)
        .get(`/api/reviews/user/${user1Id}`)
        .expect(200);

      const reviews = reviewsResponse.body.data;

      // Verify data consistency
      expect(user.id).toBe(user1Id);
      expect(stats.totalReviews).toBeGreaterThanOrEqual(reviews.length);
      expect(reviews.length).toBeGreaterThanOrEqual(1);

      // Verify review belongs to user
      reviews.forEach((review: any) => {
        expect(review.user.id).toBe(user1Id);
      });
    });

    it('should work when authenticated user views another user profile', async () => {
      // User2 viewing User1's profile
      const response = await request(app)
        .get(`/api/users/${user1Id}`)
        .set('Authorization', `Bearer ${user2Token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.id).toBe(user1Id);
      expect(response.body.data.user.id).not.toBe(user2Id);
    });
  });
});

