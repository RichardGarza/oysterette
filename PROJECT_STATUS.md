# Oysterette — Project Status

**Last updated:** July 21, 2026  
**Version:** 2.0.0  
**Overall:** Production-ready · **626/626 tests passing** · CI green on every push

---

## Infrastructure

| Component | Host | Status |
|-----------|------|--------|
| PostgreSQL | Neon | Live · **131 unique oysters** |
| API | Railway (`main`) | **Paused intentionally (cost)** — resume from dashboard; pending migrations apply on next deploy |
| CI | GitHub Actions | Backend (Postgres service + migrations) · mobile · web on every push |
| Mobile | EAS Build / Update | OTA branch: **`production`** |
| Web | Next.js in `backend/web-app` | Full Jest coverage |

**API:** `https://oysterette-production.up.railway.app/api`

---

## Features (shipped)

**Mobile:** Auth (email, Google), browse/search/filters, favorites, reviews (incl. anonymous), photos, voting/credibility, XP/achievements, recommendations, flavor profile, friends/social, AR menu scanner (needs polish), dark mode.

**Backend:** Validation, rate limiting, logging, optional Sentry/Redis, Cloudinary photos, gamification APIs.

**Web:** Core parity with mobile; 152 page/component tests.

---

## Tests

| Package | Path | Count |
|---------|------|-------|
| Backend | `backend/src/__tests__/` | 388 |
| Mobile | `mobile-app/__tests__/` | 86 |
| Web | `backend/web-app/__tests__/` | 152 |

---

## Store readiness

Legal/metadata in `docs/`. Google Play docs ready. Apple ~95% — screenshots, TestFlight, any remaining Sign in with Apple requirements.

**In progress:** Phase 26 launch polish → [ROADMAP.md](ROADMAP.md).

---

## Docs

[DOCS.md](DOCS.md) · [QUICK_START.md](QUICK_START.md) · [SESSION_LOGS.md](SESSION_LOGS.md)