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

import express from 'express';
import { uploadImage, uploadImages } from '../controllers/uploadController';
import { authenticate } from '../middleware/auth';
import upload from '../middleware/upload';

const router = express.Router();

// All upload routes require authentication
router.use(authenticate);

// Single image upload
router.post('/image', upload.single('image'), uploadImage);

// Multiple image upload (max 10)
router.post('/images', upload.array('images', 10), uploadImages);

export default router;
