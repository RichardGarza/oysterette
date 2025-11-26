# Oysterette - Core Project Reference

---

## 📘 DOCUMENT PURPOSE

**This file is for:** Core essentials and quick reference

**For session history:** See [SESSION_LOGS.md](SESSION_LOGS.md)
**For feature planning:** See [ROADMAP.md](ROADMAP.md)
**For code patterns:** See [STYLE_GUIDE.md](STYLE_GUIDE.md)
**For refactoring details:** See [REFACTORING_SUMMARY.md](REFACTORING_SUMMARY.md)

---

## ⚠️ MEMORY MANAGEMENT - CRITICAL

**PROBLEM:** Claude Code stores ALL bash output in memory. Previous sessions crashed with 90+ GB memory.

### 🚨 MANDATORY: USE THESE EXACT COMMANDS 🚨

**NEVER run these raw commands:**
❌ `npm test` - WILL CRASH WITH 90GB+ MEMORY
❌ `npm run build` - WILL CRASH WITH 90GB+ MEMORY
❌ `npm install` - Use with `--silent`
❌ Running ANY test/build in background

**ALWAYS use these safe versions:**

```bash
# ✅ TESTS - ALWAYS WITH TRUNCATION (timeout: 120000)
npm test 2>&1 | tail -30

# ✅ BUILDS - ERRORS ONLY
npm run build 2>&1 | grep -i "error\|warning" || echo "✅ Build successful"

# ✅ INSTALLS - SILENT MODE
npm install --silent

# ✅ GIT - SHORT FORMAT (once per session max)
git status --short
git diff --stat
```

### Critical Rules:

1. **Output Truncation:** MANDATORY for all npm commands - no exceptions
2. **Background Processes:** NEVER run tests/builds in background
3. **File Reading:** Use `limit`/`offset` for large files
4. **Session Length:** <30 msgs optimal, 50+ high risk, 70+ critical
5. **If memory hits 90GB:** Only fix is restarting Claude Code

---

## 🧪 TESTING POLICY

**CRITICAL: All new features require tests before commit.**

**Test Command - ONLY USE THIS VERSION:**

```bash
npm test 2>&1 | tail -30  # MANDATORY truncation, timeout: 120000
```

❌ **NEVER** use `npm test` without truncation - WILL CRASH WITH 90GB+ MEMORY

**Test Before Committing:**

- Backend: All 388 tests must pass
- Mobile: All 86 tests must pass
- Web App: All 134 tests must pass
- Write tests FIRST for new endpoints/services
- Test happy path, edge cases, error handling

**Test Locations:**

- Backend unit: `backend/src/__tests__/unit/`
- Backend integration: `backend/src/__tests__/integration/`
- Mobile: `mobile-app/src/__tests__/`
- Web App: `backend/web-app/__tests__/`

🚨 **DO NOT COMMIT WITHOUT PASSING TESTS** 🚨

---

## 📚 CODE QUALITY & REFACTORING

**COMPREHENSIVE REFACTORING COMPLETED:** November 2025

**Status:** ✅ 100% of mobile app refactored (13/13 screens + all utils/services/components)

**Key Documents:**
- **STYLE_GUIDE.md** - Complete refactoring patterns, examples, and enforcement rules
- **REFACTORING_SUMMARY.md** - Detailed metrics, results, and remaining work guide

**Quick Facts:**
- ✅ 3,000+ lines removed (excessive documentation)
- ✅ 25+ `any` types eliminated (complete type safety)
- ✅ 40+ performance optimizations added (React.memo, useCallback, useMemo)
- ✅ 90+ magic numbers extracted to named constants
- ✅ All 229 tests passing after refactoring

**Apply to New Code:**
- Maximum 5 lines for file headers
- Extract ALL magic numbers to constants
- Use `useCallback` for event handlers
- Use `useMemo` for computed values
- Wrap console statements in `if (__DEV__)`
- No `any` types - use proper TypeScript
- Add `readonly` to props interfaces

**See STYLE_GUIDE.md for complete patterns and examples.**

---

## 📊 CURRENT STATUS

**Infrastructure:**
- Database: Neon PostgreSQL (131 unique oysters)
- Backend: Railway (auto-deploy from GitHub)
- Mobile: EAS Build + OTA Updates
- Security: Rate limiting, validation, JWT, Sentry

**Features:**
- Auth (register, login, Google OAuth)
- Oyster browsing, fuzzy search, advanced filters
- Reviews with ratings, voting, credibility
- Favorites sync across devices
- Duplicate review detection/update
- Dark mode with persistence
- Personalized recommendations
- Baseline flavor profile with auto-learning
- Social features (friends, activity feed, paired recommendations)
- Gamification (XP system, levels, achievements, leaderboard)

