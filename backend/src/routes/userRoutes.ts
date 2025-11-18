/**
 * User Routes
 *
 * Handles user profile, preferences, and account management.
 * All routes require authentication.
 *
 * Profile Management:
 * - GET /api/users/profile - Get comprehensive profile with statistics
 * - PUT /api/users/profile - Update name and email
 *
 * Review History:
 * - GET /api/users/me/reviews - Paginated review history with sorting
 *
 * Account Security:
 * - PUT /api/users/password - Change password (not for OAuth users)
 * - DELETE /api/users/account - Permanent account deletion
 *
 * Privacy Settings:
 * - PUT /api/users/privacy - Update profile visibility settings
 *
 * User Preferences:
 * - PUT /api/users/preferences - Update app preferences (theme, etc.)
 *
 * Top Oysters List:
 * - GET /api/users/top-oysters - Get user's curated top list
 * - POST /api/users/top-oysters - Add oyster to top list
 * - DELETE /api/users/top-oysters/:oysterId - Remove from top list
 */

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
  setFlavorProfile,
  searchUsers,
  setUsername,
} from '../controllers/userController';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import {
  changePasswordSchema,
  deleteAccountSchema,
  updateProfileSchema,
  updatePrivacySettingsSchema,
  reviewQuerySchema,
  usernameSchema,
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

// Flavor profile (for recommendations)
router.put('/flavor-profile', authenticate, setFlavorProfile);

// Search users
router.get('/search', searchUsers);

// Top oysters
router.get('/top-oysters', authenticate, getTopOysters);
router.post('/top-oysters', authenticate, addTopOyster);
router.delete('/top-oysters/:oysterId', authenticate, removeTopOyster);

// New route: PUT /users/username
router.put('/username', authenticate, validate(usernameSchema, 'body'), setUsername);

export default router;
