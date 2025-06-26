'use client';

import { useState } from 'react';
import { Header } from '@/components/layouts/header';
import { RouteInputForm } from '@/components/forms/route-input-form';
import { Coordinate, Route } from '@/types/route';

export default function Home() {
  const [currentRoute, setCurrentRoute] = useState<Route | null>(null);
  const [loading, setLoading] = useState(false);

  const handleRouteSubmit = async (start: Coordinate, end: Coordinate) => {
    setLoading(true);
    try {
      console.log('Planning route from:', start, 'to:', end);
      
      // TODO: Implement actual route calculation
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Mock route for now
      const mockRoute: Route = {
        id: 'mock-route-1',
        name: 'Alpine Route',
        start,
        end,
        points: [
          { ...start, elevation: 1200 },
          { lat: (start.lat + end.lat) / 2, lng: (start.lng + end.lng) / 2, elevation: 2100 },
          { ...end, elevation: 1800 }
        ],
        distance: 12.5,
        elevationGain: 900,
        difficulty: 'moderate',
        estimatedTime: 6,
        createdAt: new Date()
      };
      
      setCurrentRoute(mockRoute);
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
          )}
        </div>
      </main>
    </div>
  );
}