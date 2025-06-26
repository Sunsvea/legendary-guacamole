'use client';

import { RoutePoint } from '@/types/route';
import { useState, useEffect } from 'react';

interface RouteMapProps {
  points: RoutePoint[];
  className?: string;
}

// Helper function to convert lat/lng to tile coordinates
function deg2tile(lat: number, lng: number, zoom: number) {
  const latRad = lat * Math.PI / 180;
  const x = Math.floor((lng + 180) / 360 * Math.pow(2, zoom));
  const y = Math.floor((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2 * Math.pow(2, zoom));
  return { x, y };
}

export function RouteMap({ points, className = '' }: RouteMapProps) {
  const [tiles, setTiles] = useState<Array<{x: number, y: number, url: string, left: number, top: number, scale: number}>>([]);
  
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
  const padding = 20;

  // Add padding to bounds
  const boundsPadding = Math.max(latRange, lngRange) * 0.1;
  const boundsMinLat = minLat - boundsPadding;
  const boundsMaxLat = maxLat + boundsPadding;
  const boundsMinLng = minLng - boundsPadding;
  const boundsMaxLng = maxLng + boundsPadding;

  // Calculate zoom level
  const latDiff = boundsMaxLat - boundsMinLat;
  const lngDiff = boundsMaxLng - boundsMinLng;
  const maxDiff = Math.max(latDiff, lngDiff);
  let zoom = 10;
  if (maxDiff > 0.5) zoom = 7;
  else if (maxDiff > 0.2) zoom = 8;
  else if (maxDiff > 0.1) zoom = 9;
  else if (maxDiff > 0.05) zoom = 10;
  else if (maxDiff > 0.02) zoom = 11;
  else if (maxDiff > 0.01) zoom = 12;
  else zoom = 13;

  const getX = (lng: number) => padding + ((lng - boundsMinLng) / (boundsMaxLng - boundsMinLng)) * (mapWidth - 2 * padding);
  const getY = (lat: number) => mapHeight - padding - ((lat - boundsMinLat) / (boundsMaxLat - boundsMinLat)) * (mapHeight - 2 * padding);
  
  const getElevationColor = (elevation: number) => {
    const normalized = (elevation - minElevation) / elevationRange;
    if (normalized < 0.2) return '#22c55e';
    if (normalized < 0.4) return '#84cc16';
    if (normalized < 0.6) return '#eab308';
    if (normalized < 0.8) return '#f97316';
    return '#dc2626';
  };

  // Convert lat/lng to pixel coordinates within the map
  const latLngToPixel = (lat: number, lng: number) => {
    const minTile = deg2tile(boundsMaxLat, boundsMinLng, zoom);
    const maxTile = deg2tile(boundsMinLat, boundsMaxLng, zoom);
    
    // Convert to tile coordinates
    const tileCoords = deg2tile(lat, lng, zoom);
    
    // Convert to pixel coordinates within the tile grid
    const pixelX = (tileCoords.x - minTile.x + (lng - Math.floor(lng * Math.pow(2, zoom)) / Math.pow(2, zoom)) * Math.pow(2, zoom)) * 256;
    const pixelY = (tileCoords.y - minTile.y + (lat - Math.floor(lat * Math.pow(2, zoom)) / Math.pow(2, zoom)) * Math.pow(2, zoom)) * 256;
    
    return { x: pixelX, y: pixelY };
  };

  // Load terrain tiles
  useEffect(() => {
    const minTile = deg2tile(boundsMaxLat, boundsMinLng, zoom);
    const maxTile = deg2tile(boundsMinLat, boundsMaxLng, zoom);
    
    const tileList = [];
    const tileSize = 256;
    
    // Calculate the total tile grid dimensions
    const tilesX = maxTile.x - minTile.x + 1;
    const tilesY = maxTile.y - minTile.y + 1;
    const totalTileWidth = tilesX * tileSize;
    const totalTileHeight = tilesY * tileSize;
    
    // Scale to fit our map dimensions
    const scaleX = (mapWidth - 2 * padding) / totalTileWidth;
    const scaleY = (mapHeight - 2 * padding) / totalTileHeight;
    const scale = Math.min(scaleX, scaleY);
    
    for (let x = minTile.x; x <= maxTile.x; x++) {
      for (let y = minTile.y; y <= maxTile.y; y++) {
        const tileLeft = padding + ((x - minTile.x) * tileSize * scale);
        const tileTop = padding + ((y - minTile.y) * tileSize * scale);
        
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
    
    setTiles(tileList);
  }, [boundsMinLat, boundsMaxLat, boundsMinLng, boundsMaxLng, zoom, mapWidth, mapHeight, padding]);

  return (
    <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Route Map</h3>
        <div className="text-sm text-gray-600">
          {points.length} waypoints
        </div>
      </div>
      
      <div className="overflow-hidden rounded border border-gray-300">
        <svg width={mapWidth} height={mapHeight} className="w-full bg-gradient-to-br from-slate-100 to-slate-200">
          
          {/* Clean terrain-inspired background */}
          <defs>
            <pattern id="terrainPattern" x="0" y="0" width="60" height="60" patternUnits="userSpaceOnUse">
              <circle cx="30" cy="30" r="20" fill="none" stroke="#cbd5e1" strokeWidth="0.5" opacity="0.3"/>
              <circle cx="30" cy="30" r="10" fill="none" stroke="#cbd5e1" strokeWidth="0.5" opacity="0.2"/>
              <path d="M10,30 Q30,10 50,30 Q30,50 10,30" fill="none" stroke="#94a3b8" strokeWidth="0.3" opacity="0.4"/>
            </pattern>
          </defs>
          
          <rect width={mapWidth} height={mapHeight} fill="url(#terrainPattern)" />
          
          {/* Subtle grid */}
          {[...Array(9)].map((_, i) => {
            const x = padding + (i / 8) * (mapWidth - 2 * padding);
            const y = padding + (i / 8) * (mapHeight - 2 * padding);
            return (
              <g key={`grid-${i}`}>
                <line x1={x} y1={padding} x2={x} y2={mapHeight - padding} stroke="#e2e8f0" strokeWidth="1" opacity="0.4" />
                <line x1={padding} y1={y} x2={mapWidth - padding} y2={y} stroke="#e2e8f0" strokeWidth="1" opacity="0.4" />
              </g>
            );
          })}
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
                strokeWidth="6"
                strokeLinecap="round"
                opacity="0.9"
                style={{ filter: 'drop-shadow(1px 1px 2px rgba(0,0,0,0.3))' }}
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
                r="3"
                fill="#374151"
                stroke="#fff"
                strokeWidth="2"
                style={{ filter: 'drop-shadow(1px 1px 2px rgba(0,0,0,0.3))' }}
              />
            );
          })}
        
          <circle
            cx={getX(points[0].lng)}
            cy={getY(points[0].lat)}
            r="8"
            fill="#22c55e"
            stroke="#fff"
            strokeWidth="3"
            style={{ filter: 'drop-shadow(1px 1px 3px rgba(0,0,0,0.5))' }}
          />
          
          <circle
            cx={getX(points[points.length - 1].lng)}
            cy={getY(points[points.length - 1].lat)}
            r="8"
            fill="#ef4444"
            stroke="#fff"
            strokeWidth="3"
            style={{ filter: 'drop-shadow(1px 1px 3px rgba(0,0,0,0.5))' }}
          />
          
          <text
            x={getX(points[0].lng)}
            y={getY(points[0].lat) - 15}
            textAnchor="middle"
            className="text-sm font-bold fill-green-600"
            style={{ filter: 'drop-shadow(1px 1px 2px rgba(255,255,255,0.8))' }}
          >
            START
          </text>
          
          <text
            x={getX(points[points.length - 1].lng)}
            y={getY(points[points.length - 1].lat) - 15}
            textAnchor="middle"
            className="text-sm font-bold fill-red-600"
            style={{ filter: 'drop-shadow(1px 1px 2px rgba(255,255,255,0.8))' }}
          >
            END
          </text>
        </svg>
      </div>
      
      <div className="mt-4 space-y-4">
        {/* Elevation Legend */}
        <div>
          <div className="font-semibold text-gray-900 mb-2">Route Elevation</div>
          <div className="flex items-center space-x-4 text-sm text-gray-700">
            <div className="flex items-center space-x-1">
              <div className="w-4 h-4 rounded border border-gray-300" style={{ backgroundColor: '#22c55e' }}></div>
              <span className="font-medium">Low</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-4 h-4 rounded border border-gray-300" style={{ backgroundColor: '#84cc16' }}></div>
              <span className="font-medium">Med-Low</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-4 h-4 rounded border border-gray-300" style={{ backgroundColor: '#eab308' }}></div>
              <span className="font-medium">Medium</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-4 h-4 rounded border border-gray-300" style={{ backgroundColor: '#f97316' }}></div>
              <span className="font-medium">Med-High</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-4 h-4 rounded border border-gray-300" style={{ backgroundColor: '#dc2626' }}></div>
              <span className="font-medium">High</span>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <div className="font-semibold text-gray-700">Coordinates</div>
            <div className="text-gray-500">
              Start: {points[0].lat.toFixed(4)}, {points[0].lng.toFixed(4)}
            </div>
            <div className="text-gray-500">
              End: {points[points.length - 1].lat.toFixed(4)}, {points[points.length - 1].lng.toFixed(4)}
            </div>
          </div>
          <div>
            <div className="font-semibold text-gray-700">Coverage</div>
            <div className="text-gray-500">
              Lat: {latRange.toFixed(4)}° ({(latRange * 111).toFixed(1)}km)
            </div>
            <div className="text-gray-500">
              Lng: {lngRange.toFixed(4)}° ({(lngRange * 111 * Math.cos(minLat * Math.PI / 180)).toFixed(1)}km)
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}