import request from 'supertest';
import express from 'express';
import cors from 'cors';
import authRoutes from '../../routes/authRoutes';
import prisma from '../../lib/prisma';
import { hashPassword } from '../../utils/auth';
import { OAuth2Client } from 'google-auth-library';
import appleSignin from 'apple-signin-auth';

// Mock Google OAuth2Client
jest.mock('google-auth-library');
const mockVerifyIdToken = jest.fn();
(OAuth2Client as jest.MockedClass<typeof OAuth2Client>).mockImplementation(() => ({
  verifyIdToken: mockVerifyIdToken,
} as unknown as OAuth2Client));

// Mock Apple Sign-In
jest.mock('apple-signin-auth');
const mockVerifyAppleToken = appleSignin.verifyIdToken as jest.MockedFunction<typeof appleSignin.verifyIdToken>;

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

  // ==================== GOOGLE OAUTH TESTS ====================

  describe('POST /api/auth/google', () => {
    const mockGooglePayload = {
      sub: 'google_test_12345',
      email: 'googletest@oysterette.com',
      name: 'Google Test User',
      picture: 'https://example.com/photo.jpg',
      email_verified: true,
    };

    beforeEach(() => {
      // Reset mock before each test
      mockVerifyIdToken.mockReset();
    });

    afterAll(async () => {
      // Cleanup test users
      await prisma.user.deleteMany({
        where: {
          email: { in: ['googletest@oysterette.com', 'existing@oysterette.com', 'testuser@oysterette.com'] },
        },
      });
    });

    it('should create new user with valid Google token', async () => {
      // Mock successful token verification
      mockVerifyIdToken.mockResolvedValueOnce({
        getPayload: () => mockGooglePayload,
      });

      const response = await request(app)
        .post('/api/auth/google')
        .send({ idToken: 'valid_google_token' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data).toHaveProperty('token');
      expect(response.body.data.user.email).toBe(mockGooglePayload.email);
      expect(response.body.data.user.name).toBe(mockGooglePayload.name);
      expect(response.body.data.user.googleId).toBe(mockGooglePayload.sub);
      expect(response.body.data.user.preferences?.profilePhoto).toBe(mockGooglePayload.picture);
      expect(response.body.data.user).not.toHaveProperty('password');

      // Verify JWT token is valid
      const profileResponse = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${response.body.data.token}`)
        .expect(200);

      expect(profileResponse.body.data.email).toBe(mockGooglePayload.email);
    });

    it('should login existing user with valid Google token', async () => {
      // Create user first
      mockVerifyIdToken.mockResolvedValueOnce({
        getPayload: () => mockGooglePayload,
      });

      const firstLogin = await request(app)
        .post('/api/auth/google')
        .send({ idToken: 'valid_google_token' });

      const userId = firstLogin.body.data.user.id;

      // Login again with same Google account
      mockVerifyIdToken.mockResolvedValueOnce({
        getPayload: () => mockGooglePayload,
      });

      const secondLogin = await request(app)
        .post('/api/auth/google')
        .send({ idToken: 'valid_google_token_2' })
        .expect(200);

      expect(secondLogin.body.data.user.id).toBe(userId);
      expect(secondLogin.body.data.user.email).toBe(mockGooglePayload.email);
      expect(secondLogin.body.data.token).not.toBe(firstLogin.body.data.token);
    });

    it('should link Google account to existing email/password user', async () => {
      // Clean up any existing users first
      await prisma.user.deleteMany({ where: { email: 'existing@oysterette.com' } });

      // Create user with email/password first
      const existingUser = await prisma.user.create({
        data: {
          email: 'existing@oysterette.com',
          name: 'Existing User',
          password: await hashPassword('Password123'),
        },
      });

      // Sign in with Google using same email
      const googlePayload = {
        sub: 'google_link_123',  // Different googleId
        email: 'existing@oysterette.com',
        name: 'Existing User',
        email_verified: true,
      };

      mockVerifyIdToken.mockResolvedValueOnce({
        getPayload: () => googlePayload,
      });

      const response = await request(app)
        .post('/api/auth/google')
        .send({ idToken: 'valid_google_token' })
        .expect(200);

      expect(response.body.data.user.id).toBe(existingUser.id);
      expect(response.body.data.user.googleId).toBe('google_link_123');
      expect(response.body.data.user.email).toBe('existing@oysterette.com');

      // Verify user can still login with password
      const passwordLogin = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'existing@oysterette.com',
          password: 'Password123',
        })
        .expect(200);

      expect(passwordLogin.body.data.user.id).toBe(existingUser.id);
    });

    it('should fail with invalid Google token', async () => {
      // Mock token verification failure
      mockVerifyIdToken.mockRejectedValueOnce(new Error('Invalid token'));

      const response = await request(app)
        .post('/api/auth/google')
        .send({ idToken: 'invalid_token' })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Invalid Google token');
    });

    it('should fail with missing token', async () => {
      const response = await request(app)
        .post('/api/auth/google')
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeTruthy();
    });

    it('should fail with invalid token payload (missing email)', async () => {
      // Mock token with no email
      mockVerifyIdToken.mockResolvedValueOnce({
        getPayload: () => ({ sub: 'test123' }), // Missing email
      });

      const response = await request(app)
        .post('/api/auth/google')
        .send({ idToken: 'token_no_email' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Invalid token payload');
    });

    it('should use email prefix as name if name not provided', async () => {
      const payloadNoName = {
        sub: 'google_no_name_123',
        email: 'testuser@oysterette.com',
        email_verified: true,
      };

      mockVerifyIdToken.mockResolvedValueOnce({
        getPayload: () => payloadNoName,
      });

      const response = await request(app)
        .post('/api/auth/google')
        .send({ idToken: 'valid_token' })
        .expect(200);

      expect(response.body.data.user.name).toBe('testuser');
    });
  });

  // ==================== APPLE OAUTH TESTS ====================

  describe('POST /api/auth/apple', () => {
    const mockApplePayload = {
      sub: 'apple_test_12345',
      email: 'appletest@oysterette.com',
      email_verified: true,
    };

    const mockAppleUser = {
      fullName: {
        givenName: 'Apple',
        familyName: 'User',
      },
    };

    beforeEach(() => {
      // Reset mock before each test
      mockVerifyAppleToken.mockReset();
    });

    afterAll(async () => {
      // Cleanup test users
      await prisma.user.deleteMany({
        where: {
          email: { in: ['appletest@oysterette.com', 'appleexisting@oysterette.com', 'nouser@oysterette.com'] },
        },
      });
    });

    it('should create new user with valid Apple token and user data', async () => {
      // Mock successful token verification
      mockVerifyAppleToken.mockResolvedValueOnce(mockApplePayload);

      const response = await request(app)
        .post('/api/auth/apple')
        .send({
          idToken: 'valid_apple_token',
          user: mockAppleUser,
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data).toHaveProperty('token');
      expect(response.body.data.user.email).toBe(mockApplePayload.email);
      expect(response.body.data.user.name).toBe('Apple User');
      expect(response.body.data.user.appleId).toBe(mockApplePayload.sub);
      expect(response.body.data.user).not.toHaveProperty('password');

      // Verify JWT token is valid
      const profileResponse = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${response.body.data.token}`)
        .expect(200);

      expect(profileResponse.body.data.email).toBe(mockApplePayload.email);
    });

    it('should login existing user with valid Apple token', async () => {
      // Create user first
      mockVerifyAppleToken.mockResolvedValueOnce(mockApplePayload);

      const firstLogin = await request(app)
        .post('/api/auth/apple')
        .send({
          idToken: 'valid_apple_token',
          user: mockAppleUser,
        });

      const userId = firstLogin.body.data.user.id;

      // Login again with same Apple account
      mockVerifyAppleToken.mockResolvedValueOnce(mockApplePayload);

      const secondLogin = await request(app)
        .post('/api/auth/apple')
        .send({ idToken: 'valid_apple_token_2' })
        .expect(200);

      expect(secondLogin.body.data.user.id).toBe(userId);
      expect(secondLogin.body.data.user.email).toBe(mockApplePayload.email);
      expect(secondLogin.body.data.token).not.toBe(firstLogin.body.data.token);
    });

    it('should link Apple account to existing email/password user', async () => {
      // Clean up any existing users first
      await prisma.user.deleteMany({ where: { email: 'appleexisting@oysterette.com' } });

      // Create user with email/password first
      const existingUser = await prisma.user.create({
        data: {
          email: 'appleexisting@oysterette.com',
          name: 'Existing User',
          password: await hashPassword('Password123'),
        },
      });

      // Sign in with Apple using same email
      const applePayload = {
        sub: 'apple_link_123',  // Different appleId
        email: 'appleexisting@oysterette.com',
        email_verified: true,
      };

      mockVerifyAppleToken.mockResolvedValueOnce(applePayload);

      const response = await request(app)
        .post('/api/auth/apple')
        .send({ idToken: 'valid_apple_token' })
        .expect(200);

      expect(response.body.data.user.id).toBe(existingUser.id);
      expect(response.body.data.user.appleId).toBe('apple_link_123');
      expect(response.body.data.user.email).toBe('appleexisting@oysterette.com');
    });

    it('should fail with invalid Apple token', async () => {
      // Mock token verification failure
      mockVerifyAppleToken.mockRejectedValueOnce(new Error('Invalid token'));

      const response = await request(app)
        .post('/api/auth/apple')
        .send({ idToken: 'invalid_token' })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Invalid Apple token');
    });

    it('should fail with missing token', async () => {
      const response = await request(app)
        .post('/api/auth/apple')
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeTruthy();
    });

    it('should fail with invalid token payload (missing email)', async () => {
      // Mock token with no email
      mockVerifyAppleToken.mockResolvedValueOnce({
        sub: 'test123',
        // Missing email
      });

      const response = await request(app)
        .post('/api/auth/apple')
        .send({ idToken: 'token_no_email' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Invalid token payload');
    });

    it('should use email prefix as name if user data not provided', async () => {
      const payloadNoUser = {
        sub: 'apple_no_user_123',
        email: 'nouser@oysterette.com',
        email_verified: true,
      };

      mockVerifyAppleToken.mockResolvedValueOnce(payloadNoUser);

      const response = await request(app)
        .post('/api/auth/apple')
        .send({ idToken: 'valid_token' }) // No user data
        .expect(200);

      expect(response.body.data.user.name).toBe('nouser');
    });
  });
});
