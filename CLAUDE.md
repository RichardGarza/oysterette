# Oysterette Production Deployment Progress

## Session Dates: October 28-29, 2025 | November 3, 2025

---

## ✅ COMPLETED PHASES

### Phase 1: Neon Database Setup ✅
- [x] Created Neon account and project
- [x] Obtained Neon PostgreSQL connection string
- [x] Updated backend `.env` with Neon DATABASE_URL
- [x] Generated secure JWT secret
- [x] Ran Prisma migrations to Neon cloud database
- [x] Seeded Neon database with **838 oysters**
- [x] Tested backend connection to Neon - SUCCESS

**Database URL:**
```
postgresql://neondb_owner:npg_m3KRgzMPSrw1@ep-falling-shadow-ahmk229r-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require
```

---

### Phase 2: Railway Backend Deployment ✅
- [x] Created Railway.app account
- [x] Connected GitHub repo to Railway
- [x] Fixed deployment configuration issues:
  - Created `railway.json` with build config
  - Created `Procfile` for start command
  - Created `nixpacks.toml` for build settings
  - Fixed TypeScript config to exclude test files
  - Created `tsconfig.build.json` for production builds
  - Fixed Prisma client import paths (switched to `@prisma/client`)
- [x] Configured Railway environment variables:
  - DATABASE_URL (Neon connection)
  - JWT_SECRET
  - NODE_ENV=production
  - PORT=3000
  - SENTRY_DSN (error tracking)
- [x] Successfully deployed backend to Railway
- [x] Verified API is working and serving data

**Production Backend URL:**
```
https://oysterette-production.up.railway.app
```

**Test endpoint:**
```
https://oysterette-production.up.railway.app/api/oysters
```

---

### Phase 3: Mobile App Production Configuration ✅
- [x] Updated `mobile-app/src/services/api.ts` with production URL
- [x] Configured app to use Railway backend by default
- [x] Kept local development URLs for testing

**Production API URL in App:**
```
https://oysterette-production.up.railway.app/api
```

---

### Phase 4: Build Android APK for Distribution ✅
**Status:** COMPLETE

**Accomplishments:**
- ✅ Installed EAS CLI and Expo Orbit
- ✅ Configured EAS Update for OTA updates
- ✅ Created deployment automation scripts
- ✅ Successfully built Android APK
- ✅ APK Link: https://expo.dev/accounts/rgactr/projects/oysterette/builds/45f05f60-fe6d-4fe3-bfbb-9da657b2c7e1

**Deployment Workflow:**
```bash
# Quick updates (no new APK needed):
npm run deploy-update "Fix bug in search"

# Local APK build (1-3 minutes):
npm run build:android:local

# Cloud APK build (5-10 minutes):
npm run build:android:cloud
```

**Auto-Update System:**
- Friends install APK once
- Future updates push automatically via EAS Update
- No need to rebuild/redistribute APK for code changes

---

### Phase 5.1: User Rating & Voting System ✅ DEPLOYED!
**Status:** Complete - Live in Production

**What We Built:**
- ✅ Database schema with aggregated rating fields
- ✅ Sophisticated rating calculation service (40% rating + 60% attributes)
- ✅ Auto-recalculation on review create/update/delete
- ✅ Mobile UI components (RatingDisplay, RatingBreakdown)
- ✅ Integrated ratings into oyster list cards
- ✅ Voting system (agree/disagree on reviews)
- ✅ User credibility tracking based on vote patterns
- ✅ Credibility badges: Novice (0-0.9), Trusted (1.0-1.4), Expert (1.5+)

**How It Works:**
1. User submits review → Auto-calculates ratings
2. Dynamic weighting: More reviews = more user influence
3. Algorithm: 70% user ratings + 30% seed data (after 5+ reviews)
4. Overall score (0-10): 40% rating + 60% attributes
5. Other users can vote agree/disagree on reviews
6. Credibility builds over time based on voting patterns

---

### Phase 5.2: Production Hardening & Security ✅ COMPLETE!
**Status:** All Security & Quality Measures Deployed (Nov 3, 2025)

