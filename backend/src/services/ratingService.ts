/**
 * Rating Service
 *
 * Handles sophisticated calculation and aggregation of oyster ratings using a
 * multi-layered weighting system that balances seed data with community input.
 *
 * Key Features:
 * - Dynamic weighting between seed data and user reviews
 * - Review quality scoring (0.4-1.5x based on community votes)
 * - Reviewer credibility weighting (0.5-1.5x based on reputation)
 * - Gradual transition from seed data to user consensus
 * - Attribute-level averaging (size, body, sweetness, etc.)
 *
 * Rating Formula:
 * 1. Overall Rating = Weighted avg of review ratings × review quality × reviewer credibility
 * 2. Attributes = (1 - userWeight) × seedValue + userWeight × weightedUserAvg
 * 3. Overall Score = 40% rating + 60% average of 5 attributes
 *
 * Weighting Progression:
 * - 0-4 reviews: Gradual increase from seed data
 * - 5+ reviews: 70% user ratings, 30% seed data
 *
 * Automatically recalculated after:
 * - New review creation
 * - Review updates or deletion
 * - Vote changes on reviews
 */

import prisma from '../lib/prisma';
import { ReviewRating } from '@prisma/client';
import logger from '../utils/logger';
import { ratingToScore } from '../utils/ratingLabels';

// Configuration for rating weights
const RATING_CONFIG = {
  // Weight given to user ratings vs seed data (0-1 scale)
  // 0 = only seed data, 1 = only user ratings
  userRatingWeight: 0.7,

  // Minimum reviews before user ratings start having significant weight
  minReviewsForWeight: 5,
};

/**
 * Convert ReviewRating enum to numeric value (0-10 scale)
 * LOVE_IT → 9.0 (range 8.0-10.0)
 * LIKE_IT → 7.0 (range 6.0-7.9)
 * MEH → 4.95 (range 4.0-5.9)
 * WHATEVER → 2.5 (range 1.0-3.9)
 */
function ratingToNumber(rating: ReviewRating): number {
  return ratingToScore(rating);
}


/**
 * Calculate dynamic weight for user ratings based on review count
 * More reviews = more weight on user ratings
 */
function calculateUserRatingWeight(reviewCount: number): number {
  if (reviewCount === 0) return 0;
  if (reviewCount >= RATING_CONFIG.minReviewsForWeight) {
    return RATING_CONFIG.userRatingWeight;
  }
  // Gradually increase weight as reviews accumulate
  return (reviewCount / RATING_CONFIG.minReviewsForWeight) * RATING_CONFIG.userRatingWeight;
}

/**
 * Calculate weighted average between seed value and user ratings
 * Now incorporates review quality and reviewer credibility
 */
function calculateWeightedAttribute(
  seedValue: number,
  reviewData: Array<{
    value: number | null;
    reviewWeight: number;
    credibilityScore: number;
  }>,
  userWeight: number
): number {
  // Filter out null values
  const validReviews = reviewData.filter((r) => r.value !== null);

  if (validReviews.length === 0) {
    // No user data, use seed value
    return seedValue;
  }

  // Calculate weighted average of user ratings
  let weightedSum = 0;
  let weightSum = 0;

  for (const review of validReviews) {
    const totalWeight = review.reviewWeight * review.credibilityScore;
    weightedSum += review.value! * totalWeight;
    weightSum += totalWeight;
  }

  const userAvg = weightSum > 0 ? weightedSum / weightSum : seedValue;

  // Weighted average: (1 - weight) * seed + weight * user
  return (1 - userWeight) * seedValue + userWeight * userAvg;
}

/**
 * Recalculate all aggregated ratings for a specific oyster
 *
 * Triggers complete recalculation of:
 * - avgRating (weighted community consensus)
 * - avgSize, avgBody, avgSweetBrininess, avgFlavorfulness, avgCreaminess
 * - overallScore (40% rating + 60% attributes)
 * - totalReviews count
 *
 * Incorporates three layers of weighting:
 * 1. Review quality score (community votes)
 * 2. Reviewer credibility (historical accuracy)
 * 3. User vs seed data balance (based on review volume)
 *
 * @param oysterId - UUID of oyster to recalculate
 * @throws Error if oyster not found
 */
