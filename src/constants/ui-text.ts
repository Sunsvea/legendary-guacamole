// UI Text Constants for internationalization
export const UI_TEXT = {
  // Header
  APP_TITLE: 'Alpine Route Optimizer',
  NAV_ROUTES: 'Routes',
  NAV_WEATHER: 'Weather',
  NAV_ABOUT: 'About',

  // Main Page
  HERO_TITLE: 'Optimize Your Alpine Adventures',
  HERO_DESCRIPTION: 'Plan the perfect mountain route with AI-powered pathfinding, real-time weather data, and elevation analysis.',

  // Route Input Form
  PLAN_YOUR_ROUTE: 'Plan Your Route',
  START_POINT: 'Start Point',
  END_POINT: 'End Point',
  LATITUDE_PLACEHOLDER: 'Latitude',
  LONGITUDE_PLACEHOLDER: 'Longitude',
  FIND_OPTIMAL_ROUTE: 'Find Optimal Route',
  FINDING_ROUTE: 'Finding Route...',
  USE_EXAMPLE: 'Use Example (Grindelwald to Eiger)',
  COORDINATE_TIP: 'Enter coordinates in decimal degrees. Positive latitude = North, Positive longitude = East. Example: Matterhorn is at 45.9763, 7.6586',
  TIP_LABEL: 'Tip:',

  // Route Summary
  ROUTE_SUMMARY: 'Route Summary',
  DISTANCE: 'Distance',
  ELEVATION_GAIN: 'Elevation Gain',
  DIFFICULTY: 'Difficulty',
  ESTIMATED_TIME: 'Est. Time',

  // Route Map
  ROUTE_MAP: 'Route Map',
  WAYPOINTS: 'waypoints',
  LOADING_TOPOGRAPHIC_MAP: 'Loading topographic map...',
  START_LABEL: 'START',
  END_LABEL: 'END',
  ROUTE_ELEVATION: 'Route Elevation',
  ELEVATION_LOW: 'Low',
  ELEVATION_MED_LOW: 'Med-Low',
  ELEVATION_MEDIUM: 'Medium',
  ELEVATION_MED_HIGH: 'Med-High',
  ELEVATION_HIGH: 'High',
  COORDINATES_LABEL: 'Coordinates',
  START_COORDINATES: 'Start:',
  END_COORDINATES: 'End:',
  COVERAGE_LABEL: 'Coverage',
  LAT_COVERAGE: 'Lat:',
  LNG_COVERAGE: 'Lng:',

  // Elevation Chart
  ELEVATION_PROFILE: 'Elevation Profile',
  MAX_ELEVATION: 'Max:',
  MIN_ELEVATION: 'Min:',
  ELEVATION_RANGE: 'Range:',
  START_ELEVATION: 'Start Elevation',
  HIGHEST_POINT: 'Highest Point',
  END_ELEVATION: 'End Elevation',
  START_CHART_LABEL: 'Start',
  END_CHART_LABEL: 'End',

  // Error Messages
  FILL_ALL_COORDINATES: 'Please fill in all coordinates',
  ENTER_VALID_COORDINATES: 'Please enter valid coordinates',
  NO_ROUTE_FOUND: 'No route found',
  ERROR_PLANNING_ROUTE: 'Error planning route. Please try again.',

  // Route Names
  OPTIMIZED_ALPINE_ROUTE: 'Optimized Alpine Route',

  // Units
  UNIT_KM: 'km',
  UNIT_M: 'm',
  UNIT_H: 'h',
  UNIT_DEGREES: '°',

  // Route Saving
  SAVE_ROUTE: 'Save Route',
  SAVING_ROUTE: 'Saving...',
  ROUTE_SAVED: 'Route Saved',
  ROUTE_NAME_LABEL: 'Route Name',
  MAKE_PUBLIC: 'Make Public',
  ROUTE_TAGS: 'Tags (optional)',
  SAVE_SUCCESS: 'Route saved successfully!',
  SAVE_ERROR: 'Failed to save route. Please try again.',
  SIGN_IN_TO_SAVE: 'Sign in to save routes',
  ROUTE_PRIVACY_HELP: 'Public routes can be discovered by other users',
  ROUTE_TAGS_HELP: 'Add tags separated by commas (e.g., summit, glacier, technical)',
  CANCEL: 'Cancel',
  SAVE: 'Save',

  // Dashboard
  DASHBOARD_TITLE: 'Route Dashboard',
  DASHBOARD_SUBTITLE: 'Manage your saved alpine routes',
} as const;