/**
 * Type Definitions
 *
 * Core TypeScript interfaces matching the PostgreSQL schema.
 * All types are shared between mobile app and backend for consistency.
 */

// ============================================================================
// CONSTANTS
// ============================================================================

/** Rating scale boundaries */
export const RATING_SCALE = {
  MIN: 1,
  MAX: 10,
} as const;

/** Review rating values (highest to lowest) */
export const REVIEW_RATING_VALUES = {
  LOVE_IT: 4,
  LIKE_IT: 3,
  OKAY: 2,
  MEH: 1,
} as const;

/** Review rating score mappings (out of 10) */
export const RATING_SCORES = {
  LOVE_IT: 9.0,
  LIKE_IT: 7.0,
  OKAY: 4.95,
  MEH: 2.5,
} as const;

// ============================================================================
// ENUMS & TYPES
// ============================================================================

/** Review rating options (highest to lowest: LOVE_IT > LIKE_IT > OKAY > MEH) */
export type ReviewRating = 'LOVE_IT' | 'LIKE_IT' | 'OKAY' | 'MEH';

/** User profile visibility levels */
export type ProfileVisibility = 'public' | 'friends' | 'private';

/** User credibility badge tiers */
export type CredibilityBadge = 'novice' | 'standard' | 'trusted' | 'expert';

// ============================================================================
// INTERFACES
// ============================================================================

/**
 * User preferences stored as JSON
 * @property theme - Light or dark mode preference
 * @property notifications - Notification settings
 */
export interface UserPreferences {
  theme?: 'light' | 'dark';
  notifications?: {
    reviews?: boolean;
    votes?: boolean;
    recommendations?: boolean;
  };
}

/**
 * Oyster entity with attributes and aggregated ratings
 * @remarks Matches Prisma schema: Oyster model
 */
export interface Oyster {
  readonly id: string;
  readonly name: string;
  readonly species: string;
  readonly origin: string;
  readonly standoutNotes: string | null;

  // Seed attributes (1-10 scale)
  readonly size: number;
  readonly body: number;
  readonly sweetBrininess: number;
  readonly flavorfulness: number;
  readonly creaminess: number;

  // Aggregated rating data
  readonly totalReviews: number;
  readonly avgRating: number;
  readonly overallScore: number;

  // Aggregated attribute scores (weighted average from reviews)
  readonly avgSize: number | null;
  readonly avgBody: number | null;
  readonly avgSweetBrininess: number | null;
  readonly avgFlavorfulness: number | null;
  readonly avgCreaminess: number | null;

  readonly createdAt: string;
  readonly updatedAt: string;

  // Optional nested data
  readonly _count?: {
    reviews: number;
  };
  readonly reviews?: Review[];
}

/**
 * Review entity with rating, attributes, and voting metrics
 * @remarks Matches Prisma schema: Review model
 */
export interface Review {
  readonly id: string;
  readonly userId: string;
  readonly oysterId: string;
  readonly rating: ReviewRating;

  // Optional 10-point scale attributes
  readonly size?: number;
  readonly body?: number;
  readonly sweetBrininess?: number;
  readonly flavorfulness?: number;
  readonly creaminess?: number;

  readonly notes?: string;
  readonly photoUrls?: string[];
  readonly createdAt: string;

  // Voting metrics
  readonly agreeCount: number;
  readonly disagreeCount: number;
  readonly netVoteScore: number;
  readonly weightedScore: number;

  // Optional relations
  readonly user?: {
    id: string;
    name: string;
  };
  readonly oyster?: Oyster;
}

/**
 * User entity with preferences and privacy settings
 * @remarks Matches Prisma schema: User model
 */
export interface User {
  readonly id: string;
  readonly email: string;
  readonly name: string;
  readonly profilePhotoUrl?: string;
  readonly preferences?: UserPreferences;

  // Reviewer credibility metrics
  readonly credibilityScore: number;
  readonly totalAgrees: number;
  readonly totalDisagrees: number;
  readonly reviewCount: number;

  // Privacy settings
  readonly profileVisibility: ProfileVisibility;
  readonly showReviewHistory: boolean;
  readonly showFavorites: boolean;
  readonly showStatistics: boolean;

  // Baseline flavor profile (for recommendations)
  readonly baselineSize?: number | null;
  readonly baselineBody?: number | null;
  readonly baselineSweetBrininess?: number | null;
  readonly baselineFlavorfulness?: number | null;
  readonly baselineCreaminess?: number | null;

  readonly createdAt: string;
  readonly updatedAt: string;
}

/**
 * User's manually ranked favorite oysters
 * @remarks Future feature for custom top lists
 */
export interface UserTopOyster {
  readonly id: string;
  readonly userId: string;
  readonly oysterId: string;
  readonly rank: number;
  readonly addedAt: string;
  readonly oyster: Oyster;
}

/**
 * Authentication response from login/register endpoints
 */
export interface AuthResponse {
  readonly user: User;
  readonly token: string;
}

/**
 * Generic API response wrapper
 * @template T The data type returned in the response
 */
export interface ApiResponse<T> {
  readonly success: boolean;
  readonly data?: T;
  readonly count?: number;
  readonly error?: string;
}

// ============================================================================
// TYPE GUARDS
// ============================================================================

/**
 * Type guard to check if a value is a valid ReviewRating
 */
export function isReviewRating(value: unknown): value is ReviewRating {
  return typeof value === 'string' &&
    ['LOVE_IT', 'LIKE_IT', 'OKAY', 'MEH'].includes(value);
}

/**
 * Type guard to check if a value is a valid ProfileVisibility
 */
export function isProfileVisibility(value: unknown): value is ProfileVisibility {
  return typeof value === 'string' &&
    ['public', 'friends', 'private'].includes(value);
}

/**
 * Get credibility badge tier based on score
 * @param score - User's credibility score
 * @returns The corresponding badge tier
 */
export function getCredibilityBadge(score: number): CredibilityBadge {
  if (score < 0.9) return 'novice';
  if (score < 1.0) return 'standard';
  if (score < 1.5) return 'trusted';
  return 'expert';
}

/**
 * Validate if a number is within the 1-10 attribute scale
 */
export function isValidAttributeScore(value: number): boolean {
  return Number.isInteger(value) && value >= RATING_SCALE.MIN && value <= RATING_SCALE.MAX;
}
