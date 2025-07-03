// Color constants for consistent theming
export const COLORS = {
  // Elevation colors
  ELEVATION: {
    LOW: '#22c55e',
    MED_LOW: '#84cc16', 
    MEDIUM: '#eab308',
    MED_HIGH: '#f97316',
    HIGH: '#dc2626',
  },
  
  // Route points
  START_POINT: '#22c55e',
  END_POINT: '#ef4444',
  WAYPOINT: '#374151',
  
  // Text colors (Tailwind classes)
  TEXT: {
    PRIMARY: 'text-gray-900',
    SECONDARY: 'text-gray-600',
    MUTED: 'text-gray-500',
    BLUE: 'text-blue-600',
    GREEN: 'text-green-600',
    RED: 'text-red-600',
    ORANGE: 'text-orange-600',
    PURPLE: 'text-purple-600',
  },
} as const;