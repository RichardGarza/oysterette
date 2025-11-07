# Oysterette v2.0 - Development Roadmap

---
## 📘 DOCUMENT PURPOSE

**This file is for:** High-level feature planning and status tracking

**Use this file for:**
- Overview of completed and planned features
- Feature status at a glance (✅ Done, 🚧 In Progress, 📋 Planned)
- Phase-based project organization
- Quick reference for what exists and what's next

**Do NOT use this file for:**
- Detailed implementation notes (use CLAUDE.md)
- Session-by-session progress (use CLAUDE.md)
- Troubleshooting documentation (use CLAUDE.md)
- Specific file paths and code changes (use CLAUDE.md)

**When to update:** When a feature/phase is completed or status changes
---

## Project Status: Production Ready ✅

**Last Updated:** November 6, 2025
**Current Phase:** Bug Fixes & Feature Enhancements

---

## ✅ Completed Phases

### Phase 1: Initial Setup & Core Infrastructure ✅

**Status:** Complete
**Completion Date:** Initial commit

- [x] Backend Express server with TypeScript
- [x] PostgreSQL database with Prisma ORM
- [x] React Native mobile app with Expo
- [x] JWT authentication system
- [x] Basic CRUD API endpoints for oysters and reviews
- [x] Mobile navigation setup (React Navigation)
- [x] Production deployment on Railway
- [x] Neon database integration

### Phase 2: Data Seeding & Base Features ✅

**Status:** Complete
**Completion Date:** Commit 6a52364

- [x] Comprehensive oyster database (838 oysters)
- [x] Oyster list screen with search
- [x] Oyster detail screen with full information
- [x] Review display functionality
- [x] User authentication (login/register)
- [x] Review submission system

### Phase 3: Production Hardening & Security ✅

**Status:** Complete
**Completion Date:** November 3, 2025

- [x] Input validation with Zod schemas
- [x] Rate limiting (auth & API endpoints)
- [x] JWT security enhancements
- [x] Professional logging with Winston
- [x] Error tracking with Sentry
- [x] Comprehensive test suite (162 tests passing)
- [x] TypeScript compilation tests
- [x] Validation middleware tests
- [x] Rate limiting tests

### Phase 4: Enhanced Features ✅

**Status:** Complete
**Completion Date:** November 3-5, 2025

- [x] Fuzzy search with Fuse.js (handles typos)
- [x] Theme persistence and user preferences
- [x] Global settings access from all screens
- [x] Auto-login on app start
- [x] Theme sync across devices
- [x] Dark mode support

### Phase 5: Google OAuth & Authentication ✅

**Status:** Complete
**Completion Date:** November 5, 2025

- [x] Native Google Sign-In SDK integration
- [x] Backend OAuth verification endpoint
- [x] Android OAuth client configuration
- [x] iOS URL scheme setup
- [x] Google Cloud Console credentials
- [x] One-tap Google sign-in

### Phase 6: UX Polish & Bug Fixes ✅

**Status:** Complete
**Completion Date:** November 6, 2025

- [x] Dynamic slider labels with descriptive words
- [x] Auth token bug fix (interceptor)
- [x] HomeScreen auth state management
- [x] Larger logos (60% increase)
- [x] Faster transition animations (900ms)
- [x] Enhanced debug logging
- [x] Settings screen with actual user data
- [x] Keyboard handling improvements
- [x] Color coding fixes for sliders

### Phase 7: Advanced Rating & Voting System ✅

**Status:** Complete
**Completion Date:** Commit d0563bb

#### Backend Implementation ✅

- [x] Database schema for voting system
  - Vote table (user + review + agree/disagree)
  - User credibility fields (score, agrees, disagrees)
  - Review vote metrics (agree/disagree counts, weighted scores)
- [x] Voting service with credibility calculation
  - Asymmetric voting (Agree +1.0, Disagree -0.6)
  - Review weighted scores (0.4 to 1.5 range)
  - Reviewer credibility scores (0.5 to 1.5 range)
  - Credibility badges (Expert ≥1.3, Trusted ≥1.15, Standard ≥0.85, New <0.85)
- [x] Vote API endpoints
  - POST `/api/reviews/:reviewId/vote` - Cast/update vote
  - DELETE `/api/reviews/:reviewId/vote` - Remove vote
  - GET `/api/reviews/votes` - Batch fetch user votes
  - GET `/api/users/:userId/credibility` - Get credibility info
