/**
 * Validation Middleware
 *
 * Provides runtime validation and sanitization using Zod schemas.
 *
 * Features:
 * - Validates request body, params, or query parameters
 * - Type-safe schema validation with TypeScript
 * - Automatic data sanitization (e.g., email lowercasing)
 * - User-friendly error messages
 * - Prevents invalid data from reaching controllers
 *
 * Usage:
 * - validateBody(schema) - Validate request.body
 * - validateParams(schema) - Validate request.params
 * - validateQuery(schema) - Validate request.query
 *
 * See: backend/src/validators/schemas.ts for all schema definitions
 */

import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';

export type ValidationTarget = 'body' | 'params' | 'query';

/**
 * Creates a validation middleware for the specified target
 *
 * @param schema - Zod schema to validate against
 * @param target - Which part of request to validate (body/params/query)
 * @returns Express middleware function
 * @returns 400 with validation errors if validation fails
 */
export function validate(schema: ZodSchema, target: ValidationTarget = 'body') {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Get the data to validate based on target
      const dataToValidate = req[target];

      // Validate and parse the data
      const validatedData = await schema.parseAsync(dataToValidate);

      // Replace the request data with validated/sanitized data
      // Use Object.defineProperty for query since it's read-only
      if (target === 'query') {
        Object.defineProperty(req, 'query', {
          value: validatedData,
          writable: true,
          enumerable: true,
          configurable: true,
        });
      } else {
        (req as any)[target] = validatedData;
      }

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        // Format Zod validation errors into user-friendly messages
        const errors = error.issues.map((err: any) => ({
          field: err.path.join('.'),
          message: err.message,
        }));

        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors,
        });
      }

      // Pass other errors to error handler
      next(error);
    }
  };
}

/**
 * Convenience functions for common validation scenarios
 */
export const validateBody = (schema: ZodSchema) => validate(schema, 'body');
export const validateParams = (schema: ZodSchema) => validate(schema, 'params');
export const validateQuery = (schema: ZodSchema) => validate(schema, 'query');
