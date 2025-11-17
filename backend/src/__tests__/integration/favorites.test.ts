/**
 * Favorites Integration Tests
 *
 * Tests all favorites endpoints including:
 * - GET /api/favorites - Get user's favorite oyster IDs
 * - POST /api/favorites/:oysterId - Add favorite
 * - DELETE /api/favorites/:oysterId - Remove favorite
 * - POST /api/favorites/sync - Sync favorites from mobile
 *
 * Coverage:
 * - Happy path scenarios
 * - Authentication/authorization
 * - Edge cases (duplicates, non-existent oysters)
 * - Concurrent operations
 * - Sync logic (additions, removals, no changes)
 */

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

// Error handler
app.use((err: any, req: any, res: any, next: any) => {
  console.error('Test app error:', err);
  res.status(500).json({ error: err.message });
});

describe('Favorites Integration Tests', () => {
  let authToken: string;
  let userId: string;
  let secondUserToken: string;
  let secondUserId: string;
  let oyster1Id: string;
  let oyster2Id: string;
  let oyster3Id: string;

  const testUser = {
    email: 'favorites-test@oysterette.com',
    name: 'Favorites Test User',
    password: 'TestPassword123',
  };

  const secondUser = {
    email: 'favorites-test2@oysterette.com',
    name: 'Second Favorites User',
    password: 'TestPassword123',
  };

  beforeAll(async () => {
    // Cleanup existing test data
    await prisma.favorite.deleteMany({
      where: {
        user: {
          email: {
            in: [testUser.email, secondUser.email],
          },
        },
      },
    });

    await prisma.user.deleteMany({
      where: {
        email: {
          in: [testUser.email, secondUser.email],
        },
      },
    });

    await prisma.oyster.deleteMany({
      where: {
        name: {
          in: ['Favorites Test Oyster 1', 'Favorites Test Oyster 2', 'Favorites Test Oyster 3'],
        },
      },
    });

    // Register test users
    const registerResponse = await request(app)
      .post('/api/auth/register')
      .send(testUser);

    authToken = registerResponse.body.data.token;
    userId = registerResponse.body.data.user.id;

    const secondRegisterResponse = await request(app)
      .post('/api/auth/register')
      .send(secondUser);

    secondUserToken = secondRegisterResponse.body.data.token;
    secondUserId = secondRegisterResponse.body.data.user.id;

    // Create test oysters
    const oyster1 = await prisma.oyster.create({
      data: {
        name: 'Favorites Test Oyster 1',
        species: 'Crassostrea gigas',
        origin: 'Test Origin 1',
      },
    });
    oyster1Id = oyster1.id;

    const oyster2 = await prisma.oyster.create({
      data: {
        name: 'Favorites Test Oyster 2',
        species: 'Crassostrea virginica',
        origin: 'Test Origin 2',
      },
    });
    oyster2Id = oyster2.id;

    const oyster3 = await prisma.oyster.create({
      data: {
        name: 'Favorites Test Oyster 3',
        species: 'Ostrea edulis',
        origin: 'Test Origin 3',
      },
    });
    oyster3Id = oyster3.id;
  });

  afterAll(async () => {
    // Cleanup
    await prisma.favorite.deleteMany({
      where: {
        userId: {
          in: [userId, secondUserId],
        },
      },
    });

    await prisma.user.deleteMany({
      where: {
        id: {
          in: [userId, secondUserId],
        },
      },
    });

    await prisma.oyster.deleteMany({
      where: {
        id: {
          in: [oyster1Id, oyster2Id, oyster3Id],
        },
      },
    });

    await prisma.$disconnect();
  });

  describe('GET /api/favorites', () => {
    beforeEach(async () => {
      // Clear favorites before each test
      await prisma.favorite.deleteMany({
        where: { userId },
      });
    });

    it('should return empty array when user has no favorites', async () => {
      const response = await request(app)
        .get('/api/favorites')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.favorites).toEqual([]);
    });

    it('should return array of favorite oyster IDs', async () => {
      // Add favorites
      await prisma.favorite.createMany({
        data: [
          { userId, oysterId: oyster1Id },
          { userId, oysterId: oyster2Id },
        ],
      });

      const response = await request(app)
        .get('/api/favorites')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.favorites).toHaveLength(2);
      expect(response.body.favorites).toEqual(
        expect.arrayContaining([oyster1Id, oyster2Id])
      );
    });

    it('should return favorites in descending order by created date', async () => {
      // Add favorites with slight delay to ensure order
      await prisma.favorite.create({
        data: { userId, oysterId: oyster1Id },
      });

      await new Promise((resolve) => setTimeout(resolve, 100));

      await prisma.favorite.create({
        data: { userId, oysterId: oyster2Id },
      });

      const response = await request(app)
        .get('/api/favorites')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.favorites[0]).toBe(oyster2Id); // Most recent first
      expect(response.body.favorites[1]).toBe(oyster1Id);
    });

    it('should require authentication', async () => {
      const response = await request(app).get('/api/favorites');

      expect(response.status).toBe(401);
      expect(response.body.error).toBeDefined();
    });

    it('should not return other users favorites', async () => {
      // Add favorite for second user
      await prisma.favorite.create({
        data: { userId: secondUserId, oysterId: oyster3Id },
      });

      const response = await request(app)
        .get('/api/favorites')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.favorites).not.toContain(oyster3Id);
    });
  });

  describe('POST /api/favorites/:oysterId', () => {
    beforeEach(async () => {
      await prisma.favorite.deleteMany({
        where: { userId },
      });
    });

    it('should add oyster to favorites', async () => {
      const response = await request(app)
        .post(`/api/favorites/${oyster1Id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(201);
      expect(response.body.favorite).toBeDefined();
      expect(response.body.favorite.userId).toBe(userId);
      expect(response.body.favorite.oysterId).toBe(oyster1Id);

      // Verify in database
      const favorite = await prisma.favorite.findUnique({
        where: {
          userId_oysterId: {
            userId,
            oysterId: oyster1Id,
          },
        },
      });

      expect(favorite).not.toBeNull();
    });

    it('should handle duplicate favorites gracefully', async () => {
      // Add favorite first time
      await request(app)
        .post(`/api/favorites/${oyster1Id}`)
        .set('Authorization', `Bearer ${authToken}`);

      // Try to add again
      const response = await request(app)
        .post(`/api/favorites/${oyster1Id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.message).toContain('Already favorited');

      // Verify only one favorite exists
      const favorites = await prisma.favorite.findMany({
        where: {
          userId,
          oysterId: oyster1Id,
        },
      });

      expect(favorites).toHaveLength(1);
    });

    it('should return 404 for non-existent oyster', async () => {
      const fakeOysterId = '00000000-0000-0000-0000-000000000000';

      const response = await request(app)
        .post(`/api/favorites/${fakeOysterId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
      expect(response.body.error).toContain('not found');
    });

    it('should require authentication', async () => {
      const response = await request(app).post(`/api/favorites/${oyster1Id}`);

      expect(response.status).toBe(401);
      expect(response.body.error).toBeDefined();
    });

    it('should handle invalid UUID format', async () => {
      const response = await request(app)
        .post('/api/favorites/invalid-uuid')
        .set('Authorization', `Bearer ${authToken}`);

      // Will fail at validation or database level
      expect([400, 404, 500]).toContain(response.status);
    });
  });

  describe('DELETE /api/favorites/:oysterId', () => {
    beforeEach(async () => {
      await prisma.favorite.deleteMany({
        where: { userId },
      });

      // Add a favorite to delete
      await prisma.favorite.create({
        data: { userId, oysterId: oyster1Id },
      });
    });

    it('should remove oyster from favorites', async () => {
      const response = await request(app)
        .delete(`/api/favorites/${oyster1Id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.message).toContain('removed successfully');

      // Verify removed from database
      const favorite = await prisma.favorite.findUnique({
        where: {
          userId_oysterId: {
            userId,
            oysterId: oyster1Id,
          },
        },
      });

      expect(favorite).toBeNull();
    });

    it('should return 404 when removing non-existent favorite', async () => {
      const response = await request(app)
        .delete(`/api/favorites/${oyster2Id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
      expect(response.body.error).toContain('not found');
    });

    it('should not allow removing other users favorites', async () => {
      // Add favorite for second user
      await prisma.favorite.create({
        data: { userId: secondUserId, oysterId: oyster2Id },
      });

      // Try to remove with first user's token
      const response = await request(app)
        .delete(`/api/favorites/${oyster2Id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);

      // Verify second user's favorite still exists
      const favorite = await prisma.favorite.findUnique({
        where: {
          userId_oysterId: {
            userId: secondUserId,
            oysterId: oyster2Id,
          },
        },
      });

      expect(favorite).not.toBeNull();
    });

    it('should require authentication', async () => {
      const response = await request(app).delete(`/api/favorites/${oyster1Id}`);

      expect(response.status).toBe(401);
      expect(response.body.error).toBeDefined();
    });
  });

  describe('POST /api/favorites/sync', () => {
    beforeEach(async () => {
      await prisma.favorite.deleteMany({
        where: { userId },
      });
    });

    it('should sync favorites from empty to populated', async () => {
      const response = await request(app)
        .post('/api/favorites/sync')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          favorites: [oyster1Id, oyster2Id, oyster3Id],
        });

      expect(response.status).toBe(200);
      expect(response.body.message).toContain('synced successfully');
      expect(response.body.added).toBe(3);
      expect(response.body.removed).toBe(0);
      expect(response.body.total).toBe(3);

      // Verify in database
      const favorites = await prisma.favorite.findMany({
        where: { userId },
      });

      expect(favorites).toHaveLength(3);
    });

    it('should add new favorites during sync', async () => {
      // Start with one favorite
      await prisma.favorite.create({
        data: { userId, oysterId: oyster1Id },
      });

      // Sync with two favorites (one existing, one new)
      const response = await request(app)
        .post('/api/favorites/sync')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          favorites: [oyster1Id, oyster2Id],
        });

      expect(response.status).toBe(200);
      expect(response.body.added).toBe(1); // Only oyster2Id added
      expect(response.body.removed).toBe(0);
      expect(response.body.total).toBe(2);
    });

    it('should remove favorites during sync', async () => {
      // Start with three favorites
      await prisma.favorite.createMany({
        data: [
          { userId, oysterId: oyster1Id },
          { userId, oysterId: oyster2Id },
          { userId, oysterId: oyster3Id },
        ],
      });

      // Sync with only one favorite
      const response = await request(app)
        .post('/api/favorites/sync')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          favorites: [oyster1Id],
        });

      expect(response.status).toBe(200);
      expect(response.body.added).toBe(0);
      expect(response.body.removed).toBe(2); // oyster2Id and oyster3Id removed
      expect(response.body.total).toBe(1);

      // Verify in database
      const favorites = await prisma.favorite.findMany({
        where: { userId },
      });

      expect(favorites).toHaveLength(1);
      expect(favorites[0].oysterId).toBe(oyster1Id);
    });

    it('should handle sync with no changes', async () => {
      // Start with favorites
      await prisma.favorite.createMany({
        data: [
          { userId, oysterId: oyster1Id },
          { userId, oysterId: oyster2Id },
        ],
      });

      // Sync with same favorites
      const response = await request(app)
        .post('/api/favorites/sync')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          favorites: [oyster1Id, oyster2Id],
        });

      expect(response.status).toBe(200);
      expect(response.body.added).toBe(0);
      expect(response.body.removed).toBe(0);
      expect(response.body.total).toBe(2);
    });

    it('should handle sync to empty favorites', async () => {
      // Start with favorites
      await prisma.favorite.createMany({
        data: [
          { userId, oysterId: oyster1Id },
          { userId, oysterId: oyster2Id },
        ],
      });

      // Sync with empty array
      const response = await request(app)
        .post('/api/favorites/sync')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          favorites: [],
        });

      expect(response.status).toBe(200);
      expect(response.body.added).toBe(0);
      expect(response.body.removed).toBe(2);
      expect(response.body.total).toBe(0);

      // Verify all removed
      const favorites = await prisma.favorite.findMany({
        where: { userId },
      });

      expect(favorites).toHaveLength(0);
    });

    it('should reject invalid request body (not array)', async () => {
      const response = await request(app)
        .post('/api/favorites/sync')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          favorites: 'not-an-array',
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('must be an array');
    });

    it('should reject missing favorites field', async () => {
      const response = await request(app)
        .post('/api/favorites/sync')
        .set('Authorization', `Bearer ${authToken}`)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('must be an array');
    });

    it('should handle sync with duplicate IDs in request', async () => {
      const response = await request(app)
        .post('/api/favorites/sync')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          favorites: [oyster1Id, oyster1Id, oyster2Id], // Duplicate oyster1Id
        });

      expect(response.status).toBe(200);

      // Should only create unique favorites
      const favorites = await prisma.favorite.findMany({
        where: { userId },
      });

      // Should be 2 unique favorites (database constraint prevents duplicates)
      const uniqueIds = new Set(favorites.map((f) => f.oysterId));
      expect(uniqueIds.size).toBe(2);
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .post('/api/favorites/sync')
        .send({
          favorites: [oyster1Id],
        });

      expect(response.status).toBe(401);
      expect(response.body.error).toBeDefined();
    });

    it('should handle large sync operations', async () => {
      // Create many test oysters
      const manyOysters = await Promise.all(
        Array.from({ length: 50 }, async (_, i) => {
          return prisma.oyster.create({
            data: {
              name: `Sync Test Oyster ${i}`,
              species: 'Crassostrea gigas',
              origin: 'Test Origin',
            },
          });
        })
      );

      const manyOysterIds = manyOysters.map((o) => o.id);

      // Sync all 50 favorites
      const response = await request(app)
        .post('/api/favorites/sync')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          favorites: manyOysterIds,
        });

      expect(response.status).toBe(200);
      expect(response.body.added).toBe(50);
      expect(response.body.total).toBe(50);

      // Cleanup
      await prisma.favorite.deleteMany({
        where: { userId },
      });
      await prisma.oyster.deleteMany({
        where: {
          id: { in: manyOysterIds },
        },
      });
    });
  });

  describe('Concurrent Operations', () => {
    beforeEach(async () => {
      await prisma.favorite.deleteMany({
        where: { userId },
      });
    });

    it('should handle concurrent favorite additions', async () => {
      // Try to add same favorite concurrently
      const requests = Array.from({ length: 5 }, () =>
        request(app)
          .post(`/api/favorites/${oyster1Id}`)
          .set('Authorization', `Bearer ${authToken}`)
      );

      const responses = await Promise.all(requests);

      // At least one should succeed with 201, others might be 200 (already exists)
      const successCount = responses.filter((r) => r.status === 201).length;
      const alreadyExistsCount = responses.filter((r) => r.status === 200).length;

      expect(successCount).toBeGreaterThanOrEqual(1);
      expect(successCount + alreadyExistsCount).toBe(5);

      // Verify only one favorite exists
      const favorites = await prisma.favorite.findMany({
        where: {
          userId,
          oysterId: oyster1Id,
        },
      });

      expect(favorites).toHaveLength(1);
    });

    it('should handle concurrent sync operations', async () => {
      // Multiple sync requests with different data
      const syncRequests = [
        request(app)
          .post('/api/favorites/sync')
          .set('Authorization', `Bearer ${authToken}`)
          .send({ favorites: [oyster1Id, oyster2Id] }),
        request(app)
          .post('/api/favorites/sync')
          .set('Authorization', `Bearer ${authToken}`)
          .send({ favorites: [oyster2Id, oyster3Id] }),
      ];

      const responses = await Promise.all(syncRequests);

      // Both should succeed
      responses.forEach((response) => {
        expect(response.status).toBe(200);
      });

      // Final state should match the last successful sync
      const favorites = await prisma.favorite.findMany({
        where: { userId },
      });

      expect(favorites.length).toBeGreaterThanOrEqual(1);
      expect(favorites.length).toBeLessThanOrEqual(3);
    });
  });
});
