/**
 * Recommendation Service
 *
 * Provides personalized oyster recommendations using baseline flavor profiles.
 *
 * Baseline Flavor Profile System:
 * - Users can set a baseline profile before reviewing (ideal oyster attributes)
 * - Baseline updates automatically with each positive review (LIKE_IT, LOVE_IT)
 * - Negative reviews (MEH, WHATEVER) don't affect baseline
 * - Update formula: weighted average toward higher-rated flavors
 *
 * Recommendation Algorithm:
 * 1. Check if user has baseline profile
 * 2. If baseline exists: Use it for recommendations
 * 3. If no baseline but has positive reviews: Calculate from reviews
 * 4. If neither: Return top-rated oysters (fallback)
 * 5. Find similar oysters using weighted Euclidean distance
 * 6. Exclude already-reviewed oysters
 * 7. Return top matches with similarity scores
 *
 * Baseline Update Formula (on positive review):
 * - newBaseline = (currentBaseline * 0.7) + (newReviewAttributes * 0.3)
 * - Weights higher ratings more heavily (LOVE_IT contributes more than LIKE_IT)
 * - Gradual shift toward what user actually enjoys
 *
 * Similarity Scoring:
 * - For each attribute: distance = |oyster_value - user_preference| / 10
 * - Similarity = 1 - distance (per attribute)
 * - Overall = average of all 5 attribute similarities × 100%
 * - Higher score = better match (100% = perfect match)
 */

import prisma from '../lib/prisma';
import logger from '../utils/logger';

interface UserAttributePreferences {
  avgSize: number;
  avgBody: number;
  avgSweetBrininess: number;
  avgFlavorfulness: number;
  avgCreaminess: number;
  source: 'baseline' | 'reviews' | 'fallback';
}

interface RecommendationCache {
  userId: string;
  recommendations: any[];
  timestamp: number;
}

// In-memory cache (24-hour TTL)
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours
const recommendationCache = new Map<string, RecommendationCache>();

/**
 * Get user's flavor preferences
 *
 * Priority:
 * 1. Baseline profile (if set)
 * 2. Calculated from positive reviews
 * 3. null (triggers fallback to top-rated)
 *
 * @param userId - User UUID
 * @returns User's preferred attributes or null
 */
export const getUserAttributePreferences = async (
  userId: string
): Promise<UserAttributePreferences | null> => {
  try {
    // Fetch user with baseline profile
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        baselineSize: true,
        baselineBody: true,
        baselineSweetBrininess: true,
        baselineFlavorfulness: true,
        baselineCreaminess: true,
      },
    });

    // If user has baseline profile, use it
    if (
      user &&
      user.baselineSize !== null &&
      user.baselineBody !== null &&
      user.baselineSweetBrininess !== null &&
      user.baselineFlavorfulness !== null &&
      user.baselineCreaminess !== null
    ) {
      return {
        avgSize: user.baselineSize,
        avgBody: user.baselineBody,
        avgSweetBrininess: user.baselineSweetBrininess,
        avgFlavorfulness: user.baselineFlavorfulness,
        avgCreaminess: user.baselineCreaminess,
        source: 'baseline',
      };
    }

    // Fall back to calculating from positive reviews
    const reviews = await prisma.review.findMany({
      where: {
        userId,
        rating: {
          in: ['LIKE_IT', 'LOVE_IT'],
        },
      },
      include: {
        oyster: {
          select: {
            size: true,
            body: true,
            sweetBrininess: true,
            flavorfulness: true,
            creaminess: true,
            avgSize: true,
            avgBody: true,
            avgSweetBrininess: true,
            avgFlavorfulness: true,
            avgCreaminess: true,
          },
        },
      },
    });

    if (reviews.length === 0) {
      return null;
    }

    // Calculate averages from reviews
    let totalSize = 0;
    let totalBody = 0;
    let totalSweet = 0;
    let totalFlavor = 0;
    let totalCream = 0;

    reviews.forEach((review) => {
      totalSize += review.size || review.oyster.avgSize || review.oyster.size;
      totalBody += review.body || review.oyster.avgBody || review.oyster.body;
      totalSweet +=
        review.sweetBrininess ||
        review.oyster.avgSweetBrininess ||
        review.oyster.sweetBrininess;
      totalFlavor +=
        review.flavorfulness ||
        review.oyster.avgFlavorfulness ||
        review.oyster.flavorfulness;
      totalCream +=
        review.creaminess || review.oyster.avgCreaminess || review.oyster.creaminess;
    });

    const count = reviews.length;

    return {
      avgSize: totalSize / count,
      avgBody: totalBody / count,
      avgSweetBrininess: totalSweet / count,
      avgFlavorfulness: totalFlavor / count,
      avgCreaminess: totalCream / count,
      source: 'reviews',
    };
  } catch (error) {
    logger.error('Error getting user preferences:', error);
    return null;
  }
};

