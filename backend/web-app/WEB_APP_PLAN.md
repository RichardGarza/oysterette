# Oysterette Web App - Implementation Plan

## Overview
Build a modern, responsive web interface for Oysterette using Next.js 14, TailwindCSS, and the existing Railway backend API. The web app will share authentication with mobile and provide full feature parity.

## Tech Stack
- **Framework**: Next.js 14 (App Router)
- **Styling**: TailwindCSS v4
- **API Client**: Axios (shared patterns with mobile)
- **Auth**: JWT tokens (localStorage)
- **State**: React Context + useState/useEffect
- **Deployment**: Vercel (free tier)

## API Configuration
- **Production**: `https://oysterette-production.up.railway.app/api`
- **Local Dev**: `http://localhost:3000/api` (if backend running locally)
- **Auth**: Bearer token in `Authorization` header

## Features to Implement

### 1. Authentication (Priority 1)
- Login page (email/password)
- Register page
- OAuth buttons (Google/Apple - future)
- JWT token storage (localStorage)
- Protected routes middleware
- Auto-login on page load

### 2. Oyster Browsing (Priority 1)
- Home page with search bar
- Oyster list with cards (name, origin, rating, attributes)
- Search functionality (fuzzy matching)
- Filters (species, origin, attributes)
- Sort options (name, rating, etc.)
- Pagination (optional - can use infinite scroll)

### 3. Oyster Detail (Priority 1)
- Full oyster information
- Attribute visualization (progress bars)
- Reviews list with voting
- Write review button (if logged in)
- Add to favorites

### 4. Reviews (Priority 2)
- Review submission form
- Rating selection (LOVE_IT, LIKE_IT, OKAY, MEH)
- Attribute sliders (1-10 scale)
- Edit/delete own reviews
- Vote on reviews (agree/disagree)

### 5. User Profile (Priority 2)
- Profile page with stats
- Review history
- Favorites list
- Flavor profile visualization
- Settings (theme, privacy)

### 6. Dark Mode (Priority 2)
- Theme toggle (light/dark)
- Persist preference (localStorage)
- Sync with mobile (future - via API)

### 7. Responsive Design (Priority 3)
- Mobile-first approach
- Tablet/desktop breakpoints
- Touch-friendly on mobile
- SEO optimization (meta tags, structured data)

## File Structure
```
web-app/
├── app/
│   ├── layout.tsx          # Root layout with providers
│   ├── page.tsx             # Home page
│   ├── login/
│   │   └── page.tsx
│   ├── register/
│   │   └── page.tsx
│   ├── oysters/
│   │   ├── page.tsx         # List page
│   │   └── [id]/
│   │       └── page.tsx     # Detail page
│   ├── profile/
│   │   └── page.tsx
│   └── api/                 # API routes (if needed)
├── components/
│   ├── OysterCard.tsx
│   ├── ReviewCard.tsx
│   ├── RatingDisplay.tsx
│   ├── SearchBar.tsx
│   └── ThemeToggle.tsx
├── lib/
│   ├── api.ts               # API client (axios)
│   ├── auth.ts              # Auth utilities
│   └── types.ts             # TypeScript types
├── context/
│   ├── AuthContext.tsx
│   └── ThemeContext.tsx
└── public/
    └── logo.png
```

## Implementation Steps

### Phase 1: Setup & Core Infrastructure (2-3 hrs)
1. Install dependencies (axios, etc.)
2. Create API client with JWT interceptors
3. Set up AuthContext for global auth state
4. Create TypeScript types (shared with mobile patterns)
5. Set up TailwindCSS theme (brand colors)

### Phase 2: Authentication Pages (2-3 hrs)
1. Login page with form validation
2. Register page
3. AuthContext integration
4. Protected route wrapper
5. Auto-login on app load

### Phase 3: Oyster Browsing (3-4 hrs)
1. Home page with search
2. Oyster list page with cards
3. Search functionality
4. Filters UI (chips/toggles)
5. Sort dropdown

### Phase 4: Oyster Detail & Reviews (3-4 hrs)
1. Detail page layout
2. Attribute visualization
3. Reviews list with voting
4. Review submission form
5. Edit/delete reviews

### Phase 5: User Features (2-3 hrs)
1. Profile page
2. Favorites list
3. Review history
4. Settings page

### Phase 6: Polish & Deployment (2-3 hrs)
1. Dark mode implementation
2. Responsive design fixes
3. SEO meta tags
4. Error boundaries
5. Loading states
6. Deploy to Vercel

## Design Principles
- **Modern & Clean**: Minimal, focused UI
- **Brand Colors**: Orange (#FF6B35), Ocean Blue (#004E89)
- **Accessibility**: WCAG AA compliant
- **Performance**: Fast loads, optimized images
- **Mobile-First**: Responsive from 320px up

## Estimated Total Time: 14-20 hours

