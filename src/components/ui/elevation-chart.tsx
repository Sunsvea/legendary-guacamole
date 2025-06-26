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
    <div className={`${STYLES.CARD} ${className || ''}`}>
      <div className={`${STYLES.FLEX_BETWEEN} mb-4`}>
        <h3 className={STYLES.HEADING_LG}>{UI_TEXT.ELEVATION_PROFILE}</h3>
        <div className={`${STYLES.FLEX_ITEMS_CENTER} ${STYLES.SPACE_X_4} ${STYLES.TEXT_SM_GRAY}`}>
          <span>{UI_TEXT.MAX_ELEVATION} {formatElevation(maxElevation)}</span>
          <span>{UI_TEXT.MIN_ELEVATION} {formatElevation(minElevation)}</span>
          <span>{UI_TEXT.ELEVATION_RANGE} {formatElevation(elevationRange)}</span>
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
                  {index === 0 ? UI_TEXT.START_CHART_LABEL : index === points.length - 1 ? UI_TEXT.END_CHART_LABEL : `${index}`}
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