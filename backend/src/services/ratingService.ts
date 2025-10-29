import prisma from '../lib/prisma';
import { ReviewRating } from '@prisma/client';

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
 */
function calculateWeightedAttribute(
  seedValue: number,
  userValues: (number | null)[],
  userWeight: number
): number {
  // Filter out null values and calculate average
  const validUserValues = userValues.filter((v): v is number => v !== null);

  if (validUserValues.length === 0) {
    // No user data, use seed value
    return seedValue;
  }

  const userAvg = validUserValues.reduce((sum, val) => sum + val, 0) / validUserValues.length;

  // Weighted average: (1 - weight) * seed + weight * user
  return (1 - userWeight) * seedValue + userWeight * userAvg;
}

/**
 * Recalculate all aggregated ratings for a specific oyster
 */
export async function recalculateOysterRatings(oysterId: string): Promise<void> {
  try {
    // Fetch oyster with all its reviews
    const oyster = await prisma.oyster.findUnique({
      where: { id: oysterId },
      include: {
        reviews: true,
      },
    });

    if (!oyster) {
      throw new Error(`Oyster not found: ${oysterId}`);
    }

    const reviewCount = oyster.reviews.length;
    const userWeight = calculateUserRatingWeight(reviewCount);

    // Calculate average rating (4-point scale)
    let avgRating = 0;
    if (reviewCount > 0) {
      const totalRating = oyster.reviews.reduce(
        (sum, review) => sum + ratingToNumber(review.rating),
        0
      );
      avgRating = totalRating / reviewCount;
    }

    // Calculate weighted attributes
    const sizeValues = oyster.reviews.map((r) => r.size);
    const bodyValues = oyster.reviews.map((r) => r.body);
    const sweetBrininessValues = oyster.reviews.map((r) => r.sweetBrininess);
    const flavorfulnessValues = oyster.reviews.map((r) => r.flavorfulness);
    const creaminessValues = oyster.reviews.map((r) => r.creaminess);

    const avgSize = calculateWeightedAttribute(oyster.size, sizeValues, userWeight);
    const avgBody = calculateWeightedAttribute(oyster.body, bodyValues, userWeight);
    const avgSweetBrininess = calculateWeightedAttribute(
      oyster.sweetBrininess,
      sweetBrininessValues,
      userWeight
    );
    const avgFlavorfulness = calculateWeightedAttribute(
      oyster.flavorfulness,
      flavorfulnessValues,
      userWeight
    );
    const avgCreaminess = calculateWeightedAttribute(oyster.creaminess, creaminessValues, userWeight);

    // Calculate overall score (0-10 scale)
    // Weighted combination: 40% rating, 60% attributes
    const normalizedRating = (avgRating / 4) * 10; // Convert 4-point to 10-point scale
    const attributeAverage =
      (avgSize + avgBody + avgSweetBrininess + avgFlavorfulness + avgCreaminess) / 5;

    const overallScore = normalizedRating * 0.4 + attributeAverage * 0.6;

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

    console.log(`✅ Recalculated ratings for oyster: ${oyster.name} (${reviewCount} reviews)`);
  } catch (error) {
    console.error('Error recalculating oyster ratings:', error);
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

    console.log(`📊 Recalculating ratings for ${oysters.length} oysters...`);

    for (const oyster of oysters) {
      await recalculateOysterRatings(oyster.id);
    }

    console.log('✅ All oyster ratings recalculated successfully');
  } catch (error) {
    console.error('Error recalculating all ratings:', error);
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
