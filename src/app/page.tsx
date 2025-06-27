'use client';

import { useState } from 'react';
import { Header } from '@/components/layouts/header';
import { RouteInputForm } from '@/components/forms/route-input-form';
import { ElevationChart } from '@/components/ui/elevation-chart';
import { RouteMap } from '@/components/ui/route-map';
import { RouteSummaryCard } from '@/components/ui/semantic/route-summary-card';
import { PathfindingControls } from '@/components/ui/pathfinding-controls';
import { Coordinate, Route } from '@/types/route';
import { PathfindingOptions, DEFAULT_PATHFINDING_OPTIONS } from '@/types/pathfinding';
import { findOptimalRoute } from '@/lib/algorithms/pathfinding';
import { calculateDistance, calculateElevationGain } from '@/lib/utils';
import { UI_TEXT } from '@/constants/ui-text';
import { STYLES } from '@/constants/styles';

export default function Home() {
  const [currentRoute, setCurrentRoute] = useState<Route | null>(null);
  const [loading, setLoading] = useState(false);
  const [pathfindingOptions, setPathfindingOptions] = useState<PathfindingOptions>(DEFAULT_PATHFINDING_OPTIONS);

  const handleRouteSubmit = async (start: Coordinate, end: Coordinate) => {
    setLoading(true);
    try {
      console.log('Planning route from:', start, 'to:', end);
      
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
  };

  return (
    <div className={`min-h-screen ${STYLES.BG_GRAY_50}`}>
      <Header />
      
      <main className={`${STYLES.CONTAINER} py-8`}>
        <div className={`${STYLES.MAX_WIDTH_4XL} ${STYLES.SPACE_Y_8}`}>
          <div className={`${STYLES.TEXT_CENTER} ${STYLES.SPACE_Y_4}`}>
            <h2 className={`${STYLES.HEADING_3XL}`}>
              {UI_TEXT.HERO_TITLE}
            </h2>
            <p className={`${STYLES.TEXT_LG_GRAY} ${STYLES.MAX_WIDTH_2XL}`}>
              {UI_TEXT.HERO_DESCRIPTION}
            </p>
          </div>

          <RouteInputForm onRouteSubmit={handleRouteSubmit} loading={loading} />

          <PathfindingControls 
            options={pathfindingOptions}
            onOptionsChange={setPathfindingOptions}
            isCalculating={loading}
          />

          {currentRoute && (
            <>
              <RouteSummaryCard route={currentRoute} />
              <RouteMap points={currentRoute.points} />
              <ElevationChart points={currentRoute.points} />
            </>
          )}
        </div>
      </main>
    </div>
  );
}