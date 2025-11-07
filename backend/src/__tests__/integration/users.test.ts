import request from 'supertest';
import express from 'express';
import cors from 'cors';
import authRoutes from '../../routes/authRoutes';
import userRoutes from '../../routes/userRoutes';
import recommendationRoutes from '../../routes/recommendationRoutes';
import reviewRoutes from '../../routes/reviewRoutes';
import prisma from '../../lib/prisma';

// Create test app
const app = express();
app.use(cors());
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/recommendations', recommendationRoutes);
app.use('/api/reviews', reviewRoutes);

describe('User Flavor Profile & Recommendations Integration Tests', () => {
  let authToken: string;
  let userId: string;
  let oysterId1: string;
  let oysterId2: string;
  let oysterId3: string;

  const testUser = {
    email: 'flavortest@oysterette.com',
    name: 'Flavor Test User',
    password: 'TestPassword123',
  };

  // Setup
  beforeAll(async () => {
    // Cleanup existing data
    await prisma.user.deleteMany({ where: { email: testUser.email } });
    await prisma.oyster.deleteMany({
      where: {
        name: { in: ['Flavor Test Oyster 1', 'Flavor Test Oyster 2', 'Flavor Test Oyster 3'] },
      },
    });

    // Register test user
    const registerResponse = await request(app)
      .post('/api/auth/register')
      .send(testUser);

    authToken = registerResponse.body.data.token;
    userId = registerResponse.body.data.user.id;

    // Create test oysters with different flavor profiles
    const oyster1 = await prisma.oyster.create({
      data: {
        name: 'Flavor Test Oyster 1',
        species: 'Crassostrea gigas',
        origin: 'Test Origin 1',
        size: 8,
        body: 7,
        sweetBrininess: 6,
        flavorfulness: 9,
        creaminess: 7,
        avgSize: 8,
        avgBody: 7,
        avgSweetBrininess: 6,
        avgFlavorfulness: 9,
        avgCreaminess: 7,
        avgRating: 8.0,
        overallScore: 8.0,
        totalReviews: 1,
      },
    });
    oysterId1 = oyster1.id;

    const oyster2 = await prisma.oyster.create({
      data: {
        name: 'Flavor Test Oyster 2',
        species: 'Crassostrea virginica',
        origin: 'Test Origin 2',
        size: 5,
        body: 5,
        sweetBrininess: 8,
        flavorfulness: 6,
        creaminess: 9,
        avgSize: 5,
        avgBody: 5,
        avgSweetBrininess: 8,
        avgFlavorfulness: 6,
        avgCreaminess: 9,
        avgRating: 7.5,
        overallScore: 7.5,
        totalReviews: 1,
      },
    });
    oysterId2 = oyster2.id;

    const oyster3 = await prisma.oyster.create({
      data: {
        name: 'Flavor Test Oyster 3',
        species: 'Ostrea edulis',
        origin: 'Test Origin 3',
        size: 9,
        body: 8,
        sweetBrininess: 5,
        flavorfulness: 8,
        creaminess: 6,
        avgSize: 9,
        avgBody: 8,
        avgSweetBrininess: 5,
        avgFlavorfulness: 8,
        avgCreaminess: 6,
        avgRating: 7.0,
        overallScore: 7.0,
        totalReviews: 1,
      },
    });
    oysterId3 = oyster3.id;
  });

  afterAll(async () => {
    // Cleanup
    await prisma.review.deleteMany({ where: { userId } });
    await prisma.oyster.deleteMany({
      where: {
        id: { in: [oysterId1, oysterId2, oysterId3] },
      },
    });
    await prisma.user.deleteMany({ where: { email: testUser.email } });
    await prisma.$disconnect();
  });

  describe('PUT /api/users/flavor-profile', () => {
    it('should set flavor profile successfully', async () => {
      const response = await request(app)
        .put('/api/users/flavor-profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          size: 8,
          body: 7,
          sweetBrininess: 6,
          flavorfulness: 9,
          creaminess: 7,
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.message).toContain('successfully');

      // Verify profile was saved
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      expect(user?.baselineSize).toBe(8);
      expect(user?.baselineBody).toBe(7);
      expect(user?.baselineSweetBrininess).toBe(6);
      expect(user?.baselineFlavorfulness).toBe(9);
      expect(user?.baselineCreaminess).toBe(7);
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .put('/api/users/flavor-profile')
        .send({
          size: 8,
          body: 7,
          sweetBrininess: 6,
          flavorfulness: 9,
          creaminess: 7,
        })
        .expect(401);

      expect(response.body.error).toBeDefined();
    });

    it('should fail with missing attributes', async () => {
      const response = await request(app)
        .put('/api/users/flavor-profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          size: 8,
          body: 7,
          // Missing sweetBrininess, flavorfulness, creaminess
        })
        .expect(400);

      expect(response.body.error).toContain('required');
    });

    it('should fail with out-of-range attributes', async () => {
      const response = await request(app)
        .put('/api/users/flavor-profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          size: 11, // Out of range
          body: 7,
          sweetBrininess: 6,
          flavorfulness: 9,
          creaminess: 7,
        })
        .expect(400);

      expect(response.body.error).toContain('between 1 and 10');
    });

    it('should fail with negative attributes', async () => {
      const response = await request(app)
        .put('/api/users/flavor-profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          size: -1, // Negative
          body: 7,
          sweetBrininess: 6,
          flavorfulness: 9,
          creaminess: 7,
        })
        .expect(400);

      expect(response.body.error).toContain('between 1 and 10');
    });

    it('should fail with non-numeric attributes', async () => {
      const response = await request(app)
        .put('/api/users/flavor-profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          size: 'large', // Non-numeric
          body: 7,
          sweetBrininess: 6,
          flavorfulness: 9,
          creaminess: 7,
        })
        .expect(400);

      expect(response.body.error).toBeDefined();
    });
  });

  describe('GET /api/recommendations', () => {
    beforeEach(async () => {
      // Set flavor profile for recommendations
      await request(app)
        .put('/api/users/flavor-profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          size: 8,
          body: 7,
          sweetBrininess: 6,
          flavorfulness: 9,
          creaminess: 7,
        });
    });

    it('should get personalized recommendations', async () => {
      const response = await request(app)
        .get('/api/recommendations')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);

      // Verify recommendation structure
      const firstRec = response.body.data[0];
      expect(firstRec).toHaveProperty('id'); // Oyster fields spread directly
      expect(firstRec).toHaveProperty('name');
      expect(firstRec).toHaveProperty('similarity');
      expect(firstRec.similarity).toBeGreaterThanOrEqual(0);
      expect(firstRec.similarity).toBeLessThanOrEqual(100);
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .get('/api/recommendations')
        .expect(401);

      expect(response.body.error).toBeDefined();
    });

    it('should return recommendations sorted by match score', async () => {
      const response = await request(app)
        .get('/api/recommendations')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const recommendations = response.body.data;

      // Verify descending order by similarity
      for (let i = 0; i < recommendations.length - 1; i++) {
        expect(recommendations[i].similarity).toBeGreaterThanOrEqual(
          recommendations[i + 1].similarity
        );
      }
    });

    it('should respect limit parameter', async () => {
      const response = await request(app)
        .get('/api/recommendations?limit=2')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data.length).toBeLessThanOrEqual(2);
    });

    it('should exclude already reviewed oysters', async () => {
      // Create a review for oyster1
      await request(app)
        .post('/api/reviews')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          oysterId: oysterId1,
          rating: 'LOVE_IT',
          size: 8,
          body: 7,
          sweetBrininess: 6,
          flavorfulness: 9,
          creaminess: 7,
        });

      const response = await request(app)
        .get('/api/recommendations')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const oysterIds = response.body.data.map(
        (rec: any) => rec.id  // Oyster fields spread directly, so just 'id'
      );

      // Verify oyster1 is not in recommendations
      expect(oysterIds).not.toContain(oysterId1);
    });
  });

  describe('Baseline Profile Automatic Updates', () => {
    beforeEach(async () => {
      // Clear any existing reviews
      await prisma.review.deleteMany({ where: { userId } });
    });

    it('should update baseline profile after 5 reviews', async () => {
      // Set initial baseline
      await request(app)
        .put('/api/users/flavor-profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          size: 5,
          body: 5,
          sweetBrininess: 5,
          flavorfulness: 5,
          creaminess: 5,
        });

      // Create 5 reviews with different attributes
      const reviews = [
        { oysterId: oysterId1, size: 8, body: 7, sweetBrininess: 6, flavorfulness: 9, creaminess: 7 },
        { oysterId: oysterId2, size: 7, body: 8, sweetBrininess: 7, flavorfulness: 8, creaminess: 8 },
        { oysterId: oysterId3, size: 9, body: 9, sweetBrininess: 8, flavorfulness: 9, creaminess: 9 },
      ];

      for (const review of reviews) {
        await request(app)
          .post('/api/reviews')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            oysterId: review.oysterId,
            rating: 'LOVE_IT',
            size: review.size,
            body: review.body,
            sweetBrininess: review.sweetBrininess,
            flavorfulness: review.flavorfulness,
            creaminess: review.creaminess,
          });
      }

      // Check if baseline was updated
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      // Baseline should have shifted towards the reviewed attributes
      expect(user?.baselineSize).not.toBe(5);
      expect(user?.baselineBody).not.toBe(5);
      expect(user?.baselineSweetBrininess).not.toBe(5);
      expect(user?.baselineFlavorfulness).not.toBe(5);
      expect(user?.baselineCreaminess).not.toBe(5);
    });

    it('should update baseline even without manual setting (from reviews)', async () => {
      // Create a new user without setting baseline
      const newUser = {
        email: 'nobaseline@oysterette.com',
        name: 'No Baseline User',
        password: 'TestPassword123',
      };

      await prisma.user.deleteMany({ where: { email: newUser.email } });

      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send(newUser);

      const newToken = registerResponse.body.data.token;
      const newUserId = registerResponse.body.data.user.id;

      // Create a LOVE_IT review without setting baseline manually
      await request(app)
        .post('/api/reviews')
        .set('Authorization', `Bearer ${newToken}`)
        .send({
          oysterId: oysterId1,
          rating: 'LOVE_IT',
          size: 8,
          body: 7,
          sweetBrininess: 6,
          flavorfulness: 9,
          creaminess: 7,
        });

      const updatedUser = await prisma.user.findUnique({
        where: { id: newUserId },
      });

      // Baseline should be updated from the positive review
      expect(updatedUser?.baselineSize).toBe(8);
      expect(updatedUser?.baselineBody).toBe(7);
      expect(updatedUser?.baselineSweetBrininess).toBe(6);
      expect(updatedUser?.baselineFlavorfulness).toBe(9);
      expect(updatedUser?.baselineCreaminess).toBe(7);

      // Cleanup
      await prisma.review.deleteMany({ where: { userId: newUserId } });
      await prisma.user.deleteMany({ where: { id: newUserId } });
    });
  });
});
