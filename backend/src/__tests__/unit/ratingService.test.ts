import prisma from '../../lib/prisma';
import {
  recalculateOysterRatings,
  recalculateAllRatings,
  getOysterRatingStats,
} from '../../services/ratingService';
import { ReviewRating } from '@prisma/client';

describe('Rating Service', () => {
  let testOysterId: string;
  let userId1: string;
  let userId2: string;
  let userId3: string;
  let userId4: string;
  let userId5: string;

  beforeAll(async () => {
    // Cleanup any existing test data first
    await prisma.user.deleteMany({
      where: {
        email: {
          in: [
            'ratingtest1@oysterette.com',
            'ratingtest2@oysterette.com',
            'ratingtest3@oysterette.com',
            'ratingtest4@oysterette.com',
            'ratingtest5@oysterette.com',
          ],
        },
      },
    });

    // Create test users
    const user1 = await prisma.user.create({
      data: {
        email: 'ratingtest1@oysterette.com',
        name: 'Rating Test User 1',
        password: 'hashedpassword123',
        credibilityScore: 1.2, // High credibility
      },
    });
    userId1 = user1.id;

    const user2 = await prisma.user.create({
      data: {
        email: 'ratingtest2@oysterette.com',
        name: 'Rating Test User 2',
        password: 'hashedpassword123',
        credibilityScore: 0.8, // Low credibility
      },
    });
    userId2 = user2.id;

    const user3 = await prisma.user.create({
      data: {
        email: 'ratingtest3@oysterette.com',
        name: 'Rating Test User 3',
        password: 'hashedpassword123',
        credibilityScore: 1.0,
      },
    });
    userId3 = user3.id;

    const user4 = await prisma.user.create({
      data: {
        email: 'ratingtest4@oysterette.com',
        name: 'Rating Test User 4',
        password: 'hashedpassword123',
        credibilityScore: 1.0,
      },
    });
    userId4 = user4.id;

    const user5 = await prisma.user.create({
      data: {
        email: 'ratingtest5@oysterette.com',
        name: 'Rating Test User 5',
        password: 'hashedpassword123',
        credibilityScore: 1.0,
      },
    });
    userId5 = user5.id;

    // Create a test oyster
    const oyster = await prisma.oyster.create({
      data: {
        name: 'Rating Test Oyster',
        species: 'Crassostrea gigas',
        origin: 'Test Bay',
        size: 5,
        body: 5,
        sweetBrininess: 5,
        flavorfulness: 5,
        creaminess: 5,
      },
    });
    testOysterId = oyster.id;
  });

  afterAll(async () => {
    // Cleanup
    if (testOysterId) {
      await prisma.review.deleteMany({
        where: { oysterId: testOysterId },
      });
      await prisma.oyster.deleteMany({
        where: { id: testOysterId },
      });
    }
    await prisma.user.deleteMany({
      where: {
        email: {
          in: [
            'ratingtest1@oysterette.com',
            'ratingtest2@oysterette.com',
            'ratingtest3@oysterette.com',
            'ratingtest4@oysterette.com',
            'ratingtest5@oysterette.com',
          ],
        },
      },
    });
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    // Clear reviews before each test
    await prisma.review.deleteMany({
      where: { oysterId: testOysterId },
    });

    // Reset oyster to default values
    await prisma.oyster.update({
      where: { id: testOysterId },
      data: {
        size: 5,
        body: 5,
        sweetBrininess: 5,
        flavorfulness: 5,
        creaminess: 5,
        totalReviews: 0,
        avgRating: 0,
        avgSize: 5,
        avgBody: 5,
        avgSweetBrininess: 5,
        avgFlavorfulness: 5,
        avgCreaminess: 5,
        overallScore: 5,
      },
    });
  });

  describe('recalculateOysterRatings', () => {
    it('should use seed data when no reviews exist', async () => {
      await recalculateOysterRatings(testOysterId);

      const oyster = await prisma.oyster.findUnique({
        where: { id: testOysterId },
      });

      expect(oyster?.totalReviews).toBe(0);
      expect(oyster?.avgRating).toBe(0);
      expect(oyster?.avgSize).toBe(5);
      expect(oyster?.avgBody).toBe(5);
      expect(oyster?.avgSweetBrininess).toBe(5);
      expect(oyster?.avgFlavorfulness).toBe(5);
      expect(oyster?.avgCreaminess).toBe(5);
      expect(oyster?.overallScore).toBe(5.0); // Default when no reviews
    });

    it('should calculate ratings with single review', async () => {
      // Create a review
      await prisma.review.create({
        data: {
          userId: userId1,
          oysterId: testOysterId,
          rating: ReviewRating.LOVE_IT, // 10.0
          size: 8,
          body: 7,
          sweetBrininess: 6,
          flavorfulness: 9,
          creaminess: 7,
          weightedScore: 1.0, // Neutral review quality
        },
      });

      await recalculateOysterRatings(testOysterId);

      const oyster = await prisma.oyster.findUnique({
        where: { id: testOysterId },
      });

      expect(oyster?.totalReviews).toBe(1);
      expect(oyster?.avgRating).toBeCloseTo(10.0, 1); // LOVE_IT = 10.0
      expect(oyster?.overallScore).toBeCloseTo(10.0, 1);

      // With 1 review, user weight is gradual (1/5 * 0.7 = 0.14)
      // avgSize = (1 - 0.14) * 5 + 0.14 * (8 * 1.0 * 1.2)
      // Note: User has credibilityScore of 1.2
      expect(oyster?.avgSize).toBeGreaterThan(5);
      expect(oyster?.avgSize).toBeLessThan(8);
    });

    it('should calculate ratings with multiple reviews', async () => {
      // Create multiple reviews
      await prisma.review.createMany({
        data: [
          {
            userId: userId1,
            oysterId: testOysterId,
            rating: ReviewRating.LOVE_IT, // 10.0
            size: 8,
            body: 7,
            sweetBrininess: 6,
            flavorfulness: 9,
            creaminess: 7,
            weightedScore: 1.0,
          },
          {
            userId: userId2,
            oysterId: testOysterId,
            rating: ReviewRating.LIKE_IT, // 7.5
            size: 6,
            body: 6,
            sweetBrininess: 7,
            flavorfulness: 6,
            creaminess: 6,
            weightedScore: 1.0,
          },
        ],
      });

      await recalculateOysterRatings(testOysterId);

      const oyster = await prisma.oyster.findUnique({
        where: { id: testOysterId },
      });

      expect(oyster?.totalReviews).toBe(2);
      // Rating should be weighted average of 10.0 and 7.5 with credibility
      expect(oyster?.avgRating).toBeGreaterThan(7.5);
      expect(oyster?.avgRating).toBeLessThanOrEqual(10.0);
    });

    it('should weight reviews by review quality score', async () => {
      // High quality review (weighted 1.5x)
      await prisma.review.create({
        data: {
          userId: userId1,
          oysterId: testOysterId,
          rating: ReviewRating.LOVE_IT,
          size: 10,
          body: 10,
          sweetBrininess: 10,
          flavorfulness: 10,
          creaminess: 10,
          weightedScore: 1.5, // High quality
        },
      });

      // Low quality review (weighted 0.5x)
      await prisma.review.create({
        data: {
          userId: userId2,
          oysterId: testOysterId,
          rating: ReviewRating.MEH,
          size: 1,
          body: 1,
          sweetBrininess: 1,
          flavorfulness: 1,
          creaminess: 1,
          weightedScore: 0.5, // Low quality
        },
      });

      await recalculateOysterRatings(testOysterId);

      const oyster = await prisma.oyster.findUnique({
        where: { id: testOysterId },
      });

      // High quality review should have more influence
      expect(oyster?.avgRating).toBeGreaterThan(5.0);
    });

    it('should weight reviews by reviewer credibility', async () => {
      // userId1 has credibilityScore of 1.2 (high)
      // userId2 has credibilityScore of 0.8 (low)

      await prisma.review.createMany({
        data: [
          {
            userId: userId1,
            oysterId: testOysterId,
            rating: ReviewRating.LOVE_IT,
            size: 10,
            body: 10,
            sweetBrininess: 10,
            flavorfulness: 10,
            creaminess: 10,
            weightedScore: 1.0,
          },
          {
            userId: userId2,
            oysterId: testOysterId,
            rating: ReviewRating.MEH,
            size: 1,
            body: 1,
            sweetBrininess: 1,
            flavorfulness: 1,
            creaminess: 1,
            weightedScore: 1.0,
          },
        ],
      });

      await recalculateOysterRatings(testOysterId);

      const oyster = await prisma.oyster.findUnique({
        where: { id: testOysterId },
      });

      // High credibility user's review should have more influence
      expect(oyster?.avgRating).toBeGreaterThan(5.0);
    });

    it('should handle null attribute values gracefully', async () => {
      // Review with some null attributes
      await prisma.review.create({
        data: {
          userId: userId1,
          oysterId: testOysterId,
          rating: ReviewRating.LIKE_IT,
          size: null,
          body: null,
          sweetBrininess: 7,
          flavorfulness: 8,
          creaminess: null,
          weightedScore: 1.0,
        },
      });

      await recalculateOysterRatings(testOysterId);

      const oyster = await prisma.oyster.findUnique({
        where: { id: testOysterId },
      });

      // Should still calculate, using seed values for null attributes
      expect(oyster?.totalReviews).toBe(1);
      expect(oyster?.avgSize).toBe(5); // Seed value (no user data)
      expect(oyster?.avgSweetBrininess).toBeGreaterThanOrEqual(5); // Has user data
    });

    it('should use full user weight with 5+ reviews', async () => {
      // Create 5 reviews with high ratings (one from each user)
      await prisma.review.createMany({
        data: [
          {
            userId: userId1,
            oysterId: testOysterId,
            rating: ReviewRating.LOVE_IT,
            size: 10,
            body: 10,
            sweetBrininess: 10,
            flavorfulness: 10,
            creaminess: 10,
            weightedScore: 1.0,
          },
          {
            userId: userId2,
            oysterId: testOysterId,
            rating: ReviewRating.LOVE_IT,
            size: 10,
            body: 10,
            sweetBrininess: 10,
            flavorfulness: 10,
            creaminess: 10,
            weightedScore: 1.0,
          },
          {
            userId: userId3,
            oysterId: testOysterId,
            rating: ReviewRating.LOVE_IT,
            size: 10,
            body: 10,
            sweetBrininess: 10,
            flavorfulness: 10,
            creaminess: 10,
            weightedScore: 1.0,
          },
          {
            userId: userId4,
            oysterId: testOysterId,
            rating: ReviewRating.LOVE_IT,
            size: 10,
            body: 10,
            sweetBrininess: 10,
            flavorfulness: 10,
            creaminess: 10,
            weightedScore: 1.0,
          },
          {
            userId: userId5,
            oysterId: testOysterId,
            rating: ReviewRating.LOVE_IT,
            size: 10,
            body: 10,
            sweetBrininess: 10,
            flavorfulness: 10,
            creaminess: 10,
            weightedScore: 1.0,
          },
        ],
      });

      await recalculateOysterRatings(testOysterId);

      const oyster = await prisma.oyster.findUnique({
        where: { id: testOysterId },
      });

      expect(oyster?.totalReviews).toBe(5);
      // With 5+ reviews, user weight = 0.7, so attributes should be much closer to 10 than 5
      expect(oyster?.avgSize).toBeGreaterThan(8);
    });

    it('should throw error for non-existent oyster', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      await expect(recalculateOysterRatings(fakeId)).rejects.toThrow(
        `Oyster not found: ${fakeId}`
      );
    });
  });

  describe('recalculateAllRatings', () => {
    it('should recalculate ratings for all oysters', async () => {
      // Cleanup any existing test oyster first
      await prisma.oyster.deleteMany({
        where: { name: 'Rating Test Oyster 2' },
      });

      // Create another test oyster
      const oyster2 = await prisma.oyster.create({
        data: {
          name: 'Rating Test Oyster 2',
          species: 'Crassostrea virginica',
          origin: 'Test Bay 2',
        },
      });

      // Add review to first oyster
      await prisma.review.create({
        data: {
          userId: userId1,
          oysterId: testOysterId,
          rating: ReviewRating.LOVE_IT,
          weightedScore: 1.0,
        },
      });

      // Add review to second oyster
      await prisma.review.create({
        data: {
          userId: userId1,
          oysterId: oyster2.id,
          rating: ReviewRating.LIKE_IT,
          weightedScore: 1.0,
        },
      });

      await recalculateAllRatings();

      // Check first oyster
      const updated1 = await prisma.oyster.findUnique({
        where: { id: testOysterId },
      });
      expect(updated1?.totalReviews).toBe(1);

      // Check second oyster
      const updated2 = await prisma.oyster.findUnique({
        where: { id: oyster2.id },
      });
      expect(updated2?.totalReviews).toBe(1);

      // Cleanup
      await prisma.review.deleteMany({
        where: { oysterId: oyster2.id },
      });
      await prisma.oyster.deleteMany({
        where: { id: oyster2.id },
      });
    });
  });

  describe('getOysterRatingStats', () => {
    it('should return stats for oyster with no reviews', async () => {
      const stats = await getOysterRatingStats(testOysterId);

      expect(stats.totalReviews).toBe(0);
      expect(stats.avgRating).toBe(0);
      expect(stats.ratingBreakdown).toEqual({
        loveIt: 0,
        likeIt: 0,
        okay: 0,
        meh: 0,
      });
      expect(stats.userRatingWeight).toBe(0);
      expect(stats.seedDataWeight).toBe(1);
    });

    it('should return stats for oyster with reviews', async () => {
      // Create reviews with different ratings
      await prisma.review.createMany({
        data: [
          {
            userId: userId1,
            oysterId: testOysterId,
            rating: ReviewRating.LOVE_IT,
            weightedScore: 1.0,
          },
          {
            userId: userId2,
            oysterId: testOysterId,
            rating: ReviewRating.LOVE_IT,
            weightedScore: 1.0,
          },
          {
            userId: userId3,
            oysterId: testOysterId,
            rating: ReviewRating.LIKE_IT,
            weightedScore: 1.0,
          },
        ],
      });

      // Recalculate first
      await recalculateOysterRatings(testOysterId);

      const stats = await getOysterRatingStats(testOysterId);

      expect(stats.totalReviews).toBe(3);
      expect(stats.ratingBreakdown.loveIt).toBe(2);
      expect(stats.ratingBreakdown.likeIt).toBe(1);
      expect(stats.ratingBreakdown.okay).toBe(0);
      expect(stats.ratingBreakdown.meh).toBe(0);

      // With 3 reviews, user weight = 3/5 * 0.7 = 0.42
      expect(stats.userRatingWeight).toBeCloseTo(0.42, 2);
      expect(stats.seedDataWeight).toBeCloseTo(0.58, 2);
    });

    it('should throw error for non-existent oyster', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      await expect(getOysterRatingStats(fakeId)).rejects.toThrow(
        `Oyster not found: ${fakeId}`
      );
    });
  });
});