#### Security Enhancements Deployed:

**1. Input Validation with Zod:**
- ✅ Comprehensive validation schemas for all API endpoints
- ✅ Email validation and automatic lowercasing
- ✅ Strong password requirements:
  - Minimum 8 characters
  - At least one uppercase letter
  - At least one lowercase letter
  - At least one number
- ✅ UUID validation for all resource IDs
- ✅ Attribute range validation (1-10 for ratings)
- ✅ Review notes length limits (max 1000 characters)
- ✅ Query parameter validation with transformations

**2. Rate Limiting:**
- ✅ Auth endpoints: 10 requests per 15 minutes
- ✅ API endpoints: 100 requests per 15 minutes
- ✅ IP-based tracking with standard headers
- ✅ Prevents brute force attacks and API abuse

**3. JWT Security:**
- ✅ Removed insecure default secret (throws error if JWT_SECRET not set)
- ✅ Added unique JWT ID (jti) for token uniqueness
- ✅ Proper TypeScript type assertions
- ✅ 7-day token expiration

**4. Professional Logging (Winston):**
- ✅ File-based logging (logs/error.log, logs/combined.log)
- ✅ Log levels: error, warn, info, debug
- ✅ Replaced all 47+ console.log statements
- ✅ Structured logging with timestamps

**5. Error Tracking (Sentry):**
- ✅ Optional Sentry integration (requires SENTRY_DSN env var)
- ✅ Automatic error capture and reporting
- ✅ PII filtering (removes passwords, auth headers, cookies)
- ✅ Performance monitoring (10% sample rate in production)
- ✅ Transaction tracing for API requests

---

### Phase 5.3: Comprehensive Test Suite ✅ COMPLETE!
**Status:** 162/162 Tests Passing (Nov 3, 2025)

#### Test Coverage Added:

**New Test Suites:**
1. **TypeScript Compilation Tests** (`src/__tests__/compilation/typescript.test.ts`)
   - Runs full `npm run build` to catch compilation errors
   - Verifies production config with `tsc --noEmit`
   - **Prevents Railway deployment failures!**

2. **Validation Middleware Tests** (`src/__tests__/unit/validate.test.ts`)
   - Tests Zod validation for body, params, query
   - Verifies structured error messages
   - Tests data sanitization (email lowercasing)
   - Password requirement enforcement

3. **Validation Schema Tests** (`src/__tests__/unit/schemas.test.ts`)
   - Comprehensive tests for all Zod schemas
   - Auth schemas (register, login)
   - Review schemas (create, update)
   - Oyster schemas (create, update)
   - Vote schemas
   - UUID parameter validation
   - Query parameter validation
   - Edge cases and boundary values

4. **Rate Limiting Tests** (`src/__tests__/integration/rateLimit.test.ts`)
   - Auth rate limiter (10 req/15min)
   - API rate limiter (100 req/15min)
   - IP-based tracking verification
   - Rate limit headers validation
   - Window reset behavior

**Test Results:**
- **Before:** 29 failing tests, 133 passing
- **After:** 0 failing tests, **162 passing** ✅

**Critical Fixes:**
- ✅ Fixed `req.query` read-only property issue in validation middleware
- ✅ Updated all test passwords to meet new requirements
- ✅ Fixed review creation to include all required attributes
- ✅ Changed invalid UUIDs to valid format for proper validation testing
- ✅ Added trust proxy setting for rate limit IP tracking tests
- ✅ Fixed TypeScript compilation test path resolution

---

### Phase 5.3: Fuzzy Search Implementation ✅ DEPLOYED!
**Status:** Complete - Live in Production (Jan 3, 2025)

**What We Built:**
- ✅ Implemented Fuse.js for fuzzy string matching on backend
- ✅ Weighted search: name (50%), origin (30%), species (20%)
- ✅ Threshold 0.4 for balanced typo tolerance
- ✅ Handles misspellings like "Kumaoto" → "Kumamoto"
- ✅ All 162 tests still passing

