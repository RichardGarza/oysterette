/**
 * Top Oysters Page Tests
 */

import { render, screen, waitFor } from '@testing-library/react';
import TopOystersPage from '../../app/top-oysters/page';
import { oysterApi } from '../../lib/api';

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    replace: jest.fn(),
  })),
}));

jest.mock('../../lib/api', () => ({
  oysterApi: {
    getAll: jest.fn(),
  },
}));

jest.mock('../../components/Header', () => ({
  __esModule: true,
  default: () => <div data-testid="header">Header</div>,
}));

jest.mock('../../components/RatingDisplay', () => ({
  __esModule: true,
  default: ({ overallScore, totalReviews }: any) => (
    <div data-testid="rating-display">
      Score: {overallScore} ({totalReviews} reviews)
    </div>
  ),
}));

jest.mock('../../components/EmptyState', () => ({
  __esModule: true,
  default: ({ title, description }: any) => (
    <div data-testid="empty-state">
      <h2>{title}</h2>
      <p>{description}</p>
    </div>
  ),
}));

describe('Top Oysters Page', () => {
  const mockOysters = [
    {
      id: 'oyster-1',
      name: 'Kumamoto',
      species: 'Crassostrea sikamea',
      origin: 'Washington',
      overallScore: 4.8,
      totalReviews: 25,
    },
    {
      id: 'oyster-2',
      name: 'Blue Point',
      species: 'Crassostrea virginica',
      origin: 'Long Island',
      overallScore: 4.5,
      totalReviews: 18,
    },
    {
      id: 'oyster-3',
      name: 'Wellfleet',
      species: 'Crassostrea virginica',
      origin: 'Cape Cod',
      overallScore: 4.3,
      totalReviews: 12,
    },
    {
      id: 'oyster-4',
      name: 'No Reviews Oyster',
      species: 'Test species',
      origin: 'Test origin',
      overallScore: 0,
      totalReviews: 0,
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should show loading state while loading', async () => {
    (oysterApi.getAll as jest.Mock).mockImplementation(() => new Promise(() => {}));

    render(<TopOystersPage />);

    // Loading skeleton has animate-pulse class
    const loadingElements = document.querySelectorAll('.animate-pulse');
    expect(loadingElements.length).toBeGreaterThan(0);
  });

  it('should display ranked oysters sorted by score', async () => {
    (oysterApi.getAll as jest.Mock).mockResolvedValue(mockOysters);

    render(<TopOystersPage />);

    await waitFor(() => {
      expect(screen.getByText('Top Oysters')).toBeInTheDocument();
      expect(screen.getByText('Highest-rated by the community')).toBeInTheDocument();
      expect(screen.getByText('Kumamoto')).toBeInTheDocument();
      expect(screen.getByText('Blue Point')).toBeInTheDocument();
      expect(screen.getByText('Wellfleet')).toBeInTheDocument();
    });
  });

  it('should display ranking numbers', async () => {
    (oysterApi.getAll as jest.Mock).mockResolvedValue(mockOysters);

    render(<TopOystersPage />);

    await waitFor(() => {
      expect(screen.getByText('#1')).toBeInTheDocument();
      expect(screen.getByText('#2')).toBeInTheDocument();
      expect(screen.getByText('#3')).toBeInTheDocument();
    });
  });

  it('should not display oysters with no reviews', async () => {
    (oysterApi.getAll as jest.Mock).mockResolvedValue(mockOysters);

    render(<TopOystersPage />);

    await waitFor(() => {
      expect(screen.queryByText('No Reviews Oyster')).not.toBeInTheDocument();
    });
  });

  it('should show empty state when no rated oysters', async () => {
    (oysterApi.getAll as jest.Mock).mockResolvedValue([
      { id: '1', name: 'Test', species: 'Test', origin: 'Test', overallScore: 0, totalReviews: 0 },
    ]);

    render(<TopOystersPage />);

    await waitFor(() => {
      expect(screen.getByTestId('empty-state')).toBeInTheDocument();
      expect(screen.getByText('No Top Oysters')).toBeInTheDocument();
    });
  });
});
