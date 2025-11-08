# Cloudinary Setup Guide

This guide explains how to set up Cloudinary for photo uploads in the Oysterette app.

## What is Cloudinary?

Cloudinary is a cloud-based image and video management service that provides:
- Automatic image optimization
- Responsive image delivery via CDN
- Image transformation and manipulation
- Secure upload with signed URLs
- Automatic format conversion (WebP, AVIF, etc.)

## Free Tier

Cloudinary offers a generous free tier:
- **25 GB** storage
- **25 GB** bandwidth per month
- **25,000** transformations per month
- No credit card required for signup

This is more than enough for Oysterette's current needs!

## Setup Instructions

### 1. Create Cloudinary Account

1. Go to https://cloudinary.com/users/register_free
2. Sign up for a free account
3. Verify your email address
4. You'll be redirected to your Dashboard

### 2. Get Your Credentials

From your Cloudinary Dashboard:

1. Go to **Settings** > **Product Environment Credentials**
2. You'll see three important values:
   - **Cloud Name**: Your unique identifier (e.g., `dqabc123xyz`)
   - **API Key**: Your public API key (e.g., `123456789012345`)
   - **API Secret**: Your secret key (keep this private!)

### 3. Add Credentials to Railway

1. Go to your Railway project dashboard
2. Click on your **backend** service
3. Go to the **Variables** tab
4. Add these three environment variables:

```
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

4. Click **Deploy** to restart the backend with new environment variables

### 4. Verify Setup

After deploying, check your Railway logs:

```
✅ Cloudinary configured successfully
```

If you see this message, you're all set!

If you see a warning, check that all three environment variables are set correctly.

## Testing the Upload

You can test image uploads using curl:

```bash
# First, login to get a JWT token
curl -X POST https://oysterette-production.up.railway.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"your@email.com","password":"yourpassword"}'

# Copy the token from the response, then upload an image
curl -X POST https://oysterette-production.up.railway.app/api/upload/image \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "image=@/path/to/your/image.jpg" \
  -F "folder=reviews"

# Successful response:
{
  "success": true,
  "data": {
    "url": "https://res.cloudinary.com/your-cloud-name/image/upload/v1234567890/oysterette/reviews/abc123.jpg",
    "publicId": "oysterette/reviews/abc123"
  }
}
```

## Folder Structure

Images are automatically organized into folders:

- `oysterette/reviews/` - Review photos
- `oysterette/profiles/` - User profile photos

## Image Optimization

Cloudinary automatically:
- Converts images to optimal format (WebP for modern browsers)
- Compresses images while maintaining quality
- Delivers images via CDN for fast loading
- Generates responsive image sizes

## Costs

On the free tier:
- **25 GB storage** = ~25,000 high-quality photos
- **25 GB bandwidth** = ~250,000 photo views per month
- **25,000 transformations** = resizing, format conversion, etc.

If you exceed these limits, Cloudinary will notify you via email. You can upgrade to a paid plan starting at $89/month if needed.

## Security

- API Secret is only stored on the backend (never exposed to mobile app)
- All uploads are authenticated (require valid JWT token)
- Images are uploaded to secure HTTPS URLs
- Public IDs are random and unpredictable

## Troubleshooting

### "Image upload service is not configured" (503 Error)

**Cause**: Cloudinary environment variables are missing or incorrect.

**Fix**:
1. Go to Railway > Backend Service > Variables tab
2. Verify all three variables are set:
   - `CLOUDINARY_CLOUD_NAME`
   - `CLOUDINARY_API_KEY`
   - `CLOUDINARY_API_SECRET`
3. Check for typos or extra spaces
4. Save and wait for Railway to redeploy (~2-3 minutes)
5. Check Railway logs for "Cloudinary configured successfully"

### "Failed to upload image"

Check Railway logs for detailed error message. Common issues:
- **Invalid API credentials**: Double-check credentials in Railway variables
- **File too large (max 5MB)**: Use a smaller image or take a new photo
- **Invalid file type**: Only JPEG, PNG, HEIC, WEBP allowed
- **Network timeout**: Check internet connection, try again

### "Authentication Required"

**Cause**: No JWT token or expired token.

**Fix**:
1. Log out of the app
2. Log back in
3. Try uploading photo again

### Photo Upload Hangs or Fails Silently

**Debug Steps**:

1. **Check Console Logs**:
   - iOS: Open Xcode > Debug > Console
   - Android: Run `npx react-native log-android`
   - Look for lines starting with `📸 [AddReviewScreen]`

2. **Common Log Messages**:
   ```
   📸 [AddReviewScreen] Starting photo upload: file:///path/to/image.jpg
   📸 [AddReviewScreen] File details: { filename: 'IMG_1234.jpg', type: 'image/jpeg' }
   📸 [AddReviewScreen] Uploading to backend...
   📸 [AddReviewScreen] Response status: 200
   📸 [AddReviewScreen] Response data: { success: true, data: { url: '...' } }
   ✅ [AddReviewScreen] Photo uploaded successfully
   ```

3. **Error Indicators**:
   - `Response status: 503` → Cloudinary not configured
   - `Response status: 401` → Authentication failed
   - `Response status: 413` → File too large
   - `Response status: 400` → Invalid file type or no file sent
   - `Upload failed - no URL returned` → Backend error, check Railway logs

4. **FormData Issues**:
   - Ensure image URI is valid (starts with `file://` on iOS, varies on Android)
   - Check MIME type is correct (`image/jpeg`, `image/png`, etc.)
   - Verify file exists at URI path

### Images not loading on mobile

Make sure you're using the `secure_url` from the upload response, not `url`. The secure URL uses HTTPS which is required for mobile apps.

## Recent Improvements (Phase 14.2)

The photo upload system has been enhanced with:

1. **Better Error Logging**: Detailed console logs at each step
2. **User-Friendly Error Messages**: Specific error messages for each failure type
3. **iOS URI Handling**: Automatically removes `file://` prefix on iOS
4. **Improved MIME Type Detection**: Correctly handles JPEG, PNG, HEIC, WEBP
5. **Success Alerts**: Shows "Success! Photo uploaded successfully!" alert
6. **Max 1 Photo**: Changed from 5 photos to 1 photo per review

## Next Steps

Once Cloudinary is set up, you can:
1. Implement Review Photos (add photos to reviews)
2. Implement Profile Photos (add profile photo to user account)
3. Display uploaded images in the app

Both features are ready to be implemented - the infrastructure is complete!
