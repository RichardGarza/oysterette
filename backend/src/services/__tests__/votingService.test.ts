/**
 * Voting Service Unit Tests
 *
 * Tests credibility and weighted score calculation formulas:
 * - Credibility score formula: 1.0 + (netVotes / totalReviews) * 0.5
 * - Weighted score formula: 1.0 + (netVoteScore / 10)
 * - Vote weights: agree = 1.0, disagree = -0.6
 * - Bounds: credibility [0.5, 1.5], weighted score [0.4, 1.5]
 *
 * Coverage:
 * - Formula correctness
 * - Boundary conditions
 * - Edge cases (0 reviews, extreme ratios)
 * - Vote weight constants
 * - Credibility badge logic
 */

import {
  voteOnReview,
  removeVote,
  recalculateReviewScore,
  recalculateUserCredibility,
  getUserVotes,
  getCredibilityBadge,
} from '../votingService';
import prisma from '../../lib/prisma';

// Mock Prisma
jest.mock('../../lib/prisma', () => ({
  __esModule: true,
  default: {
    reviewVote: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findMany: jest.fn(),
    },
    review: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    $transaction: jest.fn(),
  },
}));

describe('Voting Service - Calculation Formulas', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Credibility Score Calculation', () => {
    it('should calculate neutral credibility for new users (0 reviews)', async () => {
      const mockUser = {
        id: 'user-1',
        totalAgrees: 0,
        totalDisagrees: 0,
        reviewCount: 0,
        credibilityScore: 1.0,
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (prisma.user.update as jest.Mock).mockResolvedValue({
        ...mockUser,
        credibilityScore: 1.0,
      });

      await recalculateUserCredibility('user-1');

      // Should set credibility to 1.0 (neutral)
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: { credibilityScore: 1.0 },
      });
    });

    it('should calculate credibility with all agrees (positive bias)', async () => {
      const mockUser = {
        id: 'user-1',
        totalAgrees: 10,
        totalDisagrees: 0,
        reviewCount: 10,
        credibilityScore: 1.0,
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (prisma.user.update as jest.Mock).mockResolvedValue(mockUser);

      await recalculateUserCredibility('user-1');

      // Formula: 1.0 + (10 - 0) / 10 * 0.5 = 1.0 + 0.5 = 1.5
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: { credibilityScore: 1.5 },
      });
    });

    it('should calculate credibility with all disagrees (negative bias)', async () => {
      const mockUser = {
        id: 'user-1',
        totalAgrees: 0,
        totalDisagrees: 10,
        reviewCount: 10,
        credibilityScore: 1.0,
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (prisma.user.update as jest.Mock).mockResolvedValue(mockUser);

      await recalculateUserCredibility('user-1');

      // Formula: 1.0 + (0 - 10) / 10 * 0.5 = 1.0 - 0.5 = 0.5
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: { credibilityScore: 0.5 },
      });
    });

    it('should calculate credibility with mixed votes (balanced)', async () => {
      const mockUser = {
        id: 'user-1',
        totalAgrees: 5,
        totalDisagrees: 5,
        reviewCount: 10,
        credibilityScore: 1.0,
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (prisma.user.update as jest.Mock).mockResolvedValue(mockUser);

      await recalculateUserCredibility('user-1');

      // Formula: 1.0 + (5 - 5) / 10 * 0.5 = 1.0 + 0 = 1.0 (neutral)
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: { credibilityScore: 1.0 },
      });
    });

    it('should calculate credibility with 75% agrees', async () => {
      const mockUser = {
        id: 'user-1',
        totalAgrees: 15,
        totalDisagrees: 5,
        reviewCount: 20,
        credibilityScore: 1.0,
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (prisma.user.update as jest.Mock).mockResolvedValue(mockUser);

      await recalculateUserCredibility('user-1');

      // Formula: 1.0 + (15 - 5) / 20 * 0.5 = 1.0 + 0.25 = 1.25
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: { credibilityScore: 1.25 },
      });
    });

    it('should clamp credibility to maximum of 1.5', async () => {
      const mockUser = {
        id: 'user-1',
        totalAgrees: 100,
        totalDisagrees: 0,
        reviewCount: 50, // More agrees than reviews (edge case)
        credibilityScore: 1.0,
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (prisma.user.update as jest.Mock).mockResolvedValue(mockUser);

      await recalculateUserCredibility('user-1');

      // Formula would give: 1.0 + (100 - 0) / 50 * 0.5 = 1.0 + 1.0 = 2.0
      // Should clamp to 1.5
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: { credibilityScore: 1.5 },
      });
    });

    it('should clamp credibility to minimum of 0.5', async () => {
      const mockUser = {
        id: 'user-1',
        totalAgrees: 0,
        totalDisagrees: 100,
        reviewCount: 50,
        credibilityScore: 1.0,
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (prisma.user.update as jest.Mock).mockResolvedValue(mockUser);

      await recalculateUserCredibility('user-1');

      // Formula would give: 1.0 + (0 - 100) / 50 * 0.5 = 1.0 - 1.0 = 0.0
      // Should clamp to 0.5
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: { credibilityScore: 0.5 },
      });
    });

    it('should handle single review with agree', async () => {
      const mockUser = {
        id: 'user-1',
        totalAgrees: 1,
        totalDisagrees: 0,
        reviewCount: 1,
        credibilityScore: 1.0,
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (prisma.user.update as jest.Mock).mockResolvedValue(mockUser);

      await recalculateUserCredibility('user-1');

      // Formula: 1.0 + (1 - 0) / 1 * 0.5 = 1.0 + 0.5 = 1.5
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: { credibilityScore: 1.5 },
      });
    });

    it('should handle single review with disagree', async () => {
      const mockUser = {
        id: 'user-1',
        totalAgrees: 0,
        totalDisagrees: 1,
        reviewCount: 1,
        credibilityScore: 1.0,
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (prisma.user.update as jest.Mock).mockResolvedValue(mockUser);

      await recalculateUserCredibility('user-1');

      // Formula: 1.0 + (0 - 1) / 1 * 0.5 = 1.0 - 0.5 = 0.5
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: { credibilityScore: 0.5 },
      });
    });

    it('should throw error if user not found', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(recalculateUserCredibility('nonexistent')).rejects.toThrow(
        'User not found'
      );
    });
  });

  describe('Review Weighted Score Calculation', () => {
    it('should calculate neutral weighted score (0 votes)', async () => {
      const mockReview = {
        id: 'review-1',
        agreeCount: 0,
        disagreeCount: 0,
        netVoteScore: 0,
        weightedScore: 1.0,
      };

      (prisma.review.findUnique as jest.Mock).mockResolvedValue(mockReview);
      (prisma.review.update as jest.Mock).mockResolvedValue(mockReview);

      await recalculateReviewScore('review-1');

      // Formula: 1.0 + (0 * 1.0 + 0 * -0.6) / 10 = 1.0 + 0 = 1.0
      expect(prisma.review.update).toHaveBeenCalledWith({
        where: { id: 'review-1' },
        data: {
          netVoteScore: 0,
          weightedScore: 1.0,
        },
      });
    });

    it('should calculate weighted score with only agrees', async () => {
      const mockReview = {
        id: 'review-1',
        agreeCount: 10,
        disagreeCount: 0,
        netVoteScore: 0,
        weightedScore: 1.0,
      };

      (prisma.review.findUnique as jest.Mock).mockResolvedValue(mockReview);
      (prisma.review.update as jest.Mock).mockResolvedValue(mockReview);

      await recalculateReviewScore('review-1');

      // netVoteScore = 10 * 1.0 + 0 * -0.6 = 10
      // weightedScore = 1.0 + 10 / 10 = 2.0 -> clamped to 1.5
      expect(prisma.review.update).toHaveBeenCalledWith({
        where: { id: 'review-1' },
        data: {
          netVoteScore: 10,
          weightedScore: 1.5, // Clamped to max
        },
      });
    });

    it('should calculate weighted score with only disagrees', async () => {
      const mockReview = {
        id: 'review-1',
        agreeCount: 0,
        disagreeCount: 10,
        netVoteScore: 0,
        weightedScore: 1.0,
      };

      (prisma.review.findUnique as jest.Mock).mockResolvedValue(mockReview);
      (prisma.review.update as jest.Mock).mockResolvedValue(mockReview);

      await recalculateReviewScore('review-1');

      // netVoteScore = 0 * 1.0 + 10 * -0.6 = -6
      // weightedScore = 1.0 + (-6) / 10 = 1.0 - 0.6 = 0.4
      expect(prisma.review.update).toHaveBeenCalledWith({
        where: { id: 'review-1' },
        data: {
          netVoteScore: -6,
          weightedScore: 0.4,
        },
      });
    });

    it('should verify agree weight is 1.0', async () => {
      const mockReview = {
        id: 'review-1',
        agreeCount: 5,
        disagreeCount: 0,
        netVoteScore: 0,
        weightedScore: 1.0,
      };

      (prisma.review.findUnique as jest.Mock).mockResolvedValue(mockReview);
      (prisma.review.update as jest.Mock).mockResolvedValue(mockReview);

      await recalculateReviewScore('review-1');

      // netVoteScore should be exactly 5 * 1.0 = 5
      expect(prisma.review.update).toHaveBeenCalledWith({
        where: { id: 'review-1' },
        data: {
          netVoteScore: 5,
          weightedScore: 1.5, // 1.0 + 5/10 = 1.5
        },
      });
    });

    it('should verify disagree weight is -0.6', async () => {
      const mockReview = {
        id: 'review-1',
        agreeCount: 0,
        disagreeCount: 5,
        netVoteScore: 0,
        weightedScore: 1.0,
      };

      (prisma.review.findUnique as jest.Mock).mockResolvedValue(mockReview);
      (prisma.review.update as jest.Mock).mockResolvedValue(mockReview);

      await recalculateReviewScore('review-1');

      // netVoteScore should be exactly 5 * -0.6 = -3
      expect(prisma.review.update).toHaveBeenCalledWith({
        where: { id: 'review-1' },
        data: {
          netVoteScore: -3,
          weightedScore: 0.7, // 1.0 + (-3)/10 = 0.7
        },
      });
    });

    it('should calculate weighted score with mixed votes', async () => {
      const mockReview = {
        id: 'review-1',
        agreeCount: 8,
        disagreeCount: 2,
        netVoteScore: 0,
        weightedScore: 1.0,
      };

      (prisma.review.findUnique as jest.Mock).mockResolvedValue(mockReview);
      (prisma.review.update as jest.Mock).mockResolvedValue(mockReview);

      await recalculateReviewScore('review-1');

      // netVoteScore = 8 * 1.0 + 2 * -0.6 = 8 - 1.2 = 6.8
      // weightedScore = 1.0 + 6.8 / 10 = 1.68 -> clamped to 1.5
      expect(prisma.review.update).toHaveBeenCalledWith({
        where: { id: 'review-1' },
        data: {
          netVoteScore: 6.8,
          weightedScore: 1.5, // Clamped to max
        },
      });
    });

    it('should clamp weighted score to maximum of 1.5', async () => {
      const mockReview = {
        id: 'review-1',
        agreeCount: 50,
        disagreeCount: 0,
        netVoteScore: 0,
        weightedScore: 1.0,
      };

      (prisma.review.findUnique as jest.Mock).mockResolvedValue(mockReview);
      (prisma.review.update as jest.Mock).mockResolvedValue(mockReview);

      await recalculateReviewScore('review-1');

      // Formula would give: 1.0 + 50 / 10 = 6.0
      // Should clamp to 1.5
      expect(prisma.review.update).toHaveBeenCalledWith({
        where: { id: 'review-1' },
        data: {
          netVoteScore: 50,
          weightedScore: 1.5,
        },
      });
    });

    it('should clamp weighted score to minimum of 0.4', async () => {
      const mockReview = {
        id: 'review-1',
        agreeCount: 0,
        disagreeCount: 50,
        netVoteScore: 0,
        weightedScore: 1.0,
      };

      (prisma.review.findUnique as jest.Mock).mockResolvedValue(mockReview);
      (prisma.review.update as jest.Mock).mockResolvedValue(mockReview);

      await recalculateReviewScore('review-1');

      // netVoteScore = 50 * -0.6 = -30
      // Formula would give: 1.0 + (-30) / 10 = -2.0
      // Should clamp to 0.4
      expect(prisma.review.update).toHaveBeenCalledWith({
        where: { id: 'review-1' },
        data: {
          netVoteScore: -30,
          weightedScore: 0.4,
        },
      });
    });

    it('should throw error if review not found', async () => {
      (prisma.review.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(recalculateReviewScore('nonexistent')).rejects.toThrow(
        'Review not found'
      );
    });
  });

  describe('Vote Weight Constants Verification', () => {
    it('should apply correct agree weight (1.0)', async () => {
      const mockReview = {
        id: 'review-1',
        agreeCount: 1,
        disagreeCount: 0,
        netVoteScore: 0,
        weightedScore: 1.0,
      };

      (prisma.review.findUnique as jest.Mock).mockResolvedValue(mockReview);
      (prisma.review.update as jest.Mock).mockResolvedValue(mockReview);

      await recalculateReviewScore('review-1');

      const updateCall = (prisma.review.update as jest.Mock).mock.calls[0][0];
      expect(updateCall.data.netVoteScore).toBe(1.0);
    });

    it('should apply correct disagree weight (-0.6)', async () => {
      const mockReview = {
        id: 'review-1',
        agreeCount: 0,
        disagreeCount: 1,
        netVoteScore: 0,
        weightedScore: 1.0,
      };

      (prisma.review.findUnique as jest.Mock).mockResolvedValue(mockReview);
      (prisma.review.update as jest.Mock).mockResolvedValue(mockReview);

      await recalculateReviewScore('review-1');

      const updateCall = (prisma.review.update as jest.Mock).mock.calls[0][0];
      expect(updateCall.data.netVoteScore).toBe(-0.6);
    });

    it('should verify agree has more weight than disagree', async () => {
      // 1 agree vs 1 disagree should result in positive netVoteScore
      const mockReview = {
        id: 'review-1',
        agreeCount: 1,
        disagreeCount: 1,
        netVoteScore: 0,
        weightedScore: 1.0,
      };

      (prisma.review.findUnique as jest.Mock).mockResolvedValue(mockReview);
      (prisma.review.update as jest.Mock).mockResolvedValue(mockReview);

      await recalculateReviewScore('review-1');

      // 1 * 1.0 + 1 * -0.6 = 0.4 (positive)
      const updateCall = (prisma.review.update as jest.Mock).mock.calls[0][0];
      expect(updateCall.data.netVoteScore).toBeGreaterThan(0);
      expect(updateCall.data.netVoteScore).toBe(0.4);
    });
  });

  describe('getCredibilityBadge', () => {
    it('should return Expert badge for credibility >= 1.3', () => {
      expect(getCredibilityBadge(1.5)).toEqual({
        level: 'Expert',
        color: '#f39c12',
        icon: '⭐',
      });

      expect(getCredibilityBadge(1.3)).toEqual({
        level: 'Expert',
        color: '#f39c12',
        icon: '⭐',
      });
    });

    it('should return Trusted badge for credibility >= 1.15', () => {
      expect(getCredibilityBadge(1.25)).toEqual({
        level: 'Trusted',
        color: '#3498db',
        icon: '✓',
      });

      expect(getCredibilityBadge(1.15)).toEqual({
        level: 'Trusted',
        color: '#3498db',
        icon: '✓',
      });
    });

    it('should return Standard badge for credibility >= 0.85', () => {
      expect(getCredibilityBadge(1.0)).toEqual({
        level: 'Standard',
        color: '#95a5a6',
        icon: '',
      });

      expect(getCredibilityBadge(0.85)).toEqual({
        level: 'Standard',
        color: '#95a5a6',
        icon: '',
      });
    });

    it('should return New badge for credibility < 0.85', () => {
      expect(getCredibilityBadge(0.5)).toEqual({
        level: 'New',
        color: '#95a5a6',
        icon: '',
      });

      expect(getCredibilityBadge(0.84)).toEqual({
        level: 'New',
        color: '#95a5a6',
        icon: '',
      });
    });

    it('should handle boundary values correctly', () => {
      // Just below Expert threshold
      expect(getCredibilityBadge(1.29)).toEqual({
        level: 'Trusted',
        color: '#3498db',
        icon: '✓',
      });

      // Just below Trusted threshold
      expect(getCredibilityBadge(1.14)).toEqual({
        level: 'Standard',
        color: '#95a5a6',
        icon: '',
      });
    });
  });

  describe('getUserVotes', () => {
    it('should return vote map for multiple reviews', async () => {
      const mockVotes = [
        { reviewId: 'review-1', isAgree: true },
        { reviewId: 'review-2', isAgree: false },
      ];

      (prisma.reviewVote.findMany as jest.Mock).mockResolvedValue(mockVotes);

      const result = await getUserVotes('user-1', ['review-1', 'review-2', 'review-3']);

      expect(result.get('review-1')).toBe(true);
      expect(result.get('review-2')).toBe(false);
      expect(result.get('review-3')).toBeNull(); // No vote
    });

    it('should return null for reviews with no votes', async () => {
      (prisma.reviewVote.findMany as jest.Mock).mockResolvedValue([]);

      const result = await getUserVotes('user-1', ['review-1', 'review-2']);

      expect(result.get('review-1')).toBeNull();
      expect(result.get('review-2')).toBeNull();
    });

    it('should handle empty review list', async () => {
      (prisma.reviewVote.findMany as jest.Mock).mockResolvedValue([]);

      const result = await getUserVotes('user-1', []);

      expect(result.size).toBe(0);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle very large vote counts', async () => {
      const mockReview = {
        id: 'review-1',
        agreeCount: 100000,
        disagreeCount: 50000,
        netVoteScore: 0,
        weightedScore: 1.0,
      };

      (prisma.review.findUnique as jest.Mock).mockResolvedValue(mockReview);
      (prisma.review.update as jest.Mock).mockResolvedValue(mockReview);

      await recalculateReviewScore('review-1');

      // Should handle large numbers and still clamp
      const updateCall = (prisma.review.update as jest.Mock).mock.calls[0][0];
      expect(updateCall.data.weightedScore).toBe(1.5);
    });

    it('should handle floating point precision in calculations', async () => {
      const mockReview = {
        id: 'review-1',
        agreeCount: 3,
        disagreeCount: 7,
        netVoteScore: 0,
        weightedScore: 1.0,
      };

      (prisma.review.findUnique as jest.Mock).mockResolvedValue(mockReview);
      (prisma.review.update as jest.Mock).mockResolvedValue(mockReview);

      await recalculateReviewScore('review-1');

      // netVoteScore = 3 * 1.0 + 7 * -0.6 = 3 - 4.2 = -1.2
      const updateCall = (prisma.review.update as jest.Mock).mock.calls[0][0];
      expect(updateCall.data.netVoteScore).toBeCloseTo(-1.2);
    });

    it('should handle credibility calculation with mismatched vote/review counts', async () => {
      // Edge case: more votes than reviews (shouldn't happen but test robustness)
      const mockUser = {
        id: 'user-1',
        totalAgrees: 20,
        totalDisagrees: 10,
        reviewCount: 15, // Less than total votes
        credibilityScore: 1.0,
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (prisma.user.update as jest.Mock).mockResolvedValue(mockUser);

      // Should not throw, should calculate based on review count
      await expect(recalculateUserCredibility('user-1')).resolves.not.toThrow();
    });
  });
});
