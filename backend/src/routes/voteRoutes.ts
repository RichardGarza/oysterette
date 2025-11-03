import express from 'express';
import * as voteController from '../controllers/voteController';
import { authenticate } from '../middleware/auth';
import { validateBody, validateParams, validateQuery } from '../middleware/validate';
import {
  voteSchema,
  reviewIdParamSchema,
  userIdParamSchema,
  reviewIdsQuerySchema,
} from '../validators/schemas';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Vote on a review
router.post('/reviews/:reviewId/vote', validateParams(reviewIdParamSchema), validateBody(voteSchema), voteController.voteOnReview);

// Remove vote from a review
router.delete('/reviews/:reviewId/vote', validateParams(reviewIdParamSchema), voteController.removeVote);

// Get user's votes for multiple reviews
router.get('/reviews/votes', validateQuery(reviewIdsQuerySchema), voteController.getUserVotes);

// Get user credibility info
router.get('/users/:userId/credibility', validateParams(userIdParamSchema), voteController.getUserCredibility);

export default router;
