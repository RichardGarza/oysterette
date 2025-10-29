# Oysterette

**A mobile application for oyster enthusiasts to discover, rate, and track oysters from around the world.**

Oysterette allows users to explore a comprehensive database of oyster varieties, submit detailed reviews with ratings, and build personalized lists of their favorite oysters. The app features a sophisticated rating system that combines expert seed data with community feedback to provide balanced, reliable oyster scores.

---

## 🦪 What is Oysterette?

Oysterette is a React Native mobile app that helps oyster lovers:
- **Discover** oysters from around the world with detailed attribute profiles
- **Rate & Review** oysters using a 4-tier rating system and 10-point attribute scales
- **Track** favorites and build personalized top oyster lists
- **Get Recommendations** based on personal taste preferences (coming soon)

The app uses a dynamic rating algorithm that weights user reviews against curated seed data, ensuring new oysters have baseline scores while heavily-reviewed oysters reflect community consensus.

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

## 🎯 Rating System

### Algorithm Overview
The rating system uses **dynamic weighting** to balance expert seed data with user reviews:

```
User Rating Weight Calculation:
- 0 reviews: 0% user influence (100% seed data)
- 1-4 reviews: Gradual increase (0% → 70%)
- 5+ reviews: 70% user influence, 30% seed data
```

### Score Components
**Overall Score (0-10 scale):**
- 40% from Rating (LOVED_IT/LIKED_IT/MEH/HATED_IT)
- 60% from Attributes (size, body, sweetness, flavor, creaminess)

**Attribute Scores:**
- Weighted average of seed data + user ratings
- Accounts for null values (users can skip attributes)

### Real-Time Updates
- Ratings recalculate automatically on review create/update/delete
- All users see updated scores immediately
- No manual refresh needed

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

### Test Coverage
- Rating calculation algorithms
- User weight formulas
- Score aggregation logic
- Error handling

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

## 📈 Future Roadmap

### Phase 5.2: Predictive Recommendations (Next)
- Collaborative filtering
- Content-based filtering
- "You might like..." suggestions

### Phase 5.3: User Profiles
- Profile pages
- Rating history
- Account statistics

### Phase 5.4: Photo Gallery
- User-uploaded oyster photos
- Image storage (Cloudinary/Supabase)

### Phase 6: Enhancements
- Fuzzy search (handle typos)
- OAuth authentication (Google, Apple)
- iOS TestFlight distribution
- Enhanced styling

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

**Version:** 1.0.0
**Last Updated:** October 29, 2025
**Status:** Production - Active Development
