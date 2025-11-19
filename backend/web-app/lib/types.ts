/**
 * Type Definitions for Web App
 * 
 * Shared types matching mobile app and backend API
 */

export type ReviewRating = 'LOVE_IT' | 'LIKE_IT' | 'OKAY' | 'MEH';

export interface Oyster {
  id: string;
  name: string;
  species: string;
  origin: string;
  standoutNotes: string | null;
  size: number;
  body: number;
  sweetBrininess: number;
  flavorfulness: number;
  creaminess: number;
  totalReviews: number;
  avgRating: number;
  overallScore: number;
  avgSize: number | null;
  avgBody: number | null;
  avgSweetBrininess: number | null;
  avgFlavorfulness: number | null;
  avgCreaminess: number | null;
  createdAt: string;
  updatedAt: string;
  _count?: {
    reviews: number;
  };
  reviews?: Review[];
}

export interface Review {
  id: string;
  userId: string;
  oysterId: string;
  rating: ReviewRating;
  size?: number;
  body?: number;
  sweetBrininess?: number;
  flavorfulness?: number;
  creaminess?: number;
  notes?: string;
  photoUrls?: string[];
  createdAt: string;
  agreeCount: number;
  disagreeCount: number;
  netVoteScore: number;
  weightedScore: number;
  user?: {
    id: string;
    name: string;
    username?: string | null;
    profilePhotoUrl?: string | null;
  };
  oyster?: Oyster;
}

export interface User {
  id: string;
  email: string;
  name: string;
  username?: string;
  profilePhotoUrl?: string | null;
  credibilityScore: number;
  totalAgrees: number;
  totalDisagrees: number;
  reviewCount: number;
  baselineSize?: number | null;
  baselineBody?: number | null;
  baselineSweetBrininess?: number | null;
  baselineFlavorfulness?: number | null;
  baselineCreaminess?: number | null;
  rangeMinSize?: number | null;
  rangeMaxSize?: number | null;
  rangeMedianSize?: number | null;
  rangeMinBody?: number | null;
  rangeMaxBody?: number | null;
  rangeMedianBody?: number | null;
  rangeMinSweetBrininess?: number | null;
  rangeMaxSweetBrininess?: number | null;
  rangeMedianSweetBrininess?: number | null;
  rangeMinFlavorfulness?: number | null;
  rangeMaxFlavorfulness?: number | null;
  rangeMedianFlavorfulness?: number | null;
  rangeMinCreaminess?: number | null;
  rangeMaxCreaminess?: number | null;
  rangeMedianCreaminess?: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

