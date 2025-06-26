// Reusable Style Constants
export const STYLES = {
  // Container styles
  CONTAINER: 'container mx-auto px-4',
  MAX_WIDTH_4XL: 'max-w-4xl mx-auto',
  MAX_WIDTH_2XL: 'max-w-2xl mx-auto',

  // Card styles
  CARD: 'bg-white rounded-lg shadow-md p-6',
  CARD_HOVER: 'bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow',

  // Layout spacing
  SPACE_Y_4: 'space-y-4',
  SPACE_Y_8: 'space-y-8',
  SPACE_X_2: 'space-x-2',
  SPACE_X_4: 'space-x-4',

  // Grid layouts
  GRID_2_MD_4: 'grid grid-cols-2 md:grid-cols-4 gap-4',
  GRID_1_MD_2: 'grid grid-cols-1 md:grid-cols-2 gap-4',
  GRID_1_LG_2: 'grid grid-cols-1 lg:grid-cols-2 gap-6',
  GRID_2_GAP_2: 'grid grid-cols-2 gap-2',
  GRID_3_GAP_4: 'grid grid-cols-3 gap-4',

  // Text styles
  HEADING_XL: 'text-xl font-semibold text-gray-900',
  HEADING_LG: 'text-lg font-semibold text-gray-900',
  HEADING_3XL: 'text-3xl font-bold text-gray-900',
  TEXT_CENTER: 'text-center',
  TEXT_SM_GRAY: 'text-sm text-gray-600',
  TEXT_SM_GRAY_500: 'text-sm text-gray-500',
  TEXT_LG_GRAY: 'text-lg text-gray-600',
  LABEL_STYLE: 'text-sm font-medium text-gray-700',
  METRIC_VALUE: 'text-2xl font-bold',
  METRIC_LABEL: 'text-sm text-gray-500',

  // Button styles
  BUTTON_FLEX_COL_SM_ROW: 'flex flex-col sm:flex-row gap-2',

  // Input groups
  INPUT_GROUP: 'space-y-2',
  INPUT_LABEL_WITH_ICON: 'flex items-center space-x-2 text-sm font-medium text-gray-700',

  // Color classes for metrics
  COLOR_BLUE: 'text-blue-600',
  COLOR_GREEN: 'text-green-600',
  COLOR_ORANGE: 'text-orange-600',
  COLOR_PURPLE: 'text-purple-600',
  COLOR_RED: 'text-red-600',

  // Background colors
  BG_GRAY_50: 'bg-gray-50',
  BG_BLUE_50: 'bg-blue-50',
  BG_GRAY_100: 'bg-gray-100',

  // Responsive styles
  HIDDEN_MD_FLEX: 'hidden md:flex space-x-6',
  
  // Common utility combinations
  FLEX_CENTER: 'flex items-center justify-center',
  FLEX_BETWEEN: 'flex items-center justify-between',
  FLEX_ITEMS_CENTER: 'flex items-center',

  // Map and chart specific
  OVERFLOW_HIDDEN_ROUNDED: 'overflow-hidden rounded border border-gray-300 relative',
  ABSOLUTE_INSET: 'absolute inset-0',
  
  // Form styles
  FORM_SECTION: 'space-y-4',
  TIP_BOX: 'mt-4 p-3 bg-blue-50 rounded-lg',
  TIP_TEXT: 'text-sm text-blue-800',

  // Icon sizes
  ICON_SM: 'h-4 w-4',
  ICON_MD: 'h-5 w-5',
  ICON_LG: 'h-8 w-8',
} as const;