/**
 * Database type definitions for route persistence
 */

import { Route, Coordinate } from './route';
import { PathfindingOptions, DEFAULT_PATHFINDING_OPTIONS } from './pathfinding';

/**
 * Saved route in database format
 */
export interface SavedRoute {
  id: string;
  user_id: string;
  name: string;
  route_data: Route;
  pathfinding_options: PathfindingOptions;
  is_public: boolean;
  tags: string[];
  created_at: string;
  updated_at: string;
}

/**
 * Database route type (matches Supabase table structure)
 */
export type DatabaseRoute = SavedRoute;

/**
 * User preferences stored in database
 */
export interface UserPreferences {
  user_id: string;
  default_pathfinding_options: PathfindingOptions;
  favorite_regions: BoundingBox[];
  difficulty_preference: 'easy' | 'moderate' | 'hard' | 'extreme';
  trail_preference: 'roads_only' | 'trails_preferred' | 'mixed';
  units: 'metric' | 'imperial';
  created_at: string;
  updated_at: string;
}

/**
 * Geographic bounding box for favorite regions
 */
export interface BoundingBox {
  name: string;
  north: number;
  south: number;
  east: number;
  west: number;
}

/**
 * Route metadata for analytics and search
 */
export interface RouteMetadata {
  total_distance: number;
  total_elevation_gain: number;
  estimated_duration: number;
  difficulty_score: number;
  trail_percentage: number;
  regions_covered: string[];
}

/**
 * Default user preferences
 */
export const DEFAULT_USER_PREFERENCES: Omit<UserPreferences, 'user_id' | 'created_at' | 'updated_at'> = {
  default_pathfinding_options: DEFAULT_PATHFINDING_OPTIONS,
  favorite_regions: [],
  difficulty_preference: 'moderate',
  trail_preference: 'trails_preferred',
  units: 'metric'
};

/**
 * Convert a Route to DatabaseRoute format
 * @param route Route object to convert
 * @param userId User ID who owns the route
 * @param pathfindingOptions Pathfinding options used
 * @param isPublic Whether route should be public
 * @param tags Optional tags for the route
 * @returns DatabaseRoute ready for storage
 */
export function toDatabaseRoute(
  route: Route,
  userId: string,
  pathfindingOptions: PathfindingOptions,
  isPublic: boolean = false,
  tags: string[] = []
): DatabaseRoute {
  const now = new Date().toISOString();
  
  return {
    id: route.id,
    user_id: userId,
    name: route.name,
    route_data: route,
    pathfinding_options: pathfindingOptions,
    is_public: isPublic,
    tags,
    created_at: now,
    updated_at: now
  };
}

/**
 * Convert a DatabaseRoute back to Route format
 * @param dbRoute DatabaseRoute from storage
 * @returns Route object for use in application
 */
export function fromDatabaseRoute(dbRoute: DatabaseRoute): Route {
  // Return the stored route data directly
  return dbRoute.route_data;
}

/**
 * Create user preferences with defaults
 * @param userId User ID
 * @param overrides Optional preference overrides
 * @returns UserPreferences object
 */
export function createUserPreferences(
  userId: string,
  overrides: Partial<Omit<UserPreferences, 'user_id' | 'created_at' | 'updated_at'>> = {}
): UserPreferences {
  const now = new Date().toISOString();
  
  return {
    user_id: userId,
    ...DEFAULT_USER_PREFERENCES,
    ...overrides,
    created_at: now,
    updated_at: now
  };
}

/**
 * Calculate route metadata for analytics
 * @param route Route to analyze
 * @returns RouteMetadata object
 */
export function calculateRouteMetadata(route: Route): RouteMetadata {
  // Calculate trail percentage (simplified - in real implementation would check against trail data)
  const trailPercentage = Math.round(Math.random() * 100); // Placeholder
  
  // Calculate difficulty score (0-10 scale)
  const difficultyMap = { easy: 2.5, moderate: 5.0, hard: 7.5, extreme: 9.5 };
  const difficultyScore = difficultyMap[route.difficulty];
  
  // Estimate regions covered (simplified)
  const regions = estimateRegionsCovered(route.start);
  
  return {
    total_distance: route.distance,
    total_elevation_gain: route.elevationGain,
    estimated_duration: route.estimatedTime / 3600, // Convert seconds to hours
    difficulty_score: difficultyScore,
    trail_percentage: trailPercentage,
    regions_covered: regions
  };
}

/**
 * Estimate geographic regions covered by a route
 * @param start Starting coordinate
 * @returns Array of region names
 */
function estimateRegionsCovered(start: Coordinate): string[] {
  // Simplified region detection based on coordinates
  // In a real implementation, this would use proper geographic data
  const regions: string[] = [];
  
  // European Alps region (rough approximation)
  if (start.lat >= 45 && start.lat <= 48 && start.lng >= 6 && start.lng <= 17) {
    regions.push('Alps');
  }
  
  // Swiss region
  if (start.lat >= 45.8 && start.lat <= 47.8 && start.lng >= 5.9 && start.lng <= 10.5) {
    regions.push('Switzerland');
  }
  
  // Add more region detection logic as needed
  if (regions.length === 0) {
    regions.push('Unknown Region');
  }
  
  return regions;
}