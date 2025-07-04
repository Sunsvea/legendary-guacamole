import { render, screen, fireEvent } from '@testing-library/react';
import { GalleryFilters } from '../gallery-filters';
import type { GalleryFilters as GalleryFiltersType } from '../gallery-filters';

describe('GalleryFilters - Country Filter', () => {
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

  it('should render country filter dropdown', () => {
    render(
      <GalleryFilters
        filters={defaultFilters}
        onFiltersChange={mockOnFiltersChange}
      />
    );

    const countrySelect = screen.getByLabelText('Country');
    expect(countrySelect).toBeInTheDocument();
    expect(countrySelect).toHaveValue('');
  });

  it('should show All Countries as default option', () => {
    render(
      <GalleryFilters
        filters={defaultFilters}
        onFiltersChange={mockOnFiltersChange}
      />
    );

    const allCountriesOption = screen.getByText('All Countries');
    expect(allCountriesOption).toBeInTheDocument();
  });

  it('should show supported countries in the dropdown', () => {
    render(
      <GalleryFilters
        filters={defaultFilters}
        onFiltersChange={mockOnFiltersChange}
      />
    );

    // Check for some key countries
    expect(screen.getByText('Switzerland')).toBeInTheDocument();
    expect(screen.getByText('Austria')).toBeInTheDocument();
    expect(screen.getByText('France')).toBeInTheDocument();
    expect(screen.getByText('Italy')).toBeInTheDocument();
  });

  it('should call onFiltersChange when country is selected', () => {
    render(
      <GalleryFilters
        filters={defaultFilters}
        onFiltersChange={mockOnFiltersChange}
      />
    );

    const countrySelect = screen.getByLabelText('Country');
    fireEvent.change(countrySelect, { target: { value: 'Switzerland' } });

    expect(mockOnFiltersChange).toHaveBeenCalledWith({
      ...defaultFilters,
      country: 'Switzerland',
    });
  });

  it('should call onFiltersChange with null when All Countries is selected', () => {
    const filtersWithCountry: GalleryFiltersType = {
      ...defaultFilters,
      country: 'Switzerland',
    };

    render(
      <GalleryFilters
        filters={filtersWithCountry}
        onFiltersChange={mockOnFiltersChange}
      />
    );

    const countrySelect = screen.getByLabelText('Country');
    fireEvent.change(countrySelect, { target: { value: '' } });

    expect(mockOnFiltersChange).toHaveBeenCalledWith({
      ...filtersWithCountry,
      country: null,
    });
  });

  it('should display selected country in dropdown', () => {
    const filtersWithCountry: GalleryFiltersType = {
      ...defaultFilters,
      country: 'Switzerland',
    };

    render(
      <GalleryFilters
        filters={filtersWithCountry}
        onFiltersChange={mockOnFiltersChange}
      />
    );

    const countrySelect = screen.getByLabelText('Country');
    expect(countrySelect).toHaveValue('Switzerland');
  });

  it('should reset country filter when clear filters is clicked', () => {
    const filtersWithCountry: GalleryFiltersType = {
      ...defaultFilters,
      country: 'Switzerland',
      searchQuery: 'test',
      difficulty: 'hard',
    };

    render(
      <GalleryFilters
        filters={filtersWithCountry}
        onFiltersChange={mockOnFiltersChange}
      />
    );

    const clearButton = screen.getByText('Clear Filters');
    fireEvent.click(clearButton);

    expect(mockOnFiltersChange).toHaveBeenCalledWith({
      searchQuery: '',
      difficulty: null,
      country: null,
      tags: [],
      sortBy: 'newest',
      minDistance: null,
      maxDistance: null,
    });
  });
});