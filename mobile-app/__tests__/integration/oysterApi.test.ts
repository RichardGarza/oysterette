import 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { oysterApi } from '../../src/services/api';
import { Oyster } from '../../src/types/Oyster';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('oysterApi Integration Tests with Caching', () => {
  const mockOysters: Oyster[] = [
    { id: '1', name: 'Test Oyster', species: 'Test', origin: 'Test' },
  ];

  const mockResponse = {
    data: { data: mockOysters },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
    (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);
    (AsyncStorage.removeItem as jest.Mock).mockResolvedValue(undefined);
    mockedAxios.create.mockReturnValue({
      get: jest.fn(),
      post: jest.fn(),
      put: jest.fn(),
      delete: jest.fn(),
      interceptors: { request: { use: jest.fn() }, response: { use: jest.fn() } },
    } as any);
  });

  it('should fetch fresh data and cache it', async () => {
    const mockApi = {
      get: jest.fn().mockResolvedValue(mockResponse),
    };
    (axios.create as jest.Mock).mockReturnValue(mockApi);

    const result = await oysterApi.getAll();

    expect(mockApi.get).toHaveBeenCalledWith('/oysters', { params: undefined });
    expect(result).toEqual(mockOysters);
    expect(AsyncStorage.setItem).toHaveBeenCalledWith(
      'oyster-cache',
      JSON.stringify({ data: mockOysters, timestamp: expect.any(Number) })
    );
  });

  it('should use cache if within expiry (1 hour)', async () => {
    const cacheData = JSON.stringify({
      data: mockOysters,
      timestamp: Date.now() - 1000000, // 16 min ago
    });
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(cacheData);

    const result = await oysterApi.getAll();

    expect(axios.create).not.toHaveBeenCalled(); // No network call
    expect(result).toEqual(mockOysters);
    expect(AsyncStorage.setItem).not.toHaveBeenCalled(); // No recache
  });

  it('should refetch if cache expired (>1 hour)', async () => {
    const cacheData = JSON.stringify({
      data: mockOysters,
      timestamp: Date.now() - 4000000, // 1.1 hours ago
    });
    (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(cacheData);
    const mockApi = { get: jest.fn().mockResolvedValue(mockResponse) };
    (axios.create as jest.Mock).mockReturnValue(mockApi);

    const result = await oysterApi.getAll();

    expect(mockApi.get).toHaveBeenCalled(); // Network called
    expect(AsyncStorage.removeItem).toHaveBeenCalledWith('oyster-cache');
    expect(AsyncStorage.setItem).toHaveBeenCalled(); // Recached
    expect(result).toEqual(mockOysters);
  });

  it('should use cache on network failure (offline fallback)', async () => {
    const cacheData = JSON.stringify({
      data: mockOysters,
      timestamp: Date.now() - 1000000,
    });
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(cacheData);
    const mockApi = { get: jest.fn().mockRejectedValue(new Error('Network error')) };
    (axios.create as jest.Mock).mockReturnValue(mockApi);

    const result = await oysterApi.getAll();

    expect(mockApi.get).toHaveBeenCalled(); // Tries network
    expect(result).toEqual(mockOysters); // Uses cache
    // No error thrown, fallback successful
  });

  it('should throw error if no cache and network fails', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
    const mockApi = { get: jest.fn().mockRejectedValue(new Error('Network error')) };
    (axios.create as jest.Mock).mockReturnValue(mockApi);

    await expect(oysterApi.getAll()).rejects.toThrow('Network error');
    expect(mockApi.get).toHaveBeenCalled();
  });

  it('should handle cache read error gracefully', async () => {
    (AsyncStorage.getItem as jest.Mock).mockRejectedValue(new Error('Cache error'));
    const mockApi = { get: jest.fn().mockResolvedValue(mockResponse) };
    (axios.create as jest.Mock).mockReturnValue(mockApi);

    const result = await oysterApi.getAll();

    expect(mockApi.get).toHaveBeenCalled(); // Fetches fresh
    expect(result).toEqual(mockOysters);
    // Warn logged, but no throw
  });
});

export default {};
