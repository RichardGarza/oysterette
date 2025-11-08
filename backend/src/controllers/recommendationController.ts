import { Request, Response } from 'express';
import logger from '../utils/logger';
import {
  getRecommendations,
  getCollaborativeRecommendations,
  getHybridRecommendations,
  findSimilarUsers,
} from '../services/recommendationService';

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

/**
 * Get collaborative filtering recommendations
 */
export const getCollaborativeRecommendationsHandler = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    if (!req.userId) {
      res.status(401).json({
        success: false,
        error: 'Not authenticated',
      });
      return;
    }

    const limit = Math.min(parseInt(req.query.limit as string) || 10, 50);
    const recommendations = await getCollaborativeRecommendations(req.userId, limit);

    res.status(200).json({
      success: true,
      data: recommendations,
      meta: {
        count: recommendations.length,
        type: 'collaborative',
      },
    });
  } catch (error) {
    logger.error('Get collaborative recommendations error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error',
    });
  }
};

/**
 * Get hybrid recommendations (attribute + collaborative)
 */
export const getHybridRecommendationsHandler = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    if (!req.userId) {
      res.status(401).json({
        success: false,
        error: 'Not authenticated',
      });
      return;
    }

    const limit = Math.min(parseInt(req.query.limit as string) || 10, 50);
    const recommendations = await getHybridRecommendations(req.userId, limit);

    res.status(200).json({
      success: true,
      data: recommendations,
      meta: {
        count: recommendations.length,
        type: 'hybrid',
      },
    });
  } catch (error) {
    logger.error('Get hybrid recommendations error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error',
    });
  }
};

/**
 * Get similar users based on review patterns
 */
export const getSimilarUsersHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.userId) {
      res.status(401).json({
        success: false,
        error: 'Not authenticated',
      });
      return;
    }

    const limit = Math.min(parseInt(req.query.limit as string) || 10, 20);
    const similarUsers = await findSimilarUsers(req.userId, limit);

    res.status(200).json({
      success: true,
      data: similarUsers,
      meta: {
        count: similarUsers.length,
      },
    });
  } catch (error) {
    logger.error('Get similar users error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error',
    });
  }
};
