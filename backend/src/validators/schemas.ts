import { z } from 'zod';
import { ReviewRating } from '@prisma/client';

/**
 * Validation Schemas
 * Using Zod for runtime type validation and input sanitization
 */

// Auth Schemas
export const registerSchema = z.object({
  email: z.string().email('Invalid email address').toLowerCase(),
  name: z.string().min(2, 'Name must be at least 2 characters').max(100, 'Name too long'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address').toLowerCase(),
  password: z.string().min(1, 'Password is required'),
});

// Review Schemas
export const createReviewSchema = z.object({
  oysterId: z.string().uuid('Invalid oyster ID'),
  rating: z.nativeEnum(ReviewRating, {
    errorMap: () => ({ message: 'Invalid rating value' }),
  }),
  notes: z.string().max(1000, 'Notes too long').optional(),
  size: z.number().int().min(1).max(10, 'Size must be between 1 and 10'),
  body: z.number().int().min(1).max(10, 'Body must be between 1 and 10'),
  sweetBrininess: z.number().int().min(1).max(10, 'Sweet/Brininess must be between 1 and 10'),
  flavorfulness: z.number().int().min(1).max(10, 'Flavorfulness must be between 1 and 10'),
  creaminess: z.number().int().min(1).max(10, 'Creaminess must be between 1 and 10'),
});

export const updateReviewSchema = z.object({
  rating: z.nativeEnum(ReviewRating).optional(),
  notes: z.string().max(1000, 'Notes too long').optional(),
  size: z.number().int().min(1).max(10).optional(),
  body: z.number().int().min(1).max(10).optional(),
  sweetBrininess: z.number().int().min(1).max(10).optional(),
  flavorfulness: z.number().int().min(1).max(10).optional(),
  creaminess: z.number().int().min(1).max(10).optional(),
});

// Oyster Schemas
export const createOysterSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  species: z.string().max(100).optional(),
  origin: z.string().max(200).optional(),
  standoutNotes: z.string().max(500).optional(),
  size: z.number().min(0).max(10).optional(),
  body: z.number().min(0).max(10).optional(),
  sweetBrininess: z.number().min(0).max(10).optional(),
  flavorfulness: z.number().min(0).max(10).optional(),
  creaminess: z.number().min(0).max(10).optional(),
});

export const updateOysterSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  species: z.string().max(100).optional(),
  origin: z.string().max(200).optional(),
  standoutNotes: z.string().max(500).optional(),
  size: z.number().min(0).max(10).optional(),
  body: z.number().min(0).max(10).optional(),
  sweetBrininess: z.number().min(0).max(10).optional(),
  flavorfulness: z.number().min(0).max(10).optional(),
  creaminess: z.number().min(0).max(10).optional(),
});

// Vote Schemas
export const voteSchema = z.object({
  isAgree: z.boolean({
    required_error: 'isAgree is required',
    invalid_type_error: 'isAgree must be a boolean',
  }),
});

// Query Schemas
export const paginationSchema = z.object({
  page: z.string().regex(/^\d+$/).transform(Number).pipe(z.number().min(1)).optional(),
  limit: z.string().regex(/^\d+$/).transform(Number).pipe(z.number().min(1).max(100)).optional(),
});

export const reviewIdsQuerySchema = z.object({
  reviewIds: z.string().min(1, 'reviewIds query parameter required'),
});

// UUID param validation
export const uuidParamSchema = z.object({
  id: z.string().uuid('Invalid ID format'),
});

export const oysterIdParamSchema = z.object({
  oysterId: z.string().uuid('Invalid oyster ID format'),
});

export const reviewIdParamSchema = z.object({
  reviewId: z.string().uuid('Invalid review ID format'),
});

export const userIdParamSchema = z.object({
  userId: z.string().uuid('Invalid user ID format'),
});
