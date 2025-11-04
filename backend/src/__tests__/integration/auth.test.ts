import request from 'supertest';
import express from 'express';
import cors from 'cors';
import authRoutes from '../../routes/authRoutes';
import prisma from '../../lib/prisma';

// Create test app
const app = express();
app.use(cors());
app.use(express.json());
app.use('/api/auth', authRoutes);

describe('Auth API Integration Tests', () => {
  const testUser = {
    email: 'authtest@oysterette.com',
    name: 'Auth Test User',
    password: 'TestPassword123',
  };

  // Cleanup before and after tests
  beforeAll(async () => {
    await prisma.user.deleteMany({ where: { email: testUser.email } });
  });

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { email: testUser.email } });
    await prisma.$disconnect();
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send(testUser)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data).toHaveProperty('token');
      expect(response.body.data.user.email).toBe(testUser.email);
      expect(response.body.data.user.name).toBe(testUser.name);
      expect(response.body.data.user).not.toHaveProperty('password');
    });

    it('should fail to register with existing email', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send(testUser)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('already exists');
    });

    it('should fail without required fields', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({ email: 'incomplete@test.com' })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should fail with invalid email', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'invalid-email',
          name: 'Test',
          password: 'password',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login with correct credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password,
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data).toHaveProperty('token');
      expect(response.body.data.user.email).toBe(testUser.email);
    });

    it('should fail with incorrect password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: 'wrongpassword',
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Invalid credentials');
    });

    it('should fail with non-existent email', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@test.com',
          password: 'password',
        })
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should fail without credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/auth/profile', () => {
    let authToken: string;

    beforeAll(async () => {
      // Login to get token
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password,
        });

      authToken = response.body.data.token;
    });

    it('should get user profile with valid token', async () => {
      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data).toHaveProperty('email', testUser.email);
      expect(response.body.data).toHaveProperty('name', testUser.name);
      expect(response.body.data).not.toHaveProperty('password');
    });

    it('should fail without token', async () => {
      const response = await request(app)
        .get('/api/auth/profile')
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should fail with invalid token', async () => {
      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('Password Security', () => {
    it('should hash passwords and not return them in responses', async () => {
      const tempUser = {
        email: 'passwordtest@oysterette.com',
        name: 'Password Test',
        password: 'SecurePassword123',
      };

      // Register
      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send(tempUser);

      expect(registerResponse.body.data.user).not.toHaveProperty('password');

      // Login
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: tempUser.email,
          password: tempUser.password,
        });

      expect(loginResponse.body.data.user).not.toHaveProperty('password');

      // Verify password is hashed in database
      const dbUser = await prisma.user.findUnique({
        where: { email: tempUser.email },
      });

      expect(dbUser?.password).not.toBe(tempUser.password);
      expect(dbUser?.password.length).toBeGreaterThan(20); // Hashed passwords are long

      // Cleanup
      await prisma.user.delete({ where: { email: tempUser.email } });
    });
  });

  describe('Token Generation and Validation', () => {
    it('should generate different tokens for different sessions', async () => {
      const login1 = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password,
        });

      const login2 = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password,
        });

      const token1 = login1.body.data.token;
      const token2 = login2.body.data.token;

      expect(token1).not.toBe(token2);

      // Both tokens should be valid
      await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${token1}`)
        .expect(200);

      await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${token2}`)
        .expect(200);
    });
  });
});
