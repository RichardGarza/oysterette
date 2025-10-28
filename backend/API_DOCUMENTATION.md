# Oysterette API Documentation

**Base URL:** `http://localhost:3000/api`

**Version:** 2.0.0

## Table of Contents
- [Authentication](#authentication)
- [Oysters](#oysters)
- [Reviews](#reviews)
- [Users](#users)
- [Error Handling](#error-handling)

---

## Authentication

All protected endpoints require a JWT token in the `Authorization` header:
```
Authorization: Bearer <token>
```

### Register User
Create a new user account.

**Endpoint:** `POST /auth/register`

**Public:** Yes

**Request Body:**
```json
{
  "email": "user@example.com",
  "name": "John Doe",
  "password": "securepassword"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "name": "John Doe",
      "createdAt": "2025-10-28T12:00:00.000Z"
    },
    "token": "jwt-token-here"
  }
}
```

**Status Codes:**
- `201`: User created successfully
- `400`: Email already exists or invalid data
- `500`: Server error

---

### Login User
Authenticate and receive a JWT token.

**Endpoint:** `POST /auth/login`

**Public:** Yes

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securepassword"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "name": "John Doe",
      "createdAt": "2025-10-28T12:00:00.000Z"
    },
    "token": "jwt-token-here"
  }
}
```

**Status Codes:**
- `200`: Login successful
- `401`: Invalid credentials
- `500`: Server error

---

### Get Profile
Retrieve the current user's profile.

**Endpoint:** `GET /auth/profile`

**Protected:** Yes

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe",
    "preferences": {},
    "createdAt": "2025-10-28T12:00:00.000Z",
    "updatedAt": "2025-10-28T12:00:00.000Z"
  }
}
```

**Status Codes:**
- `200`: Success
- `401`: Not authenticated
- `404`: User not found
- `500`: Server error

---

## Oysters

### Get All Oysters
Retrieve all oysters in the database.

**Endpoint:** `GET /oysters`

**Public:** Yes (optional auth for user-specific data)

**Response:**
```json
{
  "success": true,
  "count": 40,
  "data": [
    {
      "id": "uuid",
      "name": "Kusshi",
      "species": "Crassostrea gigas",
      "origin": "Deep Bay",
      "standoutNotes": "Favorite, dense flavorful",
      "size": 4,
      "body": 8,
      "sweetBrininess": 7,
      "flavorfulness": 9,
      "creaminess": 6,
      "createdAt": "2025-10-28T12:00:00.000Z",
      "updatedAt": "2025-10-28T12:00:00.000Z",
      "_count": {
        "reviews": 5
      }
    }
  ]
}
```

**Oyster Attribute Scales (1-10):**
- **size**: 1 (Tiny) → 10 (Huge)
- **body**: 1 (Thin) → 10 (Extremely Fat)
- **sweetBrininess**: 1 (Very Sweet) → 10 (Very Salty)
- **flavorfulness**: 1 (Boring) → 10 (Extremely Bold)
- **creaminess**: 1 (None) → 10 (Nothing But Cream)

**Status Codes:**
- `200`: Success
- `500`: Server error

---

### Get Oyster by ID
Retrieve a single oyster with reviews.

**Endpoint:** `GET /oysters/:id`

**Public:** Yes

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Kusshi",
    "species": "Crassostrea gigas",
    "origin": "Deep Bay",
    "standoutNotes": "Favorite, dense flavorful",
    "size": 4,
    "body": 8,
    "sweetBrininess": 7,
    "flavorfulness": 9,
    "creaminess": 6,
    "createdAt": "2025-10-28T12:00:00.000Z",
    "updatedAt": "2025-10-28T12:00:00.000Z",
    "reviews": [
      {
        "id": "uuid",
        "rating": "LOVED_IT",
        "size": 4,
        "body": 8,
        "sweetBrininess": 7,
        "flavorfulness": 9,
        "creaminess": 6,
        "notes": "Absolutely delicious!",
        "createdAt": "2025-10-28T12:00:00.000Z",
        "user": {
          "id": "uuid",
          "name": "John Doe"
        }
      }
    ],
    "_count": {
      "reviews": 5
    }
  }
}
```

**Status Codes:**
- `200`: Success
- `404`: Oyster not found
- `500`: Server error

---

### Search Oysters
Search oysters by name, origin, or species.

**Endpoint:** `GET /oysters/search?query=<searchterm>`

**Public:** Yes

**Query Parameters:**
- `query` (required): Search term

**Response:**
```json
{
  "success": true,
  "count": 3,
  "data": [...]
}
```

**Status Codes:**
- `200`: Success
- `400`: Search query required
- `500`: Server error

---

### Create Oyster
Add a new oyster to the database.

**Endpoint:** `POST /oysters`

**Protected:** Yes

**Request Body:**
```json
{
  "name": "New Oyster",
  "species": "Crassostrea gigas",
  "origin": "Pacific Northwest",
  "standoutNotes": "Sweet and creamy",
  "size": 6,
  "body": 7,
  "sweetBrininess": 5,
  "flavorfulness": 8,
  "creaminess": 7
}
```

**Response:**
```json
{
  "success": true,
  "data": { /* created oyster */ }
}
```

**Status Codes:**
- `201`: Oyster created
- `400`: Oyster name already exists or invalid data
- `401`: Not authenticated
- `500`: Server error

---

### Update Oyster
Update an existing oyster.

**Endpoint:** `PUT /oysters/:id`

**Protected:** Yes

**Request Body:** (all fields optional)
```json
{
  "standoutNotes": "Updated notes",
  "size": 7
}
```

**Status Codes:**
- `200`: Success
- `400`: Invalid data
- `401`: Not authenticated
- `404`: Oyster not found
- `500`: Server error

---

### Delete Oyster
Delete an oyster from the database.

**Endpoint:** `DELETE /oysters/:id`

**Protected:** Yes

**Status Codes:**
- `200`: Success
- `401`: Not authenticated
- `404`: Oyster not found
- `500`: Server error

---

## Reviews

### Get Oyster Reviews
Get all reviews for a specific oyster.

**Endpoint:** `GET /reviews/oyster/:oysterId`

**Public:** Yes

**Response:**
```json
{
  "success": true,
  "count": 5,
  "data": [
    {
      "id": "uuid",
      "rating": "LOVED_IT",
      "size": 4,
      "body": 8,
      "sweetBrininess": 7,
      "flavorfulness": 9,
      "creaminess": 6,
      "notes": "Excellent oyster!",
      "createdAt": "2025-10-28T12:00:00.000Z",
      "user": {
        "id": "uuid",
        "name": "John Doe"
      }
    }
  ]
}
```

**Rating Options:**
- `LOVED_IT`
- `LIKED_IT`
- `MEH`
- `HATED_IT`

**Status Codes:**
- `200`: Success
- `500`: Server error

---

### Get User Reviews
Get all reviews by the current user.

**Endpoint:** `GET /reviews/user`

**Protected:** Yes

**Response:**
```json
{
  "success": true,
  "count": 3,
  "data": [
    {
      "id": "uuid",
      "rating": "LOVED_IT",
      "size": 4,
      "body": 8,
      "notes": "Great!",
      "createdAt": "2025-10-28T12:00:00.000Z",
      "oyster": {
        "id": "uuid",
        "name": "Kusshi",
        "species": "Crassostrea gigas"
      }
    }
  ]
}
```

**Status Codes:**
- `200`: Success
- `401`: Not authenticated
- `500`: Server error

---

### Create Review
Create a new review for an oyster.

**Endpoint:** `POST /reviews`

**Protected:** Yes

**Request Body:**
```json
{
  "oysterId": "uuid",
  "rating": "LOVED_IT",
  "size": 4,
  "body": 8,
  "sweetBrininess": 7,
  "flavorfulness": 9,
  "creaminess": 6,
  "notes": "Absolutely delicious!"
}
```

**Note:** Only `oysterId` and `rating` are required. The 10-point scale attributes are optional.

**Response:**
```json
{
  "success": true,
  "data": { /* created review */ }
}
```

**Status Codes:**
- `201`: Review created
- `400`: Already reviewed this oyster or invalid data
- `401`: Not authenticated
- `404`: Oyster not found
- `500`: Server error

---

### Update Review
Update an existing review.

**Endpoint:** `PUT /reviews/:reviewId`

**Protected:** Yes (must own the review)

**Request Body:** (all fields optional)
```json
{
  "rating": "LOVED_IT",
  "notes": "Updated notes"
}
```

**Status Codes:**
- `200`: Success
- `401`: Not authenticated
- `403`: Not authorized (not your review)
- `404`: Review not found
- `500`: Server error

---

### Delete Review
Delete a review.

**Endpoint:** `DELETE /reviews/:reviewId`

**Protected:** Yes (must own the review)

**Status Codes:**
- `200`: Success
- `401`: Not authenticated
- `403`: Not authorized
- `404`: Review not found
- `500`: Server error

---

## Users

### Get Top Oysters
Get the user's favorite oysters list.

**Endpoint:** `GET /users/top-oysters`

**Protected:** Yes

**Response:**
```json
{
  "success": true,
  "count": 5,
  "data": [
    {
      "id": "uuid",
      "rank": 1,
      "addedAt": "2025-10-28T12:00:00.000Z",
      "oyster": {
        "id": "uuid",
        "name": "Kusshi",
        "species": "Crassostrea gigas",
        "origin": "Deep Bay",
        "size": 4,
        "body": 8
      }
    }
  ]
}
```

**Status Codes:**
- `200`: Success
- `401`: Not authenticated
- `500`: Server error

---

### Add Top Oyster
Add an oyster to your favorites list.

**Endpoint:** `POST /users/top-oysters`

**Protected:** Yes

**Request Body:**
```json
{
  "oysterId": "uuid",
  "rank": 1
}
```

**Note:** `rank` is optional. If not provided, will be added to the end of the list.

**Status Codes:**
- `201`: Added successfully
- `400`: Already in top list or oyster not found
- `401`: Not authenticated
- `500`: Server error

---

### Remove Top Oyster
Remove an oyster from your favorites list.

**Endpoint:** `DELETE /users/top-oysters/:oysterId`

**Protected:** Yes

**Status Codes:**
- `200`: Success
- `401`: Not authenticated
- `404`: Oyster not in top list
- `500`: Server error

---

### Update Preferences
Update user preferences (stored as JSON).

**Endpoint:** `PUT /users/preferences`

**Protected:** Yes

**Request Body:**
```json
{
  "preferences": {
    "favoriteOrigin": "Pacific Northwest",
    "preferredSalinity": 7,
    "notifications": true
  }
}
```

**Status Codes:**
- `200`: Success
- `401`: Not authenticated
- `500`: Server error

---

### Update Profile
Update user profile information.

**Endpoint:** `PUT /users/profile`

**Protected:** Yes

**Request Body:** (all fields optional)
```json
{
  "name": "Jane Doe",
  "email": "jane@example.com"
}
```

**Status Codes:**
- `200`: Success
- `400`: Email already in use
- `401`: Not authenticated
- `500`: Server error

---

## Error Handling

All error responses follow this format:

```json
{
  "success": false,
  "error": "Error message description"
}
```

### Common Status Codes
- `200`: Success
- `201`: Created
- `400`: Bad Request (invalid data)
- `401`: Unauthorized (not authenticated)
- `403`: Forbidden (not authorized)
- `404`: Not Found
- `500`: Internal Server Error

### Authentication Errors
If a token is invalid or expired, the API returns `401` and the client should redirect to login.

---

## Testing the API

### Using cURL

**Register:**
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","name":"Test User","password":"password123"}'
```

