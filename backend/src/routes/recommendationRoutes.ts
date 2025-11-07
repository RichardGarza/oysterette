/**
 * Recommendation Routes
 *
 * Provides personalized oyster recommendations based on user preferences.
 *
 * Routes:
 * - GET /api/recommendations - Get personalized recommendations
 *
 * Requirements:
 * - User must be authenticated
 * - User must have at least 1 positive review (LOVE_IT or LIKE_IT)
 *
 * Algorithm:
 * - Analyzes user's highly-rated reviews
 * - Calculates preferred attribute profile
 * - Finds similar oysters via Euclidean distance
 * - Returns top 10 matches with similarity scores
 *
 * Response includes:
 * - Similarity score (0-100)
 * - Match reason (e.g., "Similar size and flavor")
 * - Oyster details with community ratings
 */

import express from 'express';
import { getUserRecommendations } from '../controllers/recommendationController';
import { authenticate } from '../middleware/auth';

const router = express.Router();

// Protected route - requires authentication
router.get('/', authenticate, getUserRecommendations);

export default router;
