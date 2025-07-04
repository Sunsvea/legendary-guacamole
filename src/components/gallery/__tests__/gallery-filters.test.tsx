/**
 * Tests for gallery filters component
 */

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { GalleryFilters } from '../gallery-filters';

describe('GalleryFilters', () => {
  const mockOnFiltersChange = jest.fn();

  const defaultFilters = {
    searchQuery: '',
    difficulty: null,
    country: null,
    tags: [],
    sortBy: 'newest' as const,
    minDistance: null,
    maxDistance: null,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render all filter controls', () => {
    render(
      <GalleryFilters 
        filters={defaultFilters}
        onFiltersChange={mockOnFiltersChange}
      />
    );

    expect(screen.getByPlaceholderText('Search routes...')).toBeInTheDocument();
    expect(screen.getByDisplayValue('All Difficulties')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Newest First')).toBeInTheDocument();
    expect(screen.getByLabelText('Min Distance (km)')).toBeInTheDocument();
    expect(screen.getByLabelText('Max Distance (km)')).toBeInTheDocument();
  });

  it('should handle search query changes', async () => {
    render(
      <GalleryFilters 
        filters={defaultFilters}
        onFiltersChange={mockOnFiltersChange}
      />
    );

    const searchInput = screen.getByPlaceholderText('Search routes...');
    await userEvent.type(searchInput, 'alpine');

    // Should be called for each character typed
    expect(mockOnFiltersChange).toHaveBeenCalled();
    expect(mockOnFiltersChange).toHaveBeenCalledWith(
      expect.objectContaining({
        searchQuery: expect.stringContaining('a')
      })
    );
  });

  it('should handle difficulty filter changes', async () => {
    render(
      <GalleryFilters 
        filters={defaultFilters}
        onFiltersChange={mockOnFiltersChange}
      />
    );

    const difficultySelect = screen.getByDisplayValue('All Difficulties');
    await userEvent.selectOptions(difficultySelect, 'moderate');

    expect(mockOnFiltersChange).toHaveBeenCalledWith({
      ...defaultFilters,
      difficulty: 'moderate'
    });
  });

  it('should handle sort changes', async () => {
    render(
      <GalleryFilters 
        filters={defaultFilters}
        onFiltersChange={mockOnFiltersChange}
      />
    );

    const sortSelect = screen.getByDisplayValue('Newest First');
    await userEvent.selectOptions(sortSelect, 'distance');

    expect(mockOnFiltersChange).toHaveBeenCalledWith({
      ...defaultFilters,
      sortBy: 'distance'
    });
  });

  it('should handle distance range filters', async () => {
    render(
      <GalleryFilters 
        filters={defaultFilters}
        onFiltersChange={mockOnFiltersChange}
      />
    );

    const minDistanceInput = screen.getByLabelText('Min Distance (km)');
    const maxDistanceInput = screen.getByLabelText('Max Distance (km)');

    await userEvent.type(minDistanceInput, '5');
    expect(mockOnFiltersChange).toHaveBeenCalledWith(
      expect.objectContaining({
        minDistance: 5
      })
    );

    await userEvent.type(maxDistanceInput, '15');
    expect(mockOnFiltersChange).toHaveBeenCalledWith(
      expect.objectContaining({
        maxDistance: expect.any(Number)
      })
    );
  });

  it('should display active filter indicators', () => {
    const activeFilters = {
      searchQuery: 'summit',
      difficulty: 'hard',
      tags: ['hiking'],
      sortBy: 'distance' as const,
      minDistance: 5,
      maxDistance: 15,
    };

    render(
      <GalleryFilters 
        filters={activeFilters}
        onFiltersChange={mockOnFiltersChange}
      />
    );

    expect(screen.getByDisplayValue('summit')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Hard')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Distance')).toBeInTheDocument();
    expect(screen.getByDisplayValue('5')).toBeInTheDocument();
    expect(screen.getByDisplayValue('15')).toBeInTheDocument();
  });

  it('should provide clear filters functionality', async () => {
    const activeFilters = {
      searchQuery: 'summit',
      difficulty: 'hard',
      tags: ['hiking'],
      sortBy: 'distance' as const,
      minDistance: 5,
      maxDistance: 15,
    };

    render(
      <GalleryFilters 
        filters={activeFilters}
        onFiltersChange={mockOnFiltersChange}
      />
    );

    const clearButton = screen.getByText('Clear Filters');
    await userEvent.click(clearButton);

    expect(mockOnFiltersChange).toHaveBeenCalledWith(defaultFilters);
  });

  it('should validate distance range inputs', async () => {
    render(
      <GalleryFilters 
        filters={defaultFilters}
        onFiltersChange={mockOnFiltersChange}
      />
    );

    const minDistanceInput = screen.getByLabelText('Min Distance (km)');
    
    // Should not accept negative values
    await userEvent.type(minDistanceInput, '-5');
    expect(mockOnFiltersChange).not.toHaveBeenCalledWith(
      expect.objectContaining({ minDistance: -5 })
    );
  });
});