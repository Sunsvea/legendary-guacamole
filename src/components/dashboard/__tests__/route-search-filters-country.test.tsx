/**
 * Tests for RouteSearchFilters component - Country Filter
 */

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RouteSearchFilters } from '../route-search-filters';
import type { RouteFilters } from '../route-search-filters';

describe('RouteSearchFilters - Country Filter', () => {
  const defaultFilters: RouteFilters = {
    searchQuery: '',
    difficulty: null,
    country: null,
    isPublic: null,
    sortBy: 'newest',
  };

  const mockOnFiltersChange = jest.fn();

  beforeEach(() => {
    mockOnFiltersChange.mockClear();
  });

  it('should render country filter autocomplete in dashboard', () => {
    render(
      <RouteSearchFilters
        filters={defaultFilters}
        onFiltersChange={mockOnFiltersChange}
      />
    );

    const countryInput = screen.getByLabelText('Country');
    expect(countryInput).toBeInTheDocument();
    expect(countryInput).toHaveValue('');
    expect(countryInput).toHaveAttribute('placeholder', 'Search countries...');
    expect(countryInput).toHaveAttribute('id', 'dashboard-country-filter');
  });

  it('should show autocomplete dropdown when country input is focused', async () => {
    const user = userEvent.setup();
    
    render(
      <RouteSearchFilters
        filters={defaultFilters}
        onFiltersChange={mockOnFiltersChange}
      />
    );

    const countryInput = screen.getByLabelText('Country');
    await user.click(countryInput);

    expect(screen.getByRole('listbox')).toBeInTheDocument();
  });

  it('should filter and select countries in dashboard', async () => {
    const user = userEvent.setup();
    
    render(
      <RouteSearchFilters
        filters={defaultFilters}
        onFiltersChange={mockOnFiltersChange}
      />
    );

    const countryInput = screen.getByLabelText('Country');
    await user.click(countryInput);
    await user.type(countryInput, 'ital');
    
    const italyOption = screen.getByText('Italy');
    await user.click(italyOption);

    expect(mockOnFiltersChange).toHaveBeenCalledWith({
      ...defaultFilters,
      country: 'Italy',
    });
  });

  it('should display selected country in dashboard input', () => {
    const filtersWithCountry: RouteFilters = {
      ...defaultFilters,
      country: 'Greece',
    };

    render(
      <RouteSearchFilters
        filters={filtersWithCountry}
        onFiltersChange={mockOnFiltersChange}
      />
    );

    const countryInput = screen.getByLabelText('Country');
    expect(countryInput).toHaveValue('Greece');
  });

  it('should clear country selection in dashboard', async () => {
    const user = userEvent.setup();
    const filtersWithCountry: RouteFilters = {
      ...defaultFilters,
      country: 'Peru',
    };

    render(
      <RouteSearchFilters
        filters={filtersWithCountry}
        onFiltersChange={mockOnFiltersChange}
      />
    );

    const clearButton = screen.getByTitle('Clear selection');
    await user.click(clearButton);

    expect(mockOnFiltersChange).toHaveBeenCalledWith({
      ...filtersWithCountry,
      country: null,
    });
  });

  it('should handle auto-selection when exact country name is typed', async () => {
    const user = userEvent.setup();
    
    render(
      <RouteSearchFilters
        filters={defaultFilters}
        onFiltersChange={mockOnFiltersChange}
      />
    );

    const countryInput = screen.getByLabelText('Country');
    await user.type(countryInput, 'Luxembourg');

    expect(mockOnFiltersChange).toHaveBeenCalledWith({
      ...defaultFilters,
      country: 'Luxembourg',
    });
  });

  it('should work alongside other dashboard filters', async () => {
    const user = userEvent.setup();
    const filtersWithOtherValues: RouteFilters = {
      searchQuery: 'mountain',
      difficulty: 'hard',
      country: null,
      isPublic: true,
      sortBy: 'distance',
    };

    render(
      <RouteSearchFilters
        filters={filtersWithOtherValues}
        onFiltersChange={mockOnFiltersChange}
      />
    );

    const countryInput = screen.getByLabelText('Country');
    await user.type(countryInput, 'Albania');

    expect(mockOnFiltersChange).toHaveBeenCalledWith({
      ...filtersWithOtherValues,
      country: 'Albania',
    });
  });

  it('should support keyboard navigation in dashboard', async () => {
    const user = userEvent.setup();
    
    render(
      <RouteSearchFilters
        filters={defaultFilters}
        onFiltersChange={mockOnFiltersChange}
      />
    );

    const countryInput = screen.getByLabelText('Country');
    await user.click(countryInput);
    await user.type(countryInput, 'a');

    // Navigate with arrow keys
    await user.keyboard('{ArrowDown}');
    await user.keyboard('{Enter}');

    // Should have called onFiltersChange with the first country starting with 'a'
    expect(mockOnFiltersChange).toHaveBeenCalled();
    const lastCall = mockOnFiltersChange.mock.calls[mockOnFiltersChange.mock.calls.length - 1][0];
    expect(lastCall.country).toBeTruthy();
    expect(lastCall.country?.toLowerCase().startsWith('a')).toBe(true);
  });

  it('should handle no results state in dashboard', async () => {
    const user = userEvent.setup();
    
    render(
      <RouteSearchFilters
        filters={defaultFilters}
        onFiltersChange={mockOnFiltersChange}
      />
    );

    const countryInput = screen.getByLabelText('Country');
    await user.click(countryInput);
    await user.type(countryInput, 'nonexistentcountry');

    expect(screen.getByText(/No countries found matching.*nonexistentcountry/)).toBeInTheDocument();
  });
});