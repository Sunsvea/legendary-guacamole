/**
 * Unit tests for route loading functionality
 */

// Mock the routes module
jest.mock('../routes', () => ({
  getUserRoutes: jest.fn(),
  getPublicRoutes: jest.fn(),
  searchRoutes: jest.fn(),
}));

import {
  loadUserRoutes,
  loadPublicRoutes,
  searchAndLoadRoutes,
  loadRoutesByTags,
  toLoadedRoute,
  extractRouteForPathfinding,
  extractPathfindingOptions,
  LoadedRoute,
  RouteLoadResult
} from '../route-loader';
import { DatabaseRoute, toDatabaseRoute } from '../../../types/database';
import { Route } from '../../../types/route';
import { DEFAULT_PATHFINDING_OPTIONS } from '../../../types/pathfinding';
import { getUserRoutes, getPublicRoutes, searchRoutes } from '../routes';

// Get the mocked functions
const mockGetUserRoutes = getUserRoutes as jest.MockedFunction<typeof getUserRoutes>;
const mockGetPublicRoutes = getPublicRoutes as jest.MockedFunction<typeof getPublicRoutes>;
const mockSearchRoutes = searchRoutes as jest.MockedFunction<typeof searchRoutes>;

describe('Route Loader', () => {
  const mockRoute: Route = {
    id: 'route-123',
    name: 'Test Mountain Route',
    start: { lat: 47.0000, lng: 8.0000, elevation: 1000 },
    end: { lat: 47.0100, lng: 8.0100, elevation: 1500 },
    points: [
      { lat: 47.0000, lng: 8.0000, elevation: 1000 },
      { lat: 47.0050, lng: 8.0050, elevation: 1250 },
      { lat: 47.0100, lng: 8.0100, elevation: 1500 }
    ],
    distance: 1.5,
    elevationGain: 500,
    difficulty: 'moderate',
    estimatedTime: 3600,
    createdAt: new Date('2025-01-01T10:00:00Z')
  };

  const userId = 'user-456';
  const mockDbRoute = toDatabaseRoute(mockRoute, userId, DEFAULT_PATHFINDING_OPTIONS, true, ['hiking']);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('toLoadedRoute', () => {
    it('should convert DatabaseRoute to LoadedRoute correctly', () => {
      const loadedRoute = toLoadedRoute(mockDbRoute);

      expect(loadedRoute.route).toEqual(mockRoute);
      expect(loadedRoute.pathfindingOptions).toEqual(DEFAULT_PATHFINDING_OPTIONS);
      expect(loadedRoute.isPublic).toBe(true);
      expect(loadedRoute.tags).toEqual(['hiking']);
      expect(loadedRoute.createdAt).toBeInstanceOf(Date);
      expect(loadedRoute.updatedAt).toBeInstanceOf(Date);
      expect(loadedRoute.userId).toBe(userId);
    });

    it('should handle date conversion correctly', () => {
      const loadedRoute = toLoadedRoute(mockDbRoute);

      expect(loadedRoute.createdAt.toISOString()).toBe(mockDbRoute.created_at);
      expect(loadedRoute.updatedAt.toISOString()).toBe(mockDbRoute.updated_at);
    });
  });

  describe('loadUserRoutes', () => {
    it('should successfully load user routes', async () => {
      mockGetUserRoutes.mockResolvedValue({
        success: true,
        data: [mockDbRoute],
        error: null
      });

      const result = await loadUserRoutes(userId);

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
      expect(result.data![0].route).toEqual(mockRoute);
      expect(result.data![0].userId).toBe(userId);
      expect(result.error).toBeNull();
      expect(mockGetUserRoutes).toHaveBeenCalledWith(userId, 0, 50);
    });

    it('should handle custom pagination', async () => {
      mockGetUserRoutes.mockResolvedValue({
        success: true,
        data: [mockDbRoute],
        error: null
      });

      const result = await loadUserRoutes(userId, 10, 25);

      expect(mockGetUserRoutes).toHaveBeenCalledWith(userId, 10, 25);
    });

    it('should return error when getUserRoutes fails', async () => {
      const mockError = {
        message: 'Database error',
        code: 'DB_ERROR'
      };

      mockGetUserRoutes.mockResolvedValue({
        success: false,
        data: null,
        error: mockError
      });

      const result = await loadUserRoutes(userId);

      expect(result.success).toBe(false);
      expect(result.data).toBeNull();
      expect(result.error).toEqual(mockError);
    });

    it('should handle exceptions', async () => {
      mockGetUserRoutes.mockRejectedValue(new Error('Network error'));

      const result = await loadUserRoutes(userId);

      expect(result.success).toBe(false);
      expect(result.data).toBeNull();
      expect(result.error?.message).toContain('Network error');
    });
  });

  describe('loadPublicRoutes', () => {
    it('should successfully load public routes', async () => {
      mockGetPublicRoutes.mockResolvedValue({
        success: true,
        data: [mockDbRoute],
        error: null
      });

      const result = await loadPublicRoutes();

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
      expect(result.data![0].route).toEqual(mockRoute);
      expect(result.data![0].isPublic).toBe(true);
      expect(result.error).toBeNull();
      expect(mockGetPublicRoutes).toHaveBeenCalledWith(0, 50);
    });

    it('should handle custom pagination', async () => {
      mockGetPublicRoutes.mockResolvedValue({
        success: true,
        data: [mockDbRoute],
        error: null
      });

      const result = await loadPublicRoutes(5, 15);

      expect(mockGetPublicRoutes).toHaveBeenCalledWith(5, 15);
    });

    it('should return error when getPublicRoutes fails', async () => {
      const mockError = {
        message: 'Access denied',
        code: 'ACCESS_ERROR'
      };

      mockGetPublicRoutes.mockResolvedValue({
        success: false,
        data: null,
        error: mockError
      });

      const result = await loadPublicRoutes();

      expect(result.success).toBe(false);
      expect(result.data).toBeNull();
      expect(result.error).toEqual(mockError);
    });
  });

  describe('searchAndLoadRoutes', () => {
    it('should successfully search and load routes', async () => {
      mockSearchRoutes.mockResolvedValue({
        success: true,
        data: [mockDbRoute],
        error: null
      });

      const result = await searchAndLoadRoutes('mountain', userId, true, 0, 10);

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
      expect(result.data![0].route).toEqual(mockRoute);
      expect(result.error).toBeNull();
      expect(mockSearchRoutes).toHaveBeenCalledWith('mountain', userId, true, 0, 10);
    });

    it('should use default parameters correctly', async () => {
      mockSearchRoutes.mockResolvedValue({
        success: true,
        data: [mockDbRoute],
        error: null
      });

      const result = await searchAndLoadRoutes('hiking');

      expect(mockSearchRoutes).toHaveBeenCalledWith('hiking', undefined, true, 0, 20);
    });

    it('should return error when search fails', async () => {
      const mockError = {
        message: 'Search timeout',
        code: 'TIMEOUT_ERROR'
      };

      mockSearchRoutes.mockResolvedValue({
        success: false,
        data: null,
        error: mockError
      });

      const result = await searchAndLoadRoutes('mountain');

      expect(result.success).toBe(false);
      expect(result.data).toBeNull();
      expect(result.error).toEqual(mockError);
    });
  });

  describe('loadRoutesByTags', () => {
    it('should successfully load routes by single tag', async () => {
      mockSearchRoutes.mockResolvedValue({
        success: true,
        data: [mockDbRoute],
        error: null
      });

      const result = await loadRoutesByTags(['hiking'], userId);

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
      expect(result.data![0].route).toEqual(mockRoute);
      expect(mockSearchRoutes).toHaveBeenCalledWith('hiking', userId, true, 0, 20);
    });

    it('should search for multiple tags and deduplicate results', async () => {
      const route2 = { ...mockRoute, id: 'route-456', name: 'Second Route' };
      const dbRoute2 = toDatabaseRoute(route2, userId, DEFAULT_PATHFINDING_OPTIONS, false, ['mountains']);

      // Mock multiple search results with some overlap
      mockSearchRoutes
        .mockResolvedValueOnce({
          success: true,
          data: [mockDbRoute],
          error: null
        })
        .mockResolvedValueOnce({
          success: true,
          data: [mockDbRoute, dbRoute2], // Duplicate mockDbRoute
          error: null
        });

      const result = await loadRoutesByTags(['hiking', 'mountains'], userId);

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2); // Should deduplicate
      expect(mockSearchRoutes).toHaveBeenCalledTimes(2);
      expect(mockSearchRoutes).toHaveBeenCalledWith('hiking', userId, true, 0, 20);
      expect(mockSearchRoutes).toHaveBeenCalledWith('mountains', userId, true, 0, 20);
    });

    it('should handle search failures gracefully', async () => {
      mockSearchRoutes
        .mockResolvedValueOnce({
          success: false,
          data: null,
          error: { message: 'Search failed' }
        })
        .mockResolvedValueOnce({
          success: true,
          data: [mockDbRoute],
          error: null
        });

      const result = await loadRoutesByTags(['failed', 'hiking']);

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1); // Only successful search result
    });

    it('should sort results by creation date and limit them', async () => {
      const olderRoute = { ...mockRoute, id: 'route-old', createdAt: new Date('2024-12-01T10:00:00Z') };
      const olderDbRoute = { 
        ...toDatabaseRoute(olderRoute, userId, DEFAULT_PATHFINDING_OPTIONS),
        created_at: '2024-12-01T10:00:00Z'
      };

      mockSearchRoutes.mockResolvedValue({
        success: true,
        data: [olderDbRoute, mockDbRoute], // Older first, newer second
        error: null
      });

      const result = await loadRoutesByTags(['hiking'], userId, true, 1); // Limit to 1

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
      expect(result.data![0].route.id).toBe('route-123'); // Newer route should be first
    });
  });

  describe('extractRouteForPathfinding', () => {
    it('should extract route object from LoadedRoute', () => {
      const loadedRoute = toLoadedRoute(mockDbRoute);
      const extractedRoute = extractRouteForPathfinding(loadedRoute);

      expect(extractedRoute).toEqual(mockRoute);
      expect(extractedRoute).toBe(loadedRoute.route);
    });
  });

  describe('extractPathfindingOptions', () => {
    it('should extract pathfinding options from LoadedRoute', () => {
      const loadedRoute = toLoadedRoute(mockDbRoute);
      const extractedOptions = extractPathfindingOptions(loadedRoute);

      expect(extractedOptions).toEqual(DEFAULT_PATHFINDING_OPTIONS);
      expect(extractedOptions).toBe(loadedRoute.pathfindingOptions);
    });
  });
});