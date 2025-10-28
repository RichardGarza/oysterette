import express from 'express';
import {
  getAllOysters,
  getOysterById,
  createOyster,
  updateOyster,
  deleteOyster,
  searchOysters,
} from '../controllers/oysterController';
import { authenticate, optionalAuthenticate } from '../middleware/auth';

const router = express.Router();

// Public GET routes (optional auth to show user-specific data)
router.get('/', optionalAuthenticate, getAllOysters);
router.get('/search', optionalAuthenticate, searchOysters);
router.get('/:id', optionalAuthenticate, getOysterById);

// Protected routes (require authentication)
router.post('/', authenticate, createOyster);
router.put('/:id', authenticate, updateOyster);
router.delete('/:id', authenticate, deleteOyster);

export default router;
