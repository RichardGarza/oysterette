# Oysterette — Documentation Index

**Last updated:** June 15, 2026  
**Project:** v2.0.0 · Production-ready · **626/626 tests** (backend 388, mobile 86, web 152)

Use this file to find the right doc. Prefer **CLAUDE.md** for day-to-day agent/dev work.

---

## Start here

| Doc | Purpose |
|-----|---------|
| [README.md](README.md) | Product overview, stack, hosting, structure |
| [QUICK_START.md](QUICK_START.md) | Local dev, tests, seed data, API smoke tests |
| [CLAUDE.md](CLAUDE.md) | **Agent & session reference** — tests, OTA rules, commands, status |
| [AGENTS.md](AGENTS.md) | Short rules for AI coding agents |
| [PROJECT_STATUS.md](PROJECT_STATUS.md) | One-page current snapshot |
| [ROADMAP.md](ROADMAP.md) | Done features, Phase 26 launch checklist, future ideas |

---

## Code quality & history

| Doc | Purpose |
|-----|---------|
| [STYLE_GUIDE.md](STYLE_GUIDE.md) | Mobile patterns (constants, hooks, types) |
| [REFACTORING_SUMMARY.md](REFACTORING_SUMMARY.md) | Refactor metrics (Nov 2025) |
| [SESSION_LOGS.md](SESSION_LOGS.md) | Session-by-session history |
| [SESSION_SUMMARY.md](SESSION_SUMMARY.md) | Legacy pointer → SESSION_LOGS |

---

## API & backend

| Doc | Purpose |
|-----|---------|
| [backend/API_DOCUMENTATION.md](backend/API_DOCUMENTATION.md) | REST endpoints |
| [BUILD_OPTIMIZATION.md](BUILD_OPTIMIZATION.md) | Build size / depcheck |
| [DEPLOYMENT_PLAN.md](DEPLOYMENT_PLAN.md) | Deployment notes |

---

## Web app (`backend/web-app`)

| Doc | Purpose |
|-----|---------|
| [backend/web-app/README.md](backend/web-app/README.md) | Web app setup |
| [backend/web-app/.env.local.example](backend/web-app/.env.local.example) | Local API URL template |
| [backend/.env.example](backend/.env.example) | Backend env template |
| [backend/web-app/TESTING_ROADMAP.md](backend/web-app/TESTING_ROADMAP.md) | Jest coverage (complete) |
| [backend/web-app/WEB_APP_SUMMARY.md](backend/web-app/WEB_APP_SUMMARY.md) | Feature summary |
| [backend/web-app/WEB_APP_FEATURE_PARITY_PLAN.md](backend/web-app/WEB_APP_FEATURE_PARITY_PLAN.md) | Mobile parity |

---

## App Store & compliance (`docs/`)

| Doc | Purpose |
|-----|---------|
| [docs/SUBMISSION_GUIDE.md](docs/SUBMISSION_GUIDE.md) | Store submission |
| [docs/SCREENSHOT_SPECIFICATIONS.md](docs/SCREENSHOT_SPECIFICATIONS.md) | Screenshot specs |
| [docs/APP_STORE_METADATA.md](docs/APP_STORE_METADATA.md) | Store copy |
| [docs/COMPLIANCE_CHECKLIST.md](docs/COMPLIANCE_CHECKLIST.md) | Pre-submission |
| [docs/PRIVACY_POLICY.md](docs/PRIVACY_POLICY.md) | Privacy policy |
| [docs/TERMS_OF_SERVICE.md](docs/TERMS_OF_SERVICE.md) | Terms |
| [docs/DATA_SAFETY_DISCLOSURE.md](docs/DATA_SAFETY_DISCLOSURE.md) | Play data safety |
| [docs/CLOUDINARY_SETUP.md](docs/CLOUDINARY_SETUP.md) | Image hosting |
| [docs/ANONYMOUS_REVIEWS.md](docs/ANONYMOUS_REVIEWS.md) | Anonymous reviews |

---

## Other

| Doc | Purpose |
|-----|---------|
| [UI_MODERNIZATION_PLAN.md](UI_MODERNIZATION_PLAN.md) | Paper migration (historical) |

---

## Maintenance

1. Status changes → `PROJECT_STATUS.md`, `ROADMAP.md` Phase 26, `CLAUDE.md` footer.
2. Session detail → `SESSION_LOGS.md`; keep `CLAUDE.md` latest session short.
3. Endpoint changes → `backend/API_DOCUMENTATION.md`.
4. Long phase history → `SESSION_LOGS.md`, not `ROADMAP.md`.

**Tests (per package):** `npm test 2>&1 | tail -30` — see CLAUDE.md.