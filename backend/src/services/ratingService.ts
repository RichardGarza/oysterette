import prisma from '../lib/prisma';
import { ReviewRating } from '@prisma/client';
import logger from '../utils/logger';

/**
 * Rating Service
 * Handles calculation and aggregation of oyster ratings
 */

// Configuration for rating weights
const RATING_CONFIG = {
  // Weight given to user ratings vs seed data (0-1 scale)
  // 0 = only seed data, 1 = only user ratings
  userRatingWeight: 0.7,

  // Minimum reviews before user ratings start having significant weight
  minReviewsForWeight: 5,

  // Rating value mappings (4-point scale to numeric)
  ratingValues: {
    LOVED_IT: 4,
    LIKED_IT: 3,
    MEH: 2,
    HATED_IT: 1,
  },
};

/**
 * Convert ReviewRating enum to numeric value
 */
function ratingToNumber(rating: ReviewRating): number {
  return RATING_CONFIG.ratingValues[rating];
}

/**
 * Calculate flavor modifier for overall score
 * Flavorfulness slightly influences the overall rating
 */
function calculateFlavorModifier(flavorfulness: number): number {
  // 5 = neutral (no change)
  // Higher values add to score, lower values subtract
  const modifierMap: { [key: number]: number } = {
    10: 0.5,
    9: 0.4,
    8: 0.3,
    7: 0.15,
    6: 0.05,
    5: 0,
    4: -0.1,
    3: -0.2,
    2: -0.3,
    1: -0.4,
  };

  return modifierMap[flavorfulness] || 0;
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
    // Formula: 40% rating + 60% attributes average
    let overallScore = 0;
    if (reviewCount > 0) {
      // Normalize avgRating (1-4) to 10-point scale
      const normalizedRating = (avgRating / 4) * 10;

      // Calculate average of all attributes
      const attributesAverage = (avgSize + avgBody + avgSweetBrininess + avgFlavorfulness + avgCreaminess) / 5;

      // Overall score: 40% rating + 60% attributes
      overallScore = (normalizedRating * 0.4) + (attributesAverage * 0.6);
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
    lovedIt: oyster.reviews.filter((r) => r.rating === 'LOVED_IT').length,
    likedIt: oyster.reviews.filter((r) => r.rating === 'LIKED_IT').length,
    meh: oyster.reviews.filter((r) => r.rating === 'MEH').length,
    hatedIt: oyster.reviews.filter((r) => r.rating === 'HATED_IT').length,
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
