'use client';

import { RoutePoint } from '@/types/route';
import { useEffect, useRef, useState, useCallback } from 'react';
import { UI_TEXT } from '@/constants/ui-text';
import { STYLES } from '@/constants/styles';
import { COLORS } from '@/constants/colors';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

interface RouteMapProps {
  points: RoutePoint[];
  className?: string;
  onMapReady?: () => void;
}

export function RouteMap({ points, className = '', onMapReady }: RouteMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const [useStaticMap, setUseStaticMap] = useState(false);

  const elevations = points?.map(p => p.elevation) || [];
  const minElevation = elevations.length > 0 ? Math.min(...elevations) : 0;
  const maxElevation = elevations.length > 0 ? Math.max(...elevations) : 0;
  const elevationRange = maxElevation - minElevation || 1;

  const getElevationColor = useCallback((elevation: number) => {
    const normalized = (elevation - minElevation) / elevationRange;
    if (normalized < 0.2) return COLORS.ELEVATION.LOW;
    if (normalized < 0.4) return COLORS.ELEVATION.MED_LOW;
    if (normalized < 0.6) return COLORS.ELEVATION.MEDIUM;
    if (normalized < 0.8) return COLORS.ELEVATION.MED_HIGH;
    return COLORS.ELEVATION.HIGH;
  }, [minElevation, elevationRange]);

  useEffect(() => {
    if (!mapContainer.current || map.current || !points || points.length === 0) return;

    // Check rate limiting for map operations
    import('@/lib/utils/rate-limiter').then(({ mapRateLimiter }) => {
      if (!mapRateLimiter.isAllowed('map-load')) {
        const timeUntilReset = mapRateLimiter.getTimeUntilReset('map-load');
        setMapError(`Too many map loads. Please wait ${Math.ceil(timeUntilReset / 1000)} seconds before refreshing.`);
        return;
      }
    });

    // Set Mapbox access token from environment (must be public token for client-side)
    const token = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;
    
    if (!token) {
      setMapError('Mapbox access token not found. Please check your environment configuration.');
      return;
    }
    
    mapboxgl.accessToken = token;

    // Calculate bounds for the route
    const lats = points.map(p => p.lat);
    const lngs = points.map(p => p.lng);
    const bounds = new mapboxgl.LngLatBounds(
      [Math.min(...lngs), Math.min(...lats)],
      [Math.max(...lngs), Math.max(...lats)]
    );

    try {
      // Initialize the map
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/outdoors-v12',
        bounds: bounds,
        fitBoundsOptions: {
          padding: { top: 50, bottom: 50, left: 50, right: 50 }
        }
      });

      // Add error handler
      map.current.on('error', (e) => {
        console.error('Mapbox error:', e);
        setMapError('Interactive map failed to load. Falling back to static map...');
        setTimeout(() => {
          setUseStaticMap(true);
          setMapError(null);
        }, 2000);
      });

      map.current.on('load', () => {
      if (!map.current) return;
      
      // Add the route as a line
      const routeCoordinates = points.map(point => [point.lng, point.lat]);
      
      map.current.addSource('route', {
        type: 'geojson',
        data: {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'LineString',
            coordinates: routeCoordinates
          }
        }
      });

      // Add route line layer with elevation-based styling
      map.current.addLayer({
        id: 'route-line',
        type: 'line',
        source: 'route',
        layout: {
          'line-join': 'round',
          'line-cap': 'round'
        },
        paint: {
          'line-color': COLORS.ELEVATION.MEDIUM,
          'line-width': 4,
          'line-opacity': 0.8
        }
      });

      // Add black outline for colorblind accessibility
      map.current.addLayer({
        id: 'route-outline',
        type: 'line',
        source: 'route',
        layout: {
          'line-join': 'round',
          'line-cap': 'round'
        },
        paint: {
          'line-color': '#000000',
          'line-width': 8,
          'line-opacity': 0.4
        }
      }, 'route-line'); // Insert below the main route line

      // Add elevation-colored segments
      points.forEach((point, index) => {
        if (index === 0) return;
        
        const prevPoint = points[index - 1];
        const segmentColor = getElevationColor(point.elevation);
        
        map.current!.addSource(`route-segment-${index}`, {
          type: 'geojson',
          data: {
            type: 'Feature',
            properties: {},
            geometry: {
              type: 'LineString',
              coordinates: [[prevPoint.lng, prevPoint.lat], [point.lng, point.lat]]
            }
          }
        });

        // Add colored route segment
        map.current!.addLayer({
          id: `route-segment-${index}`,
          type: 'line',
          source: `route-segment-${index}`,
          layout: {
            'line-join': 'round',
            'line-cap': 'round'
          },
          paint: {
            'line-color': segmentColor,
            'line-width': 6,
            'line-opacity': 0.9
          }
        });
      });

      // Add start marker
      new mapboxgl.Marker({
        color: COLORS.START_POINT,
        scale: 1.2
      })
        .setLngLat([points[0].lng, points[0].lat])
        .setPopup(new mapboxgl.Popup().setHTML(`<strong>${UI_TEXT.START_LABEL}</strong><br>Elevation: ${points[0].elevation.toFixed(0)}m`))
        .addTo(map.current);

      // Add end marker
      const endPoint = points[points.length - 1];
      new mapboxgl.Marker({
        color: COLORS.END_POINT,
        scale: 1.2
      })
        .setLngLat([endPoint.lng, endPoint.lat])
        .setPopup(new mapboxgl.Popup().setHTML(`<strong>${UI_TEXT.END_LABEL}</strong><br>Elevation: ${endPoint.elevation.toFixed(0)}m`))
        .addTo(map.current);

        setMapLoaded(true);
        
        // Call onMapReady callback to trigger scroll
        if (onMapReady) {
          onMapReady();
        }
      });

      // Add navigation controls
      map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');
      map.current.addControl(new mapboxgl.FullscreenControl(), 'top-right');

    } catch (error) {
      console.error('Failed to initialize Mapbox map:', error);
      setMapError('Failed to initialize map. Please check your Mapbox configuration.');
    }

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [points, getElevationColor, onMapReady]);

  if (!points || points.length === 0) {
    return null;
  }

  const lats = points.map(p => p.lat);
  const lngs = points.map(p => p.lng);
  const latRange = Math.max(...lats) - Math.min(...lats) || 0.01;
  const lngRange = Math.max(...lngs) - Math.min(...lngs) || 0.01;

  // Calculate center point for static map
  const centerLat = (Math.max(...lats) + Math.min(...lats)) / 2;
  const centerLng = (Math.max(...lngs) + Math.min(...lngs)) / 2;

  // Render static map fallback
  if (useStaticMap) {
    return (
      <div className={`${STYLES.CARD} ${className || ''}`}>
        <div className={`${STYLES.FLEX_BETWEEN} mb-4`}>
          <h3 className={STYLES.HEADING_LG}>{UI_TEXT.ROUTE_MAP}</h3>
          <div className={STYLES.TEXT_SM_GRAY}>
            {points.length} {UI_TEXT.WAYPOINTS} (Static)
          </div>
        </div>
        
        <div className="w-full h-96 sm:h-[500px] lg:h-[600px] rounded-lg overflow-hidden border border-gray-300 relative bg-gray-100 flex items-center justify-center">
          <div className="text-center p-8">
            <div className="text-lg font-semibold text-gray-700 mb-2">Static Map View</div>
            <div className="text-sm text-gray-600 mb-4">
              Center: {centerLat.toFixed(4)}, {centerLng.toFixed(4)}
            </div>
            <div className="text-xs text-gray-500">
              Interactive map requires valid Mapbox token.<br/>
              Route visualization available in the elevation chart below.
            </div>
          </div>
        </div>
        
        <div className={`mt-4 ${STYLES.SPACE_Y_4}`}>
          {/* Elevation Legend */}
          <div>
            <div className={`font-semibold ${COLORS.TEXT.PRIMARY} mb-2`}>{UI_TEXT.ROUTE_ELEVATION}</div>
            <div className={`${STYLES.FLEX_ITEMS_CENTER} ${STYLES.SPACE_X_4} ${STYLES.TEXT_SM_GRAY} flex-wrap gap-y-2`}>
              <div className={STYLES.FLEX_ITEMS_CENTER}>
                <div className="w-4 h-4 rounded border border-gray-300 mr-1" style={{ backgroundColor: COLORS.ELEVATION.LOW }}></div>
                <span className="font-medium">{UI_TEXT.ELEVATION_LOW}</span>
              </div>
              <div className={STYLES.FLEX_ITEMS_CENTER}>
                <div className="w-4 h-4 rounded border border-gray-300 mr-1" style={{ backgroundColor: COLORS.ELEVATION.MED_LOW }}></div>
                <span className="font-medium">{UI_TEXT.ELEVATION_MED_LOW}</span>
              </div>
              <div className={STYLES.FLEX_ITEMS_CENTER}>
                <div className="w-4 h-4 rounded border border-gray-300 mr-1" style={{ backgroundColor: COLORS.ELEVATION.MEDIUM }}></div>
                <span className="font-medium">{UI_TEXT.ELEVATION_MEDIUM}</span>
              </div>
              <div className={STYLES.FLEX_ITEMS_CENTER}>
                <div className="w-4 h-4 rounded border border-gray-300 mr-1" style={{ backgroundColor: COLORS.ELEVATION.MED_HIGH }}></div>
                <span className="font-medium">{UI_TEXT.ELEVATION_MED_HIGH}</span>
              </div>
              <div className={STYLES.FLEX_ITEMS_CENTER}>
                <div className="w-4 h-4 rounded border border-gray-300 mr-1" style={{ backgroundColor: COLORS.ELEVATION.HIGH }}></div>
                <span className="font-medium">{UI_TEXT.ELEVATION_HIGH}</span>
              </div>
            </div>
          </div>
          
          <div className={`${STYLES.GRID_1_MD_2} ${STYLES.TEXT_SM_GRAY}`}>
            <div>
              <div className={`font-semibold ${COLORS.TEXT.SECONDARY}`}>{UI_TEXT.COORDINATES_LABEL}</div>
              <div className={STYLES.TEXT_SM_GRAY_500}>
                {UI_TEXT.START_COORDINATES} {points[0].lat.toFixed(4)}, {points[0].lng.toFixed(4)}
              </div>
              <div className={STYLES.TEXT_SM_GRAY_500}>
                {UI_TEXT.END_COORDINATES} {points[points.length - 1].lat.toFixed(4)}, {points[points.length - 1].lng.toFixed(4)}
              </div>
            </div>
            <div>
              <div className={`font-semibold ${COLORS.TEXT.SECONDARY}`}>{UI_TEXT.COVERAGE_LABEL}</div>
              <div className={STYLES.TEXT_SM_GRAY_500}>
                {UI_TEXT.LAT_COVERAGE} {latRange.toFixed(4)}{UI_TEXT.UNIT_DEGREES} ({(latRange * 111).toFixed(1)}{UI_TEXT.UNIT_KM})
              </div>
              <div className={STYLES.TEXT_SM_GRAY_500}>
                {UI_TEXT.LNG_COVERAGE} {lngRange.toFixed(4)}{UI_TEXT.UNIT_DEGREES} ({(lngRange * 111 * Math.cos(Math.min(...lats) * Math.PI / 180)).toFixed(1)}{UI_TEXT.UNIT_KM})
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`${STYLES.CARD} ${className || ''}`}>
      <div className={`${STYLES.FLEX_BETWEEN} mb-4`}>
        <h3 className={STYLES.HEADING_LG}>{UI_TEXT.ROUTE_MAP}</h3>
        <div className={STYLES.TEXT_SM_GRAY}>
          {points.length} {UI_TEXT.WAYPOINTS}
        </div>
      </div>
      
      {/* Mapbox container - fully responsive */}
      <div className="w-full h-96 sm:h-[500px] lg:h-[600px] rounded-lg overflow-hidden border border-gray-300 relative">
        <div 
          ref={mapContainer} 
          className="w-full h-full"
        />
        
        {/* Loading overlay */}
        {!mapLoaded && !mapError && (
          <div className={`${STYLES.ABSOLUTE_INSET} ${STYLES.FLEX_CENTER} ${STYLES.BG_GRAY_100} bg-opacity-80`}>
            <div className={STYLES.TEXT_SM_GRAY}>{UI_TEXT.LOADING_TOPOGRAPHIC_MAP}</div>
          </div>
        )}
        
        {/* Error overlay */}
        {mapError && (
          <div className={`${STYLES.ABSOLUTE_INSET} ${STYLES.FLEX_CENTER} ${STYLES.BG_GRAY_100} bg-opacity-90 flex-col`}>
            <div className="text-red-600 font-semibold mb-2">Map Loading Error</div>
            <div className={`${STYLES.TEXT_SM_GRAY} text-center px-4`}>{mapError}</div>
          </div>
        )}
      </div>
      
      <div className={`mt-4 ${STYLES.SPACE_Y_4}`}>
        {/* Elevation Legend */}
        <div>
          <div className={`font-semibold ${COLORS.TEXT.PRIMARY} mb-2`}>{UI_TEXT.ROUTE_ELEVATION}</div>
          <div className={`${STYLES.FLEX_ITEMS_CENTER} ${STYLES.SPACE_X_4} ${STYLES.TEXT_SM_GRAY} flex-wrap gap-y-2`}>
            <div className={STYLES.FLEX_ITEMS_CENTER}>
              <div className="w-4 h-4 rounded border border-gray-300 mr-1" style={{ backgroundColor: COLORS.ELEVATION.LOW }}></div>
              <span className="font-medium">{UI_TEXT.ELEVATION_LOW}</span>
            </div>
            <div className={STYLES.FLEX_ITEMS_CENTER}>
              <div className="w-4 h-4 rounded border border-gray-300 mr-1" style={{ backgroundColor: COLORS.ELEVATION.MED_LOW }}></div>
              <span className="font-medium">{UI_TEXT.ELEVATION_MED_LOW}</span>
            </div>
            <div className={STYLES.FLEX_ITEMS_CENTER}>
              <div className="w-4 h-4 rounded border border-gray-300 mr-1" style={{ backgroundColor: COLORS.ELEVATION.MEDIUM }}></div>
              <span className="font-medium">{UI_TEXT.ELEVATION_MEDIUM}</span>
            </div>
            <div className={STYLES.FLEX_ITEMS_CENTER}>
              <div className="w-4 h-4 rounded border border-gray-300 mr-1" style={{ backgroundColor: COLORS.ELEVATION.MED_HIGH }}></div>
              <span className="font-medium">{UI_TEXT.ELEVATION_MED_HIGH}</span>
            </div>
            <div className={STYLES.FLEX_ITEMS_CENTER}>
              <div className="w-4 h-4 rounded border border-gray-300 mr-1" style={{ backgroundColor: COLORS.ELEVATION.HIGH }}></div>
              <span className="font-medium">{UI_TEXT.ELEVATION_HIGH}</span>
            </div>
          </div>
        </div>
        
        <div className={`${STYLES.GRID_1_MD_2} ${STYLES.TEXT_SM_GRAY}`}>
          <div>
            <div className={`font-semibold ${COLORS.TEXT.SECONDARY}`}>{UI_TEXT.COORDINATES_LABEL}</div>
            <div className={STYLES.TEXT_SM_GRAY_500}>
              {UI_TEXT.START_COORDINATES} {points[0].lat.toFixed(4)}, {points[0].lng.toFixed(4)}
            </div>
            <div className={STYLES.TEXT_SM_GRAY_500}>
              {UI_TEXT.END_COORDINATES} {points[points.length - 1].lat.toFixed(4)}, {points[points.length - 1].lng.toFixed(4)}
            </div>
          </div>
          <div>
            <div className={`font-semibold ${COLORS.TEXT.SECONDARY}`}>{UI_TEXT.COVERAGE_LABEL}</div>
            <div className={STYLES.TEXT_SM_GRAY_500}>
              {UI_TEXT.LAT_COVERAGE} {latRange.toFixed(4)}{UI_TEXT.UNIT_DEGREES} ({(latRange * 111).toFixed(1)}{UI_TEXT.UNIT_KM})
            </div>
            <div className={STYLES.TEXT_SM_GRAY_500}>
              {UI_TEXT.LNG_COVERAGE} {lngRange.toFixed(4)}{UI_TEXT.UNIT_DEGREES} ({(lngRange * 111 * Math.cos(Math.min(...lats) * Math.PI / 180)).toFixed(1)}{UI_TEXT.UNIT_KM})
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}