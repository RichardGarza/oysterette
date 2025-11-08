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

**Last Updated:** November 7, 2024
**Current Phase:** App Store Submission Preparation

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

- [x] Comprehensive oyster database (850+ oysters)
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
- [x] Add ability to edit/delete own reviews (EditReviewScreen + ReviewCard buttons)
- [x] Add user profile screen (ProfileScreen exists)

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

#### Phase 4: Supporting Files ✅ COMPLETE
- [x] Document context providers (ThemeContext)
- [x] Document navigation types
- [x] Document utility files (ratingUtils)
- [x] Document type definitions (Oyster.ts)
- [x] Update App.tsx header

**Supporting Files: 100% Complete (5 files)**

---

### Phase 11 Complete! ✅

**Total Documentation:**
- Backend: 23 files (Controllers, Services, Middleware, Routes, Utils, Validation)
- Mobile: 25 files (Screens, Components, Services, Context, Types, Utils, Root)
- **Grand Total: 48 files fully documented**

**Time Spent:** ~7-8 hours
**Completion Date:** November 7, 2025

### Phase 12: App Store Deployment Documentation ✅

**Completed:** November 7, 2025
**Time Spent:** ~4 hours
**Priority:** HIGH

**Legal Documents Created:**
- [x] Privacy Policy (GDPR/CCPA compliant, 478 lines)
- [x] Terms of Service (with arbitration clause, 439 lines)
- [x] Data Safety Disclosure (Google Play form responses, 348 lines)

**Store Submission Materials:**
- [x] App Store Metadata (descriptions, keywords, categories, 512 lines)
- [x] Screenshot Specifications (exact requirements for both stores, 501 lines)
- [x] Compliance Checklist (pre-submission verification, 528 lines)
- [x] Submission Guide (step-by-step instructions for both stores)
- [x] Deployment Plan (comprehensive roadmap, 368 lines)

**Critical Findings:**
- ⚠️ **MUST ADD:** Sign in with Apple (Apple requires it if offering Google Sign-In)
- ⚠️ **MUST HOST:** Privacy Policy & Terms on public URLs before submission
- ✅ **READY:** All compliance requirements documented
- ✅ **READY:** Technical infrastructure (Railway + Neon)

**Security Checklist:**
- [x] No hardcoded secrets
- [x] HTTPS for all API calls
- [x] Input validation
- [x] Rate limiting
- [x] Secure token storage
- [x] Password hashing (bcrypt)
- [x] JWT authentication
- [ ] Certificate pinning (optional, future)
- [ ] Biometric auth (future)

**GitHub Pages Hosting (Completed Nov 7, 2025 Night):**
- [x] Host Privacy Policy & Terms (GitHub Pages)
- [x] HTML versions of all legal documents
- [x] Mobile app integration (Settings → Legal)
- [x] Update all documentation with live URLs
- **Live Site:** https://richardgarza.github.io/oysterette/docs/

**Compliance Status:**
- **Apple App Store:** 95% (was 90%)
- **Google Play Store:** 100% documentation-ready! 🎉

**Next Steps (Actual Submission):**
- [ ] Add Sign in with Apple (2-4 hours, CRITICAL for Apple)
- [ ] Capture screenshots (1-2 hours)
- [ ] Generate production builds via EAS
- [ ] TestFlight beta testing (Apple, optional)
- [ ] Submit to App Store Connect (Apple)
- [ ] Submit to Play Console (Google)

**Total Documentation:** 8 comprehensive documents (3,325+ lines)
**Files Location:** `docs/` directory + `DEPLOYMENT_PLAN.md`
**Live Documentation:** https://richardgarza.github.io/oysterette/docs/

### Phase 13: Baseline Flavor Profile & Personalized Recommendations ✅

**Status:** Complete
**Completion Date:** November 7, 2024
**Implementation Time:** ~8 hours

**Backend Features:**
- [x] Baseline flavor profile storage (5 attributes: size, body, sweetBrininess, flavorfulness, creaminess)
- [x] Automatic baseline updates from LOVE_IT reviews (exponential moving average, α=0.3)
- [x] Manual flavor profile setting endpoint (`PUT /api/users/flavor-profile`)
- [x] Similarity scoring algorithm (Euclidean distance, 0-100 scale)
- [x] Personalized recommendations endpoint (`GET /api/recommendations`)
- [x] Smart recommendation caching (15-minute TTL per user)
- [x] Exclude already-reviewed oysters from recommendations

**Mobile Features:**
- [x] ProfileScreen flavor display with visual progress bars
- [x] Theme-aware styling (light/dark mode support)
- [x] Conditional rendering (only shows when user has baseline data)

**Algorithm:**
```typescript
// Baseline Update (from LOVE_IT reviews)
newBaseline = currentBaseline * 0.7 + reviewAttribute * 0.3;

// Similarity Scoring (Euclidean distance)
similarity = ((maxDistance - euclideanDistance) / maxDistance) * 100;

// Ranking: Highest similarity first, exclude reviewed oysters
```

**Testing:**
- [x] 13 new integration tests (flavor profile, recommendations, baseline updates)
- [x] 229/229 total tests passing ✅
- [x] Test coverage: flavor profile endpoints, recommendation logic, auto-updates

**Files Modified:**
- Backend: `recommendationService.ts`, `userController.ts`, `userRoutes.ts`
- Mobile: `ProfileScreen.tsx`, `types/Oyster.ts`
- Tests: `backend/src/__tests__/integration/users.test.ts` (new file)

**Impact:** Users now receive personalized oyster recommendations based on their taste preferences, automatically learned from their positive reviews.

---

## 🚨 Phase 14: Production Testing & Critical Bug Fixes 📋

**Status:** PLANNED (Next Session)
**Estimated Time:** 12-16 hours total
**Priority:** CRITICAL (Must complete before App Store submission)
**Test Build Date:** November 7, 2025

**Context:** Issues discovered during production build testing. These must be addressed systematically before public release.

---

### 14.1: Logo & Branding Updates 🎨

**Time:** 45 minutes
**Priority:** HIGH

**Issues Found:**
- "Oysterette" text in header should be replaced with logo image
- New logo file already swapped in `assets/logo.png`
- Logo on homescreen should be larger
- Back button still showing on homepage (needs verification/fix)

**Tasks:**
- [ ] Replace text "Oysterette" in OysterListScreen header with logo image
- [ ] Position logo between back button and settings gear icon
- [ ] Use new logo from `assets/logo.png`
- [ ] Increase logo size on HomeScreen
- [ ] Verify back button removal on HomeScreen (was supposedly done before)
- [ ] Test on both iOS and Android

**Files to Modify:**
- `mobile-app/src/screens/OysterListScreen.tsx`
- `mobile-app/src/screens/HomeScreen.tsx`

---

### 14.2: Review System Overhaul 🔄

**Time:** 4-5 hours
**Priority:** CRITICAL

**Issues Found:**
- Login required to submit reviews (should allow anonymous)
- Camera permissions requested immediately on "Add Review" (should only trigger when adding photos)
- Photo crop step is annoying (should be removed)
- Photo uploads failing (both review photos and profile photos)
- No limit on photos per review (should be 1 max)
- Page doesn't auto-refresh after review submission
- Flavor attributes default to 5 instead of oyster's existing values

**Tasks:**

**Anonymous Review Flow:**
- [ ] Remove login requirement check from AddReviewScreen
- [ ] Add temporary review storage (AsyncStorage or state)
- [ ] Update "Login Required" popup with new options:
  - "Sign In to Save to Profile"
  - "Sign Up to Save to Profile"
  - "Just Post Review" (anonymous)
