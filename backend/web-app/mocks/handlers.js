import { http, HttpResponse } from 'msw';

// Mock handlers for common API endpoints
export const handlers = [
  // Mock GET /api/oysters (list of oysters)
  http.get('https://oysterette-production.up.railway.app/api/oysters', () => {
    return HttpResponse.json({
      success: true,
      data: [
        {
          id: '1',
          name: 'Test Oyster',
          species: 'Pacific',
          origin: 'Washington',
          overallScore: 8.5,
          totalReviews: 10,
          avgSize: 7,
          avgBody: 8,
          avgSweetBrininess: 6,
          avgFlavorfulness: 9,
          avgCreaminess: 7,
        },
        // Add more mock oysters as needed
      ],
    });
  }),

  // Mock GET /api/oysters/:id
  http.get('https://oysterette-production.up.railway.app/api/oysters/:id', ({ params }) => {
    return HttpResponse.json({
      success: true,
      data: {
        id: params.id,
        name: 'Detailed Test Oyster',
        species: 'Pacific',
        origin: 'Washington',
        overallScore: 8.5,
        totalReviews: 10,
        avgSize: 7,
        avgBody: 8,
        avgSweetBrininess: 6,
        avgFlavorfulness: 9,
        avgCreaminess: 7,
      },
    });
  }),

  // Mock POST /api/reviews (create review)
  http.post('https://oysterette-production.up.railway.app/api/reviews', () => {
    return HttpResponse.json({
      success: true,
      data: {
        id: 'review-1',
        rating: 'LIKE_IT',
        size: 7,
        body: 8,
        sweetBrininess: 6,
        flavorfulness: 9,
        creaminess: 7,
        notes: 'Great oyster!',
        oysterId: '1',
        userId: 'user-1',
        createdAt: new Date().toISOString(),
      },
    });
  }),

  // Mock GET /api/auth/profile (user profile)
  http.get('https://oysterette-production.up.railway.app/api/auth/profile', () => {
    return HttpResponse.json({
      success: true,
      data: {
        id: 'user-1',
        email: 'test@example.com',
        name: 'Test User',
        preferences: {},
        createdAt: new Date().toISOString(),
      },
    });
  }),

  // Add more handlers for other endpoints as needed (reviews, favorites, etc.)
];
