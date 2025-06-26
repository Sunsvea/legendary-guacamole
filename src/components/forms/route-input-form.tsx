'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MapPin, Navigation } from 'lucide-react';
import { Coordinate } from '@/types/route';

interface RouteInputFormProps {
  onRouteSubmit: (start: Coordinate, end: Coordinate) => void;
  loading?: boolean;
}

export function RouteInputForm({ onRouteSubmit, loading = false }: RouteInputFormProps) {
  const [startLat, setStartLat] = useState('');
  const [startLng, setStartLng] = useState('');
  const [endLat, setEndLat] = useState('');
  const [endLng, setEndLng] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!startLat || !startLng || !endLat || !endLng) {
      alert('Please fill in all coordinates');
      return;
    }

    const start: Coordinate = {
      lat: parseFloat(startLat),
      lng: parseFloat(startLng),
    };

    const end: Coordinate = {
      lat: parseFloat(endLat),
      lng: parseFloat(endLng),
    };

    if (isNaN(start.lat) || isNaN(start.lng) || isNaN(end.lat) || isNaN(end.lng)) {
      alert('Please enter valid coordinates');
      return;
    }

    onRouteSubmit(start, end);
  };

  const fillExampleRoute = () => {
    setStartLat('46.5197');
    setStartLng('7.4815');
    setEndLat('46.5584');
    setEndLng('7.4969');
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center space-x-2 mb-4">
        <Navigation className="h-5 w-5 text-blue-600" />
        <h2 className="text-xl font-semibold text-gray-900">Plan Your Route</h2>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="flex items-center space-x-2 text-sm font-medium text-gray-700">
              <MapPin className="h-4 w-4 text-green-600" />
              <span>Start Point</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              <Input
                type="number"
                step="any"
                placeholder="Latitude"
                value={startLat}
                onChange={(e) => setStartLat(e.target.value)}
                disabled={loading}
              />
              <Input
                type="number"
                step="any"
                placeholder="Longitude"
                value={startLng}
                onChange={(e) => setStartLng(e.target.value)}
                disabled={loading}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="flex items-center space-x-2 text-sm font-medium text-gray-700">
              <MapPin className="h-4 w-4 text-red-600" />
              <span>End Point</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              <Input
                type="number"
                step="any"
                placeholder="Latitude"
                value={endLat}
                onChange={(e) => setEndLat(e.target.value)}
                disabled={loading}
              />
              <Input
                type="number"
                step="any"
                placeholder="Longitude"
                value={endLng}
                onChange={(e) => setEndLng(e.target.value)}
                disabled={loading}
              />
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <Button type="submit" disabled={loading} className="flex-1">
            {loading ? 'Finding Route...' : 'Find Optimal Route'}
          </Button>
          <Button 
            type="button" 
            variant="outline" 
            onClick={fillExampleRoute}
            disabled={loading}
          >
            Use Example (Interlaken to Jungfraujoch)
          </Button>
        </div>
      </form>

      <div className="mt-4 p-3 bg-blue-50 rounded-lg">
        <p className="text-sm text-blue-800">
          <strong>Tip:</strong> Enter coordinates in decimal degrees. Positive latitude = North, 
          Positive longitude = East. Example: Matterhorn is at 45.9763, 7.6586
        </p>
      </div>
    </div>
  );
}