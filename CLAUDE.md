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

- Backend: All 229 tests must pass
- Write tests FIRST for new endpoints/services
- Test happy path, edge cases, error handling

**Test Locations:**

- Backend unit: `backend/src/__tests__/unit/`
- Backend integration: `backend/src/__tests__/integration/`

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

**Quality:** 229/229 tests passing ✅

**Compliance:**
- Apple App Store: 95% ready
- Google Play Store: 100% documentation-ready

**Next Critical Tasks:** See ROADMAP.md Phase 14

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
npm start                          # Dev server
npm run deploy-update "message"    # OTA update
npm run build:android:prod         # Full APK build
eas build --platform ios           # iOS build
```

**Git:**

```bash
git status --short                 # Status (once/session)
git diff --stat                    # Changes summary
git push origin main               # Deploy (triggers Railway)
```

---

## 🚨 IMPORTANT NOTES

1. **Environment:** DATABASE_URL (Neon), JWT_SECRET (never default), SENTRY_DSN (optional)
2. **API URL:** Production: `https://oysterette-production.up.railway.app/api`
3. **Testing:** All 229 tests must pass before push
4. **Railway:** Auto-deploys from main, $5/month credit, auto-sleeps
5. **Neon:** 3GB storage, auto-sleeps
6. **Session Logs:** See SESSION_LOGS.md for detailed session history
7. **Roadmap:** See ROADMAP.md for future feature planning and Phase 14 details

---

**Last Updated:** November 7, 2025
**Backend:** Live on Railway ✅
**Database:** Live on Neon (131 unique oysters) ✅
**Tests:** 229/229 passing ✅
**Latest Version:** 1.6.0 (with personalized recommendations & flavor profiles)
