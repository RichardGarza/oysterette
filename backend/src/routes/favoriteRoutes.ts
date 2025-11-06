import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  getUserFavorites,
  addFavorite,
  removeFavorite,
  syncFavorites,
} from '../controllers/favoriteController';

const router = Router();

// All routes require authentication
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
