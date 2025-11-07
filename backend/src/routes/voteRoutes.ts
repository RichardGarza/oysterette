/**
 * Vote Routes
 *
 * Handles review voting (agree/disagree) and credibility tracking.
 * All routes require authentication.
 *
 * Voting Operations:
 * - POST /api/votes/reviews/:reviewId/vote - Cast agree/disagree vote
 * - DELETE /api/votes/reviews/:reviewId/vote - Remove vote
 *
 * Vote Status:
 * - GET /api/votes/reviews/votes?reviewIds=id1,id2,id3 - Batch get user votes
 *
 * Credibility:
 * - GET /api/votes/users/:userId/credibility - Get user's credibility stats
 *
 * Features:
 * - Automatic review weighted score updates
 * - Automatic reviewer credibility recalculation
 * - Prevents self-voting on own reviews
 */

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
