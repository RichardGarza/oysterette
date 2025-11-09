/**
 * Recommendation Service
 *
 * Provides personalized oyster recommendations using baseline flavor profiles.
 *
 * Baseline Flavor Profile System:
 * - Users can set a baseline profile before reviewing (ideal oyster attributes)
 * - Baseline updates automatically with each positive review (LIKE_IT, LOVE_IT)
 * - Negative reviews (MEH) don't affect baseline
 * - Update formula: weighted average toward higher-rated flavors
 * - Favorited oysters get 1.5x weight in profile calculation
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

    // Fetch user's favorited oysters for 1.5x weighting
    const favorites = await prisma.favorite.findMany({
      where: { userId },
      select: { oysterId: true },
    });

    const favoriteOysterIds = new Set(favorites.map((f) => f.oysterId));

    // Calculate weighted averages from reviews
    // Favorited oysters get 1.5x weight
    let totalSize = 0;
    let totalBody = 0;
    let totalSweet = 0;
    let totalFlavor = 0;
    let totalCream = 0;
    let totalWeight = 0;

    reviews.forEach((review) => {
      // Weight: 1.5 for favorited oysters, 1.0 for others
      const weight = favoriteOysterIds.has(review.oysterId) ? 1.5 : 1.0;

      const size = review.size || review.oyster.avgSize || review.oyster.size;
      const body = review.body || review.oyster.avgBody || review.oyster.body;
      const sweet =
        review.sweetBrininess ||
        review.oyster.avgSweetBrininess ||
        review.oyster.sweetBrininess;
      const flavor =
        review.flavorfulness ||
        review.oyster.avgFlavorfulness ||
        review.oyster.flavorfulness;
      const cream =
        review.creaminess || review.oyster.avgCreaminess || review.oyster.creaminess;

      totalSize += size * weight;
      totalBody += body * weight;
      totalSweet += sweet * weight;
      totalFlavor += flavor * weight;
      totalCream += cream * weight;
      totalWeight += weight;
    });

    const count = totalWeight; // Use total weight instead of review count

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
 * Find similar users based on review patterns
 *
 * Uses cosine similarity on shared oyster ratings.
 *
 * @param userId - Target user UUID
 * @param limit - Number of similar users to return
 * @returns Array of user IDs with similarity scores
 */
export const findSimilarUsers = async (
  userId: string,
  limit: number = 10
): Promise<Array<{ userId: string; similarity: number }>> => {
  try {
    // Get target user's reviews
    const userReviews = await prisma.review.findMany({
      where: { userId },
      select: { oysterId: true, rating: true },
    });

    if (userReviews.length < 3) {
      return []; // Need at least 3 reviews for meaningful comparison
    }

    // Create rating map for target user
    const userRatingMap = new Map<string, number>();
    userReviews.forEach((r) => {
      const score = r.rating === 'LOVE_IT' ? 5 : r.rating === 'LIKE_IT' ? 4 : r.rating === 'OKAY' ? 3 : r.rating === 'MEH' ? 2 : 1;
      userRatingMap.set(r.oysterId, score);
    });

    const oysterIds = Array.from(userRatingMap.keys());

    // Find other users who reviewed same oysters
    const otherUsersReviews = await prisma.review.findMany({
      where: {
        oysterId: { in: oysterIds },
        userId: { not: userId },
      },
      select: { userId: true, oysterId: true, rating: true },
    });

    // Group by user
    const userMap = new Map<string, Map<string, number>>();
    otherUsersReviews.forEach((r) => {
      if (!r.userId) return; // Skip if userId is null
      if (!userMap.has(r.userId)) {
        userMap.set(r.userId, new Map());
      }
      const score = r.rating === 'LOVE_IT' ? 5 : r.rating === 'LIKE_IT' ? 4 : r.rating === 'OKAY' ? 3 : r.rating === 'MEH' ? 2 : 1;
      userMap.get(r.userId)!.set(r.oysterId, score);
    });

    // Calculate cosine similarity with each user
    const similarities: Array<{ userId: string; similarity: number }> = [];

    userMap.forEach((otherUserRatings, otherUserId) => {
      // Find common oysters
      const commonOysters = oysterIds.filter((id) => otherUserRatings.has(id));

      if (commonOysters.length < 2) return; // Need at least 2 common reviews

      // Calculate cosine similarity
      let dotProduct = 0;
      let userMagnitude = 0;
      let otherMagnitude = 0;

      commonOysters.forEach((oysterId) => {
        const userRating = userRatingMap.get(oysterId)!;
        const otherRating = otherUserRatings.get(oysterId)!;

        dotProduct += userRating * otherRating;
        userMagnitude += userRating * userRating;
        otherMagnitude += otherRating * otherRating;
      });

      const magnitude = Math.sqrt(userMagnitude) * Math.sqrt(otherMagnitude);
      const similarity = magnitude > 0 ? dotProduct / magnitude : 0;

      if (similarity > 0.5) {
        // Only include users with >50% similarity
        similarities.push({ userId: otherUserId, similarity });
      }
    });

    // Sort by similarity (descending)
    similarities.sort((a, b) => b.similarity - a.similarity);

    return similarities.slice(0, limit);
  } catch (error) {
    logger.error('Error finding similar users:', error);
    return [];
  }
};

