'use client';

import { useState } from 'react';
import { Header } from '@/components/layouts/header';
import { RouteInputForm } from '@/components/forms/route-input-form';
import { ElevationChart } from '@/components/ui/elevation-chart';
import { RouteMap } from '@/components/ui/route-map';
import { Coordinate, Route } from '@/types/route';
import { findOptimalRoute } from '@/lib/algorithms/pathfinding';
import { calculateDistance, calculateElevationGain } from '@/lib/utils';

export default function Home() {
  const [currentRoute, setCurrentRoute] = useState<Route | null>(null);
  const [loading, setLoading] = useState(false);

  const handleRouteSubmit = async (start: Coordinate, end: Coordinate) => {
    setLoading(true);
    try {
      console.log('Planning route from:', start, 'to:', end);
      
      const routePoints = await findOptimalRoute(start, end);
      
      if (routePoints.length === 0) {
        throw new Error('No route found');
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
        const baseTime = distance / 3;
        const elevationTime = elevationGain / 300;
        return Math.round(baseTime + elevationTime);
      };

      const route: Route = {
        id: `route-${Date.now()}`,
        name: 'Optimized Alpine Route',
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
      alert('Error planning route. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="text-center space-y-4">
            <h2 className="text-3xl font-bold text-gray-900">
              Optimize Your Alpine Adventures
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Plan the perfect mountain route with AI-powered pathfinding, 
              real-time weather data, and elevation analysis.
            </p>
          </div>

          <RouteInputForm onRouteSubmit={handleRouteSubmit} loading={loading} />

          {currentRoute && (
            <>
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Route Summary</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{currentRoute.distance}km</div>
                    <div className="text-sm text-gray-500">Distance</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{currentRoute.elevationGain}m</div>
                    <div className="text-sm text-gray-500">Elevation Gain</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600 capitalize">{currentRoute.difficulty}</div>
                    <div className="text-sm text-gray-500">Difficulty</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">{currentRoute.estimatedTime}h</div>
                    <div className="text-sm text-gray-500">Est. Time</div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <RouteMap points={currentRoute.points} />
                <ElevationChart points={currentRoute.points} />
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}