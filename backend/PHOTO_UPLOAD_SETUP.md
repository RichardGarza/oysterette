# Photo Upload Configuration

## Current Issue

Photo uploads in the mobile app are failing with a 503 error. This is because **Cloudinary is not configured** with the required environment variables.

## What is Cloudinary?

Cloudinary is a cloud-based image and video management service that provides:
- Automatic image optimization
- Responsive image delivery
- Secure upload with signed URLs
- Automatic format conversion (WebP, etc.)
- CDN delivery for fast loading

## Required Environment Variables

Add these to your Railway/deployment environment:

```bash
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

## How to Get Cloudinary Credentials

1. **Sign up for free**: https://cloudinary.com/users/register_free
   - Free tier includes:
     - 25 GB storage
     - 25 GB bandwidth/month
     - 25,000 transformations/month

2. **Get your credentials**:
   - Go to Dashboard → Settings → API Keys
   - Copy your Cloud Name, API Key, and API Secret

3. **Add to Railway**:
   ```bash
   # In Railway dashboard:
   # Settings → Variables → Add Variable
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret
   ```

4. **Redeploy** your Railway app to apply the changes

## Testing Photo Uploads

Once configured, photo uploads will:
1. Accept photos from mobile app (camera or library)
2. Upload to Cloudinary (folder: `oysterette/reviews` or `oysterette/profiles`)
3. Return secure HTTPS URL
4. Store URL in database (`reviews.photoUrls` array)

## Current Upload Limits

- **Max file size**: 5 MB (enforced by multer middleware)
- **Max photos per review**: 1 (enforced in mobile app)
- **Allowed formats**: JPEG, PNG, HEIC, WebP

## Backend Implementation

Upload endpoint: `POST /api/upload/image?folder=reviews`
- Requires: Authentication (JWT token)
- Content-Type: multipart/form-data
- Field name: `image`

See:
- `backend/src/config/cloudinary.ts` - Configuration
- `backend/src/controllers/uploadController.ts` - Upload logic
- `backend/src/middleware/upload.ts` - Multer middleware
- `backend/src/routes/uploadRoutes.ts` - Routes

## Mobile Implementation

Upload flow in AddReviewScreen:
1. User taps "Add Photo" button
2. Choose camera or library
3. Request permissions if needed
4. Upload to backend via FormData
5. Display uploaded photo in review

See: `mobile-app/src/screens/AddReviewScreen.tsx` (lines 180-265)

## Temporary Workaround

If you don't want to configure Cloudinary:
1. Photo uploads will fail gracefully with a 503 error
2. Reviews can still be submitted without photos
3. The app will show "Image upload service is temporarily unavailable"

Users can still create reviews, just without photo attachments.