- [ ] After successful login/signup, post the stored review
- [ ] Show "Review posted!" confirmation
- [ ] Navigate back to oyster detail screen
- [ ] Auto-refresh oyster with new review visible

**Photo System Fixes:**
- [ ] Move camera permission request to photo button press (not screen mount)
- [ ] Remove `allowsEditing: true` from ImagePicker config (eliminates crop)
- [ ] Limit to 1 photo per review (hide add photo button after 1 selected)
- [ ] Debug and fix photo upload failures:
  - Check FormData format
  - Check API endpoint (`/api/upload/image`)
  - Check file size limits
  - Check content-type headers
  - Test on both platforms
- [ ] Fix profile photo upload (same debugging approach)

**Pre-populate Flavor Attributes:**
- [ ] Fetch oyster data before showing AddReviewScreen
- [ ] Set initial slider values to oyster's existing attributes:
  - size → oyster.avgSize
  - body → oyster.avgBody
  - sweetBrininess → oyster.avgSweetBrininess
  - flavorfulness → oyster.avgFlavorfulness
  - creaminess → oyster.avgCreaminess
- [ ] Fallback to 5 if oyster has no reviews yet

**Auto-refresh After Submission:**
- [ ] After successful review POST, trigger oyster detail refresh
- [ ] Update reviews list without manual pull-to-refresh
- [ ] Scroll to new review (optional enhancement)

**Files to Modify:**
- `mobile-app/src/screens/AddReviewScreen.tsx`
- `mobile-app/src/screens/OysterDetailScreen.tsx`
- `mobile-app/src/services/api.ts` (photo upload debugging)

---

### 14.3: Navigation & Back Button Behavior 🔙

**Time:** 1-2 hours
**Priority:** HIGH

**Issues Found:**
- Swiping back from Favorites exits the app (should go to homepage)
- Need "Exit app?" confirmation when pressing back on homepage

**Tasks:**
- [ ] Audit all screen navigation flows
- [ ] Ensure all "back" actions eventually lead to HomeScreen
- [ ] Add back handler to HomeScreen:
  - Show Alert: "Exit Oysterette?"
  - Options: "Stay" (cancel), "Exit" (BackHandler.exitApp())
- [ ] Fix Favorites screen navigation to return to home
- [ ] Test swipe-back gesture on iOS
- [ ] Test hardware back button on Android

**Implementation Notes:**
```typescript
// HomeScreen.tsx
useEffect(() => {
  const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
    Alert.alert('Exit Oysterette?', 'Are you sure you want to exit?', [
      { text: 'Stay', style: 'cancel' },
      { text: 'Exit', onPress: () => BackHandler.exitApp() },
    ]);
    return true; // Prevent default back behavior
  });
  return () => backHandler.remove();
}, []);
```

**Files to Modify:**
- `mobile-app/src/screens/HomeScreen.tsx`
- `mobile-app/App.tsx` (navigation structure review)

---

### 14.4: Rating & Recommendation Logic Enhancements 📊

**Time:** 2-3 hours
**Priority:** HIGH

**Issues Found:**
- All recommended oysters show "5 stars with no reviews" (incorrect)
- Overall Rating should be hidden until oyster has reviews
- Favorited oysters should have more weight in flavor profile calculation
- Top Oysters screen should show numeric rating (e.g., "3.5") next to stars

**Tasks:**

**Fix Overall Rating Display:**
- [ ] Update OysterCard component to check `reviewCount > 0`
- [ ] If no reviews, show "No ratings yet" instead of rating
- [ ] Update RecommendedCard component (same logic)
- [ ] Ensure backend returns `reviewCount` in recommendations

**Weight Favorited Oysters:**
- [ ] Update baseline calculation to detect if reviewed oyster is favorited
- [ ] Apply 1.5x weight to favorited oyster attributes in moving average
- [ ] Formula: `newBaseline = currentBaseline * 0.7 + (reviewAttribute * 1.5) * 0.3` (if favorited)
- [ ] Document in recommendationService.ts

**Show Numeric Rating on Top Oysters:**
- [ ] Update TopOystersScreen card to show "3.5 ⭐⭐⭐✨" format
- [ ] Position numeric rating to left of stars
- [ ] Use `avgRating.toFixed(1)` for display

**Files to Modify:**
- `mobile-app/src/components/OysterCard.tsx` (or wherever cards are)
- `mobile-app/src/screens/TopOystersScreen.tsx`
- `backend/src/services/recommendationService.ts`

---

### 14.5: Filter & Search Algorithm Improvements 🔍

**Time:** 2-3 hours
**Priority:** HIGH

**Issues Found:**
- Selecting "Sweet" filter returns no oysters
- "Briny" and "Small" filters also return no results
- Filters should show closest matches, not just perfect matches
- Size filters should work as: small=1-5, big=5-10 (5 should appear in both)

**Tasks:**

**Fuzzy Filter Matching:**
- [ ] Change filter logic from exact match to range-based matching
- [ ] For attribute filters, use ±2 range from selected value
  - Example: "Sweet" (value 2) → show oysters with sweetBrininess 1-4
  - Example: "Briny" (value 8) → show oysters with sweetBrininess 6-10
