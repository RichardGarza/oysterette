import request from 'supertest';
import express from 'express';
import cors from 'cors';
import oysterRoutes from '../../routes/oysterRoutes';
import authRoutes from '../../routes/authRoutes';
import prisma from '../../lib/prisma';

// Create test app
const app = express();
app.use(cors());
app.use(express.json());
app.use('/api/oysters', oysterRoutes);
app.use('/api/auth', authRoutes);

describe('Oyster API Integration Tests', () => {
  let authToken: string;
  let testOysterId: string;

  // Setup: Create a test user and get auth token
  beforeAll(async () => {
    // Clean up test data
    await prisma.review.deleteMany({ where: { user: { email: 'test@oysterette.com' } } });
    await prisma.user.deleteMany({ where: { email: 'test@oysterette.com' } });
    await prisma.oyster.deleteMany({ where: { name: 'Test Oyster for GET' } });

    // Register test user
    const response = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'test@oysterette.com',
        name: 'Test User',
        password: 'TestPassword123',
      });

    authToken = response.body.data.token;

    // Create a test oyster for GET tests
    const oyster = await prisma.oyster.create({
      data: {
        name: 'Test Oyster for GET',
        species: 'Crassostrea gigas',
        origin: 'Test Bay',
        size: 5,
        body: 6,
        sweetBrininess: 7,
        flavorfulness: 8,
        creaminess: 5,
      },
    });
    testOysterId = oyster.id;
  });

  // Cleanup after all tests
  afterAll(async () => {
    await prisma.review.deleteMany({ where: { user: { email: 'test@oysterette.com' } } });
    await prisma.user.deleteMany({ where: { email: 'test@oysterette.com' } });
    await prisma.oyster.deleteMany({ where: { id: testOysterId } });
    await prisma.$disconnect();
  });

  describe('GET /api/oysters', () => {
    it('should return all oysters', async () => {
      const response = await request(app)
        .get('/api/oysters')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.count).toBeGreaterThan(0);
    });

    it('should return oysters with correct structure', async () => {
      const response = await request(app)
        .get('/api/oysters')
        .expect(200);

      const oyster = response.body.data[0];
      expect(oyster).toHaveProperty('id');
      expect(oyster).toHaveProperty('name');
      expect(oyster).toHaveProperty('species');
      expect(oyster).toHaveProperty('origin');
      expect(oyster).toHaveProperty('size');
      expect(oyster).toHaveProperty('body');
      expect(oyster).toHaveProperty('sweetBrininess');
      expect(oyster).toHaveProperty('flavorfulness');
      expect(oyster).toHaveProperty('creaminess');
    });
    it('should filter oysters with fuzzy matching (low range)', async () => {
      const response = await request(app)
        .get('/api/oysters?sweetness=low')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);

      // Fuzzy low range: 1-6
      response.body.data.forEach((oyster: any) => {
        const sweetness = oyster.avgSweetBrininess || oyster.sweetBrininess;
        expect(sweetness).toBeGreaterThanOrEqual(1);
        expect(sweetness).toBeLessThanOrEqual(6);
      });
    });

    it('should filter oysters with fuzzy matching (high range)', async () => {
      const response = await request(app)
        .get('/api/oysters?size=high')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);

      // Fuzzy high range: 4-10
      response.body.data.forEach((oyster: any) => {
        const size = oyster.avgSize || oyster.size;
        expect(size).toBeGreaterThanOrEqual(4);
        expect(size).toBeLessThanOrEqual(10);
      });
    });

    it('should allow overlap in fuzzy ranges', async () => {
      // Get oysters with sweetness=low (1-6)
      const lowResponse = await request(app)
        .get('/api/oysters?sweetness=low')
        .expect(200);

      // Get oysters with sweetness=high (4-10)
      const highResponse = await request(app)
        .get('/api/oysters?sweetness=high')
        .expect(200);

      // Check that some oysters appear in both (overlap at 4-6)
      const lowIds = new Set(lowResponse.body.data.map((o: any) => o.id));
      const highIds = new Set(highResponse.body.data.map((o: any) => o.id));

      const overlap = [...lowIds].filter(id => highIds.has(id));

      // Should have overlap due to fuzzy ±2 range
      expect(overlap.length).toBeGreaterThan(0);
    });
  });

  describe('GET /api/oysters/:id', () => {
    it('should return a single oyster by ID', async () => {
      const response = await request(app)
        .get(`/api/oysters/${testOysterId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id', testOysterId);
    });

    it('should return 404 for non-existent oyster', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      const response = await request(app)
        .get(`/api/oysters/${fakeId}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/oysters/search', () => {
    it('should search oysters by name', async () => {
      const response = await request(app)
        .get('/api/oysters/search?query=Kusshi')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
    });

    it('should return 400 without query parameter', async () => {
      const response = await request(app)
        .get('/api/oysters/search')
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/oysters', () => {
    it('should create a new oyster with authentication', async () => {
      const newOyster = {
        name: 'Test Oyster ' + Date.now(),
        species: 'Crassostrea gigas',
        origin: 'Test Bay',
        standoutNotes: 'Test notes',
        size: 5,
        body: 6,
        sweetBrininess: 7,
        flavorfulness: 8,
        creaminess: 5,
      };

      const response = await request(app)
        .post('/api/oysters')
        .set('Authorization', `Bearer ${authToken}`)
        .send(newOyster)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.name).toBe(newOyster.name);

      // Cleanup
      await prisma.oyster.delete({ where: { id: response.body.data.id } });
    });

    it('should fail without authentication', async () => {
      const newOyster = {
        name: 'Test Oyster Unauth',
        species: 'Crassostrea gigas',
        origin: 'Test Bay',
      };

      await request(app)
        .post('/api/oysters')
        .send(newOyster)
        .expect(401);
    });

    it('should fail with missing required fields', async () => {
      const invalidOyster = {
        name: 'Test Oyster',
        // missing species and origin
      };

      const response = await request(app)
        .post('/api/oysters')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidOyster)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/oysters/:id', () => {
    let tempOysterId: string;

    beforeAll(async () => {
      // Create a temporary oyster for update tests
      const oyster = await prisma.oyster.create({
        data: {
          name: 'Update Test Oyster ' + Date.now(),
          species: 'Test Species',
          origin: 'Test Origin',
        },
      });
      tempOysterId = oyster.id;
    });

    afterAll(async () => {
      // Clean up
      await prisma.oyster.deleteMany({ where: { id: tempOysterId } });
    });

    it('should update an oyster with authentication', async () => {
      const updates = {
        standoutNotes: 'Updated notes',
        size: 8,
      };

      const response = await request(app)
        .put(`/api/oysters/${tempOysterId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updates)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.standoutNotes).toBe(updates.standoutNotes);
      expect(response.body.data.size).toBe(updates.size);
    });

    it('should fail without authentication', async () => {
      await request(app)
        .put(`/api/oysters/${tempOysterId}`)
        .send({ size: 7 })
        .expect(401);
    });
  });

  describe('DELETE /api/oysters/:id', () => {
    it('should delete an oyster with authentication', async () => {
      // Create a temp oyster to delete
      const oyster = await prisma.oyster.create({
        data: {
          name: 'Delete Test Oyster ' + Date.now(),
          species: 'Test Species',
          origin: 'Test Origin',
        },
      });

      await request(app)
        .delete(`/api/oysters/${oyster.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Verify it's deleted
      const deleted = await prisma.oyster.findUnique({ where: { id: oyster.id } });
      expect(deleted).toBeNull();
    });

    it('should fail without authentication', async () => {
      await request(app)
        .delete(`/api/oysters/${testOysterId}`)
        .expect(401);
    });
  });
});
