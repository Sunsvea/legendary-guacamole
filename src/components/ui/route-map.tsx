'use client';

import { RoutePoint } from '@/types/route';
import { useState, useEffect } from 'react';
import { UI_TEXT } from '@/constants/ui-text';
import { STYLES } from '@/constants/styles';
import { COLORS } from '@/constants/colors';

interface RouteMapProps {
  points: RoutePoint[];
  className?: string;
}

interface MapTile {
  x: number;
  y: number;
  url: string;
  left: number;
  top: number;
  scale: number;
}

export function RouteMap({ points, className = '' }: RouteMapProps) {
  const [tiles, setTiles] = useState<MapTile[]>([]);
  const [tilesLoaded, setTilesLoaded] = useState(false);
  
  if (!points || points.length === 0) {
    return null;
  }

  const lats = points.map(p => p.lat);
  const lngs = points.map(p => p.lng);
  const elevations = points.map(p => p.elevation);
  
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);
  const minElevation = Math.min(...elevations);
  const maxElevation = Math.max(...elevations);
  
  const latRange = maxLat - minLat || 0.01;
  const lngRange = maxLng - minLng || 0.01;
  const elevationRange = maxElevation - minElevation || 1;
  
  const mapWidth = 600;
  const mapHeight = 400;
  
  // Dynamic zoom level based on route bounds
  const getOptimalZoom = () => {
    const latSpan = latRange;
    const lngSpan = lngRange;
    const maxSpan = Math.max(latSpan, lngSpan);
    
    if (maxSpan > 0.5) return 10;
    if (maxSpan > 0.1) return 12;
    if (maxSpan > 0.05) return 13;
    if (maxSpan > 0.01) return 14;
    return 15;
  };
  
  const zoom = getOptimalZoom();

  // Add padding to bounds
  const boundsPadding = Math.max(latRange, lngRange) * 0.2;
  const boundsMinLat = minLat - boundsPadding;
  const boundsMaxLat = maxLat + boundsPadding;
  const boundsMinLng = minLng - boundsPadding;
  const boundsMaxLng = maxLng + boundsPadding;

  // Coordinate conversion functions that map route points to tile coordinate system
  const getX = (lng: number) => {
    const normalizedX = (lng - boundsMinLng) / (boundsMaxLng - boundsMinLng);
    return normalizedX * mapWidth;
  };
  
  const getY = (lat: number) => {
    const normalizedY = (lat - boundsMinLat) / (boundsMaxLat - boundsMinLat);
    return mapHeight - (normalizedY * mapHeight); // Flip Y for screen coordinates
  };
  
  const getElevationColor = (elevation: number) => {
    const normalized = (elevation - minElevation) / elevationRange;
    if (normalized < 0.2) return COLORS.ELEVATION.LOW;
    if (normalized < 0.4) return COLORS.ELEVATION.MED_LOW;
    if (normalized < 0.6) return COLORS.ELEVATION.MEDIUM;
    if (normalized < 0.8) return COLORS.ELEVATION.MED_HIGH;
    return COLORS.ELEVATION.HIGH;
  };

  // Convert lat/lng to tile coordinates
  const deg2tile = (lat: number, lng: number, zoom: number) => {
    const latRad = lat * Math.PI / 180;
    const n = Math.pow(2, zoom);
    const x = Math.floor((lng + 180) / 360 * n);
    const y = Math.floor((1 - Math.asinh(Math.tan(latRad)) / Math.PI) / 2 * n);
    return { x, y };
  };


  // Load terrain tiles
  useEffect(() => {
    console.log('Route bounds:', { boundsMinLat, boundsMaxLat, boundsMinLng, boundsMaxLng, zoom });
    
    // Get tile coordinates for our bounds - fix the order issue
    const topLeftTile = deg2tile(boundsMaxLat, boundsMinLng, zoom);
    const bottomRightTile = deg2tile(boundsMinLat, boundsMaxLng, zoom);
    
    console.log('Tile bounds:', { topLeftTile, bottomRightTile });
    
    const tileList: MapTile[] = [];
    const tileSize = 256;
    
    // Calculate the total tile grid dimensions
    const tilesX = bottomRightTile.x - topLeftTile.x + 1;
    const tilesY = bottomRightTile.y - topLeftTile.y + 1;
    
    console.log('Tile grid:', { tilesX, tilesY });
    
    // Calculate scale to fit tiles in map area while maintaining aspect ratio
    const scaleX = mapWidth / (tilesX * tileSize);
    const scaleY = mapHeight / (tilesY * tileSize);
    const scale = Math.min(scaleX, scaleY);
    
    const scaledTileWidth = tilesX * tileSize * scale;
    const scaledTileHeight = tilesY * tileSize * scale;
    
    // Center the tile grid
    const offsetX = (mapWidth - scaledTileWidth) / 2;
    const offsetY = (mapHeight - scaledTileHeight) / 2;
    
    for (let x = topLeftTile.x; x <= bottomRightTile.x; x++) {
      for (let y = topLeftTile.y; y <= bottomRightTile.y; y++) {
        const tileLeft = offsetX + ((x - topLeftTile.x) * tileSize * scale);
        const tileTop = offsetY + ((y - topLeftTile.y) * tileSize * scale);
        
        // Using OpenTopoMap tiles
        const url = `https://tile.opentopomap.org/${zoom}/${x}/${y}.png`;
        
        tileList.push({
          x,
          y,
          url,
          left: tileLeft,
          top: tileTop,
          scale
        });
      }
    }
    
    console.log('Generated tiles:', tileList.length);
    setTiles(tileList);
    setTilesLoaded(false);
  }, [boundsMinLat, boundsMaxLat, boundsMinLng, boundsMaxLng, zoom, mapWidth, mapHeight]);

  return (
    <div className={`${STYLES.CARD} ${className || ''}`}>
      <div className={`${STYLES.FLEX_BETWEEN} mb-4`}>
        <h3 className={STYLES.HEADING_LG}>{UI_TEXT.ROUTE_MAP}</h3>
        <div className={STYLES.TEXT_SM_GRAY}>
          {points.length} {UI_TEXT.WAYPOINTS}
        </div>
      </div>
      
      <div className="overflow-hidden rounded border border-gray-300 relative">
        <div 
          className="relative bg-gray-100"
          style={{ width: mapWidth, height: mapHeight }}
        >
          {/* Topographic tiles background */}
          {tiles.map((tile, index) => (
            <img
              key={`tile-${tile.x}-${tile.y}`}
              src={tile.url}
              alt={`Topographic tile ${tile.x},${tile.y}`}
              className="absolute"
              style={{
                left: tile.left,
                top: tile.top,
                width: 256 * tile.scale,
                height: 256 * tile.scale,
                opacity: 0.8,
                imageRendering: 'crisp-edges'
              }}
              onLoad={() => {
                if (index === tiles.length - 1) {
                  setTilesLoaded(true);
                }
              }}
              onError={(e) => {
                // Fallback to OpenStreetMap if OpenTopoMap fails
                const target = e.target as HTMLImageElement;
                const fallbackUrl = `https://tile.openstreetmap.org/${zoom}/${tile.x}/${tile.y}.png`;
                if (target.src !== fallbackUrl) {
                  target.src = fallbackUrl;
                } else {
                  target.style.display = 'none';
                }
              }}
            />
          ))}
          
          {/* Loading overlay */}
          {!tilesLoaded && tiles.length > 0 && (
            <div className={`${STYLES.ABSOLUTE_INSET} ${STYLES.FLEX_CENTER} ${STYLES.BG_GRAY_100} bg-opacity-80`}>
              <div className={STYLES.TEXT_SM_GRAY}>{UI_TEXT.LOADING_TOPOGRAPHIC_MAP}</div>
            </div>
          )}
          
          {/* SVG overlay for route */}
          <svg 
            width={mapWidth} 
            height={mapHeight} 
            className="absolute inset-0"
            style={{ pointerEvents: 'none' }}
          >
            {/* Route path with elevation coloring */}
            {points.map((point, index) => {
              if (index === 0) return null;
              const prevPoint = points[index - 1];
              const x1 = getX(prevPoint.lng);
              const y1 = getY(prevPoint.lat);
              const x2 = getX(point.lng);
              const y2 = getY(point.lat);
              
              return (
                <line
                  key={`route-segment-${index}`}
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke={getElevationColor(point.elevation)}
                  strokeWidth="4"
                  strokeLinecap="round"
                  opacity="0.9"
                  style={{ filter: 'drop-shadow(1px 1px 2px rgba(0,0,0,0.5))' }}
                />
              );
            })}
            
            {/* Route waypoints */}
            {points.map((point, index) => {
              if (index % Math.ceil(points.length / 6) !== 0 && index !== 0 && index !== points.length - 1) {
                return null;
              }
              
              return (
                <circle
                  key={`waypoint-${index}`}
                  cx={getX(point.lng)}
                  cy={getY(point.lat)}
                  r="2"
                  fill="#374151"
                  stroke="#fff"
                  strokeWidth="2"
                  style={{ filter: 'drop-shadow(1px 1px 2px rgba(0,0,0,0.5))' }}
                />
              );
            })}
          
            {/* Start point */}
            <circle
              cx={getX(points[0].lng)}
              cy={getY(points[0].lat)}
              r="8"
              fill={COLORS.START_POINT}
              stroke="#fff"
              strokeWidth="3"
              style={{ filter: 'drop-shadow(1px 1px 3px rgba(0,0,0,0.7))' }}
            />
            
            {/* End point */}
            <circle
              cx={getX(points[points.length - 1].lng)}
              cy={getY(points[points.length - 1].lat)}
              r="8"
              fill={COLORS.END_POINT}
              stroke="#fff"
              strokeWidth="3"
              style={{ filter: 'drop-shadow(1px 1px 3px rgba(0,0,0,0.7))' }}
            />
            
            {/* Labels */}
            <text
              x={getX(points[0].lng)}
              y={getY(points[0].lat) - 15}
              textAnchor="middle"
              className={`text-sm font-bold ${COLORS.TEXT.GREEN.replace('text-', 'fill-')}`}
              style={{ filter: 'drop-shadow(1px 1px 2px rgba(255,255,255,0.9))' }}
            >
              {UI_TEXT.START_LABEL}
            </text>
            
            <text
              x={getX(points[points.length - 1].lng)}
              y={getY(points[points.length - 1].lat) - 15}
              textAnchor="middle"
              className={`text-sm font-bold ${COLORS.TEXT.RED.replace('text-', 'fill-')}`}
              style={{ filter: 'drop-shadow(1px 1px 2px rgba(255,255,255,0.9))' }}
            >
              {UI_TEXT.END_LABEL}
            </text>
          </svg>
        </div>
      </div>
      
      <div className={`mt-4 ${STYLES.SPACE_Y_4}`}>
        {/* Elevation Legend */}
        <div>
          <div className={`font-semibold ${COLORS.TEXT.PRIMARY} mb-2`}>{UI_TEXT.ROUTE_ELEVATION}</div>
          <div className={`${STYLES.FLEX_ITEMS_CENTER} ${STYLES.SPACE_X_4} ${STYLES.TEXT_SM_GRAY}`}>
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
              {UI_TEXT.LNG_COVERAGE} {lngRange.toFixed(4)}{UI_TEXT.UNIT_DEGREES} ({(lngRange * 111 * Math.cos(minLat * Math.PI / 180)).toFixed(1)}{UI_TEXT.UNIT_KM})
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}