**Quality:**
- Backend: 388/388 tests passing (100%) ✅ - 25/25 suites passing ✅
  - ✅ Unit tests, integration tests, compilation tests
- Mobile: 86/86 tests passing (100%) ✅ - 13/13 suites passing ✅
  - ✅ Component tests: ProfileUsername (4), ReviewCardUsername (2), Menu (3), AROverlay (2), ProfileScreenPublic (3)
  - ✅ Integration tests: RegisterUsername (3), navigation (3), oysterApi (3), ARScanner (3)
  - ✅ Screen tests: LoginScreen, FriendFavoritesScreen, OysterListScreen
  - ✅ Hook tests: useQueries
- Web App: 134/134 tests passing (100%) ✅ - 23/23 suites passing ✅
  - ✅ Page tests: Login (5), Register (5), PublicProfile (13), Home (4), OysterList (6), OysterDetail (6), Profile (5), AddReview (11), Friends (5), XPStats (5), Favorites (5), TopOysters (5), Settings (6), PrivacySettings (6), ProfileReviews (6)
  - ✅ Component tests: Header (6), ReviewCard (5), RatingDisplay (3), EmptyState (4), LoadingSpinner (4), GoogleSignInButton (3)
  - ✅ Utility tests: FlavorLabels (11), API client structure (5)
  - **Test Coverage: 89% (116/130 target)** ✅ - See backend/web-app/TESTING_ROADMAP.md
- **ALL TESTS PASSING ACROSS PROJECT** - 608/608 tests (100%) ✅

**Compliance:**
- Apple App Store: 95% ready
- Google Play Store: 100% documentation-ready

**Recent Completions:**
- Phase 22: Gamification & XP System (XP, levels, achievements, notifications)
- Phase 21: Social Features (friend system, activity feed, paired matches)
- Phase 20: AR Menu Scanner (OCR, fuzzy matching, unmatched detection)
- Phase 23: Enhanced Flavor Profile Visualization (ranges, tooltips)
- Phase 26 (In Progress): Production Testing Fixes (65% complete)

**Latest Session (Nov 25, 2025):**
- ✅ All test suites now at 100% passing (608/608 tests) - increased from 570
- ✅ Completed Phase 4 & 5 of Web App Testing Roadmap - 38 new tests added!
  - Friends page (5): Auth redirect, loading, friends list, empty state, pending count
  - XP Stats page (5): Auth redirect, loading, XP display, achievements, error state
  - Favorites page (5): Auth redirect, loading, list display, empty state, details
  - Top Oysters page (5): Loading, ranked display, numbers, no-reviews filter, empty
  - Settings page (6): Auth redirect, sections display, theme toggle, logout, password modal, version
  - Privacy Settings page (6): Auth redirect, options display, dropdown, toggles, save, state update
  - Profile Reviews page (6): Auth redirect, loading, list display, empty state, back link, error handling
- 📊 Web App Testing Progress:
  - Phase 1: ✅ Complete (37% coverage) - Login, Register, ReviewCard, RatingDisplay
  - Phase 2: ✅ Complete (61% coverage) - OysterList, OysterDetail, Home, EmptyState, LoadingSpinner
  - Phase 3: ✅ Complete (96% coverage) - Profile, AddReview, GoogleSignIn, FlavorLabels, API structure
  - Phase 4: ✅ Complete (89% coverage) - Friends, XPStats, Favorites, TopOysters
  - Phase 5: ✅ Complete (98% coverage) - Settings, PrivacySettings, ProfileReviews

**Previous Session (Nov 23, 2025):**
- ✅ Completed Phase 3 of Web App Testing Roadmap - 96% coverage achieved!
  - GoogleSignInButton (3): Button rendering, custom text, missing client ID error
  - FlavorLabels utility (11): All attribute labels, boundary values, edge cases, range labels
  - API client structure (5): Verified all API modules export expected functions
  - Profile page (5): Auth redirect, loading state, profile display, stats, XP badge
  - AddReview page (11): Form rendering, rating selection, attribute sliders, submission, error handling, duplicate detection, edit mode, cancel

**Previous Session (Nov 19, 2025):**
- ✅ Created Web App Testing Roadmap (backend/web-app/TESTING_ROADMAP.md)
- ✅ Phase 1 & 2 - Added Web App Tests (42 tests)
  - Login Page (5): Form rendering, successful login, error handling, generic errors, loading state
  - Register Page (5): Form rendering, successful registration, password mismatch, password length, error handling
  - ReviewCard Component (5): Content display, user info, vote buttons, edit/delete, delete functionality
  - RatingDisplay Component (3): Star display, perfect score, zero reviews handling
