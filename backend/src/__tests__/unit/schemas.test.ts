import { ReviewRating } from '@prisma/client';
import {
  registerSchema,
  loginSchema,
  createReviewSchema,
  updateReviewSchema,
  createOysterSchema,
  updateOysterSchema,
  voteSchema,
  paginationSchema,
  reviewIdsQuerySchema,
  uuidParamSchema,
  oysterIdParamSchema,
  reviewIdParamSchema,
  userIdParamSchema,
} from '../../validators/schemas';

/**
 * Validation Schema Tests
 * Comprehensive tests for all Zod schemas to catch validation errors before deployment
 */

describe('Auth Schemas', () => {
  describe('registerSchema', () => {
    it('should accept valid registration data', () => {
      const validData = {
        email: 'test@example.com',
        name: 'Test User',
        password: 'TestPass123',
      };

      const result = registerSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should lowercase email addresses', () => {
      const data = {
        email: 'TEST@EXAMPLE.COM',
        name: 'Test User',
        password: 'TestPass123',
      };

      const result = registerSchema.safeParse(data);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.email).toBe('test@example.com');
      }
    });

    it('should reject invalid email formats', () => {
      const invalidData = {
        email: 'not-an-email',
        name: 'Test User',
        password: 'TestPass123',
      };

      const result = registerSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('email');
      }
    });

    it('should reject names shorter than 2 characters', () => {
      const invalidData = {
        email: 'test@example.com',
        name: 'A',
        password: 'TestPass123',
      };

      const result = registerSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject names longer than 100 characters', () => {
      const invalidData = {
        email: 'test@example.com',
        name: 'A'.repeat(101),
        password: 'TestPass123',
      };

      const result = registerSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject passwords shorter than 8 characters', () => {
      const invalidData = {
        email: 'test@example.com',
        name: 'Test User',
        password: 'Test1',
      };

      const result = registerSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject passwords without uppercase letters', () => {
      const invalidData = {
        email: 'test@example.com',
        name: 'Test User',
        password: 'testpass123',
      };

      const result = registerSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject passwords without lowercase letters', () => {
      const invalidData = {
        email: 'test@example.com',
        name: 'Test User',
        password: 'TESTPASS123',
      };

      const result = registerSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject passwords without numbers', () => {
      const invalidData = {
        email: 'test@example.com',
        name: 'Test User',
        password: 'TestPassword',
      };

      const result = registerSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject missing required fields', () => {
      const invalidData = {
        email: 'test@example.com',
      };

      const result = registerSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('loginSchema', () => {
    it('should accept valid login data', () => {
      const validData = {
        email: 'test@example.com',
        password: 'anypassword',
      };

      const result = loginSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should lowercase email addresses', () => {
      const data = {
        email: 'TEST@EXAMPLE.COM',
        password: 'anypassword',
      };

      const result = loginSchema.safeParse(data);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.email).toBe('test@example.com');
      }
    });

    it('should reject invalid email formats', () => {
      const invalidData = {
        email: 'not-an-email',
        password: 'anypassword',
      };

      const result = loginSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject empty passwords', () => {
      const invalidData = {
        email: 'test@example.com',
        password: '',
      };

      const result = loginSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });
});

describe('Review Schemas', () => {
  describe('createReviewSchema', () => {
    it('should accept valid review data', () => {
      const validData = {
        oysterId: '123e4567-e89b-12d3-a456-426614174000',
        rating: ReviewRating.LIKE_IT,
        notes: 'Great oyster!',
        size: 5,
        body: 6,
        sweetBrininess: 7,
        flavorfulness: 8,
        creaminess: 9,
      };

      const result = createReviewSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should accept valid review without optional notes', () => {
      const validData = {
        oysterId: '123e4567-e89b-12d3-a456-426614174000',
        rating: ReviewRating.LOVE_IT,
        size: 5,
        body: 6,
        sweetBrininess: 7,
        flavorfulness: 8,
        creaminess: 9,
      };

      const result = createReviewSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject invalid oyster UUID', () => {
      const invalidData = {
        oysterId: 'not-a-uuid',
        rating: ReviewRating.LIKE,
        size: 5,
        body: 6,
        sweetBrininess: 7,
        flavorfulness: 8,
        creaminess: 9,
      };

      const result = createReviewSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject invalid rating enum', () => {
      const invalidData = {
        oysterId: '123e4567-e89b-12d3-a456-426614174000',
        rating: 'INVALID_RATING',
        size: 5,
        body: 6,
        sweetBrininess: 7,
        flavorfulness: 8,
        creaminess: 9,
      };

      const result = createReviewSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject notes longer than 1000 characters', () => {
      const invalidData = {
        oysterId: '123e4567-e89b-12d3-a456-426614174000',
        rating: ReviewRating.LIKE,
        notes: 'A'.repeat(1001),
        size: 5,
        body: 6,
        sweetBrininess: 7,
        flavorfulness: 8,
        creaminess: 9,
      };

      const result = createReviewSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject size below 1', () => {
      const invalidData = {
        oysterId: '123e4567-e89b-12d3-a456-426614174000',
        rating: ReviewRating.LIKE_IT,
        size: 0,
        body: 6,
        sweetBrininess: 7,
        flavorfulness: 8,
        creaminess: 9,
      };

      const result = createReviewSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject size above 10', () => {
      const invalidData = {
        oysterId: '123e4567-e89b-12d3-a456-426614174000',
        rating: ReviewRating.LIKE_IT,
        size: 11,
        body: 6,
        sweetBrininess: 7,
        flavorfulness: 8,
        creaminess: 9,
      };

      const result = createReviewSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should accept decimal attribute values', () => {
      const validData = {
        oysterId: '123e4567-e89b-12d3-a456-426614174000',
        rating: ReviewRating.LIKE_IT,
        size: 5.5,
        body: 6.7,
        sweetBrininess: 7.2,
        flavorfulness: 8.9,
        creaminess: 9.1,
      };

      const result = createReviewSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should accept all valid ReviewRating enums', () => {
      const ratings = [ReviewRating.LOVE_IT, ReviewRating.LIKE_IT, ReviewRating.OKAY, ReviewRating.MEH];

      ratings.forEach((rating) => {
        const data = {
          oysterId: '123e4567-e89b-12d3-a456-426614174000',
          rating,
          size: 5,
          body: 6,
          sweetBrininess: 7,
          flavorfulness: 8,
          creaminess: 9,
        };

        const result = createReviewSchema.safeParse(data);
        expect(result.success).toBe(true);
      });
    });
  });

  describe('updateReviewSchema', () => {
    it('should accept partial updates', () => {
      const validData = {
        rating: ReviewRating.LOVE_IT,
      };

      const result = updateReviewSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should accept multiple optional fields', () => {
      const validData = {
        rating: ReviewRating.LIKE_IT,
        notes: 'Updated notes',
        size: 8,
      };

      const result = updateReviewSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should accept empty update object', () => {
      const validData = {};

      const result = updateReviewSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject invalid attribute values', () => {
      const invalidData = {
        size: 11,
      };

      const result = updateReviewSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });
});

describe('Oyster Schemas', () => {
  describe('createOysterSchema', () => {
    it('should accept valid oyster data', () => {
      const validData = {
        name: 'Kumamoto',
        species: 'Crassostrea sikamea',
        origin: 'California',
        standoutNotes: 'Sweet and creamy',
        size: 5.5,
        body: 6.0,
        sweetBrininess: 7.5,
        flavorfulness: 8.0,
        creaminess: 9.0,
      };

      const result = createOysterSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should require name and all attributes', () => {
      const validData = {
        name: 'Kumamoto',
        species: 'Crassostrea sikamea',
        origin: 'California',
        size: 5,
        body: 6,
        sweetBrininess: 7,
        flavorfulness: 8,
        creaminess: 9,
      };

      const result = createOysterSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should allow missing species (optional)', () => {
      const validData = {
        name: 'Kumamoto',
        origin: 'California',
        size: 5,
        body: 6,
        sweetBrininess: 7,
        flavorfulness: 8,
        creaminess: 9,
      };

      const result = createOysterSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should allow missing origin (optional)', () => {
      const validData = {
        name: 'Kumamoto',
        species: 'Crassostrea sikamea',
        size: 5,
        body: 6,
        sweetBrininess: 7,
        flavorfulness: 8,
        creaminess: 9,
      };

      const result = createOysterSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject empty name', () => {
      const invalidData = {
        name: '',
      };

      const result = createOysterSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject name longer than 100 characters', () => {
      const invalidData = {
        name: 'A'.repeat(101),
      };

      const result = createOysterSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject negative attribute values', () => {
      const invalidData = {
        name: 'Test Oyster',
        size: -1,
      };

      const result = createOysterSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject attribute values above 10', () => {
      const invalidData = {
        name: 'Test Oyster',
        size: 11,
      };

      const result = createOysterSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should accept decimal attribute values', () => {
      const validData = {
        name: 'Test Oyster',
        species: 'Crassostrea gigas',
        origin: 'Pacific Northwest',
        size: 5.5,
        body: 6.7,
        sweetBrininess: 7.8,
        flavorfulness: 8.9,
        creaminess: 9.1,
      };

      const result = createOysterSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });
  });

  describe('updateOysterSchema', () => {
    it('should accept partial updates', () => {
      const validData = {
        name: 'Updated Name',
      };

      const result = updateOysterSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should accept empty update object', () => {
      const validData = {};

      const result = updateOysterSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject invalid attribute values', () => {
      const invalidData = {
        size: -1,
      };

      const result = updateOysterSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });
});

describe('Vote Schema', () => {
  describe('voteSchema', () => {
    it('should accept true', () => {
      const validData = { isAgree: true };
      const result = voteSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should accept false', () => {
      const validData = { isAgree: false };
      const result = voteSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject non-boolean values', () => {
      const invalidData = { isAgree: 'yes' };
      const result = voteSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject missing isAgree field', () => {
      const invalidData = {};
      const result = voteSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });
});

describe('Query Schemas', () => {
  describe('paginationSchema', () => {
    it('should accept valid pagination parameters', () => {
      const validData = {
        page: '2',
        limit: '20',
      };

      const result = paginationSchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(2);
        expect(result.data.limit).toBe(20);
      }
    });

    it('should transform string numbers to integers', () => {
      const data = {
        page: '5',
        limit: '50',
      };

      const result = paginationSchema.safeParse(data);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(typeof result.data.page).toBe('number');
        expect(typeof result.data.limit).toBe('number');
      }
    });

    it('should accept missing optional parameters', () => {
      const validData = {};

      const result = paginationSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject page below 1', () => {
      const invalidData = {
        page: '0',
      };

      const result = paginationSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject limit above 100', () => {
      const invalidData = {
        limit: '101',
      };

      const result = paginationSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject non-numeric strings', () => {
      const invalidData = {
        page: 'abc',
      };

      const result = paginationSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('reviewIdsQuerySchema', () => {
    it('should accept valid reviewIds string', () => {
      const validData = {
        reviewIds: 'id1,id2,id3',
      };

      const result = reviewIdsQuerySchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should accept single reviewId', () => {
      const validData = {
        reviewIds: 'single-id',
      };

      const result = reviewIdsQuerySchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject empty string', () => {
      const invalidData = {
        reviewIds: '',
      };

      const result = reviewIdsQuerySchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject missing reviewIds', () => {
      const invalidData = {};

      const result = reviewIdsQuerySchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });
});

describe('UUID Param Schemas', () => {
  const validUUID = '123e4567-e89b-12d3-a456-426614174000';
  const invalidUUID = 'not-a-uuid';

  describe('uuidParamSchema', () => {
    it('should accept valid UUID', () => {
      const validData = { id: validUUID };
      const result = uuidParamSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject invalid UUID', () => {
      const invalidData = { id: invalidUUID };
      const result = uuidParamSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('oysterIdParamSchema', () => {
    it('should accept valid UUID', () => {
      const validData = { oysterId: validUUID };
      const result = oysterIdParamSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject invalid UUID', () => {
      const invalidData = { oysterId: invalidUUID };
      const result = oysterIdParamSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('reviewIdParamSchema', () => {
    it('should accept valid UUID', () => {
      const validData = { reviewId: validUUID };
      const result = reviewIdParamSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject invalid UUID', () => {
      const invalidData = { reviewId: invalidUUID };
      const result = reviewIdParamSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('userIdParamSchema', () => {
    it('should accept valid UUID', () => {
      const validData = { userId: validUUID };
      const result = userIdParamSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject invalid UUID', () => {
      const invalidData = { userId: invalidUUID };
      const result = userIdParamSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });
});
