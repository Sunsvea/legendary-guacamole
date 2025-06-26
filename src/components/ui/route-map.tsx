'use client';

import { RoutePoint } from '@/types/route';
import { useState, useEffect } from 'react';

interface RouteMapProps {
  points: RoutePoint[];
  className?: string;
}

export function RouteMap({ points, className = '' }: RouteMapProps) {
  const [mapImageUrl, setMapImageUrl] = useState<string>('');
  
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

  // Add some padding to the bounds for better visualization
  const boundsPadding = 0.001;
  const boundsMinLat = minLat - boundsPadding;
  const boundsMaxLat = maxLat + boundsPadding;
  const boundsMinLng = minLng - boundsPadding;
  const boundsMaxLng = maxLng + boundsPadding;

  const getX = (lng: number) => padding + ((lng - boundsMinLng) / (boundsMaxLng - boundsMinLng)) * (mapWidth - 2 * padding);
  const getY = (lat: number) => mapHeight - padding - ((lat - boundsMinLat) / (boundsMaxLat - boundsMinLat)) * (mapHeight - 2 * padding);
  
  const getElevationColor = (elevation: number) => {
    const normalized = (elevation - minElevation) / elevationRange;
    if (normalized < 0.2) return '#22c55e'; // Low elevation - green
    if (normalized < 0.4) return '#84cc16'; // Medium-low - lime  
    if (normalized < 0.6) return '#eab308'; // Medium - yellow
    if (normalized < 0.8) return '#f97316'; // Medium-high - orange
    return '#dc2626'; // High elevation - red
  };

  // Generate map background using simple satellite imagery approach
  useEffect(() => {
    const centerLat = (minLat + maxLat) / 2;
    const centerLng = (minLng + maxLng) / 2;
    
    // Calculate appropriate zoom level
    const latDiff = maxLat - minLat;
    const lngDiff = maxLng - minLng;
    const maxDiff = Math.max(latDiff, lngDiff);
    let zoom = 12;
    if (maxDiff > 0.1) zoom = 9;
    else if (maxDiff > 0.05) zoom = 10;
    else if (maxDiff > 0.02) zoom = 11;
    else if (maxDiff > 0.01) zoom = 12;
    else if (maxDiff > 0.005) zoom = 13;

    // Use a simple background pattern instead of external API for now
    setMapImageUrl('');
  }, [points, minLat, maxLat, minLng, maxLng]);

  return (
    <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Route Map</h3>
        <div className="text-sm text-gray-600">
          {points.length} waypoints
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <svg width={mapWidth} height={mapHeight} className="w-full border border-gray-300 rounded">
          
          {/* Simple clean background */}
          <rect width={mapWidth} height={mapHeight} fill="#f8fafc" />
          
          {/* Subtle grid */}
          {[...Array(11)].map((_, i) => {
            const x = padding + (i / 10) * (mapWidth - 2 * padding);
            const y = padding + (i / 10) * (mapHeight - 2 * padding);
            return (
              <g key={`grid-${i}`}>
                <line x1={x} y1={padding} x2={x} y2={mapHeight - padding} stroke="#e2e8f0" strokeWidth="1" opacity="0.5" />
                <line x1={padding} y1={y} x2={mapWidth - padding} y2={y} stroke="#e2e8f0" strokeWidth="1" opacity="0.5" />
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
                strokeWidth="5"
                strokeLinecap="round"
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
                fill="#374151"
                stroke="#fff"
                strokeWidth="1"
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