/**
 * XP Controller
 *
 * Handles XP, achievements, and gamification endpoints.
 */

import { Request, Response } from 'express';
import { getUserXPStats } from '../services/xpService';
import prisma from '../lib/prisma';
import logger from '../utils/logger';

/**
 * Get user XP stats
 *
 * @route GET /api/xp/stats
 */
export const getXPStats = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.userId) {
      res.status(401).json({ success: false, error: 'Not authenticated' });
      return;
    }

    const stats = await getUserXPStats(req.userId);
    res.status(200).json({ success: true, data: stats });
  } catch (error) {
    logger.error('Get XP stats error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

/**
 * Get leaderboard
 *
 * @route GET /api/xp/leaderboard
 */
export const getLeaderboard = async (req: Request, res: Response): Promise<void> => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;

    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        profilePhotoUrl: true,
        xp: true,
        level: true,
      },
      orderBy: { xp: 'desc' },
      take: limit,
    });

    res.status(200).json({ success: true, data: users });
  } catch (error) {
    logger.error('Get leaderboard error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

/**
 * Get all available achievements
 *
 * @route GET /api/xp/achievements
 */
export const getAchievements = async (req: Request, res: Response): Promise<void> => {
  try {
    const achievements = await prisma.achievement.findMany({
      orderBy: { xpReward: 'asc' },
    });

    res.status(200).json({ success: true, data: achievements });
  } catch (error) {
    logger.error('Get achievements error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};
