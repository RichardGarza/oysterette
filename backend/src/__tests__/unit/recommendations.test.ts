/**
 * Recommendation Service Unit Tests
 *
 * Lightweight tests for new recommendation features:
 * - Favorited oysters 1.5x weighting in flavor profile calculation
 */

import prisma from '../../lib/prisma';
import { getUserAttributePreferences } from '../../services/recommendationService';

describe('Recommendation Service - Favorited Oysters Weighting', () => {
  let testUserId: string;
  let favoritedOysterId: string;
  let nonFavoritedOysterId: string;

  beforeAll(async () => {
    // Clean up test data
    await prisma.favorite.deleteMany({ where: { user: { email: 'rec-test@oysterette.com' } } });
    await prisma.review.deleteMany({ where: { user: { email: 'rec-test@oysterette.com' } } });
    await prisma.user.deleteMany({ where: { email: 'rec-test@oysterette.com' } });

    // Create test user
    const user = await prisma.user.create({
      data: {
        email: 'rec-test@oysterette.com',
        name: 'Recommendation Test',
        password: 'hashedpassword',
      },
    });
    testUserId = user.id;

    // Get or create two oysters
    let oysters = await prisma.oyster.findMany({ take: 2 });

    // If not enough oysters exist, create test oysters
    if (oysters.length < 2) {
      const oyster1 = await prisma.oyster.create({
        data: {
          name: 'Test Oyster 1',
          species: 'Crassostrea gigas',
          origin: 'Test Origin',
          size: 5,
          body: 5,
          sweetBrininess: 5,
          flavorfulness: 5,
          creaminess: 5,
        },
      });
      const oyster2 = await prisma.oyster.create({
        data: {
          name: 'Test Oyster 2',
          species: 'Crassostrea gigas',
          origin: 'Test Origin',
          size: 5,
          body: 5,
          sweetBrininess: 5,
          flavorfulness: 5,
          creaminess: 5,
        },
      });
      oysters = [oyster1, oyster2];
    }

    favoritedOysterId = oysters[0].id;
    nonFavoritedOysterId = oysters[1].id;

    // Add favorite
    await prisma.favorite.create({
      data: {
        userId: testUserId,
        oysterId: favoritedOysterId,
      },
    });

    // Create reviews for both oysters (both LIKE_IT)
    await prisma.review.create({
      data: {
        userId: testUserId,
        oysterId: favoritedOysterId,
        rating: 'LIKE_IT',
        size: 8,
        body: 8,
        sweetBrininess: 8,
        flavorfulness: 8,
        creaminess: 8,
      },
    });

    await prisma.review.create({
      data: {
        userId: testUserId,
        oysterId: nonFavoritedOysterId,
        rating: 'LIKE_IT',
        size: 2,
        body: 2,
        sweetBrininess: 2,
        flavorfulness: 2,
        creaminess: 2,
      },
    });
  });

  afterAll(async () => {
    await prisma.favorite.deleteMany({ where: { userId: testUserId } });
    await prisma.review.deleteMany({ where: { userId: testUserId } });
    await prisma.user.deleteMany({ where: { id: testUserId } });
    await prisma.$disconnect();
  });

  it('should weight favorited oysters 1.5x in flavor profile calculation', async () => {
    const preferences = await getUserAttributePreferences(testUserId);

    expect(preferences).toBeTruthy();
    expect(preferences?.source).toBe('reviews');

    // With equal LIKE_IT reviews (one favorited at 8, one not at 2):
    // - Favorited: weight 1.5, values 8
    // - Non-favorited: weight 1.0, values 2
    // Average = (8*1.5 + 2*1.0) / (1.5+1.0) = (12 + 2) / 2.5 = 14 / 2.5 = 5.6

    // Should be closer to 8 (favorited) than 5 (simple average)
    expect(preferences?.avgSize).toBeGreaterThan(5);
    expect(preferences?.avgSize).toBeLessThan(8);

    // Verify weighting is approximately 5.6
    expect(preferences?.avgSize).toBeCloseTo(5.6, 1);
    expect(preferences?.avgBody).toBeCloseTo(5.6, 1);
    expect(preferences?.avgSweetBrininess).toBeCloseTo(5.6, 1);
    expect(preferences?.avgFlavorfulness).toBeCloseTo(5.6, 1);
    expect(preferences?.avgCreaminess).toBeCloseTo(5.6, 1);
  });

  it('should handle users with no favorites (1.0 weight for all)', async () => {
    // Remove favorite
    await prisma.favorite.deleteMany({ where: { userId: testUserId } });

    const preferences = await getUserAttributePreferences(testUserId);

    expect(preferences).toBeTruthy();

    // Without favorites, should be simple average: (8 + 2) / 2 = 5
    expect(preferences?.avgSize).toBeCloseTo(5, 1);
    expect(preferences?.avgBody).toBeCloseTo(5, 1);
    expect(preferences?.avgSweetBrininess).toBeCloseTo(5, 1);
    expect(preferences?.avgFlavorfulness).toBeCloseTo(5, 1);
    expect(preferences?.avgCreaminess).toBeCloseTo(5, 1);

    // Re-add favorite for cleanup
    await prisma.favorite.create({
      data: {
        userId: testUserId,
        oysterId: favoritedOysterId,
      },
    });
  });
});
