# Oysterette - Core Project Reference

---

## 📘 DOCUMENT PURPOSE

**This file is for:** Core essentials and quick reference

**For all docs:** See [DOCS.md](DOCS.md)
**For session history:** See [SESSION_LOGS.md](SESSION_LOGS.md)
**For feature planning:** See [ROADMAP.md](ROADMAP.md)
**For code patterns:** See [STYLE_GUIDE.md](STYLE_GUIDE.md)
**For refactoring details:** See [REFACTORING_SUMMARY.md](REFACTORING_SUMMARY.md)
**For AI agents:** See [AGENTS.md](AGENTS.md)

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
- Web App: All 152 tests must pass
- Write tests FIRST for new endpoints/services
- Test happy path, edge cases, error handling

**Test Locations:**

- Backend unit: `backend/src/__tests__/unit/`
- Backend integration: `backend/src/__tests__/integration/`
- Mobile: `mobile-app/__tests__/`
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
- Web App: 152/152 tests passing (100%) ✅ - 28/28 suites passing ✅
  - ✅ Page tests: Login (5), Register (5), PublicProfile (13), Home (4), OysterList (6), OysterDetail (6), Profile (5), AddReview (11), Friends (5), XPStats (5), Favorites (5), TopOysters (5), Settings (6), PrivacySettings (6), ProfileReviews (6), PairedMatches (4), AddOyster (5), UserReviews (3), UserFavorites (3), UserFriends (3)
  - ✅ Component tests: Header (6), ReviewCard (5), RatingDisplay (3), EmptyState (4), LoadingSpinner (4), GoogleSignInButton (3)
  - ✅ Utility tests: FlavorLabels (11), API client structure (5)
  - **Test Coverage: 100% (152/152 target)** 🎉 - See backend/web-app/TESTING_ROADMAP.md
- **ALL TESTS PASSING ACROSS PROJECT** - 626/626 tests (100%) ✅

**Compliance:**
- Apple App Store: 95% ready
- Google Play Store: 100% documentation-ready

**Recent Completions:**
- Phase 22: Gamification & XP System (XP, levels, achievements, notifications)
- Phase 21: Social Features (friend system, activity feed, paired matches)
- Phase 20: AR Menu Scanner (OCR, fuzzy matching, unmatched detection)
- Phase 23: Enhanced Flavor Profile Visualization (ranges, tooltips)
- Phase 26 (In Progress): Production & launch polish (~85% — see ROADMAP.md)

**Latest Session (June 15–16, 2026):**
- Docs: [DOCS.md](DOCS.md), [AGENTS.md](AGENTS.md), [ROADMAP.md](ROADMAP.md), [PROJECT_STATUS.md](PROJECT_STATUS.md), local dev in [QUICK_START.md](QUICK_START.md)
- Backend: `oysterController` `FILTER_CONFIG.CENTER` fix (local `npm run dev`)
- Mobile Phase 26: suggest-oyster auth/copy, Add Oyster scroll/safe area, OysterList instant nav + back → Home — see [SESSION_LOGS.md](SESSION_LOGS.md)

**Nov 2025 (summary):** Web app tests → 152/152; project total 626/626. Production UX fixes (photos, dark mode, filters, XP reload, logos). Details: [SESSION_LOGS.md](SESSION_LOGS.md).

**Next Tasks:** [ROADMAP.md](ROADMAP.md) — AR polish, device QA, store screenshots, TestFlight/Play internal testing

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

**Last Updated:** June 15, 2026
**Backend:** Live on Railway ✅
**Database:** Live on Neon (131 unique oysters) ✅
**Tests:** 626/626 passing (100%) ✅
  - Backend: 388/388 ✅
  - Mobile: 86/86 ✅
  - Web App: 152/152 ✅
**Docs:** [DOCS.md](DOCS.md) index; ROADMAP condensed June 2026 (history in SESSION_LOGS + git)
**Latest Version:** 2.0.0 (Phase 26 ~85% — launch polish)
**Latest OTA Update:** Nov 9, 2025 — ship next OTA after Phase 26 UX fixes