/**
 * Get collaborative filtering recommendations
 *
 * Finds oysters that similar users liked but target user hasn't tried.
 *
 * @param userId - User UUID
 * @param limit - Number of recommendations to return
 * @returns Array of recommended oysters with collaborative scores
 */
export const getCollaborativeRecommendations = async (
  userId: string,
  limit: number = 10
): Promise<any[]> => {
  try {
    const similarUsers = await findSimilarUsers(userId, 20);

    if (similarUsers.length === 0) {
      return [];
    }

    // Get target user's reviewed oysters (to exclude)
    const reviewedOysterIds = await prisma.review
      .findMany({
        where: { userId },
        select: { oysterId: true },
      })
      .then((reviews) => reviews.map((r) => r.oysterId));

    // Get oysters liked by similar users
    const similarUserIds = similarUsers.map((u) => u.userId);
    const similarityMap = new Map(similarUsers.map((u) => [u.userId, u.similarity]));

    const likedByOthers = await prisma.review.findMany({
      where: {
        userId: { in: similarUserIds },
        rating: { in: ['LIKE_IT', 'LOVE_IT'] },
        oysterId: { notIn: reviewedOysterIds },
      },
      include: {
        oyster: true,
      },
    });

    // Score each oyster by weighted sum of similar users' ratings
    const oysterScores = new Map<string, { oyster: any; score: number; count: number }>();

    likedByOthers.forEach((review) => {
      if (!review.userId) return; // Skip if userId is null
      const userSimilarity = similarityMap.get(review.userId) || 0;
      const ratingWeight = review.rating === 'LOVE_IT' ? 2 : 1;
      const score = userSimilarity * ratingWeight;

      if (oysterScores.has(review.oysterId)) {
        const existing = oysterScores.get(review.oysterId)!;
        existing.score += score;
        existing.count += 1;
      } else {
        oysterScores.set(review.oysterId, {
          oyster: review.oyster,
          score,
          count: 1,
        });
      }
    });

    // Convert to array and sort by score
    const recommendations = Array.from(oysterScores.values())
      .map((item) => ({
        ...item.oyster,
        collaborativeScore: item.score,
        similarUserCount: item.count,
        reason: 'collaborative',
      }))
      .sort((a, b) => b.collaborativeScore - a.collaborativeScore)
      .slice(0, limit);

    logger.info(
      `Generated ${recommendations.length} collaborative recommendations for user ${userId}`
    );

    return recommendations;
  } catch (error) {
    logger.error('Error getting collaborative recommendations:', error);
    return [];
  }
};

/**
 * Get hybrid recommendations (attribute + collaborative)
 *
 * Combines attribute-based and collaborative filtering approaches.
 *
 * @param userId - User UUID
 * @param limit - Number of recommendations to return
 * @returns Array of recommended oysters with hybrid scores
 */
export const getHybridRecommendations = async (
  userId: string,
  limit: number = 10
): Promise<any[]> => {
  try {
    // Get both types of recommendations
    const [attributeBased, collaborative] = await Promise.all([
      getRecommendations(userId, limit * 2),
      getCollaborativeRecommendations(userId, limit * 2),
    ]);

    // Create combined map with normalized scores
    const oysterMap = new Map<string, any>();

    // Normalize attribute scores (0-1)
    attributeBased.forEach((oyster) => {
      const normalizedSimilarity = oyster.similarity ? oyster.similarity / 100 : 0;
      oysterMap.set(oyster.id, {
        ...oyster,
        attributeScore: normalizedSimilarity,
        collaborativeScore: 0,
        hybridScore: normalizedSimilarity * 0.6, // 60% weight for attributes
      });
    });

    // Add collaborative scores (normalize and weight)
    if (collaborative.length > 0) {
      const maxCollabScore = Math.max(...collaborative.map((o) => o.collaborativeScore));

      collaborative.forEach((oyster) => {
        const normalizedCollab = oyster.collaborativeScore / maxCollabScore;

        if (oysterMap.has(oyster.id)) {
          // Oyster in both lists - combine scores
          const existing = oysterMap.get(oyster.id);
          existing.collaborativeScore = normalizedCollab;
          existing.hybridScore = existing.attributeScore * 0.6 + normalizedCollab * 0.4;
          existing.reason = 'hybrid';
        } else {
          // Only in collaborative list
          oysterMap.set(oyster.id, {
            ...oyster,
            attributeScore: 0,
            collaborativeScore: normalizedCollab,
            hybridScore: normalizedCollab * 0.4, // 40% weight for collaborative only
            reason: 'collaborative',
          });
        }
      });
    }

    // Sort by hybrid score
    const recommendations = Array.from(oysterMap.values())
      .sort((a, b) => b.hybridScore - a.hybridScore)
      .slice(0, limit);

    logger.info(
      `Generated ${recommendations.length} hybrid recommendations for user ${userId}`
    );

    return recommendations;
  } catch (error) {
    logger.error('Error getting hybrid recommendations:', error);
    return [];
  }
};

