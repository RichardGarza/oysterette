import express from 'express';
import {
  getTopOysters,
  addTopOyster,
  removeTopOyster,
  updatePreferences,
  updateProfile,
} from '../controllers/userController';
import { authenticate } from '../middleware/auth';

const router = express.Router();

// All user routes require authentication
router.get('/top-oysters', authenticate, getTopOysters);
router.post('/top-oysters', authenticate, addTopOyster);
router.delete('/top-oysters/:oysterId', authenticate, removeTopOyster);
router.put('/preferences', authenticate, updatePreferences);
router.put('/profile', authenticate, updateProfile);

export default router;