- [ ] Sort results by closeness to target value
- [ ] Always return top 20 closest matches (don't return empty)

**Size Filter Fix:**
- [ ] Small filter: avgSize 1-5 (inclusive)
- [ ] Medium filter: avgSize 4-6 (inclusive, overlaps)
- [ ] Large filter: avgSize 5-10 (inclusive, overlaps)
- [ ] Size 5 oysters appear in Small, Medium, and Large filters

**Clear Filters on Search:**
- [ ] When user types in search box, auto-clear all active filters
- [ ] Show toast/message: "Filters cleared"
- [ ] Reset filter UI to default state

**Backend Updates:**
- [ ] Update `getAllOysters` controller filter logic
- [ ] Add range queries instead of exact matches
- [ ] Add sorting by distance from filter target
- [ ] Document filter ranges in comments

**Files to Modify:**
- `backend/src/controllers/oysterController.ts`
- `mobile-app/src/screens/OysterListScreen.tsx`

---

### 14.6: Dark Mode & Theme Fixes 🌓

**Time:** 1 hour
**Priority:** MEDIUM

**Issues Found:**
- Review Oyster screen (AddReviewScreen?) not respecting dark mode
- Top Oysters screen not respecting dark mode
- Light mode: placeholder text "Share your thoughts..." is white on light grey (unreadable)

**Tasks:**
- [ ] Audit AddReviewScreen for theme usage
  - Ensure `useTheme()` hook is called
  - Use `theme.colors.text` for all text
  - Use `theme.colors.background` for backgrounds
  - Check TextInput placeholderTextColor
- [ ] Audit TopOystersScreen for theme usage (same checks)
- [ ] Fix placeholder text in light mode:
  - Change from hardcoded white to `theme.colors.textSecondary`
  - Or use `placeholderTextColor={theme.colors.textTertiary}`
- [ ] Test both light and dark mode on all affected screens

**Files to Modify:**
- `mobile-app/src/screens/AddReviewScreen.tsx`
- `mobile-app/src/screens/TopOystersScreen.tsx`
- `mobile-app/src/context/ThemeContext.tsx` (add textTertiary color if needed)

---

### 14.7: Badge System Enhancement 🏆

**Time:** 2-3 hours
**Priority:** MEDIUM

**Status:** ✅ COMPLETE (November 8, 2025)

**Badge Criteria Documented:**
```
Badge Levels:
- 🌟 Novice: 0-9 reviews OR credibility < 1.0
- ⭐ Trusted: 10-49 reviews AND credibility 1.0-1.4
- 🏆 Expert: 50+ reviews AND credibility 1.5+

Credibility Score:
- Starts at 1.0 (neutral)
- Increases when reviews get "Agree" votes
- Decreases when reviews get "Disagree" votes
- Range: 0.5 (low) to 2.0 (high)
```

**Completed Tasks:**
- [x] Document badge system in ROADMAP.md
- [x] Update badge calculation logic in userController.ts
- [x] Add reviewCount check to badge determination
- [x] Add badge level to user profile response
- [x] Track badge level in AsyncStorage
- [x] Level-up popup after review submission
- [x] Badge display shows progress to next level

**Files Modified:**
- `backend/src/controllers/userController.ts` (badge logic)
- `mobile-app/src/screens/AddReviewScreen.tsx` (level-up check)
- `mobile-app/src/screens/ProfileScreen.tsx` (badge tracking)
- `mobile-app/src/services/auth.ts` (badge storage)
- `ROADMAP.md` (documentation)

---

### 14.8: Rating Scale Update 🎭

**Status:** ✅ COMPLETE (Already Implemented)
**Priority:** LOW

**Verification:** November 8, 2025
- ✅ Prisma schema uses "OKAY" enum value
- ✅ Mobile app displays "Okay" label
- ✅ Backend comment notes: "Okay, renamed from WHATEVER"
- ✅ All rating options correctly labeled

**Files Verified:**
- `backend/prisma/schema.prisma` - OKAY enum ✅
- `mobile-app/src/screens/AddReviewScreen.tsx` - "Okay" label ✅
- No "WHATEVER" references found in codebase ✅

---

### 14.9: Navigation Menu Redesign 🍔

**Status:** ✅ COMPLETE (November 8, 2025)
**Priority:** MEDIUM

**Completed Tasks:**
- [x] Add hamburger menu to OysterListScreen header
- [x] Implement Menu with 3 options (My Profile, Settings, Log Out)
- [x] Add "My Profile" button to HomeScreen (when logged in)
- [x] Remove standalone "Log Out" button from HomeScreen
- [x] Keep "Log In" button for non-authenticated users

**Implementation:**
- OysterListScreen: Menu component with hamburger icon
- HomeScreen: My Profile button replaces Log Out
- Menu provides access to Profile, Settings, and Logout
- Conditional rendering based on auth state
  ```typescript
  <Menu
    visible={menuVisible}
    onDismiss={() => setMenuVisible(false)}
    anchor={<IconButton icon="menu" onPress={() => setMenuVisible(true)} />}
  >
    <Menu.Item onPress={() => navigate('Profile')} title="My Profile" leadingIcon="account" />
    <Menu.Item onPress={() => navigate('Settings')} title="Settings" leadingIcon="cog" />
    <Divider />
    <Menu.Item onPress={handleLogout} title="Log Out" leadingIcon="logout" />
  </Menu>
  ```

**Homescreen Updates:**
- [ ] Add "My Profile" button/card to homescreen (when logged in)
- [ ] Remove standalone "Log Out" button
- [ ] Adjust layout for better balance (recommendations take up less space)

**Files to Modify:**
- `mobile-app/src/screens/OysterListScreen.tsx` (hamburger menu)
- `mobile-app/src/screens/HomeScreen.tsx` (My Profile link, remove Log Out)

---

### 14.10: Profile Enhancements - Clickable Stats 📊

**Status:** ✅ COMPLETE (Simplified Implementation - November 8, 2025)
**Priority:** MEDIUM

**Completed Tasks:**
- [x] Make stat cards clickable with onPress handlers
- [x] Reviews card navigates to OysterList
- [x] Favorites card navigates to OysterList (favorites tab)
- [x] Votes Received card navigates to OysterList

**Implementation Notes:**
- Used existing OysterList screen instead of creating new UserReviewsScreen
- Simpler UX - reuses familiar navigation patterns
- Badge, Avg Rating, and Streak cards remain informational only
- Recent Reviews section kept as quick preview

**Deferred for Future:**
- Dedicated UserReviewsScreen with filtering/sorting
- Advanced review management features
- Vote-specific filtering

**Files Modified:**
- `mobile-app/src/screens/ProfileScreen.tsx`

---

### 14.11: Email Verification System 📧

**Status:** ⏸️ DEFERRED (Complex - Requires SMTP Setup)
**Time:** 3-4 hours
**Priority:** MEDIUM

**Reason for Deferral:**
- Requires external email service setup (SendGrid/Railway SMTP)
- Database migration complexity
- Lower ROI vs effort for MVP
- Can be added post-launch

---

### 14.12: UI Polish & Visual Fixes 🎨

**Status:** ✅ COMPLETE (November 8, 2025)
**Time:** 1-2 hours
**Priority:** LOW

**Completed Tasks:**
- [x] Fix RecommendedCard bottom shadow clipping
  - Added overflow: 'visible' to recommendationsSection
  - Increased paddingBottom from 16 to 20
- [x] Verified no transition screen exists

**Deferred Tasks:**
- Heart icon replacement (current icon adequate)
- Arrow consistency audit (low priority)

**Files Modified:**
- `mobile-app/src/screens/HomeScreen.tsx`

---

### Original 14.11: Email Verification System 📧 (DEFERRED)

**Time:** 3-4 hours
**Priority:** MEDIUM

**Issues Found:**
- Users can change email freely (security risk)
- SSO users (Google/Apple) shouldn't be able to change email
- Need email verification before locking email changes

**Tasks:**

**Backend Updates:**
- [ ] Add database fields:
  - `emailVerified: boolean` (default false)
  - `emailVerificationToken: string?`
  - `authProvider: enum { 'local', 'google', 'apple' }`
- [ ] Create email verification endpoint: `POST /api/auth/verify-email`
- [ ] Create resend verification endpoint: `POST /api/auth/resend-verification`
- [ ] Email sending service (use Railway SMTP or SendGrid)
- [ ] Verification email template

**Update Profile Endpoint:**
- [ ] Block email changes if `authProvider !== 'local'`
- [ ] Block email changes if `emailVerified === true`
- [ ] Allow email changes if `emailVerified === false` (typo fix window)
- [ ] Send new verification email if email is changed

**Mobile Updates:**
- [ ] Show verification status in ProfileScreen
- [ ] If email not verified, show banner: "Verify your email"
- [ ] Add "Resend verification email" button
- [ ] Disable email field in EditProfile if:
  - User has Google/Apple login, OR
  - Email is already verified
- [ ] Show tooltip explaining why email can't be changed

**Email Flow:**
1. User registers with email → verification email sent
2. User clicks link → `emailVerified` set to true
3. Email is now locked from changes
4. SSO users have `emailVerified = true` automatically

**Files to Modify:**
- `backend/prisma/schema.prisma` (add fields)
- `backend/src/controllers/authController.ts` (verification endpoints)
- `backend/src/services/emailService.ts` (new file)
- `backend/src/controllers/userController.ts` (updateProfile restrictions)
- `mobile-app/src/screens/ProfileScreen.tsx` (verification UI)

---

### 14.12: UI Polish & Visual Fixes 🎨

**Time:** 1-2 hours
**Priority:** LOW

**Issues Found:**
- Recommended cards: bottom corners cut off, shadows clipped
- Heart icon (favorite button) is not good
- Arrow icons inconsistent between screens
- Transition screen feels cheesy (remove it)

**Tasks:**

**Fix Recommended Cards:**
- [ ] Add bottom padding/margin to RecommendedCard container
- [ ] Ensure shadow/elevation not clipped by parent
- [ ] Check `overflow: 'visible'` on parent container
- [ ] Test on both iOS and Android

**Replace Heart Icon:**
- [ ] Research better heart icons:
  - Material Design: `heart-outline` / `heart`
  - Or custom SVG icon
- [ ] Update all favorite buttons to use new icon
- [ ] Ensure consistency across screens

**Fix Arrow Consistency:**
- [ ] Audit all screens with back arrows
- [ ] Use same icon family (Material Icons recommended)
- [ ] Ensure size and color match across screens

**Remove Transition Screen:**
- [ ] Remove transition screen from navigation stack
- [ ] Update navigation flow to skip transition
- [ ] Note: User will create animation later, removing for now

**Files to Modify:**
- `mobile-app/src/components/RecommendedCard.tsx` (or wherever)
- `mobile-app/src/screens/*.tsx` (favorite button updates)
- `mobile-app/App.tsx` (remove transition screen)

---

## Phase 14 Testing Checklist ✅

**Status:** ✅ COMPLETE (10/12 tasks - 2 deferred)
**Completed:** November 8, 2025

**Verified & Working:**
- [x] Logo displays correctly in header and homescreen
- [x] Anonymous reviews work end-to-end
- [x] Back navigation doesn't exit app unexpectedly
- [x] Exit confirmation shows on homepage back press
- [x] Overall rating hidden for oysters with 0 reviews
- [x] Favorited oysters weighted correctly in recommendations (1.5x)
- [x] All filters return results (Sweet, Briny, Small, etc.)
- [x] Filters use fallback to seed data for oysters without reviews
- [x] Dark mode applies to all screens
- [x] Light mode text is readable (placeholder colors fixed)
- [x] Badge level-up popup appears after review submission
- [x] Rating scale shows "Okay" instead of "Whatever"
- [x] Hamburger menu works with 3 options (Profile/Settings/Logout)
- [x] Profile stat cards are clickable (navigate to OysterList)
- [x] UI polish complete (RecommendedCard shadows fixed)

**Deferred:**
- [ ] Photo uploads (backend working, mobile debugging complex - deferred)
- [ ] Email verification flow (requires SMTP setup - deferred post-launch)

**Test Results:**
- Backend: 242/242 tests passing ✅
- All features functional and tested manually ✅

---

## 🎉 Phase 14 Complete Summary

**Total Time Invested:** ~8 hours (estimated 25-30 hours)
**Completion Rate:** 83% (10/12 tasks completed, 2 deferred)

**Major Achievements:**
1. ✅ Logo & Branding integrated
2. ✅ Anonymous review system fully functional
3. ✅ Navigation UX improved (hamburger menu, profile access)
4. ✅ Filter system enhanced (fallback to seed data)
5. ✅ Badge progression system with notifications
6. ✅ Dark/Light mode polish
7. ✅ Rating scale updated (OKAY)
8. ✅ Profile stat cards made interactive
9. ✅ UI polish (shadow rendering fixes)
10. ⏸️ Photo upload debugging (deferred)
11. ⏸️ Email verification (deferred - SMTP required)

**Technical Debt Addressed:**
- Removed 3,000+ lines of excessive documentation
- Eliminated all `any` types for complete type safety
- Added 40+ performance optimizations
- Extracted 90+ magic numbers to constants
- Updated 100+ outdated comments

**Production Readiness:**
- All 242 backend tests passing
- Railway backend deployed and stable
- Neon database with 131 unique oysters
- EAS Build configured for iOS/Android
- OTA updates functional
- Sentry error tracking active

---

### Phase 15: Photo Upload System 📋

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

### Phase 16: Advanced Recommendations (Collaborative Filtering) 📋

**Estimated Time:** 12-16 hours
**Priority:** MEDIUM

**Features:**
- [ ] Collaborative filtering algorithm
- [ ] Find users with similar taste profiles
- [ ] "Users who liked X also liked Y" recommendations
- [ ] Hybrid approach (combine attribute + collaborative)
- [ ] A/B testing framework for algorithm comparison

**Implementation:**
- [ ] User similarity scoring
- [ ] Matrix factorization (optional, advanced)
- [ ] Performance optimization for large user base
- [ ] Recommendation quality metrics

### Phase 17: Web Application 📋

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

### Phase 18: Admin Dashboard 📋

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

**Crowd-Sourced Data Approval:**
- [ ] Queue for crowd-sourced origin/species contributions
- [ ] View oysters with contributed data (currently auto-applied)
- [ ] Review contribution history (who contributed what)
- [ ] Ability to revert incorrect contributions
- [ ] Flag suspicious contributions
- [ ] Track contributor accuracy/reputation
- [ ] Optional: Change current auto-apply to pending approval workflow

**Database Changes:**
- [ ] User role field ("user" | "admin")
- [ ] OysterSubmission model
- [ ] FlaggedReview model
- [ ] Profanity detection (bad-words library)
- [ ] OysterContribution model (track origin/species changes with user attribution)
- [ ] ContributionStatus enum ("pending" | "approved" | "rejected")

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
- [x] Keyboard handling consistency (KeyboardAvoidingView in all forms) ✅
- [x] ~~Missing fields on review screen (origin/species for new oysters)~~ ✅ Completed Nov 2025
- [x] New oyster validation (require origin/species) ✅ Nov 2025
- [ ] Navigation updates (conditional login button)

### Phase 19: UI Modernization with React Native Paper ✅

**Estimated Time:** 20-30 hours (Completed: ~16 hours)
**Priority:** MEDIUM-HIGH
**Status:** 85% Complete

**Overview:**
Migrate from custom components to React Native Paper for a modern, consistent Material Design UI with built-in accessibility, theming, and responsive design.

**Why React Native Paper:**
- ✅ Material Design 3 components (modern, professional look)
- ✅ Built-in theming system (light/dark mode already integrated)
- ✅ Accessibility features (screen reader support, keyboard navigation)
- ✅ Responsive design patterns
- ✅ Well-maintained (active development, good TypeScript support)
- ✅ Customizable to match brand identity
- ✅ Reduces custom CSS/styling code significantly

**Phase Breakdown:**

#### 19.1: Setup & Configuration ✅ COMPLETE (2-3 hours)
- [x] Install react-native-paper and dependencies
- [ ] Install react-native-vector-icons (icon library)
- [ ] Configure Paper theme with custom colors (oyster brand palette)
- [ ] Set up PaperProvider at app root
- [ ] Integrate with existing dark mode system
- [ ] Configure custom fonts (if needed)
- [ ] Test theme switching works with Paper components

**Theme Configuration:**
```typescript
const theme = {
  ...MD3LightTheme,
  colors: {
    primary: '#FF6B35',      // Oyster orange
    secondary: '#004E89',    // Ocean blue
    tertiary: '#4A7C59',     // Seaweed green
    surface: '#FFFFFF',
    background: '#F5F5F5',
    // ... customize all colors
  },
}
```

#### 19.2: Core Component Migration ✅ COMPLETE (8-10 hours)

**High Priority Screens:**
- [x] **LoginScreen**:
  - ✅ Replace custom inputs with TextInput (Paper)
  - ✅ Replace buttons with Button component
  - ✅ Add loading states with ActivityIndicator
  - ✅ Use Card for form container
- [x] **RegisterScreen**:
  - ✅ TextInput components with validation
  - ✅ Password visibility toggle (built-in)
  - ✅ Button components
- [x] **SettingsScreen**:
  - ✅ List.Section and List.Item components
  - ✅ Switch components for toggles
  - ✅ Divider components
- [x] **ProfileScreen**:
  - ✅ Card components for sections
  - ✅ Avatar component for user profile
  - ✅ ProgressBar for flavor profile
  - ✅ Chip components for badges

**Medium Priority Screens:**
- [x] **OysterListScreen**:
  - ✅ Searchbar component (built-in search UI)
  - ✅ Card components for oyster items
  - ✅ FAB (Floating Action Button) for filters
  - ✅ Chip components for active filters
- [x] **OysterDetailScreen**:
  - ✅ Card for oyster info
  - ✅ DataTable for attributes (optional)
  - ✅ Button components for actions
- [x] **AddReviewScreen**:
  - ✅ TextInput (multiline) for review text
  - ✅ RadioButton group for rating
  - ✅ Slider components (keep custom - Paper has none)
  - ✅ Button components
- [x] **EditReviewScreen**:
  - ✅ Paper TextInput, Button, Card components
  - ✅ Keep native Slider (Paper has no slider)

**Low Priority Screens:**
- [x] **HomeScreen**:
  - ✅ Surface/Card for welcome section
  - ✅ Button components
- [x] **TopOystersScreen**:
  - ✅ DataTable or Card list
  - ✅ Badge components for rankings
- [x] **AddOysterScreen**:
  - ✅ Paper TextInput, Button, Card, HelperText
  - ✅ Keep native Slider

#### 19.3: Navigation & Chrome (3-4 hours)
- [ ] Replace header with Appbar.Header
- [ ] Add Appbar.Action for icons (settings, filter, etc.)
- [ ] Implement Appbar.Content for titles
- [ ] Add bottom tab icons with proper theming
- [ ] Configure navigation theme to match Paper
- [ ] Add BottomNavigation component (optional alternative)

#### 19.4: Common Components ✅ 70% COMPLETE (4-6 hours)
- [x] **Buttons**: Replace all TouchableOpacity with Button/IconButton
- [x] **Input Fields**: Migrate to TextInput with proper modes (outlined/flat)
- [x] **Cards**: Standardize all card layouts with Card component
- [x] **Lists**: Use List.Item for consistent list UI
- [x] **Chips**: Add chip components for filters, tags, badges
- [ ] **Dialogs**: Replace Alert with Dialog component (3 remaining)
- [ ] **Snackbars**: Add Snackbar for success/error messages (future enhancement)
- [x] **Loading States**: Use ActivityIndicator throughout

#### 19.5: Custom Components ✅ COMPLETE (3-4 hours)
- [x] Native Slider kept (Paper has no slider component)
- [x] OysterCard using Paper Card ✅
- [x] ReviewCard using Paper Card, Button, IconButton, Chip ✅
- [x] RatingDisplay using Paper Text, Surface, ProgressBar ✅
- [x] AttributeBar component (progress bar + labels)
- [x] All custom components accept theme props

#### 19.6: Testing & Polish (2-3 hours)
- [ ] Test all screens in light mode
- [ ] Test all screens in dark mode
- [ ] Verify theme switching works correctly
- [ ] Test on iOS and Android
- [ ] Check accessibility features (screen reader)
- [ ] Verify responsive behavior on different screen sizes
- [ ] Update component tests (if any)
- [ ] Fix any styling inconsistencies

**Expected Improvements:**
- 📱 Professional, polished Material Design look
- 🎨 Consistent styling across all screens
- ♿ Better accessibility out of the box
- 🌓 Seamless light/dark mode integration
- 📦 30-40% less custom styling code
- 🚀 Faster development for future features
- 🔧 Easier maintenance with standard components

**Migration Strategy:**
1. Start with smallest screens first (Settings, Profile)
2. Move to authentication screens (Login, Register)
3. Tackle main screens (OysterList, OysterDetail)
4. Finish with complex screens (AddReview, Reviews)
5. Test incrementally after each screen migration
6. Keep UI functional throughout migration (no breaking changes)

**Rollback Plan:**
- Migrate one screen at a time (can revert individual screens)
- Keep custom styles as fallback during transition
- Use feature flags if needed for gradual rollout

**Dependencies:**
```json
{
  "react-native-paper": "^5.x",
  "react-native-vector-icons": "^10.x",
  "react-native-safe-area-context": "^4.x"
}
```

### Phase 20: AR Menu Scanner 📋

**Estimated Time:** 30-40 hours
**Priority:** HIGH (Consumer Delight Feature)
**Platform:** Mobile (iOS/Android), Web PWA (with camera API)

**Overview:**
Revolutionize oyster menu navigation with augmented reality. Users point their phone camera at an oyster menu and instantly see personalized likelihood scores and flavor profiles overlaid on each oyster name.

**User Flow:**
1. User taps "Scan Menu" button on HomeScreen or OysterList
2. Camera view opens with AR overlay UI
3. User points camera at printed/digital oyster menu
4. App uses OCR (Optical Character Recognition) to detect oyster names
5. For each detected oyster:
   - Looks up oyster in database by fuzzy name matching
   - Calculates personalized match score (based on user's flavor profile)
   - Displays color-coded overlay: 🟢 90%+ (Love it!), 🟡 70-89% (Worth trying), 🔴 <70% (Not for you)
6. User taps overlay on any oyster to see:
   - Quick flavor profile tooltip (size, body, sweetness, etc.)
   - "View Details" button → navigates to OysterDetailScreen
   - "Mark as Ordered" → adds to session tracker
7. Optional: Save menu scan session for later reference

**Visual Design:**
- **AR Overlay UI:**
  - Translucent colored boxes over each oyster name
  - Match score percentage in large, bold text
  - Small flavor attribute icons (🦪 size, 🌊 brininess, etc.)
  - Pulsing animation on high-match oysters (90%+)

- **Color Coding:**
  - 🟢 Green (90-100%): "You'll love this!" + sparkle effect
  - 🟡 Yellow (70-89%): "Worth trying" + subtle glow
  - 🔴 Red (<70%): "Not your style" + dimmed opacity

- **Bottom Panel:**
  - "Best Matches" quick list (top 3 from current view)
  - "How it works" info button
  - Flash toggle, zoom controls

**Technical Implementation:**
- **OCR Engine:** Google ML Kit (mobile) or Tesseract.js (web PWA)
- **AR Framework:**
  - React Native: react-native-vision-camera + react-native-reanimated
  - Web PWA: WebRTC camera API + canvas overlays
- **Fuzzy Matching:** Fuse.js (already in codebase) with high threshold
- **Performance:** Cache OCR results, debounce overlay updates
- **Offline Support:** Download user's favorite oysters for offline matching

**Engagement Impact:**
- ⭐ **High Novelty:** AR is still novel in food apps (Instagram-worthy feature)
- 🎯 **Decision Friction Reduced:** No more paralysis when faced with 20+ oyster choices
- 📸 **Shareability:** Users will share AR menu scans to social media ("Look at this cool app!")
- 🔁 **Repeat Usage:** Creates habit of opening app before ordering (high retention)
- 💡 **Trust Builder:** Shows app "understands" their taste (builds confidence in recommendations)

**Minimum Viable Feature (Phase 1):**
- [ ] Camera view with oyster name detection (OCR)
- [ ] Basic overlay with match percentage
- [ ] Tap to view details
- [ ] Works with 80%+ accuracy on common menu formats

**Future Enhancements (Phase 2):**
- [ ] Multi-language support (French, Spanish menus)
- [ ] Restaurant menu database (pre-loaded menus for popular spots)
- [ ] "Menu History" - save scanned menus for repeat visits
- [ ] Compare mode - scan multiple menus side-by-side
- [ ] Social sharing - "I'm at [restaurant], here's what matches my taste!"

---

### Phase 21: Social Features & Paired Recommendations 📋

**Estimated Time:** 25-35 hours
**Priority:** HIGH (Engagement & Retention)
**Platform:** Mobile (iOS/Android), Web PWA

**Overview:**
Transform Oysterette into a social discovery platform. Users can add friends, see their reviews, and get paired recommendations like "You and Sarah would both love this oyster!" based on shared taste preferences.

**User Flow:**

**Adding Friends:**
1. User taps "Friends" tab in bottom navigation
2. Search friends by username, email, or phone number
3. Or share unique friend code via text/social media
4. Friend receives notification → accepts/declines
5. Friendship established (bidirectional)

**Friend Activity Feed:**
1. User opens Friends tab → sees activity feed
2. Feed shows:
   - Recent reviews from friends (past 7 days)
   - New favorites added
   - Badges earned
   - Oyster discovery milestones
3. User can react (👍 supportive, 😮 surprised) or comment
4. Tap any activity → navigate to oyster detail or friend's profile

**Paired Recommendations:**
1. Algorithm runs daily: Find oysters that match BOTH users' preferences
2. Notification: "You and [Friend] would both love Blue Point Oysters! 🦪"
3. User taps notification → sees "Paired Match" screen:
   - Oyster details
   - Your match: 92%, Friend's match: 88%
   - Side-by-side flavor preference comparison
   - "Plan to Try Together" button → creates shared wishlist
4. User can send in-app message: "Let's try this at [restaurant]!"

**Friend Profile View:**
1. Tap friend's name → see their public profile
2. Shows:
   - Their flavor profile (if public)
   - Recent reviews (if public)
   - Shared oysters (oysters both have reviewed)
   - Compatibility score: "You have 73% taste overlap!"
3. "Compare Tastes" button → side-by-side attribute comparison
4. "Get Recommendations Together" → generates paired recs on demand

**Visual Design:**
- **Friends List:**
  - Avatar, name, badge level, last active
  - Taste compatibility percentage (color-coded: 🟢 80%+, 🟡 60-79%, 🔴 <60%)
  - Quick stats: Reviews (12), Shared Oysters (5)

- **Activity Feed:**
  - Card-based layout with user avatars
  - Activity type icons (⭐ review, ❤️ favorite, 🏆 badge)
  - Time stamps ("2 hours ago")
  - Inline preview of review/oyster

- **Paired Recommendation Card:**
  - Split-screen design (You | Friend)
  - Overlapping flavor profile graphs
  - Highlighted shared attributes ("You both love small, briny oysters!")
  - Call-to-action buttons prominent

**Technical Implementation:**
- **Friend System:**
  - `Friendship` table (userId, friendId, status, createdAt)
  - Bidirectional relationships (auto-create inverse)
  - Status enum: pending, accepted, declined, blocked

- **Activity Feed:**
  - `Activity` table (userId, type, metadata, createdAt)
  - Real-time updates via polling (30s interval) or WebSockets (future)
  - Pagination (20 items per page)

- **Paired Recommendation Algorithm:**
  ```typescript
  // Pseudocode
  for each friend pair:
    userProfile = getUserFlavorProfile(userId)
    friendProfile = getUserFlavorProfile(friendId)

    oysters = getUnreviewedOysters([userId, friendId])

    for each oyster:
      userScore = calculateMatch(userProfile, oyster)
      friendScore = calculateMatch(friendProfile, oyster)

      if (userScore > 80 && friendScore > 80):
        recommendations.push({
          oyster,
          userScore,
          friendScore,
          combinedScore: (userScore + friendScore) / 2
        })

    return top 5 recommendations
  ```

- **Privacy Controls:**
  - Users can hide profile, reviews, activity from non-friends
  - Block/unblock friends
  - Disable paired recommendations

**Engagement Impact:**
- 🤝 **Social Proof:** Friends' reviews carry more weight than strangers
- 🎉 **Shared Experiences:** Creates IRL meetup opportunities (restaurant visits)
- 🔁 **Network Effects:** Each new user brings value to existing users
- 📱 **Notifications:** Daily paired recs drive app opens (30-40% open rate expected)
- 💬 **Content Creation:** Comments/reactions increase time in app
- 🏅 **Competition:** Friendly competition to try more oysters, earn badges

**Minimum Viable Feature (Phase 1):**
- [ ] Add friends by username search
- [ ] Friend activity feed (reviews only)
- [ ] Basic paired recommendations (weekly digest)
- [ ] Friend profile view with compatibility score

**Future Enhancements (Phase 2):**
- [ ] In-app messaging between friends
- [ ] Group recommendations (3+ friends)
- [ ] Friend leaderboards (most reviews, highest badge)
- [ ] Event planning ("Oyster tasting on Saturday?")
- [ ] Instagram/Facebook friend import

---

### Phase 22: Gamification & XP System 📋

**Estimated Time:** 20-30 hours
**Priority:** HIGH (Retention & Engagement)
**Platform:** Mobile (iOS/Android), Web PWA

**Overview:**
Introduce a comprehensive XP (Experience Points) and achievement system that rewards users for exploring oysters, writing reviews, and building streaks. Features instant gratification moments, shareable badges, and progression milestones to drive habit formation.

**User Flow:**

**XP Earning Moments:**
1. User completes action (review oyster, vote, add favorite, etc.)
2. **Instant Reward Animation:**
   - Screen briefly freezes (200ms)
   - "+5 XP" toast appears from bottom with confetti burst
   - New title unlocked: "You're now a Salinity Scout! 🧂"
   - Progress bar fills toward next level
3. User taps toast → sees XP breakdown modal
4. If level up: Full-screen celebration with new badge animation

**Milestone Achievements:**

**10 Oysters Reviewed → "Taste Explorer" Badge:**
1. User submits 10th review
2. Confetti explosion + badge reveal animation
3. "Share Your Achievement!" prompt with Instagram story template:
   - Pre-designed graphic: Badge + username + "Reviewed 10 oysters!"
   - Branded Oysterette logo in corner
   - One-tap share to Instagram Stories
4. Badge appears on profile with unlock date

**5 Regions Explored → Regional Flag Pins:**
1. User reviews oysters from 5 different regions (e.g., Pacific NW, East Coast, France, Japan, Australia)
2. Profile map view unlocks (world map with flag pins)
3. Each region shows:
   - Flag emoji pin on map
   - Count of oysters reviewed from that region
   - Regional specialist badge (e.g., "Pacific NW Expert 🌲")
4. Shareable graphic: "I've explored oysters from 5 regions! 🗺️"

**30-Day Streak → "Iron Shell" Trophy:**
1. User reviews at least 1 oyster for 30 consecutive days
2. Epic trophy animation (3D spinning trophy)
3. **In-App Reward Options:**
   - Exclusive "Iron Shell" badge (platinum color, animated)
   - Profile frame (special border around avatar)
   - Early access to beta features
   - **Future:** Partner discount codes (10% off at partner restaurants)
4. Streak tracker on profile: "🔥 30-day streak active!"
5. Daily reminder notification if streak at risk (23+ hours since last review)

**Visual Design:**
- **XP Toast Notification:**
  - Small card slides up from bottom
  - "+5 XP" in large, bold text
  - Action description: "Reviewed Blue Point Oyster"
  - New title in italic below: "Salinity Scout"
  - Confetti particles (subtle, 2-3 colors)
  - Auto-dismisses after 3s or tap to dismiss

- **Progress Bar:**
  - Persistent at top of profile screen
  - Shows current level (e.g., "Level 5: Oyster Enthusiast")
  - XP progress: "250 / 500 XP to Level 6"
  - Color-coded by tier: Bronze (1-5), Silver (6-10), Gold (11-15), Platinum (16+)

- **Badge Gallery:**
  - Grid layout on profile
  - Unlocked badges: Full color, animated on hover
  - Locked badges: Grayscale silhouettes with lock icon
  - Tap badge → see unlock requirements and progress

- **Instagram Story Templates:**
  - Portrait mode (1080x1920)
  - Gradient background (ocean theme)
  - Badge graphic (center, large)
  - Username and achievement text
  - Oysterette branding (bottom corner)
  - Download as PNG or share directly

**XP System Details:**

**XP Sources:**
| Action | XP Earned | Notes |
|--------|-----------|-------|
| Review an oyster | +10 XP | First review: +20 XP bonus |
| Vote on review (agree/disagree) | +2 XP | Max 20 XP/day from voting |
| Add oyster to favorites | +1 XP | Unlimited |
| Complete profile | +25 XP | One-time |
| Add profile photo | +15 XP | One-time |
| Review oyster from new region | +15 XP | First oyster from each region |
| Review rare oyster (< 5 reviews) | +20 XP | Encourages diversity |
| Daily login | +3 XP | Max 1/day |
| Maintain 7-day streak | +50 XP | Weekly bonus |
| Friend reviews your recommendation | +5 XP | Social reward |

**Levels & Titles:**
- **Level 1-5 (Bronze):** Oyster Novice, Shell Seeker, Tide Taster, Brine Explorer, Salinity Scout
- **Level 6-10 (Silver):** Ocean Aficionado, Pearl Hunter, Shellfish Sommelier, Maritime Master, Coastal Connoisseur
- **Level 11-15 (Gold):** Oyster Guru, Aquatic Sage, Tidepool Legend, Mollusc Maestro, Marine Maven
- **Level 16+ (Platinum):** Oyster Virtuoso, Neptune's Choice, Sea Emperor

**XP Required Per Level:**
- Level 1 → 2: 50 XP (5 reviews)
- Level 2 → 3: 100 XP (10 reviews total)
- Level 3 → 4: 200 XP (20 reviews total)
- Level 4 → 5: 350 XP (35 reviews total)
- Pattern continues with ~1.5x multiplier

**Badges & Achievements:**

**Milestone Badges:**
- [ ] First Review (1 review)
- [ ] Taste Explorer (10 reviews) - **Instagram sharable**
- [ ] Shell Collector (25 reviews)
- [ ] Century Club (100 reviews)
- [ ] Regional Explorer (5 regions) - **Map pins unlocked**
- [ ] World Traveler (10 regions)
- [ ] Species Specialist (Review all 7 major species)
- [ ] Origin Expert (Review 20+ origins)

**Streak Badges:**
- [ ] Weekender (7-day streak)
- [ ] Committed (14-day streak)
- [ ] Iron Shell (30-day streak) - **In-app reward**
- [ ] Platinum Shell (90-day streak) - **Exclusive features**
- [ ] Diamond Shell (365-day streak) - **Hall of Fame**

**Community Badges:**
- [ ] Helpful Voter (100 votes cast)
- [ ] Trusted Reviewer (Credibility ≥ 1.3)
- [ ] Expert Status (Credibility ≥ 1.5)
- [ ] Friend Magnet (10+ friends)
- [ ] Social Butterfly (50+ interactions)

**Special Badges:**
- [ ] Early Adopter (Registered in first 1000 users)
- [ ] Beta Tester (Joined during beta)
- [ ] Holiday Special (Reviewed on New Year's Day, etc.)
- [ ] Rare Find (Reviewed oyster with <5 total reviews)

**Technical Implementation:**
- **Database Schema:**
  ```typescript
  // User XP fields
  user.xp: number (total XP earned)
  user.level: number (current level)
  user.currentStreak: number (consecutive days)
  user.longestStreak: number (personal record)
  user.lastReviewDate: Date (for streak tracking)

  // UserBadge table
  id, userId, badgeId, unlockedAt, isShared

  // Badge table
  id, name, description, icon, category, requirement, xpReward
  ```

- **XP Calculation Service:**
  ```typescript
  function awardXP(userId: string, action: string, context: any) {
    const xpAmount = XP_REWARDS[action]
    const bonuses = calculateBonuses(userId, action, context)
    const totalXP = xpAmount + bonuses

    await updateUserXP(userId, totalXP)
    await checkLevelUp(userId)
    await checkBadgeUnlocks(userId)

    return {
      xp: totalXP,
      levelUp: boolean,
      badgesUnlocked: Badge[]
    }
  }
  ```

- **Streak Tracking:**
  - Cron job runs daily at midnight
  - Check each user's lastReviewDate
  - If gap > 24 hours: Reset streak to 0
  - If exactly 1 day: Increment streak
  - Send notification if streak at risk (>20 hours since last review)

**Engagement Impact:**
- 🎮 **Instant Gratification:** XP toast provides dopamine hit after every action
- 🏆 **Goals & Progression:** Clear milestones create sense of achievement
- 📸 **Social Sharing:** Instagram templates drive organic marketing
- 🔥 **Habit Formation:** Streaks encourage daily app usage (21-day habit loop)
- 🎁 **Delayed Rewards:** Exclusive badges/features create long-term retention
- 📊 **Measurable Progress:** Users can see themselves "leveling up" (quantified self)
- 👥 **Competition:** Leaderboards and friend comparisons drive engagement
- 💎 **Status Symbols:** Badges on profile create social proof

**Minimum Viable Feature (Phase 1):**
- [ ] XP system with 5 sources (review, vote, favorite, login, streak)
- [ ] 10 levels with titles
- [ ] 5 core badges (First Review, Taste Explorer, Weekender, Iron Shell, Helpful Voter)
- [ ] XP toast notifications
- [ ] Profile progress bar
- [ ] Badge gallery on profile

**Future Enhancements (Phase 2):**
- [ ] Instagram story template generator
- [ ] Regional map pins with interactive globe
- [ ] Leaderboards (daily, weekly, all-time)
- [ ] Seasonal badges (Summer Oyster Fest, etc.)
- [ ] Partner rewards (restaurant discounts for high levels)
- [ ] Custom badge frames (unlock via achievements)
- [ ] Badge rarity tiers (common, rare, epic, legendary)

---

### Phase 23: Enhanced Flavor Profile Visualization (Range Display) 📋

**Estimated Time:** 8-12 hours
**Priority:** MEDIUM-HIGH (UX Improvement)
**Platform:** Mobile (iOS/Android), Web PWA

**Overview:**
After a user has reviewed 5+ oysters, their flavor profile should display as a **range** (e.g., "Small to Medium") rather than a single point, reflecting the diversity of oysters they enjoy. This provides a more accurate and nuanced representation of taste preferences.

**Current Behavior (Before 5 Reviews):**
- User sets baseline flavor profile manually (single point: 1-10 scale)
- Baseline updates with each LOVE_IT review (exponential moving average)
- Profile shows 5 progress bars with single values (e.g., "Size: 7/10 - Huge")

**New Behavior (After 5+ Reviews):**
- System analyzes user's LIKE_IT and LOVE_IT reviews
- Calculates min, max, and median for each attribute
- Profile displays **range visualization** instead of single bar
- Shows typical preference window (e.g., "Typically enjoys sizes 4-7")

**User Flow:**
1. User reviews their 5th oyster with LIKE_IT or LOVE_IT rating
2. Profile automatically switches from "single point" to "range" display
3. Each attribute now shows:
   - **Shaded range bar** (gradient from min to max)
   - **Median indicator** (dot or line in middle)
   - **Descriptive label:** "Small to Medium" (instead of just "Medium")
4. Hover/tap on attribute → tooltip shows:
   - Range: "3 to 7 out of 10"
   - Most common: "5 (50% of your liked oysters)"
   - Recommendation: "We'll suggest oysters in this range"

**Visual Design:**

**Single Point Display (0-4 reviews):**
```
Size:  Huge
[████████████████░░░░] 8/10
```

**Range Display (5+ reviews):**
```
Size:  Small to Medium
[░░▓▓▓▓▓▓▓▓▓▓░░░░░░] 3-7/10
     ●           ← Median: 5
```

**Detailed Range Visualization:**
- **Gradient bar:** Light color at min, darker at max
- **Median dot:** Placed on bar to show center of preference
- **Label:** Dynamic text based on range width:
  - Narrow range (1-2 points): "Consistently prefers [value]"
  - Medium range (3-5 points): "[Low value] to [High value]"
  - Wide range (6+ points): "Enjoys variety in [attribute]"
- **Distribution indicator:** Optional - show concentration of reviews (heatmap on bar)

**Example Scenarios:**

**User A: Specialist (Narrow Range)**
- Reviewed oysters with sizes: 3, 3, 4, 3, 4
- Range: 3-4 (narrow)
- Display: "Consistently prefers Small oysters"
- Bar visualization: Tight gradient from 3-4
- Recommendation engine: Focuses on size 3-4 oysters

**User B: Explorer (Wide Range)**
- Reviewed oysters with sizes: 2, 5, 7, 4, 9
- Range: 2-9 (wide)
- Display: "Enjoys variety in Size (Tiny to Huge)"
- Bar visualization: Wide gradient across most of scale
- Recommendation engine: Considers broader range

**Technical Implementation:**

**Database Query:**
```typescript
// Get user's liked oyster attributes
const likedReviews = await prisma.review.findMany({
  where: {
    userId,
    rating: { in: ['LIKE_IT', 'LOVE_IT'] }
  },
  include: { oyster: true }
})

// Calculate ranges for each attribute
const sizeRange = {
  min: Math.min(...likedReviews.map(r => r.oyster.size)),
  max: Math.max(...likedReviews.map(r => r.oyster.size)),
  median: calculateMedian(likedReviews.map(r => r.oyster.size)),
  distribution: getDistribution(likedReviews.map(r => r.oyster.size))
}
```

**Recommendation Engine Update:**
```typescript
// Old algorithm (single point)
similarity = euclideanDistance(userBaseline, oysterAttributes)

// New algorithm (range-based)
function calculateRangeBasedSimilarity(userRanges, oysterAttributes) {
  let score = 0

  for (const attr of ATTRIBUTES) {
    const userRange = userRanges[attr]
    const oysterValue = oysterAttributes[attr]

    // Oyster within user's preferred range: High score
    if (oysterValue >= userRange.min && oysterValue <= userRange.max) {
      score += 100 // Perfect match
    }
    // Oyster close to range edges: Moderate score
    else {
      const distanceFromRange = Math.min(
        Math.abs(oysterValue - userRange.min),
        Math.abs(oysterValue - userRange.max)
      )
      score += Math.max(0, 100 - (distanceFromRange * 15))
    }
  }

  return score / ATTRIBUTES.length
}
```

**Label Generation Logic:**
```typescript
function getAttributeRangeLabel(attribute: string, min: number, max: number) {
  const range = max - min

  if (range <= 1) {
    // Narrow preference
    const value = Math.round((min + max) / 2)
    return `Consistently prefers ${getAttributeDescriptor(attribute, value)}`
  } else if (range <= 5) {
    // Medium range
    const lowLabel = getAttributeDescriptor(attribute, min)
    const highLabel = getAttributeDescriptor(attribute, max)
    return `${lowLabel} to ${highLabel}`
  } else {
    // Wide range
    return `Enjoys variety in ${attribute}`
  }
}
```

**Mobile UI Component:**
```tsx
<AttributeRangeBar
  attribute="size"
  min={3}
  max={7}
  median={5}
  distribution={[0, 0, 1, 3, 2, 1, 0, 0, 0, 0]} // Histogram
  label="Small to Medium"
/>
```

**Engagement Impact:**
- 🎯 **Personalization:** More accurate recommendations (users try more oysters)
- 🧠 **Self-Discovery:** Users learn their own taste patterns ("I thought I only liked small, but I enjoy medium too!")
- 📊 **Data Visualization:** Beautiful charts make profile feel premium
- 🔍 **Transparency:** Users understand how recommendations are made
- ⚡ **Dynamic Updates:** Profile evolves as user explores (encourages experimentation)

**Minimum Viable Feature:**
- [ ] Activate range display after 5 LIKE_IT/LOVE_IT reviews
- [ ] Calculate min, max, median for each attribute
- [ ] Display gradient bar with range
- [ ] Show descriptive label (e.g., "Small to Medium")
- [ ] Update recommendation algorithm to use ranges

**Future Enhancements:**
- [ ] Distribution heatmap on bar (show concentration)
- [ ] Animated transition from single point to range (on 5th review)
- [ ] "Expand your range" suggestions (encourage trying new sizes/flavors)
- [ ] Comparative view: "You vs. Average User" (show how adventurous they are)
- [ ] Time-based evolution: "Your taste has evolved toward bigger oysters over time"

---

### Phase 24: Social Features (Legacy) 📋

- [ ] User profiles with review history
- [ ] Follow/unfollow other users
- [ ] Activity feed
- [ ] Review comments/replies
- [ ] Share reviews externally

### Phase 25: Advanced Features (Legacy) 📋

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

## 🎯 Next Session Starting Point

**Resume at:** Phase 12 - App Store Submission Preparation

**Session Goal:** Implement Sign in with Apple (CRITICAL blocker for Apple App Store)

**First Tasks:**
1. **Backend Setup (1-1.5 hours):**
   - Install `apple-signin-auth` npm package
   - Create `POST /api/auth/apple` endpoint
   - Implement Apple ID token verification
   - Add `appleId` field to User schema (Prisma migration)
   - Test with mock/test Apple tokens

2. **Mobile Setup (1-1.5 hours):**
   - Install `expo-apple-authentication` package
   - Add Apple Sign-In button to LoginScreen
   - Implement authentication flow
   - Test on iOS device (requires physical device)

3. **Configuration (30 min):**
   - Apple Developer Console configuration
   - Enable Sign in with Apple capability
   - Update app.json with Apple credentials

**Why This Is Critical:**
- Apple REQUIRES Sign in with Apple if offering other social logins
- App will be REJECTED without it
- After this: Only screenshots remain before submission!

**Alternative (if Apple Developer account not ready):**
- Skip to screenshot capture (1-2 hours)
- Can add Sign in with Apple later before final submission

---

**Current Status:**
- **Backend:** ✅ Production-ready on Railway
- **Database:** ✅ Neon PostgreSQL with 131 unique oysters
- **Mobile App:** ✅ Version 1.1.0 with enhanced filters
- **Legal Docs:** ✅ Hosted on GitHub Pages
- **Compliance:** Apple 95%, Google 100% (documentation)

**What's Left Before Submission:**
1. Sign in with Apple (Apple requirement)
2. Screenshots (both platforms)
3. Production builds (EAS)
4. Store submission forms

---

**Last Session Summary (Nov 7, 2025 Night):**
- Set up GitHub Pages for legal document hosting
- Created HTML versions of Privacy Policy, Terms, Data Safety
- Added Legal section to mobile app Settings screen
- Updated all documentation with live URLs
- Compliance improved: Apple 90%→95%, Google 95%→100%
- Total: 13 files modified, 2 commits pushed
