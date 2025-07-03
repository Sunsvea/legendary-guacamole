'use client';

import { RoutePoint } from '@/types/route';
import { formatElevation } from '@/lib/utils';
import { UI_TEXT } from '@/constants/ui-text';
import { STYLES } from '@/constants/styles';
import { COLORS } from '@/constants/colors';

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

  // Dynamic chart sizing based on number of waypoints - made larger
  const minWidth = 600;
  const maxWidth = 1400;
  const chartWidth = Math.min(maxWidth, Math.max(minWidth, points.length * 3)); // 3px per waypoint minimum
  const chartHeight = 350; // Much taller for better visibility
  const padding = 50; // More padding for labels

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
    <div className={`${STYLES.CARD} ${className || ''}`}>
      <div className={`${STYLES.FLEX_BETWEEN} mb-4`}>
        <h3 className={STYLES.HEADING_LG}>{UI_TEXT.ELEVATION_PROFILE}</h3>
        <div className={`${STYLES.FLEX_ITEMS_CENTER} ${STYLES.SPACE_X_4} ${STYLES.TEXT_SM_GRAY}`}>
          <span>{UI_TEXT.MAX_ELEVATION} {formatElevation(maxElevation)}</span>
          <span>{UI_TEXT.MIN_ELEVATION} {formatElevation(minElevation)}</span>
          <span>{UI_TEXT.ELEVATION_RANGE} {formatElevation(elevationRange)}</span>
        </div>
      </div>
      
      <div className="w-full">
        <svg 
          width="100%" 
          height={chartHeight} 
          viewBox={`0 0 ${chartWidth} ${chartHeight}`}
          preserveAspectRatio="none"
          className="w-full"
        >
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
            // Show markers more intelligently based on chart width and point count
            const maxMarkers = Math.min(12, Math.floor(chartWidth / 80)); // Max 12 markers, min 80px apart for labels
            const markerInterval = Math.max(1, Math.floor(points.length / maxMarkers));
            
            // Ensure end marker doesn't overlap with the last percentage marker
            const isEndMarker = index === points.length - 1;
            const isLastPercentageMarker = index === Math.floor((maxMarkers - 1) * markerInterval);
            const shouldShowMarker = (index % markerInterval === 0 || index === 0 || isEndMarker) && 
                                   !(isEndMarker && isLastPercentageMarker && markerInterval < 10);
            
            if (!shouldShowMarker) {
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
                  y={chartHeight - 8}
                  textAnchor="middle"
                  className="text-xs fill-gray-600 font-medium"
                >
                  {index === 0 ? UI_TEXT.START_CHART_LABEL : 
                   index === points.length - 1 ? UI_TEXT.END_CHART_LABEL : 
                   `${Math.round((index / points.length) * 100)}%`}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
      
      <div className={`mt-4 ${STYLES.GRID_3_GAP_4} ${STYLES.TEXT_SM_GRAY}`}>
        <div className={STYLES.TEXT_CENTER}>
          <div className={`font-semibold ${COLORS.TEXT.GREEN}`}>{formatElevation(points[0]?.elevation || 0)}</div>
          <div className={STYLES.TEXT_SM_GRAY_500}>{UI_TEXT.START_ELEVATION}</div>
        </div>
        <div className={STYLES.TEXT_CENTER}>
          <div className={`font-semibold ${COLORS.TEXT.BLUE}`}>{formatElevation(maxElevation)}</div>
          <div className={STYLES.TEXT_SM_GRAY_500}>{UI_TEXT.HIGHEST_POINT}</div>
        </div>
        <div className={STYLES.TEXT_CENTER}>
          <div className={`font-semibold ${COLORS.TEXT.RED}`}>{formatElevation(points[points.length - 1]?.elevation || 0)}</div>
          <div className={STYLES.TEXT_SM_GRAY_500}>{UI_TEXT.END_ELEVATION}</div>
        </div>
      </div>
    </div>
  );
}