/**
 * Get personalized oyster recommendations (attribute-based)
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
 * Calculate median value from sorted array
 */
function calculateMedian(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    const val1 = sorted[mid - 1];
    const val2 = sorted[mid];
    if (val1 === undefined || val2 === undefined) return 0;
    return (val1 + val2) / 2;
  }
  return sorted[mid] ?? 0;
}

/**
 * Update flavor profile ranges based on user's positive reviews
 * Triggers automatically when user has 5+ LIKE_IT/LOVE_IT reviews
 */
export const updateFlavorProfileRanges = async (userId: string): Promise<void> => {
  try {
    // Get LIKE_IT and LOVE_IT reviews with attributes
    const reviews = await prisma.review.findMany({
      where: {
        userId,
        rating: { in: ['LIKE_IT', 'LOVE_IT'] },
      },
      select: {
        size: true,
        body: true,
        sweetBrininess: true,
        flavorfulness: true,
        creaminess: true,
      },
    });

    // Need at least 5 positive reviews to calculate ranges
    if (reviews.length < 5) {
      logger.info(`User ${userId} has ${reviews.length} positive reviews, need 5+ for ranges`);
      return;
    }

    // Extract values for each attribute (filter out nulls)
    const sizes = reviews.map(r => r.size).filter((v): v is number => v !== null);
    const bodies = reviews.map(r => r.body).filter((v): v is number => v !== null);
    const sweetBrininesses = reviews.map(r => r.sweetBrininess).filter((v): v is number => v !== null);
    const flavorfulnesses = reviews.map(r => r.flavorfulness).filter((v): v is number => v !== null);
    const creaminesses = reviews.map(r => r.creaminess).filter((v): v is number => v !== null);

    // Calculate ranges
    await prisma.user.update({
      where: { id: userId },
      data: {
        rangeMinSize: sizes.length > 0 ? Math.min(...sizes) : null,
        rangeMaxSize: sizes.length > 0 ? Math.max(...sizes) : null,
        rangeMedianSize: sizes.length > 0 ? calculateMedian(sizes) : null,
        rangeMinBody: bodies.length > 0 ? Math.min(...bodies) : null,
        rangeMaxBody: bodies.length > 0 ? Math.max(...bodies) : null,
        rangeMedianBody: bodies.length > 0 ? calculateMedian(bodies) : null,
        rangeMinSweetBrininess: sweetBrininesses.length > 0 ? Math.min(...sweetBrininesses) : null,
        rangeMaxSweetBrininess: sweetBrininesses.length > 0 ? Math.max(...sweetBrininesses) : null,
        rangeMedianSweetBrininess: sweetBrininesses.length > 0 ? calculateMedian(sweetBrininesses) : null,
        rangeMinFlavorfulness: flavorfulnesses.length > 0 ? Math.min(...flavorfulnesses) : null,
        rangeMaxFlavorfulness: flavorfulnesses.length > 0 ? Math.max(...flavorfulnesses) : null,
        rangeMedianFlavorfulness: flavorfulnesses.length > 0 ? calculateMedian(flavorfulnesses) : null,
        rangeMinCreaminess: creaminesses.length > 0 ? Math.min(...creaminesses) : null,
        rangeMaxCreaminess: creaminesses.length > 0 ? Math.max(...creaminesses) : null,
        rangeMedianCreaminess: creaminesses.length > 0 ? calculateMedian(creaminesses) : null,
      },
    });

    logger.info(`Updated flavor profile ranges for user ${userId} (${reviews.length} positive reviews)`);
  } catch (error) {
    logger.error('Error updating flavor profile ranges:', error);
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

    // Update flavor profile ranges if user has 5+ positive reviews
    await updateFlavorProfileRanges(userId);
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
