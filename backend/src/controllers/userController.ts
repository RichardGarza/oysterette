/**
 * User Controller
 *
 * Handles user profile and account operations including:
 * - Top oysters list management
 * - User preferences updates
 * - Profile information management
 * - Profile statistics and analytics
 * - Review history pagination
 * - Password changes
 * - Account deletion
 * - Privacy settings management
 */

import { Request, Response } from 'express';
import logger from '../utils/logger';
import prisma from '../lib/prisma';
import { hashPassword, comparePassword } from '../utils/auth';
import { setBaselineProfile } from '../services/recommendationService';
import { z } from 'zod';
import { updateProfileSchema } from '../validators/schemas'; // Assume schema updated

// Add new schema for username (inline or import)
const usernameSchema = z.object({
  username: z.string().regex(/^[a-zA-Z0-9]{3,20}$/, 'Username must be 3-20 alphanumeric characters').optional(),
});

/**
 * Get user's top oysters list
 *
 * @route GET /api/users/top-oysters
 * @requires Authentication
 * @returns 200 - Array of top oysters ordered by rank
 * @returns 401 - Not authenticated
 * @returns 500 - Server error
 */
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

/**
 * Add an oyster to user's top list
 *
 * @route POST /api/users/top-oysters
 * @requires Authentication
 * @param req.body.oysterId - Oyster UUID to add
 * @param req.body.rank - Position in list (optional, defaults to last)
 * @returns 201 - Added oyster with rank
 * @returns 400 - Invalid oyster or already in list
 * @returns 401 - Not authenticated
 * @returns 404 - Oyster not found
 * @returns 500 - Server error
 */
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

