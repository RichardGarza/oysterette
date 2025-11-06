import prisma from '../lib/prisma';
import { ReviewRating } from '@prisma/client';

interface UserPreferences {
  size: number;
  body: number;
  sweetBrininess: number;
  flavorfulness: number;
  creaminess: number;
  reviewCount: number;
}

interface RecommendedOyster {
  id: string;
  name: string;
  origin: string | null;
  species: string | null;
  overallScore: number;
  totalReviews: number;
  size: number;
  body: number;
  sweetBrininess: number;
  flavorfulness: number;
  creaminess: number;
  similarityScore: number;
  matchReason: string;
}

/**
 * Calculate user's attribute preferences based on their reviews
 */
async function calculateUserPreferences(userId: string): Promise<UserPreferences | null> {
  // Get user's reviews, focusing on positive ratings
  const reviews = await prisma.review.findMany({
    where: {
      userId,
      rating: {
        in: ['LOVE_IT', 'LIKE_IT'] as ReviewRating[],
      },
    },
    select: {
      size: true,
      body: true,
      sweetBrininess: true,
      flavorfulness: true,
      creaminess: true,
    },
  });

  if (reviews.length === 0) {
    return null;
  }

  // Calculate averages across all highly-rated reviews
  let totalSize = 0;
  let totalBody = 0;
  let totalSweetBrininess = 0;
  let totalFlavorfulness = 0;
  let totalCreaminess = 0;

  reviews.forEach((review) => {
    totalSize += review.size || 5;
    totalBody += review.body || 5;
    totalSweetBrininess += review.sweetBrininess || 5;
    totalFlavorfulness += review.flavorfulness || 5;
    totalCreaminess += review.creaminess || 5;
  });

  const count = reviews.length;

  return {
    size: totalSize / count,
    body: totalBody / count,
    sweetBrininess: totalSweetBrininess / count,
    flavorfulness: totalFlavorfulness / count,
    creaminess: totalCreaminess / count,
    reviewCount: count,
  };
}

/**
 * Calculate similarity score between user preferences and an oyster
 * Returns a score from 0-100 (higher = more similar)
 */
function calculateSimilarity(
  preferences: UserPreferences,
  oyster: {
    size: number;
    body: number;
    sweetBrininess: number;
    flavorfulness: number;
    creaminess: number;
  }
): number {
  // Calculate Euclidean distance for each attribute (normalized to 0-10 scale)
  const sizeDiff = Math.abs(preferences.size - oyster.size);
  const bodyDiff = Math.abs(preferences.body - oyster.body);
  const sweetBrinyDiff = Math.abs(preferences.sweetBrininess - oyster.sweetBrininess);
  const flavorDiff = Math.abs(preferences.flavorfulness - oyster.flavorfulness);
  const creamDiff = Math.abs(preferences.creaminess - oyster.creaminess);

  // Calculate total distance (max possible distance = 50 if all attributes differ by 10)
  const totalDistance = sizeDiff + bodyDiff + sweetBrinyDiff + flavorDiff + creamDiff;

  // Convert to similarity score (0-100)
  // Perfect match (0 distance) = 100, max distance (50) = 0
  const maxDistance = 50; // 5 attributes * 10 max difference each
  const similarity = ((maxDistance - totalDistance) / maxDistance) * 100;

  return Math.max(0, Math.min(100, similarity)); // Clamp to 0-100
}

/**
 * Generate match reason based on which attributes are most similar
 */
function generateMatchReason(
  preferences: UserPreferences,
  oyster: {
    size: number;
    body: number;
    sweetBrininess: number;
    flavorfulness: number;
    creaminess: number;
  }
): string {
  const attributeScores = [
    { name: 'size', diff: Math.abs(preferences.size - oyster.size), value: oyster.size },
    { name: 'body', diff: Math.abs(preferences.body - oyster.body), value: oyster.body },
    {
      name: 'sweetness/brininess',
      diff: Math.abs(preferences.sweetBrininess - oyster.sweetBrininess),
      value: oyster.sweetBrininess,
    },
    {
      name: 'flavor',
      diff: Math.abs(preferences.flavorfulness - oyster.flavorfulness),
      value: oyster.flavorfulness,
    },
    {
      name: 'creaminess',
      diff: Math.abs(preferences.creaminess - oyster.creaminess),
      value: oyster.creaminess,
    },
  ];

  // Find the two most similar attributes (lowest difference)
  const topMatches = attributeScores.sort((a, b) => a.diff - b.diff).slice(0, 2);

  if (topMatches.length === 0) {
    return 'Similar to your preferences';
  }

  if (topMatches[0]!.diff < 1.5) {
    return `Matches your love for ${topMatches[0]!.name}`;
  }

  if (topMatches.length < 2) {
    return `Similar ${topMatches[0]!.name} profile`;
  }

  return `Similar ${topMatches[0]!.name} and ${topMatches[1]!.name} profile`;
}

/**
 * Get personalized oyster recommendations for a user
 */
export async function getRecommendations(
  userId: string,
  limit: number = 10
): Promise<RecommendedOyster[]> {
  // Calculate user's preferences
  const preferences = await calculateUserPreferences(userId);

  if (!preferences) {
    // User has no reviews yet, return popular oysters
    const popular = await prisma.oyster.findMany({
      where: {
        totalReviews: {
          gt: 0,
        },
      },
      orderBy: {
        overallScore: 'desc',
      },
      take: limit,
      select: {
        id: true,
        name: true,
        origin: true,
        species: true,
        overallScore: true,
        totalReviews: true,
        size: true,
        body: true,
        sweetBrininess: true,
        flavorfulness: true,
        creaminess: true,
      },
    });

    return popular.map((oyster) => ({
      ...oyster,
      size: oyster.size || 5,
      body: oyster.body || 5,
      sweetBrininess: oyster.sweetBrininess || 5,
      flavorfulness: oyster.flavorfulness || 5,
      creaminess: oyster.creaminess || 5,
      similarityScore: 0,
      matchReason: 'Highly rated by community',
    }));
  }

  // Get oysters the user hasn't reviewed yet
  const reviewedOysterIds = await prisma.review.findMany({
    where: { userId },
    select: { oysterId: true },
  });

  const reviewedIds = reviewedOysterIds.map((r) => r.oysterId);

  const unreviewed = await prisma.oyster.findMany({
    where: {
      id: {
        notIn: reviewedIds,
      },
    },
    select: {
      id: true,
      name: true,
      origin: true,
      species: true,
      overallScore: true,
      totalReviews: true,
      size: true,
      body: true,
      sweetBrininess: true,
      flavorfulness: true,
      creaminess: true,
    },
  });

  // Calculate similarity scores for each oyster
  const scored = unreviewed.map((oyster) => {
    const oysterAttrs = {
      size: oyster.size || 5,
      body: oyster.body || 5,
      sweetBrininess: oyster.sweetBrininess || 5,
      flavorfulness: oyster.flavorfulness || 5,
      creaminess: oyster.creaminess || 5,
    };

    const similarityScore = calculateSimilarity(preferences, oysterAttrs);
    const matchReason = generateMatchReason(preferences, oysterAttrs);

    return {
      ...oyster,
      size: oysterAttrs.size,
      body: oysterAttrs.body,
      sweetBrininess: oysterAttrs.sweetBrininess,
      flavorfulness: oysterAttrs.flavorfulness,
      creaminess: oysterAttrs.creaminess,
      similarityScore,
      matchReason,
    };
  });

  // Sort by similarity score (highest first) and return top N
  return scored.sort((a, b) => b.similarityScore - a.similarityScore).slice(0, limit);
}