/**
 * Calculate similarity score between oyster and user preferences
 *
 * Uses weighted Euclidean distance across all 5 attributes.
 *
 * @param oyster - Oyster with attribute data
 * @param preferences - User's preferred attribute profile
 * @returns Similarity score from 0-100 (higher = better match)
 */
export const calculateSimilarityScore = (
  oyster: {
    avgSize: number | null;
    avgBody: number | null;
    avgSweetBrininess: number | null;
    avgFlavorfulness: number | null;
    avgCreaminess: number | null;
    size: number;
    body: number;
    sweetBrininess: number;
    flavorfulness: number;
    creaminess: number;
  },
  preferences: UserAttributePreferences
): number => {
  // Use aggregated averages if available, else use seed data
  const oysterSize = oyster.avgSize || oyster.size;
  const oysterBody = oyster.avgBody || oyster.body;
  const oysterSweet = oyster.avgSweetBrininess || oyster.sweetBrininess;
  const oysterFlavor = oyster.avgFlavorfulness || oyster.flavorfulness;
  const oysterCream = oyster.avgCreaminess || oyster.creaminess;

  // Calculate distance for each attribute (normalized to 0-1 scale)
  const sizeDistance = Math.abs(oysterSize - preferences.avgSize) / 10;
  const bodyDistance = Math.abs(oysterBody - preferences.avgBody) / 10;
  const sweetDistance = Math.abs(oysterSweet - preferences.avgSweetBrininess) / 10;
  const flavorDistance = Math.abs(oysterFlavor - preferences.avgFlavorfulness) / 10;
  const creamDistance = Math.abs(oysterCream - preferences.avgCreaminess) / 10;

  // Convert distance to similarity (1 = perfect match, 0 = complete opposite)
  const sizeSimilarity = 1 - sizeDistance;
  const bodySimilarity = 1 - bodyDistance;
  const sweetSimilarity = 1 - sweetDistance;
  const flavorSimilarity = 1 - flavorDistance;
  const creamSimilarity = 1 - creamDistance;

  // Average all similarities (equal weight)
  const averageSimilarity =
    (sizeSimilarity + bodySimilarity + sweetSimilarity + flavorSimilarity + creamSimilarity) / 5;

  // Convert to percentage (0-100)
  return Math.max(0, Math.min(100, averageSimilarity * 100));
};

/**
 * Get personalized oyster recommendations
 *
 * @param userId - User UUID
 * @param limit - Number of recommendations to return (default 10)
 * @returns Array of recommended oysters with similarity scores
 */
export const getRecommendations = async (
  userId: string,
  limit: number = 10
): Promise<any[]> => {
  try {
    // Check cache first
    const cached = recommendationCache.get(userId);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      logger.info(`Returning cached recommendations for user ${userId}`);
      return cached.recommendations.slice(0, limit);
    }

    // Get user's attribute preferences (baseline or from reviews)
    const preferences = await getUserAttributePreferences(userId);

    // If no preferences, return top-rated oysters
    if (!preferences) {
      logger.info(`No preferences for user ${userId}, returning top-rated oysters`);
      const topRated = await prisma.oyster.findMany({
        where: {
          totalReviews: {
            gte: 1,
          },
        },
        orderBy: {
          overallScore: 'desc',
        },
        take: limit,
      });

      return topRated.map((oyster) => ({
        ...oyster,
        similarity: null,
        reason: 'top_rated',
      }));
    }

    // Get all oysters NOT reviewed by this user
    const reviewedOysterIds = await prisma.review
      .findMany({
        where: { userId },
        select: { oysterId: true },
      })
      .then((reviews) => reviews.map((r) => r.oysterId));

    const unreviewedOysters = await prisma.oyster.findMany({
      where: {
        id: {
          notIn: reviewedOysterIds,
        },
      },
    });

    // Calculate similarity scores for all unreviewed oysters
    const scoredOysters = unreviewedOysters.map((oyster) => {
      const similarity = calculateSimilarityScore(oyster, preferences);
      return {
        ...oyster,
        similarity,
        reason: preferences.source === 'baseline' ? 'baseline_match' : 'personalized',
      };
    });

    // Sort by similarity (highest first)
    scoredOysters.sort((a, b) => b.similarity - a.similarity);

    // Take top N
    const recommendations = scoredOysters.slice(0, limit);

    // Cache results
    recommendationCache.set(userId, {
      userId,
      recommendations,
      timestamp: Date.now(),
    });

    logger.info(
      `Generated ${recommendations.length} recommendations for user ${userId} (source: ${preferences.source})`
    );

    return recommendations;
  } catch (error) {
    logger.error('Error generating recommendations:', error);
    throw error;
  }
};

/**
 * Set or update user's baseline flavor profile
 *
 * Can be called before any reviews to establish preferences.
 *
 * @param userId - User UUID
 * @param attributes - Preferred attributes (1-10 scale)
 */
