# Oyster Explorer App

A React Native mobile application with Node.js backend for exploring and discovering different types of oysters from around the world.

## Project Structure

```
claude-project/
├── mobile-app/          # React Native Expo app (TypeScript)
│   ├── src/
│   │   ├── screens/     # App screens (Home, OysterList, OysterDetail)
│   │   ├── navigation/  # Navigation types and configuration
│   │   ├── services/    # API service layer
│   │   └── types/       # TypeScript type definitions
│   └── App.tsx          # Main app entry point
│
└── backend/             # Node.js Express API (TypeScript)
    ├── src/
    │   ├── models/      # MongoDB models (Oyster schema)
    │   ├── controllers/ # Request handlers
    │   ├── routes/      # API routes
    │   └── config/      # Database configuration
    └── .env             # Environment variables
```

## Features

### Mobile App
- Browse oysters from the database
- View detailed information about each oyster
- Search oysters by name, region, or country
- View taste profiles (salinity, sweetness, brininess)
- See seasonal availability and pricing
- Pull-to-refresh functionality

### Backend API
- RESTful API with Express.js
- MongoDB database with Mongoose ODM
- Full CRUD operations for oysters
- Search functionality
- TypeScript support

## Prerequisites

- Node.js (v20.x or higher)
- MongoDB (running locally or remote connection)
- Expo CLI (for mobile development)
- iOS Simulator or Android Emulator (optional, for testing)

## Getting Started

### 1. Start MongoDB

Make sure MongoDB is running on your system:

```bash
# macOS (if installed via Homebrew)
brew services start mongodb-community

# Or run manually
mongod --dbpath /path/to/your/data/directory
```

### 2. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Install dependencies (already done)
npm install

# Start the development server
npm run dev
```

The backend will run on `http://localhost:3000`

Available backend scripts:
- `npm run dev` - Run in development mode with hot reload
- `npm run build` - Compile TypeScript to JavaScript
- `npm start` - Run the compiled production build

### 3. Mobile App Setup

```bash
# Navigate to mobile-app directory
cd mobile-app

# Install dependencies (already done)
npm install

# Start the Expo development server
npm start
```

Then:
- Press `i` for iOS simulator
- Press `a` for Android emulator
- Scan QR code with Expo Go app on your phone

### 4. Seed the Database (Optional)

Populate the database with sample oyster data:

```bash
# Make sure you're in the backend directory
cd backend

# Run the seed script
npm run seed
```

This will add 6 sample oysters from around the world (Kumamoto, Blue Point, Belon, Miyagi, Sydney Rock, and Fanny Bay).

## API Endpoints

### Oysters
- `GET /api/oysters` - Get all oysters
- `GET /api/oysters/:id` - Get single oyster by ID
- `GET /api/oysters/search?query=term` - Search oysters
- `POST /api/oysters` - Create new oyster
- `PUT /api/oysters/:id` - Update oyster
- `DELETE /api/oysters/:id` - Delete oyster

## Configuration

### Backend Environment Variables

Edit `backend/.env`:

```
PORT=3000
MONGODB_URI=mongodb://localhost:27017/oyster-db
NODE_ENV=development
```

### Mobile App API URL

To connect to the backend from your phone, update the API_URL in:
`mobile-app/src/services/api.ts`

```typescript
// For iOS Simulator
const API_URL = 'http://localhost:3000/api';

// For Android Emulator
const API_URL = 'http://10.0.2.2:3000/api';

// For physical device (use your computer's IP)
const API_URL = 'http://YOUR_COMPUTER_IP:3000/api';
```

## Tech Stack

### Frontend
- React Native with Expo
- TypeScript
- React Navigation (Native Stack)
- Axios for API calls

### Backend
- Node.js
- Express.js
- MongoDB with Mongoose
- TypeScript
- CORS enabled

## Development Tips

1. Make sure both backend and MongoDB are running before starting the mobile app
2. Use the pull-to-refresh gesture in the app to reload data
3. Check the console logs if the app can't connect to the backend
4. Use Expo Go app for quick testing on physical devices

## Next Steps

Potential enhancements:
- Add user authentication
- Implement favorites/bookmarks
- Add images for oysters
- Create admin panel for managing oysters
- Add filters (by region, size, taste profile)
- Implement offline support
- Add ratings and reviews

## Troubleshooting

**Can't connect to backend from mobile app:**
- Check that the backend is running on port 3000
- Verify the API_URL in `mobile-app/src/services/api.ts`
- For physical devices, use your computer's local IP address

**MongoDB connection errors:**
- Ensure MongoDB is running
- Check the MONGODB_URI in `backend/.env`

**TypeScript errors:**
- Run `npm run build` in the backend directory to check for compilation errors
