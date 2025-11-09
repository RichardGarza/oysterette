/**
 * Upload Routes
 *
 * Handles image upload endpoints.
 *
 * All routes require authentication (JWT token).
 *
 * Routes:
 * - POST /api/upload/image - Upload single image
 * - POST /api/upload/images - Upload multiple images (max 10)
 *
 * Query Parameters:
 * - folder: 'reviews' | 'profiles' (default: 'reviews')
 *
 * Example Requests:
 *
 * Single Image:
 * ```bash
 * curl -X POST \
 *   -H "Authorization: Bearer YOUR_JWT_TOKEN" \
 *   -F "image=@photo.jpg" \
 *   http://localhost:3000/api/upload/image?folder=reviews
 * ```
 *
 * Multiple Images:
 * ```bash
 * curl -X POST \
 *   -H "Authorization: Bearer YOUR_JWT_TOKEN" \
 *   -F "images=@photo1.jpg" \
 *   -F "images=@photo2.jpg" \
 *   http://localhost:3000/api/upload/images?folder=reviews
 * ```
 */

import express, { Request, Response, NextFunction } from 'express';
import { uploadImage, uploadImages } from '../controllers/uploadController';
import { authenticate } from '../middleware/auth';
import upload from '../middleware/upload';
import logger from '../utils/logger';

const router = express.Router();

// All upload routes require authentication
router.use(authenticate);

// Multer error handler middleware
const handleMulterError = (err: any, req: Request, res: Response, next: NextFunction) => {
  if (err) {
    logger.error('Multer upload error:', err);

    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({
        success: false,
        error: 'File too large. Maximum size is 5MB.',
      });
    }

    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        success: false,
        error: 'Unexpected field name. Use "image" for single upload or "images" for multiple.',
      });
    }

    if (err.message.includes('Invalid file type')) {
      return res.status(400).json({
        success: false,
        error: err.message,
      });
    }

    return res.status(400).json({
      success: false,
      error: `Upload error: ${err.message}`,
    });
  }
  next();
};

// Single image upload
router.post('/image', upload.single('image'), handleMulterError, uploadImage);

// Multiple image upload (max 10)
router.post('/images', upload.array('images', 10), handleMulterError, uploadImages);

export default router;
