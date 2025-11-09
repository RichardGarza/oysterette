/**
 * XP Routes
 *
 * Handles gamification and achievement endpoints.
 */

import express from 'express';
import { getXPStats, getLeaderboard, getAchievements } from '../controllers/xpController';
import { authenticate } from '../middleware/auth';

const router = express.Router();

// Get user XP stats
router.get('/stats', authenticate, getXPStats);

// Get leaderboard (public)
router.get('/leaderboard', getLeaderboard);

// Get all achievements (public)
router.get('/achievements', getAchievements);

export default router;