// Enhanced updateProfile to handle username
export const updateProfile = async (req: Request, res: Response) => {
  try {
    const { name, email, profilePhotoUrl, username } = req.body;

    // Validate username if provided
    if (username !== undefined) {
      const validation = usernameSchema.safeParse({ username });
      if (!validation.success) {
        return res.status(400).json({ error: validation.error.issues[0]?.message || 'Validation error' });
      }

      // Check uniqueness (exclude current user)
      const existingUser = await prisma.user.findUnique({
        where: { username },
      });

      if (existingUser && existingUser.id !== req.userId) {
        return res.status(409).json({ error: 'Username already taken' });
      }
    }

    // Update user (username included if provided)
    const updatedUser = await prisma.user.update({
      where: { id: req.userId },
      data: {
        name: name || undefined,
        email: email || undefined,
        profilePhotoUrl,
        username, // Update if provided
      },
    });

    res.json({ data: updatedUser });
  } catch (error) {
    console.error('❌ [userController] Error updating profile:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
};

// New endpoint: PUT /users/username
export const setUsername = async (req: Request, res: Response) => {
  try {
    const { username } = req.body;

    if (!username) {
      return res.status(400).json({ error: 'Username is required' });
    }

    const validation = usernameSchema.safeParse({ username });
    if (!validation.success) {
      return res.status(400).json({ error: validation.error.issues[0]?.message || 'Validation error' });
    }

    // Check uniqueness
    const existingUser = await prisma.user.findUnique({
      where: { username },
    });

    if (existingUser && existingUser.id !== req.userId) {
      return res.status(409).json({ error: 'Username already taken' });
    }

    // Update
    const user = await prisma.user.update({
      where: { id: req.userId },
      data: { username },
    });

    res.json({ data: user });
  } catch (error) {
    console.error('❌ [userController] Error setting username:', error);
    res.status(500).json({ error: 'Failed to set username' });
  }
};

/**
 * Get comprehensive user profile with statistics
 *
 * Calculates and returns rich profile analytics including:
 * - Total reviews, favorites, votes given/received
 * - Average rating given
 * - Credibility score and badge level (Novice/Trusted/Expert)
 * - Most reviewed species and origin
 * - Review streak (active if reviewed in last 7 days)
 * - Membership duration
 *
 * Badge Levels:
 * - Expert: 50+ reviews AND credibility ≥ 1.5
 * - Trusted: 10-49 reviews AND credibility ≥ 1.0
 * - Novice: 0-9 reviews OR credibility < 1.0
 *
 * @route GET /api/users/profile
 * @requires Authentication
 * @returns 200 - User object with stats object
 * @returns 401 - Not authenticated
 * @returns 404 - User not found
 * @returns 500 - Server error
 */
export const getProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.userId) {
      res.status(401).json({
        success: false,
        error: 'Not authenticated',
      });
      return;
    }

    // Fetch user with aggregated stats
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      include: {
        _count: {
          select: {
            reviews: true,
            favorites: true,
            votesGiven: true,
          },
        },
        reviews: {
          select: {
            rating: true,
            createdAt: true,
            oyster: {
              select: {
                species: true,
                origin: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      res.status(404).json({
        success: false,
        error: 'User not found',
      });
      return;
    }

    // Calculate stats
    let avgRatingGiven = 0;

    if (user.reviews.length > 0) {
      const ratingValues: Record<string, number> = {
        LOVE_IT: 4,   // Best
        LIKE_IT: 3,   // Good
        OKAY: 2,      // Okay
        MEH: 1,       // Worst
      };
      const totalRating = user.reviews.reduce((sum: number, review: any) => sum + (ratingValues[review.rating] || 0), 0);
      avgRatingGiven = totalRating / user.reviews.length;
    }

    // Find most reviewed species and origin
    const speciesCounts = user.reviews.reduce((acc: Record<string, number>, review: any) => {
      if (review.oyster.species) {
        acc[review.oyster.species] = (acc[review.oyster.species] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    const originCounts = user.reviews.reduce((acc: Record<string, number>, review: any) => {
      if (review.oyster.origin) {
        acc[review.oyster.origin] = (acc[review.oyster.origin] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    const mostReviewedSpecies = Object.keys(speciesCounts).length > 0
      ? (Object.entries(speciesCounts) as [string, number][]).sort((a, b) => b[1] - a[1])[0]?.[0]
      : undefined;

    const mostReviewedOrigin = Object.keys(originCounts).length > 0
      ? (Object.entries(originCounts) as [string, number][]).sort((a, b) => b[1] - a[1])[0]?.[0]
      : undefined;

    // Determine badge level (based on review count AND credibility)
    let badgeLevel: 'Novice' | 'Trusted' | 'Expert' = 'Novice';
    const reviewCount = user._count.reviews;

    if (reviewCount >= 50 && user.credibilityScore >= 1.5) {
      badgeLevel = 'Expert';
    } else if (reviewCount >= 10 && user.credibilityScore >= 1.0) {
      badgeLevel = 'Trusted';
    }

    // Calculate review streak (simplified - just days since last review)
    let reviewStreak = 0;
    if (user.reviews.length > 0) {
      const sortedReviews = user.reviews.sort((a: any, b: any) => b.createdAt.getTime() - a.createdAt.getTime());
      const lastReview = sortedReviews[0];
      if (lastReview) {
        const daysSinceLastReview = Math.floor((Date.now() - lastReview.createdAt.getTime()) / (1000 * 60 * 60 * 24));
        reviewStreak = daysSinceLastReview <= 7 ? user.reviews.length : 0;
      }
    }

    // Calculate friends count
    const friendsCount = await prisma.friendship.count({
      where: {
        status: 'accepted',
        OR: [
          { senderId: req.userId },
          { receiverId: req.userId },
        ],
      },
    });

    const stats = {
      totalReviews: user._count.reviews,
      totalFavorites: user._count.favorites,
      avgRatingGiven,
      credibilityScore: user.credibilityScore,
      badgeLevel,
      reviewStreak,
      mostReviewedSpecies,
      mostReviewedOrigin,
      memberSince: user.createdAt.toISOString(),
      totalVotesGiven: user._count.votesGiven,
      totalVotesReceived: user.totalAgrees + user.totalDisagrees,
      friendsCount, // Added friends count
    };

    res.status(200).json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          username: user.username, // Include username
          profilePhotoUrl: user.profilePhotoUrl,
          credibilityScore: user.credibilityScore,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        },
        stats,
      },
    });
  } catch (error: any) {
    logger.error('Get profile error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

// Get user's review history
export const getMyReviews = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.userId) {
      res.status(401).json({
        success: false,
        error: 'Not authenticated',
      });
      return;
    }

    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const sortBy = (req.query.sortBy as string) || 'createdAt';

    const skip = (page - 1) * limit;

    // Build orderBy
    const orderBy: any = {};
    if (sortBy === 'createdAt') {
      orderBy.createdAt = 'desc';
    } else if (sortBy === 'rating') {
      orderBy.rating = 'desc';
    }

    const reviews = await prisma.review.findMany({
      where: { userId: req.userId },
      include: {
        oyster: {
          select: {
            id: true,
            name: true,
            species: true,
            origin: true,
            avgRating: true,
            overallScore: true,
          },
        },
        _count: {
          select: { votes: true },
        },
      },
      orderBy,
      skip,
      take: limit,
    });

    const total = await prisma.review.count({ where: { userId: req.userId } });

    res.status(200).json({
      success: true,
      data: {
        reviews,
        total,
        page,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    logger.error('Get my reviews error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error',
    });
  }
};

/**
 * Change user password
 *
 * Verifies current password before allowing change.
 * OAuth users (Google Sign-In) cannot change password.
 *
 * @route PUT /api/users/password
 * @requires Authentication
 * @param req.body.currentPassword - Current password for verification
 * @param req.body.newPassword - New password (validated by Zod)
 * @returns 200 - Success message
 * @returns 400 - OAuth user attempted password change
 * @returns 401 - Current password incorrect or not authenticated
 * @returns 404 - User not found
 * @returns 500 - Server error
 */
export const changePassword = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.userId) {
      res.status(401).json({
        success: false,
        error: 'Not authenticated',
      });
      return;
    }

    const { currentPassword, newPassword } = req.body;

    // Fetch user with password
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
    });

    if (!user) {
      res.status(404).json({
        success: false,
        error: 'User not found',
      });
      return;
    }

    // Check if user has a password (OAuth users may not)
    if (!user.password) {
      res.status(400).json({
        success: false,
        error: 'Google OAuth users cannot change password',
      });
      return;
    }

    // Verify current password
    const isValid = await comparePassword(currentPassword, user.password);
    if (!isValid) {
      res.status(401).json({
        success: false,
        error: 'Current password is incorrect',
      });
      return;
    }

    // Hash new password
    const hashedPassword = await hashPassword(newPassword);

    // Update password
    await prisma.user.update({
      where: { id: req.userId },
      data: { password: hashedPassword },
    });

    // Log password change
    logger.info(`Password changed for user ${req.userId} (${user.email})`);

    res.status(200).json({
      success: true,
      data: { message: 'Password changed successfully' },
    });
  } catch (error) {
    logger.error('Change password error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error',
    });
  }
};

/**
 * Delete user account permanently
 *
 * Requires password verification (for non-OAuth users) and explicit confirmation text.
 * Cascade deletes all user data: reviews, votes, favorites, and top oysters.
 * This action is irreversible.
 *
 * @route DELETE /api/users/account
 * @requires Authentication
 * @param req.body.password - User password for verification (optional for OAuth users)
 * @param req.body.confirmText - Must be exactly "DELETE MY ACCOUNT"
 * @returns 200 - Success confirmation
 * @returns 400 - Invalid confirmation text
 * @returns 401 - Incorrect password or not authenticated
 * @returns 404 - User not found
 * @returns 500 - Server error
 */
export const deleteAccount = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.userId) {
      res.status(401).json({
        success: false,
        error: 'Not authenticated',
      });
      return;
    }

    const { password, confirmText } = req.body;

    // Fetch user
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
    });

    if (!user) {
      res.status(404).json({
        success: false,
        error: 'User not found',
      });
      return;
    }

    // Verify password if user has one (OAuth users may not)
    if (user.password && password) {
      const isValid = await comparePassword(password, user.password);
      if (!isValid) {
        res.status(401).json({
          success: false,
          error: 'Incorrect password',
        });
        return;
      }
    }

    // Verify confirmation text
    if (confirmText !== 'DELETE MY ACCOUNT') {
      res.status(400).json({
        success: false,
        error: 'Confirmation text does not match. Please type "DELETE MY ACCOUNT"',
      });
      return;
    }

    // Delete user (Prisma will cascade delete reviews, votes, favorites, topOysters)
    await prisma.user.delete({
      where: { id: req.userId },
    });

    // Log deletion
    logger.warn(`Account deleted: ${user.email} (${req.userId})`);

    res.status(200).json({
      success: true,
      data: { message: 'Account deleted successfully' },
    });
  } catch (error) {
    logger.error('Delete account error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error',
    });
  }
};

