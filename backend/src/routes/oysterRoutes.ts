/**
 * Oyster Routes
 *
 * Handles oyster data endpoints with filtering, sorting, and search.
 *
 * Public Routes (optional authentication for user-specific features):
 * - GET /api/oysters - List all oysters with optional filters/sorting
 * - GET /api/oysters/search - Fuzzy search by name/origin/species
 * - GET /api/oysters/filters - Get unique species and origins for UI
 * - GET /api/oysters/:id - Get single oyster with reviews
 *
 * Protected Routes (require authentication):
 * - POST /api/oysters - Create new oyster
 * - PUT /api/oysters/:id - Update oyster
 * - DELETE /api/oysters/:id - Delete oyster
 *
 * Filtering & Sorting:
 * - Filter by: species, origin
 * - Sort by: rating, name, size, sweetness, creaminess, flavorfulness, body
 */

import express from 'express';
import {
  getAllOysters,
  getOysterById,
  createOyster,
  updateOyster,
  deleteOyster,
  searchOysters,
  getFilterOptions,
} from '../controllers/oysterController';
import { authenticate, optionalAuthenticate } from '../middleware/auth';
import { validateBody, validateParams } from '../middleware/validate';
import {
  createOysterSchema,
  updateOysterSchema,
  uuidParamSchema,
} from '../validators/schemas';

const router = express.Router();

// Public GET routes (optional auth to show user-specific data)
router.get('/', optionalAuthenticate, getAllOysters);
router.get('/search', optionalAuthenticate, searchOysters);
router.get('/filters', getFilterOptions);
router.get('/:id', optionalAuthenticate, validateParams(uuidParamSchema), getOysterById);

// Protected routes (require authentication)
router.post('/', authenticate, validateBody(createOysterSchema), createOyster);
router.put('/:id', authenticate, validateParams(uuidParamSchema), validateBody(updateOysterSchema), updateOyster);
router.delete('/:id', authenticate, validateParams(uuidParamSchema), deleteOyster);

export default router;
