# Oysterette v2.0 - Development Roadmap

---
## 📘 DOCUMENT PURPOSE

**This file is for:** High-level feature planning and status tracking

**Use this file for:**
- Overview of completed and planned features
- Feature status at a glance (✅ Done, 🚧 In Progress, 📋 Planned)
- Phase-based project organization
- Quick reference for what exists and what's next

**Do NOT use this file for:**
- Detailed implementation notes (use CLAUDE.md)
- Session-by-session progress (use CLAUDE.md)
- Troubleshooting documentation (use CLAUDE.md)
- Specific file paths and code changes (use CLAUDE.md)

**When to update:** When a feature/phase is completed or status changes
---

## Project Status: Production Ready ✅

**Last Updated:** November 6, 2025
**Current Phase:** Bug Fixes & Feature Enhancements

---

## ✅ Completed Phases

### Phase 1: Initial Setup & Core Infrastructure ✅

**Status:** Complete
**Completion Date:** Initial commit

- [x] Backend Express server with TypeScript
- [x] PostgreSQL database with Prisma ORM
- [x] React Native mobile app with Expo
- [x] JWT authentication system
- [x] Basic CRUD API endpoints for oysters and reviews
- [x] Mobile navigation setup (React Navigation)
- [x] Production deployment on Railway
- [x] Neon database integration

### Phase 2: Data Seeding & Base Features ✅

**Status:** Complete
**Completion Date:** Commit 6a52364

- [x] Comprehensive oyster database (838 oysters)
- [x] Oyster list screen with search
- [x] Oyster detail screen with full information
- [x] Review display functionality
- [x] User authentication (login/register)
- [x] Review submission system

### Phase 3: Production Hardening & Security ✅

**Status:** Complete
**Completion Date:** November 3, 2025

- [x] Input validation with Zod schemas
- [x] Rate limiting (auth & API endpoints)
- [x] JWT security enhancements
- [x] Professional logging with Winston
- [x] Error tracking with Sentry
- [x] Comprehensive test suite (162 tests passing)
- [x] TypeScript compilation tests
- [x] Validation middleware tests
- [x] Rate limiting tests

### Phase 4: Enhanced Features ✅

**Status:** Complete
**Completion Date:** November 3-5, 2025

- [x] Fuzzy search with Fuse.js (handles typos)
- [x] Theme persistence and user preferences
- [x] Global settings access from all screens
- [x] Auto-login on app start
- [x] Theme sync across devices
- [x] Dark mode support

### Phase 5: Google OAuth & Authentication ✅

**Status:** Complete
**Completion Date:** November 5, 2025

- [x] Native Google Sign-In SDK integration
- [x] Backend OAuth verification endpoint
- [x] Android OAuth client configuration
- [x] iOS URL scheme setup
- [x] Google Cloud Console credentials
- [x] One-tap Google sign-in

### Phase 6: UX Polish & Bug Fixes ✅

**Status:** Complete
**Completion Date:** November 6, 2025

- [x] Dynamic slider labels with descriptive words
- [x] Auth token bug fix (interceptor)
- [x] HomeScreen auth state management
- [x] Larger logos (60% increase)
- [x] Faster transition animations (900ms)
- [x] Enhanced debug logging
- [x] Settings screen with actual user data
- [x] Keyboard handling improvements
- [x] Color coding fixes for sliders

### Phase 7: Advanced Rating & Voting System ✅

**Status:** Complete
**Completion Date:** Commit d0563bb

#### Backend Implementation ✅

- [x] Database schema for voting system
  - Vote table (user + review + agree/disagree)
  - User credibility fields (score, agrees, disagrees)
  - Review vote metrics (agree/disagree counts, weighted scores)
- [x] Voting service with credibility calculation
  - Asymmetric voting (Agree +1.0, Disagree -0.6)
  - Review weighted scores (0.4 to 1.5 range)
  - Reviewer credibility scores (0.5 to 1.5 range)
  - Credibility badges (Expert ≥1.3, Trusted ≥1.15, Standard ≥0.85, New <0.85)
