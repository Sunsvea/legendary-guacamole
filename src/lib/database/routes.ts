/**
 * Database operations for route persistence
 */

import { getSupabaseClient } from '../supabase';
import { Route } from '../../types/route';
import { DatabaseRoute, toDatabaseRoute } from '../../types/database';
import { PathfindingOptions } from '../../types/pathfinding';

/**
 * Result wrapper for route operations
 */
export interface RouteOperationResult {
  success: boolean;
  data: DatabaseRoute | null;
  error: { message: string; code?: string } | null;
}

/**
 * Result wrapper for multiple routes operations
 */
export interface RoutesResult {
  success: boolean;
  data: DatabaseRoute[] | null;
  error: { message: string; code?: string } | null;
}

/**
 * Result wrapper for delete operations
 */
export interface DeleteResult {
  success: boolean;
  error: { message: string; code?: string } | null;
}

/**
 * Save a route to the database
 * @param route Route to save
 * @param userId User ID who owns the route
 * @param pathfindingOptions Pathfinding options used to generate the route
 * @param isPublic Whether the route should be public (default: false)
 * @param tags Optional tags for the route (default: [])
 * @returns Operation result with saved route data or error
 */
export async function saveRoute(
  route: Route,
  userId: string,
  pathfindingOptions: PathfindingOptions,
  isPublic: boolean = false,
  tags: string[] = []
): Promise<RouteOperationResult> {
  try {
    const supabase = getSupabaseClient();
    const dbRoute = toDatabaseRoute(route, userId, pathfindingOptions, isPublic, tags);

    const { data, error } = await supabase
      .from('routes')
      .insert(dbRoute)
      .select()
      .single();

    if (error) {
      return {
        success: false,
        data: null,
        error
      };
    }

    return {
      success: true,
      data: data,
      error: null
    };
  } catch (error) {
    return {
      success: false,
      data: null,
      error: {
        message: error instanceof Error ? error.message : 'Failed to save route',
        code: 'SAVE_ERROR'
      }
    };
  }
}

/**
 * Get routes for a specific user
 * @param userId User ID to fetch routes for
 * @param offset Starting offset for pagination (default: 0)
 * @param limit Maximum number of routes to fetch (default: 50)
 * @returns Operation result with user's routes or error
 */
export async function getUserRoutes(
  userId: string,
  offset: number = 0,
  limit: number = 50
): Promise<RoutesResult> {
  try {
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
      .from('routes')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      return {
        success: false,
        data: null,
        error
      };
    }

    return {
      success: true,
      data: data || [],
      error: null
    };
  } catch (error) {
    return {
      success: false,
      data: null,
      error: {
        message: error instanceof Error ? error.message : 'Failed to fetch user routes',
        code: 'FETCH_ERROR'
      }
    };
  }
}

/**
 * Get public routes that can be viewed by all users
 * @param offset Starting offset for pagination (default: 0)
 * @param limit Maximum number of routes to fetch (default: 50)
 * @returns Operation result with public routes or error
 */
export async function getPublicRoutes(
  offset: number = 0,
  limit: number = 50
): Promise<RoutesResult> {
  try {
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
      .from('routes')
      .select('*')
      .eq('is_public', true)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      return {
        success: false,
        data: null,
        error
      };
    }

    return {
      success: true,
      data: data || [],
      error: null
    };
  } catch (error) {
    return {
      success: false,
      data: null,
      error: {
        message: error instanceof Error ? error.message : 'Failed to fetch public routes',
        code: 'FETCH_ERROR'
      }
    };
  }
}

/**
 * Update an existing route
 * @param routeId Route ID to update
 * @param userId User ID who owns the route (for security)
 * @param route Updated route data
 * @param pathfindingOptions Updated pathfinding options
 * @param isPublic Updated public status (optional)
 * @param tags Updated tags (optional)
 * @returns Operation result with updated route data or error
 */
export async function updateRoute(
  routeId: string,
  userId: string,
  route: Route,
  pathfindingOptions: PathfindingOptions,
  isPublic?: boolean,
  tags?: string[]
): Promise<RouteOperationResult> {
  try {
    const supabase = getSupabaseClient();
    
    const updateData: Partial<DatabaseRoute> = {
      route_data: route,
      pathfinding_options: pathfindingOptions,
      updated_at: new Date().toISOString()
    };

    if (isPublic !== undefined) {
      updateData.is_public = isPublic;
    }

    if (tags !== undefined) {
      updateData.tags = tags;
    }

    const { data, error } = await supabase
      .from('routes')
      .update(updateData)
      .eq('id', routeId)
      .eq('user_id', userId) // Ensure user owns the route
      .select()
      .single();

    if (error) {
      return {
        success: false,
        data: null,
        error
      };
    }

    return {
      success: true,
      data: data,
      error: null
    };
  } catch (error) {
    return {
      success: false,
      data: null,
      error: {
        message: error instanceof Error ? error.message : 'Failed to update route',
        code: 'UPDATE_ERROR'
      }
    };
  }
}

/**
 * Delete a route
 * @param routeId Route ID to delete
 * @param userId User ID who owns the route (for security)
 * @returns Operation result indicating success or error
 */
export async function deleteRoute(
  routeId: string,
  userId: string
): Promise<DeleteResult> {
  try {
    const supabase = getSupabaseClient();

    const { error } = await supabase
      .from('routes')
      .delete()
      .eq('id', routeId)
      .eq('user_id', userId); // Ensure user owns the route

    if (error) {
      return {
        success: false,
        error
      };
    }

    return {
      success: true,
      error: null
    };
  } catch (error) {
    return {
      success: false,
      error: {
        message: error instanceof Error ? error.message : 'Failed to delete route',
        code: 'DELETE_ERROR'
      }
    };
  }
}

/**
 * Search routes by name or tags
 * @param query Search query string
 * @param userId Optional user ID to filter by user's routes
 * @param includePublic Whether to include public routes in search (default: true)
 * @param offset Starting offset for pagination (default: 0)
 * @param limit Maximum number of routes to fetch (default: 20)
 * @returns Operation result with matching routes or error
 */
export async function searchRoutes(
  query: string,
  userId?: string,
  includePublic: boolean = true,
  offset: number = 0,
  limit: number = 20
): Promise<RoutesResult> {
  try {
    const supabase = getSupabaseClient();
    
    let queryBuilder = supabase
      .from('routes')
      .select('*');

    // Build where conditions
    if (userId && includePublic) {
      // Search user's routes OR public routes
      queryBuilder = queryBuilder
        .or(`user_id.eq.${userId},is_public.eq.true`);
    } else if (userId) {
      // Search only user's routes
      queryBuilder = queryBuilder.eq('user_id', userId);
    } else if (includePublic) {
      // Search only public routes
      queryBuilder = queryBuilder.eq('is_public', true);
    }

    // Add text search (simplified - in production would use full-text search)
    queryBuilder = queryBuilder
      .or(`name.ilike.%${query}%,tags.cs.["${query}"]`)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    const { data, error } = await queryBuilder;

    if (error) {
      return {
        success: false,
        data: null,
        error
      };
    }

    return {
      success: true,
      data: data || [],
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