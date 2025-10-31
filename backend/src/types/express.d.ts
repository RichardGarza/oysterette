/**
 * Express Type Augmentation
 * Extends the Express Request interface to include custom properties
 */

declare namespace Express {
  export interface Request {
    userId?: string;
  }
}
