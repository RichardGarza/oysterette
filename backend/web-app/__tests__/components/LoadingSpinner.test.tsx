/**
 * LoadingSpinner Component Tests
 */

import { render, screen } from '@testing-library/react';
import LoadingSpinner from '../../components/LoadingSpinner';

describe('LoadingSpinner', () => {
  it('should render spinner with default text', () => {
    render(<LoadingSpinner />);

    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.getByLabelText('Loading')).toBeInTheDocument();
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('should render with custom text', () => {
    render(<LoadingSpinner text="Fetching oysters..." />);

    expect(screen.getByText('Fetching oysters...')).toBeInTheDocument();
  });

  it('should render different sizes', () => {
    const { rerender } = render(<LoadingSpinner size="sm" />);
    let spinner = screen.getByRole('status');
    expect(spinner).toHaveClass('w-8', 'h-8');

    rerender(<LoadingSpinner size="md" />);
    spinner = screen.getByRole('status');
    expect(spinner).toHaveClass('w-12', 'h-12');

    rerender(<LoadingSpinner size="lg" />);
    spinner = screen.getByRole('status');
    expect(spinner).toHaveClass('w-16', 'h-16');
  });

  it('should render fullscreen version', () => {
    const { container } = render(<LoadingSpinner fullScreen />);

    const fullScreenDiv = container.querySelector('.min-h-screen');
    expect(fullScreenDiv).toBeInTheDocument();
  });
});
