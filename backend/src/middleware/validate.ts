import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';

/**
 * Validation Middleware
 * Validates request body, params, or query using Zod schemas
 */

export type ValidationTarget = 'body' | 'params' | 'query';

/**
 * Creates a validation middleware for the specified target
 */
export function validate(schema: ZodSchema, target: ValidationTarget = 'body') {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Get the data to validate based on target
      const dataToValidate = req[target];

      // Validate and parse the data
      const validatedData = await schema.parseAsync(dataToValidate);

      // Replace the request data with validated/sanitized data
      req[target] = validatedData;

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        // Format Zod validation errors into user-friendly messages
        const errors = error.errors.map((err) => ({
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
