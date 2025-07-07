/**
 * Unit tests for route database operations
 */

// Mock Supabase client
const mockSupabaseClient = {
  from: jest.fn(),
};

jest.mock('../../supabase', () => ({
  getSupabaseClient: () => mockSupabaseClient,
}));

// Mock country detection
jest.mock('../../utils/country-detection', () => ({
  detectCountryFromCoordinate: jest.fn().mockResolvedValue('Switzerland'),
}));

import { 
  saveRoute, 
  getUserRoutes, 
  getPublicRoutes,
  updateRoute,
  deleteRoute
} from '../routes';
import { Route } from '../../../types/route';
import { toDatabaseRoute } from '../../../types/database';
import { DEFAULT_PATHFINDING_OPTIONS } from '../../../types/pathfinding';

describe('Route Database Operations', () => {
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

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('saveRoute', () => {
    it('should successfully save a new route', async () => {
      const mockDbRoute = toDatabaseRoute(mockRoute, userId, DEFAULT_PATHFINDING_OPTIONS);
      
      const mockSingle = jest.fn().mockResolvedValue({
        data: mockDbRoute,
        error: null
      });

      const mockSelect = jest.fn().mockReturnValue({
        single: mockSingle
      });

      const mockInsert = jest.fn().mockReturnValue({
        select: mockSelect
      });

      mockSupabaseClient.from.mockReturnValue({
        insert: mockInsert
      });

      const result = await saveRoute(mockRoute, userId, DEFAULT_PATHFINDING_OPTIONS);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockDbRoute);
      expect(result.error).toBeNull();
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('routes');
      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          id: mockRoute.id,
          user_id: userId,
          name: mockRoute.name,
          route_data: mockRoute,
          pathfinding_options: DEFAULT_PATHFINDING_OPTIONS,
          is_public: false,
          tags: []
        })
      );
    });

    it('should save route with custom options', async () => {
      const mockDbRoute = toDatabaseRoute(mockRoute, userId, DEFAULT_PATHFINDING_OPTIONS, true, ['hiking']);
      
      const mockSingle = jest.fn().mockResolvedValue({
        data: mockDbRoute,
        error: null
      });

      const mockSelect = jest.fn().mockReturnValue({
        single: mockSingle
      });

      const mockInsert = jest.fn().mockReturnValue({
        select: mockSelect
      });

      mockSupabaseClient.from.mockReturnValue({
        insert: mockInsert
      });

      const result = await saveRoute(
        mockRoute, 
        userId, 
        DEFAULT_PATHFINDING_OPTIONS, 
        true, 
        ['hiking']
      );

      expect(result.success).toBe(true);
      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          is_public: true,
          tags: ['hiking']
        })
      );
    });

    it('should return error when save fails', async () => {
      const mockError = {
        message: 'Database connection failed',
        code: 'CONNECTION_ERROR'
      };

      const mockSingle = jest.fn().mockResolvedValue({
        data: null,
        error: mockError
      });

      const mockSelect = jest.fn().mockReturnValue({
        single: mockSingle
      });

      const mockInsert = jest.fn().mockReturnValue({
        select: mockSelect
      });

      mockSupabaseClient.from.mockReturnValue({
        insert: mockInsert
      });

      const result = await saveRoute(mockRoute, userId, DEFAULT_PATHFINDING_OPTIONS);

      expect(result.success).toBe(false);
      expect(result.data).toBeNull();
      expect(result.error).toEqual(mockError);
    });

    it('should handle exceptions', async () => {
      const mockSingle = jest.fn().mockRejectedValue(new Error('Network error'));

      const mockSelect = jest.fn().mockReturnValue({
        single: mockSingle
      });

      const mockInsert = jest.fn().mockReturnValue({
        select: mockSelect
      });

      mockSupabaseClient.from.mockReturnValue({
        insert: mockInsert
      });

      const result = await saveRoute(mockRoute, userId, DEFAULT_PATHFINDING_OPTIONS);

      expect(result.success).toBe(false);
      expect(result.data).toBeNull();
      expect(result.error?.message).toContain('Network error');
    });
  });

  describe('getUserRoutes', () => {
    it('should successfully fetch user routes', async () => {
      const mockDbRoutes = [
        toDatabaseRoute(mockRoute, userId, DEFAULT_PATHFINDING_OPTIONS)
      ];

      const mockOrderChain = {
        range: jest.fn().mockResolvedValue({
          data: mockDbRoutes,
          error: null
        })
      };

      const mockOrder = jest.fn().mockReturnValue(mockOrderChain);
      const mockEq = jest.fn().mockReturnValue({ order: mockOrder });
      const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });

      mockSupabaseClient.from.mockReturnValue({
        select: mockSelect
      });

      const result = await getUserRoutes(userId);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockDbRoutes);
      expect(result.error).toBeNull();
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('routes');
      expect(mockSelect).toHaveBeenCalledWith('*');
      expect(mockEq).toHaveBeenCalledWith('user_id', userId);
      expect(mockOrder).toHaveBeenCalledWith('created_at', { ascending: false });
      expect(mockOrderChain.range).toHaveBeenCalledWith(0, 49); // Default limit of 50
    });

    it('should fetch routes with custom pagination', async () => {
      const mockDbRoutes = [
        toDatabaseRoute(mockRoute, userId, DEFAULT_PATHFINDING_OPTIONS)
      ];

      const mockOrderChain = {
        range: jest.fn().mockResolvedValue({
          data: mockDbRoutes,
          error: null
        })
      };

      const mockOrder = jest.fn().mockReturnValue(mockOrderChain);
      const mockEq = jest.fn().mockReturnValue({ order: mockOrder });
      const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });

      mockSupabaseClient.from.mockReturnValue({
        select: mockSelect
      });

      await getUserRoutes(userId, 10, 25);

      expect(mockOrderChain.range).toHaveBeenCalledWith(10, 34); // offset 10, limit 25
    });

    it('should return error when fetch fails', async () => {
      const mockError = {
        message: 'Access denied',
        code: 'PERMISSION_ERROR'
      };

      const mockOrderChain = {
        range: jest.fn().mockResolvedValue({
          data: null,
          error: mockError
        })
      };

      const mockOrder = jest.fn().mockReturnValue(mockOrderChain);
      const mockEq = jest.fn().mockReturnValue({ order: mockOrder });
      const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });

      mockSupabaseClient.from.mockReturnValue({
        select: mockSelect
      });

      const result = await getUserRoutes(userId);

      expect(result.success).toBe(false);
      expect(result.data).toBeNull();
      expect(result.error).toEqual(mockError);
    });
  });

  describe('getPublicRoutes', () => {
    it('should successfully fetch public routes', async () => {
      const mockDbRoutes = [
        toDatabaseRoute(mockRoute, userId, DEFAULT_PATHFINDING_OPTIONS, true)
      ];

      const mockOrderChain = {
        range: jest.fn().mockResolvedValue({
          data: mockDbRoutes,
          error: null
        })
      };

      const mockOrder = jest.fn().mockReturnValue(mockOrderChain);
      const mockEq = jest.fn().mockReturnValue({ order: mockOrder });
      const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });

      mockSupabaseClient.from.mockReturnValue({
        select: mockSelect
      });

      const result = await getPublicRoutes();

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockDbRoutes);
      expect(mockEq).toHaveBeenCalledWith('is_public', true);
    });
  });

  describe('updateRoute', () => {
    it('should successfully update a route', async () => {
      const updatedRoute = { ...mockRoute, name: 'Updated Route Name' };
      const mockDbRoute = toDatabaseRoute(updatedRoute, userId, DEFAULT_PATHFINDING_OPTIONS);

      const mockSingle = jest.fn().mockResolvedValue({
        data: mockDbRoute,
        error: null
      });

      const mockSelect = jest.fn().mockReturnValue({
        single: mockSingle
      });

      const mockEq2 = jest.fn().mockReturnValue({
        select: mockSelect
      });

      const mockEq1 = jest.fn().mockReturnValue({
        eq: mockEq2
      });

      const mockUpdate = jest.fn().mockReturnValue({
        eq: mockEq1
      });

      mockSupabaseClient.from.mockReturnValue({
        update: mockUpdate
      });

      const result = await updateRoute(mockRoute.id, userId, updatedRoute, DEFAULT_PATHFINDING_OPTIONS);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockDbRoute);
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('routes');
      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          route_data: updatedRoute,
          pathfinding_options: DEFAULT_PATHFINDING_OPTIONS,
          updated_at: expect.any(String)
        })
      );
      expect(mockEq1).toHaveBeenCalledWith('id', mockRoute.id);
      expect(mockEq2).toHaveBeenCalledWith('user_id', userId);
      expect(mockSelect).toHaveBeenCalledWith();
      expect(mockSingle).toHaveBeenCalled();
    });

    it('should return error when update fails', async () => {
      const updatedRoute = { ...mockRoute, name: 'Updated Route Name' };
      const mockError = {
        message: 'Route not found',
        code: 'NOT_FOUND'
      };

      const mockSingle = jest.fn().mockResolvedValue({
        data: null,
        error: mockError
      });

      const mockSelect = jest.fn().mockReturnValue({
        single: mockSingle
      });

      const mockEq2 = jest.fn().mockReturnValue({
        select: mockSelect
      });

      const mockEq1 = jest.fn().mockReturnValue({
        eq: mockEq2
      });

      const mockUpdate = jest.fn().mockReturnValue({
        eq: mockEq1
      });

      mockSupabaseClient.from.mockReturnValue({
        update: mockUpdate
      });

      const result = await updateRoute(mockRoute.id, userId, updatedRoute, DEFAULT_PATHFINDING_OPTIONS);

      expect(result.success).toBe(false);
      expect(result.data).toBeNull();
      expect(result.error).toEqual(mockError);
    });
  });

  describe('deleteRoute', () => {
    it('should successfully delete a route', async () => {
      const mockEq2 = jest.fn().mockResolvedValue({
        data: null,
        error: null
      });

      const mockEq1 = jest.fn().mockReturnValue({
        eq: mockEq2
      });

      const mockDelete = jest.fn().mockReturnValue({
        eq: mockEq1
      });

      mockSupabaseClient.from.mockReturnValue({
        delete: mockDelete
      });

      const result = await deleteRoute(mockRoute.id, userId);

      expect(result.success).toBe(true);
      expect(result.error).toBeNull();
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('routes');
      expect(mockDelete).toHaveBeenCalled();
      expect(mockEq1).toHaveBeenCalledWith('id', mockRoute.id);
      expect(mockEq2).toHaveBeenCalledWith('user_id', userId);
    });

    it('should return error when delete fails', async () => {
      const mockError = {
        message: 'Route not found',
        code: 'NOT_FOUND'
      };

      const mockEq2 = jest.fn().mockResolvedValue({
        data: null,
        error: mockError
      });

      const mockEq1 = jest.fn().mockReturnValue({
        eq: mockEq2
      });

      const mockDelete = jest.fn().mockReturnValue({
        eq: mockEq1
      });

      mockSupabaseClient.from.mockReturnValue({
        delete: mockDelete
      });

      const result = await deleteRoute(mockRoute.id, userId);

      expect(result.success).toBe(false);
      expect(result.error).toEqual(mockError);
    });
  });
});