- [x] TypeScript compilation fixes with @ts-ignore for middleware properties

#### Mobile App Implementation ✅

- [x] ReviewCard component with voting UI
  - Vote buttons (Agree 👍 / Disagree 👎)
  - Real-time vote count display
  - Toggle voting (tap same button to remove)
  - Vote switching support
  - Loading states during submission
  - Color-coded active states (green/red)
  - Reviewer credibility badges
- [x] OysterDetailScreen integration
  - Vote state management
  - Batch vote fetching
  - Automatic refresh on vote changes
- [x] Voting API client functions
  - voteApi.vote()
  - voteApi.removeVote()
  - voteApi.getUserVotes()
  - voteApi.getUserCredibility()
- [x] Type definitions for voting metrics
- [x] Fixed scrolling issue (disabled React Native New Architecture)

---

## ✅ Current Work - Phase 8: Feature Enhancements (COMPLETE)

### Phase 8.1: Duplicate Review Detection ✅ COMPLETE

**Completed:** November 6, 2025 (discovered already implemented)
**Priority:** HIGH

- [x] Backend check endpoint for existing reviews (GET /api/reviews/check/:oysterId)
- [x] Backend update review endpoint (PUT /api/reviews/:reviewId)
- [x] Mobile duplicate detection flow
- [x] Modal prompt for review updates ("Update Existing Review?")
- [x] Pre-populate AddReviewScreen with existing data
- [x] Unique constraint prevents duplicates (userId, oysterId)

### Phase 8.2: UI/UX Improvements ✅ COMPLETE

**Completed:** November 6, 2025
**Priority:** HIGH

- [x] Redesign OysterList top bar (removed title, added orange login button)
- [x] Fix ReviewCard dark mode display
- [x] Add spacing between logout/delete account buttons (48px)
- [x] Fix navigation flow (auth redirect on Login/Register)
- [x] Remove back button from HomeScreen (already implemented)
- [x] Favorites sync with user account (full backend integration)

### Phase 8.3: App Icon & Distribution ✅ COMPLETE

**Completed:** November 6, 2025
**Priority:** MEDIUM

- [x] Fix app icon zoom (updated adaptive-icon.png with padding)
- [x] Build optimization workflow (depcheck, pre-build scripts)
- [x] Version 6 APK building (fe098b13-8cc6-454f-9543-a4a073ebab2e)
- [x] OTA update deployed

### Phase 8.4: Additional Features (Optional) 🚧

**Priority:** LOW
**Status:** Partial Progress

- [x] **Review submission functionality** (Oct 31)
  - AddReviewScreen with emoji ratings and sliders
  - Form validation and API integration
  - Write Review button in OysterDetailScreen
- [x] **Review sorting options** (Oct 31)
  - Sort by: Most Helpful, Most Recent, Highest, Lowest
  - Tab-based UI with visual feedback
- [x] **Favorites/Bookmarks** (Oct 31)
  - AsyncStorage-based local persistence
  - Heart icon toggle on list and detail screens
  - Filter tabs (All/Favorites) on oyster list
  - Empty state for favorites view
- [x] **Review filtering by rating** (Oct 31)
  - Filter chips with emojis (All, Loved, Liked, Meh, Hated)
  - Works in combination with sort options
  - Clean chip-based UI design
