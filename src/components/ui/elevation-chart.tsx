'use client';

import { RoutePoint } from '@/types/route';
import { formatElevation, formatDistance } from '@/lib/utils';

interface ElevationChartProps {
  points: RoutePoint[];
  className?: string;
}

export function ElevationChart({ points, className = '' }: ElevationChartProps) {
  if (!points || points.length === 0) {
    return null;
  }

  const maxElevation = Math.max(...points.map(p => p.elevation));
  const minElevation = Math.min(...points.map(p => p.elevation));
  const elevationRange = maxElevation - minElevation || 1;

  const chartWidth = 800;
  const chartHeight = 200;
  const padding = 40;

  const pathData = points
    .map((point, index) => {
      const x = padding + (index / (points.length - 1)) * (chartWidth - 2 * padding);
      const y = chartHeight - padding - ((point.elevation - minElevation) / elevationRange) * (chartHeight - 2 * padding);
      return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
    })
    .join(' ');

  const areaData = `${pathData} L ${chartWidth - padding} ${chartHeight - padding} L ${padding} ${chartHeight - padding} Z`;

  const gridLines = [];
  for (let i = 0; i <= 5; i++) {
    const y = padding + (i / 5) * (chartHeight - 2 * padding);
    const elevation = maxElevation - (i / 5) * elevationRange;
    gridLines.push(
      <g key={i}>
        <line
          x1={padding}
          y1={y}
          x2={chartWidth - padding}
          y2={y}
          stroke="#e5e7eb"
          strokeWidth="1"
        />
        <text
          x={padding - 5}
          y={y + 4}
          textAnchor="end"
          className="text-xs fill-gray-500"
        >
          {formatElevation(elevation)}
        </text>
      </g>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Elevation Profile</h3>
        <div className="flex items-center space-x-4 text-sm text-gray-600">
          <span>Max: {formatElevation(maxElevation)}</span>
          <span>Min: {formatElevation(minElevation)}</span>
          <span>Range: {formatElevation(elevationRange)}</span>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <svg width={chartWidth} height={chartHeight} className="w-full">
          {gridLines}
          
          <defs>
            <linearGradient id="elevationGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.1" />
            </linearGradient>
          </defs>
          
          <path
            d={areaData}
            fill="url(#elevationGradient)"
            className="drop-shadow-sm"
          />
          
          <path
            d={pathData}
            fill="none"
            stroke="#3b82f6"
            strokeWidth="2"
            className="drop-shadow-sm"
          />
          
          {points.map((point, index) => {
            if (index % Math.ceil(points.length / 10) !== 0 && index !== 0 && index !== points.length - 1) {
              return null;
            }
            
            const x = padding + (index / (points.length - 1)) * (chartWidth - 2 * padding);
            const y = chartHeight - padding - ((point.elevation - minElevation) / elevationRange) * (chartHeight - 2 * padding);
            
            return (
              <g key={index}>
                <circle
                  cx={x}
                  cy={y}
                  r="3"
                  fill="#3b82f6"
                  className="drop-shadow-sm"
                />
                <text
                  x={x}
                  y={chartHeight - 5}
                  textAnchor="middle"
                  className="text-xs fill-gray-500"
                >
                  {index === 0 ? 'Start' : index === points.length - 1 ? 'End' : `${index}`}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
      
      <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
        <div className="text-center">
          <div className="font-semibold text-green-600">{formatElevation(points[0]?.elevation || 0)}</div>
          <div className="text-gray-500">Start Elevation</div>
        </div>
        <div className="text-center">
          <div className="font-semibold text-blue-600">{formatElevation(maxElevation)}</div>
          <div className="text-gray-500">Highest Point</div>
        </div>
        <div className="text-center">
          <div className="font-semibold text-red-600">{formatElevation(points[points.length - 1]?.elevation || 0)}</div>
          <div className="text-gray-500">End Elevation</div>
        </div>
      </div>
    </div>
  );
}