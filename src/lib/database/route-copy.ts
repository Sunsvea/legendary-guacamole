/**
 * Route copying functionality
 */

import { v4 as uuidv4 } from 'uuid';
import { getSupabaseClient } from '../supabase';
import { DatabaseRoute, toDatabaseRoute } from '../../types/database';
import { RouteOperationResult } from './routes';

/**
 * Options for copying a route
 */
interface CopyRouteOptions {
  name?: string;
  isPublic?: boolean;
  tags?: string[];
}

/**
 * Copy a route to a new user's collection
 * @param originalRoute The route to copy
 * @param targetUserId The user ID to copy the route to
 * @param options Optional customization for the copied route
 * @returns Operation result with copied route data or error
 */
export async function copyRouteToUser(
  originalRoute: DatabaseRoute,
  targetUserId: string,
  options?: CopyRouteOptions
): Promise<RouteOperationResult> {
  try {
    // Prevent copying own routes
    if (originalRoute.user_id === targetUserId) {
      return {
        success: false,
        data: null,
        error: {
          message: 'Cannot copy your own route',
          code: 'COPY_OWN_ROUTE'
        }
      };
    }

    const supabase = getSupabaseClient();
    
    // Generate new IDs for the copied route and route data
    const newRouteId = uuidv4();
    const newRouteDataId = uuidv4();
    
    // Determine copied route name
    const copiedName = options?.name || generateCopiedRouteName(originalRoute.name);
    
    // Create copied route data with new IDs
    const copiedRouteData = {
      ...originalRoute.route_data,
      id: newRouteDataId,
      name: copiedName,
    };

    // Create the copied route object
    const copiedRoute = toDatabaseRoute(
      copiedRouteData,
      targetUserId,
      originalRoute.pathfinding_options,
      options?.isPublic ?? false, // Default to private
      options?.tags ?? originalRoute.tags
    );

    // Override the ID with our generated one
    copiedRoute.id = newRouteId;
    copiedRoute.name = copiedName;

    const { data, error } = await supabase
      .from('routes')
      .insert(copiedRoute)
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
        message: error instanceof Error ? error.message : 'Failed to copy route',
        code: 'COPY_ERROR'
      }
    };
  }
}

/**
 * Generate a name for a copied route
 * @param originalName The original route name
 * @returns A new name with copy suffix
 */
export function generateCopiedRouteName(originalName: string): string {
  if (!originalName || originalName.trim() === '') {
    return 'Untitled Route (Copy)';
  }

  const trimmedName = originalName.trim();
  
  // Check if name already has (Copy) suffix
  const copyRegex = /^(.+?)\s*\(Copy(?:\s+(\d+))?\)$/;
  const match = trimmedName.match(copyRegex);
  
  if (match) {
    const baseName = match[1];
    const currentNumber = match[2] ? parseInt(match[2], 10) : 1;
    const newNumber = currentNumber + 1;
    const newName = `${baseName} (Copy ${newNumber})`;
    
    // Ensure we don't exceed typical database limits
    return newName.length > 255 ? `${baseName.substring(0, 240)} (Copy ${newNumber})` : newName;
  }
  
  // First copy
  const newName = `${trimmedName} (Copy)`;
  
  // Ensure we don't exceed typical database limits
  return newName.length > 255 ? `${trimmedName.substring(0, 248)} (Copy)` : newName;
}