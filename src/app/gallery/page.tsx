/**
 * Public route gallery page
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { getPublicRoutes } from '@/lib/database/routes';
import { DatabaseRoute } from '@/types/database';
import { GalleryLayout } from '@/components/gallery/gallery-layout';
import { RouteGalleryGrid } from '@/components/gallery/route-gallery-grid';
import { GalleryFilters } from '@/components/gallery/gallery-filters';
import { STYLES } from '@/constants/styles';

/**
 * Gallery filter state
 */
interface GalleryFilters {
  searchQuery: string;
  difficulty: string | null;
  tags: string[];
  sortBy: 'newest' | 'oldest' | 'distance' | 'difficulty';
  minDistance: number | null;
  maxDistance: number | null;
}

/**
 * Public route gallery page component
 */
export default function GalleryPage() {
  const [routes, setRoutes] = useState<DatabaseRoute[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [, setSelectedRoute] = useState<DatabaseRoute | null>(null);
  const [filters, setFilters] = useState<GalleryFilters>({
    searchQuery: '',
    difficulty: null,
    tags: [],
    sortBy: 'newest',
    minDistance: null,
    maxDistance: null,
  });

  /**
   * Load public routes
   */
  const loadRoutes = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const result = await getPublicRoutes(0, 20);
      
      if (result.success && result.data) {
        setRoutes(result.data);
      } else {
        setError(result.error?.message || 'Failed to load routes');
      }
    } catch (err) {
      console.error('Error loading routes:', err);
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Filter and sort routes based on current filters
   */
  const filteredRoutes = routes.filter(route => {
    // Search query filter
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      if (!route.name.toLowerCase().includes(query) &&
          !route.tags.some(tag => tag.toLowerCase().includes(query))) {
        return false;
      }
    }

    // Difficulty filter
    if (filters.difficulty && route.route_data.difficulty !== filters.difficulty) {
      return false;
    }

    // Distance range filters
    if (filters.minDistance && route.route_data.distance < filters.minDistance) {
      return false;
    }
    if (filters.maxDistance && route.route_data.distance > filters.maxDistance) {
      return false;
    }

    // Tags filter
    if (filters.tags.length > 0) {
      const hasMatchingTag = filters.tags.some(filterTag => 
        route.tags.some(routeTag => routeTag.toLowerCase().includes(filterTag.toLowerCase()))
      );
      if (!hasMatchingTag) {
        return false;
      }
    }

    return true;
  }).sort((a, b) => {
    switch (filters.sortBy) {
      case 'newest':
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      case 'oldest':
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      case 'distance':
        return b.route_data.distance - a.route_data.distance;
      case 'difficulty':
        const difficultyOrder = { easy: 1, moderate: 2, hard: 3, extreme: 4 };
        return difficultyOrder[b.route_data.difficulty] - difficultyOrder[a.route_data.difficulty];
      default:
        return 0;
    }
  });

  /**
   * Handle route selection
   */
  const handleRouteSelect = (route: DatabaseRoute) => {
    setSelectedRoute(route);
    // TODO: Show route details modal or navigate to route detail page
  };

  /**
   * Handle filter changes
   */
  const handleFiltersChange = (newFilters: GalleryFilters) => {
    setFilters(newFilters);
    // Reload routes with new filters (for now, client-side filtering)
    loadRoutes();
  };

  /**
   * Load routes on component mount
   */
  useEffect(() => {
    loadRoutes();
  }, [loadRoutes]);

  // Show loading state
  if (loading) {
    return (
      <GalleryLayout>
        <div className={`${STYLES.FLEX_CENTER} py-12`}>
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-48 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-32"></div>
          </div>
        </div>
        <div className="sr-only">Loading routes...</div>
      </GalleryLayout>
    );
  }

  // Show error state
  if (error) {
    return (
      <GalleryLayout>
        <div className={`${STYLES.FLEX_CENTER} py-12`}>
          <div className={STYLES.TEXT_CENTER}>
            <h2 className={`${STYLES.HEADING_XL} text-red-600 mb-2`}>Error Loading Routes</h2>
            <p className={STYLES.TEXT_SM_GRAY}>{error}</p>
            <button
              onClick={loadRoutes}
              className={`${STYLES.BTN_PRIMARY} mt-4`}
            >
              Try Again
            </button>
          </div>
        </div>
      </GalleryLayout>
    );
  }

  // Show empty state
  if (routes.length === 0) {
    return (
      <GalleryLayout>
        <div className={`${STYLES.FLEX_CENTER} py-12`}>
          <div className={STYLES.TEXT_CENTER}>
            <h2 className={`${STYLES.HEADING_XL} mb-2`}>No Public Routes</h2>
            <p className={STYLES.TEXT_SM_GRAY}>
              No public routes have been shared yet. Be the first to share a route!
            </p>
          </div>
        </div>
      </GalleryLayout>
    );
  }

  return (
    <GalleryLayout>
      {/* Gallery Header */}
      <div className="mb-8">
        <h1 className={STYLES.HEADING_3XL}>Route Gallery</h1>
        <p className={STYLES.TEXT_LG_GRAY}>
          Discover and explore routes shared by the alpine community
        </p>
      </div>

      {/* Gallery Content */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar Filters */}
        <div className="lg:col-span-1">
          <GalleryFilters 
            filters={filters}
            onFiltersChange={handleFiltersChange}
          />
        </div>

        {/* Main Gallery Grid */}
        <div className="lg:col-span-3">
          <div className="mb-4">
            <p className={STYLES.TEXT_SM_GRAY}>
              Showing {filteredRoutes.length} of {routes.length} routes
            </p>
          </div>
          
          <RouteGalleryGrid 
            routes={filteredRoutes}
            onRouteSelect={handleRouteSelect}
          />
        </div>
      </div>
    </GalleryLayout>
  );
}