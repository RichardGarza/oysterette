import { Request, Response } from 'express';
import logger from '../utils/logger';
import prisma from '../lib/prisma';

// Get user's top oysters
export const getTopOysters = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.userId) {
      res.status(401).json({
        success: false,
        error: 'Not authenticated',
      });
      return;
    }

    const topOysters = await prisma.userTopOyster.findMany({
      where: { userId: req.userId },
      include: {
        oyster: true,
      },
      orderBy: { rank: 'asc' },
    });

    res.status(200).json({
      success: true,
      count: topOysters.length,
      data: topOysters,
    });
  } catch (error) {
    logger.error('Get top oysters error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error',
    });
  }
};

// Add oyster to top list
export const addTopOyster = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.userId) {
      res.status(401).json({
        success: false,
        error: 'Not authenticated',
      });
      return;
    }

    const { oysterId, rank } = req.body;

    if (!oysterId) {
      res.status(400).json({
        success: false,
        error: 'Oyster ID is required',
      });
      return;
    }

    // Check if oyster exists
    const oyster = await prisma.oyster.findUnique({
      where: { id: oysterId },
    });

    if (!oyster) {
      res.status(404).json({
        success: false,
        error: 'Oyster not found',
      });
      return;
    }

    // Check if already in top list
    const existing = await prisma.userTopOyster.findUnique({
      where: {
        userId_oysterId: {
          userId: req.userId,
          oysterId,
        },
      },
    });

    if (existing) {
      res.status(400).json({
        success: false,
        error: 'Oyster already in your top list',
      });
      return;
    }

    // Get current count to determine rank
    const count = await prisma.userTopOyster.count({
      where: { userId: req.userId },
    });

    const topOyster = await prisma.userTopOyster.create({
      data: {
        userId: req.userId,
        oysterId,
        rank: rank || count + 1,
      },
      include: {
        oyster: true,
      },
    });

    res.status(201).json({
      success: true,
      data: topOyster,
    });
  } catch (error) {
    logger.error('Add top oyster error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error',
    });
  }
};

// Remove oyster from top list
export const removeTopOyster = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.userId) {
      res.status(401).json({
        success: false,
        error: 'Not authenticated',
      });
      return;
    }

    const { oysterId } = req.params;

    const deleted = await prisma.userTopOyster.deleteMany({
      where: {
        userId: req.userId,
        oysterId,
      },
    });

    if (deleted.count === 0) {
      res.status(404).json({
        success: false,
        error: 'Oyster not in your top list',
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: {},
    });
  } catch (error) {
    logger.error('Remove top oyster error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error',
    });
  }
};

// Update user preferences
export const updatePreferences = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.userId) {
      res.status(401).json({
        success: false,
        error: 'Not authenticated',
      });
      return;
    }

    const { preferences } = req.body;

    const user = await prisma.user.update({
      where: { id: req.userId },
      data: { preferences },
      select: {
        id: true,
        email: true,
        name: true,
        preferences: true,
      },
    });

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    logger.error('Update preferences error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error',
    });
  }
};

// Update user profile
export const updateProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.userId) {
      res.status(401).json({
        success: false,
        error: 'Not authenticated',
      });
      return;
    }

    const { name, email } = req.body;
    const updateData: any = {};

    if (name) updateData.name = name;
    if (email) {
      // Check if email is already taken
      const existing = await prisma.user.findUnique({
        where: { email },
      });

      if (existing && existing.id !== req.userId) {
        res.status(400).json({
          success: false,
          error: 'Email already in use',
        });
        return;
      }

      updateData.email = email;
    }

    const user = await prisma.user.update({
      where: { id: req.userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        preferences: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    logger.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error',
    });
  }
};
