/**
 * EmptyState Component Tests
 */

import { render, screen, fireEvent } from '@testing-library/react';
import EmptyState from '../../components/EmptyState';

describe('EmptyState', () => {
  it('should render with title and description', () => {
    render(
      <EmptyState
        title="No Results Found"
        description="Try adjusting your search or filters"
      />
    );

    expect(screen.getByText('No Results Found')).toBeInTheDocument();
    expect(screen.getByText('Try adjusting your search or filters')).toBeInTheDocument();
    expect(screen.getByText('📭')).toBeInTheDocument(); // Default icon
  });

  it('should render with custom icon', () => {
    render(
      <EmptyState
        icon="🦪"
        title="No Oysters"
        description="No oysters match your criteria"
      />
    );

    expect(screen.getByText('🦪')).toBeInTheDocument();
    expect(screen.getByText('No Oysters')).toBeInTheDocument();
  });

  it('should render action button with onClick handler', () => {
    const mockAction = jest.fn();

    render(
      <EmptyState
        title="No Reviews"
        description="Be the first to review"
        actionLabel="Write Review"
        onAction={mockAction}
      />
    );

    const button = screen.getByRole('button', { name: 'Write Review' });
    expect(button).toBeInTheDocument();

    fireEvent.click(button);
    expect(mockAction).toHaveBeenCalledTimes(1);
  });

  it('should render action link with href', () => {
    render(
      <EmptyState
        title="No Favorites"
        description="Start adding oysters to your favorites"
        actionLabel="Browse Oysters"
        actionHref="/oysters"
      />
    );

    const link = screen.getByRole('link', { name: 'Browse Oysters' });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/oysters');
  });
});
