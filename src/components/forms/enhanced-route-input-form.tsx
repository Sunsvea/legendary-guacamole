/**
 * Enhanced route input form with interactive map and geolocation features
 */

'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { LocationButton } from '@/components/ui/location-button';
import { CoordinateSelectorMap } from '@/components/ui/coordinate-selector-map';
import { MapPin, Navigation, ChevronDown, Map, Keyboard } from 'lucide-react';
import { Coordinate } from '@/types/route';
import { UI_TEXT } from '@/constants/ui-text';
import { STYLES } from '@/constants/styles';
import { COLORS } from '@/constants/colors';
import { FindOptimalRouteButton } from '@/components/ui/semantic/find-optimal-route-button';

interface EnhancedRouteInputFormProps {
  onRouteSubmit: (start: Coordinate, end: Coordinate) => void;
  loading?: boolean;
}

type InputMode = 'coordinates' | 'map';
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
  const [inputMode, setInputMode] = useState<InputMode>('map');
  const [selectionType, setSelectionType] = useState<SelectionType>(null);
  
  const [startLat, setStartLat] = useState('');
  const [startLng, setStartLng] = useState('');
  const [endLat, setEndLat] = useState('');
  const [endLng, setEndLng] = useState('');
  
  const [startCoordinate, setStartCoordinate] = useState<Coordinate | undefined>();
  const [endCoordinate, setEndCoordinate] = useState<Coordinate | undefined>();
  
  const [showExampleDropdown, setShowExampleDropdown] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!startLat || !startLng || !endLat || !endLng) {
      alert(UI_TEXT.FILL_ALL_COORDINATES);
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
      alert(UI_TEXT.ENTER_VALID_COORDINATES);
      return;
    }

    onRouteSubmit(start, end);
  };

  const fillExampleRoute = (routeIndex: number = 0) => {
    const route = EXAMPLE_ROUTES[routeIndex];
    setStartLat(route.start.lat.toString());
    setStartLng(route.start.lng.toString());
    setEndLat(route.end.lat.toString());
    setEndLng(route.end.lng.toString());
    
    setStartCoordinate(route.start);
    setEndCoordinate(route.end);
    setShowExampleDropdown(false);
  };

  const handleLocationSelect = (location: Coordinate, type: 'start' | 'end') => {
    if (type === 'start') {
      setStartLat(location.lat.toString());
      setStartLng(location.lng.toString());
      setStartCoordinate(location);
    } else {
      setEndLat(location.lat.toString());
      setEndLng(location.lng.toString());
      setEndCoordinate(location);
    }
  };

  const handleLocationError = (error: { message: string; code: string }) => {
    alert(`Location Error: ${error.message}`);
  };

  const handleMapCoordinateSelect = (coordinate: Coordinate, type: 'start' | 'end') => {
    handleLocationSelect(coordinate, type);
    setSelectionType(null); // Clear selection mode after selecting
  };

  const handleStartSelection = () => {
    setSelectionType('start');
  };

  const handleEndSelection = () => {
    setSelectionType('end');
  };

  const toggleInputMode = () => {
    setInputMode(inputMode === 'coordinates' ? 'map' : 'coordinates');
    setSelectionType(null);
  };

  /**
   * Get the optimal center point for the map based on selection state
   */
  const getMapCenter = (): Coordinate => {
    // If selecting end point and start point exists, center on start point
    if (selectionType === 'end' && startCoordinate) {
      return startCoordinate;
    }
    
    // If selecting start point and end point exists, center on end point
    if (selectionType === 'start' && endCoordinate) {
      return endCoordinate;
    }
    
    // If both points exist, center between them
    if (startCoordinate && endCoordinate) {
      return {
        lat: (startCoordinate.lat + endCoordinate.lat) / 2,
        lng: (startCoordinate.lng + endCoordinate.lng) / 2
      };
    }
    
    // If one point exists, center on it
    if (startCoordinate) return startCoordinate;
    if (endCoordinate) return endCoordinate;
    
    // Default to Switzerland center
    return { lat: 46.8182, lng: 8.2275 };
  };

  const hasStartPoint = startCoordinate || (startLat && startLng);
  const hasEndPoint = endCoordinate || (endLat && endLng);

  return (
    <div className={STYLES.CARD}>
      <div className={`${STYLES.FLEX_ITEMS_CENTER} mb-4`}>
        <Navigation className={`${STYLES.ICON_MD} ${COLORS.TEXT.BLUE} mr-2`} />
        <h2 className={STYLES.HEADING_XL}>{UI_TEXT.PLAN_YOUR_ROUTE}</h2>
      </div>

      {/* Input Mode Toggle */}
      <div className="flex justify-center mb-6">
        <div className="inline-flex rounded-lg border border-gray-200 p-1">
          <button
            type="button"
            onClick={toggleInputMode}
            disabled={loading}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              inputMode === 'coordinates'
                ? 'bg-blue-500 text-white'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Keyboard className="w-4 h-4 mr-2 inline" />
            Use Coordinates
          </button>
          <button
            type="button"
            onClick={toggleInputMode}
            disabled={loading}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              inputMode === 'map'
                ? 'bg-blue-500 text-white'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Map className="w-4 h-4 mr-2 inline" />
            Use Map
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className={STYLES.FORM_SECTION}>
        {inputMode === 'coordinates' ? (
          /* Coordinate Input Mode */
          <div className={STYLES.GRID_1_MD_2}>
            <div className={STYLES.INPUT_GROUP}>
              <label className={STYLES.INPUT_LABEL_WITH_ICON}>
                <MapPin className={`${STYLES.ICON_SM} ${COLORS.TEXT.GREEN}`} />
                <span>{UI_TEXT.START_POINT}</span>
              </label>
              <div className={STYLES.GRID_2_GAP_2}>
                <Input
                  type="number"
                  step="any"
                  placeholder={UI_TEXT.LATITUDE_PLACEHOLDER}
                  value={startLat}
                  onChange={(e) => {
                    setStartLat(e.target.value);
                    if (e.target.value && startLng) {
                      setStartCoordinate({ lat: parseFloat(e.target.value), lng: parseFloat(startLng) });
                    }
                  }}
                  disabled={loading}
                />
                <Input
                  type="number"
                  step="any"
                  placeholder={UI_TEXT.LONGITUDE_PLACEHOLDER}
                  value={startLng}
                  onChange={(e) => {
                    setStartLng(e.target.value);
                    if (startLat && e.target.value) {
                      setStartCoordinate({ lat: parseFloat(startLat), lng: parseFloat(e.target.value) });
                    }
                  }}
                  disabled={loading}
                />
              </div>
              <div className="mt-2">
                <LocationButton
                  onLocationSelect={(location) => handleLocationSelect(location, 'start')}
                  onError={handleLocationError}
                  loading={loading}
                  className="w-full"
                />
              </div>
            </div>

            <div className={STYLES.INPUT_GROUP}>
              <label className={STYLES.INPUT_LABEL_WITH_ICON}>
                <MapPin className={`${STYLES.ICON_SM} ${COLORS.TEXT.RED}`} />
                <span>{UI_TEXT.END_POINT}</span>
              </label>
              <div className={STYLES.GRID_2_GAP_2}>
                <Input
                  type="number"
                  step="any"
                  placeholder={UI_TEXT.LATITUDE_PLACEHOLDER}
                  value={endLat}
                  onChange={(e) => {
                    setEndLat(e.target.value);
                    if (e.target.value && endLng) {
                      setEndCoordinate({ lat: parseFloat(e.target.value), lng: parseFloat(endLng) });
                    }
                  }}
                  disabled={loading}
                />
                <Input
                  type="number"
                  step="any"
                  placeholder={UI_TEXT.LONGITUDE_PLACEHOLDER}
                  value={endLng}
                  onChange={(e) => {
                    setEndLng(e.target.value);
                    if (endLat && e.target.value) {
                      setEndCoordinate({ lat: parseFloat(endLat), lng: parseFloat(e.target.value) });
                    }
                  }}
                  disabled={loading}
                />
              </div>
              <div className="mt-2">
                <LocationButton
                  onLocationSelect={(location) => handleLocationSelect(location, 'end')}
                  onError={handleLocationError}
                  loading={loading}
                  className="w-full"
                />
              </div>
            </div>
          </div>
        ) : (
          /* Map Input Mode */
          <div className="space-y-6">
            {/* Selection Instructions */}
            <div className="text-center">
              {!selectionType ? (
                <p className="text-gray-600">Click on map to select start point, then end point</p>
              ) : (
                <p className="text-blue-600 font-medium">
                  {selectionType === 'start' ? 'Click on map to select start point' : 'Click on map to select end point'}
                </p>
              )}
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
              center={getMapCenter()}
            />
          </div>
        )}

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
          <strong>{UI_TEXT.TIP_LABEL}</strong> {inputMode === 'coordinates' 
            ? UI_TEXT.COORDINATE_TIP 
            : 'Click the map or use your current location to easily select start and end points.'
          }
        </p>
      </div>
    </div>
  );
}