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
export type ReviewRating = 'LOVED_IT' | 'LIKED_IT' | 'MEH' | 'HATED_IT';

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
  createdAt: string;

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
