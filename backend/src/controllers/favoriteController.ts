/**
 * Favorite Controller
 *
 * Handles user favorites operations including:
 * - Fetching user's favorited oysters
 * - Adding oysters to favorites
 * - Removing oysters from favorites
 * - Syncing favorites between mobile and backend
 *
 * Favorites are stored server-side for cross-device synchronization.
 * Mobile app syncs local favorites on app start and after login.
 */

import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import logger from '../utils/logger';

/**
 * Get all favorite oyster IDs for the authenticated user
 *
 * Returns array of oyster IDs ordered by most recently favorited.
 *
 * @route GET /api/favorites
 * @requires Authentication
 * @returns 200 - { favorites: [oysterIds] }
 * @returns 401 - Not authenticated
 * @returns 500 - Server error
 */
export const getUserFavorites = async (req: Request, res: Response) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const favorites = await prisma.favorite.findMany({
      where: { userId },
      select: { oysterId: true },
      orderBy: { createdAt: 'desc' },
    });

    // Return array of oyster IDs
    const oysterIds = favorites.map((f: { oysterId: string }) => f.oysterId);

    logger.info(`Retrieved ${oysterIds.length} favorites for user ${userId}`);
    res.json({ favorites: oysterIds });
  } catch (error: any) {
    logger.error('Error getting favorites:', error);
    res.status(500).json({ error: 'Failed to get favorites' });
  }
};

/**
 * Add an oyster to user's favorites
 * POST /api/favorites/:oysterId
 */
export const addFavorite = async (req: Request, res: Response) => {
  try {
    const userId = req.userId;
    const oysterId = req.params.oysterId as string;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Check if oyster exists
    const oyster = await prisma.oyster.findUnique({
      where: { id: oysterId },
    });

    if (!oyster) {
      return res.status(404).json({ error: 'Oyster not found' });
    }

    // Check if already favorited
    const existingFavorite = await prisma.favorite.findUnique({
      where: {
        userId_oysterId: {
          userId,
          oysterId,
        },
      },
    });

    if (existingFavorite) {
      return res.status(200).json({
        message: 'Already favorited',
        favorite: existingFavorite,
      });
    }

    // Create favorite
    const favorite = await prisma.favorite.create({
      data: {
        userId,
        oysterId,
      },
    });

    logger.info(`User ${userId} favorited oyster ${oysterId}`);
    res.status(201).json({ favorite });
  } catch (error: any) {
    logger.error('Error adding favorite:', error);
    res.status(500).json({ error: 'Failed to add favorite' });
  }
};

/**
 * Remove an oyster from user's favorites
 * DELETE /api/favorites/:oysterId
 */
export const removeFavorite = async (req: Request, res: Response) => {
  try {
    const userId = req.userId;
    const oysterId = req.params.oysterId as string;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Find and delete the favorite
    const favorite = await prisma.favorite.findUnique({
      where: {
        userId_oysterId: {
          userId,
          oysterId,
        },
      },
    });

    if (!favorite) {
      return res.status(404).json({ error: 'Favorite not found' });
    }

    await prisma.favorite.delete({
      where: {
        userId_oysterId: {
          userId,
          oysterId,
        },
      },
    });

    logger.info(`User ${userId} removed favorite ${oysterId}`);
    res.json({ message: 'Favorite removed successfully' });
  } catch (error: any) {
    logger.error('Error removing favorite:', error);
    res.status(500).json({ error: 'Failed to remove favorite' });
  }
};

/**
 * Sync favorites from mobile to backend
 * POST /api/favorites/sync
 * Body: { favorites: ['oyster-id-1', 'oyster-id-2', ...] }
 */
export const syncFavorites = async (req: Request, res: Response) => {
  try {
    const userId = req.userId;
    const { favorites } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!Array.isArray(favorites)) {
      return res.status(400).json({ error: 'Favorites must be an array of oyster IDs' });
    }

    // Get existing favorites
    const existingFavorites = await prisma.favorite.findMany({
      where: { userId },
      select: { oysterId: true },
    });

    const existingIds = new Set(existingFavorites.map((f: { oysterId: string }) => f.oysterId));
    const newIds = new Set(favorites);

    // Find favorites to add (in new list but not in existing)
    const toAdd = favorites.filter((id: string) => !existingIds.has(id));

    // Find favorites to remove (in existing but not in new list)
    const toRemove = existingFavorites
      .map((f: { oysterId: string }) => f.oysterId)
      .filter((id: string) => !newIds.has(id));

    // Add new favorites
    if (toAdd.length > 0) {
      await prisma.favorite.createMany({
        data: toAdd.map(oysterId => ({ userId, oysterId })),
        skipDuplicates: true,
      });
    }

    // Remove old favorites
    if (toRemove.length > 0) {
      await prisma.favorite.deleteMany({
        where: {
          userId,
          oysterId: { in: toRemove },
        },
      });
    }

    logger.info(`Synced favorites for user ${userId}: +${toAdd.length}, -${toRemove.length}`);

    res.json({
      message: 'Favorites synced successfully',
      added: toAdd.length,
      removed: toRemove.length,
      total: favorites.length,
    });
  } catch (error: any) {
    logger.error('Error syncing favorites:', error);
    res.status(500).json({ error: 'Failed to sync favorites' });
  }
};

/**
 * Get a user's public favorite oysters (full Oyster objects, not just IDs)
 * Respects privacy settings - only returns if showFavorites is true
 *
 * @route GET /api/favorites/user/:userId
 * @param userId - User ID to fetch favorites for
 * @returns 200 - { favorites: Oyster[] }
 * @returns 403 - User's favorites are private
 * @returns 404 - User not found
 * @returns 500 - Server error
 */
export const getUserPublicFavorites = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    // Check if user exists and get privacy settings
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { showFavorites: true },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check privacy settings
    if (!user.showFavorites) {
      return res.status(403).json({ error: 'User favorites are private' });
    }

    // Get favorites with full oyster data
    const favorites = await prisma.favorite.findMany({
      where: { userId },
      include: {
        oyster: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const oysters = favorites.map((f) => f.oyster);

    logger.info(`Retrieved ${oysters.length} public favorites for user ${userId}`);
    res.json({ success: true, data: oysters });
  } catch (error: any) {
    logger.error('Error getting public user favorites:', error);
    res.status(500).json({ error: 'Failed to get favorites' });
  }
};