/**
 * Update user privacy settings
 *
 * Controls what information is visible on user's public profile.
 *
 * @route PUT /api/users/privacy
 * @requires Authentication
 * @param req.body.profileVisibility - "public" | "friends" | "private"
 * @param req.body.showReviewHistory - Show reviews on profile (boolean)
 * @param req.body.showFavorites - Show favorites on profile (boolean)
 * @param req.body.showStatistics - Show stats and badge on profile (boolean)
 * @returns 200 - Updated privacy settings
 * @returns 401 - Not authenticated
 * @returns 500 - Server error
 */
export const updatePrivacySettings = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.userId) {
      res.status(401).json({
        success: false,
        error: 'Not authenticated',
      });
      return;
    }

    const { profileVisibility, showReviewHistory, showFavorites, showStatistics } = req.body;

    const updateData: any = {};
    if (profileVisibility !== undefined) updateData.profileVisibility = profileVisibility;
    if (showReviewHistory !== undefined) updateData.showReviewHistory = showReviewHistory;
    if (showFavorites !== undefined) updateData.showFavorites = showFavorites;
    if (showStatistics !== undefined) updateData.showStatistics = showStatistics;

    const user = await prisma.user.update({
      where: { id: req.userId },
      data: updateData,
      select: {
        id: true,
        profileVisibility: true,
        showReviewHistory: true,
        showFavorites: true,
        showStatistics: true,
      },
    });

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    logger.error('Update privacy settings error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error',
    });
  }
};

