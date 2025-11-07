/**
 * Data Type Definitions
 *
 * TypeScript interfaces and types for all app data structures.
 *
 * Purpose:
 * - Type safety across frontend and backend
 * - Matches PostgreSQL schema via Prisma
 * - Autocomplete for object properties
 * - Compile-time validation
 * - Self-documenting data structures
 *
 * Main Interfaces:
 * 1. Oyster: Core oyster data with attributes and aggregated ratings
 * 2. Review: User review with rating, attributes, and voting metrics
 * 3. User: User account with preferences and privacy settings
 * 4. UserTopOyster: User's favorite oysters ranking
 * 5. AuthResponse: Login/register API response
 * 6. ApiResponse<T>: Generic API wrapper
 *
 * Oyster Interface:
 * - id: UUID from database
 * - name, species, origin: Basic info
 * - standoutNotes: Optional description
 * - Seed attributes (size, body, sweetBrininess, flavorfulness, creaminess): 1-10 scale
 * - totalReviews: Count of reviews
 * - avgRating: Average rating (0-4 scale: WHATEVER=1, MEH=2, LIKE_IT=3, LOVE_IT=4)
 * - overallScore: Weighted score (0-10 scale) = 40% avgRating + 60% attributes
 * - Aggregated attributes: Weighted averages from user reviews
 * - _count, reviews: Optional nested data
 *
 * Review Interface:
 * - id, userId, oysterId: Relations
 * - rating: ReviewRating enum (LOVE_IT, LIKE_IT, MEH, WHATEVER)
 * - Attribute sliders: Optional 1-10 scores
 * - notes: Optional tasting notes
 * - Voting metrics: agreeCount, disagreeCount, netVoteScore, weightedScore
 * - Relations: user, oyster (nested objects)
 *
 * ReviewRating Enum:
 * - LOVE_IT: ❤️ (Best, value 4)
 * - LIKE_IT: 👍 (Good, value 3)
 * - MEH: 😐 (Okay, value 2)
 * - WHATEVER: 🤷 (Poor, value 1)
 *
 * User Interface:
 * - id, email, name: Basic account info
 * - preferences: JSON field for theme and other settings
 * - Credibility metrics: credibilityScore, totalAgrees, totalDisagrees, reviewCount
 * - Privacy settings: profileVisibility, showReviewHistory, showFavorites, showStatistics, allowMessages
 * - createdAt, updatedAt: Timestamps
 *
 * User Credibility Badges:
 * - Novice: 0-0.9 (🌟 Bronze)
 * - Standard: 1.0 (default, not shown)
 * - Trusted: 1.0-1.4 (⭐ Silver)
 * - Expert: 1.5+ (🏆 Gold)
 *
 * UserTopOyster Interface:
 * - User's manually ranked favorite oysters (future feature)
 * - rank: Position in user's list (1-10)
 * - addedAt: Timestamp
 * - oyster: Full oyster object
 *
 * AuthResponse Interface:
 * - Returned from /auth/register, /auth/login, /auth/google
 * - user: Full user object
 * - token: JWT for subsequent API calls
 *
 * ApiResponse<T> Interface:
 * - Generic wrapper for all backend responses
 * - success: Boolean indicating success/failure
 * - data?: Generic type T (oyster, review, user, etc.)
 * - count?: Total count for paginated responses
 * - error?: Error message string
 *
 * Attribute Scales (1-10):
 * - Size: 1 (Tiny) → 10 (Huge)
 * - Body: 1 (Thin) → 10 (Extremely Fat)
 * - Sweet/Brininess: 1 (Very Sweet) → 10 (Very Salty)
 * - Flavorfulness: 1 (Boring) → 10 (Extremely Bold)
 * - Creaminess: 1 (None) → 10 (Nothing But Cream)
 *
 * Rating Algorithm:
 * - Overall Score = (40% avgRating) + (60% average of all attributes)
 * - avgRating mapped: WHATEVER=1 → 2.5/10, MEH=2 → 5/10, LIKE_IT=3 → 7.5/10, LOVE_IT=4 → 10/10
 * - Attribute average: (size + body + sweetBrininess + flavorfulness + creaminess) / 5
 * - Example: avgRating=3.5, avgAttributes=7 → (0.4 * 8.75) + (0.6 * 7) = 7.7
 *
 * Usage Throughout App:
 * - API service: Response type checking
 * - Screens: State typing for data
 * - Components: Prop typing
 * - Navigation: Route params
 * - Services: Storage and sync
 *
 * Type Safety Benefits:
 * - Prevents accessing non-existent properties
 * - Catches typos at compile time
 * - Self-documenting (no need to check backend)
 * - Refactoring safety
 * - IDE autocomplete
 */

// Oyster type matching PostgreSQL schema
export interface Oyster {
  id: string;
  name: string;
  species: string;
  origin: string;
  standoutNotes: string | null;

  // 10-point scale attributes (seed data)
  size: number;           // 1 (Tiny) to 10 (Huge)
  body: number;           // 1 (Thin) to 10 (Extremely Fat)
  sweetBrininess: number; // 1 (Very Sweet) to 10 (Very Salty)
  flavorfulness: number;  // 1 (Boring) to 10 (Extremely Bold)
  creaminess: number;     // 1 (None) to 10 (Nothing But Cream)

  // Aggregated rating data (from user reviews)
  totalReviews: number;        // Total number of reviews
  avgRating: number;           // Average rating (0-4 scale)
  overallScore: number;        // Overall weighted score (0-10 scale)

  // Aggregated attribute scores (weighted average)
  avgSize: number | null;
  avgBody: number | null;
  avgSweetBrininess: number | null;
  avgFlavorfulness: number | null;
  avgCreaminess: number | null;

  createdAt: string;
  updatedAt: string;

  // Include review count if available
  _count?: {
    reviews: number;
  };

  // Include reviews if fetched with details
  reviews?: Review[];
}

// Review rating enum
export type ReviewRating = 'LOVE_IT' | 'LIKE_IT' | 'MEH' | 'WHATEVER';

// Review type
export interface Review {
  id: string;
  userId: string;
  oysterId: string;
  rating: ReviewRating;

  // 10-point scale sliders (optional)
  size?: number;
  body?: number;
  sweetBrininess?: number;
  flavorfulness?: number;
  creaminess?: number;

  notes?: string;
  photoUrls?: string[];
  createdAt: string;

  // Voting metrics
  agreeCount: number;
  disagreeCount: number;
  netVoteScore: number;
  weightedScore: number;

  // Relations
  user?: {
    id: string;
    name: string;
  };
  oyster?: Oyster;
}

// User type
export interface User {
  id: string;
  email: string;
  name: string;
  preferences?: any; // JSON field

  // Reviewer credibility metrics
  credibilityScore: number;
  totalAgrees: number;
  totalDisagrees: number;
  reviewCount: number;

  // Privacy settings
  profileVisibility: 'public' | 'friends' | 'private';
  showReviewHistory: boolean;
  showFavorites: boolean;
  showStatistics: boolean;
  allowMessages: boolean;

  createdAt: string;
  updatedAt: string;
}

// User Top Oyster
export interface UserTopOyster {
  id: string;
  userId: string;
  oysterId: string;
  rank: number;
  addedAt: string;
  oyster: Oyster;
}

// Auth response
export interface AuthResponse {
  user: User;
  token: string;
}

// API Response wrapper
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  count?: number;
  error?: string;
}
