/**
 * Cloudinary Configuration
 *
 * Cloud-based image and video management service configuration.
 *
 * Environment Variables Required:
 * - CLOUDINARY_CLOUD_NAME: Your Cloudinary cloud name
 * - CLOUDINARY_API_KEY: Your Cloudinary API key
 * - CLOUDINARY_API_SECRET: Your Cloudinary API secret
 *
 * To get these credentials:
 * 1. Sign up at https://cloudinary.com/users/register_free (free tier available)
 * 2. Go to Dashboard > Settings > API Keys
 * 3. Copy your Cloud Name, API Key, and API Secret
 * 4. Add to Railway environment variables
 *
 * Features:
 * - Automatic image optimization
 * - Responsive image delivery
 * - Secure upload with signed URLs
 * - Automatic format conversion (WebP, etc.)
 * - CDN delivery for fast loading
 *
 * Free Tier Limits:
 * - 25 GB storage
 * - 25 GB bandwidth/month
 * - 25,000 transformations/month
 */

import { v2 as cloudinary } from 'cloudinary';
import logger from '../utils/logger';

// Configure Cloudinary with environment variables
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true, // Use HTTPS URLs
});

// Verify configuration on startup
const verifyCloudinaryConfig = () => {
  const { cloud_name, api_key, api_secret } = cloudinary.config();

  if (!cloud_name || !api_key || !api_secret) {
    logger.warn('Cloudinary configuration incomplete. Image uploads will be disabled.');
    logger.warn('Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET environment variables.');
    return false;
  }

  logger.info('Cloudinary configured successfully');
  return true;
};

export const isCloudinaryConfigured = verifyCloudinaryConfig();

export default cloudinary;
