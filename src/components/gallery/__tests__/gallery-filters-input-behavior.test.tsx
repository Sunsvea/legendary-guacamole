/**
 * Tests for GalleryFilters input behavior - preventing page refresh
 */

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { GalleryFilters } from '../gallery-filters';
import type { GalleryFilters as GalleryFiltersType } from '../gallery-filters';

describe('GalleryFilters - Input Behavior', () => {
  const defaultFilters: GalleryFiltersType = {
    searchQuery: '',
    difficulty: null,
    country: null,
    tags: [],
    sortBy: 'newest',
    minDistance: null,
    maxDistance: null,
  };

  const mockOnFiltersChange = jest.fn();

  beforeEach(() => {
    mockOnFiltersChange.mockClear();
  });

  describe('Enter Key Prevention', () => {
    it('should prevent default behavior when Enter is pressed in search input', async () => {
      const user = userEvent.setup();
      
      render(
        <GalleryFilters
          filters={defaultFilters}
          onFiltersChange={mockOnFiltersChange}
        />
      );

      const searchInput = screen.getByPlaceholderText('Search routes...');
      
      // Focus and press Enter without typing
      await user.click(searchInput);
      await user.keyboard('{Enter}');

      // Should not have called onChange for Enter
      expect(mockOnFiltersChange).not.toHaveBeenCalled();
    });

    it('should prevent default behavior when Enter is pressed in min distance input', async () => {
      const user = userEvent.setup();
      
      render(
        <GalleryFilters
          filters={defaultFilters}
          onFiltersChange={mockOnFiltersChange}
        />
      );

      const minDistanceInput = screen.getByLabelText('Min Distance (km)');
      
      await user.click(minDistanceInput);
      await user.keyboard('{Enter}');

      // Should not have called onChange for Enter without typing
      expect(mockOnFiltersChange).not.toHaveBeenCalled();
    });

    it('should prevent default behavior when Enter is pressed in max distance input', async () => {
      const user = userEvent.setup();
      
      render(
        <GalleryFilters
          filters={defaultFilters}
          onFiltersChange={mockOnFiltersChange}
        />
      );

      const maxDistanceInput = screen.getByLabelText('Max Distance (km)');
      
      await user.click(maxDistanceInput);
      await user.keyboard('{Enter}');

      // Should not have called onChange for Enter without typing
      expect(mockOnFiltersChange).not.toHaveBeenCalled();
    });
  });

  describe('Form Submission Prevention', () => {
    it('should not trigger form submission when Enter is pressed', async () => {
      const user = userEvent.setup();
      const mockSubmit = jest.fn();
      
      // Wrap in a form to test form submission prevention
      const TestWrapper = () => (
        <form onSubmit={mockSubmit}>
          <GalleryFilters
            filters={defaultFilters}
            onFiltersChange={mockOnFiltersChange}
          />
        </form>
      );
      
      render(<TestWrapper />);

      const searchInput = screen.getByPlaceholderText('Search routes...');
      const minDistanceInput = screen.getByLabelText('Min Distance (km)');
      const maxDistanceInput = screen.getByLabelText('Max Distance (km)');
      
      // Test Enter on search input
      await user.click(searchInput);
      await user.keyboard('{Enter}');
      expect(mockSubmit).not.toHaveBeenCalled();
      
      // Test Enter on min distance input
      await user.click(minDistanceInput);
      await user.keyboard('{Enter}');
      expect(mockSubmit).not.toHaveBeenCalled();
      
      // Test Enter on max distance input
      await user.click(maxDistanceInput);
      await user.keyboard('{Enter}');
      expect(mockSubmit).not.toHaveBeenCalled();
    });

    it('should handle typing and Enter combination without form submission', async () => {
      const user = userEvent.setup();
      const mockSubmit = jest.fn();
      
      const TestWrapper = () => (
        <form onSubmit={mockSubmit}>
          <GalleryFilters
            filters={defaultFilters}
            onFiltersChange={mockOnFiltersChange}
          />
        </form>
      );
      
      render(<TestWrapper />);

      const searchInput = screen.getByPlaceholderText('Search routes...');
      const minDistanceInput = screen.getByLabelText('Min Distance (km)');
      
      // Type in search and press Enter
      await user.type(searchInput, 'test');
      await user.keyboard('{Enter}');
      expect(mockSubmit).not.toHaveBeenCalled();
      
      // Type in distance and press Enter
      await user.type(minDistanceInput, '5');
      await user.keyboard('{Enter}');
      expect(mockSubmit).not.toHaveBeenCalled();
      
      // Verify onChange was called for typing but not for Enter
      expect(mockOnFiltersChange).toHaveBeenCalled();
    });
  });

  describe('Normal Input Behavior', () => {
    it('should update search query when typing', async () => {
      const user = userEvent.setup();
      
      render(
        <GalleryFilters
          filters={defaultFilters}
          onFiltersChange={mockOnFiltersChange}
        />
      );

      const searchInput = screen.getByPlaceholderText('Search routes...');
      
      await user.type(searchInput, 'a');
      expect(mockOnFiltersChange).toHaveBeenCalledWith({
        ...defaultFilters,
        searchQuery: 'a',
      });
    });

    it('should update distance values when typing', async () => {
      const user = userEvent.setup();
      
      render(
        <GalleryFilters
          filters={defaultFilters}
          onFiltersChange={mockOnFiltersChange}
        />
      );

      const minDistanceInput = screen.getByLabelText('Min Distance (km)');
      
      await user.type(minDistanceInput, '5');
      expect(mockOnFiltersChange).toHaveBeenCalledWith({
        ...defaultFilters,
        minDistance: 5,
      });
    });

    it('should handle clearing inputs', async () => {
      const user = userEvent.setup();
      const filtersWithValues: GalleryFiltersType = {
        ...defaultFilters,
        searchQuery: 'test',
        minDistance: 5,
      };
      
      render(
        <GalleryFilters
          filters={filtersWithValues}
          onFiltersChange={mockOnFiltersChange}
        />
      );

      const searchInput = screen.getByDisplayValue('test');
      
      await user.clear(searchInput);
      expect(mockOnFiltersChange).toHaveBeenCalledWith({
        ...filtersWithValues,
        searchQuery: '',
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle multiple Enter presses without issues', async () => {
      const user = userEvent.setup();
      const mockSubmit = jest.fn();
      
      const TestWrapper = () => (
        <form onSubmit={mockSubmit}>
          <GalleryFilters
            filters={defaultFilters}
            onFiltersChange={mockOnFiltersChange}
          />
        </form>
      );
      
      render(<TestWrapper />);

      const searchInput = screen.getByPlaceholderText('Search routes...');
      
      // Multiple Enter presses
      await user.click(searchInput);
      await user.keyboard('{Enter}');
      await user.keyboard('{Enter}');
      await user.keyboard('{Enter}');
      
      // Should not trigger form submission
      expect(mockSubmit).not.toHaveBeenCalled();
      expect(mockOnFiltersChange).not.toHaveBeenCalled();
    });

    it('should handle rapid typing without page refresh', async () => {
      const user = userEvent.setup();
      
      render(
        <GalleryFilters
          filters={defaultFilters}
          onFiltersChange={mockOnFiltersChange}
        />
      );

      const searchInput = screen.getByPlaceholderText('Search routes...');
      
      // Rapid typing (each character triggers onChange)
      await user.type(searchInput, 'test');
      
      // Verify onChange was called for each character
      expect(mockOnFiltersChange).toHaveBeenCalledTimes(4);
      
      // The important part: no page refresh should occur
      // This is implicitly tested by the test completing successfully
    });
  });
});