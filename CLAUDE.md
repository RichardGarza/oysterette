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
- Backend: Railway (auto-deploy from GitHub) — paused July 2026 (cost)
- CI: GitHub Actions (backend + mobile + web on every push)
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

**Quality:** 626/626 tests passing (backend 388/25 suites · mobile 86/13 · web 152/28) ✅ — enforced by CI on every push. Per-suite breakdown: [PROJECT_STATUS.md](PROJECT_STATUS.md).

**Compliance:** Apple App Store ~95% ready; Google Play docs ready.

**Phases:** 20–23 shipped (AR scanner, social, gamification, flavor viz); Phase 26 launch polish in progress (~85% — see ROADMAP.md).

**Latest Session (July 21, 2026):**
- CI/CD: working GitHub Actions workflow at repo root (backend w/ Postgres service, mobile, web) — first runs exposed and fixed 8 months of schema drift
- Backend: idempotent catch-up migration for all `db push`-only changes (Phases 20–23); fuzzy-overlap test made self-sufficient
- Mobile: JWT → expo-secure-store (needs new EAS build); web `next build` repaired — see [SESSION_LOGS.md](SESSION_LOGS.md)

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
4. **Railway:** Auto-deploys from main, $5/month credit, auto-sleeps. **Currently shut down intentionally (cost)** — resume from Railway dashboard; next deploy applies pending migrations automatically
5. **Schema changes:** ALWAYS create a migration (`npx prisma migrate dev --name <name>`) — NEVER bare `db push`. Drift between Neon and `prisma/migrations/` broke CI for every environment built from scratch (fixed July 2026 via catch-up migration)
6. **Neon:** 3GB storage, auto-sleeps
7. **Redis:** Optional (recommendations use in-memory cache if unavailable)
8. **Session Logs:** See SESSION_LOGS.md for detailed session history
9. **Roadmap:** See ROADMAP.md for future feature planning
10. **OTA Updates:** ALWAYS deploy to `production` branch: `eas update --branch production --message "msg"`

---

**Last Updated:** July 21, 2026
**Backend:** Railway paused intentionally (cost) — resume from dashboard; CI green ✅
**Database:** Live on Neon (131 unique oysters) ✅
**Tests:** 626/626 passing (100%) ✅
  - Backend: 388/388 ✅
  - Mobile: 86/86 ✅
  - Web App: 152/152 ✅
**Docs:** [DOCS.md](DOCS.md) index; ROADMAP condensed June 2026 (history in SESSION_LOGS + git)
**Latest Version:** 2.0.0 (Phase 26 ~85% — launch polish)
**Latest OTA Update:** Nov 9, 2025 — ship next OTA after Phase 26 UX fixes
