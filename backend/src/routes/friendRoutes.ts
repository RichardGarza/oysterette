/**
 * Friend Routes
 *
 * Handles friend request and friendship management endpoints.
 */

import express from 'express';
import {
  sendFriendRequest,
  acceptFriendRequest,
  rejectFriendRequest,
  getFriends,
  getPendingRequests,
  removeFriend,
} from '../controllers/friendController';
import { authenticate } from '../middleware/auth';

const router = express.Router();

// All friend routes require authentication
router.post('/request', authenticate, sendFriendRequest);
router.put('/accept/:friendshipId', authenticate, acceptFriendRequest);
router.put('/reject/:friendshipId', authenticate, rejectFriendRequest);
router.get('/', authenticate, getFriends);
router.get('/pending', authenticate, getPendingRequests);
router.delete('/:friendshipId', authenticate, removeFriend);

export default router;
