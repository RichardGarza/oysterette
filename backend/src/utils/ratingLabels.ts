/**
 * Rating Labels Utility
 *
 * Provides conversion functions and descriptive labels for oyster ratings and attributes.
 *
 * Features:
 * - Convert ReviewRating enums to numeric scores
 * - Convert scores to human-readable verdicts with emojis
 * - Attribute descriptors for slider values (e.g., "Huge" for size 10)
 * - Loaded from data/oyster-rating-labels.json for easy customization
 *
 * Rating Scale (highest to lowest):
 * - LOVE_IT: 10 - Best
 * - LIKE_IT: 7.5 - Good
 * - OKAY: 5 - Okay
 * - MEH: 1 - Worst
 */

import { ReviewRating } from '@prisma/client';
import ratingLabelsData from '../../data/oyster-rating-labels.json';

/**
 * Convert ReviewRating enum to numeric score
 *
 * @param rating - Review rating enum value
 * @returns Numeric score (1-10 scale)
 */
export function ratingToScore(rating: ReviewRating): number {
  switch (rating) {
    case 'LOVE_IT':   // Best
      return 10;
    case 'LIKE_IT':   // Good
      return 7.5;
    case 'OKAY':      // Okay
      return 5;
    case 'MEH':       // Worst
      return 1;
    default:
      return 5; // Fallback
  }
}

/**
 * Convert numeric score to verdict label with emoji
 */
export function scoreToVerdict(score: number): {
  verdict: string;
  emoji: string;
  meaning: string;
} {
  const verdicts = ratingLabelsData.overallVerdict;

  for (const item of verdicts) {
    const [min = 0, max = 10] = item.range;
    if (score >= min && score <= max) {
      return {
        verdict: item.verdict,
        emoji: item.emoji,
        meaning: item.meaning
      };
    }
  }

  // Fallback to Meh
  return {
    verdict: 'Meh',
    emoji: '😐',
    meaning: 'Fine. Nothing special.'
  };
}

/**
 * Get attribute descriptor for a given attribute and score
 */
export function getAttributeDescriptor(
  attribute: 'size' | 'body' | 'sweet_brininess' | 'flavorfulness' | 'creaminess',
  score: number
): string {
  const rounded = Math.round(score);
  const descriptors = ratingLabelsData.descriptors[attribute];

  if (!descriptors) {
    return score.toString();
  }

  return descriptors[rounded.toString() as keyof typeof descriptors] || score.toString();
}

/**
 * Get all attribute labels
 */
export function getAttributeLabels() {
  return ratingLabelsData.attributeLabels;
}

/**
 * Calculate overall score from multiple ratings
 * This is used to aggregate user ratings into an overall score
 */
export function calculateOverallScore(ratings: ReviewRating[]): number {
  if (ratings.length === 0) return 5.0;

  const scores = ratings.map(ratingToScore);
  const sum = scores.reduce((acc, score) => acc + score, 0);
  return Number((sum / scores.length).toFixed(2));
}

/**
 * Convert numeric score (0-10) to star rating (0-5)
 */
export function scoreToStars(score: number): number {
  return Number((score / 2).toFixed(1));
}
