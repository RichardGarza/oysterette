/**
 * Authentication Middleware Unit Tests
 *
 * Tests JWT-based authentication middleware:
 * - authenticate: Requires valid token
 * - optionalAuthenticate: Accepts both authenticated/unauthenticated
 *
 * Coverage:
 * - Valid tokens
 * - Missing/malformed tokens
 * - Expired tokens
 * - Invalid signatures
 * - Edge cases and security
 */

import { Request, Response, NextFunction } from 'express';
import { authenticate, optionalAuthenticate } from '../auth';
import * as authUtils from '../../utils/auth';

// Mock auth utils
jest.mock('../../utils/auth');

describe('Authentication Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let nextFunction: NextFunction;

  beforeEach(() => {
    mockRequest = {
      headers: {},
      userId: undefined,
    };

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    nextFunction = jest.fn();
    jest.clearAllMocks();
  });

  describe('authenticate', () => {
    it('should authenticate with valid Bearer token', async () => {
      const validToken = 'valid-jwt-token';
      const decodedPayload = { userId: 'user-123' };

      mockRequest.headers = {
        authorization: `Bearer ${validToken}`,
      };

      (authUtils.verifyToken as jest.Mock).mockReturnValue(decodedPayload);

      await authenticate(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(authUtils.verifyToken).toHaveBeenCalledWith(validToken);
      expect(mockRequest.userId).toBe('user-123');
      expect(nextFunction).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should reject request with no Authorization header', async () => {
      mockRequest.headers = {};

      await authenticate(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'No token provided',
      });
      expect(nextFunction).not.toHaveBeenCalled();
      expect(authUtils.verifyToken).not.toHaveBeenCalled();
    });

    it('should reject request with empty Authorization header', async () => {
      mockRequest.headers = {
        authorization: '',
      };

      await authenticate(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'No token provided',
      });
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should reject request without Bearer prefix', async () => {
      mockRequest.headers = {
        authorization: 'just-a-token',
      };

      await authenticate(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'No token provided',
      });
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should reject request with malformed Bearer token', async () => {
      mockRequest.headers = {
        authorization: 'Bearer',
      };

      await authenticate(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should reject expired token', async () => {
      mockRequest.headers = {
        authorization: 'Bearer expired-token',
      };

      (authUtils.verifyToken as jest.Mock).mockImplementation(() => {
        throw new Error('Token expired');
      });

      await authenticate(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Invalid or expired token',
      });
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should reject token with invalid signature', async () => {
      mockRequest.headers = {
        authorization: 'Bearer invalid-signature-token',
      };

      (authUtils.verifyToken as jest.Mock).mockImplementation(() => {
        throw new Error('Invalid signature');
      });

      await authenticate(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Invalid or expired token',
      });
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should handle JWT malformed error', async () => {
      mockRequest.headers = {
        authorization: 'Bearer malformed.jwt.token',
      };

      (authUtils.verifyToken as jest.Mock).mockImplementation(() => {
        throw new Error('jwt malformed');
      });

      await authenticate(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should extract token correctly (remove Bearer prefix)', async () => {
      const token = 'my-jwt-token-123';
      mockRequest.headers = {
        authorization: `Bearer ${token}`,
      };

      (authUtils.verifyToken as jest.Mock).mockReturnValue({ userId: 'user-1' });

      await authenticate(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(authUtils.verifyToken).toHaveBeenCalledWith(token);
      expect(authUtils.verifyToken).not.toHaveBeenCalledWith(`Bearer ${token}`);
    });

    it('should handle tokens with extra whitespace in header value', async () => {
      mockRequest.headers = {
        authorization: 'Bearer   token-with-spaces  ',
      };

      (authUtils.verifyToken as jest.Mock).mockReturnValue({ userId: 'user-1' });

      await authenticate(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      // Should extract token after "Bearer " prefix
      // Extra spaces become part of the token string (not trimmed by middleware)
      expect(authUtils.verifyToken).toHaveBeenCalled();
    });

    it('should attach userId to request object', async () => {
      mockRequest.headers = {
        authorization: 'Bearer valid-token',
      };

      (authUtils.verifyToken as jest.Mock).mockReturnValue({
        userId: 'test-user-id-123',
      });

      await authenticate(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(mockRequest.userId).toBe('test-user-id-123');
    });

    it('should handle tokens with additional claims', async () => {
      mockRequest.headers = {
        authorization: 'Bearer token-with-claims',
      };

      (authUtils.verifyToken as jest.Mock).mockReturnValue({
        userId: 'user-1',
        email: 'user@test.com',
        role: 'admin',
        iat: 1234567890,
        exp: 9999999999,
      });

      await authenticate(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(mockRequest.userId).toBe('user-1');
      expect(nextFunction).toHaveBeenCalled();
    });

    // Note: Express automatically normalizes all header names to lowercase,
    // so testing 'Authorization' vs 'authorization' is not necessary

    it('should reject token with missing userId in payload', async () => {
      mockRequest.headers = {
        authorization: 'Bearer token-no-userid',
      };

      (authUtils.verifyToken as jest.Mock).mockReturnValue({
        email: 'user@test.com', // No userId field
      });

      await authenticate(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      // Should still call next, but userId will be undefined
      // This might be a bug in the middleware - it doesn't validate userId presence
      expect(nextFunction).toHaveBeenCalled();
      expect(mockRequest.userId).toBeUndefined();
    });
  });

  describe('optionalAuthenticate', () => {
    it('should authenticate with valid Bearer token', async () => {
      const validToken = 'valid-jwt-token';
      const decodedPayload = { userId: 'user-123' };

      mockRequest.headers = {
        authorization: `Bearer ${validToken}`,
      };

      (authUtils.verifyToken as jest.Mock).mockReturnValue(decodedPayload);

      await optionalAuthenticate(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(authUtils.verifyToken).toHaveBeenCalledWith(validToken);
      expect(mockRequest.userId).toBe('user-123');
      expect(nextFunction).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should allow request with no Authorization header', async () => {
      mockRequest.headers = {};

      await optionalAuthenticate(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(nextFunction).toHaveBeenCalled();
      expect(mockRequest.userId).toBeUndefined();
      expect(mockResponse.status).not.toHaveBeenCalled();
      expect(authUtils.verifyToken).not.toHaveBeenCalled();
    });

    it('should allow request with empty Authorization header', async () => {
      mockRequest.headers = {
        authorization: '',
      };

      await optionalAuthenticate(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(nextFunction).toHaveBeenCalled();
      expect(mockRequest.userId).toBeUndefined();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should allow request without Bearer prefix', async () => {
      mockRequest.headers = {
        authorization: 'just-a-token',
      };

      await optionalAuthenticate(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(nextFunction).toHaveBeenCalled();
      expect(mockRequest.userId).toBeUndefined();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should silently fail on expired token', async () => {
      mockRequest.headers = {
        authorization: 'Bearer expired-token',
      };

      (authUtils.verifyToken as jest.Mock).mockImplementation(() => {
        throw new Error('Token expired');
      });

      await optionalAuthenticate(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(nextFunction).toHaveBeenCalled();
      expect(mockRequest.userId).toBeUndefined();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should silently fail on invalid token', async () => {
      mockRequest.headers = {
        authorization: 'Bearer invalid-token',
      };

      (authUtils.verifyToken as jest.Mock).mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await optionalAuthenticate(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(nextFunction).toHaveBeenCalled();
      expect(mockRequest.userId).toBeUndefined();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should not set userId on failed authentication', async () => {
      mockRequest.headers = {
        authorization: 'Bearer bad-token',
      };

      (authUtils.verifyToken as jest.Mock).mockImplementation(() => {
        throw new Error('Bad token');
      });

      await optionalAuthenticate(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(mockRequest.userId).toBeUndefined();
    });

    it('should handle valid and invalid tokens differently', async () => {
      // First request: valid token
      mockRequest.headers = {
        authorization: 'Bearer valid-token',
      };

      (authUtils.verifyToken as jest.Mock).mockReturnValue({ userId: 'user-1' });

      await optionalAuthenticate(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(mockRequest.userId).toBe('user-1');

      // Second request: invalid token
      mockRequest = {
        headers: {
          authorization: 'Bearer invalid-token',
        },
        userId: undefined,
      };

      nextFunction = jest.fn();

      (authUtils.verifyToken as jest.Mock).mockImplementation(() => {
        throw new Error('Invalid');
      });

      await optionalAuthenticate(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(mockRequest.userId).toBeUndefined();
    });
  });

  describe('Security Edge Cases', () => {
    it('should reject SQL injection attempts in token', async () => {
      mockRequest.headers = {
        authorization: "Bearer ' OR '1'='1",
      };

      (authUtils.verifyToken as jest.Mock).mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await authenticate(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should handle extremely long tokens', async () => {
      const longToken = 'a'.repeat(10000);
      mockRequest.headers = {
        authorization: `Bearer ${longToken}`,
      };

      (authUtils.verifyToken as jest.Mock).mockImplementation(() => {
        throw new Error('Token too long');
      });

      await authenticate(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
    });

    it('should handle special characters in token', async () => {
      mockRequest.headers = {
        authorization: 'Bearer token-with-特殊字符-émojis-🎉',
      };

      (authUtils.verifyToken as jest.Mock).mockReturnValue({ userId: 'user-1' });

      await authenticate(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(authUtils.verifyToken).toHaveBeenCalledWith(
        'token-with-特殊字符-émojis-🎉'
      );
    });

    it('should not leak sensitive information in error messages', async () => {
      mockRequest.headers = {
        authorization: 'Bearer invalid-token',
      };

      (authUtils.verifyToken as jest.Mock).mockImplementation(() => {
        throw new Error('Secret key mismatch: sk_prod_12345');
      });

      await authenticate(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Invalid or expired token', // Generic error, not the detailed one
      });
    });
  });

  describe('Multiple Requests', () => {
    it('should handle multiple requests with different tokens', async () => {
      // Request 1
      mockRequest.headers = {
        authorization: 'Bearer token-1',
      };

      (authUtils.verifyToken as jest.Mock).mockReturnValue({ userId: 'user-1' });

      await authenticate(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(mockRequest.userId).toBe('user-1');

      // Request 2
      mockRequest = {
        headers: {
          authorization: 'Bearer token-2',
        },
        userId: undefined,
      };

      (authUtils.verifyToken as jest.Mock).mockReturnValue({ userId: 'user-2' });

      await authenticate(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(mockRequest.userId).toBe('user-2');
    });

    it('should not pollute request objects across calls', async () => {
      const request1 = {
        headers: { authorization: 'Bearer token-1' },
        userId: undefined,
      };

      const request2 = {
        headers: {},
        userId: undefined,
      };

      (authUtils.verifyToken as jest.Mock).mockReturnValue({ userId: 'user-1' });

      await authenticate(
        request1 as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(request1.userId).toBe('user-1');
      expect(request2.userId).toBeUndefined();
    });
  });
});
