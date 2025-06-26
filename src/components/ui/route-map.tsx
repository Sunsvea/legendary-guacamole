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
  
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);
  
  const latRange = maxLat - minLat || 0.01;
  const lngRange = maxLng - minLng || 0.01;
  
  const mapWidth = 600;
  const mapHeight = 400;
  const padding = 40;

  const getX = (lng: number) => padding + ((lng - minLng) / lngRange) * (mapWidth - 2 * padding);
  const getY = (lat: number) => mapHeight - padding - ((lat - minLat) / latRange) * (mapHeight - 2 * padding);

  const pathData = points
    .map((point, index) => {
      const x = getX(point.lng);
      const y = getY(point.lat);
      return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
    })
    .join(' ');

  const gridLines = [];
  for (let i = 0; i <= 4; i++) {
    const x = padding + (i / 4) * (mapWidth - 2 * padding);
    const y = padding + (i / 4) * (mapHeight - 2 * padding);
    
    gridLines.push(
      <g key={`grid-${i}`}>
        <line
          x1={x}
          y1={padding}
          x2={x}
          y2={mapHeight - padding}
          stroke="#f3f4f6"
          strokeWidth="1"
        />
        <line
          x1={padding}
          y1={y}
          x2={mapWidth - padding}
          y2={y}
          stroke="#f3f4f6"
          strokeWidth="1"
        />
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
          
          {gridLines}
          
          <path
            d={pathData}
            fill="none"
            stroke="#ef4444"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="drop-shadow-sm"
          />
          
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
      
      <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
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
  );
}