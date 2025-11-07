/**
 * Authentication Controller
 *
 * Handles user authentication operations including:
 * - User registration with email/password
 * - User login with credential verification
 * - Google OAuth authentication
 * - Profile retrieval for authenticated users
 */

import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { hashPassword, comparePassword, generateToken } from '../utils/auth';
import logger from '../utils/logger';
import { OAuth2Client } from 'google-auth-library';

/**
 * Register a new user with email and password
 *
 * @route POST /api/auth/register
 * @param req.body.email - User's email address (validated by Zod)
 * @param req.body.name - User's display name
 * @param req.body.password - Plain text password (will be hashed)
 * @returns 201 - User object and JWT token
 * @returns 400 - Email already exists
 * @returns 500 - Server error
 */
export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, name, password } = req.body;
    // Validation handled by Zod middleware

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      res.status(400).json({
        success: false,
        error: 'User with this email already exists',
      });
      return;
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        name,
        password: hashedPassword,
      },
      select: {
        id: true,
        email: true,
        name: true,
        preferences: true,
        createdAt: true,
      },
    });

    // Generate token
    const token = generateToken(user.id);

    res.status(201).json({
      success: true,
      data: {
        user,
        token,
      },
    });
  } catch (error) {
    logger.error('Registration error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error during registration',
    });
  }
};

/**
 * Authenticate user with email and password
 *
 * @route POST /api/auth/login
 * @param req.body.email - User's email address
 * @param req.body.password - Plain text password
 * @returns 200 - User object and JWT token
 * @returns 401 - Invalid credentials (email not found or password mismatch)
 * @returns 500 - Server error
 */
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;
    // Validation handled by Zod middleware

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      res.status(401).json({
        success: false,
        error: 'Invalid credentials',
      });
      return;
    }

    // Verify password
    const isValidPassword = await comparePassword(password, user.password);

    if (!isValidPassword) {
      res.status(401).json({
        success: false,
        error: 'Invalid credentials',
      });
      return;
    }

    // Generate token
    const token = generateToken(user.id);

    res.status(200).json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          preferences: user.preferences,
          createdAt: user.createdAt,
        },
        token,
      },
    });
  } catch (error) {
    logger.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error during login',
    });
  }
};

/**
 * Get authenticated user's profile
 *
 * @route GET /api/auth/profile
 * @requires Authentication - JWT token in Authorization header
 * @returns 200 - User profile (id, email, name, preferences, timestamps)
 * @returns 401 - Not authenticated
 * @returns 404 - User not found
 * @returns 500 - Server error
 */
export const getProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.userId) {
      res.status(401).json({
        success: false,
        error: 'Not authenticated',
      });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: {
        id: true,
        email: true,
        name: true,
        preferences: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      res.status(404).json({
        success: false,
        error: 'User not found',
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    logger.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error',
    });
  }
};

/**
 * Authenticate user with Google OAuth
 *
 * Verifies Google ID token from mobile app (Google Sign-In SDK) and either:
 * - Creates a new user if email doesn't exist
 * - Logs in existing user if email is found
 *
 * OAuth users have empty password field and cannot use password login.
 * Profile photo from Google is stored in preferences.profilePhoto.
 *
 * @route POST /api/auth/google
 * @param req.body.idToken - Google ID token from native Google Sign-In SDK
 * @returns 200 - User object and JWT token
 * @returns 400 - Missing or invalid token
 * @returns 401 - Token verification failed
 * @returns 500 - Server error
 */
export const googleAuth = async (req: Request, res: Response): Promise<void> => {
  try {
    const { idToken } = req.body;

    if (!idToken) {
      res.status(400).json({
        success: false,
        error: 'Google ID token is required',
      });
      return;
    }

    // Initialize Google OAuth client
    const client = new OAuth2Client();

    // Verify the Google ID token
    let ticket;
    try {
      ticket = await client.verifyIdToken({
        idToken,
        // No audience check needed for Expo apps (they use Google's native auth)
      });
    } catch (error) {
      logger.error('Google token verification failed:', error);
      res.status(401).json({
        success: false,
        error: 'Invalid Google token',
      });
      return;
    }

    const payload = ticket.getPayload();

    if (!payload || !payload.email) {
      res.status(400).json({
        success: false,
        error: 'Invalid token payload',
      });
      return;
    }

    const { email, name, picture } = payload;
    const googleId = payload.sub; // Google's unique user ID

    // Check if user already exists
    let user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        preferences: true,
        createdAt: true,
      },
    });

    // If user doesn't exist, create new user
    if (!user) {
      const userName: string = name ?? (email.split('@')[0] || 'User'); // Use email prefix if no name
      user = await prisma.user.create({
        data: {
          email,
          name: userName,
          password: '', // OAuth users don't need a password
          preferences: picture ? { profilePhoto: picture } : {},
        },
        select: {
          id: true,
          email: true,
          name: true,
          preferences: true,
          createdAt: true,
        },
      });
      logger.info(`New user created via Google OAuth: ${email}`);
    }

    // Generate JWT token
    const token = generateToken(user.id);

    res.status(200).json({
      success: true,
      data: {
        user,
        token,
      },
    });
  } catch (error) {
    logger.error('Google OAuth error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error during Google authentication',
    });
  }
};
