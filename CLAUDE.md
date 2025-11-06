# Oysterette Production Deployment Progress

---

## 📘 DOCUMENT PURPOSE

**This file is for:** Detailed session-by-session progress and implementation journal

**Use this file for:**

- Daily session logs with specific work completed
- Implementation details (code changes, file paths, line numbers)
- Troubleshooting notes and bug fixes
- Configuration details (API URLs, environment setup)
- Deployment history and build information
- Technical decisions and architecture notes

**Do NOT use this file for:**

- High-level feature roadmap (use ROADMAP.md)
- Future feature planning (use ROADMAP.md)
- Simple feature status tracking (use ROADMAP.md)

**When to update:** At the end of each work session with what was accomplished

---

## ⚠️ MEMORY MANAGEMENT - CRITICAL

**PROBLEM:** Previous sessions crashed the system with 90+ GB memory usage due to excessive context accumulation.

**MANDATORY RULES FOR CLAUDE:**

### 1. **File Reading Discipline**
   - ✅ **ONLY** read files when absolutely necessary for the current task
   - ❌ **NEVER** re-read files already seen in this conversation
   - ✅ Use `limit` and `offset` parameters for files over 200 lines
   - ✅ Read only relevant sections, not entire files
   - ❌ **NEVER** read more than 3 files in parallel
   - ✅ Before reading, ask: "Do I really need this file's contents?"

### 2. **Background Process Management - CRITICAL**
   - 🚨 **NEVER run tests in background** - Always run synchronously with timeout
   - 🚨 **NEVER repeatedly poll BashOutput** without the `filter` parameter
   - ✅ If dev server in background: Use `filter: "error|Error|ERROR"` on BashOutput
   - ✅ Kill background processes IMMEDIATELY when done using KillShell
   - ❌ **DO NOT** run `npm test` with `run_in_background: true`
   - ❌ **DO NOT** call BashOutput in a loop or repeatedly without filtering

### 3. **Command Output Truncation**
   - ✅ Always use `head_limit: 20` on Grep operations
   - ✅ Pipe test outputs through `tail -30` to show only summary
   - ✅ For build commands, show only errors/warnings
   - ✅ Use `timeout: 120000` (2 min) on all test commands
   - ❌ **NEVER** show full test suite output (162 tests = massive logs)

### 4. **Avoid Redundant Operations**
   - ❌ **DO NOT** run `git status` multiple times per session
   - ❌ **DO NOT** re-read package.json, tsconfig.json if already seen
   - ✅ Cache information from earlier in conversation
   - ✅ Reference previous findings instead of re-checking
   - ✅ Ask user before reading 5+ files at once

### 5. **Memory-Efficient Commands**

**GOOD Examples (Testing):**
```bash
# ✅ CORRECT: Run tests synchronously with timeout and truncation
npm test 2>&1 | tail -30
# With timeout parameter: timeout: 120000 (2 minutes)

# ✅ CORRECT: Build with errors only
npm run build 2>&1 | grep -i "error\|warning" || echo "✅ Build successful"

# ✅ CORRECT: Git status (once per session max)
git status --short

# ✅ CORRECT: Git diff summary (not full diff)
git diff --stat
```

**GOOD Examples (Background Processes):**
```bash
# ✅ CORRECT: Dev server in background with filtered output checking
# Start server
npm start  # with run_in_background: true

# Check output with filter (only errors)
# Use BashOutput with filter: "error|Error|ERROR|FATAL"

# Kill when done
# Use KillShell immediately after task complete
```

**BAD Examples (MEMORY KILLERS - NEVER DO THIS):**
```bash
# 🚨 NEVER: Tests in background
npm test  # with run_in_background: true

# 🚨 NEVER: Repeatedly check BashOutput without filter
# Calling BashOutput multiple times without filter parameter

# 🚨 NEVER: Full test output
npm test  # without tail -30

# 🚨 NEVER: Full build logs
npm run build  # without grep

# 🚨 NEVER: Multiple git status calls
git status && ... && git status

# 🚨 NEVER: Leave background processes running
# Start background process and never kill it
```

