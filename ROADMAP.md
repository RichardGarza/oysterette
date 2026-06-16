# Oysterette v2.0 — Roadmap

**Last updated:** June 15, 2026  
**Tests:** 626/626 (backend 388 · mobile 86 · web 152)  
**Current focus:** Phase 26 — App Store / Play launch polish

---

## Document purpose

| Use this file for | Use elsewhere |
|-------------------|---------------|
| Launch checklist (Phase 26) | Implementation detail → **CLAUDE.md** |
| High-level done / planned | Session history → **SESSION_LOGS.md** |
| Future ideas (post-launch) | Code patterns → **STYLE_GUIDE.md** |
| | Full doc list → **DOCS.md** |

---

## Shipped (summary)

All core product phases are complete. Highlights:

- **Platform:** Neon + Railway + EAS; Next.js web app with test parity plan executed.
- **Auth & security:** JWT, Google OAuth, Zod, rate limiting, bcrypt.
- **Oysters:** 131 unique seed entries; fuzzy search; filters; community add (auth required).
- **Reviews:** Ratings, attributes, duplicate detection, anonymous flow, photos, voting, credibility.
- **UX:** React Native Paper, dark mode persistence, recommendations, flavor baseline.
- **Social & XP:** Friends, activity, paired matches; levels, achievements, leaderboard.
- **AR:** Menu scanner (OCR) — usable; refinement deferred below.
- **Quality:** Refactor per STYLE_GUIDE; web Jest roadmap 100%.

Granular phase history is in **SESSION_LOGS.md** and older roadmap text in **git history** (pre–June 2026).

---

## Phase 26 — Production & launch 🚧

**Goal:** Ship mobile to TestFlight / internal Play testing, then store submission.  
**Estimate:** ~85% code complete; remaining is mostly UX polish, manual QA, assets.

### Done (verified in codebase / Nov 2025 sessions)

- List/card layout (species, long names, top-rated cards)
- Filters on OysterList; favorites; review attribute pre-fill (`??` / seed fallback)
- Review & profile photos in UI; XP screen refresh on focus
- Dark mode persistence; camera permission on use (not on profile mount)
- Home: logo header, friends hidden when logged out, clickable stats
- Android back on Home → exit confirm; API retry (`axios-retry`)
- Usernames on reviews; optional species/origin → `Unknown` on add oyster
- Header logo `Top-Bar-Oysterette-Name.png`; web + mobile test suites green

### Open — mobile UX (priority)

| Item | Status | Notes |
|------|--------|--------|
| Add Oyster scroll / buttons | ✅ Done | Safe area insets, keyboard offset, extra scroll padding |
| Browse transition | ✅ Done | `animation: 'none'` on OysterList |
| Suggest-oyster auth | ✅ Done | `suggestOysterNavigation.ts`; login prompt + copy |
| OysterList back | ✅ Done | Custom `headerLeft` → Home |

### Open — backend / local dev

| Item | Status | Notes |
|------|--------|--------|
| `getAllOysters` compile error | ✅ Done | `FILTER_CONFIG.CENTER` (was broken `CENTER` ref) |
| Local API + web | ✅ Documented | `QUICK_START.md`, `backend/.env.example`, web README port 3001 |

### Open — AR scanner (medium, deferred)

- Static preview while OCR runs; tighten fuzzy match (no full-DB dump); top-N results  
- `ScanMenuScreen.tsx`, OCR service

### Open — launch ops (critical path)

| Item | Doc |
|------|-----|
| Device QA (iOS + Android) | This checklist |
| Store screenshots | `docs/SCREENSHOT_SPECIFICATIONS.md` |
| TestFlight / internal testing | `docs/SUBMISSION_GUIDE.md` |
| Final OTA to `production` + `LAST_UPDATED` | **CLAUDE.md** |
| Compliance pass | `docs/COMPLIANCE_CHECKLIST.md` |

### Open — reliability (as needed)

- Monitor Railway/Neon cold starts; Sentry if not already wired in prod env  
- Skeleton/error/retry UI on remaining screens if QA finds gaps  

---

## Post-launch (ideas, not scheduled)

- Push notifications  
- Taste quiz / challenges  
- Share/export reviews  
- Sign in with Apple (if not already required for submission)  
- Collaborative oyster edits / version history  

---

## Next session starting point

1. Pick one **Phase 26 open — mobile UX** row and ship + test.  
2. Run tests in `backend`, `mobile-app`, `backend/web-app` with `npm test 2>&1 | tail -30`.  
3. Log work in **SESSION_LOGS.md**; update this file when a row closes.  
4. See **DOCS.md** for all references.