export async function recalculateOysterRatings(oysterId: string): Promise<void> {
  try {
    // Fetch oyster with all its reviews and reviewer credibility
    const oyster = await prisma.oyster.findUnique({
      where: { id: oysterId },
      include: {
        reviews: {
          include: {
            user: {
              select: {
                credibilityScore: true,
              },
            },
          },
        },
      },
    });

    if (!oyster) {
      throw new Error(`Oyster not found: ${oysterId}`);
    }

    const reviewCount = oyster.reviews.length;
    const userWeight = calculateUserRatingWeight(reviewCount);

    // Calculate weighted average rating (4-point scale)
    // Incorporates both review weighted score and reviewer credibility
    let avgRating = 0;
    if (reviewCount > 0) {
      let weightedSum = 0;
      let weightSum = 0;

      for (const review of oyster.reviews) {
        const ratingValue = ratingToNumber(review.rating);
        const reviewWeight = review.weightedScore; // 0.4 to 1.5 based on community votes
        const credibilityWeight = review.user.credibilityScore; // 0.5 to 1.5 based on reviewer reputation
        const totalWeight = reviewWeight * credibilityWeight;

        weightedSum += ratingValue * totalWeight;
        weightSum += totalWeight;
      }

      avgRating = weightSum > 0 ? weightedSum / weightSum : 0;
    }

    // Calculate weighted attributes
    // Now incorporating review quality and reviewer credibility
    const reviewData = oyster.reviews.map((r) => ({
      size: r.size,
      body: r.body,
      sweetBrininess: r.sweetBrininess,
      flavorfulness: r.flavorfulness,
      creaminess: r.creaminess,
      reviewWeight: r.weightedScore,
      credibilityScore: r.user.credibilityScore,
    }));

    const avgSize = calculateWeightedAttribute(
      oyster.size,
      reviewData.map((r) => ({
        value: r.size,
        reviewWeight: r.reviewWeight,
        credibilityScore: r.credibilityScore,
      })),
      userWeight
    );
    const avgBody = calculateWeightedAttribute(
      oyster.body,
      reviewData.map((r) => ({
        value: r.body,
        reviewWeight: r.reviewWeight,
        credibilityScore: r.credibilityScore,
      })),
      userWeight
    );
    const avgSweetBrininess = calculateWeightedAttribute(
      oyster.sweetBrininess,
      reviewData.map((r) => ({
        value: r.sweetBrininess,
        reviewWeight: r.reviewWeight,
        credibilityScore: r.credibilityScore,
      })),
      userWeight
    );
    const avgFlavorfulness = calculateWeightedAttribute(
      oyster.flavorfulness,
      reviewData.map((r) => ({
        value: r.flavorfulness,
        reviewWeight: r.reviewWeight,
        credibilityScore: r.credibilityScore,
      })),
      userWeight
    );
    const avgCreaminess = calculateWeightedAttribute(
      oyster.creaminess,
      reviewData.map((r) => ({
        value: r.creaminess,
        reviewWeight: r.reviewWeight,
        credibilityScore: r.credibilityScore,
      })),
      userWeight
    );

    // Calculate overall score (0-10 scale)
    // Overall score is based ONLY on user ratings, independent of attributes
    let overallScore = 5.0; // Default score when no reviews
    if (reviewCount > 0) {
      // avgRating is already on 0-10 scale from ratingToNumber()
      overallScore = Number(avgRating.toFixed(2));
      overallScore = Math.max(0, Math.min(10, overallScore));
    }

    // Update oyster with calculated values
    await prisma.oyster.update({
      where: { id: oysterId },
      data: {
        totalReviews: reviewCount,
        avgRating,
        avgSize,
        avgBody,
        avgSweetBrininess,
        avgFlavorfulness,
        avgCreaminess,
        overallScore,
      },
    });

    logger.info(`✅ Recalculated ratings for oyster: ${oyster.name} (${reviewCount} reviews)`);
  } catch (error) {
    logger.error('Error recalculating oyster ratings:', error);
    throw error;
  }
}

/**
 * Recalculate ratings for all oysters
 * Useful for backfilling or fixing data
 */
export async function recalculateAllRatings(): Promise<void> {
  try {
    const oysters = await prisma.oyster.findMany({
      select: { id: true, name: true },
    });

    logger.info(`📊 Recalculating ratings for ${oysters.length} oysters...`);

    for (const oyster of oysters) {
      await recalculateOysterRatings(oyster.id);
    }

    logger.info('✅ All oyster ratings recalculated successfully');
  } catch (error) {
    logger.error('Error recalculating all ratings:', error);
    throw error;
  }
}

/**
 * Get rating statistics for an oyster
 */
export async function getOysterRatingStats(oysterId: string) {
  const oyster = await prisma.oyster.findUnique({
    where: { id: oysterId },
    include: {
      reviews: true,
    },
  });

  if (!oyster) {
    throw new Error(`Oyster not found: ${oysterId}`);
  }

  // Count reviews by rating type
  const ratingBreakdown = {
    loveIt: oyster.reviews.filter((r) => r.rating === 'LOVE_IT').length,
    likeIt: oyster.reviews.filter((r) => r.rating === 'LIKE_IT').length,
    okay: oyster.reviews.filter((r) => r.rating === 'OKAY').length,
    meh: oyster.reviews.filter((r) => r.rating === 'MEH').length,
  };

  const userWeight = calculateUserRatingWeight(oyster.totalReviews);

  return {
    totalReviews: oyster.totalReviews,
    avgRating: oyster.avgRating,
    overallScore: oyster.overallScore,
    ratingBreakdown,
    userRatingWeight: userWeight,
    seedDataWeight: 1 - userWeight,
  };
}
