'use client';

import { useState, useCallback, useRef } from 'react';
import { Header } from '@/components/layouts/header';
import { EnhancedRouteInputForm } from '@/components/forms/enhanced-route-input-form';
import { ElevationChart } from '@/components/ui/elevation-chart';
import { RouteMap } from '@/components/ui/route-map';
import { RouteSummaryCard } from '@/components/ui/semantic/route-summary-card';
import { PathfindingControls } from '@/components/ui/pathfinding-controls';
import { AuthModal } from '@/components/auth/auth-modal';
import { Coordinate, Route } from '@/types/route';
import { PathfindingOptions, DEFAULT_PATHFINDING_OPTIONS } from '@/types/pathfinding';
import { findOptimalRoute } from '@/lib/algorithms/pathfinding';
import { calculateDistance, calculateElevationGain } from '@/lib/utils';
import { debounce, pathfindingRateLimiter } from '@/lib/utils/rate-limiter';
import { UI_TEXT } from '@/constants/ui-text';
import { STYLES } from '@/constants/styles';

export default function Home() {
  const [currentRoute, setCurrentRoute] = useState<Route | null>(null);
  const [loading, setLoading] = useState(false);
  const [pathfindingOptions, setPathfindingOptions] = useState<PathfindingOptions>(DEFAULT_PATHFINDING_OPTIONS);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const mapRef = useRef<HTMLDivElement>(null);

  const handleRouteSubmitInternal = useCallback(async (start: Coordinate, end: Coordinate) => {
    // Check rate limiting
    if (!pathfindingRateLimiter.isAllowed('pathfinding')) {
      const timeUntilReset = pathfindingRateLimiter.getTimeUntilReset('pathfinding');
      alert(`Too many pathfinding requests. Please wait ${Math.ceil(timeUntilReset / 1000)} seconds before trying again.`);
      return;
    }

    setLoading(true);
    try {
      const routePoints = await findOptimalRoute(start, end, pathfindingOptions);
      
      if (routePoints.length === 0) {
        throw new Error(UI_TEXT.NO_ROUTE_FOUND);
      }

      const distance = routePoints.reduce((total, point, index) => {
        if (index === 0) return 0;
        return total + calculateDistance(routePoints[index - 1], point);
      }, 0);

      const elevationGain = calculateElevationGain(routePoints);
      
      const getDifficulty = (distance: number, elevationGain: number) => {
        const difficultyScore = distance + (elevationGain / 100);
        if (difficultyScore < 5) return 'easy';
        if (difficultyScore < 15) return 'moderate';
        if (difficultyScore < 25) return 'hard';
        return 'extreme';
      };

      const estimateTime = (distance: number, elevationGain: number) => {
        // Use realistic hiking speeds: 4-5 km/h on flat terrain
        const baseTime = distance / 4.5; // 4.5 km/h base speed
        // Add time for elevation gain: Naismith's rule (10 minutes per 100m elevation)
        const elevationTime = elevationGain / 600; // 600m per hour climbing rate
        return Math.round(baseTime + elevationTime);
      };

      const route: Route = {
        id: `route-${Date.now()}`,
        name: UI_TEXT.OPTIMIZED_ALPINE_ROUTE,
        start,
        end,
        points: routePoints,
        distance: Math.round(distance * 10) / 10,
        elevationGain: Math.round(elevationGain),
        difficulty: getDifficulty(distance, elevationGain),
        estimatedTime: estimateTime(distance, elevationGain),
        createdAt: new Date()
      };
      
      setCurrentRoute(route);
    } catch (error) {
      console.error('Error planning route:', error);
      alert(UI_TEXT.ERROR_PLANNING_ROUTE);
    } finally {
      setLoading(false);
    }
  }, [pathfindingOptions]);

  // Create a debounced version for route submission using useRef
  const debouncedSubmitRef = useRef<((start: Coordinate, end: Coordinate) => void) | null>(null);
  
  const handleRouteSubmit = useCallback(
    (start: Coordinate, end: Coordinate) => {
      if (!debouncedSubmitRef.current) {
        debouncedSubmitRef.current = debounce(handleRouteSubmitInternal, 1000);
      }
      debouncedSubmitRef.current(start, end);
    },
    [handleRouteSubmitInternal]
  );

  const handleMapReady = useCallback(() => {
    // Scroll to map when it's ready
    if (mapRef.current) {
      mapRef.current.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
      });
    }
  }, []);

  /**
   * Handle successful route save
   */
  const handleSaveSuccess = useCallback(() => {
    // Show success feedback with native browser notification
    alert(UI_TEXT.SAVE_SUCCESS);
  }, []);

  /**
   * Handle route save error
   */
  const handleSaveError = useCallback((error: string) => {
    console.error('Route save failed:', error);
    // Error is already shown in the save dialog, no need for additional alert
  }, []);

  /**
   * Handle authentication required for saving
   */
  const handleAuthRequired = useCallback(() => {
    setIsAuthModalOpen(true);
  }, []);

  /**
   * Close authentication modal
   */
  const handleCloseAuthModal = useCallback(() => {
    setIsAuthModalOpen(false);
  }, []);

  return (
    <div className={`min-h-screen ${STYLES.BG_GRAY_50}`}>
      <Header />
      
      <main className={`${STYLES.CONTAINER} py-8`}>
        <div className={`${STYLES.MAX_WIDTH_4XL} ${STYLES.SPACE_Y_8}`}>
          {/* WIP Disclaimer */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-medium text-yellow-800">
                  Work in Progress
                </h3>
                <p className="mt-1 text-sm text-yellow-700">
                  This is an experimental project. The pathfinding algorithm is still under development and may generate inefficient routes that don&apos;t properly follow established trails or roads. Results should be used for demonstration purposes only and not for actual hiking navigation.
                </p>
              </div>
            </div>
          </div>

          <div className={`${STYLES.TEXT_CENTER} ${STYLES.SPACE_Y_4}`}>
            <h2 className={`${STYLES.HEADING_3XL}`}>
              {UI_TEXT.HERO_TITLE}
            </h2>
            <p className={`${STYLES.TEXT_LG_GRAY} ${STYLES.MAX_WIDTH_2XL}`}>
              {UI_TEXT.HERO_DESCRIPTION}
            </p>
          </div>

          <EnhancedRouteInputForm onRouteSubmit={handleRouteSubmit} loading={loading} />

          <PathfindingControls 
            options={pathfindingOptions}
            onOptionsChange={setPathfindingOptions}
            isCalculating={loading}
          />

          {currentRoute && (
            <>
              <RouteSummaryCard 
                route={currentRoute} 
                pathfindingOptions={pathfindingOptions}
                onSaveSuccess={handleSaveSuccess}
                onSaveError={handleSaveError}
                onAuthRequired={handleAuthRequired}
              />
              <div ref={mapRef}>
                <RouteMap points={currentRoute.points} onMapReady={handleMapReady} />
              </div>
              <ElevationChart points={currentRoute.points} />
            </>
          )}
        </div>
      </main>

      {/* Auth Modal for Route Saving */}
      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={handleCloseAuthModal}
        defaultMode="login"
      />
    </div>
  );
}