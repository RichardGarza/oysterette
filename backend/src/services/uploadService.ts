/**
 * Upload Service
 *
 * Handles image uploads to Cloudinary with compression and validation.
 */

import { v2 as cloudinary } from 'cloudinary';
import logger from '../utils/logger';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_FORMATS = ['jpg', 'jpeg', 'png', 'webp'];

interface UploadOptions {
  folder?: string;
  width?: number;
  height?: number;
  crop?: 'fill' | 'scale' | 'fit';
  quality?: number;
}

/**
 * Upload image to Cloudinary
 *
 * @param buffer - Image buffer from multer
 * @param options - Upload configuration
 * @returns Cloudinary URL
 */
export const uploadImage = async (
  buffer: Buffer,
  options: UploadOptions = {}
): Promise<string> => {
  try {
    // Validate file size
    if (buffer.length > MAX_FILE_SIZE) {
      throw new Error('File size exceeds 5MB limit');
    }

    const {
      folder = 'oysterette',
      width = 800,
      height = 800,
      crop = 'fill',
      quality = 80,
    } = options;

    // Upload to Cloudinary
    const result = await new Promise<any>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder,
          transformation: [
            {
              width,
              height,
              crop,
              quality,
              fetch_format: 'auto',
            },
          ],
          allowed_formats: ALLOWED_FORMATS,
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );

      uploadStream.end(buffer);
    });

    logger.info(`Image uploaded to Cloudinary: ${result.secure_url}`);
    return result.secure_url;
  } catch (error) {
    logger.error('Cloudinary upload error:', error);
    throw new Error('Failed to upload image');
  }
};

/**
 * Upload profile photo (optimized for avatars)
 *
 * @param buffer - Image buffer
 * @returns Cloudinary URL
 */
export const uploadProfilePhoto = async (buffer: Buffer): Promise<string> => {
  return uploadImage(buffer, {
    folder: 'oysterette/profiles',
    width: 400,
    height: 400,
    crop: 'fill',
    quality: 85,
  });
};

/**
 * Upload review photo (optimized for reviews)
 *
 * @param buffer - Image buffer
 * @returns Cloudinary URL
 */
export const uploadReviewPhoto = async (buffer: Buffer): Promise<string> => {
  return uploadImage(buffer, {
    folder: 'oysterette/reviews',
    width: 1200,
    height: 900,
    crop: 'fit',
    quality: 80,
  });
};

/**
 * Delete image from Cloudinary
 *
 * @param url - Cloudinary URL to delete
 */
export const deleteImage = async (url: string): Promise<void> => {
  try {
    // Extract public_id from URL
    const parts = url.split('/');
    const filename = parts[parts.length - 1]?.split('.')[0];
    const folder = parts[parts.length - 2];

    if (!filename || !folder) {
      logger.warn('Invalid Cloudinary URL format');
      return;
    }

    const publicId = `${folder}/${filename}`;

    await cloudinary.uploader.destroy(publicId);
    logger.info(`Image deleted from Cloudinary: ${publicId}`);
  } catch (error) {
    logger.error('Cloudinary delete error:', error);
    // Don't throw - deletion failures shouldn't block the app
  }
};
