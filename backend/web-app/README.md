# Oysterette Web App

Modern web interface for Oysterette built with Next.js 14, TailwindCSS, and TypeScript.

## Features

- 🔐 **Authentication**: Login, register, and JWT-based session management
- 🦪 **Oyster Browsing**: Search, filter, and explore the complete oyster database
- ⭐ **Reviews**: Write reviews with ratings and attribute sliders
- 💬 **Voting**: Agree/disagree on reviews
- 👤 **User Profiles**: View stats, reviews, and favorites
- 🌙 **Dark Mode**: Toggle between light and dark themes
- 📱 **Responsive**: Mobile-first design that works on all devices

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Styling**: TailwindCSS v4
- **API Client**: Axios with JWT interceptors
- **State**: React Context API
- **TypeScript**: Full type safety

## Getting Started

### Prerequisites

- Node.js 18+ 
- Backend API running (or use production: `https://oysterette-production.up.railway.app/api`)

### Installation

```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Environment Variables

Create a `.env.local` file:

```env
# Google OAuth Client ID (required for Google Sign-In)
# Get this from: https://console.cloud.google.com/apis/credentials
# Create OAuth 2.0 Client ID for Web application
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id-here.apps.googleusercontent.com

# Backend API URL (optional, defaults to production)
NEXT_PUBLIC_API_URL=https://oysterette-production.up.railway.app/api
```

**Google OAuth Setup:**
1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Create a new OAuth 2.0 Client ID
3. Application type: **Web application**
4. Authorized JavaScript origins: `http://localhost:3000` (for dev)
5. Authorized redirect URIs: `http://localhost:3000` (for dev)
6. Copy the Client ID to `.env.local`

## Project Structure

```
web-app/
├── app/                    # Next.js App Router pages
│   ├── page.tsx            # Home page
│   ├── login/              # Login page
│   ├── register/           # Register page
│   ├── oysters/            # Oyster browsing
│   │   ├── page.tsx        # List page
│   │   └── [id]/           # Detail page
│   └── profile/            # User profile
├── components/             # Reusable components
│   └── Header.tsx          # Navigation header
├── context/                # React contexts
│   ├── AuthContext.tsx     # Authentication state
│   └── ThemeContext.tsx    # Dark mode state
└── lib/                    # Utilities
    ├── api.ts              # API client
    ├── auth.ts             # Auth utilities
    └── types.ts            # TypeScript types
```

## API Integration

The web app uses the same backend API as the mobile app:

- **Production**: `https://oysterette-production.up.railway.app/api`
- **Local**: `http://localhost:3000/api` (if backend running locally)

All API calls include JWT tokens from localStorage for authenticated requests.

## Deployment

### Vercel (Recommended)

1. Push code to GitHub
2. Import project in Vercel
3. Set environment variable: `NEXT_PUBLIC_API_URL`
4. Deploy!

### Other Platforms

```bash
# Build for production
npm run build

# Start production server
npm start
```

## Features Roadmap

- [ ] OAuth (Google/Apple)
- [ ] Favorites management
- [ ] Review editing/deletion
- [ ] Advanced filters
- [ ] Pagination
- [ ] Image uploads
- [ ] Social features (friends, activity feed)

## License

See main project LICENSE file.
