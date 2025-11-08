# Anonymous Reviews Implementation

## Overview

The mobile app now supports anonymous reviews - users can submit reviews without logging in. This document outlines the frontend implementation and required backend changes.

## Frontend Implementation ✅ COMPLETE

### Features Implemented

1. **No Login Required**: Users can access AddReviewScreen and fill out reviews without authentication
2. **Save Review Dialog**: After submission, users see 3 options:
   - **"Just Post Review"**: Submit anonymously (requires backend support)
   - **"Sign In to Save"**: Store review in AsyncStorage, navigate to Login
   - **"Sign Up to Save"**: Store review in AsyncStorage, navigate to Register

3. **Temporary Review Storage**: Reviews stored in AsyncStorage via `tempReviewsStorage` service
4. **Update Mode Protection**: Updating existing reviews still requires authentication

### Files Created/Modified

- **Created**: `mobile-app/src/services/tempReviews.ts`
  - AsyncStorage service for temporary review storage
  - Methods: store, getAll, getById, remove, clearAll, getCount

- **Modified**: `mobile-app/src/screens/AddReviewScreen.tsx`
  - Removed login check from screen load
  - Added 3-option dialog for unauthenticated users
  - Implemented temp review storage flow
  - Added handlers: handleSaveToTempAndNavigate, handlePostAnonymously

### User Flow

```
User opens AddReviewScreen
  ↓
Fills out review (no login check)
  ↓
Taps "Submit Review"
  ↓
Is user logged in?
  ├─ YES → Submit review to backend immediately
  └─ NO  → Show dialog with 3 options:
           ├─ "Just Post Review" → Submit without auth (backend support needed)
           ├─ "Sign In to Save" → Save to AsyncStorage → Navigate to Login
           └─ "Sign Up to Save" → Save to AsyncStorage → Navigate to Register
```

## Backend Changes Required ⚠️

### 1. Support Anonymous Review Creation

**Current Behavior**:
- `POST /api/reviews` requires authentication
- `userId` is extracted from JWT token
- All reviews must be linked to a user account

**Required Changes**:
- Make authentication optional for `POST /api/reviews`
- If no auth token provided, create review with `userId = null`
- Add database support for nullable `userId` field
- Anonymous reviews should still affect oyster aggregate ratings

**Database Migration**:
```sql
-- Make userId nullable in reviews table
ALTER TABLE "Review" ALTER COLUMN "userId" DROP NOT NULL;

-- Add index for querying anonymous reviews
CREATE INDEX "Review_userId_idx" ON "Review"("userId") WHERE "userId" IS NULL;
```

**Backend Controller Example**:
```typescript
// reviewController.ts
async function createReview(req, res) {
  // Get userId from token if available, otherwise null
  const userId = req.user?.id || null;

  const review = await prisma.review.create({
    data: {
      ...req.body,
      userId, // null for anonymous reviews
    },
  });

  return res.json({ success: true, data: review });
}
```

### 2. Link Anonymous Reviews After Login (Future Enhancement)

When a user logs in after submitting anonymous reviews, we should link those reviews to their account.

**Approach**:
- Store temp review ID in AsyncStorage when submitting anonymously
- After login, call `PUT /api/reviews/:id/claim` to link review to user
- Backend verifies review has no userId before linking

**Backend Endpoint**:
```typescript
// POST /api/reviews/:id/claim
async function claimReview(req, res) {
  const reviewId = req.params.id;
  const userId = req.user.id; // From JWT token

  const review = await prisma.review.findUnique({ where: { id: reviewId } });

  if (!review) {
    return res.status(404).json({ error: 'Review not found' });
  }

  if (review.userId !== null) {
    return res.status(400).json({ error: 'Review already claimed' });
  }

  const updated = await prisma.review.update({
    where: { id: reviewId },
    data: { userId },
  });

  return res.json({ success: true, data: updated });
}
```

### 3. Display Considerations

- Anonymous reviews should show "Anonymous" as author name
- Anonymous reviews cannot be edited or deleted by anyone (except admins)
- Voting still works on anonymous reviews
- Anonymous reviews don't affect user credibility score

### 4. Privacy Considerations

- Anonymous reviews cannot be traced back to users
- IP logging should be minimal for anonymous submissions
- Consider rate limiting by IP for anonymous reviews
- Add CAPTCHA or similar bot protection if abuse is detected

## Testing Checklist

### Frontend (Ready to Test)
- [ ] Fill out review without logging in
- [ ] Tap "Submit Review" → Dialog appears with 3 options
- [ ] Tap "Just Post Review" → Review submitted (currently fails until backend updated)
- [ ] Tap "Sign In to Save" → Review stored in AsyncStorage, navigate to Login
- [ ] Tap "Sign Up to Save" → Review stored in AsyncStorage, navigate to Register
- [ ] Verify temp reviews persist across app restarts
- [ ] Logged-in users still submit reviews normally

### Backend (Pending Implementation)
- [ ] Create review without auth token → Success (userId = null)
- [ ] Create review with auth token → Success (userId from token)
- [ ] Anonymous review appears in oyster's review list
- [ ] Anonymous review affects oyster aggregate ratings
- [ ] Claim anonymous review after login → Success
- [ ] Try to claim already-claimed review → Error
- [ ] Rate limiting works for anonymous reviews
- [ ] Anonymous reviews cannot be edited/deleted

## Migration Path

1. ✅ **Frontend**: Implement anonymous review UI (COMPLETE)
2. ⏳ **Backend**: Make userId nullable, support anonymous creation
3. ⏳ **Backend**: Add review claiming endpoint
4. ⏳ **Mobile**: Add temp review submission after login/register
5. ⏳ **Testing**: E2E testing of full flow
6. ⏳ **Deploy**: Backend changes → Mobile OTA update

## Current Status

- **Frontend**: ✅ 100% Complete
- **Backend**: ⚠️ Changes Required (see above)
- **E2E Flow**: ⚠️ Blocked by backend changes

## Temporary Workaround

Until backend supports anonymous reviews, the "Just Post Review" option will fail with an authentication error. Users can still:
1. Save review to AsyncStorage and login later
2. Sign up/log in before submitting

This gracefully degrades the feature until full support is available.
