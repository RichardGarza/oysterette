# Web App Feature Parity Plan

## Overview
Match all mobile app features and authentication conditionals in the web interface, excluding AR Menu Scanner.

---

## 🔐 Authentication Conditionals

### Home Page (`app/page.tsx`)
**Current:** Shows all features to everyone
**Needed:**
- ✅ Stats cards (Reviews, Favorites) - **ONLY if logged in**
- ✅ Recommendations section - **ONLY if logged in**
- ✅ Friends quick action - **ONLY if logged in**
- ✅ Profile quick action vs Login quick action - **conditional**
- ✅ Info card about creating account - **ONLY if NOT logged in**

### Oyster Detail Page (`app/oysters/[id]/page.tsx`)
**Current:** Shows "Write Review" button if authenticated
**Needed:**
- ✅ "Write Review" button - **ONLY if logged in**
- ✅ Favorite/Unfavorite button - **ONLY if logged in** (currently missing)
- ✅ Voting on reviews - **ONLY if logged in** (currently redirects to login)
- ✅ Edit/Delete own reviews - **ONLY if logged in AND own review** (currently missing)

### Oyster List Page (`app/oysters/page.tsx`)
**Current:** Public browsing
**Needed:**
- ✅ "Favorites" filter/tab - **ONLY if logged in**
- ✅ Favorite indicators on cards - **ONLY if logged in**

### Review Submission (`app/oysters/[id]/review/page.tsx`)
**Current:** Requires auth (redirects to login)
**Status:** ✅ Already gated

### Add Oyster (`app/oysters/add/page.tsx` - NEW)
**Needed:**
- ✅ Create new page
- ✅ Auth gating (show login modal if not authenticated)
- ✅ Form with all 5 required attributes (1-10 sliders)

---

## 📱 Missing Screens/Pages

