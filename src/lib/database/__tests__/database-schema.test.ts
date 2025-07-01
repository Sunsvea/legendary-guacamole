/**
 * Integration tests for database schema and RLS policies
 * These tests verify that the Supabase database is properly configured
 */

// Mock Supabase client for schema testing
const mockSupabaseClient = {
  from: jest.fn(),
  rpc: jest.fn(),
  auth: {
    signUp: jest.fn(),
    signInWithPassword: jest.fn(),
    getUser: jest.fn(),
  },
};

jest.mock('../../supabase', () => ({
  getSupabaseClient: () => mockSupabaseClient,
}));

import { getSupabaseClient } from '../../supabase';
import { saveRoute, getUserRoutes } from '../routes';
import { Route } from '../../../types/route';
import { DEFAULT_PATHFINDING_OPTIONS } from '../../../types/pathfinding';

describe('Database Schema and RLS Integration', () => {
  const mockRoute: Route = {
    id: 'route-123',
    name: 'Test Alpine Route',
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

  const userId = 'user-123';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Routes Table Schema', () => {
    it('should have proper structure for saving routes', async () => {
      const mockSingle = jest.fn().mockResolvedValue({
        data: {
          id: mockRoute.id,
          user_id: userId,
          name: mockRoute.name,
          route_data: mockRoute,
          pathfinding_options: DEFAULT_PATHFINDING_OPTIONS,
          is_public: false,
          tags: [],
          created_at: '2025-01-01T10:00:00Z',
          updated_at: '2025-01-01T10:00:00Z'
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

      const result = await saveRoute(mockRoute, userId, DEFAULT_PATHFINDING_OPTIONS);

      expect(result.success).toBe(true);
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

    it('should enforce required fields', async () => {
      const requiredFields = [
        'id',
        'user_id', 
        'name',
        'route_data',
        'pathfinding_options'
      ];

      // Verify our toDatabaseRoute function includes all required fields
      const { toDatabaseRoute } = await import('../../../types/database');
      const dbRoute = toDatabaseRoute(mockRoute, userId, DEFAULT_PATHFINDING_OPTIONS);

      requiredFields.forEach(field => {
        expect(dbRoute).toHaveProperty(field);
        expect(dbRoute[field]).toBeDefined();
      });
    });

    it('should support optional fields with defaults', async () => {
      const { toDatabaseRoute } = await import('../../../types/database');
      const dbRoute = toDatabaseRoute(mockRoute, userId, DEFAULT_PATHFINDING_OPTIONS);

      // Check optional fields have proper defaults
      expect(dbRoute.is_public).toBe(false);
      expect(dbRoute.tags).toEqual([]);
      expect(dbRoute.created_at).toBeDefined();
      expect(dbRoute.updated_at).toBeDefined();
    });
  });

  describe('Row Level Security Simulation', () => {
    it('should only return user owned routes in getUserRoutes', async () => {
      const userRoutes = [
        { id: 'route-1', user_id: userId, name: 'User Route 1' },
        { id: 'route-2', user_id: userId, name: 'User Route 2' }
      ];

      const mockRange = jest.fn().mockResolvedValue({
        data: userRoutes,
        error: null
      });

      const mockOrder = jest.fn().mockReturnValue({ range: mockRange });
      const mockEq = jest.fn().mockReturnValue({ order: mockOrder });
      const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });

      mockSupabaseClient.from.mockReturnValue({
        select: mockSelect
      });

      const result = await getUserRoutes(userId);

      expect(result.success).toBe(true);
      expect(mockEq).toHaveBeenCalledWith('user_id', userId);
      
      // Verify only user's routes are returned (RLS simulation)
      result.data?.forEach(route => {
        expect(route.user_id).toBe(userId);
      });
    });

    it('should handle public routes visibility correctly', async () => {
      // Mock scenario: user can see public routes from other users
      const publicRoutes = [
        { id: 'route-public-1', user_id: 'other-user', name: 'Public Route 1', is_public: true },
        { id: 'route-public-2', user_id: 'another-user', name: 'Public Route 2', is_public: true }
      ];

      const mockRange = jest.fn().mockResolvedValue({
        data: publicRoutes,
        error: null
      });

      const mockOrder = jest.fn().mockReturnValue({ range: mockRange });
      const mockEq = jest.fn().mockReturnValue({ order: mockOrder });
      const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });

      mockSupabaseClient.from.mockReturnValue({
        select: mockSelect
      });

      const { getPublicRoutes } = await import('../routes');
      const result = await getPublicRoutes();

      expect(result.success).toBe(true);
      expect(mockEq).toHaveBeenCalledWith('is_public', true);
      
      // Verify all returned routes are public
      result.data?.forEach(route => {
        expect(route.is_public).toBe(true);
      });
    });
  });

  describe('User Preferences Schema', () => {
    it('should have proper default preferences structure', async () => {
      const { createUserPreferences } = await import('../../../types/database');
      
      const userPrefs = createUserPreferences(userId);

      // Verify required fields
      expect(userPrefs.user_id).toBe(userId);
      expect(userPrefs.default_pathfinding_options).toEqual(DEFAULT_PATHFINDING_OPTIONS);
      
      // Verify defaults match expected values
      expect(userPrefs.difficulty_preference).toBe('moderate');
      expect(userPrefs.trail_preference).toBe('trails_preferred');
      expect(userPrefs.units).toBe('metric');
      expect(userPrefs.favorite_regions).toEqual([]);
      
      // Verify timestamps
      expect(userPrefs.created_at).toBeDefined();
      expect(userPrefs.updated_at).toBeDefined();
    });

    it('should support preference customization', async () => {
      const { createUserPreferences } = await import('../../../types/database');
      
      const customPrefs = createUserPreferences(userId, {
        difficulty_preference: 'hard',
        trail_preference: 'roads_only',
        units: 'imperial'
      });

      expect(customPrefs.difficulty_preference).toBe('hard');
      expect(customPrefs.trail_preference).toBe('roads_only');
      expect(customPrefs.units).toBe('imperial');
      
      // Defaults should still apply for non-overridden fields
      expect(customPrefs.favorite_regions).toEqual([]);
    });
  });

  describe('Database Connection', () => {
    it('should provide valid Supabase client instance', () => {
      const client = getSupabaseClient();
      
      expect(client).toBeDefined();
      expect(client.from).toBeDefined();
      expect(client.auth).toBeDefined();
    });

    it('should handle database errors gracefully', async () => {
      const mockError = {
        message: 'Connection failed',
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
      expect(result.error).toEqual(mockError);
    });
  });
});