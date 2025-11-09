/**
 * Friend Controller
 *
 * Handles friend request and friendship management.
 */

import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import logger from '../utils/logger';

/**
 * Send friend request
 *
 * @route POST /api/friends/request
 * @body { receiverId: string }
 */
export const sendFriendRequest = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.userId) {
      res.status(401).json({ success: false, error: 'Not authenticated' });
      return;
    }

    const { receiverId } = req.body;

    if (!receiverId) {
      res.status(400).json({ success: false, error: 'Receiver ID required' });
      return;
    }

    if (receiverId === req.userId) {
      res.status(400).json({ success: false, error: 'Cannot send friend request to yourself' });
      return;
    }

    // Check if receiver exists
    const receiver = await prisma.user.findUnique({ where: { id: receiverId } });
    if (!receiver) {
      res.status(404).json({ success: false, error: 'User not found' });
      return;
    }

    // Check if friendship already exists
    const existing = await prisma.friendship.findFirst({
      where: {
        OR: [
          { senderId: req.userId, receiverId },
          { senderId: receiverId, receiverId: req.userId },
        ],
      },
    });

    if (existing) {
      res.status(400).json({ success: false, error: 'Friend request already exists' });
      return;
    }

    // Create friend request
    const friendship = await prisma.friendship.create({
      data: {
        senderId: req.userId,
        receiverId,
        status: 'pending',
      },
      include: {
        sender: { select: { id: true, name: true, email: true } },
        receiver: { select: { id: true, name: true, email: true } },
      },
    });

    res.status(201).json({ success: true, data: friendship });
  } catch (error) {
    logger.error('Send friend request error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

/**
 * Accept friend request
 *
 * @route PUT /api/friends/accept/:friendshipId
 */
export const acceptFriendRequest = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.userId) {
      res.status(401).json({ success: false, error: 'Not authenticated' });
      return;
    }

    const { friendshipId } = req.params;

    const friendship = await prisma.friendship.findUnique({
      where: { id: friendshipId },
    });

    if (!friendship) {
      res.status(404).json({ success: false, error: 'Friend request not found' });
      return;
    }

    if (friendship.receiverId !== req.userId) {
      res.status(403).json({ success: false, error: 'Not authorized' });
      return;
    }

    if (friendship.status !== 'pending') {
      res.status(400).json({ success: false, error: 'Friend request already processed' });
      return;
    }

    const updated = await prisma.friendship.update({
      where: { id: friendshipId },
      data: { status: 'accepted' },
      include: {
        sender: { select: { id: true, name: true, email: true } },
        receiver: { select: { id: true, name: true, email: true } },
      },
    });

    res.status(200).json({ success: true, data: updated });
  } catch (error) {
    logger.error('Accept friend request error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

/**
 * Reject friend request
 *
 * @route PUT /api/friends/reject/:friendshipId
 */
export const rejectFriendRequest = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.userId) {
      res.status(401).json({ success: false, error: 'Not authenticated' });
      return;
    }

    const { friendshipId } = req.params;

    const friendship = await prisma.friendship.findUnique({
      where: { id: friendshipId },
    });

    if (!friendship) {
      res.status(404).json({ success: false, error: 'Friend request not found' });
      return;
    }

    if (friendship.receiverId !== req.userId) {
      res.status(403).json({ success: false, error: 'Not authorized' });
      return;
    }

    await prisma.friendship.delete({ where: { id: friendshipId } });

    res.status(200).json({ success: true, data: { message: 'Friend request rejected' } });
  } catch (error) {
    logger.error('Reject friend request error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

/**
 * Get friends list
 *
 * @route GET /api/friends
 */
export const getFriends = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.userId) {
      res.status(401).json({ success: false, error: 'Not authenticated' });
      return;
    }

    const friendships = await prisma.friendship.findMany({
      where: {
        status: 'accepted',
        OR: [
          { senderId: req.userId },
          { receiverId: req.userId },
        ],
      },
      include: {
        sender: { select: { id: true, name: true, email: true, profilePhotoUrl: true } },
        receiver: { select: { id: true, name: true, email: true, profilePhotoUrl: true } },
      },
    });

    // Map to friend objects (other person in friendship)
    const friends = friendships.map((f) => {
      const friend = f.senderId === req.userId ? f.receiver : f.sender;
      return {
        id: friend.id,
        name: friend.name,
        email: friend.email,
        profilePhotoUrl: friend.profilePhotoUrl,
        friendshipId: f.id,
        since: f.createdAt,
      };
    });

    res.status(200).json({ success: true, data: friends });
  } catch (error) {
    logger.error('Get friends error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

/**
 * Get pending friend requests
 *
 * @route GET /api/friends/pending
 */
export const getPendingRequests = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.userId) {
      res.status(401).json({ success: false, error: 'Not authenticated' });
      return;
    }

    const sent = await prisma.friendship.findMany({
      where: {
        senderId: req.userId,
        status: 'pending',
      },
      include: {
        receiver: { select: { id: true, name: true, email: true, profilePhotoUrl: true } },
      },
    });

    const received = await prisma.friendship.findMany({
      where: {
        receiverId: req.userId,
        status: 'pending',
      },
      include: {
        sender: { select: { id: true, name: true, email: true, profilePhotoUrl: true } },
      },
    });

    res.status(200).json({
      success: true,
      data: {
        sent: sent.map((f) => ({
          id: f.id,
          user: f.receiver,
          createdAt: f.createdAt,
        })),
        received: received.map((f) => ({
          id: f.id,
          user: f.sender,
          createdAt: f.createdAt,
        })),
      },
    });
  } catch (error) {
    logger.error('Get pending requests error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

/**
 * Get friend activity feed (recent reviews from friends)
 *
 * @route GET /api/friends/activity
 */
export const getFriendActivity = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.userId) {
      res.status(401).json({ success: false, error: 'Not authenticated' });
      return;
    }

    // Get accepted friendships
    const friendships = await prisma.friendship.findMany({
      where: {
        status: 'accepted',
        OR: [
          { senderId: req.userId },
          { receiverId: req.userId },
        ],
      },
    });

    // Extract friend IDs
    const friendIds = friendships.map((f) =>
      f.senderId === req.userId ? f.receiverId : f.senderId
    );

    if (friendIds.length === 0) {
      res.status(200).json({ success: true, data: [] });
      return;
    }

    // Get recent reviews from friends (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const reviews = await prisma.review.findMany({
      where: {
        userId: { in: friendIds },
        createdAt: { gte: thirtyDaysAgo },
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            profilePhotoUrl: true,
          },
        },
        oyster: {
          select: {
            id: true,
            name: true,
            species: true,
            origin: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 50,
    });

    res.status(200).json({ success: true, data: reviews });
  } catch (error) {
    logger.error('Get friend activity error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

/**
 * Get paired recommendations for user and friend
 *
 * @route GET /api/friends/paired/:friendId
 */
export const getPairedRecommendations = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.userId) {
      res.status(401).json({ success: false, error: 'Not authenticated' });
      return;
    }

    const { friendId } = req.params;

    // Verify friendship exists
    const friendship = await prisma.friendship.findFirst({
      where: {
        status: 'accepted',
        OR: [
          { senderId: req.userId, receiverId: friendId },
          { senderId: friendId, receiverId: req.userId },
        ],
      },
    });

    if (!friendship) {
      res.status(403).json({ success: false, error: 'Not friends with this user' });
      return;
    }

    // Get both users' flavor profiles
    const [user, friend] = await Promise.all([
      prisma.user.findUnique({
        where: { id: req.userId },
        select: {
          baselineSize: true,
          baselineBody: true,
          baselineSweetBrininess: true,
          baselineFlavorfulness: true,
          baselineCreaminess: true,
        },
      }),
      prisma.user.findUnique({
        where: { id: friendId },
        select: {
          baselineSize: true,
          baselineBody: true,
          baselineSweetBrininess: true,
          baselineFlavorfulness: true,
          baselineCreaminess: true,
        },
      }),
    ]);

    // Check which user is missing flavor profile
    const userHasProfile = user?.baselineSize !== null;
    const friendHasProfile = friend?.baselineSize !== null;

    if (!userHasProfile && !friendHasProfile) {
      res.status(400).json({ success: false, error: 'both_missing', message: 'Both users need flavor profiles' });
      return;
    }

    if (!userHasProfile) {
      res.status(400).json({ success: false, error: 'user_missing', message: 'You need a flavor profile' });
      return;
    }

    if (!friendHasProfile) {
      res.status(400).json({ success: false, error: 'friend_missing', message: 'Friend needs a flavor profile' });
      return;
    }

    // Get all oysters
    const oysters = await prisma.oyster.findMany({
      select: {
        id: true,
        name: true,
        species: true,
        origin: true,
        avgSize: true,
        avgBody: true,
        avgSweetBrininess: true,
        avgFlavorfulness: true,
        avgCreaminess: true,
      },
    });

    // Calculate match scores for both users
    const pairedMatches = oysters.map((oyster) => {
      const userMatch = calculateMatchScore(user, oyster);
      const friendMatch = calculateMatchScore(friend, oyster);
      const combinedScore = (userMatch + friendMatch) / 2;

      return {
        oyster,
        userMatch,
        friendMatch,
        combinedScore,
      };
    });

    // Filter for high matches (both users >70%) and sort by combined score
    const goodMatches = pairedMatches
      .filter((m) => m.userMatch >= 70 && m.friendMatch >= 70)
      .sort((a, b) => b.combinedScore - a.combinedScore)
      .slice(0, 20);

    res.status(200).json({ success: true, data: goodMatches });
  } catch (error) {
    logger.error('Get paired recommendations error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

/**
 * Helper: Calculate match score between user profile and oyster
 */
function calculateMatchScore(
  profile: {
    baselineSize: number | null;
    baselineBody: number | null;
    baselineSweetBrininess: number | null;
    baselineFlavorfulness: number | null;
    baselineCreaminess: number | null;
  },
  oyster: {
    avgSize: number | null;
    avgBody: number | null;
    avgSweetBrininess: number | null;
    avgFlavorfulness: number | null;
    avgCreaminess: number | null;
  }
): number {
  const matches: number[] = [];

  if (profile.baselineSize && oyster.avgSize) {
    matches.push(1 - Math.abs(profile.baselineSize - oyster.avgSize) / 10);
  }
  if (profile.baselineBody && oyster.avgBody) {
    matches.push(1 - Math.abs(profile.baselineBody - oyster.avgBody) / 10);
  }
  if (profile.baselineSweetBrininess && oyster.avgSweetBrininess) {
    matches.push(1 - Math.abs(profile.baselineSweetBrininess - oyster.avgSweetBrininess) / 10);
  }
  if (profile.baselineFlavorfulness && oyster.avgFlavorfulness) {
    matches.push(1 - Math.abs(profile.baselineFlavorfulness - oyster.avgFlavorfulness) / 10);
  }
  if (profile.baselineCreaminess && oyster.avgCreaminess) {
    matches.push(1 - Math.abs(profile.baselineCreaminess - oyster.avgCreaminess) / 10);
  }

  if (matches.length === 0) return 0;

  const avgMatch = matches.reduce((sum, m) => sum + m, 0) / matches.length;
  return Math.round(avgMatch * 100);
}

/**
 * Remove friend
 *
 * @route DELETE /api/friends/:friendshipId
 */
export const removeFriend = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.userId) {
      res.status(401).json({ success: false, error: 'Not authenticated' });
      return;
    }

    const { friendshipId } = req.params;

    const friendship = await prisma.friendship.findUnique({
      where: { id: friendshipId },
    });

    if (!friendship) {
      res.status(404).json({ success: false, error: 'Friendship not found' });
      return;
    }

    if (friendship.senderId !== req.userId && friendship.receiverId !== req.userId) {
      res.status(403).json({ success: false, error: 'Not authorized' });
      return;
    }

    await prisma.friendship.delete({ where: { id: friendshipId } });

    res.status(200).json({ success: true, data: { message: 'Friend removed' } });
  } catch (error) {
    logger.error('Remove friend error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};
