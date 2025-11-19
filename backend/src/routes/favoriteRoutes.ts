/**
 * Favorite Routes
 *
 * Handles user favorites with cross-device synchronization.
 * All routes require authentication.
 *
 * Routes:
 * - GET /api/favorites - Get user's favorited oyster IDs
 * - POST /api/favorites/:oysterId - Add oyster to favorites
 * - DELETE /api/favorites/:oysterId - Remove oyster from favorites
 * - POST /api/favorites/sync - Sync favorites from mobile app
 *
 * Sync Behavior:
 * - Mobile app sends full favorites list
 * - Server calculates diff (additions & removals)
 * - Returns sync summary (added/removed/total counts)
 * - Enables cross-device favorites synchronization
 */

import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  getUserFavorites,
  addFavorite,
  removeFavorite,
  syncFavorites,
  getUserPublicFavorites,
} from '../controllers/favoriteController';

const router = Router();

// Public route (no auth required) - must be before authenticate middleware
// GET /api/favorites/user/:userId - Get a user's public favorite oysters
router.get('/user/:userId', getUserPublicFavorites);

// All routes below require authentication
router.use(authenticate);

// GET /api/favorites - Get user's favorite oyster IDs
router.get('/', getUserFavorites);

// POST /api/favorites/sync - Sync favorites from mobile
router.post('/sync', syncFavorites);

// POST /api/favorites/:oysterId - Add favorite
router.post('/:oysterId', addFavorite);

// DELETE /api/favorites/:oysterId - Remove favorite
router.delete('/:oysterId', removeFavorite);

export default router;
