/**
 * Review Routes
 *
 * Handles oyster review endpoints with duplicate detection.
 *
 * Public Routes:
 * - GET /api/reviews/oyster/:oysterId - Get all reviews for an oyster
 *
 * Protected Routes (require authentication):
 * - POST /api/reviews - Create new review (prevents duplicates)
 * - GET /api/reviews/user - Get current user's reviews
 * - GET /api/reviews/check/:oysterId - Check if user reviewed oyster
 * - PUT /api/reviews/:reviewId - Update user's review
 * - DELETE /api/reviews/:reviewId - Delete user's review
 *
 * Features:
 * - Automatic duplicate detection via unique constraint
 * - Review quality scoring based on community votes
 * - Automatic oyster rating recalculation on mutations
 */

import express from 'express';
import {
  createReview,
  getOysterReviews,
  getUserReviews,
  updateReview,
  deleteReview,
  checkExistingReview,
} from '../controllers/reviewController';
import { authenticate } from '../middleware/auth';
import { validateBody, validateParams } from '../middleware/validate';
import {
  createReviewSchema,
  updateReviewSchema,
  oysterIdParamSchema,
  reviewIdParamSchema,
} from '../validators/schemas';

const router = express.Router();

// Public routes
router.get('/oyster/:oysterId', validateParams(oysterIdParamSchema), getOysterReviews);

// Protected routes (require authentication)
router.post('/', authenticate, validateBody(createReviewSchema), createReview);
router.get('/user', authenticate, getUserReviews);
router.get('/check/:oysterId', authenticate, validateParams(oysterIdParamSchema), checkExistingReview);
router.put('/:reviewId', authenticate, validateParams(reviewIdParamSchema), validateBody(updateReviewSchema), updateReview);
router.delete('/:reviewId', authenticate, validateParams(reviewIdParamSchema), deleteReview);

export default router;
