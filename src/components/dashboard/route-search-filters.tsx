/**
 * Route search and filter controls
 */

import { Search, Filter } from 'lucide-react';
import { STYLES } from '@/constants/styles';

interface RouteFilters {
  searchQuery: string;
  difficulty: string | null;
  isPublic: boolean | null;
  sortBy: 'newest' | 'oldest' | 'distance' | 'difficulty';
}

interface RouteSearchFiltersProps {
  filters: RouteFilters;
  onFiltersChange: (filters: RouteFilters) => void;
}

export function RouteSearchFilters({ filters, onFiltersChange }: RouteSearchFiltersProps) {
  const updateFilter = (key: keyof RouteFilters, value: string | boolean | null) => {
    onFiltersChange({
      ...filters,
      [key]: value
    });
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
              placeholder="Search by name or tags..."
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

        {/* Privacy Filter */}
        <div>
          <label className={STYLES.LABEL}>Visibility</label>
          <select
            value={filters.isPublic === null ? '' : filters.isPublic.toString()}
            onChange={(e) => {
              const value = e.target.value;
              updateFilter('isPublic', value === '' ? null : value === 'true');
            }}
            className={`${STYLES.INPUT} text-gray-900`}
          >
            <option value="">All Routes</option>
            <option value="true">Public</option>
            <option value="false">Private</option>
          </select>
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
      </div>
    </div>
  );
}