/**
 * Tests for CountryAutocomplete component
 */

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CountryAutocomplete } from '../country-autocomplete';

describe('CountryAutocomplete', () => {
  const mockOnChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('should render with default props', () => {
      render(
        <CountryAutocomplete 
          value={null} 
          onChange={mockOnChange} 
        />
      );

      expect(screen.getByRole('combobox')).toBeInTheDocument();
      expect(screen.getByLabelText('Country')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Type to search countries...')).toBeInTheDocument();
    });

    it('should render with custom props', () => {
      render(
        <CountryAutocomplete 
          value="France"
          onChange={mockOnChange}
          placeholder="Custom placeholder"
          label="Custom Label"
          id="custom-id"
          className="custom-class"
        />
      );

      expect(screen.getByLabelText('Custom Label')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Custom placeholder')).toBeInTheDocument();
      expect(screen.getByDisplayValue('France')).toBeInTheDocument();
      expect(screen.getByRole('combobox')).toHaveAttribute('id', 'custom-id');
    });

    it('should show clear button when value is present', () => {
      render(
        <CountryAutocomplete 
          value="Switzerland" 
          onChange={mockOnChange} 
        />
      );

      expect(screen.getByTitle('Clear selection')).toBeInTheDocument();
    });

    it('should not show clear button when value is null', () => {
      render(
        <CountryAutocomplete 
          value={null} 
          onChange={mockOnChange} 
        />
      );

      expect(screen.queryByTitle('Clear selection')).not.toBeInTheDocument();
    });
  });

  describe('Autocomplete Functionality', () => {
    it('should show dropdown when input is focused', async () => {
      const user = userEvent.setup();
      
      render(
        <CountryAutocomplete 
          value={null} 
          onChange={mockOnChange} 
        />
      );

      const input = screen.getByRole('combobox');
      await user.click(input);

      expect(screen.getByRole('listbox')).toBeInTheDocument();
    });

    it('should filter countries based on input', async () => {
      const user = userEvent.setup();
      
      render(
        <CountryAutocomplete 
          value={null} 
          onChange={mockOnChange} 
        />
      );

      const input = screen.getByRole('combobox');
      await user.click(input);
      await user.type(input, 'swit');

      expect(screen.getByText('Switzerland')).toBeInTheDocument();
      expect(screen.queryByText('France')).not.toBeInTheDocument();
    });

    it('should be case insensitive', async () => {
      const user = userEvent.setup();
      
      render(
        <CountryAutocomplete 
          value={null} 
          onChange={mockOnChange} 
        />
      );

      const input = screen.getByRole('combobox');
      await user.click(input);
      await user.type(input, 'FRANCE');

      expect(screen.getByText('France')).toBeInTheDocument();
    });

    it('should limit results to 10 items', async () => {
      const user = userEvent.setup();
      
      render(
        <CountryAutocomplete 
          value={null} 
          onChange={mockOnChange} 
        />
      );

      const input = screen.getByRole('combobox');
      await user.click(input);
      await user.type(input, 'a'); // Should match many countries

      const listItems = screen.getAllByRole('option');
      expect(listItems.length).toBeLessThanOrEqual(10);
    });

    it('should show no results message when no countries match', async () => {
      const user = userEvent.setup();
      
      render(
        <CountryAutocomplete 
          value={null} 
          onChange={mockOnChange} 
        />
      );

      const input = screen.getByRole('combobox');
      await user.click(input);
      await user.type(input, 'nonexistentcountry');

      expect(screen.getByText(/No countries found matching.*nonexistentcountry/)).toBeInTheDocument();
    });
  });

  describe('Selection Behavior', () => {
    it('should call onChange when country is selected by click', async () => {
      const user = userEvent.setup();
      
      render(
        <CountryAutocomplete 
          value={null} 
          onChange={mockOnChange} 
        />
      );

      const input = screen.getByRole('combobox');
      await user.click(input);
      await user.type(input, 'swit');
      
      const switzerlandOption = screen.getByText('Switzerland');
      await user.click(switzerlandOption);

      expect(mockOnChange).toHaveBeenCalledWith('Switzerland');
    });

    it('should auto-select when exact match is typed', async () => {
      const user = userEvent.setup();
      
      render(
        <CountryAutocomplete 
          value={null} 
          onChange={mockOnChange} 
        />
      );

      const input = screen.getByRole('combobox');
      await user.type(input, 'France');

      expect(mockOnChange).toHaveBeenCalledWith('France');
    });

    it('should clear selection when input is cleared', async () => {
      const user = userEvent.setup();
      
      render(
        <CountryAutocomplete 
          value="France" 
          onChange={mockOnChange} 
        />
      );

      const input = screen.getByRole('combobox');
      await user.clear(input);

      expect(mockOnChange).toHaveBeenCalledWith(null);
    });

    it('should clear selection when clear button is clicked', async () => {
      const user = userEvent.setup();
      
      render(
        <CountryAutocomplete 
          value="France" 
          onChange={mockOnChange} 
        />
      );

      const clearButton = screen.getByTitle('Clear selection');
      await user.click(clearButton);

      expect(mockOnChange).toHaveBeenCalledWith(null);
    });
  });

  describe('Keyboard Navigation', () => {
    it('should navigate with arrow keys', async () => {
      const user = userEvent.setup();
      
      render(
        <CountryAutocomplete 
          value={null} 
          onChange={mockOnChange} 
        />
      );

      const input = screen.getByRole('combobox');
      await user.click(input);
      await user.type(input, 'a');

      // Press down arrow to highlight first item
      await user.keyboard('{ArrowDown}');
      
      const firstOption = screen.getAllByRole('option')[0];
      expect(firstOption).toHaveAttribute('aria-selected', 'true');
    });

    it('should select highlighted item with Enter', async () => {
      const user = userEvent.setup();
      
      render(
        <CountryAutocomplete 
          value={null} 
          onChange={mockOnChange} 
        />
      );

      const input = screen.getByRole('combobox');
      await user.click(input);
      await user.type(input, 'swit');
      
      // Highlight Switzerland and press Enter
      await user.keyboard('{ArrowDown}');
      await user.keyboard('{Enter}');

      expect(mockOnChange).toHaveBeenCalledWith('Switzerland');
    });

    it('should close dropdown with Escape', async () => {
      const user = userEvent.setup();
      
      render(
        <CountryAutocomplete 
          value={null} 
          onChange={mockOnChange} 
        />
      );

      const input = screen.getByRole('combobox');
      await user.click(input);
      
      expect(screen.getByRole('listbox')).toBeInTheDocument();
      
      await user.keyboard('{Escape}');
      
      expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    });

    it('should open dropdown with arrow keys when closed', async () => {
      const user = userEvent.setup();
      
      render(
        <CountryAutocomplete 
          value={null} 
          onChange={mockOnChange} 
        />
      );

      const input = screen.getByRole('combobox');
      await user.click(input);
      await user.keyboard('{Escape}'); // Close dropdown
      
      expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
      
      // Make sure input is focused
      await user.click(input);
      await user.keyboard('{ArrowDown}'); // Should open dropdown
      
      expect(screen.getByRole('listbox')).toBeInTheDocument();
    });
  });

  describe('Click Outside Behavior', () => {
    it('should close dropdown when clicking outside', async () => {
      const user = userEvent.setup();
      
      render(
        <div>
          <CountryAutocomplete 
            value={null} 
            onChange={mockOnChange} 
          />
          <button>Outside button</button>
        </div>
      );

      const input = screen.getByRole('combobox');
      await user.click(input);
      
      expect(screen.getByRole('listbox')).toBeInTheDocument();
      
      const outsideButton = screen.getByText('Outside button');
      await user.click(outsideButton);
      
      await waitFor(() => {
        expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('should have correct ARIA attributes', () => {
      render(
        <CountryAutocomplete 
          value={null} 
          onChange={mockOnChange} 
        />
      );

      const input = screen.getByRole('combobox');
      
      expect(input).toHaveAttribute('aria-expanded', 'false');
      expect(input).toHaveAttribute('aria-haspopup', 'listbox');
      expect(input).toHaveAttribute('aria-autocomplete', 'list');
    });

    it('should update aria-expanded when dropdown opens', async () => {
      const user = userEvent.setup();
      
      render(
        <CountryAutocomplete 
          value={null} 
          onChange={mockOnChange} 
        />
      );

      const input = screen.getByRole('combobox');
      await user.click(input);

      expect(input).toHaveAttribute('aria-expanded', 'true');
    });

    it('should have proper listbox structure', async () => {
      const user = userEvent.setup();
      
      render(
        <CountryAutocomplete 
          value={null} 
          onChange={mockOnChange} 
        />
      );

      const input = screen.getByRole('combobox');
      await user.click(input);
      await user.type(input, 'fran');

      const listbox = screen.getByRole('listbox');
      const options = screen.getAllByRole('option');
      
      expect(listbox).toBeInTheDocument();
      expect(options.length).toBeGreaterThan(0);
      
      options.forEach(option => {
        expect(option).toHaveAttribute('role', 'option');
      });
    });
  });

  describe('Performance', () => {
    it('should not render dropdown when input is empty and not focused', () => {
      render(
        <CountryAutocomplete 
          value={null} 
          onChange={mockOnChange} 
        />
      );

      expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    });

    it('should debounce filtering correctly', async () => {
      const user = userEvent.setup();
      
      render(
        <CountryAutocomplete 
          value={null} 
          onChange={mockOnChange} 
        />
      );

      const input = screen.getByRole('combobox');
      await user.click(input);
      
      // Type quickly
      await user.type(input, 'fr');
      
      // Should still show filtered results
      expect(screen.getByText('France')).toBeInTheDocument();
    });
  });
});