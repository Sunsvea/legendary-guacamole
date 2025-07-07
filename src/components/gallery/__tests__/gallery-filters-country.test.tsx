import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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

  it('should render country filter autocomplete', () => {
    render(
      <GalleryFilters
        filters={defaultFilters}
        onFiltersChange={mockOnFiltersChange}
      />
    );

    const countryInput = screen.getByLabelText('Country');
    expect(countryInput).toBeInTheDocument();
    expect(countryInput).toHaveValue('');
    expect(countryInput).toHaveAttribute('placeholder', 'Search countries...');
  });

  it('should show autocomplete dropdown when input is focused', async () => {
    const user = userEvent.setup();
    
    render(
      <GalleryFilters
        filters={defaultFilters}
        onFiltersChange={mockOnFiltersChange}
      />
    );

    const countryInput = screen.getByLabelText('Country');
    await user.click(countryInput);

    expect(screen.getByRole('listbox')).toBeInTheDocument();
  });

  it('should filter countries based on input', async () => {
    const user = userEvent.setup();
    
    render(
      <GalleryFilters
        filters={defaultFilters}
        onFiltersChange={mockOnFiltersChange}
      />
    );

    const countryInput = screen.getByLabelText('Country');
    await user.click(countryInput);
    await user.type(countryInput, 'swit');

    expect(screen.getByText('Switzerland')).toBeInTheDocument();
    expect(screen.queryByText('France')).not.toBeInTheDocument();
  });

  it('should call onFiltersChange when country is selected', async () => {
    const user = userEvent.setup();
    
    render(
      <GalleryFilters
        filters={defaultFilters}
        onFiltersChange={mockOnFiltersChange}
      />
    );

    const countryInput = screen.getByLabelText('Country');
    await user.click(countryInput);
    await user.type(countryInput, 'swit');
    
    const switzerlandOption = screen.getByText('Switzerland');
    await user.click(switzerlandOption);

    expect(mockOnFiltersChange).toHaveBeenCalledWith({
      ...defaultFilters,
      country: 'Switzerland',
    });
  });

  it('should call onFiltersChange with null when input is cleared', async () => {
    const user = userEvent.setup();
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

    const clearButton = screen.getByTitle('Clear selection');
    await user.click(clearButton);

    expect(mockOnFiltersChange).toHaveBeenCalledWith({
      ...filtersWithCountry,
      country: null,
    });
  });

  it('should display selected country in input', () => {
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

    const countryInput = screen.getByLabelText('Country');
    expect(countryInput).toHaveValue('Switzerland');
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