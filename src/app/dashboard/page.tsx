/**
 * User dashboard page for route management
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { getUserRoutes } from '@/lib/database/routes';
import { DatabaseRoute } from '@/types/database';
import { DashboardLayout } from '@/components/dashboard/dashboard-layout';
import { RouteGrid } from '@/components/dashboard/route-grid';
import { RouteStatsummary } from '@/components/dashboard/route-stats-summary';
import { RouteSearchFilters } from '@/components/dashboard/route-search-filters';
import { RouteEmptyState } from '@/components/dashboard/route-empty-state';
import { AuthModal } from '@/components/auth/auth-modal';
import { UI_TEXT } from '@/constants/ui-text';
import { STYLES } from '@/constants/styles';

/**
 * Search and filter state for routes
 */
interface RouteFilters {
  searchQuery: string;
  difficulty: string | null;
  isPublic: boolean | null;
  sortBy: 'newest' | 'oldest' | 'distance' | 'difficulty';
}

/**
 * Dashboard page component
 */
export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const [routes, setRoutes] = useState<DatabaseRoute[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [filters, setFilters] = useState<RouteFilters>({
    searchQuery: '',
    difficulty: null,
    isPublic: null,
    sortBy: 'newest'
  });

  /**
   * Load user routes
   */
  const loadRoutes = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);
      
      const result = await getUserRoutes(user.id);
      
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
  }, [user]);

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

    // Privacy filter
    if (filters.isPublic !== null && route.is_public !== filters.isPublic) {
      return false;
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
   * Handle route deletion
   */
  const handleRouteDelete = (routeId: string) => {
    setRoutes(prev => prev.filter(route => route.id !== routeId));
  };

  /**
   * Handle route update
   */
  const handleRouteUpdate = (updatedRoute: DatabaseRoute) => {
    setRoutes(prev => prev.map(route => 
      route.id === updatedRoute.id ? updatedRoute : route
    ));
  };

  /**
   * Load routes when user changes
   */
  useEffect(() => {
    if (user) {
      loadRoutes();
    } else if (!authLoading) {
      setRoutes([]);
      setLoading(false);
    }
  }, [user, authLoading, loadRoutes]);

  // Show auth modal for unauthenticated users
  if (!authLoading && !user) {
    return (
      <>
        <div className={`min-h-screen ${STYLES.BG_GRAY_50} ${STYLES.FLEX_CENTER}`}>
          <div className={`${STYLES.MAX_WIDTH_2XL} ${STYLES.TEXT_CENTER} px-6`}>
            <h1 className={`${STYLES.HEADING_3XL} mb-4`}>
              {UI_TEXT.DASHBOARD_TITLE}
            </h1>
            <p className={`${STYLES.TEXT_LG_GRAY} mb-8`}>
              {UI_TEXT.SIGN_IN_TO_SAVE}
            </p>
            <button
              onClick={() => setIsAuthModalOpen(true)}
              className={STYLES.BTN_PRIMARY}
            >
              Sign In to View Dashboard
            </button>
          </div>
        </div>

        <AuthModal 
          isOpen={isAuthModalOpen} 
          onClose={() => setIsAuthModalOpen(false)}
          defaultMode="login"
        />
      </>
    );
  }

  // Show loading state
  if (authLoading || loading) {
    return (
      <DashboardLayout>
        <div className={`${STYLES.FLEX_CENTER} py-12`}>
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-48 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-32"></div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Show error state
  if (error) {
    return (
      <DashboardLayout>
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
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      {/* Dashboard Header */}
      <div className="mb-8">
        <h1 className={STYLES.HEADING_3XL}>{UI_TEXT.DASHBOARD_TITLE}</h1>
        <p className={STYLES.TEXT_LG_GRAY}>{UI_TEXT.DASHBOARD_SUBTITLE}</p>
      </div>

      {/* Dashboard Content */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar */}
        <div className="lg:col-span-1">
          <div className={STYLES.SPACE_Y_6}>
            <RouteStatsummary routes={routes} />
            <RouteSearchFilters 
              filters={filters}
              onFiltersChange={setFilters}
            />
          </div>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3">
          {filteredRoutes.length === 0 ? (
            <RouteEmptyState 
              hasRoutes={routes.length > 0}
              searchQuery={filters.searchQuery}
            />
          ) : (
            <RouteGrid 
              routes={filteredRoutes}
              onRouteDelete={handleRouteDelete}
              onRouteUpdate={handleRouteUpdate}
            />
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}