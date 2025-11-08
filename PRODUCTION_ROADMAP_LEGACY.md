# Oysterette Production Deployment Roadmap

## Current Status
- ✅ Working iOS simulator app
- ✅ Backend API with PostgreSQL
- ✅ 129 oysters in database
- ✅ Basic CRUD operations
- ✅ Search functionality

---

## Phase 1: Database Migration to Neon (1-2 hours)

### Why Neon?
- Serverless PostgreSQL
- Free tier with generous limits
- Auto-scaling
- Perfect for hobby projects

### Steps:
1. **Create Neon Account**
   - Go to https://neon.tech
   - Sign up with GitHub
   - Create a new project

2. **Get Connection String**
   - Copy the connection string from Neon dashboard
   - Format: `postgresql://user:password@host/database?sslmode=require`

3. **Update Backend Environment**
   ```bash
   cd backend
   # Update .env file
   DATABASE_URL="your-neon-connection-string"
   ```

4. **Run Prisma Migrations**
   ```bash
   cd backend
   npx prisma migrate deploy
   npx prisma db push
   ```

5. **Seed Production Database**
   ```bash
   npm run seed
   ```

### Testing:
- Restart backend locally with Neon connection
- Verify data loads in mobile app

**Time Estimate**: 1-2 hours
**Priority**: HIGH (Required for online deployment)

---

## Phase 2: Backend Deployment (2-3 hours)

### Recommended Platform: Railway
**Why Railway?**
- Easy deployment
- Free tier ($5/month credit)
- Auto-deploys from GitHub
- Built-in PostgreSQL (if you prefer over Neon)

### Alternative Options:
- **Vercel**: Free, but better for serverless (may need adaptation)
- **Render**: Free tier available, good for Node.js
- **Fly.io**: Free tier, Docker-based

### Steps (Railway):

1. **Prepare Backend for Deployment**
   ```bash
   cd backend
   ```

   Create `railway.json`:
   ```json
   {
     "$schema": "https://railway.app/railway.schema.json",
     "build": {
       "builder": "NIXPACKS"
     },
     "deploy": {
       "startCommand": "npm run build && npm start",
       "restartPolicyType": "ON_FAILURE",
       "restartPolicyMaxRetries": 10
     }
   }
   ```

2. **Update package.json scripts** (if needed):
   ```json
   {
     "scripts": {
       "build": "tsc",
       "start": "node dist/index.js",
       "dev": "nodemon src/index.ts"
     }
   }
   ```

3. **Deploy to Railway**
   - Go to https://railway.app
   - Sign in with GitHub
   - Click "New Project" → "Deploy from GitHub repo"
   - Select your repo
   - Select `backend` directory as root

4. **Set Environment Variables in Railway**
   ```
   DATABASE_URL=your-neon-connection-string
   NODE_ENV=production
   PORT=3000
   JWT_SECRET=your-secret-key-here
   ```

5. **Get Your API URL**
   - Railway will provide: `https://your-app.railway.app`

**Time Estimate**: 2-3 hours
**Priority**: HIGH

---

## Phase 3: Update Mobile App for Production (30 mins)

### Steps:

1. **Update API URL**
   ```bash
   cd mobile-app
   ```

   Edit `src/services/api.ts`:
   ```typescript
   // Add production URL
   const PRODUCTION_URL = 'https://your-app.railway.app/api';

   const getApiUrl = (): string => {
     // Check if in development or production
     if (__DEV__) {
       if (Platform.OS === 'android') {
         return ANDROID_EMULATOR_URL;
       }
       return IOS_SIMULATOR_URL;
     }
     return PRODUCTION_URL;
   };
   ```

2. **Test with Production Backend**
   ```bash
   npm start
   ```

**Time Estimate**: 30 minutes
**Priority**: HIGH

---

## Phase 4: Mobile App Distribution (2-4 hours)

### Option A: Expo Go (Quickest - Share with Friends)

**Best for**: Quick testing with friends who have Expo Go app

#### Steps:
1. **Create Expo Account**
   ```bash
   cd mobile-app
   npx expo login
   ```

2. **Publish to Expo**
   ```bash
   npx expo publish
   ```

3. **Share Link**
   - You'll get a link like: `exp://exp.host/@username/oysterette`
   - Friends can scan QR code or open link in Expo Go app
   - **Downside**: Friends need Expo Go app installed

**Time Estimate**: 30 minutes
**Priority**: MEDIUM (Quick testing)
**Cost**: Free

---

### Option B: EAS Build (Professional - Best Option)

**Best for**: Distributing standalone apps without Expo Go

#### Steps:

1. **Install EAS CLI**
   ```bash
   npm install -g eas-cli
   cd mobile-app
   eas login
   ```

2. **Configure EAS**
   ```bash
   eas build:configure
   ```

3. **Create Development Build** (for testing)
   ```bash
   # For iOS
   eas build --platform ios --profile development

   # For Android
   eas build --platform android --profile development
   ```

4. **Share via TestFlight (iOS) or Internal Testing (Android)**

   **iOS TestFlight:**
   ```bash
   eas build --platform ios --profile production
   eas submit --platform ios
   ```
   - Add friends' emails in App Store Connect
   - They get TestFlight invite via email

   **Android Internal Testing:**
   ```bash
   eas build --platform android --profile production
   eas submit --platform android
   ```
   - Share internal testing link from Google Play Console

**Time Estimate**: 2-4 hours (first time)
**Priority**: HIGH (for professional distribution)
**Cost**: Free (Apple Developer $99/year required for TestFlight)

