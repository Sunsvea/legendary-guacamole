/**
 * Enhanced route input form with interactive map and geolocation features
 */

'use client';

import { useState, useCallback } from 'react';
import { CoordinateSelectorMap } from '@/components/ui/coordinate-selector-map';
import { MapPin, Navigation, ChevronDown } from 'lucide-react';
import { Coordinate } from '@/types/route';
import { UI_TEXT } from '@/constants/ui-text';
import { STYLES } from '@/constants/styles';
import { COLORS } from '@/constants/colors';
import { FindOptimalRouteButton } from '@/components/ui/semantic/find-optimal-route-button';

interface EnhancedRouteInputFormProps {
  onRouteSubmit: (start: Coordinate, end: Coordinate) => void;
  loading?: boolean;
}

type SelectionType = 'start' | 'end' | null;

const EXAMPLE_ROUTES = [
  {
    name: 'Swiss Alps, Zermatt',
    start: { lat: 46.624307431594055, lng: 8.04745577358767 },
    end: { lat: 46.57908871604088, lng: 8.006096923318134 }
  },
  {
    name: 'Phoenix Park, Dublin',
    start: { lat: 53.34841352201159, lng: -6.297309860287925 },
    end: { lat: 53.37087343417223, lng: -6.338561502846112 }
  },
  {
    name: 'Lansdowne Valley Park, Dublin',
    start: { lat: 53.32723383480651, lng: -6.331534745729302 },
    end: { lat: 53.334135166867014, lng: -6.326818212364081 }
  }
];

export function EnhancedRouteInputForm({ onRouteSubmit, loading = false }: EnhancedRouteInputFormProps) {
  const [selectionType, setSelectionType] = useState<SelectionType>('start');
  const [startCoordinate, setStartCoordinate] = useState<Coordinate | undefined>();
  const [endCoordinate, setEndCoordinate] = useState<Coordinate | undefined>();
  
  const [showExampleDropdown, setShowExampleDropdown] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!startCoordinate || !endCoordinate) {
      alert('Please select both start and end points on the map.');
      return;
    }

    onRouteSubmit(startCoordinate, endCoordinate);
  };

  const fillExampleRoute = (routeIndex: number = 0) => {
    const route = EXAMPLE_ROUTES[routeIndex];
    setStartCoordinate(route.start);
    setEndCoordinate(route.end);
    setShowExampleDropdown(false);
  };

  const handleLocationSelect = (location: Coordinate, type: 'start' | 'end') => {
    if (type === 'start') {
      setStartCoordinate(location);
    } else {
      setEndCoordinate(location);
    }
  };

  const handleMapCoordinateSelect = useCallback((coordinate: Coordinate, type: 'start' | 'end') => {
    handleLocationSelect(coordinate, type);
    setSelectionType(null); // Clear selection mode after selecting
  }, []);

  const handleStartSelection = () => {
    setSelectionType('start');
  };

  const handleEndSelection = () => {
    setSelectionType('end');
  };

  const hasStartPoint = !!startCoordinate;
  const hasEndPoint = !!endCoordinate;

  return (
    <div className={STYLES.CARD}>
      <div className={`${STYLES.FLEX_ITEMS_CENTER} mb-4`}>
        <Navigation className={`${STYLES.ICON_MD} ${COLORS.TEXT.BLUE} mr-2`} />
        <h2 className={STYLES.HEADING_XL}>{UI_TEXT.PLAN_YOUR_ROUTE}</h2>
      </div>

      <form onSubmit={handleSubmit} className={STYLES.FORM_SECTION}>
        {/* Map Input Mode - Always Visible */}
        <div className="space-y-6">
          {/* Selection Instructions */}
          <div className="text-center">
            <p className="text-blue-600 font-medium">
              {selectionType === 'start' ? 'Click on map to select start point' : 'Click on map to select end point'}
            </p>
          </div>

          {/* Selection Buttons */}
          <div className="flex justify-center space-x-4">
            <button
              type="button"
              onClick={handleStartSelection}
              disabled={loading || selectionType === 'start'}
              className={`px-4 py-2 rounded-lg border font-medium transition-colors ${
                selectionType === 'start'
                  ? 'bg-green-500 text-white border-green-500'
                  : hasStartPoint
                  ? 'bg-green-100 text-green-700 border-green-300'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              <MapPin className="w-4 h-4 mr-2 inline" />
              {hasStartPoint ? 'Start Point Selected' : 'Select Start Point'}
            </button>
            
            <button
              type="button"
              onClick={handleEndSelection}
              disabled={loading || selectionType === 'end'}
              className={`px-4 py-2 rounded-lg border font-medium transition-colors ${
                selectionType === 'end'
                  ? 'bg-red-500 text-white border-red-500'
                  : hasEndPoint
                  ? 'bg-red-100 text-red-700 border-red-300'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              <MapPin className="w-4 h-4 mr-2 inline" />
              {hasEndPoint ? 'End Point Selected' : 'Select End Point'}
            </button>
          </div>

          {/* Interactive Map */}
          <CoordinateSelectorMap
            onCoordinateSelect={handleMapCoordinateSelect}
            startCoordinate={startCoordinate}
            endCoordinate={endCoordinate}
            selectionMode={selectionType}
            loading={loading}
            height="h-96"
          />
        </div>

        <div className={STYLES.BUTTON_FLEX_COL_SM_ROW}>
          <FindOptimalRouteButton loading={loading} />
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowExampleDropdown(!showExampleDropdown)}
              disabled={loading}
              className={`${STYLES.BUTTON_SECONDARY} ${STYLES.FLEX_ITEMS_CENTER} text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <MapPin className={`${STYLES.ICON_SM} text-gray-900 mr-2`} />
              Use Example Route
              <ChevronDown className={`${STYLES.ICON_SM} text-gray-900 ml-2`} />
            </button>
            
            {showExampleDropdown && (
              <div className="absolute top-full left-0 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg z-10">
                {EXAMPLE_ROUTES.map((route, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => fillExampleRoute(index)}
                    className="w-full px-4 py-2 text-left text-sm text-gray-900 hover:bg-gray-50 first:rounded-t-md last:rounded-b-md"
                  >
                    {route.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </form>

      <div className={STYLES.TIP_BOX}>
        <p className={STYLES.TIP_TEXT}>
          <strong>{UI_TEXT.TIP_LABEL}</strong> Click &quot;Select Start Point&quot; or &quot;Select End Point&quot;, then click on the map to place markers for your route.
        </p>
      </div>
    </div>
  );
}