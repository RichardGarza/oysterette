import { request, response } from 'supertest';
import { app } from '../../app'; // Assume app with routes
import { prisma } from '../../lib/prisma';

// Mock prisma
jest.mock('../../lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  },
}));

describe('UserController Username Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should update username successfully if unique', async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValueOnce(null); // Unique
    (prisma.user.update as jest.Mock).mockResolvedValueOnce({ id: 'user1', username: 'OysterFan123' });

    const res = await request(app)
      .put('/api/users/username')
      .send({ username: 'OysterFan123' })
      .set('Authorization', 'Bearer mock-token'); // Assume auth sets req.userId

    expect(res.status).toBe(200);
    expect(res.body.data.username).toBe('OysterFan123');
  });

  it('should fail update if username taken (409)', async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValueOnce({ id: 'other', username: 'OysterFan123' }); // Taken

    const res = await request(app)
      .put('/api/users/username')
      .send({ username: 'OysterFan123' })
      .set('Authorization', 'Bearer mock-token');

    expect(res.status).toBe(409);
    expect(res.body.error).toBe('Username already taken');
  });
});

export default {};
