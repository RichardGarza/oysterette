import { Request, Response } from 'express';
import logger from '../utils/logger';
import { getRecommendations } from '../services/recommendationService';

/**
 * Get personalized oyster recommendations for the authenticated user
 */
export const getUserRecommendations = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.userId) {
      res.status(401).json({
        success: false,
        error: 'Not authenticated',
      });
      return;
    }

    // Get limit from query params (default 10, max 50)
    const limit = Math.min(parseInt(req.query.limit as string) || 10, 50);

    const recommendations = await getRecommendations(req.userId, limit);

    res.status(200).json({
      success: true,
      data: recommendations,
      meta: {
        count: recommendations.length,
        hasRecommendations: recommendations.length > 0,
      },
    });
  } catch (error) {
    logger.error('Get recommendations error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error',
    });
  }
};