**Location:** backend/src/controllers/oysterController.ts:188-244

---

### Phase 5.4: Theme Persistence & User Preferences ✅ DEPLOYED!
**Status:** Complete - Live in Production (Jan 3, 2025)

**What We Built:**

**Backend:**
- ✅ User preferences JSON field already in schema
- ✅ `/users/preferences` endpoint for saving settings
- ✅ Auth responses include preferences for theme sync
- ✅ Theme preference syncs across devices

**Mobile App:**
- ✅ Global settings gear icon on ALL screen headers
- ✅ Theme syncs to backend when changed (if logged in)
- ✅ Theme loads from user account on login/register
- ✅ Auto-login on app start (checks saved token)
- ✅ Falls back to local AsyncStorage if not logged in

**User Experience:**
- Settings accessible from any screen (including Home)
- Change theme → saves locally + syncs to server
- Login on different device → theme applies automatically
- Close app → stays logged in, skips home screen

**Locations:**
- App.tsx:24-31 (global settings button)
- ThemeContext.tsx:105-143 (sync logic)
- HomeScreen.tsx:27-55 (auto-login)

---

### Phase 5.5: UX Polish & Bug Fixes ✅ DEPLOYED!
**Status:** Complete - Live in Production (Jan 3, 2025)

**Fixes Deployed:**

1. **Removed Color Coding from Attribute Sliders**
   - Issue: Red/orange/green implied good/bad
   - Fix: All bars use primary blue (scores are descriptive, not qualitative)
   - Location: OysterDetailScreen.tsx:167-170

2. **Fixed Keyboard Covering Input**
   - Issue: Keyboard hid text input when writing reviews
   - Fix: Added KeyboardAvoidingView wrapper
   - Location: AddReviewScreen.tsx:85-89, 271

3. **Removed Redundant "Was this review helpful?" Text**
   - Issue: Unnecessary label above Agree/Disagree buttons
   - Fix: Kept voting buttons, removed question text
   - Location: ReviewCard.tsx:161-162

4. **Fixed Settings to Show Actual User Data**
   - Issue: Always showed "Guest User"
   - Fix: Loads actual user from AsyncStorage
   - Shows "User Not Logged In" + Login/Sign Up buttons when not authenticated
   - Location: SettingsScreen.tsx:27-177

---

## 📋 NEXT PRIORITIES

### Priority 1: Google OAuth Login (IN PROGRESS) 🎯
**Status:** Next Implementation

