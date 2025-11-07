# Oysterette

**A mobile application for oyster enthusiasts to discover, rate, and track oysters from around the world.**

Oysterette allows users to explore a comprehensive database of oyster varieties, submit detailed reviews with ratings, and build personalized lists of their favorite oysters. The app features a sophisticated rating system that combines expert seed data with community feedback to provide balanced, reliable oyster scores.

---

## 🦪 What is Oysterette?

Oysterette is a React Native mobile app that helps oyster lovers:
- **Discover** 850+ oysters from around the world with detailed attribute profiles
- **Rate & Review** oysters using a 4-tier emotional rating system and 10-point attribute scales
- **Track** favorites and build personalized top oyster lists
- **Get Recommendations** based on your personal flavor profile
- **Vote** on reviews to build community credibility
- **Earn Badges** for reliable reviewing (Novice 🌟, Trusted ⭐, Expert 🏆)
- **Search & Filter** with fuzzy search, species/origin filters, and multiple sort options

The app uses a sophisticated rating algorithm that weights user reviews against curated seed data, ensuring new oysters have baseline scores while heavily-reviewed oysters reflect community consensus.

---

## 🏗️ Technology Stack

### Mobile App
- **Framework:** React Native (Expo SDK 54)
- **Language:** TypeScript
- **Navigation:** React Navigation 7
- **State:** React Hooks
- **Styling:** React Native StyleSheet
- **Updates:** EAS Update (OTA updates)
- **Build:** EAS Build

### Backend API
- **Runtime:** Node.js 20
- **Framework:** Express.js
- **Language:** TypeScript
- **Database ORM:** Prisma
- **Authentication:** JWT (JSON Web Tokens)
- **Password Hashing:** bcrypt

### Database
- **Database:** PostgreSQL 15
- **Hosting:** Neon (serverless PostgreSQL)
- **Schema Management:** Prisma Migrations

---

## 🌐 Hosting & Deployment

### **Production Environment**

