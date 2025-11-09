/**
 * Upload Routes Integration Tests
 */

import request from 'supertest';
import express from 'express';
import cors from 'cors';
import uploadRoutes from '../../routes/uploadRoutes';
import prisma from '../../lib/prisma';
import jwt from 'jsonwebtoken';
import path from 'path';

const JWT_SECRET = process.env.JWT_SECRET || 'test-secret';

const app = express();
app.use(cors());
app.use(express.json());
app.use('/api/upload', uploadRoutes);

describe('Upload Routes', () => {
  let userToken: string;
  let userId: string;

  beforeAll(async () => {
    const user = await prisma.user.create({
      data: {
        name: 'Upload Test User',
        email: `upload-test-${Date.now()}@test.com`,
        password: 'hashedpass',
      },
    });

    userId = user.id;
    userToken = jwt.sign({ userId }, JWT_SECRET, { expiresIn: '1h' });
  });

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { id: userId } });
    await prisma.$disconnect();
  });

  describe('POST /api/upload/image', () => {
    it('should require authentication', async () => {
      const res = await request(app)
        .post('/api/upload/image')
        .attach('image', Buffer.from('fake-image-data'), 'test.jpg');

      expect(res.status).toBe(401);
    });

    it('should reject request without file', async () => {
      const res = await request(app)
        .post('/api/upload/image')
        .set('Authorization', `Bearer ${userToken}`);

      // Either file missing error (400) or Cloudinary not configured (503)
      expect([400, 503]).toContain(res.status);
      if (res.status === 400) {
        expect(res.body.error).toContain('No image file uploaded');
      }
    });

    it('should reject invalid file type', async () => {
      const res = await request(app)
        .post('/api/upload/image')
        .set('Authorization', `Bearer ${userToken}`)
        .attach('image', Buffer.from('fake-data'), 'test.txt');

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('Invalid file type');
    });

    it('should accept valid image file (if Cloudinary configured)', async () => {
      // Create a small valid JPEG buffer (1x1 red pixel)
      const jpegBuffer = Buffer.from([
        0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46,
        0x49, 0x46, 0x00, 0x01, 0x01, 0x01, 0x00, 0x48,
        0x00, 0x48, 0x00, 0x00, 0xff, 0xdb, 0x00, 0x43,
        0x00, 0xff, 0xc0, 0x00, 0x0b, 0x08, 0x00, 0x01,
        0x00, 0x01, 0x01, 0x01, 0x11, 0x00, 0xff, 0xc4,
        0x00, 0x14, 0x00, 0x01, 0x00, 0x00, 0x00, 0x00,
        0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
        0x00, 0x00, 0x00, 0x00, 0xff, 0xda, 0x00, 0x08,
        0x01, 0x01, 0x00, 0x00, 0x3f, 0x00, 0x7f, 0xff,
        0xd9,
      ]);

      const res = await request(app)
        .post('/api/upload/image?folder=reviews')
        .set('Authorization', `Bearer ${userToken}`)
        .attach('image', jpegBuffer, 'test.jpg');

      // If Cloudinary is configured, expect 200
      // If not configured, expect 503
      if (res.status === 200) {
        expect(res.body.success).toBe(true);
        expect(res.body.data.url).toBeDefined();
        expect(res.body.data.publicId).toBeDefined();
      } else {
        expect(res.status).toBe(503);
        expect(res.body.error).toContain('not configured');
      }
    });

    it('should reject file with wrong field name', async () => {
      const res = await request(app)
        .post('/api/upload/image')
        .set('Authorization', `Bearer ${userToken}`)
        .attach('wrongfield', Buffer.from('fake-data'), 'test.jpg');

      expect(res.status).toBe(400);
    });

    it('should handle folder parameter', async () => {
      const jpegBuffer = Buffer.from([
        0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46,
        0x49, 0x46, 0x00, 0x01, 0x01, 0x01, 0x00, 0x48,
        0x00, 0x48, 0x00, 0x00, 0xff, 0xdb, 0x00, 0x43,
        0x00, 0xff, 0xc0, 0x00, 0x0b, 0x08, 0x00, 0x01,
        0x00, 0x01, 0x01, 0x01, 0x11, 0x00, 0xff, 0xc4,
        0x00, 0x14, 0x00, 0x01, 0x00, 0x00, 0x00, 0x00,
        0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
        0x00, 0x00, 0x00, 0x00, 0xff, 0xda, 0x00, 0x08,
        0x01, 0x01, 0x00, 0x00, 0x3f, 0x00, 0x7f, 0xff,
        0xd9,
      ]);

      const res = await request(app)
        .post('/api/upload/image?folder=profiles')
        .set('Authorization', `Bearer ${userToken}`)
        .attach('image', jpegBuffer, 'test.jpg');

      // Either success or Cloudinary not configured
      expect([200, 503]).toContain(res.status);
    });
  });

  describe('POST /api/upload/images', () => {
    it('should require authentication', async () => {
      const res = await request(app)
        .post('/api/upload/images')
        .attach('images', Buffer.from('fake-data'), 'test1.jpg')
        .attach('images', Buffer.from('fake-data'), 'test2.jpg');

      expect(res.status).toBe(401);
    });

    it('should reject request without files', async () => {
      const res = await request(app)
        .post('/api/upload/images')
        .set('Authorization', `Bearer ${userToken}`);

      // Either files missing error (400) or Cloudinary not configured (503)
      expect([400, 503]).toContain(res.status);
      if (res.status === 400) {
        expect(res.body.error).toContain('No image files uploaded');
      }
    });

    it('should accept multiple valid images (if Cloudinary configured)', async () => {
      const jpegBuffer = Buffer.from([
        0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46,
        0x49, 0x46, 0x00, 0x01, 0x01, 0x01, 0x00, 0x48,
        0x00, 0x48, 0x00, 0x00, 0xff, 0xdb, 0x00, 0x43,
        0x00, 0xff, 0xc0, 0x00, 0x0b, 0x08, 0x00, 0x01,
        0x00, 0x01, 0x01, 0x01, 0x11, 0x00, 0xff, 0xc4,
        0x00, 0x14, 0x00, 0x01, 0x00, 0x00, 0x00, 0x00,
        0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
        0x00, 0x00, 0x00, 0x00, 0xff, 0xda, 0x00, 0x08,
        0x01, 0x01, 0x00, 0x00, 0x3f, 0x00, 0x7f, 0xff,
        0xd9,
      ]);

      const res = await request(app)
        .post('/api/upload/images')
        .set('Authorization', `Bearer ${userToken}`)
        .attach('images', jpegBuffer, 'test1.jpg')
        .attach('images', jpegBuffer, 'test2.jpg');

      // If Cloudinary is configured, expect 200
      // If not configured, expect 503
      if (res.status === 200) {
        expect(res.body.success).toBe(true);
        expect(res.body.data.urls).toBeDefined();
        expect(res.body.data.urls.length).toBe(2);
        expect(res.body.data.publicIds).toBeDefined();
        expect(res.body.data.publicIds.length).toBe(2);
      } else {
        expect(res.status).toBe(503);
        expect(res.body.error).toContain('not configured');
      }
    });
  });
});