**Why This Matters:**
- Faster, easier sign-up (one tap with Google)
- No password to remember
- More secure (leverages Google's auth)
- Better user experience

**What We Need:**
1. **Expo AuthSession** for OAuth flow
2. **Google Cloud Console** setup (OAuth credentials)
3. **Backend endpoint** to handle Google login
4. **UI updates** - "Continue with Google" button

**Implementation Plan:**
```bash
# In mobile-app
npm install expo-auth-session expo-random

# In backend
npm install google-auth-library
```

**Backend Changes:**
- Add `/auth/google` endpoint
- Verify Google ID token
- Create or login user
- Return JWT token

**Mobile Changes:**
- Add Google sign-in button to Login/Register screens
- Implement OAuth redirect flow
- Handle token exchange

**Next Steps:**
1. Set up Google Cloud Console project
2. Get OAuth client IDs (Android, iOS, Web)
3. Implement backend Google auth endpoint
4. Add Google button to mobile UI
5. Test OAuth flow

---

### Priority 2: Enhanced Search Features (FUTURE)
**Status:** Backlog

**Potential Enhancements:**
- Search filters (species, origin, rating)
- Sort by various attributes
- Advanced fuzzy matching with phonetic algorithms
- Search history/suggestions

---

### Priority 3: User Profile Enhancements (FUTURE)
import Fuse from 'fuse.js';

const fuse = new Fuse(oysters, {
  keys: ['name', 'origin', 'species'],
  threshold: 0.3, // 0 = exact, 1 = match anything
  includeScore: true,
  useExtendedSearch: true,
});

const results = fuse.search(searchQuery);
```

**Benefits:**
- ✅ Handles typos and misspellings
- ✅ Can show "Did you mean...?" suggestions
- ✅ Weighted search across multiple fields
- ✅ Still fast with 800+ oysters
- ✅ No database migration needed

**Estimated Time:** 1-2 hours

---

### Priority 2: User Profile Page (HIGH PRIORITY - MEDIUM EFFORT)
**Status:** Ready to Implement

**Why:**
- Users need to see their review history
- Credibility badge display
- Profile management

**Features to Build:**

1. **Profile Screen** (`mobile-app/src/screens/ProfileScreen.tsx`)
   - User name and email
   - Join date
   - Credibility score and badge
   - Total reviews count
   - Total votes received (agrees/disagrees)

2. **Review History Tab**
   - List of user's reviews with oyster names
   - Rating and date
   - Vote counts per review
   - Edit/delete options

3. **Stats Display**
   - Reviews submitted: X
   - Credibility: X.XX (Badge icon)
   - Agrees received: X
   - Disagrees received: X

**Backend Changes:**
- ✅ Already have `/api/users/:userId/credibility` endpoint
- Need to add `/api/users/:userId/reviews` endpoint

**Estimated Time:** 4-6 hours

---

### Priority 3: Enhanced Oyster Recommendations (MEDIUM PRIORITY)
**Status:** Future Enhancement

**Two Approaches:**

**A. Simple Attribute-Based (Quick Win)**
- Match user's highly-rated oysters
- Find similar attributes (creamy, sweet, etc.)
- Show "You might like..." section

**B. Collaborative Filtering (Advanced)**
- Find users with similar taste
- Recommend their favorites
- "Users who liked X also liked Y"

**Implementation:**
- Start with simple approach
- Add collaborative filtering later

**Estimated Time:** 6-8 hours (simple), 12-16 hours (advanced)

---

### Priority 4: Oyster Photo Gallery (LOW PRIORITY - FUTURE)
**Status:** Backlog

**Why Later:**
- Requires image storage setup ($$$)
- Need moderation workflow
- More complex than other features

**When to Consider:**
- After user base grows
- When you have budget for image storage
- After core features are solid

---

## 🗂️ Project Structure

```
claude-project/
├── backend/                    # Node.js Express API
│   ├── prisma/
│   │   ├── schema.prisma      # Database schema
│   │   └── migrations/        # Migration files
│   ├── src/
│   │   ├── controllers/       # API controllers
│   │   ├── routes/            # API routes
│   │   ├── middleware/        # Auth, validation, etc.
│   │   ├── services/          # Business logic (rating, voting)
│   │   ├── validators/        # Zod schemas
│   │   ├── utils/             # Logger, Sentry, auth
│   │   ├── lib/               # Prisma client
│   │   ├── __tests__/         # Test suites (162 tests)
│   │   │   ├── compilation/   # TypeScript build tests
│   │   │   ├── integration/   # API integration tests
│   │   │   └── unit/          # Unit tests
│   │   └── index.ts           # Server entry point
│   ├── railway.json           # Railway deployment config
│   ├── nixpacks.toml          # Build configuration
│   ├── Procfile               # Start command
│   ├── tsconfig.build.json    # Production TypeScript config
│   └── .env                   # Environment variables (Neon DB)
│
├── mobile-app/                # React Native Expo app
│   ├── src/
│   │   ├── screens/          # App screens
│   │   ├── components/       # Reusable components
│   │   ├── services/         # API service (connects to Railway)
│   │   ├── types/            # TypeScript types
│   │   ├── navigation/       # Navigation config
│   │   ├── context/          # Theme context
│   │   └── themes/           # Dark/light themes
│   ├── App.tsx               # App entry point
│   ├── app.json              # Expo config
│   └── package.json
│
├── PRODUCTION_ROADMAP.md     # Detailed deployment guide
├── CLAUDE.md                 # This file - session progress
└── README.md                 # Project documentation
```

---

## 📊 Current Status Summary

### Infrastructure
- ✅ **Database:** Neon PostgreSQL (838 oysters)
- ✅ **Backend:** Railway (https://oysterette-production.up.railway.app)
- ✅ **Mobile App:** Production-ready with OTA updates
- ✅ **Error Tracking:** Sentry configured
- ✅ **Logging:** Winston file-based logging
- ✅ **Security:** Rate limiting, input validation, JWT hardening

### Features
- ✅ User authentication (register, login)
- ✅ Oyster browsing and search
- ✅ Review creation with ratings
- ✅ Voting system (agree/disagree)
- ✅ Credibility tracking and badges
- ✅ Dark mode support
- ✅ Rating aggregation and display

### Quality
- ✅ **162/162 tests passing**
- ✅ TypeScript compilation verified
- ✅ Input validation on all endpoints
- ✅ Rate limiting active
- ✅ Professional error handling

---

## 🔧 Quick Reference Commands

### Backend (in `/backend` directory)
```bash
# Local development
npm run dev

# Build production
npm run build

# Run all tests
npm test

# Run specific test types
npm run test:unit
npm run test:integration

# Run migrations
npx prisma migrate deploy

# Generate Prisma client
npx prisma generate

# Seed database
npm run seed
```

### Mobile App (in `/mobile-app` directory)
```bash
# Start Expo dev server
npm start

# Start with iOS simulator
npx expo start --ios

# Start with Android emulator
npx expo start --android

# Deploy OTA update
npm run deploy-update "Your update message"

# Build Android APK (local)
npm run build:android:local

# Build Android APK (cloud)
npm run build:android:cloud
```

### Git
```bash
# Check status
git status

# Commit changes
git add .
git commit -m "Your message"

# Push to GitHub (triggers Railway auto-deploy)
git push origin main
```

---

## 🚨 Important Notes

1. **Environment Variables (Railway)**
   - DATABASE_URL is set to Neon connection
   - JWT_SECRET is configured (NEVER use default)
   - SENTRY_DSN is optional (set for error tracking)
   - Never commit `.env` files to git

2. **API URL Configuration**
   - Production: `https://oysterette-production.up.railway.app/api`
   - Local backend: `http://localhost:3000/api`
   - Can switch by editing `mobile-app/src/services/api.ts`

3. **Railway Free Tier**
   - $5/month credit
   - Auto-sleeps after inactivity
   - First request may be slow (cold start)

4. **Neon Free Tier**
   - 3GB storage
   - Auto-sleeps after inactivity
   - Sufficient for testing

5. **Testing**
   - Always run tests before pushing: `npm test`
   - TypeScript compilation test will catch build errors
   - All 162 tests must pass

---

## 🎯 Recommended Next Action

**⭐ IMPLEMENT FUZZY SEARCH ⭐**

This is the highest-impact, lowest-effort improvement you can make right now:

1. **Quick Win:** 1-2 hours of work
2. **High Impact:** Immediate UX improvement
3. **Low Risk:** No database changes
4. **User Delight:** No more "no results found" frustration

**Steps:**
```bash
cd backend
npm install fuse.js

# Update oysterController.ts search function
# Test with: "Kumaoto" should find "Kumamoto"

npm test
git add .
git commit -m "feat: add fuzzy search for oyster names"
git push origin main
```

Railway will auto-deploy, and users will immediately benefit from better search!

---

## 🚀 FUTURE ROADMAP - V2 Features

### Priority 2: Code Quality & Documentation
**Status:** Backlog
**Estimated Time:** 8-12 hours

**Goals:**
- Add comprehensive comments to all major files
- Document function purposes and complex logic
- Improve code maintainability

**Target Areas:**
- All controllers (auth, oyster, review, vote, user)
- Business logic services (ratingService, voteService)
- Complex middleware (validation, rate limiting)
- React Native screens and components
- API routes and endpoints

**Template:**
```typescript
/**
 * Calculates weighted oyster rating based on user reviews and seed data
 * @param oysterId - UUID of oyster to calculate rating for
 * @returns Aggregated rating object with overall score and attribute breakdown
 *
 * Algorithm:
 * - First 5 reviews: 100% seed data
 * - After 5 reviews: 70% user ratings + 30% seed data
 * - Overall score: 40% rating + 60% attributes
 */
```

---

### Priority 3: App Store Deployment Preparation
**Status:** Backlog - Target: End of Month
**Estimated Time:** 16-24 hours

**Apple App Store Requirements:**
- [ ] Review Apple App Store guidelines
- [ ] Ensure COPPA compliance (if applicable)
- [ ] Add privacy policy (required for both stores)
- [ ] Add terms of service
- [ ] Implement in-app privacy disclosures
- [ ] Add app screenshots and preview video
- [ ] Set up Apple Developer account ($99/year)
- [ ] Configure App Store Connect
- [ ] Test with TestFlight beta
- [ ] Submit for review

**Google Play Store Requirements:**
- [ ] Review Google Play policies
- [ ] Create privacy policy URL
- [ ] Add data safety section disclosures
- [ ] Configure Play Console
- [ ] Generate signed release build
- [ ] Create store listing (screenshots, description)
- [ ] Set up internal testing track
- [ ] Submit for review

**Security Checklist:**
- [ ] No hardcoded secrets or API keys
- [ ] HTTPS for all API calls ✅ (Already done)
- [ ] Proper input validation ✅ (Already done)
- [ ] Rate limiting ✅ (Already done)
- [ ] Secure token storage ✅ (AsyncStorage encrypted on device)
- [ ] Add certificate pinning (optional, high security)
- [ ] Implement biometric authentication (future enhancement)

**Target Launch Date:** End of Month

---

### Priority 4: Photo Upload System
**Status:** Backlog
**Estimated Time:** 20-30 hours

**Features:**

1. **User Profile Photos**
   - Upload profile picture during registration or from settings
   - Crop and resize functionality
   - Display on user profile and reviews

2. **Oyster Photos**
   - Official oyster photos (admin-uploaded)
   - Photo gallery on oyster detail page
   - Multiple photos per oyster

3. **Review Photos**
   - Users can attach photos when submitting reviews
   - Photo carousel in review cards
   - Up to 3 photos per review

**Technical Implementation:**

**Storage Options:**
- **Cloudinary** (Recommended)
  - Free tier: 25GB storage, 25GB bandwidth/month
  - Automatic image optimization
  - CDN delivery
  - Built-in transformations (resize, crop)

**Backend Changes:**
```prisma
model User {
  profilePhotoUrl String?
}

model Oyster {
  photos OysterPhoto[]
}

model OysterPhoto {
  id        String   @id @default(uuid())
  url       String
  oysterId  String
  isOfficial Boolean @default(false)
  uploadedBy String?
  createdAt DateTime @default(now())
}

model Review {
  photos ReviewPhoto[]
}

model ReviewPhoto {
  id       String @id @default(uuid())
  url      String
  reviewId String
  order    Int
}
```

**Mobile Changes:**
- Install `expo-image-picker`
- Add image upload component
- Compress images before upload
- Show upload progress

**Estimated Costs:** Free (Cloudinary free tier sufficient for testing)

---

### Priority 5: Web Application
**Status:** Backlog
**Estimated Time:** 60-80 hours

**Goals:**
- Full-featured web version of Oysterette
- Shared authentication with mobile app
- Responsive design (desktop, tablet, mobile web)

**Tech Stack:**
- **Next.js 14** (React framework with App Router)
- **TailwindCSS** (styling)
- **Same backend API** (already deployed on Railway)
- **Shared auth system** (JWT tokens work across platforms)

**Features to Port:**
1. User authentication (login, register, OAuth)
2. Oyster browsing and search
3. Oyster detail pages
4. Review submission
5. Voting on reviews
6. User profiles
7. Settings and preferences
8. Dark mode (syncs with mobile)

**Deployment:**
- **Vercel** (free tier, optimized for Next.js)
- Custom domain: oysterette.app or oysterette.com
- SSL/HTTPS automatic

**Benefits:**
- Reach desktop users
- SEO for oyster listings (Google search visibility)
- Easier sharing of oyster pages
- Better for data entry (admin functions)

**Domain Setup:**
- Purchase domain (~$12/year for .app, ~$15/year for .com)
- Configure DNS on Vercel
- Set up SSL certificate (automatic)

---

### Priority 6: Admin Dashboard & Management System
**Status:** Backlog
**Estimated Time:** 40-50 hours

**Features:**

**1. Admin Portal (Web-based)**
- Separate admin login (admin role in database)
- Dashboard with statistics:
  - Total users, oysters, reviews
  - Recent activity feed
  - Flagged content count

**2. Oyster Management**
- View all oysters in sortable table
- Edit oyster details (name, origin, species, attributes)
- Add new oysters with full details
- Delete oysters (with confirmation)
- See rating calculation breakdown
- Manually adjust ratings if needed
- View review history per oyster

**3. Review Moderation**
- Queue for flagged reviews (profanity, spam)
- Approve or reject reviews
- Edit review text if needed
- Delete inappropriate reviews
- Ban users for violations

**4. User Management**
- View all users
- See user stats (reviews, credibility, votes)
- Ban/suspend users
- Reset user passwords
- View user review history

**5. Oyster Submission Queue**
- User-submitted oyster suggestions
- Review submitted data (name, origin, species)
- Approve to add to database
- Reject with optional reason
- Edit before approving

**Database Schema Changes:**
```prisma
model User {
  role String @default("user") // "user" | "admin"
}

model OysterSubmission {
  id           String   @id @default(uuid())
  name         String
  origin       String?
  species      String?
  submittedBy  String
  status       String   @default("pending") // "pending" | "approved" | "rejected"
  createdAt    DateTime @default(now())
  reviewedBy   String?
  reviewedAt   DateTime?
  rejectionReason String?
}

model FlaggedReview {
  id         String   @id @default(uuid())
  reviewId   String
  reason     String   // "profanity" | "spam" | "inappropriate"
  status     String   @default("pending") // "pending" | "approved" | "removed"
  flaggedAt  DateTime @default(now())
  reviewedBy String?
  reviewedAt DateTime?
}
```

**Profanity Detection:**
- Use library like `bad-words` or `profanity-check`
- Auto-flag reviews for manual review
- Configurable word list

**Implementation:**
- Build as Next.js web app (admin.oysterette.app)
- Protect all routes with admin role check
- Use same Railway backend API with admin endpoints

---

### Priority 7: Enhanced UX & Bug Fixes
**Status:** Backlog
**Estimated Time:** 12-16 hours

**Issues to Fix:**

1. **Add Oyster Screen - Attribute Input**
   - Replace number input boxes with sliders
   - Add emoji buttons (LOVED IT, LIKED IT, MEH, HATED IT)
   - Make UI consistent with review submission

2. **Keyboard Handling**
   - Fix keyboard covering "standout notes" field
   - Apply same KeyboardAvoidingView fix from AddReviewScreen

3. **Missing Fields on Review Screen**
   - When oyster lacks Origin or Species, show fields to add them
   - Submit updates to oyster submission queue for admin approval

4. **New Oyster Validation**
   - Require origin and species when adding oyster
   - If user doesn't know, send to approval queue
   - Admin can fill in missing details before approval

5. **Navigation Updates**
   - Add "Log In" button to top left when not logged in
   - Keep settings gear icon on top right
   - Update all screen headers with conditional login button

**File Changes Needed:**
- `AddOysterScreen.tsx` - Replace inputs with sliders/emoji buttons
- `OysterDetailScreen.tsx` - Add edit fields for missing origin/species
- `App.tsx` - Add conditional login button to header
- Backend: Add oyster submission queue endpoints

---

### Priority 8: Personalized Recommendations
**Status:** Backlog
**Estimated Time:** 16-24 hours

**Goal:** "Would you like this oyster based on what you rated similarly?"

**Features:**

**1. Recommendation Algorithm**
- Analyze user's review history
- Find attribute patterns (e.g., user likes creamy, sweet oysters)
- Suggest oysters matching those attributes
- Weight by overall rating

**Example:**
- User rates highly: Kusshi (creamy 8, sweet 7)
- User rates highly: Kumamoto (creamy 9, sweet 8)
- System detects: User likes creamy, sweet oysters
- Recommends: Shigoku (creamy 8, sweet 7)

**2. Collaborative Filtering**
- Find users with similar taste profiles
- Recommend oysters they rated highly
- "Users who liked X also liked Y"

**3. Homepage Updates**
- Replace current list with personalized feed
- "Recommended for You" section at top
- "Top Rated" section below
- "Recently Added" section
- Easy navigation to full oyster list

**Implementation:**
- New backend endpoint: `/api/users/:userId/recommendations`
- Calculate similarity scores for all oysters
- Return top 10 matches
- Cache results for performance

**Algorithm Pseudocode:**
```typescript
function getRecommendations(userId: string) {
  // Get user's reviews
  const userReviews = await getReviews(userId);

  // Calculate average preferences
  const avgPreferences = calculateAverageAttributes(userReviews);

  // Find oysters user hasn't reviewed
  const unreviewed = await getUnreviewedOysters(userId);

  // Calculate similarity scores
  const scored = unreviewed.map(oyster => ({
    oyster,
    similarity: calculateSimilarity(avgPreferences, oyster.attributes)
  }));

  // Sort by similarity
  return scored.sort((a, b) => b.similarity - a.similarity).slice(0, 10);
}
```

---

### Priority 9: Homepage Redesign
**Status:** Backlog
**Estimated Time:** 8-12 hours

**Current Issues:**
- Home screen is just a welcome message
- Users must navigate to "Browse" to see oysters
- Wasted screen space

**New Design:**

**Option A: Direct to Oyster List (Simplest)**
- Remove home screen entirely
- Default screen is Browse with search
- Bottom tabs: Browse, Profile, Settings

**Option B: Enhanced Home with Quick Actions (Recommended)**
- **Hero Section:**
  - Welcome message
  - Search bar (immediate oyster search)
  - Quick stats: "838 Oysters • 1,234 Reviews"

- **Recommended for You** (if logged in)
  - Horizontal scroll of 5-10 personalized oysters
  - "See All" button

- **Top Rated This Week**
  - Horizontal scroll of highest-rated oysters
  - Drives engagement

- **Recently Added**
  - Newest oysters in database
  - Keeps content fresh

- **Quick Actions**
  - "Browse All Oysters" button
  - "Add Your Review" button
  - "Submit New Oyster" button

**Implementation:**
- Update `HomeScreen.tsx` with new layout
- Add horizontal ScrollView components
- Use existing API endpoints
- Add skeleton loaders for smooth UX

---

## 📋 COMPREHENSIVE PRIORITY ORDER

### Phase 1: Core Improvements (In Progress)
1. ✅ OAuth Implementation (Current Task)
2. Code Documentation
3. App Store Compliance & Security Audit

### Phase 2: User Experience (Next Up)
4. UX Bug Fixes (sliders, keyboard, missing fields)
5. Navigation Updates (login button, etc.)
6. Homepage Redesign

### Phase 3: Growth Features
7. Photo Upload System
8. Personalized Recommendations
9. Enhanced Search & Filters

### Phase 4: Platform Expansion
10. Web Application (Next.js)
11. Admin Dashboard & Management
12. Oyster Submission Queue
13. Review Moderation System

### Phase 5: Long-term Enhancements
14. iOS App Store Launch
15. Advanced Analytics
16. Social Features (following users, sharing reviews)
17. Export/Import Data

---

**Generated:** November 4, 2025
**Backend:** Live on Railway with security hardening
**Database:** Live on Neon
**Tests:** 162/162 passing ✅
**Status:** Production-ready, preparing for OAuth and App Store deployment