- ✅ Phase 2 - Added Web App Tests (24 tests)
  - EmptyState Component (4): Render with title/desc, custom icon, action button, action link
  - LoadingSpinner Component (4): Default text, custom text, different sizes, fullscreen
  - Home Page (4): Hero section, top oysters, user stats, recommendations
  - Oyster List Page (6): Heading/search, oysters display, loading state, empty state, search debounce, sort
  - Oyster Detail Page (6): Loading state, oyster details, reviews display, empty reviews, favorite toggle, no favorite button when not auth
- ✅ Fixed React act() warnings in web app tests
  - Updated all PublicProfile tests to properly wait for async operations
  - Ensured both profile and reviews API calls complete before assertions
- ✅ Username display tests complete: 6/6 passing
  - ProfileUsername: 4/4 tests (renders input, accessibility, displays username/name)
  - ReviewCardUsername: 2/2 tests (displays username, falls back to name)
  - Fixed: React Query hooks mocking, react-native-paper mocks, QueryClientProvider

**Previous Session (Nov 9, 2025):**
- ✅ Profile photos in reviews (backend API missing profilePhotoUrl)
- ✅ Rate limiting updated to industry standard (60 req/min)

**Previous Session (Nov 8, 2025):**
- ✅ Profile photos display immediately after upload
- ✅ Review photos display in horizontal gallery
- ✅ XP & Achievements page reloads on navigation
- ✅ Dark mode persists after app close
- ✅ Camera permissions only requested when needed
- ✅ Review attributes pre-populate correctly in edit mode
- ✅ Home screen shows logo (matches Browse screen)
- ✅ Friends button hidden when not logged in
- ✅ Stats cards clickable (Reviews → Profile, Favorites → List)
- ✅ Empty states added to XP tabs
- ✅ Debug logging added for troubleshooting

**Next Tasks:** See ROADMAP.md Phase 26 for remaining production testing fixes

---

## 🚀 OTA UPDATE RULES - MANDATORY

**CRITICAL: Every OTA update MUST:**
1. **Deploy to `production` branch:** `eas update --branch production --message "msg"` (NOT preview)
2. **Update homepage timestamp:** Edit `mobile-app/src/screens/HomeScreen.tsx` → `LAST_UPDATED` constant to current time (e.g., `'02:15 PM'`)
3. **Include both in same update:** Timestamp change + feature changes in single deployment

**Script:** `npm run deploy-update "message"` now auto-deploys to production branch

---

## 🔧 QUICK COMMANDS

**Backend:**

```bash
npm run dev                        # Local development
npm run build 2>&1 | grep -i error # Build (errors only)
npm test 2>&1 | tail -30          # Tests (summary)
npx prisma migrate deploy          # Deploy migrations
npx prisma generate                # Regenerate Prisma client
```

**Mobile:**

```bash
npm start                                                  # Dev server
eas update --branch production --message "your message"    # OTA update (ALWAYS use production branch)
npm run build:android:prod                                 # Full APK build
eas build --platform ios                                   # iOS build
```

🚨 **CRITICAL: Always deploy OTA updates to `production` branch for testing!**

**Git:**

```bash
git status --short                 # Status (once/session)
git diff --stat                    # Changes summary
git push origin main               # Deploy (triggers Railway)
```

---

## 🚨 IMPORTANT NOTES

1. **Environment:**
   - DATABASE_URL (Neon) - REQUIRED
   - JWT_SECRET - REQUIRED (never use default)
   - REDIS_HOST - OPTIONAL (for caching, falls back to in-memory)
   - SENTRY_DSN - OPTIONAL (error tracking)
2. **API URL:** Production: `https://oysterette-production.up.railway.app/api`
3. **Testing:** All tests must pass before push
4. **Railway:** Auto-deploys from main, $5/month credit, auto-sleeps
5. **Neon:** 3GB storage, auto-sleeps
6. **Redis:** Optional (recommendations use in-memory cache if unavailable)
7. **Session Logs:** See SESSION_LOGS.md for detailed session history
8. **Roadmap:** See ROADMAP.md for future feature planning
9. **OTA Updates:** ALWAYS deploy to `production` branch: `eas update --branch production --message "msg"`

---

**Last Updated:** November 25, 2025
**Backend:** Live on Railway ✅
**Database:** Live on Neon (131 unique oysters) ✅
**Tests:** 608/608 passing (100%) ✅
  - Backend: 388/388 ✅
  - Mobile: 86/86 ✅
  - Web App: 134/134 ✅ (Phase 5 complete - 98% coverage!)
**Latest Version:** 2.0.0 (Phase 26 - Production Testing 65% Complete)
**Latest OTA Update:** Nov 9, 2025 - Profile photos in reviews fix + rate limiting
