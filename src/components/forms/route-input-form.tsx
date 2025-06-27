'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { MapPin, Navigation, ChevronDown } from 'lucide-react';
import { Coordinate } from '@/types/route';
import { UI_TEXT } from '@/constants/ui-text';
import { STYLES } from '@/constants/styles';
import { COLORS } from '@/constants/colors';
import { FindOptimalRouteButton } from '@/components/ui/semantic/find-optimal-route-button';

interface RouteInputFormProps {
  onRouteSubmit: (start: Coordinate, end: Coordinate) => void;
  loading?: boolean;
}

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

export function RouteInputForm({ onRouteSubmit, loading = false }: RouteInputFormProps) {
  const [startLat, setStartLat] = useState('');
  const [startLng, setStartLng] = useState('');
  const [endLat, setEndLat] = useState('');
  const [endLng, setEndLng] = useState('');
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
    setShowExampleDropdown(false);
  };

  return (
    <div className={STYLES.CARD}>
      <div className={`${STYLES.FLEX_ITEMS_CENTER} mb-4`}>
        <Navigation className={`${STYLES.ICON_MD} ${COLORS.TEXT.BLUE} mr-2`} />
        <h2 className={STYLES.HEADING_XL}>{UI_TEXT.PLAN_YOUR_ROUTE}</h2>
      </div>
      
      <form onSubmit={handleSubmit} className={STYLES.FORM_SECTION}>
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
                onChange={(e) => setStartLat(e.target.value)}
                disabled={loading}
              />
              <Input
                type="number"
                step="any"
                placeholder={UI_TEXT.LONGITUDE_PLACEHOLDER}
                value={startLng}
                onChange={(e) => setStartLng(e.target.value)}
                disabled={loading}
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
                onChange={(e) => setEndLat(e.target.value)}
                disabled={loading}
              />
              <Input
                type="number"
                step="any"
                placeholder={UI_TEXT.LONGITUDE_PLACEHOLDER}
                value={endLng}
                onChange={(e) => setEndLng(e.target.value)}
                disabled={loading}
              />
            </div>
          </div>
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
          <strong>{UI_TEXT.TIP_LABEL}</strong> {UI_TEXT.COORDINATE_TIP}
        </p>
      </div>
    </div>
  );
}