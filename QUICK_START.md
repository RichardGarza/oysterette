# Oysterette - Quick Start Guide

## 🚀 Start Development

### 1. Start Backend
```bash
cd backend
npm run dev
```
Backend runs on: **http://localhost:3000**

### 2. Start Mobile App
```bash
cd mobile-app
npm start
```
Then press `i` for iOS or `a` for Android

---

## 🧪 Run Tests
```bash
cd backend
npm test                    # All tests
npm run test:unit           # Unit tests only
npm run test:integration    # Integration tests only
npm run test:coverage       # With coverage
```

---

## 🌊 Add More Oysters

1. Edit: `backend/data/oyster-list-for-seeding.json`
2. Add your oysters in this format:
```json
{
  "name": "Oyster Name",
  "species": "Crassostrea gigas",
  "origin": "Location",
  "standout_note": "Notes",
  "size": 5,
  "body": 6,
  "sweet_brininess": 7,
  "flavorfulness": 8,
  "creaminess": 5
}
```
3. Run: `cd backend && npm run seed`

---

## 📚 Documentation

- **API Docs**: `backend/API_DOCUMENTATION.md`
- **Project Status**: `PROJECT_STATUS.md`
- **Original README**: `README.md`

---

## 🔑 Test the API

### Register
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","name":"Test","password":"pass123"}'
```

### Get Oysters
```bash
curl http://localhost:3000/api/oysters
```

---

## ✅ What's Complete

✅ PostgreSQL database with 40 oysters
✅ Complete backend API with authentication
✅ 10-point attribute system
✅ Reviews with ratings & sliders
✅ User top oysters (favorites)
✅ Comprehensive API documentation
✅ Unit & integration tests
✅ Mobile app API service layer
✅ TypeScript types updated

---

## 📱 What's Next

The mobile app foundation is ready! Next steps:
1. Build Login/Register screens
2. Update UI to show 10-point attributes
3. Create review screen with sliders
4. Add profile & favorites screens

---

## 💾 Database

**Name**: oysterette
**Oysters**: 40 (ready for 100+ more)
**Users**: 0 (create via /api/auth/register)

---

**Your backend is production-ready!** 🎉
