/**
 * Authentication Middleware
 *
 * Provides JWT-based authentication for protected routes.
 *
 * Features:
 * - Extracts JWT from Authorization header (Bearer token)
 * - Verifies token signature and expiration
 * - Attaches userId to request object for downstream use
 * - Optional authentication mode for public+private routes
 *
 * Usage:
 * - authenticate: Requires valid token, fails with 401 if missing/invalid
 * - optionalAuthenticate: Accepts both authenticated and unauthenticated requests
 */

import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/auth';

/**
 * Require authentication middleware
 *
 * Validates JWT token from Authorization header and attaches userId to request.
 * Rejects requests without valid token.
 *
 * @param req - Express request (expects Authorization: Bearer <token>)
 * @param res - Express response
 * @param next - Express next function
 * @returns 401 if token missing or invalid
 */
export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        error: 'No token provided',
      });
      return;
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify token
    const decoded = verifyToken(token);

    // Add userId to request
    req.userId = decoded.userId;

    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      error: 'Invalid or expired token',
    });
  }
};

/**
 * Optional authentication middleware
 *
 * Attempts to validate JWT if present, but allows request to proceed even
 * without authentication. Useful for routes that provide enhanced features
 * for logged-in users but are also publicly accessible.
 *
 * @param req - Express request
 * @param res - Express response
 * @param next - Express next function
 */
export const optionalAuthenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const decoded = verifyToken(token);
      req.userId = decoded.userId;
    }

    next();
  } catch (error) {
    // Silently fail for optional auth
    next();
  }
};