- [x] Vote API endpoints
  - POST `/api/reviews/:reviewId/vote` - Cast/update vote
  - DELETE `/api/reviews/:reviewId/vote` - Remove vote
  - GET `/api/reviews/votes` - Batch fetch user votes
  - GET `/api/users/:userId/credibility` - Get credibility info
- [x] TypeScript compilation fixes with @ts-ignore for middleware properties

#### Mobile App Implementation ✅

- [x] ReviewCard component with voting UI
  - Vote buttons (Agree 👍 / Disagree 👎)
  - Real-time vote count display
  - Toggle voting (tap same button to remove)
  - Vote switching support
  - Loading states during submission
  - Color-coded active states (green/red)
  - Reviewer credibility badges
- [x] OysterDetailScreen integration
  - Vote state management
  - Batch vote fetching
  - Automatic refresh on vote changes
- [x] Voting API client functions
  - voteApi.vote()
  - voteApi.removeVote()
  - voteApi.getUserVotes()
  - voteApi.getUserCredibility()
- [x] Type definitions for voting metrics
- [x] Fixed scrolling issue (disabled React Native New Architecture)

---

## 🚧 Current Work - Phase 8: Feature Enhancements

### Phase 8.1: Duplicate Review Detection 🎯 (IN PROGRESS)

**Estimated Duration:** 3-4 hours
**Priority:** HIGH
**Status:** Starting Now

- [ ] Backend check endpoint for existing reviews
- [ ] Backend update review endpoint (PUT)
- [ ] Mobile duplicate detection flow
- [ ] Modal prompt for review updates
- [ ] Pre-populate AddReviewScreen with existing data
- [ ] Tests for duplicate detection logic
- [ ] Tests for review update functionality

### Phase 8.2: UI/UX Improvements 📋 (HIGH PRIORITY)

**Estimated Duration:** 2-3 hours
**Priority:** HIGH

- [ ] Redesign OysterList top bar (remove title, add login button)
- [ ] Fix ReviewCard dark mode display
- [ ] Add spacing between logout/delete account buttons
- [ ] Fix navigation flow (no back to login when logged in)
- [ ] Remove back button from HomeScreen
- [ ] Verify favorites sync with user account

### Phase 8.3: App Icon & Distribution 📱

**Priority:** MEDIUM

- [ ] Fix app icon zoom (edit adaptive-icon.png with padding)
- [ ] Remove unused dependencies for smaller APK
- [ ] Test depcheck workflow
- [ ] Build optimized APK

### Phase 8.4: Additional Features (Optional) 🚧

**Priority:** LOW
**Status:** Partial Progress

- [x] **Review submission functionality** (Oct 31)
  - AddReviewScreen with emoji ratings and sliders
  - Form validation and API integration
  - Write Review button in OysterDetailScreen
- [x] **Review sorting options** (Oct 31)
  - Sort by: Most Helpful, Most Recent, Highest, Lowest
  - Tab-based UI with visual feedback
- [x] **Favorites/Bookmarks** (Oct 31)
  - AsyncStorage-based local persistence
  - Heart icon toggle on list and detail screens
  - Filter tabs (All/Favorites) on oyster list
  - Empty state for favorites view
- [x] **Review filtering by rating** (Oct 31)
  - Filter chips with emojis (All, Loved, Liked, Meh, Hated)
  - Works in combination with sort options
  - Clean chip-based UI design
