import express from 'express';
import {
  getTopOysters,
  addTopOyster,
  removeTopOyster,
  updatePreferences,
  updateProfile,
  getProfile,
  getMyReviews,
  changePassword,
  deleteAccount,
  updatePrivacySettings,
} from '../controllers/userController';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import {
  changePasswordSchema,
  deleteAccountSchema,
  updateProfileSchema,
  updatePrivacySettingsSchema,
  reviewQuerySchema,
} from '../validators/schemas';

const router = express.Router();

// All user routes require authentication

// Profile routes
router.get('/profile', authenticate, getProfile);
router.put('/profile', authenticate, validate(updateProfileSchema, 'body'), updateProfile);

// Review history
router.get('/me/reviews', authenticate, validate(reviewQuerySchema, 'query'), getMyReviews);

// Password management
router.put('/password', authenticate, validate(changePasswordSchema, 'body'), changePassword);

// Account deletion
router.delete('/account', authenticate, validate(deleteAccountSchema, 'body'), deleteAccount);

// Privacy settings
router.put('/privacy', authenticate, validate(updatePrivacySettingsSchema, 'body'), updatePrivacySettings);

// Preferences
router.put('/preferences', authenticate, updatePreferences);

// Top oysters
router.get('/top-oysters', authenticate, getTopOysters);
router.post('/top-oysters', authenticate, addTopOyster);
router.delete('/top-oysters/:oysterId', authenticate, removeTopOyster);

export default router;
