import request from 'supertest';
import express from 'express';
import cors from 'cors';
import authRoutes from '../../routes/authRoutes';
import reviewRoutes from '../../routes/reviewRoutes';
import oysterRoutes from '../../routes/oysterRoutes';
import prisma from '../../lib/prisma';

// Create test app
const app = express();
app.use(cors());
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/oysters', oysterRoutes);

describe('Review API Integration Tests', () => {
  let authToken: string;
  let userId: string;
  let oysterId: string;
  let reviewId: string;
  let otherUserToken: string;
  let otherUserId: string;

  const testUser = {
    email: 'reviewtest@oysterette.com',
    name: 'Review Test User',
    password: 'testpassword123',
  };

  const otherUser = {
    email: 'otheruser@oysterette.com',
    name: 'Other User',
    password: 'testpassword123',
  };

  // Setup: Create users, oyster, and review
  beforeAll(async () => {
    // Cleanup existing oysters first
    await prisma.oyster.deleteMany({
      where: {
        name: 'Test Review Oyster',
      },
    });

    // Cleanup existing data
    await prisma.user.deleteMany({
      where: {
        email: { in: [testUser.email, otherUser.email] },
      },
    });

    // Register test user
    const registerResponse = await request(app)
      .post('/api/auth/register')
      .send(testUser);

    authToken = registerResponse.body.data.token;
    userId = registerResponse.body.data.user.id;

    // Register other user
    const otherRegisterResponse = await request(app)
      .post('/api/auth/register')
      .send(otherUser);

    otherUserToken = otherRegisterResponse.body.data.token;
    otherUserId = otherRegisterResponse.body.data.user.id;

    // Create a test oyster
    const oyster = await prisma.oyster.create({
      data: {
        name: 'Test Review Oyster',
        species: 'Crassostrea gigas',
        origin: 'Test Origin',
      },
    });
    oysterId = oyster.id;

    // Create a review
    const reviewResponse = await request(app)
      .post('/api/reviews')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        oysterId,
        rating: 'LOVED_IT',
        size: 7,
        body: 8,
        sweetBrininess: 6,
        flavorfulness: 9,
        creaminess: 7,
        notes: 'Original test review',
      });

    reviewId = reviewResponse.body.data.id;
  });

  afterAll(async () => {
    // Cleanup
    await prisma.review.deleteMany({ where: { oysterId } });
    await prisma.oyster.deleteMany({ where: { id: oysterId } });
    await prisma.user.deleteMany({
      where: { email: { in: [testUser.email, otherUser.email] } },
    });
    await prisma.$disconnect();
  });

  describe('PUT /api/reviews/:reviewId', () => {
    it('should update own review successfully', async () => {
      const updateData = {
        rating: 'LIKED_IT',
        size: 8,
        body: 7,
        notes: 'Updated test review',
      };

      const response = await request(app)
        .put(`/api/reviews/${reviewId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.rating).toBe(updateData.rating);
      expect(response.body.data.size).toBe(updateData.size);
      expect(response.body.data.notes).toBe(updateData.notes);
    });

    it('should fail to update without authentication', async () => {
      const response = await request(app)
        .put(`/api/reviews/${reviewId}`)
        .send({ rating: 'MEH' })
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should fail to update another user\'s review', async () => {
      const response = await request(app)
        .put(`/api/reviews/${reviewId}`)
        .set('Authorization', `Bearer ${otherUserToken}`)
        .send({ rating: 'HATED_IT' })
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Not authorized');
    });

    it('should fail to update non-existent review', async () => {
      const response = await request(app)
        .put('/api/reviews/nonexistent-id')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ rating: 'LIKED_IT' })
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('not found');
    });
  });

  describe('DELETE /api/reviews/:reviewId', () => {
    let deleteReviewId: string;
    let deleteOysterId: string;

    beforeEach(async () => {
      // Create a unique oyster for each delete test to avoid unique constraint issues
      const oyster = await prisma.oyster.create({
        data: {
          name: `Delete Test Oyster ${Date.now()}`,
          species: 'Crassostrea gigas',
          origin: 'Test Origin',
        },
      });
      deleteOysterId = oyster.id;

      // Create a review to delete
      const reviewResponse = await request(app)
        .post('/api/reviews')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          oysterId: deleteOysterId,
          rating: 'LIKED_IT',
          notes: 'Review to be deleted',
        });

      deleteReviewId = reviewResponse.body.data.id;
    });

    afterEach(async () => {
      // Cleanup the oyster created for this test
      if (deleteOysterId) {
        await prisma.review.deleteMany({ where: { oysterId: deleteOysterId } });
        await prisma.oyster.delete({ where: { id: deleteOysterId } });
      }
    });

    it('should delete own review successfully', async () => {
      const response = await request(app)
        .delete(`/api/reviews/${deleteReviewId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);

      // Verify review is deleted
      const review = await prisma.review.findUnique({
        where: { id: deleteReviewId },
      });
      expect(review).toBeNull();
    });

    it('should fail to delete without authentication', async () => {
      const response = await request(app)
        .delete(`/api/reviews/${deleteReviewId}`)
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should fail to delete another user\'s review', async () => {
      const response = await request(app)
        .delete(`/api/reviews/${deleteReviewId}`)
        .set('Authorization', `Bearer ${otherUserToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Not authorized');
    });

    it('should fail to delete non-existent review', async () => {
      const response = await request(app)
        .delete('/api/reviews/nonexistent-id')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('not found');
    });

    it('should recalculate oyster ratings after deletion', async () => {
      // Get oyster ratings before deletion
      const oysterBefore = await prisma.oyster.findUnique({
        where: { id: deleteOysterId },
        include: { reviews: true },
      });
      const reviewCountBefore = oysterBefore?.reviews.length || 0;

      // Delete the review
      await request(app)
        .delete(`/api/reviews/${deleteReviewId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Get oyster ratings after deletion
      const oysterAfter = await prisma.oyster.findUnique({
        where: { id: deleteOysterId },
        include: { reviews: true },
      });
      const reviewCountAfter = oysterAfter?.reviews.length || 0;

      expect(reviewCountAfter).toBe(reviewCountBefore - 1);
    });
  });

  describe('GET /api/reviews/oyster/:oysterId', () => {
    it('should get all reviews for an oyster', async () => {
      const response = await request(app)
        .get(`/api/reviews/oyster/${oysterId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.count).toBeGreaterThanOrEqual(1);
    });

    it('should return empty array for oyster with no reviews', async () => {
      const emptyOyster = await prisma.oyster.create({
        data: {
          name: 'Empty Oyster',
          species: 'Test species',
          origin: 'Test origin',
        },
      });

      const response = await request(app)
        .get(`/api/reviews/oyster/${emptyOyster.id}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual([]);
      expect(response.body.count).toBe(0);

      // Cleanup
      await prisma.oyster.delete({ where: { id: emptyOyster.id } });
    });
  });

  describe('GET /api/reviews/user', () => {
    it('should get current user\'s reviews', async () => {
      const response = await request(app)
        .get('/api/reviews/user')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.count).toBeGreaterThanOrEqual(1);

      // Verify all reviews belong to the user
      response.body.data.forEach((review: any) => {
        expect(review.userId).toBe(userId);
      });
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .get('/api/reviews/user')
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });
});
