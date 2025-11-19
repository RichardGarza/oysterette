import React from 'react';
import { render } from '@testing-library/react-native';
import ReviewCard from '../../src/components/ReviewCard';

// Mock react-native-paper
jest.mock('react-native-paper', () => ({
  Card: Object.assign(
    ({ children }: any) => children,
    {
      Content: ({ children }: any) => children,
      Title: ({ children }: any) => children,
      Actions: ({ children }: any) => children,
    }
  ),
  Text: ({ children }: any) => children,
  IconButton: () => null,
  Avatar: { Text: () => null },
  Chip: ({ children }: any) => children,
  Button: ({ children }: any) => children,
  ActivityIndicator: () => null,
  Dialog: Object.assign(
    ({ children }: any) => children,
    {
      Title: ({ children }: any) => children,
      Content: ({ children }: any) => children,
      Actions: ({ children }: any) => children,
    }
  ),
  Portal: ({ children }: any) => children,
  Snackbar: ({ children }: any) => children,
  useTheme: () => ({
    colors: {
      primary: '#000',
      background: '#fff',
      surface: '#fff',
      text: '#000',
    },
  }),
  MD3LightTheme: {
    colors: {
      primary: '#000',
      background: '#fff',
      surface: '#fff',
      text: '#000',
      onSurface: '#000',
      surfaceVariant: '#fff',
      onSurfaceVariant: '#000',
      outline: '#000',
      outlineVariant: '#000',
      shadow: '#000',
      scrim: '#000',
      inverseSurface: '#000',
      inverseOnSurface: '#fff',
      inversePrimary: '#000',
      elevation: {},
    },
  },
  MD3DarkTheme: {
    colors: {
      primary: '#fff',
      background: '#000',
      surface: '#000',
      text: '#fff',
      onSurface: '#fff',
      surfaceVariant: '#000',
      onSurfaceVariant: '#fff',
      outline: '#fff',
      outlineVariant: '#fff',
      shadow: '#fff',
      scrim: '#fff',
      inverseSurface: '#fff',
      inverseOnSurface: '#000',
      inversePrimary: '#fff',
      elevation: {},
    },
  },
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