export const setBaselineProfile = async (
  userId: string,
  attributes: {
    size: number;
    body: number;
    sweetBrininess: number;
    flavorfulness: number;
    creaminess: number;
  }
): Promise<void> => {
  try {
    await prisma.user.update({
      where: { id: userId },
      data: {
        baselineSize: attributes.size,
        baselineBody: attributes.body,
        baselineSweetBrininess: attributes.sweetBrininess,
        baselineFlavorfulness: attributes.flavorfulness,
        baselineCreaminess: attributes.creaminess,
      },
    });

    // Invalidate cache
    invalidateCache(userId);

    logger.info(`Set baseline profile for user ${userId}`);
  } catch (error) {
    logger.error('Error setting baseline profile:', error);
    throw error;
  }
};

/**
 * Update user's baseline profile with a new positive review
 *
 * Formula: newBaseline = (currentBaseline * 0.7) + (newAttributes * 0.3)
 * LOVE_IT reviews contribute more weight than LIKE_IT
 *
 * @param userId - User UUID
 * @param rating - Review rating
 * @param attributes - Review attributes
 */
export const updateBaselineWithReview = async (
  userId: string,
  rating: string,
  attributes: {
    size: number | null;
    body: number | null;
    sweetBrininess: number | null;
    flavorfulness: number | null;
    creaminess: number | null;
  }
): Promise<void> => {
  try {
    // Only update on positive reviews
    if (rating !== 'LOVE_IT' && rating !== 'LIKE_IT') {
      return;
    }

    // Fetch current baseline
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        baselineSize: true,
        baselineBody: true,
        baselineSweetBrininess: true,
        baselineFlavorfulness: true,
        baselineCreaminess: true,
      },
    });

    if (!user) {
      return;
    }

    // If user has no baseline yet, skip (they need to set it manually first)
    // Unless they have all attributes in the review
    const hasCompleteReview =
      attributes.size !== null &&
      attributes.body !== null &&
      attributes.sweetBrininess !== null &&
      attributes.flavorfulness !== null &&
      attributes.creaminess !== null;

    if (
      user.baselineSize === null &&
      user.baselineBody === null &&
      user.baselineSweetBrininess === null &&
      user.baselineFlavorfulness === null &&
      user.baselineCreaminess === null
    ) {
      // No baseline exists - create one if review has all attributes
      if (hasCompleteReview) {
        await setBaselineProfile(userId, {
          size: attributes.size!,
          body: attributes.body!,
          sweetBrininess: attributes.sweetBrininess!,
          flavorfulness: attributes.flavorfulness!,
          creaminess: attributes.creaminess!,
        });
        logger.info(`Created initial baseline from review for user ${userId}`);
      }
      return;
    }

    // Calculate weight based on rating
    const newWeight = rating === 'LOVE_IT' ? 0.4 : 0.3; // LOVE_IT has more influence
    const baselineWeight = 1 - newWeight;

    // Update each attribute (only if provided in review)
    const updates: any = {};

    if (attributes.size !== null && user.baselineSize !== null) {
      updates.baselineSize = user.baselineSize * baselineWeight + attributes.size * newWeight;
    }
    if (attributes.body !== null && user.baselineBody !== null) {
      updates.baselineBody = user.baselineBody * baselineWeight + attributes.body * newWeight;
    }
    if (attributes.sweetBrininess !== null && user.baselineSweetBrininess !== null) {
      updates.baselineSweetBrininess =
        user.baselineSweetBrininess * baselineWeight + attributes.sweetBrininess * newWeight;
    }
    if (attributes.flavorfulness !== null && user.baselineFlavorfulness !== null) {
      updates.baselineFlavorfulness =
        user.baselineFlavorfulness * baselineWeight + attributes.flavorfulness * newWeight;
    }
    if (attributes.creaminess !== null && user.baselineCreaminess !== null) {
      updates.baselineCreaminess =
        user.baselineCreaminess * baselineWeight + attributes.creaminess * newWeight;
    }

    // Only update if there are changes
    if (Object.keys(updates).length > 0) {
      await prisma.user.update({
        where: { id: userId },
        data: updates,
      });

      // Invalidate cache
      invalidateCache(userId);

      logger.info(`Updated baseline profile for user ${userId} based on ${rating} review`);
    }
  } catch (error) {
    logger.error('Error updating baseline with review:', error);
    // Don't throw - this shouldn't block review creation
  }
};

/**
 * Invalidate recommendation cache for a user
 *
 * @param userId - User UUID
 */
export const invalidateCache = (userId: string): void => {
  recommendationCache.delete(userId);
  logger.info(`Invalidated recommendation cache for user ${userId}`);
};

/**
 * Clear all recommendation caches
 */
export const clearAllCaches = (): void => {
  const size = recommendationCache.size;
  recommendationCache.clear();
  logger.info(`Cleared ${size} recommendation caches`);
};