**Login:**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

**Get Oysters (with auth):**
```bash
curl -X GET http://localhost:3000/api/oysters \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**Create Review:**
```bash
curl -X POST http://localhost:3000/api/reviews \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{"oysterId":"UUID_HERE","rating":"LOVED_IT","notes":"Delicious!"}'
```

---

## Rate Limiting

Currently no rate limiting is implemented. For production deployment, consider adding rate limiting middleware.

## CORS

CORS is enabled for all origins in development. For production, configure specific allowed origins in the backend `.env` file.

---

## Database Schema

### Users Table
- `id` (UUID, PK)
- `email` (String, unique)
- `name` (String)
- `password` (String, hashed)
- `preferences` (JSON)
- `createdAt` (DateTime)
- `updatedAt` (DateTime)

### Oysters Table
- `id` (UUID, PK)
- `name` (String, unique)
- `species` (String)
- `origin` (String)
- `standoutNotes` (String, nullable)
- `size` (Integer, 1-10)
- `body` (Integer, 1-10)
- `sweetBrininess` (Integer, 1-10)
- `flavorfulness` (Integer, 1-10)
- `creaminess` (Integer, 1-10)
- `createdAt` (DateTime)
- `updatedAt` (DateTime)

### Reviews Table
- `id` (UUID, PK)
- `userId` (UUID, FK)
- `oysterId` (UUID, FK)
- `rating` (Enum: LOVED_IT, LIKED_IT, MEH, HATED_IT)
- `size` (Integer, 1-10, nullable)
- `body` (Integer, 1-10, nullable)
- `sweetBrininess` (Integer, 1-10, nullable)
- `flavorfulness` (Integer, 1-10, nullable)
- `creaminess` (Integer, 1-10, nullable)
- `notes` (String, nullable)
- `createdAt` (DateTime)
- Unique constraint: (userId, oysterId)

### UserTopOysters Table
- `id` (UUID, PK)
- `userId` (UUID, FK)
- `oysterId` (UUID, FK)
- `rank` (Integer)
- `addedAt` (DateTime)
- Unique constraint: (userId, oysterId)

---

## Future Enhancements
- AI-based oyster recommendations
- Photo uploads for oysters
- Social features (sharing reviews, following users)
- Advanced filtering and sorting
- Batch operations
- WebSocket support for real-time updates
