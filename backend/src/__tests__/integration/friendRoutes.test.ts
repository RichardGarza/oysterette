/**
 * Friend Routes Integration Tests
 */

import request from 'supertest';
import express from 'express';
import cors from 'cors';
import friendRoutes from '../../routes/friendRoutes';
import prisma from '../../lib/prisma';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'test-secret';

const app = express();
app.use(cors());
app.use(express.json());
app.use('/api/friends', friendRoutes);

const createToken = (userId: string) => jwt.sign({ userId }, JWT_SECRET, { expiresIn: '1h' });

describe('Friend Routes', () => {
  let user1Token: string;
  let user2Token: string;
  let user1Id: string;
  let user2Id: string;

  beforeAll(async () => {
    const user1 = await prisma.user.create({
      data: {
        name: 'Alice',
        email: `alice-${Date.now()}@test.com`,
        password: 'hashedpass',
        baselineSize: 5,
        baselineBody: 6,
        baselineSweetBrininess: 7,
        baselineFlavorfulness: 8,
        baselineCreaminess: 5,
      },
    });

    const user2 = await prisma.user.create({
      data: {
        name: 'Bob',
        email: `bob-${Date.now()}@test.com`,
        password: 'hashedpass',
        baselineSize: 5,
        baselineBody: 6,
        baselineSweetBrininess: 7,
        baselineFlavorfulness: 8,
        baselineCreaminess: 5,
      },
    });

    user1Id = user1.id;
    user2Id = user2.id;
    user1Token = createToken(user1Id);
    user2Token = createToken(user2Id);
  });

  afterAll(async () => {
    await prisma.friendship.deleteMany({
      where: { OR: [{ senderId: user1Id }, { receiverId: user1Id }] },
    });
    await prisma.user.deleteMany({
      where: { id: { in: [user1Id, user2Id] } },
    });
    await prisma.$disconnect();
  });

  describe('POST /api/friends/request', () => {
    it('should send friend request', async () => {
      const res = await request(app)
        .post('/api/friends/request')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({ receiverId: user2Id });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('pending');
    });

    it('should reject duplicate request', async () => {
      const res = await request(app)
        .post('/api/friends/request')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({ receiverId: user2Id });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('already exists');
    });

    it('should reject request to self', async () => {
      const res = await request(app)
        .post('/api/friends/request')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({ receiverId: user1Id });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('yourself');
    });

    it('should reject unauthenticated request', async () => {
      const res = await request(app)
        .post('/api/friends/request')
        .send({ receiverId: user2Id });

      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/friends/pending', () => {
    it('should return pending requests', async () => {
      const res = await request(app)
        .get('/api/friends/pending')
        .set('Authorization', `Bearer ${user2Token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.received).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ user: expect.objectContaining({ id: user1Id }) }),
        ])
      );
    });
  });

  describe('PUT /api/friends/accept/:friendshipId', () => {
    it('should accept friend request', async () => {
      const friendship = await prisma.friendship.findFirst({
        where: { senderId: user1Id, receiverId: user2Id },
      });

      const res = await request(app)
        .put(`/api/friends/accept/${friendship!.id}`)
        .set('Authorization', `Bearer ${user2Token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('accepted');
    });
  });

  describe('GET /api/friends', () => {
    it('should return friends list', async () => {
      const res = await request(app)
        .get('/api/friends')
        .set('Authorization', `Bearer ${user1Token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ id: user2Id, name: 'Bob' }),
        ])
      );
    });
  });

  describe('GET /api/friends/activity', () => {
    it('should return friend activity', async () => {
      const res = await request(app)
        .get('/api/friends/activity')
        .set('Authorization', `Bearer ${user1Token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  describe('GET /api/friends/paired/:friendId', () => {
    it('should return paired recommendations', async () => {
      const res = await request(app)
        .get(`/api/friends/paired/${user2Id}`)
        .set('Authorization', `Bearer ${user1Token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('should reject if not friends', async () => {
      const user3 = await prisma.user.create({
        data: {
          name: 'Charlie',
          email: `charlie-${Date.now()}@test.com`,
          password: 'hashedpass',
        },
      });

      const res = await request(app)
        .get(`/api/friends/paired/${user3.id}`)
        .set('Authorization', `Bearer ${user1Token}`);

      expect(res.status).toBe(403);

      await prisma.user.delete({ where: { id: user3.id } });
    });
  });

  describe('DELETE /api/friends/:friendshipId', () => {
    it('should remove friend', async () => {
      const friendship = await prisma.friendship.findFirst({
        where: { senderId: user1Id, receiverId: user2Id },
      });

      const res = await request(app)
        .delete(`/api/friends/${friendship!.id}`)
        .set('Authorization', `Bearer ${user1Token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('PUT /api/friends/reject/:friendshipId', () => {
    it('should reject friend request', async () => {
      await request(app)
        .post('/api/friends/request')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({ receiverId: user2Id });

      const friendship = await prisma.friendship.findFirst({
        where: { senderId: user1Id, receiverId: user2Id },
      });

      const res = await request(app)
        .put(`/api/friends/reject/${friendship!.id}`)
        .set('Authorization', `Bearer ${user2Token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });
});
