import express from 'express';
import {
  createReview,
  getOysterReviews,
  getUserReviews,
  updateReview,
  deleteReview,
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
router.put('/:reviewId', authenticate, validateParams(reviewIdParamSchema), validateBody(updateReviewSchema), updateReview);
router.delete('/:reviewId', authenticate, validateParams(reviewIdParamSchema), deleteReview);

export default router;
