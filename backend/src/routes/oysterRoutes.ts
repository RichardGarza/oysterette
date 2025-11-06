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
