/**
 * Tests for route copying functionality
 */

// Mock Supabase client
const mockSupabaseClient = {
  from: jest.fn(),
};

jest.mock('../../supabase', () => ({
  getSupabaseClient: () => mockSupabaseClient,
}));

import { copyRouteToUser, generateCopiedRouteName } from '../route-copy';
import { DatabaseRoute } from '../../../types/database';
import { DEFAULT_PATHFINDING_OPTIONS } from '../../../types/pathfinding';

const mockRoute: DatabaseRoute = {
  id: 'original-route-123',
  user_id: 'other-user',
  name: 'Amazing Alpine Route',
  route_data: {
    id: 'original-route-123',
    name: 'Amazing Alpine Route',
    start: { lat: 47.0000, lng: 8.0000, elevation: 1000 },
    end: { lat: 47.0100, lng: 8.0100, elevation: 1500 },
    points: [],
    distance: 5.2,
    elevationGain: 500,
    difficulty: 'moderate',
    estimatedTime: 7200,
    createdAt: new Date('2025-01-01T10:00:00Z')
  },
  pathfinding_options: DEFAULT_PATHFINDING_OPTIONS,
  is_public: true,
  tags: ['alpine', 'moderate'],
  created_at: '2025-01-01T10:00:00Z',
  updated_at: '2025-01-01T10:00:00Z'
};

describe('Route Copy Operations', () => {
  const targetUserId = 'target-user-123';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('copyRouteToUser', () => {
    it('should successfully copy a route to a new user', async () => {
      const expectedCopiedRoute = {
        id: expect.any(String),
        user_id: targetUserId,
        name: 'Amazing Alpine Route (Copy)',
        route_data: {
          ...mockRoute.route_data,
          id: expect.any(String),
          name: 'Amazing Alpine Route (Copy)',
        },
        pathfinding_options: mockRoute.pathfinding_options,
        is_public: false, // Copied routes default to private
        tags: mockRoute.tags,
        created_at: expect.any(String),
        updated_at: expect.any(String)
      };

      const mockSingle = jest.fn().mockResolvedValue({
        data: expectedCopiedRoute,
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

      const result = await copyRouteToUser(mockRoute, targetUserId);

      expect(result.success).toBe(true);
      expect(result.data).toMatchObject({
        user_id: targetUserId,
        name: 'Amazing Alpine Route (Copy)',
        is_public: false
      });
      expect(result.error).toBeNull();

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('routes');
      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: targetUserId,
          name: 'Amazing Alpine Route (Copy)',
          is_public: false
        })
      );
    });

    it('should handle custom route name for copy', async () => {
      const customName = 'My Modified Alpine Route';
      
      const mockSingle = jest.fn().mockResolvedValue({
        data: { name: customName },
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

      const result = await copyRouteToUser(mockRoute, targetUserId, {
        name: customName
      });

      expect(result.success).toBe(true);
      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          name: customName
        })
      );
    });

    it('should handle copy with custom privacy setting', async () => {
      const mockSingle = jest.fn().mockResolvedValue({
        data: { is_public: true },
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

      const result = await copyRouteToUser(mockRoute, targetUserId, {
        isPublic: true
      });

      expect(result.success).toBe(true);
      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          is_public: true
        })
      );
    });

    it('should handle database errors during copy', async () => {
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

      const result = await copyRouteToUser(mockRoute, targetUserId);

      expect(result.success).toBe(false);
      expect(result.data).toBeNull();
      expect(result.error).toEqual(mockError);
    });

    it('should prevent copying to the same user', async () => {
      const result = await copyRouteToUser(mockRoute, mockRoute.user_id);

      expect(result.success).toBe(false);
      expect(result.error?.message).toContain('Cannot copy your own route');
      expect(mockSupabaseClient.from).not.toHaveBeenCalled();
    });

    it('should generate new IDs for copied route and route data', async () => {
      const mockSingle = jest.fn().mockResolvedValue({
        data: {
          id: 'new-route-id',
          route_data: { id: 'new-route-data-id' }
        },
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

      await copyRouteToUser(mockRoute, targetUserId);

      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          id: expect.not.stringMatching(mockRoute.id),
          route_data: expect.objectContaining({
            id: expect.not.stringMatching(mockRoute.route_data.id)
          })
        })
      );
    });
  });

  describe('generateCopiedRouteName', () => {
    it('should add (Copy) suffix to route name', () => {
      const result = generateCopiedRouteName('Amazing Alpine Route');
      expect(result).toBe('Amazing Alpine Route (Copy)');
    });

    it('should handle routes that already have (Copy) suffix', () => {
      const result = generateCopiedRouteName('Amazing Alpine Route (Copy)');
      expect(result).toBe('Amazing Alpine Route (Copy 2)');
    });

    it('should increment copy number for multiple copies', () => {
      const result1 = generateCopiedRouteName('Amazing Alpine Route (Copy 2)');
      expect(result1).toBe('Amazing Alpine Route (Copy 3)');
      
      const result2 = generateCopiedRouteName('Amazing Alpine Route (Copy 15)');
      expect(result2).toBe('Amazing Alpine Route (Copy 16)');
    });

    it('should handle empty route names', () => {
      const result = generateCopiedRouteName('');
      expect(result).toBe('Untitled Route (Copy)');
    });

    it('should handle very long route names', () => {
      const longName = 'A'.repeat(200);
      const result = generateCopiedRouteName(longName);
      expect(result.length).toBeLessThanOrEqual(255); // Typical database limit
      expect(result).toContain('(Copy)');
    });
  });
});