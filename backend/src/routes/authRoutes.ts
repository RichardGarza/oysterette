import express from 'express';
import { register, login, getProfile, googleAuth } from '../controllers/authController';
import { authenticate } from '../middleware/auth';
import { validateBody } from '../middleware/validate';
import { registerSchema, loginSchema, googleAuthSchema } from '../validators/schemas';

const router = express.Router();

// Public routes
router.post('/register', validateBody(registerSchema), register);
router.post('/login', validateBody(loginSchema), login);
router.post('/google', validateBody(googleAuthSchema), googleAuth);

// Protected routes
router.get('/profile', authenticate, getProfile);

export default router;
