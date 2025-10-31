import express from 'express';
import * as voteController from '../controllers/voteController';
import { authenticate } from '../middleware/auth';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Vote on a review
router.post('/reviews/:reviewId/vote', voteController.voteOnReview);

// Remove vote from a review
router.delete('/reviews/:reviewId/vote', voteController.removeVote);

// Get user's votes for multiple reviews
router.get('/reviews/votes', voteController.getUserVotes);

// Get user credibility info
router.get('/users/:userId/credibility', voteController.getUserCredibility);

export default router;
