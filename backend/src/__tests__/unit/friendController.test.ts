/**
 * Friend Controller Unit Tests
 */

import { Request, Response } from 'express';
import prisma from '../../lib/prisma';
import {
  sendFriendRequest,
  acceptFriendRequest,
  rejectFriendRequest,
  getFriends,
  getPendingRequests,
  getFriendActivity,
  getPairedRecommendations,
  removeFriend,
} from '../../controllers/friendController';

jest.mock('../../lib/prisma', () => ({
  __esModule: true,
  default: {
    user: {
      findUnique: jest.fn(),
    },
    friendship: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    review: {
      findMany: jest.fn(),
    },
    oyster: {
      findMany: jest.fn(),
    },
  },
}));

const mockRequest = (userId?: string, body = {}, params = {}) =>
  ({
    userId,
    body,
    params,
  } as unknown as Request);

const mockResponse = () => {
  const res = {} as Response;
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

const MOCK_USER_1 = { id: 'user1', name: 'Alice', email: 'alice@test.com' };
const MOCK_USER_2 = { id: 'user2', name: 'Bob', email: 'bob@test.com' };

describe('Friend Controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('sendFriendRequest', () => {
    it('should create friend request', async () => {
      const req = mockRequest('user1', { receiverId: 'user2' });
      const res = mockResponse();

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(MOCK_USER_2);
      (prisma.friendship.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.friendship.create as jest.Mock).mockResolvedValue({
        id: 'f1',
        senderId: 'user1',
        receiverId: 'user2',
        status: 'pending',
        sender: MOCK_USER_1,
        receiver: MOCK_USER_2,
      });

      await sendFriendRequest(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: expect.objectContaining({ status: 'pending' }),
      });
    });

    it('should reject request to self', async () => {
      const req = mockRequest('user1', { receiverId: 'user1' });
      const res = mockResponse();

      await sendFriendRequest(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Cannot send friend request to yourself',
      });
    });

    it('should reject duplicate request', async () => {
      const req = mockRequest('user1', { receiverId: 'user2' });
      const res = mockResponse();

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(MOCK_USER_2);
      (prisma.friendship.findFirst as jest.Mock).mockResolvedValue({ id: 'existing' });

      await sendFriendRequest(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Friend request already exists',
      });
    });
  });

  describe('acceptFriendRequest', () => {
    it('should accept pending request', async () => {
      const req = mockRequest('user2', {}, { friendshipId: 'f1' });
      const res = mockResponse();

      (prisma.friendship.findUnique as jest.Mock).mockResolvedValue({
        id: 'f1',
        senderId: 'user1',
        receiverId: 'user2',
        status: 'pending',
      });
      (prisma.friendship.update as jest.Mock).mockResolvedValue({
        id: 'f1',
        status: 'accepted',
        sender: MOCK_USER_1,
        receiver: MOCK_USER_2,
      });

      await acceptFriendRequest(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: expect.objectContaining({ status: 'accepted' }),
      });
    });

    it('should reject if not receiver', async () => {
      const req = mockRequest('user3', {}, { friendshipId: 'f1' });
      const res = mockResponse();

      (prisma.friendship.findUnique as jest.Mock).mockResolvedValue({
        id: 'f1',
        receiverId: 'user2',
        status: 'pending',
      });

      await acceptFriendRequest(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
    });
  });

  describe('getFriends', () => {
    it('should return friends list', async () => {
      const req = mockRequest('user1');
      const res = mockResponse();

      (prisma.friendship.findMany as jest.Mock).mockResolvedValue([
        {
          id: 'f1',
          senderId: 'user1',
          receiverId: 'user2',
          status: 'accepted',
          sender: MOCK_USER_1,
          receiver: MOCK_USER_2,
          createdAt: new Date(),
        },
      ]);

      await getFriends(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: expect.arrayContaining([
          expect.objectContaining({ name: 'Bob' }),
        ]),
      });
    });
  });

  describe('getPendingRequests', () => {
    it('should return sent and received requests', async () => {
      const req = mockRequest('user1');
      const res = mockResponse();

      (prisma.friendship.findMany as jest.Mock)
        .mockResolvedValueOnce([{ id: 's1', receiver: MOCK_USER_2, createdAt: new Date() }])
        .mockResolvedValueOnce([{ id: 'r1', sender: MOCK_USER_2, createdAt: new Date() }]);

      await getPendingRequests(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: {
          sent: expect.any(Array),
          received: expect.any(Array),
        },
      });
    });
  });

  describe('getFriendActivity', () => {
    it('should return recent reviews from friends', async () => {
      const req = mockRequest('user1');
      const res = mockResponse();

      (prisma.friendship.findMany as jest.Mock).mockResolvedValue([
        { senderId: 'user1', receiverId: 'user2' },
      ]);

      (prisma.review.findMany as jest.Mock).mockResolvedValue([
        {
          id: 'r1',
          userId: 'user2',
          user: MOCK_USER_2,
          oyster: { id: 'o1', name: 'Kumamoto' },
          createdAt: new Date(),
        },
      ]);

      await getFriendActivity(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: expect.any(Array),
      });
    });

    it('should return empty for no friends', async () => {
      const req = mockRequest('user1');
      const res = mockResponse();

      (prisma.friendship.findMany as jest.Mock).mockResolvedValue([]);

      await getFriendActivity(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: [],
      });
    });
  });

  describe('getPairedRecommendations', () => {
    it('should return matched oysters for both users', async () => {
      const req = mockRequest('user1', {}, { friendId: 'user2' });
      const res = mockResponse();

      (prisma.friendship.findFirst as jest.Mock).mockResolvedValue({ id: 'f1' });

      (prisma.user.findUnique as jest.Mock)
        .mockResolvedValueOnce({
          baselineSize: 5,
          baselineBody: 6,
          baselineSweetBrininess: 7,
          baselineFlavorfulness: 8,
          baselineCreaminess: 5,
        })
        .mockResolvedValueOnce({
          baselineSize: 5,
          baselineBody: 6,
          baselineSweetBrininess: 7,
          baselineFlavorfulness: 8,
          baselineCreaminess: 5,
        });

      (prisma.oyster.findMany as jest.Mock).mockResolvedValue([
        {
          id: 'o1',
          name: 'Kumamoto',
          avgSize: 5,
          avgBody: 6,
          avgSweetBrininess: 7,
          avgFlavorfulness: 8,
          avgCreaminess: 5,
        },
      ]);

      await getPairedRecommendations(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: expect.any(Array),
      });
    });

    it('should reject if not friends', async () => {
      const req = mockRequest('user1', {}, { friendId: 'user3' });
      const res = mockResponse();

      (prisma.friendship.findFirst as jest.Mock).mockResolvedValue(null);

      await getPairedRecommendations(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
    });
  });

  describe('removeFriend', () => {
    it('should delete friendship', async () => {
      const req = mockRequest('user1', {}, { friendshipId: 'f1' });
      const res = mockResponse();

      (prisma.friendship.findUnique as jest.Mock).mockResolvedValue({
        id: 'f1',
        senderId: 'user1',
        receiverId: 'user2',
      });
      (prisma.friendship.delete as jest.Mock).mockResolvedValue({ id: 'f1' });

      await removeFriend(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: { message: 'Friend removed' },
      });
    });
  });
});