/**
 * Set user's baseline flavor profile
 *
 * Allows users to set their ideal oyster attributes before reviewing.
 * Used for personalized recommendations.
 *
 * @route PUT /api/users/flavor-profile
 * @requires Authentication
 * @param req.body.size - Preferred size (1-10)
 * @param req.body.body - Preferred body (1-10)
 * @param req.body.sweetBrininess - Preferred sweetness/brininess (1-10)
 * @param req.body.flavorfulness - Preferred flavorfulness (1-10)
 * @param req.body.creaminess - Preferred creaminess (1-10)
 * @returns 200 - Success message
 * @returns 400 - Invalid attributes
 * @returns 401 - Not authenticated
 * @returns 500 - Server error
 */
export const searchUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    const { q } = req.query;
    if (!q || typeof q !== 'string') {
      res.status(400).json({ success: false, error: 'Search query required' });
      return;
    }

    const searchTerm = q.trim();
    if (searchTerm.length < 2) {
      res.status(400).json({ success: false, error: 'Query too short' });
      return;
    }

    const users = await prisma.user.findMany({
      where: {
        OR: [
          { name: { contains: searchTerm, mode: 'insensitive' } },
          { email: { contains: searchTerm, mode: 'insensitive' } },
          { username: { contains: searchTerm, mode: 'insensitive' } },
        ],
      },
      select: {
        id: true,
        name: true,
        email: true,
      },
      take: 20,
    });

    res.status(200).json({ success: true, data: users });
  } catch (error) {
    logger.error('Search users error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

export const setFlavorProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.userId) {
      res.status(401).json({
        success: false,
        error: 'Not authenticated',
      });
      return;
    }

    const { size, body, sweetBrininess, flavorfulness, creaminess } = req.body;

    // Validate all attributes are provided and in range 1-10
    if (
      size === undefined ||
      body === undefined ||
      sweetBrininess === undefined ||
      flavorfulness === undefined ||
      creaminess === undefined
    ) {
      res.status(400).json({
        success: false,
        error: 'All flavor attributes are required',
      });
      return;
    }

    // Validate range
    const attributes = [size, body, sweetBrininess, flavorfulness, creaminess];
    const allValid = attributes.every(
      (attr) => typeof attr === 'number' && attr >= 1 && attr <= 10
    );

    if (!allValid) {
      res.status(400).json({
        success: false,
        error: 'All attributes must be numbers between 1 and 10',
      });
      return;
    }

    // Set baseline profile
    await setBaselineProfile(req.userId, {
      size,
      body,
      sweetBrininess,
      flavorfulness,
      creaminess,
    });

    res.status(200).json({
      success: true,
      data: { message: 'Flavor profile set successfully' },
    });
  } catch (error) {
    logger.error('Set flavor profile error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error',
    });
  }
};
