import express from 'express';
import { getUserRecommendations } from '../controllers/recommendationController';
import { authenticate } from '../middleware/auth';

const router = express.Router();

// Protected route - requires authentication
router.get('/', authenticate, getUserRecommendations);

export default router;
