import request from 'supertest';
import express from 'express';
import cors from 'cors';
import authRoutes from '../../routes/authRoutes';
import reviewRoutes from '../../routes/reviewRoutes';
import voteRoutes from '../../routes/voteRoutes';
import userRoutes from '../../routes/userRoutes';
import prisma from '../../lib/prisma';

// Create test app
const app = express();
app.use(cors());
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/users', userRoutes);
app.use('/api', voteRoutes); // Vote routes are nested under /api/reviews

describe('Vote API Integration Tests', () => {
  let authToken: string;
  let userId: string;
  let otherUserToken: string;
  let otherUserId: string;
  let oysterId: string;
  let reviewId: string;
  let otherReviewId: string;

  const testUser = {
    email: 'votetest@oysterette.com',
    name: 'Vote Test User',
    password: 'TestPassword123',
  };

  const otherUser = {
    email: 'voteother@oysterette.com',
    name: 'Other Vote User',
    password: 'TestPassword123',
  };

  // Setup
  beforeAll(async () => {
    // Cleanup existing oysters first
    await prisma.oyster.deleteMany({
      where: {
        name: 'Test Vote Oyster',
      },
    });

    // Cleanup existing data
    await prisma.user.deleteMany({
      where: {
        email: { in: [testUser.email, otherUser.email] },
      },
    });

    // Register test users
    const registerResponse = await request(app)
      .post('/api/auth/register')
      .send(testUser);

    authToken = registerResponse.body.data.token;
    userId = registerResponse.body.data.user.id;

    const otherRegisterResponse = await request(app)
      .post('/api/auth/register')
      .send(otherUser);

    otherUserToken = otherRegisterResponse.body.data.token;
    otherUserId = otherRegisterResponse.body.data.user.id;

    // Create test oyster
    const oyster = await prisma.oyster.create({
      data: {
        name: 'Test Vote Oyster',
        species: 'Crassostrea gigas',
        origin: 'Test Origin',
      },
    });
    oysterId = oyster.id;

    // Create reviews from both users
    const reviewResponse = await request(app)
      .post('/api/reviews')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        oysterId,
        rating: 'LOVED_IT',
        notes: 'Test review for voting',
      });

    reviewId = reviewResponse.body.data.id;

    const otherReviewResponse = await request(app)
      .post('/api/reviews')
      .set('Authorization', `Bearer ${otherUserToken}`)
      .send({
        oysterId,
        rating: 'LIKED_IT',
        notes: 'Other test review for voting',
      });

    otherReviewId = otherReviewResponse.body.data.id;
  });

  afterAll(async () => {
    // Cleanup
    await prisma.reviewVote.deleteMany({ where: { userId } });
    await prisma.reviewVote.deleteMany({ where: { userId: otherUserId } });
    await prisma.review.deleteMany({ where: { oysterId } });
    await prisma.oyster.deleteMany({ where: { id: oysterId } });
    await prisma.user.deleteMany({
      where: { email: { in: [testUser.email, otherUser.email] } },
    });
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    // Clear votes before each test
    await prisma.reviewVote.deleteMany({ where: { userId } });
  });

  describe('POST /api/reviews/:reviewId/vote', () => {
    it('should create an agree vote successfully', async () => {
      const response = await request(app)
        .post(`/api/reviews/${otherReviewId}/vote`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ isAgree: true })
        .expect(200);

      expect(response.body.message).toContain('successfully');

      // Verify vote was created
      const vote = await prisma.reviewVote.findUnique({
        where: {
          userId_reviewId: {
            userId,
            reviewId: otherReviewId,
          },
        },
      });

      expect(vote).not.toBeNull();
      expect(vote?.isAgree).toBe(true);
    });

    it('should create a disagree vote successfully', async () => {
      const response = await request(app)
        .post(`/api/reviews/${otherReviewId}/vote`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ isAgree: false })
        .expect(200);

      expect(response.body.message).toContain('successfully');

      const vote = await prisma.reviewVote.findUnique({
        where: {
          userId_reviewId: {
            userId,
            reviewId: otherReviewId,
          },
        },
      });

      expect(vote).not.toBeNull();
      expect(vote?.isAgree).toBe(false);
    });

    it('should update existing vote when voting again', async () => {
      // Create initial agree vote
      await request(app)
        .post(`/api/reviews/${otherReviewId}/vote`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ isAgree: true });

      // Change to disagree vote
      const response = await request(app)
        .post(`/api/reviews/${otherReviewId}/vote`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ isAgree: false })
        .expect(200);

      expect(response.body.message).toContain('successfully');

      const vote = await prisma.reviewVote.findUnique({
        where: {
          userId_reviewId: {
            userId,
            reviewId: otherReviewId,
          },
        },
      });

      expect(vote?.isAgree).toBe(false);
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .post(`/api/reviews/${otherReviewId}/vote`)
        .send({ isAgree: true })
        .expect(401);

      expect(response.body.error).toBeDefined();
    });

    it('should fail to vote on own review', async () => {
      const response = await request(app)
        .post(`/api/reviews/${reviewId}/vote`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ isAgree: true })
        .expect(400);

      expect(response.body.error).toContain('own review');
    });

    it('should fail with missing isAgree parameter', async () => {
      const response = await request(app)
        .post(`/api/reviews/${otherReviewId}/vote`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({})
        .expect(400);

      expect(response.body.error).toBeDefined();
    });

    it('should fail for non-existent review', async () => {
      const response = await request(app)
        .post('/api/reviews/nonexistent-id/vote')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ isAgree: true })
        .expect(400);

      expect(response.body.error).toBeDefined();
    });
  });

  describe('DELETE /api/reviews/:reviewId/vote', () => {
    beforeEach(async () => {
      // Create a vote to delete
      await request(app)
        .post(`/api/reviews/${otherReviewId}/vote`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ isAgree: true });
    });

    it('should remove vote successfully', async () => {
      const response = await request(app)
        .delete(`/api/reviews/${otherReviewId}/vote`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.message).toContain('removed');

      // Verify vote was deleted
      const vote = await prisma.reviewVote.findUnique({
        where: {
          userId_reviewId: {
            userId,
            reviewId: otherReviewId,
          },
        },
      });

      expect(vote).toBeNull();
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .delete(`/api/reviews/${otherReviewId}/vote`)
        .expect(401);

      expect(response.body.error).toBeDefined();
    });

    it('should fail when no vote exists', async () => {
      // Remove the vote first
      await request(app)
        .delete(`/api/reviews/${otherReviewId}/vote`)
        .set('Authorization', `Bearer ${authToken}`);

      // Try to remove again
      const response = await request(app)
        .delete(`/api/reviews/${otherReviewId}/vote`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);

      expect(response.body.error).toBeDefined();
    });
  });

  describe('GET /api/reviews/votes', () => {
    beforeEach(async () => {
      // Create multiple votes
      await request(app)
        .post(`/api/reviews/${otherReviewId}/vote`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ isAgree: true });
    });

    it('should get user votes for multiple reviews', async () => {
      const response = await request(app)
        .get(`/api/reviews/votes?reviewIds=${reviewId},${otherReviewId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.votes).toBeDefined();
      expect(typeof response.body.votes).toBe('object');
      expect(response.body.votes[otherReviewId]).toBe(true); // agree vote
      expect(response.body.votes[reviewId]).toBeNull(); // no vote on own review
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .get(`/api/reviews/votes?reviewIds=${reviewId}`)
        .expect(401);

      expect(response.body.error).toBeDefined();
    });

    it('should return empty votes for reviews without votes', async () => {
      // Create a new oyster to avoid unique constraint
      const newOyster = await prisma.oyster.create({
        data: {
          name: `Test Oyster ${Date.now()}`,
          species: 'Test species',
          origin: 'Test origin',
        },
      });

      // Create a new review
      const newReview = await prisma.review.create({
        data: {
          userId: otherUserId,
          oysterId: newOyster.id,
          rating: 'MEH',
        },
      });

      const response = await request(app)
        .get(`/api/reviews/votes?reviewIds=${newReview.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.votes[newReview.id]).toBeNull();

      // Cleanup
      await prisma.review.delete({ where: { id: newReview.id } });
      await prisma.oyster.delete({ where: { id: newOyster.id } });
    });
  });

  describe('GET /api/users/:userId/credibility', () => {
    it('should get user credibility information', async () => {
      const response = await request(app)
        .get(`/api/users/${otherUserId}/credibility`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('credibilityScore');
      expect(response.body).toHaveProperty('totalAgrees');
      expect(response.body).toHaveProperty('totalDisagrees');
      expect(response.body).toHaveProperty('reviewCount');
      expect(response.body).toHaveProperty('badge');
      expect(response.body.badge).toHaveProperty('level');
      expect(response.body.badge).toHaveProperty('color');
      expect(response.body.badge).toHaveProperty('icon');
    });

    it('should return credibility for user with votes', async () => {
      // Create a vote to affect credibility
      await request(app)
        .post(`/api/reviews/${otherReviewId}/vote`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ isAgree: true });

      const response = await request(app)
        .get(`/api/users/${otherUserId}/credibility`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.credibilityScore).toBeGreaterThanOrEqual(0.5);
      expect(response.body.credibilityScore).toBeLessThanOrEqual(1.5);
    });

    it('should fail for non-existent user', async () => {
      const response = await request(app)
        .get('/api/users/nonexistent-id/credibility')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.error).toContain('not found');
    });
  });

  describe('Vote credibility calculations', () => {
    it('should update review vote counts after voting', async () => {
      const reviewBefore = await prisma.review.findUnique({
        where: { id: otherReviewId },
      });

      const agreeCountBefore = reviewBefore?.agreeCount || 0;

      // Create agree vote
      await request(app)
        .post(`/api/reviews/${otherReviewId}/vote`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ isAgree: true });

      const reviewAfter = await prisma.review.findUnique({
        where: { id: otherReviewId },
      });

      expect(reviewAfter?.agreeCount).toBe(agreeCountBefore + 1);
    });

    it('should update review vote counts after removing vote', async () => {
      // Create vote
      await request(app)
        .post(`/api/reviews/${otherReviewId}/vote`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ isAgree: true });

      const reviewAfterVote = await prisma.review.findUnique({
        where: { id: otherReviewId },
      });

      const agreeCount = reviewAfterVote?.agreeCount || 0;

      // Remove vote
      await request(app)
        .delete(`/api/reviews/${otherReviewId}/vote`)
        .set('Authorization', `Bearer ${authToken}`);

      const reviewAfterRemove = await prisma.review.findUnique({
        where: { id: otherReviewId },
      });

      expect(reviewAfterRemove?.agreeCount).toBe(agreeCount - 1);
    });

    it('should update user credibility after receiving votes', async () => {
      const userBefore = await prisma.user.findUnique({
        where: { id: otherUserId },
      });

      const agreesBefore = userBefore?.totalAgrees || 0;

      // Vote on the user's review
      await request(app)
        .post(`/api/reviews/${otherReviewId}/vote`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ isAgree: true });

      const userAfter = await prisma.user.findUnique({
        where: { id: otherUserId },
      });

      expect(userAfter?.totalAgrees).toBe(agreesBefore + 1);
    });
  });
});