---

### Option C: Direct APK Share (Android Only - Fastest)

**Best for**: Quick Android testing without app stores

```bash
cd mobile-app
eas build --platform android --profile preview
```

- Download APK from EAS dashboard
- Share APK file directly with friends
- They install by enabling "Install from Unknown Sources"

**Time Estimate**: 1 hour
**Priority**: HIGH (Quick Android testing)
**Cost**: Free

---

## Phase 5: Implement User Authentication (OAuth) (4-6 hours)

### Recommended: Clerk
**Why Clerk?**
- Easy OAuth integration (Google, Apple, GitHub)
- Free tier (10,000 MAUs)
- React Native SDK
- Built-in user management

### Steps:

1. **Install Clerk**
   ```bash
   cd mobile-app
   npm install @clerk/clerk-expo
   ```

2. **Backend: Install & Configure Clerk**
   ```bash
   cd backend
   npm install @clerk/clerk-sdk-node
   ```

   Update middleware to validate Clerk tokens

3. **Add Clerk Provider to App**
   ```typescript
   // App.tsx
   import { ClerkProvider } from '@clerk/clerk-expo';

   export default function App() {
     return (
       <ClerkProvider publishableKey="pk_test_...">
         {/* Your app */}
       </ClerkProvider>
     );
   }
   ```

4. **Add Sign In Screen**
   - Create login/signup screens
   - Implement OAuth buttons (Google, Apple)

**Alternative Options:**
- **Supabase Auth**: Free, includes database
- **Firebase Auth**: Free tier, Google integration
- **Auth0**: More features, limited free tier

**Time Estimate**: 4-6 hours
**Priority**: MEDIUM (can be added later)

---

## Phase 6: Implement Rating System (3-4 hours)

### Database Changes:

1. **Already Have Reviews Schema** ✅
   - Your backend already has reviews/ratings!
   - Check `backend/src/models` for Review model

2. **Enhance Rating Display**
   - Show average ratings on oyster list
   - Display individual reviews on detail page
   - Add "Add Review" button (requires auth)

3. **UI Components to Add**
   ```
   - Star rating input
   - Review list component
   - Review form modal
   - Average rating badge
   ```

**Time Estimate**: 3-4 hours
**Priority**: MEDIUM

---

## Phase 7: Feedback Collection System (1-2 hours)

### Option A: Simple Feedback Form
Add a feedback screen in the app that:
- Collects user email
- Feedback text
- Optional screenshot
- Sends to your email or saves to database

### Option B: External Tools
- **Google Forms**: Free, easy to share link
- **Typeform**: Beautiful forms
- **Tally.so**: Free, simple

### Option C: In-App Feedback (Recommended)
Use services like:
- **Instabug**: Free tier, in-app bug reporting
- **Sentry**: Error tracking + user feedback
- **LogRocket**: Session replay + feedback

**Time Estimate**: 1-2 hours
**Priority**: LOW (can use Google Forms initially)

---

## Phase 8: Enhanced Styling (Your Task)

Since you mentioned you want to handle this manually, here's what to consider:

### Recommended Tools:
- **NativeWind**: Tailwind CSS for React Native
- **Shopify Restyle**: Theme-based styling
- **React Native Paper**: Material Design components

### Areas to Style:
1. Color scheme / theme
2. Typography
3. Card designs for oysters
4. Navigation bar styling
5. Loading states
6. Empty states
7. Error states
8. Animations (consider `react-native-reanimated`)

**Time Estimate**: Ongoing
**Priority**: Your preference

---

## Recommended Implementation Order

### Week 1: Make it Live
1. ✅ Database Migration to Neon (Day 1)
2. ✅ Backend Deployment to Railway (Day 1-2)
3. ✅ Update Mobile App Config (Day 2)
4. ✅ Build & Share APK for Android testing (Day 2)

### Week 2: Distribution
5. ✅ Set up EAS Build (Day 3-4)
6. ✅ TestFlight for iOS (Day 4-5)
7. ✅ Collect initial feedback

### Week 3: Features
8. ✅ Implement OAuth (Day 6-8)
9. ✅ Enhance Rating System (Day 9-10)
10. ✅ Add Feedback Collection (Day 10)

### Week 4: Polish
11. ✅ Custom Styling
12. ✅ Bug fixes based on feedback
13. ✅ Performance optimization

---

## Quick Start: Get Live in 4 Hours

If you want to share with friends ASAP:

1. **Setup Neon Database** (30 mins)
2. **Deploy to Railway** (1.5 hours)
3. **Update App Config** (15 mins)
4. **Build Android APK** (1 hour)
5. **Share APK Link** (5 mins)

**Total**: ~4 hours to go live!

---

## Cost Breakdown

### Free Tier (Sufficient for Testing)
- Neon: Free tier (3GB storage)
- Railway: $5/month credit (enough for small apps)
- Expo EAS: Free builds (limited per month)
- Clerk Auth: Free (10k MAUs)
- **Total**: ~$0-5/month

### Paid Tier (If Scaling)
- Neon Pro: $19/month
- Railway Pro: $20/month
- Apple Developer: $99/year
- Google Play: $25 one-time
- **Total**: ~$40/month + $99/year

---

## Next Steps

Want me to help you with any specific phase? I can:

1. **Start with Neon migration** - Set up cloud database
2. **Deploy backend to Railway** - Get your API online
3. **Build Android APK** - Quick sharing option
4. **Set up EAS Build** - Professional app distribution
5. **Implement OAuth** - Add user authentication

Just let me know which you'd like to tackle first!