### 6. **Session Length Management**
   - ⚠️ **< 30 messages:** Optimal - Single feature work
   - ⚠️ **30-50 messages:** Medium - Multi-step implementations
   - 🚨 **> 50 messages:** HIGH RISK - Warn user to start new session
   - 🛑 **> 70 messages:** CRITICAL - Strongly recommend new session

### 7. **Todo List Hygiene**
   - ✅ Remove completed todos immediately (don't let them accumulate)
   - ✅ Keep only active/pending items
   - ❌ **NEVER** let todo list exceed 10 items

### 8. **Context Cleanup Practices**
   - ✅ After completing major task, summarize what was done
   - ✅ Suggest new session after large features (OAuth, major refactors)
   - ✅ Periodically summarize instead of keeping full history
   - ❌ **NEVER** accumulate build logs, test outputs, or file dumps

### 9. **Before Any Memory-Intensive Operation, Ask:**
   1. Do I really need the full output?
   2. Have I already read this file in this conversation?
   3. Can I use grep/head/tail to limit output?
   4. Is there a lighter-weight way to get this info?
   5. Will this add more than 1000 tokens to context?

**🚨 IF IN DOUBT, TRUNCATE OR SKIP 🚨**

---

## 🧪 TESTING POLICY - MANDATORY FOR ALL NEW FEATURES

**CRITICAL: Every new feature MUST include comprehensive testing before commit.**

### Testing Requirements for Every New Feature:

1. **Before Implementation:**

   - Identify what needs testing (endpoints, services, components)
   - Plan test cases (happy path, edge cases, error handling)

2. **During Implementation:**

   - Write tests FIRST for backend endpoints
   - Write tests for service layer logic
   - Write integration tests for API flows

3. **Before Committing:**

   - Run ALL tests (backend: `npm test`, mobile: if applicable)
   - Ensure 100% of new tests pass
   - Ensure NO existing tests break
   - Fix any failures before proceeding

4. **What to Test:**

   - **Backend APIs:** All new endpoints, request validation, response format
   - **Services:** Business logic, calculations, edge cases
   - **Database:** Queries, relationships, constraints
   - **Mobile APIs:** API client methods, error handling
   - **Integration:** End-to-end flows across backend and mobile

5. **Test File Locations:**
   - Backend unit tests: `backend/src/__tests__/unit/`
   - Backend integration tests: `backend/src/__tests__/integration/`
   - Backend service tests: alongside service files or in `__tests__/`

### Testing Workflow:

**CRITICAL RULES:**
- ✅ Always run tests **synchronously** (NOT in background)
- ✅ Always use `timeout: 120000` parameter (2 minutes)
- ✅ Always pipe through `tail -30` to show only summary
- ❌ **NEVER** use `run_in_background: true` for tests
- ❌ **NEVER** call tests without output truncation

**Correct Testing Commands:**

```bash
# ✅ CORRECT: Run all tests with timeout and summary
npm test 2>&1 | tail -30
# Bash tool parameters: timeout: 120000

# ✅ CORRECT: Run specific test suites
npm run test:unit 2>&1 | tail -20
npm run test:integration 2>&1 | tail -20

# ✅ CORRECT: Build with errors only
npm run build 2>&1 | grep -i "error\|warning" || echo "✅ Build successful"

# 🚨 WRONG: These will crash with 90 GB memory usage
# npm test  (without tail)
# npm test  (with run_in_background: true)
```

### Why Testing Matters:

- ✅ Catches bugs before they reach production
- ✅ Ensures new features don't break existing functionality
- ✅ Documents expected behavior
- ✅ Makes refactoring safer
- ✅ Builds confidence in the codebase

**🚨 DO NOT COMMIT WITHOUT PASSING TESTS 🚨**

---

## Session Dates: October 28-29, 2025 | November 3-6, 2025

---

## 🆕 SESSION: November 6, 2025 (PM) - Duplicate Review Detection Discovery

### ✅ COMPLETED THIS SESSION

#### **Duplicate Review Detection & Update Flow** ✅ FULLY IMPLEMENTED

**Discovery:** This feature was already fully implemented in a previous session but not documented!

**Backend Implementation:**
- ✅ `GET /api/reviews/check/:oysterId` - Check for existing user review (reviewController.ts:179-229)
- ✅ `PUT /api/reviews/:reviewId` - Update existing review (reviewController.ts:231-287)
- ✅ Route configured in reviewRoutes.ts:27

**Mobile Implementation:**
- ✅ `reviewApi.checkExisting(oysterId)` - API method (api.ts:247-250)
- ✅ `reviewApi.update(reviewId, data)` - API method (api.ts:235-238)
- ✅ OysterDetailScreen duplicate check - Shows modal before navigation (OysterDetailScreen.tsx:119-163)
- ✅ AddReviewScreen update mode - Pre-fills data, changes button text (AddReviewScreen.tsx:32-79, 308)
- ✅ Navigation types include `existingReview?: Review` param (types.ts:12)

**User Flow:**
1. User taps "Add Review" on oyster detail screen
2. App checks if user already reviewed this oyster
3. If existing review found:
   - Alert modal: "Update Existing Review - You have already reviewed this oyster. Would you like to update your review?"
   - Options: "Cancel" or "Update Review"
   - Selecting "Update Review" opens AddReviewScreen with pre-filled data
4. If no existing review:
   - Opens AddReviewScreen normally
5. Submit button text changes:
   - "Submit Review" for new reviews
   - "Update Review" for updates
6. Backend prevents duplicate reviews via unique constraint on (userId, oysterId)

**Testing Status:** Feature is production-ready and already deployed

#### **Build & Deployment** ✅

- ✅ Updated app.json version to 6 (iOS buildNumber: 6, Android versionCode: 6)
- ✅ New Android APK building on EAS (Build: fe098b13-8cc6-454f-9543-a4a073ebab2e)
- ✅ OTA Update deployed: Version 6 with all UI improvements and favorites sync
- ✅ New icons configured (fixed zoom issue with proper padding)
- ✅ Back button already disabled on HomeScreen (App.tsx:58)

---

## 🆕 SESSION: November 6, 2025 (AM) - UX Improvements & Critical Fixes

### ✅ COMPLETED THIS SESSION

#### 1. **Critical Auth Token Bug Fix** 🐛

**Problem:** Users getting "no token provided submission failed" when submitting reviews after Google OAuth login.

**Root Cause:** Axios interceptor not ensuring `config.headers` object existed before setting Authorization header.

**Fix Applied:**

- Updated `mobile-app/src/services/api.ts` interceptor (lines 47-72)
- Now checks if headers exist and creates object if needed
- Added comprehensive logging for debugging

**Files Modified:**

- ✅ `mobile-app/src/services/api.ts` - Fixed interceptor + logging
- ✅ `mobile-app/src/services/auth.ts` - Added token save/retrieve logging
- ✅ `mobile-app/src/screens/LoginScreen.tsx` - Added validation
- ✅ `mobile-app/src/screens/AddReviewScreen.tsx` - Enhanced error logging

**Documentation:** See `AUTH_TOKEN_FIX.md` for complete troubleshooting guide.

#### 2. **HomeScreen Auth State Management** ✅

**Changes:**

- Added `isLoggedIn` state tracking
- Added focus listener to re-check auth when returning to screen
- Button text changes: "Browse Oysters" → "All Oysters" when logged in
- Shows "Log Out" instead of "Log In" when authenticated
- Loads user theme on auth check

**File:** `mobile-app/src/screens/HomeScreen.tsx` (lines 18-65)

#### 3. **Logo & Transition Improvements** ✅

**Changes:**

- Main homepage logo: 120px → 192px (60% bigger)
- Loading transition logo: 160px → 256px (60% bigger)
- Transition duration: 1500ms → 900ms (faster)

**File:** `mobile-app/src/screens/HomeScreen.tsx` (lines 181-200, 78-87)

#### 4. **Build Optimization Workflow** 🚀

**Implemented:**

- Installed `depcheck` in both backend and mobile-app
- Created npm scripts for dependency checking
- Built automated pre-build script: `./pre-build.sh`
- Created comprehensive documentation

**New Scripts:**

```bash
# Backend
npm run depcheck           # Check for unused deps
npm run prebuild          # Run depcheck + tests
npm run build:prod        # Full workflow

# Mobile App
npm run depcheck          # Check for unused deps
npm run prebuild:android  # Run depcheck
npm run build:android:prod # Full workflow

# Root
./pre-build.sh [mobile|backend|all]  # Complete pre-build checks
```

**Files Created:**

- ✅ `pre-build.sh` - Automated workflow script
- ✅ `BUILD_OPTIMIZATION.md` - Complete optimization guide
- ✅ `AUTH_TOKEN_FIX.md` - Auth debugging guide

**Unused Dependencies Found:**

- Mobile: `expo-auth-session`, `expo-crypto`, `expo-web-browser`, `react-dom`, `react-native-web` (can remove for 5-10MB savings)

#### 5. **Enhanced Debug Logging** 📊

**Added logging throughout the app:**

- 💾 Token save operations
- 🔍 Token retrieval operations
- 🔑 API interceptor token handling
- 📦 Auth response validation
- ✅/❌ Success/failure markers

**Purpose:** Complete visibility into auth token flow for debugging.

#### 6. **Review Submission Testing** ✅

**Status:** Verified working in production

**Testing Results:**

- ✅ Auth token properly attached to API requests
- ✅ Review submission successful after Google OAuth login
- ✅ No "no token provided" errors

**Verified:** November 6, 2025

#### 7. **Slider UX Enhancements** ✅

**Improvements Made:**

- Added dynamic word labels above each slider (e.g., "Huge", "Baddy McFatty", "Seawater")
- Labels use `getAttributeDescriptor()` from `ratingUtils.ts`
- Centered display with bold, larger font (18px, #3498db color)
- Increased slider height: 40px → 50px for better touch targets
- Added `thumbTintColor` for more visible slider thumb

**Files Modified:**

- ✅ `mobile-app/src/screens/AddReviewScreen.tsx` - All 5 sliders updated

**User Experience:**

- Users see descriptive words change in real-time as they adjust sliders
- Labels stay centered (don't follow thumb)
- Easier to grab and move sliders
- More intuitive rating process

#### 8. **App Icon Guidance** 📝

**Issue:** App icon appears zoomed in on Android devices

**Root Cause:** Android adaptive icon needs transparent padding around edges

**Solution Provided:**

- Explained adaptive icon requirements (66% content, 17% padding on each side)
- Alternative: Use regular icon.png for adaptive icon (quick fix)
- User will adjust `mobile-app/assets/adaptive-icon.png` with proper padding

---

### 📋 PENDING TASKS (From User Feedback)

#### High Priority:

1. **Redesign OysterList top bar** - Remove "Browse Oysters" title, add Login button with different color
2. **Fix ReviewCard dark mode** - Review cards showing light in dark mode

#### Medium Priority:

3. **Add spacing between logout/delete buttons** - Prevent accidental delete account clicks
4. **Fix navigation flow** - No back to login when logged in
5. **Check favorites sync** - Verify favorites persist with user account

#### Low Priority:

6. **Remove back button from HomeScreen**
7. **Fix app icon zoom** - Edit adaptive-icon.png to add proper padding

---

### 🔧 NEXT SESSION PRIORITIES

1. **Deploy OTA update with slider improvements**

   - Run build process
   - Deploy via EAS Update
   - Test on device

2. **Complete remaining UI improvements**

   - Fix ReviewCard dark mode issue
   - Redesign OysterList top bar (remove title, add login button)
   - Add spacing between logout/delete buttons
   - Fix navigation flow (no back to login when logged in)

3. **Build optimization**
   - Remove unused dependencies (expo-auth-session, expo-crypto, etc.)
   - Test depcheck workflow
   - Document APK size reduction
   - Consider new APK build with optimizations

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

### Priority 1: Google OAuth Login ✅ COMPLETE!

**Status:** Deployed - Live in Production (Nov 5, 2025)

**What We Built:**

- ✅ Native Google Sign-In SDK (`@react-native-google-signin/google-signin`)
- ✅ Backend `/auth/google` endpoint with ID token verification
- ✅ Google Cloud Console OAuth credentials configured
- ✅ Android OAuth client with SHA-1 verification
- ✅ iOS URL scheme configuration
- ✅ LoginScreen and RegisterScreen with native OAuth
- ✅ No redirect URIs needed (native verification)
- ✅ Comprehensive error handling for all OAuth states

**Why Native Implementation:**

- Deprecated expo-auth-session approach had redirect URI issues
- Native SDK uses package name + SHA-1 on Android (more secure)
- No browser redirects needed
- Better user experience
- Works with Google Play Services natively

**Testing:**

- ✅ Tested successfully on Android device
- ✅ One-tap Google sign-in working
- ✅ User creation and JWT token generation confirmed

**Locations:**

- Backend: `src/controllers/authController.ts:226-294`
- Mobile: `src/screens/LoginScreen.tsx`, `src/screens/RegisterScreen.tsx`
- Config: `mobile-app/app.json` (plugins)

**Build:** Version 5 - APK with native Google OAuth

---

### Priority 1.5: Duplicate Review Detection (FUTURE - HIGH PRIORITY)

**Status:** Backlog - Requested by user

**Problem:**
Currently, users can submit multiple reviews for the same oyster without warning.

**Solution:**
Implement duplicate review detection with update flow:

**Features to Build:**

1. **Backend Check**

   - Check if user already reviewed this oyster before creating new review
   - Return existing review data if found
   - Add endpoint: `GET /api/reviews/check/:oysterId` (returns existing review or null)

2. **Mobile UI Flow**

   - When user taps "Add Review" on an oyster they've already reviewed:
     - Show modal popup: "You already reviewed this oyster. Do you want to update your review?"
     - Button: "Update Review" (opens review screen with pre-filled data)
     - Button: "Cancel" (closes modal)
   - Pre-populate AddReviewScreen with existing review data
   - Change submit button text to "Update Review" instead of "Submit Review"

3. **Update Logic**
   - Modify `reviewApi.create()` to accept optional `reviewId` parameter
   - If `reviewId` exists, use PUT endpoint to update instead of POST
   - Backend endpoint: `PUT /api/reviews/:reviewId`

**Implementation Files:**

- Backend: `src/controllers/reviewController.ts` (add check & update endpoints)
- Mobile: `src/screens/OysterDetailScreen.tsx` (add duplicate check before navigation)
- Mobile: `src/screens/AddReviewScreen.tsx` (handle update mode)
- Mobile: `src/services/api.ts` (add check & update methods)

**Database:**

- ✅ Already have unique constraint on `(userId, oysterId)` in reviews table
- No schema changes needed

**Estimated Time:** 3-4 hours

**Benefits:**

- Prevents duplicate reviews
- Better user experience
- Maintains data integrity
- Allows users to easily update their reviews

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
├── backend/ # Node.js Express API
│ ├── prisma/
│ │ ├── schema.prisma # Database schema
│ │ └── migrations/ # Migration files
│ ├── src/
│ │ ├── controllers/ # API controllers
│ │ ├── routes/ # API routes
│ │ ├── middleware/ # Auth, validation, etc.
│ │ ├── services/ # Business logic (rating, voting)
│ │ ├── validators/ # Zod schemas
│ │ ├── utils/ # Logger, Sentry, auth
│ │ ├── lib/ # Prisma client
│ │ ├── **tests**/ # Test suites (162 tests)
│ │ │ ├── compilation/ # TypeScript build tests
│ │ │ ├── integration/ # API integration tests
│ │ │ └── unit/ # Unit tests
│ │ └── index.ts # Server entry point
│ ├── railway.json # Railway deployment config
│ ├── nixpacks.toml # Build configuration
│ ├── Procfile # Start command
│ ├── tsconfig.build.json # Production TypeScript config
│ └── .env # Environment variables (Neon DB)
│
├── mobile-app/ # React Native Expo app
│ ├── src/
│ │ ├── screens/ # App screens
│ │ ├── components/ # Reusable components
│ │ ├── services/ # API service (connects to Railway)
│ │ ├── types/ # TypeScript types
│ │ ├── navigation/ # Navigation config
│ │ ├── context/ # Theme context
│ │ └── themes/ # Dark/light themes
│ ├── App.tsx # App entry point
│ ├── app.json # Expo config
│ └── package.json
│
├── PRODUCTION_ROADMAP.md # Detailed deployment guide
├── CLAUDE.md # This file - session progress
└── README.md # Project documentation

````

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

# Build production (MEMORY-EFFICIENT: errors only)
npm run build 2>&1 | grep -i "error\|warning" || echo "✅ Build successful"

# Run all tests (MEMORY-EFFICIENT: summary only)
npm test 2>&1 | tail -30

# Run specific test types (summary only)
npm run test:unit 2>&1 | tail -20
npm run test:integration 2>&1 | tail -20

# Run migrations
npx prisma migrate deploy

# Generate Prisma client
npx prisma generate

# Seed database
npm run seed
```

**⚠️ MEMORY WARNING:** Always pipe test and build commands through `tail` or `grep` to avoid massive log dumps!

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
# Check status (MEMORY-EFFICIENT: short format, run ONCE per session max)
git status --short

# View changes (summary only, NOT full diff)
git diff --stat

# Commit changes
git add .
git commit -m "Your message"

# Push to GitHub (triggers Railway auto-deploy)
git push origin main
```

**⚠️ MEMORY WARNING:**
- Use `git status --short` instead of full `git status`
- Use `git diff --stat` for summary instead of full `git diff`
- Only run git commands ONCE per session unless absolutely necessary

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
  const scored = unreviewed.map((oyster) => ({
    oyster,
    similarity: calculateSimilarity(avgPreferences, oyster.attributes),
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

### Phase 1: Core Improvements ✅ COMPLETE!

1. ✅ OAuth Implementation (Nov 5, 2025)
2. ⭐ Code Documentation (RECOMMENDED NEXT)
3. ⭐ App Store Compliance & Security Audit (HIGH PRIORITY)

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

**Generated:** November 6, 2025
**Backend:** Live on Railway with security hardening
**Database:** Live on Neon
**Tests:** 162/162 passing ✅
**Status:** Production-ready with Google OAuth, UX improvements deployed

---

## 📝 DOCUMENT CHANGE LOG

**November 6, 2025 - Critical Fix for 90 GB Memory Crashes:**

**ROOT CAUSE IDENTIFIED:**
- Background bash processes (tests, dev servers) continuously outputting text
- BashOutput tool being called repeatedly without `filter` parameter
- Each BashOutput call accumulated ALL previous output in context
- Memory ballooned to 90+ GB until system crash

**FIXES APPLIED:**
- ✅ Added **Background Process Management** section (CRITICAL)
- ✅ Explicit rule: **NEVER run tests in background mode**
- ✅ Mandatory `filter` parameter on all BashOutput calls
- ✅ Mandatory timeout (120000ms) on all test commands
- ✅ Kill background processes immediately after use (KillShell)
- ✅ Updated all test workflows with proper synchronous execution
- ✅ Clear examples of correct vs. memory-killing patterns

**Previous Memory Management (Still Active):**
- All test commands pipe through `tail -30` for summaries
- Git commands use `--short` and `--stat` flags
- Build commands filter to errors/warnings only
- Max 3 parallel file reads, max 10 todos
- Session length warnings (50+ messages = high risk)

**The Fix:**
- Tests now run **synchronously with timeout**, NOT in background
- BashOutput requires `filter` parameter if used at all
- No repeated polling of background processes
