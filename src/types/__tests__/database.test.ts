/**
 * Unit tests for database type definitions
 */

import {
  SavedRoute,
  UserPreferences,
  RouteMetadata,
  DatabaseRoute,
  toDatabaseRoute,
  fromDatabaseRoute,
  createUserPreferences,
  DEFAULT_USER_PREFERENCES
} from '../database';
import { Route } from '../route';
import { DEFAULT_PATHFINDING_OPTIONS } from '../pathfinding';

describe('Database Types', () => {
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

  describe('SavedRoute Interface', () => {
    it('should have correct properties', () => {
      const savedRoute: SavedRoute = {
        id: 'route-123',
        user_id: 'user-456',
        name: 'Test Route',
        route_data: mockRoute,
        pathfinding_options: DEFAULT_PATHFINDING_OPTIONS,
        is_public: false,
        tags: ['hiking', 'mountains'],
        created_at: '2025-01-01T10:00:00Z',
        updated_at: '2025-01-01T10:00:00Z'
      };

      expect(savedRoute.id).toBe('route-123');
      expect(savedRoute.user_id).toBe('user-456');
      expect(savedRoute.name).toBe('Test Route');
      expect(savedRoute.route_data).toEqual(mockRoute);
      expect(savedRoute.is_public).toBe(false);
      expect(savedRoute.tags).toEqual(['hiking', 'mountains']);
    });
  });

  describe('UserPreferences Interface', () => {
    it('should have correct default preferences', () => {
      const prefs = DEFAULT_USER_PREFERENCES;

      expect(prefs.default_pathfinding_options).toEqual(DEFAULT_PATHFINDING_OPTIONS);
      expect(prefs.favorite_regions).toEqual([]);
      expect(prefs.difficulty_preference).toBe('moderate');
      expect(prefs.trail_preference).toBe('trails_preferred');
      expect(prefs.units).toBe('metric');
    });
  });

  describe('RouteMetadata Interface', () => {
    it('should calculate metadata correctly', () => {
      const metadata: RouteMetadata = {
        total_distance: 10.5,
        total_elevation_gain: 800,
        estimated_duration: 4.5,
        difficulty_score: 7.2,
        trail_percentage: 85,
        regions_covered: ['Alps', 'Swiss Mountains']
      };

      expect(metadata.total_distance).toBe(10.5);
      expect(metadata.total_elevation_gain).toBe(800);
      expect(metadata.estimated_duration).toBe(4.5);
      expect(metadata.difficulty_score).toBe(7.2);
      expect(metadata.trail_percentage).toBe(85);
      expect(metadata.regions_covered).toEqual(['Alps', 'Swiss Mountains']);
    });
  });

  describe('toDatabaseRoute', () => {
    it('should convert Route to DatabaseRoute correctly', () => {
      const userId = 'user-456';
      const pathfindingOptions = DEFAULT_PATHFINDING_OPTIONS;
      const isPublic = true;
      const tags = ['test', 'hiking'];

      const dbRoute = toDatabaseRoute(mockRoute, userId, pathfindingOptions, isPublic, tags);

      expect(dbRoute.id).toBe(mockRoute.id);
      expect(dbRoute.user_id).toBe(userId);
      expect(dbRoute.name).toBe(mockRoute.name);
      expect(dbRoute.route_data).toEqual(mockRoute);
      expect(dbRoute.pathfinding_options).toEqual(pathfindingOptions);
      expect(dbRoute.is_public).toBe(isPublic);
      expect(dbRoute.tags).toEqual(tags);
      expect(dbRoute.created_at).toBeDefined();
      expect(dbRoute.updated_at).toBeDefined();
    });

    it('should handle optional parameters', () => {
      const userId = 'user-456';
      const pathfindingOptions = DEFAULT_PATHFINDING_OPTIONS;

      const dbRoute = toDatabaseRoute(mockRoute, userId, pathfindingOptions);

      expect(dbRoute.is_public).toBe(false);
      expect(dbRoute.tags).toEqual([]);
    });
  });

  describe('fromDatabaseRoute', () => {
    it('should convert DatabaseRoute to Route correctly', () => {
      const dbRoute: DatabaseRoute = {
        id: 'route-123',
        user_id: 'user-456',
        name: 'Test Route',
        route_data: mockRoute,
        pathfinding_options: DEFAULT_PATHFINDING_OPTIONS,
        is_public: false,
        tags: ['hiking'],
        created_at: '2025-01-01T10:00:00Z',
        updated_at: '2025-01-01T10:00:00Z'
      };

      const route = fromDatabaseRoute(dbRoute);

      expect(route).toEqual(mockRoute);
    });

    it('should preserve route data exactly', () => {
      const dbRoute: DatabaseRoute = {
        id: 'route-123',
        user_id: 'user-456',
        name: 'Different Name', // This should not affect the route data
        route_data: mockRoute,
        pathfinding_options: DEFAULT_PATHFINDING_OPTIONS,
        is_public: false,
        tags: [],
        created_at: '2025-01-01T10:00:00Z',
        updated_at: '2025-01-01T10:00:00Z'
      };

      const route = fromDatabaseRoute(dbRoute);

      // Route data should be preserved, not overridden by database fields
      expect(route.name).toBe(mockRoute.name);
      expect(route.id).toBe(mockRoute.id);
    });
  });

  describe('createUserPreferences', () => {
    it('should create user preferences with defaults', () => {
      const userId = 'user-123';
      const prefs = createUserPreferences(userId);

      expect(prefs.user_id).toBe(userId);
      expect(prefs.default_pathfinding_options).toEqual(DEFAULT_PATHFINDING_OPTIONS);
      expect(prefs.favorite_regions).toEqual([]);
      expect(prefs.difficulty_preference).toBe('moderate');
      expect(prefs.trail_preference).toBe('trails_preferred');
      expect(prefs.units).toBe('metric');
      expect(prefs.created_at).toBeDefined();
      expect(prefs.updated_at).toBeDefined();
    });

    it('should allow custom preferences', () => {
      const userId = 'user-123';
      const customOptions = {
        difficulty_preference: 'hard' as const,
        trail_preference: 'roads_only' as const,
        units: 'imperial' as const
      };

      const prefs = createUserPreferences(userId, customOptions);

      expect(prefs.difficulty_preference).toBe('hard');
      expect(prefs.trail_preference).toBe('roads_only');
      expect(prefs.units).toBe('imperial');
    });
  });
});