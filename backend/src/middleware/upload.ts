/**
 * File Upload Middleware
 *
 * Multer configuration for handling multipart/form-data image uploads.
 *
 * Features:
 * - Memory storage (images stored in memory before Cloudinary upload)
 * - File size limit: 5MB per image
 * - File type validation: Only JPEG, PNG, HEIC, WEBP allowed
 * - Multiple file uploads supported (max 10 per request)
 *
 * Usage:
 * - Single image: upload.single('image')
 * - Multiple images: upload.array('images', 10)
 *
 * Error Handling:
 * - Returns 400 for invalid file type
 * - Returns 413 for file too large
 * - Returns 400 for too many files
 */

import multer from 'multer';
import { Request } from 'express';

// Use memory storage (files stored as Buffer in req.file.buffer)
const storage = multer.memoryStorage();

// File filter: only allow images
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Allowed MIME types
  const allowedTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/heic',
    'image/heif',
    'image/webp',
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, HEIC, and WEBP images are allowed.'));
  }
};

// Multer upload configuration
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max per file
    files: 10, // Max 10 files per request
  },
});

export default upload;