| Component | Hosted On | URL | Status |
|-----------|-----------|-----|--------|
| **Database** | [Neon](https://neon.tech) | `ep-falling-shadow-ahmk229r-pooler.c-3.us-east-1.aws.neon.tech` | ✅ Live |
| **Backend API** | [Railway](https://railway.app) | https://oysterette-production.up.railway.app | ✅ Live |
| **Codebase** | [GitHub](https://github.com) | https://github.com/RichardGarza/oysterette | ✅ Public |
| **Mobile App (Android)** | EAS Build | [Download APK](https://expo.dev/accounts/rgactr/projects/oysterette/builds/45f05f60-fe6d-4fe3-bfbb-9da657b2c7e1) | ✅ Available |
| **Mobile App (Updates)** | EAS Update | Automatic OTA updates | ✅ Active |

### **Development Environment**
- Local PostgreSQL (optional)
- Local backend: `http://localhost:3000`
- Expo Dev Server: `http://localhost:8081`
- iOS Simulator & Android Emulator support

---

## 📊 Database Schema

### Core Models
- **User** - Authentication and profile data
- **Oyster** - Oyster varieties with attributes and ratings
- **Review** - User reviews and ratings
- **UserTopOyster** - User's favorite oysters list

### Key Features
- UUID primary keys
- Cascading deletes for data integrity
- JSON fields for flexible preferences
- Unique constraints on user-oyster reviews
- Aggregated rating fields for performance

---

## 🎯 Core Algorithms

### 1. Rating System

#### Dynamic Weighting Algorithm
The rating system uses **dynamic weighting** to balance expert seed data with user reviews:

```typescript
function calculateUserRatingWeight(reviewCount: number): number {
  if (reviewCount === 0) return 0;
  if (reviewCount >= 5) return 0.7;
  // Gradual increase: (reviewCount / 5) * 0.7
  return (reviewCount / 5) * 0.7;
}

// Examples:
// 0 reviews → 0% user weight (100% seed data)
// 1 review  → 14% user weight (86% seed data)
// 3 reviews → 42% user weight (58% seed data)
// 5+ reviews → 70% user weight (30% seed data)
```

#### Rating Scale
Reviews use a **4-tier emotional rating system** mapped to 0-10 scale:
- **LOVE_IT** → 9.0 (range 8.0-10.0) - Outstanding oyster
- **LIKE_IT** → 7.0 (range 6.0-7.9) - Good oyster
- **MEH** → 4.95 (range 4.0-5.9) - Unremarkable
- **WHATEVER** → 2.5 (range 1.0-3.9) - Poor experience

#### Overall Score Calculation
Overall score is based **solely on avgRating** (0-10 scale), independent of attribute scores. This ensures the score directly reflects user sentiment.

```typescript
overallScore = avgRating; // Simple and direct
```

#### Attribute Scores
Each attribute (size, body, sweetBrininess, flavorfulness, creaminess) is calculated as a weighted average:

```typescript
avgAttribute = (1 - userWeight) * seedAttribute + userWeight * userAttributeAvg;
```

### 2. Voting & Credibility System

#### Review Voting
Users can vote "agree" or "disagree" on other users' reviews:
- **Agree vote** (+1): Review aligns with your experience
- **Disagree vote** (-1): Review doesn't match your experience
- **Cannot vote on own reviews**
- **One vote per review** (can change vote)

#### Asymmetric Vote Weighting
Voting uses asymmetric weighting to prevent abuse:
- **Agree votes**: +1.0 weight per vote
- **Disagree votes**: -0.6 weight per vote
- **Net score**: `agreeCount * 1.0 + disagreeCount * (-0.6)`

This design prevents malicious downvoting from having equal power to genuine agreement.

#### Credibility Score Calculation
User credibility is based on votes received on their reviews:

```typescript
function calculateCredibilityScore(
  totalAgrees: number,
  totalDisagrees: number
): number {
  const agreeWeight = 1.0;
  const disagreeWeight = -0.6;
  const netScore = totalAgrees * agreeWeight + totalDisagrees * disagreeWeight;

  // Scale to 0.5 - 1.5 range (50% to 150% influence)
  const scalingFactor = 0.1;
  const baseCredibility = 1.0;
  const credibility = baseCredibility + (netScore * scalingFactor);

  return Math.max(0.5, Math.min(1.5, credibility));
}

// Examples:
// +10 agrees, -0 disagrees → 1.0 + (10 * 0.1) = 2.0 → capped at 1.5
// +5 agrees, -5 disagrees → 1.0 + (2 * 0.1) = 1.2 (Trusted)
// +0 agrees, -10 disagrees → 1.0 + (-6 * 0.1) = 0.4 → floor at 0.5
```

#### Badge System
Users receive badges based on credibility:
- **Novice** 🌟: 0.5 - 0.99 (less reliable reviews)
- **Trusted** ⭐: 1.0 - 1.49 (reliable reviews)
- **Expert** 🏆: 1.5+ (highly reliable reviews)

### 3. Recommendation System

#### Baseline Flavor Profile
Users develop a **baseline flavor profile** from their positive reviews (LOVE_IT ratings):

```typescript
async function updateBaselineWithReview(review: Review): Promise<void> {
  // Only update from LOVE_IT reviews
  if (review.rating !== 'LOVE_IT') return;

  // Exponential moving average (α = 0.3)
  newBaseline = currentBaseline * 0.7 + reviewAttribute * 0.3;
}
```

This creates a personalized "ideal oyster" profile that evolves over time.

#### Similarity Scoring
Recommendations use **Euclidean distance** to find oysters similar to user's baseline:

```typescript
function calculateSimilarityScore(
  oyster: Oyster,
  userBaseline: FlavorProfile
): number {
  const attributes = ['size', 'body', 'sweetBrininess', 'flavorfulness', 'creaminess'];

  let sumSquaredDiffs = 0;
  attributes.forEach(attr => {
    const diff = oyster[attr] - userBaseline[attr];
    sumSquaredDiffs += diff * diff;
  });

  const euclideanDistance = Math.sqrt(sumSquaredDiffs);
  const maxDistance = Math.sqrt(5 * 81); // 5 attributes, max diff of 9 each

  // Convert to 0-100 similarity score (higher = more similar)
  return ((maxDistance - euclideanDistance) / maxDistance) * 100;
}
```

#### Recommendation Ranking
Oysters are ranked by similarity score (highest first) and **exclude already reviewed oysters**. Results are cached for 15 minutes per user.

### 4. Search & Filtering

#### Fuzzy Search
Search uses **Fuse.js** with weighted fields:
- **Name**: 50% weight (primary search target)
- **Origin**: 30% weight (location matters)
- **Species**: 20% weight (scientific classification)
- **Threshold**: 0.4 (balance precision vs recall)

```typescript
const fuseOptions = {
  keys: [
    { name: 'name', weight: 0.5 },
    { name: 'origin', weight: 0.3 },
    { name: 'species', weight: 0.2 }
  ],
  threshold: 0.4, // 0 = exact match, 1 = match anything
  includeScore: true
};
```

#### Advanced Filtering
Users can filter by:
- **Species**: 7 species + "All Species" (Crassostrea gigas, virginica, sikamea, etc.)
- **Origin**: 74 origins + "All Origins" (Washington, France, Japan, etc.)
- **Sort By**: name, rating, size, sweetness, creaminess, flavorfulness, body

### 5. Real-Time Updates
- **Ratings recalculate** automatically on review create/update/delete
- **Credibility updates** immediately when votes are cast
- **Baselines update** after each LOVE_IT review
- **Recommendation cache** invalidates on profile changes

---

## 🚀 Deployment Workflow

### Backend Deployment (Railway)
```bash
# Automatic on git push
git push origin main

# Railway automatically:
# 1. Detects push
# 2. Runs: npm install && npm run build
# 3. Runs: npx prisma migrate deploy
# 4. Starts: npm start
# ⏱️ ETA: 5-10 minutes
```

### Mobile App Updates (EAS)
```bash
# Quick OTA update (no APK rebuild)
cd mobile-app
npm run deploy-update "Description of changes"

# Users receive update automatically within minutes
# ⏱️ ETA: 2-5 minutes for users to get update
```

### New APK Build
```bash
# Cloud build (slow but reliable)
npm run build:android:cloud

# Local build (fast, requires Android Studio)
npm run build:android:local

# ⏱️ Cloud: 5-10 min | Local: 1-3 min
```

---

## 📱 Installation

### For End Users
1. Download APK: https://expo.dev/accounts/rgactr/projects/oysterette/builds/45f05f60-fe6d-4fe3-bfbb-9da657b2c7e1
2. Install on Android device
3. App auto-updates in the background

### For iPhone Users (Expo Go)
1. Install "Expo Go" from App Store
2. Open Expo Go and scan QR code (provided by developer)
3. Limited functionality - some features require native build

---

## 💻 Development Setup

### Prerequisites
- Node.js 20+
- npm or yarn
- PostgreSQL 15+ (or use Neon cloud database)
- Expo CLI
- iOS Simulator (Mac only) or Android Emulator

### Backend Setup
```bash
cd backend

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your DATABASE_URL and JWT_SECRET

# Run migrations
npx prisma migrate dev

# Seed database
npm run seed

# Start development server
npm run dev
```

### Mobile App Setup
```bash
cd mobile-app

# Install dependencies
npm install

# Start Expo dev server
npm start

# Run on iOS
npm run ios

# Run on Android
npm run android
```

---

## 🧪 Testing

### Backend Tests
```bash
cd backend

# Run all tests
npm test

# Run tests with coverage
npm test -- --coverage

# Run specific test file
npm test ratingService.test.ts
```

### Test Coverage (229 tests)
- **Rating System**: Dynamic weighting, attribute scores, overall score
- **Voting & Credibility**: Vote creation, updates, credibility calculation
- **Recommendations**: Flavor profile, baseline updates, similarity scoring
- **Authentication**: JWT, Google OAuth, rate limiting
- **API Integration**: All endpoints, error handling, validation
- **Schema Validation**: Zod schemas for all request/response types

---

## 📂 Project Structure

```
oysterette/
├── backend/                    # Node.js Express API
│   ├── prisma/
│   │   ├── schema.prisma      # Database schema
│   │   └── migrations/        # Migration files
│   ├── src/
│   │   ├── controllers/       # API route handlers
│   │   ├── routes/            # API routes
│   │   ├── services/          # Business logic (rating system)
│   │   ├── lib/              # Utilities (Prisma client)
│   │   └── index.ts          # Server entry point
│   ├── railway.json          # Railway deployment config
│   ├── nixpacks.toml         # Build configuration
│   └── tsconfig.build.json   # Production TypeScript config
│
├── mobile-app/                # React Native Expo app
│   ├── src/
│   │   ├── screens/          # App screens
│   │   ├── components/       # Reusable components (RatingDisplay)
│   │   ├── services/         # API client (connects to Railway)
│   │   ├── types/            # TypeScript interfaces
│   │   └── navigation/       # Navigation configuration
│   ├── scripts/
│   │   └── deploy-update.sh  # OTA deployment script
│   ├── app.json              # Expo configuration
│   └── eas.json              # EAS Build configuration
│
├── CLAUDE.md                 # Session progress documentation
└── README.md                 # This file
```

---

## 🔐 Environment Variables

### Backend (.env)
```env
PORT=3000
NODE_ENV=development

# Neon Cloud Database (Production)
DATABASE_URL="postgresql://neondb_owner:***@ep-falling-shadow-ahmk229r-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require"

# JWT Authentication
JWT_SECRET="your-secret-key-here"
JWT_EXPIRES_IN="7d"
```

### Railway Environment Variables
Set in Railway dashboard (same as above):
- `DATABASE_URL`
- `JWT_SECRET`
- `NODE_ENV=production`
- `PORT=3000`

---

## ✅ Completed Features

### Phase 1-4: Core Infrastructure (October 2024)
- ✅ **Production Database**: Neon PostgreSQL with 850+ oysters
- ✅ **Backend API**: Railway deployment with auto-deploy
- ✅ **Mobile App**: React Native with Expo, EAS Build & Updates
- ✅ **Android Distribution**: APK builds via EAS

### Phase 5.1: Advanced Rating & Voting System (November 2024)
- ✅ **Dynamic Rating Algorithm**: Gradual weight shift from seed data to user reviews
- ✅ **Review Voting**: Agree/disagree votes on reviews
- ✅ **Credibility System**: User reputation based on vote history
- ✅ **Badge System**: Novice, Trusted, Expert badges
- ✅ **Asymmetric Weighting**: Prevents malicious downvoting

### Phase 5.2: Security & Quality (November 2024)
- ✅ **Input Validation**: Zod schemas for all endpoints
- ✅ **Rate Limiting**: 10 req/15min for auth, 100 req/15min for API
- ✅ **Error Tracking**: Sentry integration
- ✅ **Logging**: Winston structured logging
- ✅ **JWT Hardening**: Secure token handling
- ✅ **Test Coverage**: 229 tests passing (100% coverage on core logic)

### Phase 5.3: Search & Discovery (November 2024)
- ✅ **Fuzzy Search**: Fuse.js with weighted name/origin/species matching
- ✅ **Advanced Filtering**: Species, origin, and attribute-based filters
- ✅ **Multi-Sort Options**: Sort by rating, name, size, attributes

### Phase 5.4: User Experience (November 2024)
- ✅ **Theme System**: Light/dark mode with persistence
- ✅ **Settings Screen**: Profile management, preferences, privacy settings
- ✅ **Auto-Login**: Seamless authentication persistence
- ✅ **Pull-to-Refresh**: Sync data across all screens
- ✅ **Google OAuth**: Native Google Sign-In integration

### Phase 5.5: UX Polish (November 2024)
- ✅ **Dynamic Slider Labels**: Context-aware attribute descriptions
- ✅ **KeyboardAvoidingView**: Better form interaction
- ✅ **Duplicate Review Detection**: Auto-populate for updates
- ✅ **Favorites Sync**: Cross-device synchronization

### Phase 5.6: Personalization & Recommendations (November 2024)
- ✅ **Baseline Flavor Profile**: Automatic learning from LOVE_IT reviews
- ✅ **Personalized Recommendations**: Euclidean distance similarity matching
- ✅ **Profile Display**: Visual flavor profile on user profile
- ✅ **Auto-Update**: Baseline evolves with user preferences
- ✅ **Smart Caching**: 15-minute recommendation cache

---

## 📈 Future Roadmap

### Phase 6: Social Features
- **Share Oysters**
  - Share oyster profiles to social media
  - Send oysters to friends via messaging
  - "Share Your Top 5" feature
  - Export reviews as PDF/image

- **Additional OAuth Providers**
  - Sign in with Apple (required for iOS App Store)
  - Sign in with X/Twitter
  - Sign in with Facebook

### Phase 7: Community Data Enrichment
- **Collaborative Editing**
  - Edit oyster details when rating
  - Contribute species for "Unknown" entries
  - Add origin information for incomplete listings
  - Update standout notes collaboratively
  - Version history for edits

### Phase 8: Photo Gallery
- User-uploaded oyster photos
- Image storage (Cloudinary/Supabase)
- Photo moderation system
- Gallery view on oyster detail pages

### Phase 9: App Store Distribution
- ✅ Legal documentation (Privacy Policy, Terms of Service)
- ✅ GitHub Pages hosting for legal docs
- Sign in with Apple implementation (required)
- Screenshot capture for both stores
- iOS TestFlight beta testing
- Apple App Store submission
- Google Play Store submission
- Push notifications for review responses

---

## 🤝 Contributing

This is a personal project, but contributions are welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

---

## 📄 License

MIT License - See LICENSE file for details

---

## 🙏 Acknowledgments

- Oyster seed data curated from various oyster databases
- Built with Claude Code by Anthropic
- Deployed with Railway and Neon

---

**Version:** 1.6.0
**Last Updated:** November 7, 2024
**Status:** Production - Active Development
**Tests:** 229/229 passing ✅
**Backend:** Live on Railway ✅
**Database:** Live on Neon (850+ oysters) ✅
