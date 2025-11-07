/**
 * Authentication Routes
 *
 * Handles user authentication endpoints.
 *
 * Public Routes:
 * - POST /api/auth/register - Create new user account
 * - POST /api/auth/login - Login with email/password
 * - POST /api/auth/google - Login with Google OAuth
 * - POST /api/auth/apple - Login with Apple Sign In
 *
 * Protected Routes:
 * - GET /api/auth/profile - Get current user profile
 *
 * All routes use Zod validation middleware for request data sanitization.
 */

import express from 'express';
import { register, login, getProfile, googleAuth, appleAuth } from '../controllers/authController';
import { authenticate } from '../middleware/auth';
import { validateBody } from '../middleware/validate';
import { registerSchema, loginSchema, googleAuthSchema, appleAuthSchema } from '../validators/schemas';

const router = express.Router();

// Public routes
router.post('/register', validateBody(registerSchema), register);
router.post('/login', validateBody(loginSchema), login);
router.post('/google', validateBody(googleAuthSchema), googleAuth);
router.post('/apple', validateBody(appleAuthSchema), appleAuth);

// Protected routes
router.get('/profile', authenticate, getProfile);

export default router;
