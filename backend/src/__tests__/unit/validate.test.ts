import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { validate, validateBody, validateParams, validateQuery } from '../../middleware/validate';

/**
 * Validation Middleware Tests
 * Tests the Zod validation middleware that prevented Railway deployment issues
 */

describe('Validation Middleware', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;

  beforeEach(() => {
    jsonMock = jest.fn();
    statusMock = jest.fn().mockReturnValue({ json: jsonMock });

    mockReq = {
      body: {},
      params: {},
      query: {},
    };

    mockRes = {
      status: statusMock,
      json: jsonMock,
    };

    mockNext = jest.fn();
  });

  describe('validateBody', () => {
    it('should pass validation with valid data', async () => {
      const schema = z.object({
        email: z.string().email(),
        name: z.string().min(2),
      });

      mockReq.body = {
        email: 'test@example.com',
        name: 'Test User',
      };

      const middleware = validateBody(schema);
      await middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(statusMock).not.toHaveBeenCalled();
    });

    it('should reject validation with invalid email', async () => {
      const schema = z.object({
        email: z.string().email(),
        name: z.string(),
      });

      mockReq.body = {
        email: 'invalid-email',
        name: 'Test',
      };

      const middleware = validateBody(schema);
      await middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        error: 'Validation failed',
        details: expect.arrayContaining([
          expect.objectContaining({
            field: 'email',
            message: expect.stringContaining('email'),
          }),
        ]),
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should reject validation with missing required fields', async () => {
      const schema = z.object({
        email: z.string().email(),
        password: z.string().min(8),
      });

      mockReq.body = {
        email: 'test@example.com',
        // password missing
      };

      const middleware = validateBody(schema);
      await middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'Validation failed',
          details: expect.any(Array),
        })
      );
    });

    it('should sanitize data (lowercase email)', async () => {
      const schema = z.object({
        email: z.string().email().toLowerCase(),
      });

      mockReq.body = {
        email: 'TEST@EXAMPLE.COM',
      };

      const middleware = validateBody(schema);
      await middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockReq.body.email).toBe('test@example.com');
      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('validateParams', () => {
    it('should validate UUID params', async () => {
      const schema = z.object({
        id: z.string().uuid(),
      });

      mockReq.params = {
        id: '123e4567-e89b-12d3-a456-426614174000',
      };

      const middleware = validateParams(schema);
      await middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(statusMock).not.toHaveBeenCalled();
    });

    it('should reject invalid UUID params', async () => {
      const schema = z.object({
        id: z.string().uuid(),
      });

      mockReq.params = {
        id: 'not-a-uuid',
      };

      const middleware = validateParams(schema);
      await middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'Validation failed',
        })
      );
    });
  });

  describe('validateQuery', () => {
    it('should validate query parameters', async () => {
      const schema = z.object({
        reviewIds: z.string(),
      });

      mockReq.query = {
        reviewIds: 'id1,id2,id3',
      };

      const middleware = validateQuery(schema);
      await middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it('should reject missing query parameters', async () => {
      const schema = z.object({
        reviewIds: z.string(),
      });

      mockReq.query = {};

      const middleware = validateQuery(schema);
      await middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(400);
    });
  });

  describe('Password Validation', () => {
    it('should enforce strong password requirements', async () => {
      const schema = z.object({
        password: z
          .string()
          .min(8)
          .regex(/[A-Z]/)
          .regex(/[a-z]/)
          .regex(/[0-9]/),
      });

      // Weak password
      mockReq.body = { password: 'weak' };
      let middleware = validateBody(schema);
      await middleware(mockReq as Request, mockRes as Response, mockNext);
      expect(statusMock).toHaveBeenCalledWith(400);

      // Reset mocks
      statusMock.mockClear();
      mockNext = jest.fn();

      // Strong password
      mockReq.body = { password: 'StrongPass123' };
      middleware = validateBody(schema);
      await middleware(mockReq as Request, mockRes as Response, mockNext);
      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should pass non-ZodError errors to next()', async () => {
      const schema = z.object({}).transform(() => {
        throw new Error('Custom error');
      });

      mockReq.body = {};

      const middleware = validateBody(schema);
      await middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
      expect(statusMock).not.toHaveBeenCalled();
    });
  });
});
