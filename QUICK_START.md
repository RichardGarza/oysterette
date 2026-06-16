# Oysterette — Quick Start

**Full doc index:** [DOCS.md](DOCS.md)

---

## Local backend + web UI (fastest way to “see the app”)

**Terminal 1 — API**
```bash
cd backend
# Requires backend/.env with DATABASE_URL and JWT_SECRET (see README)
npm run dev
```
API: http://localhost:3000 · Health: http://localhost:3000/api/health (if routed)

**Terminal 2 — Web frontend**
```bash
cd backend/web-app
# .env.local: NEXT_PUBLIC_API_URL=http://localhost:3000/api
npm run dev
```
Open **http://localhost:3001** in your browser.

Swagger (API docs UI): http://localhost:3000/api-docs (if enabled in backend)

---

## Mobile app (optional)

```bash
cd mobile-app
npm start
```
Press `i` (iOS) or `a` (Android). For local API, edit `mobile-app/src/services/api.ts` → uncomment `IOS_SIMULATOR_URL` or `ANDROID_EMULATOR_URL` instead of `PRODUCTION_URL`.

---

## Tests (required before commit)

From **each** package directory:

```bash
npm test 2>&1 | tail -30
```

| Package | Directory | Expected |
|---------|-----------|----------|
| Backend | `backend/` | 388 passing |
| Mobile | `mobile-app/` | 86 passing |
| Web | `backend/web-app/` | 152 passing |

Backend only:
```bash
cd backend
npm run test:unit
npm run test:integration
```

---

## Seed oysters

1. Edit `backend/data/oyster-list-for-seeding.json` (131 unique entries today).
2. `cd backend && npm run seed`

Duplicate checks: `backend/src/__tests__/unit/seedData.test.ts`

---

## API smoke test

```bash
curl http://localhost:3000/api/oysters
```

Register:
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","name":"Test","password":"pass123"}'
```

Details: [backend/API_DOCUMENTATION.md](backend/API_DOCUMENTATION.md)

---

## OTA update (mobile)

```bash
cd mobile-app
npm run deploy-update "Your message"
```

Always **`production`** branch; update `LAST_UPDATED` in `HomeScreen.tsx` — see [CLAUDE.md](CLAUDE.md).

---

## Status

Production API: `https://oysterette-production.up.railway.app/api`  
Snapshot: [PROJECT_STATUS.md](PROJECT_STATUS.md) · Launch tasks: [ROADMAP.md](ROADMAP.md)