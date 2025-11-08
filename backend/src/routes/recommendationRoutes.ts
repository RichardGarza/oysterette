/**
 * Recommendation Routes
 *
 * Provides personalized oyster recommendations using multiple algorithms.
 *
 * Routes:
 * - GET /api/recommendations - Attribute-based recommendations (default)
 * - GET /api/recommendations/collaborative - Collaborative filtering
 * - GET /api/recommendations/hybrid - Hybrid approach (60% attribute + 40% collaborative)
 * - GET /api/recommendations/similar-users - Find users with similar taste
 *
 * Requirements:
 * - User must be authenticated
 * - Collaborative filtering requires 3+ reviews
 *
 * Algorithms:
 * 1. Attribute-based: Euclidean distance on flavor profile
 * 2. Collaborative: Cosine similarity on review patterns
 * 3. Hybrid: Weighted combination of both
 */

import express from 'express';
import {
  getUserRecommendations,
  getCollaborativeRecommendationsHandler,
  getHybridRecommendationsHandler,
  getSimilarUsersHandler,
} from '../controllers/recommendationController';
import { authenticate } from '../middleware/auth';

const router = express.Router();

// Protected routes - all require authentication
router.get('/', authenticate, getUserRecommendations);
router.get('/collaborative', authenticate, getCollaborativeRecommendationsHandler);
router.get('/hybrid', authenticate, getHybridRecommendationsHandler);
router.get('/similar-users', authenticate, getSimilarUsersHandler);

export default router;
