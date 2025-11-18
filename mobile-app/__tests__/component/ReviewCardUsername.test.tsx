import React from 'react';
import { render } from '@testing-library/react-native';
import ReviewCard from '../../src/components/ReviewCard';

// Mock review prop
const mockReviewWithUsername = {
  user: { username: 'OysterFan123', name: 'John Doe' },
  // ... other props ...
};

const mockReviewNoUsername = {
  user: { name: 'John Doe' }, // No username
  // ...
};

describe('ReviewCard Username Display Tests', () => {
  it('displays username if set', () => {
    const { getByText } = render(<ReviewCard review={mockReviewWithUsername} />);

    expect(getByText('OysterFan123')).toBeTruthy();
  });

  it('falls back to name if no username', () => {
    const { getByText } = render(<ReviewCard review={mockReviewNoUsername} />);

    expect(getByText('John Doe')).toBeTruthy();
  });
});

export default {};
