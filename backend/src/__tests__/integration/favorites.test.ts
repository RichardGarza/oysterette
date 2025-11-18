import request from 'supertest';
import express from 'express';
import cors from 'cors';
import authRoutes from '../../routes/authRoutes';
import favoriteRoutes from '../../routes/favoriteRoutes';
import prisma from '../../lib/prisma';

// Create test app
const app = express();
app.use(cors());
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/favorites', favoriteRoutes);

describe('Favorites API Integration Tests', () => {
  let authToken: string;
  let userId: string;
  let oyster1Id: string;
  let oyster2Id: string;
  let oyster3Id: string;

  const testUser = {
    email: 'favoritetest@oysterette.com',
    name: 'Favorite Test User',
    password: 'TestPassword123',
  };

  // Setup: Create user and test oysters
  beforeAll(async () => {
    // Cleanup existing data
    await prisma.user.deleteMany({
      where: { email: testUser.email },
    });

    await prisma.oyster.deleteMany({
      where: {
        name: {
          in: ['Favorite Test Oyster 1', 'Favorite Test Oyster 2', 'Favorite Test Oyster 3'],
        },
      },
    });

    // Register test user
    const response = await request(app)
      .post('/api/auth/register')
      .send(testUser);

    authToken = response.body.data.token;
    userId = response.body.data.user.id;

    // Create test oysters
    const oyster1 = await prisma.oyster.create({
      data: {
        name: 'Favorite Test Oyster 1',
        species: 'Crassostrea gigas',
        origin: 'Test Bay 1',
      },
    });
    oyster1Id = oyster1.id;

    const oyster2 = await prisma.oyster.create({
      data: {
        name: 'Favorite Test Oyster 2',
        species: 'Crassostrea gigas',
        origin: 'Test Bay 2',
      },
    });
    oyster2Id = oyster2.id;

    const oyster3 = await prisma.oyster.create({
      data: {
        name: 'Favorite Test Oyster 3',
        species: 'Crassostrea virginica',
        origin: 'Test Bay 3',
      },
    });
    oyster3Id = oyster3.id;
  });

  // Cleanup after all tests
  afterAll(async () => {
    await prisma.favorite.deleteMany({
      where: { userId },
    });

    await prisma.user.deleteMany({
      where: { email: testUser.email },
    });

    await prisma.oyster.deleteMany({
      where: {
        id: { in: [oyster1Id, oyster2Id, oyster3Id] },
      },
    });

    await prisma.$disconnect();
  });

  // Clear favorites before each test
  beforeEach(async () => {
    await prisma.favorite.deleteMany({
      where: { userId },
    });
  });

  describe('GET /api/favorites', () => {
    it('should return empty array when user has no favorites', async () => {
      const response = await request(app)
        .get('/api/favorites')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.favorites).toEqual([]);
    });

    it('should return user favorites in descending order', async () => {
      // Add favorites
      await prisma.favorite.createMany({
        data: [
          { userId, oysterId: oyster1Id },
          { userId, oysterId: oyster2Id },
        ],
      });

      const response = await request(app)
        .get('/api/favorites')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.favorites).toBeInstanceOf(Array);
      expect(response.body.favorites.length).toBe(2);
      expect(response.body.favorites).toContain(oyster1Id);
      expect(response.body.favorites).toContain(oyster2Id);
    });

    it('should fail without authentication', async () => {
      await request(app)
        .get('/api/favorites')
        .expect(401);
    });
  });

  describe('POST /api/favorites/:oysterId', () => {
    it('should add an oyster to favorites', async () => {
      const response = await request(app)
        .post(`/api/favorites/${oyster1Id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(201);

      expect(response.body.favorite).toHaveProperty('userId', userId);
      expect(response.body.favorite).toHaveProperty('oysterId', oyster1Id);

      // Verify in database
      const favorite = await prisma.favorite.findUnique({
        where: {
          userId_oysterId: { userId, oysterId: oyster1Id },
        },
      });
      expect(favorite).not.toBeNull();
    });

    it('should return 200 when adding already favorited oyster', async () => {
      // Add favorite first
      await prisma.favorite.create({
        data: { userId, oysterId: oyster1Id },
      });

      const response = await request(app)
        .post(`/api/favorites/${oyster1Id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.message).toBe('Already favorited');
      expect(response.body.favorite).toHaveProperty('oysterId', oyster1Id);
    });

    it('should return 404 for non-existent oyster', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      const response = await request(app)
        .post(`/api/favorites/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.error).toBe('Oyster not found');
    });

    it('should fail without authentication', async () => {
      await request(app)
        .post(`/api/favorites/${oyster1Id}`)
        .expect(401);
    });
  });

  describe('DELETE /api/favorites/:oysterId', () => {
    it('should remove an oyster from favorites', async () => {
      // Add favorite first
      await prisma.favorite.create({
        data: { userId, oysterId: oyster1Id },
      });

      const response = await request(app)
        .delete(`/api/favorites/${oyster1Id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.message).toBe('Favorite removed successfully');

      // Verify removal in database
      const favorite = await prisma.favorite.findUnique({
        where: {
          userId_oysterId: { userId, oysterId: oyster1Id },
        },
      });
      expect(favorite).toBeNull();
    });

    it('should return 404 when removing non-existent favorite', async () => {
      const response = await request(app)
        .delete(`/api/favorites/${oyster1Id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.error).toBe('Favorite not found');
    });

    it('should fail without authentication', async () => {
      await request(app)
        .delete(`/api/favorites/${oyster1Id}`)
        .expect(401);
    });
  });

  describe('POST /api/favorites/sync', () => {
    it('should sync favorites from mobile (add new favorites)', async () => {
      const response = await request(app)
        .post('/api/favorites/sync')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          favorites: [oyster1Id, oyster2Id],
        })
        .expect(200);

      expect(response.body.message).toBe('Favorites synced successfully');
      expect(response.body.added).toBe(2);
      expect(response.body.removed).toBe(0);
      expect(response.body.total).toBe(2);

      // Verify in database
      const favorites = await prisma.favorite.findMany({
        where: { userId },
      });
      expect(favorites.length).toBe(2);
    });

    it('should sync favorites from mobile (remove old favorites)', async () => {
      // Add favorites first
      await prisma.favorite.createMany({
        data: [
          { userId, oysterId: oyster1Id },
          { userId, oysterId: oyster2Id },
        ],
      });

      const response = await request(app)
        .post('/api/favorites/sync')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          favorites: [oyster1Id], // Only keep oyster1
        })
        .expect(200);

      expect(response.body.added).toBe(0);
      expect(response.body.removed).toBe(1);
      expect(response.body.total).toBe(1);

      // Verify in database
      const favorites = await prisma.favorite.findMany({
        where: { userId },
      });
      expect(favorites.length).toBe(1);
      expect(favorites[0].oysterId).toBe(oyster1Id);
    });

    it('should sync favorites from mobile (mixed add/remove)', async () => {
      // Add oyster1 and oyster2 as favorites
      await prisma.favorite.createMany({
        data: [
          { userId, oysterId: oyster1Id },
          { userId, oysterId: oyster2Id },
        ],
      });

      // Sync: keep oyster1, remove oyster2, add oyster3
      const response = await request(app)
        .post('/api/favorites/sync')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          favorites: [oyster1Id, oyster3Id],
        })
        .expect(200);

      expect(response.body.added).toBe(1); // oyster3
      expect(response.body.removed).toBe(1); // oyster2
      expect(response.body.total).toBe(2);

      // Verify in database
      const favorites = await prisma.favorite.findMany({
        where: { userId },
        select: { oysterId: true },
      });
      const oysterIds = favorites.map(f => f.oysterId);
      expect(oysterIds).toContain(oyster1Id);
      expect(oysterIds).toContain(oyster3Id);
      expect(oysterIds).not.toContain(oyster2Id);
    });

    it('should handle empty favorites array (remove all)', async () => {
      // Add favorites first
      await prisma.favorite.createMany({
        data: [
          { userId, oysterId: oyster1Id },
          { userId, oysterId: oyster2Id },
        ],
      });

      const response = await request(app)
        .post('/api/favorites/sync')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          favorites: [],
        })
        .expect(200);

      expect(response.body.added).toBe(0);
      expect(response.body.removed).toBe(2);
      expect(response.body.total).toBe(0);

      // Verify all removed
      const favorites = await prisma.favorite.findMany({
        where: { userId },
      });
      expect(favorites.length).toBe(0);
    });

    it('should return 400 for invalid favorites format', async () => {
      const response = await request(app)
        .post('/api/favorites/sync')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          favorites: 'not-an-array',
        })
        .expect(400);

      expect(response.body.error).toBe('Favorites must be an array of oyster IDs');
    });

    it('should fail without authentication', async () => {
      await request(app)
        .post('/api/favorites/sync')
        .send({
          favorites: [oyster1Id],
        })
        .expect(401);
    });
  });
});
