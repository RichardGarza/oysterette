/**
 * Add Oyster Page Tests
 */

import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import AddOysterPage from '../../app/oysters/add/page';
import { useAuth } from '../../context/AuthContext';
import { oysterApi } from '../../lib/api';

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

jest.mock('../../context/AuthContext', () => ({
  useAuth: jest.fn(),
}));

jest.mock('../../lib/api', () => ({
  oysterApi: {
    create: jest.fn(),
  },
}));

jest.mock('../../components/Header', () => ({
  __esModule: true,
  default: () => <div data-testid="header">Header</div>,
}));

jest.mock('../../components/LoadingSpinner', () => ({
  __esModule: true,
  default: ({ text }: any) => <div data-testid="loading-spinner">{text}</div>,
}));

describe('Add Oyster Page', () => {
  const mockPush = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
    });
  });

  it('should show login modal if not authenticated', () => {
    (useAuth as jest.Mock).mockReturnValue({
      isAuthenticated: false,
    });

    render(<AddOysterPage />);

    expect(screen.getByText('Login Required')).toBeInTheDocument();
    expect(screen.getByText('Please log in to suggest a new oyster.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /log in/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign up/i })).toBeInTheDocument();
  });

  it('should display add oyster form when authenticated', () => {
    (useAuth as jest.Mock).mockReturnValue({
      isAuthenticated: true,
    });

    render(<AddOysterPage />);

    expect(screen.getByText('Suggest a New Oyster')).toBeInTheDocument();
    expect(screen.getByText('Name *')).toBeInTheDocument();
    expect(screen.getByText(/species \(optional\)/i)).toBeInTheDocument();
    expect(screen.getByText(/origin \(optional\)/i)).toBeInTheDocument();
    expect(screen.getByText(/standout notes \(optional\)/i)).toBeInTheDocument();
  });

  it('should have sliders for all attributes', () => {
    (useAuth as jest.Mock).mockReturnValue({
      isAuthenticated: true,
    });

    render(<AddOysterPage />);

    const sliders = screen.getAllByRole('slider');
    expect(sliders).toHaveLength(5); // size, body, sweetBrininess, flavorfulness, creaminess
  });

  it('should submit form with valid data', async () => {
    (useAuth as jest.Mock).mockReturnValue({
      isAuthenticated: true,
    });
    (oysterApi.create as jest.Mock).mockResolvedValue({});

    const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {});

    render(<AddOysterPage />);

    const inputs = screen.getAllByRole('textbox');
    const nameInput = inputs[0]; // First input is the name field
    fireEvent.change(nameInput, { target: { value: 'Test Oyster' } });

    const form = screen.getByRole('button', { name: /suggest oyster/i }).closest('form');
    fireEvent.submit(form!);

    await waitFor(() => {
      expect(oysterApi.create).toHaveBeenCalled();
      expect(alertSpy).toHaveBeenCalledWith('Oyster suggestion submitted successfully!');
      expect(mockPush).toHaveBeenCalledWith('/oysters');
    });

    alertSpy.mockRestore();
  });

  it('should show error message on submission failure', async () => {
    (useAuth as jest.Mock).mockReturnValue({
      isAuthenticated: true,
    });
    (oysterApi.create as jest.Mock).mockRejectedValue({
      response: { data: { error: 'Oyster already exists' } },
    });

    const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {});

    render(<AddOysterPage />);

    const inputs = screen.getAllByRole('textbox');
    const nameInput = inputs[0]; // First input is the name field
    fireEvent.change(nameInput, { target: { value: 'Test Oyster' } });

    const form = screen.getByRole('button', { name: /suggest oyster/i }).closest('form');
    fireEvent.submit(form!);

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith('Oyster already exists');
    });

    alertSpy.mockRestore();
  });
});