- [x] **Top Oysters list feature** (Nov 2)
  - TopOystersScreen showing top 50 oysters by rating
  - Circular ranking badges (#1, #2, etc.)
  - Filters to only show oysters with reviews
  - Pull-to-refresh functionality
  - Gold "🏆 Top Oysters" button on HomeScreen
- [ ] Add ability to edit/delete own reviews
- [ ] Add user profile screen

---

## 🔮 Future Phases (Post-MVP)

### Phase 7: Social Features

- [ ] User profiles with review history
- [ ] Follow/unfollow other users
- [ ] Activity feed
- [ ] Review comments/replies
- [ ] Share reviews externally

### Phase 8: Advanced Search & Discovery

- [ ] Advanced oyster filters (region, size, taste profile)
- [ ] Personalized recommendations
- [ ] "Similar oysters" suggestions
- [ ] Search history and saved searches
- [ ] Taste profile quiz

### Phase 9: Gamification

- [ ] User badges and achievements
- [ ] Oyster tasting challenges
- [ ] Leaderboards (most reviews, most helpful, etc.)
- [ ] Streak tracking for reviews
- [ ] Expert reviewer certification

### Phase 10: Production Readiness

- [ ] Comprehensive testing (unit, integration, E2E)
- [ ] Performance optimization
- [ ] Security audit
- [ ] App store submission (iOS/Android)
- [ ] Marketing materials and screenshots
- [ ] Privacy policy and terms of service
- [ ] Analytics integration
- [ ] Error tracking (Sentry)
- [ ] Push notifications setup

---

## 🏗️ Technical Debt & Maintenance

### Known Issues:

- [ ] TypeScript @ts-ignore usage for req.userId (need proper type augmentation fix)
- [ ] SafeAreaView deprecation warning (migrate to react-native-safe-area-context)
- [ ] Consider implementing proper vote optimistic updates

### Code Quality:

- [ ] Add backend unit tests
- [ ] Add mobile component tests
- [ ] Set up CI/CD pipeline
- [ ] Add code linting/formatting enforcement
- [ ] Add API documentation (Swagger/OpenAPI)

### Performance:

- [ ] Database query optimization and indexing
- [ ] Implement caching strategy (Redis)
- [ ] Optimize mobile bundle size
- [ ] Add image optimization and CDN

---

## 📋 Development Notes

### User Preferences:

- **Token Reporting:** Display token usage and remaining tokens after each request/response

  - Format: "Current: X / 200,000 (Y% used) | Remaining: Z tokens (W%)"
  - Include time until next 50k tokens regenerate (hours and minutes)
  - Token regeneration rate: ~8,333 tokens/hour (200k over 24 hours)
  - User wants to track conversation length to avoid cutoffs

- **Testing Policy:** Add tests with each new feature to keep the app robust
  - Write tests for new features before committing
  - Run all tests after implementing each new feature
  - Ensure tests pass before committing code
  - Backend: Unit tests for controllers, services, and utilities
  - Mobile: Component tests for UI components and screens
  - Integration tests for API endpoints
  - This maintains code quality and catches regressions early

### Environment Setup:

- **Backend:** Node.js, TypeScript, Express, Prisma, PostgreSQL
- **Database:** Neon (production), PostgreSQL (local)
- **Mobile:** React Native, Expo SDK 54, TypeScript
- **Deployment:** Railway (backend), EAS (mobile builds)

### Current Servers:

- Backend: `http://localhost:3000` (development)
- Production: `https://oysterette-production.up.railway.app`
- Mobile: Expo Dev Server on port 8081

### Important Commands:

```bash
# Backend
cd backend
npm run dev              # Start development server
npx prisma db push      # Push schema changes
npx prisma generate     # Regenerate Prisma client

# Mobile App
cd mobile-app
npx expo start --ios    # Start iOS simulator
eas build --platform android --profile preview  # Build Android
eas update              # Deploy OTA update

# Git
git status
git add .
git commit -m "message"
git push
```

---

## 🎯 Tomorrow's Starting Point

**Resume at:** Phase 6.1 - Manual Testing & Bug Fixes

**First Tasks:**

1. Restart the mobile app to test scrolling fix (newArchEnabled=false)
2. Thoroughly test the voting system:
   - Navigate to an oyster with reviews
   - Test all vote button functionality
   - Verify vote persistence and counts
   - Test credibility badges display
3. Document any bugs found
4. Fix critical issues before moving to Phase 6.2

**Backend Status:** ✅ Running and stable
**Mobile App Status:** ⚠️ Needs scrolling verification
**Database:** ✅ Schema up to date with voting system

---

**Last Session Summary:**

- Completed Phase 5.3 backend and mobile voting system implementation
- Fixed TypeScript compilation errors with @ts-ignore
- Created ReviewCard component with full voting functionality
- Integrated voting into OysterDetailScreen
- Fixed scrolling issue by disabling React Native New Architecture
- All changes committed (7 files changed, 350 insertions)
