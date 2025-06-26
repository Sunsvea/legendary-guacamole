'use client';

import { RoutePoint } from '@/types/route';

interface RouteMapProps {
  points: RoutePoint[];
  className?: string;
}

export function RouteMap({ points, className = '' }: RouteMapProps) {
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
  const padding = 40;

  const getX = (lng: number) => padding + ((lng - minLng) / lngRange) * (mapWidth - 2 * padding);
  const getY = (lat: number) => mapHeight - padding - ((lat - minLat) / latRange) * (mapHeight - 2 * padding);
  
  const getElevationColor = (elevation: number) => {
    const normalized = (elevation - minElevation) / elevationRange;
    if (normalized < 0.2) return '#22c55e'; // Low elevation - green
    if (normalized < 0.4) return '#84cc16'; // Medium-low - lime  
    if (normalized < 0.6) return '#eab308'; // Medium - yellow
    if (normalized < 0.8) return '#f97316'; // Medium-high - orange
    return '#dc2626'; // High elevation - red
  };

  const pathData = points
    .map((point, index) => {
      const x = getX(point.lng);
      const y = getY(point.lat);
      return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
    })
    .join(' ');

  // Create topographical background using elevation zones
  const backgroundZones = [];
  const gridSize = 20;
  for (let i = 0; i < gridSize; i++) {
    for (let j = 0; j < gridSize; j++) {
      const lat = minLat + (i / gridSize) * latRange;
      const lng = minLng + (j / gridSize) * lngRange;
      
      // Simulate elevation based on distance from route for visual effect
      const closestPoint = points.reduce((closest, point) => {
        const distance = Math.sqrt(
          Math.pow(point.lat - lat, 2) + Math.pow(point.lng - lng, 2)
        );
        return distance < closest.distance ? { point, distance } : closest;
      }, { distance: Infinity, point: points[0] });
      
      const simulatedElevation = closestPoint.point.elevation + 
        (Math.random() - 0.5) * 200 * closestPoint.distance * 1000;
      
      const x = getX(lng);
      const y = getY(lat);
      const size = (mapWidth - 2 * padding) / gridSize;
      
      backgroundZones.push(
        <rect
          key={`zone-${i}-${j}`}
          x={x - size/2}
          y={y - size/2}
          width={size}
          height={size}
          fill={getElevationColor(simulatedElevation)}
          opacity="0.15"
        />
      );
    }
  }

  // Create contour-like lines
  const contourLines = [];
  for (let i = 1; i <= 4; i++) {
    const elevationLevel = minElevation + (i / 5) * elevationRange;
    contourLines.push(
      <g key={`contour-${i}`}>
        {points.map((point, index) => {
          if (index === 0) return null;
          const prevPoint = points[index - 1];
          if (
            (prevPoint.elevation <= elevationLevel && point.elevation >= elevationLevel) ||
            (prevPoint.elevation >= elevationLevel && point.elevation <= elevationLevel)
          ) {
            return (
              <circle
                key={`contour-point-${index}`}
                cx={getX(point.lng)}
                cy={getY(point.lat)}
                r="1"
                fill="#94a3b8"
                opacity="0.6"
              />
            );
          }
          return null;
        })}
      </g>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Route Map</h3>
        <div className="text-sm text-gray-600">
          {points.length} waypoints
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <svg width={mapWidth} height={mapHeight} className="w-full border border-gray-200 rounded">
          <rect width={mapWidth} height={mapHeight} fill="#f8fafc" />
          
          {/* Topographical background */}
          {backgroundZones}
          
          {/* Contour lines */}
          {contourLines}
          
          {/* Elevation-based route coloring */}
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
                className="drop-shadow-sm"
              />
            );
          })}
          
          {/* Route waypoints */}
          {points.map((point, index) => {
            if (index % Math.ceil(points.length / 8) !== 0 && index !== 0 && index !== points.length - 1) {
              return null;
            }
            
            return (
              <circle
                key={`waypoint-${index}`}
                cx={getX(point.lng)}
                cy={getY(point.lat)}
                r="2"
                fill="#1f2937"
                className="drop-shadow-sm"
              />
            );
          })}
          
          <circle
            cx={getX(points[0].lng)}
            cy={getY(points[0].lat)}
            r="6"
            fill="#22c55e"
            stroke="#fff"
            strokeWidth="2"
            className="drop-shadow-sm"
          />
          
          <circle
            cx={getX(points[points.length - 1].lng)}
            cy={getY(points[points.length - 1].lat)}
            r="6"
            fill="#ef4444"
            stroke="#fff"
            strokeWidth="2"
            className="drop-shadow-sm"
          />
          
          <text
            x={getX(points[0].lng)}
            y={getY(points[0].lat) - 12}
            textAnchor="middle"
            className="text-xs font-semibold fill-green-600"
          >
            START
          </text>
          
          <text
            x={getX(points[points.length - 1].lng)}
            y={getY(points[points.length - 1].lat) - 12}
            textAnchor="middle"
            className="text-xs font-semibold fill-red-600"
          >
            END
          </text>
        </svg>
      </div>
      
      <div className="mt-4 space-y-4">
        {/* Elevation Legend */}
        <div>
          <div className="font-semibold text-gray-700 mb-2">Elevation Profile</div>
          <div className="flex items-center space-x-4 text-xs">
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 rounded" style={{ backgroundColor: '#22c55e' }}></div>
              <span>Low</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 rounded" style={{ backgroundColor: '#84cc16' }}></div>
              <span>Med-Low</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 rounded" style={{ backgroundColor: '#eab308' }}></div>
              <span>Medium</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 rounded" style={{ backgroundColor: '#f97316' }}></div>
              <span>Med-High</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 rounded" style={{ backgroundColor: '#dc2626' }}></div>
              <span>High</span>
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