- [x] **Top Oysters list feature** (Nov 2)
  - TopOystersScreen showing top 50 oysters by rating
  - Circular ranking badges (#1, #2, etc.)
  - Filters to only show oysters with reviews
  - Pull-to-refresh functionality
  - Gold "🏆 Top Oysters" button on HomeScreen
- [ ] Add ability to edit/delete own reviews
- [ ] Add user profile screen

---

## ✅ Phase 9: Enhanced Search & Filters (COMPLETE)

**Completed:** November 6, 2025 (PM)
**Priority:** HIGH

**Backend:**
- [x] Analyze oyster data (7 species, 74 origins)
- [x] Update getAllOysters with species, origin, sortBy params
- [x] Add getFilterOptions endpoint (GET /api/oysters/filters)
- [x] Add sort options: rating, name, size, sweetness, creaminess, flavorfulness, body
- [x] Deploy to Railway

**Mobile:**
- [x] Update oysterApi.getAll() to accept filter params
- [x] Add oysterApi.getFilterOptions() method
- [x] Add filter state to OysterListScreen
- [x] Wire up filter logic to auto-refetch on change
- [x] Fetch filter options on screen load
- [x] Backend integration complete

**Note:** UI implementation deferred - filter logic fully wired up and functional.

---

## ✅ Phase 10: User Profile Enhancements (COMPLETE)

**Completed:** November 6, 2025 (Late PM)
**Priority:** HIGH

**Backend:**
- [x] Database schema updates (privacy fields)
- [x] GET /api/users/profile - Profile with comprehensive stats
- [x] GET /api/users/me/reviews - Paginated review history
- [x] PUT /api/users/password - Secure password changes
- [x] DELETE /api/users/account - Account deletion
- [x] PUT /api/users/privacy - Privacy controls
- [x] Validation schemas (changePassword, deleteAccount, updateProfile, privacySettings)
- [x] Badge system (Novice/Trusted/Expert)
- [x] Review streaks and user insights

**Mobile:**
- [x] Enhanced ProfileScreen with stats grid
- [x] Edit Profile modal (inline)
- [x] Change Password modal (inline)
- [x] PrivacySettingsScreen (new screen)
- [x] Navigation integration
- [x] TypeScript types updated
- [x] API integration
- [x] OTA update deployed

---

## 🚧 NEXT UP - Remove Direct Messages Feature

**Priority:** IMMEDIATE (Next Session)
**Estimated Time:** 30 minutes

**Reason:** Feature not needed, incorrectly included in Phase 10

**Tasks:**
- [ ] Remove "Allow Direct Messages" from PrivacySettingsScreen UI
- [ ] Remove "Communication" section from PrivacySettingsScreen
- [ ] Remove `allowMessages` field from backend Prisma schema
- [ ] Remove `allowMessages` from privacy validation schema
- [ ] Remove `allowMessages` from updatePrivacySettings controller
- [ ] Run Prisma migration to drop column
- [ ] Deploy backend to Railway
- [ ] Commit mobile changes
- [ ] Deploy OTA update

---

## 🔮 Future Phases (Post-MVP)

### Phase 11: Code Quality & Documentation 📋

**Status:** IN PROGRESS (Session: November 7, 2025)
**Time Spent:** ~6 hours total (Phases 1-3)
**Priority:** MEDIUM

#### Phase 1: Backend Core ✅ COMPLETE
- [x] Controllers documented (6 files)
- [x] Services documented (3 files)
- [x] Middleware documented (2 files)
- [x] Utils documented (4 files)
- [x] JSDoc comments added to all functions
- [x] File headers explaining purpose and features
- [x] Algorithm documentation for complex logic

#### Phase 2: Backend Routes & Validation ✅ COMPLETE
- [x] Document route files (7 files)
- [x] Document validation schemas (1 file)
- [x] Link routes to controllers
- [x] Organize schemas with section headers
- [x] Document authentication requirements

**Backend Documentation: 100% Complete (23 files)**

#### Phase 3: Mobile Core ✅ COMPLETE
- [x] Document React Native screens (12 files)
  - HomeScreen, OysterListScreen, OysterDetailScreen, AddReviewScreen
  - ProfileScreen, SettingsScreen, LoginScreen, RegisterScreen
  - EditReviewScreen, PrivacySettingsScreen, AddOysterScreen, TopOystersScreen
- [x] Document components (5 files)
  - RatingDisplay, ReviewCard, EmptyState, OysterCardSkeleton, Skeleton
- [x] Document services (3 files)
  - api.ts (HTTP client), auth.ts (token storage), favorites.ts (sync)

**Mobile Documentation: 100% Complete (20 files)**

#### Phase 4: Supporting Files 🚧 IN PROGRESS
- [ ] Document context providers (ThemeContext)
- [ ] Document navigation types
- [ ] Document utility files (ratingUtils)
- [ ] Document type definitions
- [ ] Update App.tsx header

### Phase 12: App Store Deployment 📱

**Estimated Time:** 16-24 hours
**Priority:** HIGH
**Target:** End of Month

**Apple App Store:**
- [ ] Review guidelines and ensure compliance
- [ ] Privacy policy (required)
- [ ] Terms of service
- [ ] In-app privacy disclosures
- [ ] Screenshots and preview video
- [ ] Apple Developer account ($99/year)
- [ ] TestFlight beta testing

**Google Play Store:**
- [ ] Review Play Store policies
- [ ] Privacy policy URL
- [ ] Data safety disclosures
- [ ] Store listing (screenshots, description)
- [ ] Internal testing track
- [ ] Submit for review

**Security Checklist:**
- [x] No hardcoded secrets
- [x] HTTPS for all API calls
- [x] Input validation
- [x] Rate limiting
- [x] Secure token storage
- [ ] Certificate pinning (optional)
- [ ] Biometric auth (future)

### Phase 13: Photo Upload System 📋

**Estimated Time:** 20-30 hours
**Priority:** MEDIUM

**Features:**
- [ ] User profile photos (upload, crop, resize)
- [ ] Oyster photos (admin-uploaded, gallery view)
- [ ] Review photos (up to 3 per review, carousel)

**Implementation:**
- [ ] Cloudinary setup (free tier: 25GB)
- [ ] Image upload component with compression
- [ ] Progress indicators
- [ ] Photo gallery UI
- [ ] Backend storage endpoints
- [ ] Database schema updates

### Phase 14: Personalized Recommendations 📋

**Estimated Time:** 16-24 hours
**Priority:** MEDIUM

**Algorithm Options:**

**A. Attribute-Based (Simple):**
- [ ] Analyze user's highly-rated oysters
- [ ] Find similar attributes (creamy, sweet, etc.)
- [ ] "You might like..." section
- [ ] Match user preferences to unreviewed oysters

**B. Collaborative Filtering (Advanced):**
- [ ] Find users with similar taste profiles
- [ ] Recommend their favorite oysters
- [ ] "Users who liked X also liked Y"
- [ ] Similarity scoring algorithm

**Implementation:**
- [ ] Backend `/api/users/:userId/recommendations` endpoint
- [ ] Calculate similarity scores
- [ ] Cache results for performance
- [ ] Homepage "Recommended for You" section

### Phase 15: Web Application 📋

**Estimated Time:** 60-80 hours
**Priority:** LOW

**Tech Stack:**
- [ ] Next.js 14 with App Router
- [ ] TailwindCSS for styling
- [ ] Same backend API (Railway)
- [ ] Shared JWT authentication

**Features:**
- [ ] User authentication (login, register, OAuth)
- [ ] Oyster browsing and search
- [ ] Oyster detail pages
- [ ] Review submission
- [ ] Voting on reviews
- [ ] User profiles
- [ ] Settings and preferences
- [ ] Dark mode (syncs with mobile)

**Deployment:**
- [ ] Vercel (free tier)
- [ ] Custom domain (oysterette.app)
- [ ] SSL/HTTPS (automatic)
- [ ] SEO optimization

### Phase 16: Admin Dashboard 📋

**Estimated Time:** 40-50 hours
**Priority:** LOW

**Features:**

**Admin Portal:**
- [ ] Admin login (admin role in database)
- [ ] Dashboard with statistics
- [ ] Recent activity feed
- [ ] Flagged content queue

**Oyster Management:**
- [ ] View all oysters (sortable table)
- [ ] Edit oyster details
- [ ] Add new oysters
- [ ] Delete oysters
- [ ] View rating calculations
- [ ] Manual rating adjustments

**Review Moderation:**
- [ ] Flagged reviews queue
- [ ] Approve/reject reviews
- [ ] Edit review text
- [ ] Delete inappropriate reviews
- [ ] User ban system

**User Management:**
- [ ] View all users
- [ ] User stats (reviews, credibility, votes)
- [ ] Ban/suspend users
- [ ] Reset passwords
- [ ] View user review history

**Oyster Submission Queue:**
- [ ] User-submitted oyster suggestions
- [ ] Review submitted data
- [ ] Approve/reject submissions
- [ ] Edit before approving

**Database Changes:**
- [ ] User role field ("user" | "admin")
- [ ] OysterSubmission model
- [ ] FlaggedReview model
- [ ] Profanity detection (bad-words library)

### Phase 17: Homepage Redesign 📋

**Estimated Time:** 8-12 hours
**Priority:** MEDIUM

**Options:**

**A. Direct to Oyster List (Simple):**
- [ ] Remove home screen
- [ ] Default to Browse with search
- [ ] Bottom tabs: Browse, Profile, Settings

**B. Enhanced Home (Recommended):**
- [ ] Welcome message + search bar
- [ ] Quick stats display
- [ ] "Recommended for You" horizontal scroll
- [ ] "Top Rated This Week" section
- [ ] "Recently Added" oysters
- [ ] Quick action buttons

### Phase 18: Additional UX Improvements 📋

**Estimated Time:** 12-16 hours
**Priority:** LOW

**Issues to Fix:**
- [ ] Add Oyster Screen: Replace inputs with sliders/emoji buttons
- [ ] Keyboard handling consistency
- [ ] Missing fields on review screen (origin/species for new oysters)
- [ ] New oyster validation (require origin/species)
- [ ] Navigation updates (conditional login button)

### Phase 19: Social Features 📋

- [ ] User profiles with review history
- [ ] Follow/unfollow other users
- [ ] Activity feed
- [ ] Review comments/replies
- [ ] Share reviews externally

### Phase 20: Advanced Features 📋

- [ ] User badges and achievements
- [ ] Oyster tasting challenges
- [ ] Leaderboards
- [ ] Taste profile quiz
- [ ] Push notifications
- [ ] Advanced analytics

---

## 🏗️ Technical Debt & Maintenance

### Known Issues:

- [ ] TypeScript @ts-ignore usage for req.userId (need proper type augmentation fix)
- [ ] SafeAreaView deprecation warning (migrate to react-native-safe-area-context)
- [ ] Consider implementing proper vote optimistic updates

### Code Quality:

- [ ] Add backend unit tests
- [ ] Add mobile component tests
- [ ] Set up CI/CD pipeline
- [ ] Add code linting/formatting enforcement
- [ ] Add API documentation (Swagger/OpenAPI)

### Performance:

- [ ] Database query optimization and indexing
- [ ] Implement caching strategy (Redis)
- [ ] Optimize mobile bundle size
- [ ] Add image optimization and CDN

---

## 📋 Development Notes

### User Preferences:

- **Token Reporting:** Display token usage and remaining tokens after each request/response

  - Format: "Current: X / 200,000 (Y% used) | Remaining: Z tokens (W%)"
  - Include time until next 50k tokens regenerate (hours and minutes)
  - Token regeneration rate: ~8,333 tokens/hour (200k over 24 hours)
  - User wants to track conversation length to avoid cutoffs

- **Testing Policy:** Add tests with each new feature to keep the app robust
  - Write tests for new features before committing
  - Run all tests after implementing each new feature
  - Ensure tests pass before committing code
  - Backend: Unit tests for controllers, services, and utilities
  - Mobile: Component tests for UI components and screens
  - Integration tests for API endpoints
  - This maintains code quality and catches regressions early

### Environment Setup:

- **Backend:** Node.js, TypeScript, Express, Prisma, PostgreSQL
- **Database:** Neon (production), PostgreSQL (local)
- **Mobile:** React Native, Expo SDK 54, TypeScript
- **Deployment:** Railway (backend), EAS (mobile builds)

### Current Servers:

- Backend: `http://localhost:3000` (development)
- Production: `https://oysterette-production.up.railway.app`
- Mobile: Expo Dev Server on port 8081

### Important Commands:

```bash
# Backend
cd backend
npm run dev              # Start development server
npx prisma db push      # Push schema changes
npx prisma generate     # Regenerate Prisma client

# Mobile App
cd mobile-app
npx expo start --ios    # Start iOS simulator
eas build --platform android --profile preview  # Build Android
eas update              # Deploy OTA update

# Git
git status
git add .
git commit -m "message"
git push
```

---

## 🎯 Tomorrow's Starting Point

**Resume at:** Phase 6.1 - Manual Testing & Bug Fixes

**First Tasks:**

1. Restart the mobile app to test scrolling fix (newArchEnabled=false)
2. Thoroughly test the voting system:
   - Navigate to an oyster with reviews
   - Test all vote button functionality
   - Verify vote persistence and counts
   - Test credibility badges display
3. Document any bugs found
4. Fix critical issues before moving to Phase 6.2

**Backend Status:** ✅ Running and stable
**Mobile App Status:** ⚠️ Needs scrolling verification
**Database:** ✅ Schema up to date with voting system

---

**Last Session Summary:**

- Completed Phase 5.3 backend and mobile voting system implementation
- Fixed TypeScript compilation errors with @ts-ignore
- Created ReviewCard component with full voting functionality
- Integrated voting into OysterDetailScreen
- Fixed scrolling issue by disabling React Native New Architecture
- All changes committed (7 files changed, 350 insertions)