### 1. Top Oysters Page (`app/top-oysters/page.tsx`)
**Features:**
- Leaderboard of top 50 highest-rated oysters
- Rank badges (#1, #2, etc.)
- Sortable by rating
- Public access

### 2. Settings Page (`app/settings/page.tsx`)
**Features:**
- Theme toggle (light/dark)
- Notification preferences
- App version info
- Requires auth

### 3. Privacy Settings Page (`app/privacy-settings/page.tsx`)
**Features:**
- Profile visibility (public/friends/private)
- Show review history toggle
- Show favorites toggle
- Show statistics toggle
- Requires auth

### 4. XP & Achievements Page (`app/xp-stats/page.tsx`)
**Features:**
- Current XP and level
- XP breakdown (reviews, votes, streaks)
- Achievements list
- Level progress bar
- Requires auth

### 5. Friends Page (`app/friends/page.tsx`)
**Features:**
- Friends list
- Search users
- Add/remove friends
- Requires auth

### 6. Favorites List Page (`app/favorites/page.tsx`)
**Features:**
- List of favorited oysters
- Remove from favorites
- Navigate to oyster detail
- Requires auth

---

## 👤 Enhanced Profile Page

### Current Profile Page (`app/profile/page.tsx`)
**Missing Features:**
- ✅ Profile photo upload
- ✅ Stats grid (6 cards: Reviews, Favorites, Badge, Votes Received, Avg Rating, Review Streak)
- ✅ XP Badge display
- ✅ Flavor Profile visualization (with ranges, tooltips)
- ✅ Favorite Species/Origin insights
- ✅ Recent Reviews (5 most recent, clickable, with delete/edit)
- ✅ Edit Profile dialog (name, email, username)
- ✅ Change Password dialog
- ✅ Privacy Settings button
- ✅ XP & Achievements button
- ✅ Member since date

---

## 🧩 Missing Components

### 1. ReviewCard Component (`components/ReviewCard.tsx`)
**Features:**
- Profile photo or avatar
- Username/display name
- Credibility badge (if applicable)
- Rating display
- Notes text
- Photo gallery (horizontal scroll)
- Vote buttons (Agree/Disagree) - only if logged in
- Edit/Delete buttons - only if own review
- Date formatting
- Fullscreen photo modal

### 2. RecommendedOysterCard Component (`components/RecommendedOysterCard.tsx`)
**Features:**
- Oyster name, species, origin
- Rating display
- Recommendation score/reason
- Clickable card

### 3. RatingDisplay Component (`components/RatingDisplay.tsx`)
**Features:**
- Star rating visualization
- Score out of 10
- Review count

### 4. XPBadge Component (`components/XPBadge.tsx`)
**Features:**
- Current level display
- XP progress bar
- Level badge styling

### 5. EmptyState Component (`components/EmptyState.tsx`)
**Features:**
- Icon
- Title
- Description
- Optional action button

### 6. OysterCard Component (`components/OysterCard.tsx`)
**Features:**
- Oyster name, species, origin
- Rating display
- Favorite indicator (if logged in)
- Clickable card

---

## 🔧 API Integration Needed

### Review API
- ✅ `getOysterReviews` - already implemented
- ✅ `create` - already implemented
- ✅ `update` - **NEED TO ADD**
- ✅ `delete` - **NEED TO ADD**
- ✅ `checkExisting` - **NEED TO ADD** (for edit review flow)

### User API
- ✅ `getProfile` - already implemented
- ✅ `updateProfile` - **NEED TO ADD** (name, email, username, profilePhotoUrl)
- ✅ `changePassword` - **NEED TO ADD**
- ✅ `getMyReviews` - **NEED TO ADD** (paginated review history)
- ✅ `updatePrivacySettings` - **NEED TO ADD**

### Favorites API
- ✅ `getAll` - **NEED TO ADD**
- ✅ `add` - **NEED TO ADD**
- ✅ `remove` - **NEED TO ADD**

### Recommendations API
- ✅ `getHybrid` - **NEED TO ADD** (for personalized recommendations)
- ✅ `getRecommendations` - **NEED TO ADD** (fallback)

### XP/Stats API
- ✅ `getXPStats` - **NEED TO ADD**

### Upload API
- ✅ `uploadProfilePhoto` - **NEED TO ADD**

---

## 📋 Implementation Checklist

### Phase 1: Authentication Conditionals (Priority 1)
- [ ] Home page: Stats cards only if logged in
- [ ] Home page: Recommendations only if logged in
- [ ] Home page: Friends action only if logged in
- [ ] Home page: Profile vs Login action conditional
- [ ] Home page: Info card only if NOT logged in
- [ ] Oyster detail: Favorite button only if logged in
- [ ] Oyster detail: Voting only if logged in
- [ ] Oyster detail: Edit/Delete reviews only if own review
- [ ] Oyster list: Favorites filter only if logged in
- [ ] Oyster list: Favorite indicators only if logged in

### Phase 2: Enhanced Profile Page (Priority 1)
- [ ] Profile photo upload
- [ ] Stats grid (6 cards)
- [ ] XP Badge display
- [ ] Flavor Profile visualization
- [ ] Favorite Species/Origin insights
- [ ] Recent Reviews list (5 most recent)
- [ ] Edit Profile dialog
- [ ] Change Password dialog
- [ ] Privacy Settings button
- [ ] XP & Achievements button

### Phase 3: Missing Components (Priority 2)
- [ ] ReviewCard component
- [ ] RecommendedOysterCard component
- [ ] RatingDisplay component
- [ ] XPBadge component
- [ ] EmptyState component
- [ ] OysterCard component

### Phase 4: Missing Pages (Priority 2)
- [ ] Top Oysters page
- [ ] Settings page
- [ ] Privacy Settings page
- [ ] XP & Achievements page
- [ ] Friends page
- [ ] Favorites list page
- [ ] Add Oyster page

### Phase 5: API Integration (Priority 2)
- [ ] Review API: update, delete, checkExisting
- [ ] User API: updateProfile, changePassword, getMyReviews, updatePrivacySettings
- [ ] Favorites API: getAll, add, remove
- [ ] Recommendations API: getHybrid, getRecommendations
- [ ] XP API: getXPStats
- [ ] Upload API: uploadProfilePhoto

---

## 🎨 Design Notes

- Match mobile app styling where possible
- Use TailwindCSS for responsive design
- Dark mode support for all new components
- Loading states and error handling
- Empty states for all lists
- Modal dialogs for forms (edit profile, change password, etc.)

---

## ⏱️ Estimated Time

- Phase 1: 2-3 hours
- Phase 2: 4-5 hours
- Phase 3: 3-4 hours
- Phase 4: 5-6 hours
- Phase 5: 2-3 hours

**Total: 16-21 hours**

