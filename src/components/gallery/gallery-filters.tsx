/**
 * Gallery filters component
 */

import { Search, Filter, X } from 'lucide-react';
import { STYLES } from '@/constants/styles';

interface GalleryFilters {
  searchQuery: string;
  difficulty: string | null;
  tags: string[];
  sortBy: 'newest' | 'oldest' | 'distance' | 'difficulty';
  minDistance: number | null;
  maxDistance: number | null;
}

interface GalleryFiltersProps {
  filters: GalleryFilters;
  onFiltersChange: (filters: GalleryFilters) => void;
}

export function GalleryFilters({ filters, onFiltersChange }: GalleryFiltersProps) {
  const updateFilter = (key: keyof GalleryFilters, value: string | number | null | string[]) => {
    onFiltersChange({
      ...filters,
      [key]: value
    });
  };

  const clearFilters = () => {
    onFiltersChange({
      searchQuery: '',
      difficulty: null,
      tags: [],
      sortBy: 'newest',
      minDistance: null,
      maxDistance: null,
    });
  };

  const handleDistanceChange = (key: 'minDistance' | 'maxDistance', value: string) => {
    const numValue = value === '' ? null : Math.max(0, Number(value));
    updateFilter(key, numValue);
  };

  return (
    <div className={STYLES.CARD}>
      <h3 className={`${STYLES.HEADING_LG} mb-4 ${STYLES.FLEX_ITEMS_CENTER}`}>
        <Filter className={`${STYLES.ICON_SM} mr-2`} />
        Filters
      </h3>
      
      <div className={STYLES.SPACE_Y_4}>
        {/* Search Input */}
        <div>
          <label className={STYLES.LABEL}>Search Routes</label>
          <div className="relative">
            <Search className={`${STYLES.ICON_SM} absolute left-3 top-3 text-gray-400`} />
            <input
              type="text"
              value={filters.searchQuery}
              onChange={(e) => updateFilter('searchQuery', e.target.value)}
              placeholder="Search routes..."
              className={`${STYLES.INPUT} pl-10 text-gray-900 placeholder-gray-500`}
            />
          </div>
        </div>

        {/* Difficulty Filter */}
        <div>
          <label className={STYLES.LABEL}>Difficulty</label>
          <select
            value={filters.difficulty || ''}
            onChange={(e) => updateFilter('difficulty', e.target.value || null)}
            className={`${STYLES.INPUT} text-gray-900`}
          >
            <option value="">All Difficulties</option>
            <option value="easy">Easy</option>
            <option value="moderate">Moderate</option>
            <option value="hard">Hard</option>
            <option value="extreme">Extreme</option>
          </select>
        </div>

        {/* Distance Range */}
        <div>
          <label className={STYLES.LABEL}>Distance Range</label>
          <div className="grid grid-cols-2 gap-2">
            <input
              type="number"
              min="0"
              step="0.1"
              value={filters.minDistance || ''}
              onChange={(e) => handleDistanceChange('minDistance', e.target.value)}
              placeholder="Min"
              aria-label="Min Distance (km)"
              className={`${STYLES.INPUT} text-gray-900 placeholder-gray-500`}
            />
            <input
              type="number"
              min="0"
              step="0.1"
              value={filters.maxDistance || ''}
              onChange={(e) => handleDistanceChange('maxDistance', e.target.value)}
              placeholder="Max"
              aria-label="Max Distance (km)"
              className={`${STYLES.INPUT} text-gray-900 placeholder-gray-500`}
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">Distance in kilometers</p>
        </div>

        {/* Sort Options */}
        <div>
          <label className={STYLES.LABEL}>Sort By</label>
          <select
            value={filters.sortBy}
            onChange={(e) => updateFilter('sortBy', e.target.value)}
            className={`${STYLES.INPUT} text-gray-900`}
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="distance">Distance</option>
            <option value="difficulty">Difficulty</option>
          </select>
        </div>

        {/* Clear Filters Button */}
        <button
          onClick={clearFilters}
          className={`${STYLES.BUTTON_SECONDARY} w-full ${STYLES.FLEX_ITEMS_CENTER} justify-center`}
        >
          <X className={`${STYLES.ICON_SM} mr-2`} />
          Clear Filters
        </button>
      </div>
    </div>
  );
}