import React from 'react';
import { render } from '@testing-library/react-native';
import ReviewCard from '../../src/components/ReviewCard';

// Mock PaperProvider
jest.mock('react-native-paper', () => ({
  Card: ({ children }: any) => children,
  Text: ({ children }: any) => children,
  IconButton: () => null,
  Avatar: { Text: () => null },
}));

// Mock review prop
const mockReviewWithUsername = {
  id: '1',
  user: { username: 'OysterFan123', name: 'John Doe', id: '1' },
  oyster: { name: 'Test Oyster', id: '1' },
  rating: 'LOVE_IT',
  size: 8,
  body: 7,
  sweetBrininess: 6,
  flavorfulness: 9,
  creaminess: 7,
  createdAt: new Date().toISOString(),
  agreeCount: 0,
  disagreeCount: 0,
};

const mockReviewNoUsername = {
  id: '2',
  user: { name: 'John Doe', id: '2' },
  oyster: { name: 'Test Oyster', id: '1' },
  rating: 'LIKE_IT',
  size: 7,
  body: 6,
  sweetBrininess: 5,
  flavorfulness: 8,
  creaminess: 6,
  createdAt: new Date().toISOString(),
  agreeCount: 0,
  disagreeCount: 0,
};

describe('ReviewCard Username Display Tests', () => {
  it('displays username if set', () => {
    const { getByText } = render(
      <ReviewCard
        review={mockReviewWithUsername as any}
        userVote={null}
        onVoteChange={() => {}}
      />
    );

    expect(getByText('OysterFan123')).toBeTruthy();
  });

  it('falls back to name if no username', () => {
    const { getByText } = render(
      <ReviewCard
        review={mockReviewNoUsername as any}
        userVote={null}
        onVoteChange={() => {}}
      />
    );

    expect(getByText('John Doe')).toBeTruthy();
  });
});

export default {};
