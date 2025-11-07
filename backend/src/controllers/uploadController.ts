/**
 * Upload Controller
 *
 * Handles image uploads to Cloudinary.
 *
 * Endpoints:
 * - POST /api/upload/image - Upload single image
 * - POST /api/upload/images - Upload multiple images (max 10)
 *
 * Request Format:
 * - Content-Type: multipart/form-data
 * - Body: image file(s) with key 'image' (single) or 'images' (multiple)
 *
 * Response Format:
 * - Single: { success: true, data: { url: string, publicId: string } }
 * - Multiple: { success: true, data: { urls: string[], publicIds: string[] } }
 *
 * Cloudinary Upload Options:
 * - Folder: oysterette/{reviews|profiles}
 * - Format: Auto-optimized (WebP when supported, fallback to original)
 * - Quality: Auto (Cloudinary automatically optimizes)
 * - Resource Type: Image
 * - Overwrite: false (unique filename per upload)
 *
 * Error Handling:
 * - 400: No file uploaded
 * - 400: Invalid file type (caught by multer middleware)
 * - 413: File too large (caught by multer middleware)
 * - 503: Cloudinary not configured
 * - 500: Upload failed
 */

import { Request, Response } from 'express';
import cloudinary, { isCloudinaryConfigured } from '../config/cloudinary';
import logger from '../utils/logger';
import { Readable } from 'stream';

/**
 * Upload single image to Cloudinary
 */
export const uploadImage = async (req: Request, res: Response): Promise<void> => {
  try {
    // Check if Cloudinary is configured
    if (!isCloudinaryConfigured) {
      res.status(503).json({
        success: false,
        error: 'Image upload service is not configured',
      });
      return;
    }

    // Check if file was uploaded
    if (!req.file) {
      res.status(400).json({
        success: false,
        error: 'No image file uploaded',
      });
      return;
    }

    // Get upload folder from query param (default: reviews)
    const folder = req.query.folder === 'profiles' ? 'oysterette/profiles' : 'oysterette/reviews';

    // Upload to Cloudinary using upload_stream (for buffer data)
    const uploadResult = await new Promise<any>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: 'image',
          format: 'auto', // Auto-convert to optimal format
          quality: 'auto', // Auto-optimize quality
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );

      // Convert buffer to stream and pipe to Cloudinary
      const bufferStream = Readable.from(req.file!.buffer);
      bufferStream.pipe(uploadStream);
    });

    logger.info(`Image uploaded to Cloudinary: ${uploadResult.public_id}`);

    res.status(200).json({
      success: true,
      data: {
        url: uploadResult.secure_url,
        publicId: uploadResult.public_id,
      },
    });
  } catch (error) {
    logger.error('Image upload error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to upload image',
    });
  }
};

/**
 * Upload multiple images to Cloudinary
 */
export const uploadImages = async (req: Request, res: Response): Promise<void> => {
  try {
    // Check if Cloudinary is configured
    if (!isCloudinaryConfigured) {
      res.status(503).json({
        success: false,
        error: 'Image upload service is not configured',
      });
      return;
    }

    // Check if files were uploaded
    if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
      res.status(400).json({
        success: false,
        error: 'No image files uploaded',
      });
      return;
    }

    // Get upload folder from query param (default: reviews)
    const folder = req.query.folder === 'profiles' ? 'oysterette/profiles' : 'oysterette/reviews';

    // Upload all images in parallel
    const uploadPromises = req.files.map((file) => {
      return new Promise<any>((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder,
            resource_type: 'image',
            format: 'auto',
            quality: 'auto',
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );

        const bufferStream = Readable.from(file.buffer);
        bufferStream.pipe(uploadStream);
      });
    });

    const uploadResults = await Promise.all(uploadPromises);

    logger.info(`${uploadResults.length} images uploaded to Cloudinary`);

    res.status(200).json({
      success: true,
      data: {
        urls: uploadResults.map((r) => r.secure_url),
        publicIds: uploadResults.map((r) => r.public_id),
      },
    });
  } catch (error) {
    logger.error('Multiple image upload error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to upload images',
    });
  }
};

/**
 * Delete image from Cloudinary
 * (Used when user deletes a review or changes profile photo)
 */
export const deleteImage = async (publicId: string): Promise<boolean> => {
  try {
    if (!isCloudinaryConfigured) {
      logger.warn('Cloudinary not configured, skipping image deletion');
      return false;
    }

    const result = await cloudinary.uploader.destroy(publicId);
    logger.info(`Image deleted from Cloudinary: ${publicId}`);
    return result.result === 'ok';
  } catch (error) {
    logger.error('Image deletion error:', error);
    return false;
  }
};
