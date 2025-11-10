import {
  ratingToScore,
  scoreToVerdict,
  getAttributeDescriptor,
  calculateOverallScore,
  scoreToStars,
} from '../ratingLabels';
import { ReviewRating } from '@prisma/client';

describe('ratingLabels', () => {
  describe('ratingToScore', () => {
    it('should convert LOVE_IT to 10', () => {
      expect(ratingToScore('LOVE_IT')).toBe(10);
    });

    it('should convert LIKE_IT to 7.5', () => {
      expect(ratingToScore('LIKE_IT')).toBe(7.5);
    });

    it('should convert OKAY to 5', () => {
      expect(ratingToScore('OKAY')).toBe(5);
    });

    it('should convert MEH to 1', () => {
      expect(ratingToScore('MEH')).toBe(1);
    });
  });

  describe('scoreToVerdict', () => {
    it('should return Love It for score 9.0', () => {
      const result = scoreToVerdict(9.0);
      expect(result.verdict).toBe('Love It');
      expect(result.emoji).toBe('❤️');
      expect(result.meaning).toBe('This is perfection. My new favorite.');
    });

    it('should return Love It for score 8.0', () => {
      const result = scoreToVerdict(8.0);
      expect(result.verdict).toBe('Love It');
      expect(result.emoji).toBe('❤️');
    });

    it('should return Love It for score 10.0', () => {
      const result = scoreToVerdict(10.0);
      expect(result.verdict).toBe('Love It');
      expect(result.emoji).toBe('❤️');
    });

    it('should return Like It for score 7.0', () => {
      const result = scoreToVerdict(7.0);
      expect(result.verdict).toBe('Like It');
      expect(result.emoji).toBe('👍');
      expect(result.meaning).toBe('Really good. Would order again.');
    });

    it('should return Like It for score 6.5', () => {
      const result = scoreToVerdict(6.5);
      expect(result.verdict).toBe('Like It');
      expect(result.emoji).toBe('👍');
    });

    it('should return Meh for score 5.0', () => {
      const result = scoreToVerdict(5.0);
      expect(result.verdict).toBe('Meh');
      expect(result.emoji).toBe('😐');
      expect(result.meaning).toBe('Fine. Nothing special.');
    });

    it('should return Meh for score 4.5', () => {
      const result = scoreToVerdict(4.5);
      expect(result.verdict).toBe('Meh');
      expect(result.emoji).toBe('😐');
    });

    it('should return Whatever for score 2.5', () => {
      const result = scoreToVerdict(2.5);
      expect(result.verdict).toBe('Whatever');
      expect(result.emoji).toBe('🤷');
      expect(result.meaning).toBe('Not for me. Skip.');
    });

    it('should return Whatever for score 1.0', () => {
      const result = scoreToVerdict(1.0);
      expect(result.verdict).toBe('Whatever');
      expect(result.emoji).toBe('🤷');
    });

    it('should handle edge case at boundary (7.9)', () => {
      const result = scoreToVerdict(7.9);
      expect(result.verdict).toBe('Like It');
    });

    it('should handle edge case at boundary (5.9)', () => {
      const result = scoreToVerdict(5.9);
      expect(result.verdict).toBe('Meh');
    });

    it('should handle edge case at boundary (3.9)', () => {
      const result = scoreToVerdict(3.9);
      expect(result.verdict).toBe('Whatever');
    });
  });

  describe('getAttributeDescriptor', () => {
    describe('size', () => {
      it('should return "Teeny Weenie" for size 1', () => {
        expect(getAttributeDescriptor('size', 1)).toBe('Teeny Weenie');
      });

      it('should return "Medium" for size 6', () => {
        expect(getAttributeDescriptor('size', 6)).toBe('Medium');
      });

      it('should return "Big As Texas" for size 10', () => {
        expect(getAttributeDescriptor('size', 10)).toBe('Big As Texas');
      });

      it('should round 5.4 to 5 and return "Medium-Small"', () => {
        expect(getAttributeDescriptor('size', 5.4)).toBe('Medium-Small');
      });

      it('should round 7.8 to 8 and return "Large"', () => {
        expect(getAttributeDescriptor('size', 7.8)).toBe('Large');
      });
    });

    describe('body', () => {
      it('should return "Empty" for body 1', () => {
        expect(getAttributeDescriptor('body', 1)).toBe('Empty');
      });

      it('should return "Average" for body 5', () => {
        expect(getAttributeDescriptor('body', 5)).toBe('Average');
      });

      it('should return "Baddy McFatty" for body 10', () => {
        expect(getAttributeDescriptor('body', 10)).toBe('Baddy McFatty');
      });
    });

    describe('sweet_brininess', () => {
      it('should return "The Sweetest" for sweet_brininess 1', () => {
        expect(getAttributeDescriptor('sweet_brininess', 1)).toBe('The Sweetest');
      });

      it('should return "Balanced" for sweet_brininess 5', () => {
        expect(getAttributeDescriptor('sweet_brininess', 5)).toBe('Balanced');
      });

      it('should return "Seawater" for sweet_brininess 10', () => {
        expect(getAttributeDescriptor('sweet_brininess', 10)).toBe('Seawater');
      });
    });

    describe('flavorfulness', () => {
      it('should return "Boring" for flavorfulness 1', () => {
        expect(getAttributeDescriptor('flavorfulness', 1)).toBe('Boring');
      });

      it('should return "Average" for flavorfulness 5', () => {
        expect(getAttributeDescriptor('flavorfulness', 5)).toBe('Average');
      });

      it('should return "BOLD" for flavorfulness 10', () => {
        expect(getAttributeDescriptor('flavorfulness', 10)).toBe('BOLD');
      });
    });

    describe('creaminess', () => {
      it('should return "None" for creaminess 1', () => {
        expect(getAttributeDescriptor('creaminess', 1)).toBe('None');
      });

      it('should return "Minimal Cream" for creaminess 5', () => {
        expect(getAttributeDescriptor('creaminess', 5)).toBe('Minimal Cream');
      });

      it('should return "Nothing But Cream" for creaminess 10', () => {
        expect(getAttributeDescriptor('creaminess', 10)).toBe('Nothing But Cream');
      });
    });
  });

  describe('calculateOverallScore', () => {
    it('should return 5.0 for empty array', () => {
      expect(calculateOverallScore([])).toBe(5.0);
    });

    it('should return 10 for single LOVE_IT rating', () => {
      expect(calculateOverallScore(['LOVE_IT'])).toBe(10);
    });

    it('should return 7.5 for single LIKE_IT rating', () => {
      expect(calculateOverallScore(['LIKE_IT'])).toBe(7.5);
    });

    it('should calculate average of multiple ratings', () => {
      const ratings: ReviewRating[] = ['LOVE_IT', 'LIKE_IT']; // 10 + 7.5 = 17.5 / 2 = 8.75
      expect(calculateOverallScore(ratings)).toBe(8.75);
    });

    it('should calculate average of mixed ratings', () => {
      const ratings: ReviewRating[] = ['LOVE_IT', 'LOVE_IT', 'LIKE_IT', 'OKAY'];
      // (10 + 10 + 7.5 + 5) / 4 = 32.5 / 4 = 8.125
      expect(calculateOverallScore(ratings)).toBe(8.13);
    });

    it('should handle all same ratings', () => {
      const ratings: ReviewRating[] = ['OKAY', 'OKAY', 'OKAY'];
      // (5 + 5 + 5) / 3 = 5
      expect(calculateOverallScore(ratings)).toBe(5);
    });

    it('should handle all ratings types', () => {
      const ratings: ReviewRating[] = ['LOVE_IT', 'LIKE_IT', 'OKAY', 'MEH'];
      // (10 + 7.5 + 5 + 1) / 4 = 23.5 / 4 = 5.875
      expect(calculateOverallScore(ratings)).toBe(5.88);
    });

    it('should round to 2 decimal places', () => {
      const ratings: ReviewRating[] = ['LOVE_IT', 'OKAY', 'MEH'];
      // (10 + 5 + 1) / 3 = 16 / 3 = 5.333333...
      const result = calculateOverallScore(ratings);
      expect(result).toBe(5.33);
      expect(result.toString().split('.')[1]?.length || 0).toBeLessThanOrEqual(2);
    });
  });

  describe('scoreToStars', () => {
    it('should convert 10 to 5 stars', () => {
      expect(scoreToStars(10)).toBe(5.0);
    });

    it('should convert 8 to 4 stars', () => {
      expect(scoreToStars(8)).toBe(4.0);
    });

    it('should convert 5 to 2.5 stars', () => {
      expect(scoreToStars(5)).toBe(2.5);
    });

    it('should convert 0 to 0 stars', () => {
      expect(scoreToStars(0)).toBe(0);
    });

    it('should convert 7.5 to 3.8 stars', () => {
      expect(scoreToStars(7.5)).toBe(3.8);
    });

    it('should round to 1 decimal place', () => {
      expect(scoreToStars(7.33)).toBe(3.7);
    });
  });

  describe('integration tests', () => {
    it('should maintain consistency between ratingToScore and scoreToVerdict', () => {
      const loveItScore = ratingToScore('LOVE_IT');
      const verdict = scoreToVerdict(loveItScore);
      expect(verdict.verdict).toBe('Love It');
      expect(loveItScore).toBe(10);
    });

    it('should handle complete rating workflow', () => {
      // User submits LIKE_IT rating
      const rating: ReviewRating = 'LIKE_IT';
      const score = ratingToScore(rating);
      expect(score).toBe(7.5);

      // Convert score to verdict for display
      const verdict = scoreToVerdict(score);
      expect(verdict.verdict).toBe('Like It');
      expect(verdict.emoji).toBe('👍');

      // Convert to stars for small display
      const stars = scoreToStars(score);
      expect(stars).toBe(3.8);
    });

    it('should handle aggregated ratings workflow', () => {
      // Multiple users rate an oyster
      const ratings: ReviewRating[] = ['LOVE_IT', 'LOVE_IT', 'LIKE_IT'];

      // Calculate overall score
      const overallScore = calculateOverallScore(ratings);
      // (10 + 10 + 7.5) / 3 = 9.17
      expect(overallScore).toBe(9.17);

      // Get verdict for overall score
      const verdict = scoreToVerdict(overallScore);
      expect(verdict.verdict).toBe('Love It');

      // Convert to stars
      const stars = scoreToStars(overallScore);
      expect(stars).toBe(4.6);
    });
  });
});
