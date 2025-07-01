/**
 * Route loading and management operations
 */

import { getUserRoutes, getPublicRoutes, searchRoutes, RoutesResult } from './routes';
import { fromDatabaseRoute, DatabaseRoute } from '../../types/database';
import { Route } from '../../types/route';
import { PathfindingOptions } from '../../types/pathfinding';

/**
 * Loaded route with metadata
 */
export interface LoadedRoute {
  route: Route;
  pathfindingOptions: PathfindingOptions;
  isPublic: boolean;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  userId: string;
}

/**
 * Result wrapper for route loading operations
 */
export interface RouteLoadResult {
  success: boolean;
  data: LoadedRoute[] | null;
  error: any;
}

/**
 * Convert DatabaseRoute to LoadedRoute
 * @param dbRoute Database route to convert
 * @returns LoadedRoute with all metadata
 */
export function toLoadedRoute(dbRoute: DatabaseRoute): LoadedRoute {
  return {
    route: fromDatabaseRoute(dbRoute),
    pathfindingOptions: dbRoute.pathfinding_options,
    isPublic: dbRoute.is_public,
    tags: dbRoute.tags,
    createdAt: new Date(dbRoute.created_at),
    updatedAt: new Date(dbRoute.updated_at),
    userId: dbRoute.user_id
  };
}

/**
 * Load user's saved routes with full metadata
 * @param userId User ID to load routes for
 * @param offset Starting offset for pagination (default: 0)
 * @param limit Maximum number of routes to load (default: 50)
 * @returns Operation result with loaded routes or error
 */
export async function loadUserRoutes(
  userId: string,
  offset: number = 0,
  limit: number = 50
): Promise<RouteLoadResult> {
  try {
    const result = await getUserRoutes(userId, offset, limit);
    
    if (!result.success || !result.data) {
      return {
        success: false,
        data: null,
        error: result.error
      };
    }

    const loadedRoutes = result.data.map(toLoadedRoute);

    return {
      success: true,
      data: loadedRoutes,
      error: null
    };
  } catch (error) {
    return {
      success: false,
      data: null,
      error: {
        message: error instanceof Error ? error.message : 'Failed to load user routes',
        code: 'LOAD_ERROR'
      }
    };
  }
}

/**
 * Load public routes that can be viewed by all users
 * @param offset Starting offset for pagination (default: 0)
 * @param limit Maximum number of routes to load (default: 50)
 * @returns Operation result with loaded public routes or error
 */
export async function loadPublicRoutes(
  offset: number = 0,
  limit: number = 50
): Promise<RouteLoadResult> {
  try {
    const result = await getPublicRoutes(offset, limit);
    
    if (!result.success || !result.data) {
      return {
        success: false,
        data: null,
        error: result.error
      };
    }

    const loadedRoutes = result.data.map(toLoadedRoute);

    return {
      success: true,
      data: loadedRoutes,
      error: null
    };
  } catch (error) {
    return {
      success: false,
      data: null,
      error: {
        message: error instanceof Error ? error.message : 'Failed to load public routes',
        code: 'LOAD_ERROR'
      }
    };
  }
}

/**
 * Search for routes with full metadata
 * @param query Search query string
 * @param userId Optional user ID to filter by user's routes
 * @param includePublic Whether to include public routes in search (default: true)
 * @param offset Starting offset for pagination (default: 0)
 * @param limit Maximum number of routes to load (default: 20)
 * @returns Operation result with matching routes or error
 */
export async function searchAndLoadRoutes(
  query: string,
  userId?: string,
  includePublic: boolean = true,
  offset: number = 0,
  limit: number = 20
): Promise<RouteLoadResult> {
  try {
    const result = await searchRoutes(query, userId, includePublic, offset, limit);
    
    if (!result.success || !result.data) {
      return {
        success: false,
        data: null,
        error: result.error
      };
    }

    const loadedRoutes = result.data.map(toLoadedRoute);

    return {
      success: true,
      data: loadedRoutes,
      error: null
    };
  } catch (error) {
    return {
      success: false,
      data: null,
      error: {
        message: error instanceof Error ? error.message : 'Failed to search routes',
        code: 'SEARCH_ERROR'
      }
    };
  }
}

/**
 * Get routes by tags
 * @param tags Array of tags to search for
 * @param userId Optional user ID to filter by user's routes
 * @param includePublic Whether to include public routes (default: true)
 * @param limit Maximum number of routes to load (default: 20)
 * @returns Operation result with tagged routes or error
 */
export async function loadRoutesByTags(
  tags: string[],
  userId?: string,
  includePublic: boolean = true,
  limit: number = 20
): Promise<RouteLoadResult> {
  try {
    // Search for routes matching any of the provided tags
    const searchPromises = tags.map(tag => 
      searchRoutes(tag, userId, includePublic, 0, limit)
    );

    const results = await Promise.all(searchPromises);
    
    // Combine and deduplicate results
    const allRoutes: DatabaseRoute[] = [];
    const seenIds = new Set<string>();

    for (const result of results) {
      if (result.success && result.data) {
        for (const route of result.data) {
          if (!seenIds.has(route.id)) {
            seenIds.add(route.id);
            allRoutes.push(route);
          }
        }
      }
    }

    // Sort by creation date (newest first) and limit results
    allRoutes.sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    const limitedRoutes = allRoutes.slice(0, limit);
    const loadedRoutes = limitedRoutes.map(toLoadedRoute);

    return {
      success: true,
      data: loadedRoutes,
      error: null
    };
  } catch (error) {
    return {
      success: false,
      data: null,
      error: {
        message: error instanceof Error ? error.message : 'Failed to load routes by tags',
        code: 'LOAD_BY_TAGS_ERROR'
      }
    };
  }
}

/**
 * Load a single route with just the route data (for pathfinding)
 * @param loadedRoute LoadedRoute to extract route from
 * @returns Route object ready for pathfinding
 */
export function extractRouteForPathfinding(loadedRoute: LoadedRoute): Route {
  return loadedRoute.route;
}

/**
 * Load pathfinding options from a saved route
 * @param loadedRoute LoadedRoute to extract options from
 * @returns PathfindingOptions used to create the route
 */
export function extractPathfindingOptions(loadedRoute: LoadedRoute): PathfindingOptions {
  return loadedRoute.pathfindingOptions;
}