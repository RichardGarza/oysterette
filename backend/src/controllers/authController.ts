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
import appleSignin from 'apple-signin-auth';

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
    logger.debug('Google OAuth request received', { tokenLength: idToken?.length || 0 });

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
    logger.debug('Starting Google token verification');
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
    logger.debug('Google token verified successfully', { email, googleId, hasProfilePhoto: !!picture });

    // Check if user already exists (by email or googleId)
    let user = await prisma.user.findFirst({
      where: {
        OR: [
          { email },
          { googleId },
        ],
      },
      select: {
        id: true,
        email: true,
        name: true,
        preferences: true,
        createdAt: true,
        googleId: true,
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
          googleId,
          preferences: picture ? { profilePhoto: picture } : {},
        },
        select: {
          id: true,
          email: true,
          name: true,
          preferences: true,
          createdAt: true,
          googleId: true,
        },
      });
      logger.info('New user created via Google OAuth', {
        email,
        googleId,
        userId: user.id,
        hasProfilePhoto: !!picture
      });
    } else if (!user.googleId) {
      // Update existing user with googleId if they signed up with email/password first
      user = await prisma.user.update({
        where: { id: user.id },
        data: { googleId },
        select: {
          id: true,
          email: true,
          name: true,
          preferences: true,
          createdAt: true,
          googleId: true,
        },
      });
      logger.info('Linked Google account to existing user', {
        email,
        googleId,
        userId: user.id
      });
    }

    // Generate JWT token
    const token = generateToken(user.id);
    logger.info('Google OAuth successful, JWT issued', { userId: user.id, email });

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

/**
 * Authenticate user with Apple Sign In
 *
 * Verifies Apple ID token from mobile app (Apple Sign-In SDK) and either:
 * - Creates a new user if email doesn't exist
 * - Logs in existing user if email is found
 *
 * Apple may provide a "private relay" email if user chooses to hide their email.
 * OAuth users have empty password field and cannot use password login.
 *
 * @route POST /api/auth/apple
 * @param req.body.idToken - Apple ID token from native Apple Sign-In SDK
 * @param req.body.user - Optional user data (only provided on first sign-in)
 * @returns 200 - User object and JWT token
 * @returns 400 - Missing or invalid token
 * @returns 401 - Token verification failed
 * @returns 500 - Server error
 */
export const appleAuth = async (req: Request, res: Response): Promise<void> => {
  try {
    const { idToken, user: appleUser } = req.body;
    logger.debug('Apple OAuth request received', {
      tokenLength: idToken?.length || 0,
      hasUserData: !!appleUser
    });

    if (!idToken) {
      res.status(400).json({
        success: false,
        error: 'Apple ID token is required',
      });
      return;
    }

    // Verify the Apple ID token
    let appleData;
    logger.debug('Starting Apple token verification');
    try {
      appleData = await appleSignin.verifyIdToken(idToken, {
        // No audience check needed - Expo handles the client ID
        ignoreExpiration: false,
      });
    } catch (error) {
      logger.error('Apple token verification failed:', error);
      res.status(401).json({
        success: false,
        error: 'Invalid Apple token',
      });
      return;
    }

    if (!appleData || !appleData.email) {
      res.status(400).json({
        success: false,
        error: 'Invalid token payload',
      });
      return;
    }

    const { email, sub: appleId } = appleData;
    logger.debug('Apple token verified successfully', { email, appleId });

    // Apple only provides user info on FIRST sign-in, so we get it from the request
    const userName = appleUser?.fullName
      ? `${appleUser.fullName.givenName || ''} ${appleUser.fullName.familyName || ''}`.trim()
      : email.split('@')[0] || 'User';

    if (!appleUser?.fullName) {
      logger.warn('Apple user data not provided, using email prefix as name', { email });
    }

    // Check if user already exists (by email or appleId)
    let user = await prisma.user.findFirst({
      where: {
        OR: [
          { email },
          { appleId },
        ],
      },
      select: {
        id: true,
        email: true,
        name: true,
        preferences: true,
        createdAt: true,
        appleId: true,
      },
    });

    // If user doesn't exist, create new user
    if (!user) {
      user = await prisma.user.create({
        data: {
          email,
          name: userName,
          password: '', // OAuth users don't need a password
          appleId,
        },
        select: {
          id: true,
          email: true,
          name: true,
          preferences: true,
          createdAt: true,
          appleId: true,
        },
      });
      logger.info('New user created via Apple Sign-In', {
        email,
        appleId,
        userId: user.id,
        userName
      });
    } else if (!user.appleId) {
      // Update existing user with appleId if they signed up with email/password first
      user = await prisma.user.update({
        where: { id: user.id },
        data: { appleId },
        select: {
          id: true,
          email: true,
          name: true,
          preferences: true,
          createdAt: true,
          appleId: true,
        },
      });
      logger.info('Linked Apple account to existing user', {
        email,
        appleId,
        userId: user.id
      });
    }

    // Generate JWT token
    const token = generateToken(user.id);
    logger.info('Apple OAuth successful, JWT issued', { userId: user.id, email });

    res.status(200).json({
      success: true,
      data: {
        user,
        token,
      },
    });
  } catch (error) {
    logger.error('Apple Sign-In error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error during Apple authentication',
    });
  }
};
