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
