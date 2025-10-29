import prisma from '../../lib/prisma';
import { recalculateOysterRatings, getOysterRatingStats } from '../ratingService';
import { ReviewRating } from '@prisma/client';

// Mock Prisma
jest.mock('../../lib/prisma', () => ({
  __esModule: true,
  default: {
    oyster: {
      findUnique: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
    },
  },
}));

describe('Rating Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('recalculateOysterRatings', () => {
    it('should calculate ratings with no reviews (seed data only)', async () => {
      const mockOyster = {
        id: 'oyster-1',
        name: 'Test Oyster',
        size: 7,
        body: 6,
        sweetBrininess: 5,
        flavorfulness: 8,
        creaminess: 7,
        reviews: [],
      };

      (prisma.oyster.findUnique as jest.Mock).mockResolvedValue(mockOyster);
      (prisma.oyster.update as jest.Mock).mockResolvedValue({});

      await recalculateOysterRatings('oyster-1');

      expect(prisma.oyster.update).toHaveBeenCalledWith({
        where: { id: 'oyster-1' },
        data: expect.objectContaining({
          totalReviews: 0,
          avgRating: 0,
          avgSize: 7,
          avgBody: 6,
          avgSweetBrininess: 5,
          avgFlavorfulness: 8,
          avgCreaminess: 7,
          overallScore: expect.any(Number),
        }),
      });
    });

    it('should calculate weighted ratings with 5+ reviews (70% user weight)', async () => {
      const mockOyster = {
        id: 'oyster-1',
        name: 'Test Oyster',
        size: 5,
        body: 5,
        sweetBrininess: 5,
        flavorfulness: 5,
        creaminess: 5,
        reviews: [
          { rating: 'LOVED_IT' as ReviewRating, size: 9, body: 9, sweetBrininess: 9, flavorfulness: 9, creaminess: 9 },
          { rating: 'LOVED_IT' as ReviewRating, size: 9, body: 9, sweetBrininess: 9, flavorfulness: 9, creaminess: 9 },
          { rating: 'LOVED_IT' as ReviewRating, size: 9, body: 9, sweetBrininess: 9, flavorfulness: 9, creaminess: 9 },
          { rating: 'LOVED_IT' as ReviewRating, size: 9, body: 9, sweetBrininess: 9, flavorfulness: 9, creaminess: 9 },
          { rating: 'LOVED_IT' as ReviewRating, size: 9, body: 9, sweetBrininess: 9, flavorfulness: 9, creaminess: 9 },
        ],
      };

      (prisma.oyster.findUnique as jest.Mock).mockResolvedValue(mockOyster);
      (prisma.oyster.update as jest.Mock).mockResolvedValue({});

      await recalculateOysterRatings('oyster-1');

      const updateCall = (prisma.oyster.update as jest.Mock).mock.calls[0][0];

      // With 5 reviews, user weight should be 0.7
      // Expected: (1 - 0.7) * 5 + 0.7 * 9 = 1.5 + 6.3 = 7.8
      expect(updateCall.data.avgSize).toBeCloseTo(7.8, 1);
      expect(updateCall.data.avgRating).toBe(4); // LOVED_IT = 4
      expect(updateCall.data.totalReviews).toBe(5);
    });

    it('should handle mixed ratings correctly', async () => {
      const mockOyster = {
        id: 'oyster-1',
        name: 'Test Oyster',
        size: 5,
        body: 5,
        sweetBrininess: 5,
        flavorfulness: 5,
        creaminess: 5,
        reviews: [
          { rating: 'LOVED_IT' as ReviewRating, size: 9, body: null, sweetBrininess: null, flavorfulness: null, creaminess: null },
          { rating: 'LIKED_IT' as ReviewRating, size: 7, body: null, sweetBrininess: null, flavorfulness: null, creaminess: null },
          { rating: 'MEH' as ReviewRating, size: 5, body: null, sweetBrininess: null, flavorfulness: null, creaminess: null },
        ],
      };

      (prisma.oyster.findUnique as jest.Mock).mockResolvedValue(mockOyster);
      (prisma.oyster.update as jest.Mock).mockResolvedValue({});

      await recalculateOysterRatings('oyster-1');

      const updateCall = (prisma.oyster.update as jest.Mock).mock.calls[0][0];

      // Average rating: (4 + 3 + 2) / 3 = 3
      expect(updateCall.data.avgRating).toBe(3);
      expect(updateCall.data.totalReviews).toBe(3);
    });

    it('should throw error for non-existent oyster', async () => {
      (prisma.oyster.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(recalculateOysterRatings('non-existent')).rejects.toThrow(
        'Oyster not found: non-existent'
      );
    });
  });

  describe('getOysterRatingStats', () => {
    it('should return correct rating breakdown', async () => {
      const mockOyster = {
        id: 'oyster-1',
        name: 'Test Oyster',
        totalReviews: 10,
        avgRating: 3.2,
        overallScore: 7.5,
        reviews: [
          { rating: 'LOVED_IT' as ReviewRating },
          { rating: 'LOVED_IT' as ReviewRating },
          { rating: 'LOVED_IT' as ReviewRating },
          { rating: 'LIKED_IT' as ReviewRating },
          { rating: 'LIKED_IT' as ReviewRating },
          { rating: 'LIKED_IT' as ReviewRating },
          { rating: 'LIKED_IT' as ReviewRating },
          { rating: 'MEH' as ReviewRating },
          { rating: 'MEH' as ReviewRating },
          { rating: 'HATED_IT' as ReviewRating },
        ],
      };

      (prisma.oyster.findUnique as jest.Mock).mockResolvedValue(mockOyster);

      const stats = await getOysterRatingStats('oyster-1');

      expect(stats).toMatchObject({
        totalReviews: 10,
        avgRating: 3.2,
        overallScore: 7.5,
        ratingBreakdown: {
          lovedIt: 3,
          likedIt: 4,
          meh: 2,
          hatedIt: 1,
        },
      });
      expect(stats.userRatingWeight).toBeCloseTo(0.7, 1);
      expect(stats.seedDataWeight).toBeCloseTo(0.3, 1);
    });

    it('should handle oyster with no reviews', async () => {
      const mockOyster = {
        id: 'oyster-1',
        name: 'Test Oyster',
        totalReviews: 0,
        avgRating: 0,
        overallScore: 5,
        reviews: [],
      };

      (prisma.oyster.findUnique as jest.Mock).mockResolvedValue(mockOyster);

      const stats = await getOysterRatingStats('oyster-1');

      expect(stats.ratingBreakdown).toEqual({
        lovedIt: 0,
        likedIt: 0,
        meh: 0,
        hatedIt: 0,
      });
      expect(stats.userRatingWeight).toBe(0);
      expect(stats.seedDataWeight).toBe(1);
    });
  });

  describe('Rating Weight Calculation', () => {
    it('should use 0% user weight with 0 reviews', async () => {
      const mockOyster = {
        id: 'oyster-1',
        name: 'Test Oyster',
        size: 5,
        body: 5,
        sweetBrininess: 5,
        flavorfulness: 5,
        creaminess: 5,
        reviews: [],
      };

      (prisma.oyster.findUnique as jest.Mock).mockResolvedValue(mockOyster);
      (prisma.oyster.update as jest.Mock).mockResolvedValue({});

      await recalculateOysterRatings('oyster-1');

      const updateCall = (prisma.oyster.update as jest.Mock).mock.calls[0][0];

      // With 0 reviews, should use 100% seed data
      expect(updateCall.data.avgSize).toBe(5);
    });

    it('should gradually increase user weight from 0 to 5 reviews', async () => {
      // Test with 2 reviews (should be 2/5 * 0.7 = 0.28 user weight)
      const mockOyster = {
        id: 'oyster-1',
        name: 'Test Oyster',
        size: 5,
        body: 5,
        sweetBrininess: 5,
        flavorfulness: 5,
        creaminess: 5,
        reviews: [
          { rating: 'LOVED_IT' as ReviewRating, size: 10, body: 10, sweetBrininess: 10, flavorfulness: 10, creaminess: 10 },
          { rating: 'LOVED_IT' as ReviewRating, size: 10, body: 10, sweetBrininess: 10, flavorfulness: 10, creaminess: 10 },
        ],
      };

      (prisma.oyster.findUnique as jest.Mock).mockResolvedValue(mockOyster);
      (prisma.oyster.update as jest.Mock).mockResolvedValue({});

      await recalculateOysterRatings('oyster-1');

      const updateCall = (prisma.oyster.update as jest.Mock).mock.calls[0][0];

      // Weight: 2/5 * 0.7 = 0.28
      // Expected: (1 - 0.28) * 5 + 0.28 * 10 = 3.6 + 2.8 = 6.4
      expect(updateCall.data.avgSize).toBeCloseTo(6.4, 1);
    });
  });

  describe('Overall Score Calculation', () => {
    it('should calculate overall score as 40% rating + 60% attributes', async () => {
      const mockOyster = {
        id: 'oyster-1',
        name: 'Test Oyster',
        size: 8,
        body: 8,
        sweetBrininess: 8,
        flavorfulness: 8,
        creaminess: 8,
        reviews: [
          { rating: 'LOVED_IT' as ReviewRating, size: 8, body: 8, sweetBrininess: 8, flavorfulness: 8, creaminess: 8 },
          { rating: 'LOVED_IT' as ReviewRating, size: 8, body: 8, sweetBrininess: 8, flavorfulness: 8, creaminess: 8 },
          { rating: 'LOVED_IT' as ReviewRating, size: 8, body: 8, sweetBrininess: 8, flavorfulness: 8, creaminess: 8 },
          { rating: 'LOVED_IT' as ReviewRating, size: 8, body: 8, sweetBrininess: 8, flavorfulness: 8, creaminess: 8 },
          { rating: 'LOVED_IT' as ReviewRating, size: 8, body: 8, sweetBrininess: 8, flavorfulness: 8, creaminess: 8 },
        ],
      };

      (prisma.oyster.findUnique as jest.Mock).mockResolvedValue(mockOyster);
      (prisma.oyster.update as jest.Mock).mockResolvedValue({});

      await recalculateOysterRatings('oyster-1');

      const updateCall = (prisma.oyster.update as jest.Mock).mock.calls[0][0];

      // avgRating = 4, normalized to 10-point: 4/4 * 10 = 10
      // attributes average = 8
      // overall = 10 * 0.4 + 8 * 0.6 = 4 + 4.8 = 8.8
      expect(updateCall.data.overallScore).toBeCloseTo(8.8, 1);
    });
  });
});
