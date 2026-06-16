# Agent instructions (Oysterette)

Read **[CLAUDE.md](CLAUDE.md)** first — memory-safe test commands, OTA rules, and current status.

## Documentation map

**[DOCS.md](DOCS.md)** lists every project doc.

## Non-negotiables

1. **Tests before commit** — 388 + 86 + 152 must pass. Per package: `npm test 2>&1 | tail -30`.
2. **Never** run full `npm test` / `npm run build` without truncation in long agent sessions (CLAUDE.md).
3. **OTA** — `eas update --branch production`; update `LAST_UPDATED` in `mobile-app/src/screens/HomeScreen.tsx` in the same deploy.
4. **Mobile code** — **[STYLE_GUIDE.md](STYLE_GUIDE.md)**.
5. **Launch work** — **[ROADMAP.md](ROADMAP.md)** Phase 26.

## Layout

- `backend/` — API, Prisma, Railway from `main`
- `mobile-app/` — Expo (primary product)
- `backend/web-app/` — Next.js

Production API: `https://oysterette-production.up.railway.app/api`