/**
 * RatingDisplay Component Tests
 */

import { render, screen } from '@testing-library/react';
import RatingDisplay from '../../components/RatingDisplay';

describe('RatingDisplay', () => {
  it('should display correct number of stars and score', () => {
    render(<RatingDisplay overallScore={8.5} totalReviews={10} />);

    // 8.5/10 = 4.25, rounds to 4 stars
    const allStars = screen.getAllByText('⭐');
    expect(allStars).toHaveLength(5); // Total 5 stars (filled + empty)

    // Check score is displayed
    expect(screen.getByText('8.5')).toBeInTheDocument();

    // Check review count
    expect(screen.getByText('(10)')).toBeInTheDocument();
  });

  it('should handle perfect score (10/10)', () => {
    render(<RatingDisplay overallScore={10} totalReviews={25} />);

    // 10/10 = 1, so all 5 stars should be filled
    const allStars = screen.getAllByText('⭐');
    expect(allStars).toHaveLength(5);

    expect(screen.getByText('10.0')).toBeInTheDocument();
    expect(screen.getByText('(25)')).toBeInTheDocument();
  });

  it('should handle zero reviews', () => {
    render(<RatingDisplay overallScore={7.0} totalReviews={0} />);

    expect(screen.getByText('7.0')).toBeInTheDocument();

    // Should not show review count when totalReviews is 0
    expect(screen.queryByText(/\(\d+\)/)).not.toBeInTheDocument();
  });
});
