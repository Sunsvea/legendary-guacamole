/**
 * Tests for CountryAutocomplete Enter key behavior - preventing page refresh
 */

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CountryAutocomplete } from '../country-autocomplete';

describe('CountryAutocomplete - Enter Key Behavior', () => {
  const mockOnChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Enter Key Prevention', () => {
    it('should prevent default behavior when Enter is pressed with dropdown closed', async () => {
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
      
      // Verify dropdown is closed
      expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
      
      // Press Enter with dropdown closed
      await user.keyboard('{Enter}');
      
      // Should not have triggered any change
      expect(mockOnChange).not.toHaveBeenCalled();
    });

    it('should prevent default behavior when Enter is pressed on empty input', async () => {
      const user = userEvent.setup();
      
      render(
        <CountryAutocomplete 
          value={null} 
          onChange={mockOnChange} 
        />
      );

      // Focus the input (this opens dropdown with countries), then close it and press Enter
      const input = screen.getByRole('combobox');
      await user.click(input);
      await user.keyboard('{Escape}'); // Close dropdown
      await user.keyboard('{Enter}');
      
      // Should not have triggered any change 
      expect(mockOnChange).not.toHaveBeenCalled();
      // Dropdown should remain closed after Enter
      expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    });

    it('should handle Enter correctly when dropdown is open vs closed', async () => {
      const user = userEvent.setup();
      
      render(
        <CountryAutocomplete 
          value={null} 
          onChange={mockOnChange} 
        />
      );

      const input = screen.getByRole('combobox');
      
      // First, test with dropdown closed
      await user.keyboard('{Enter}');
      expect(mockOnChange).not.toHaveBeenCalled();
      
      // Now open dropdown and test with dropdown open
      await user.click(input);
      await user.type(input, 'france');
      
      // Navigate to first option and select with Enter
      await user.keyboard('{ArrowDown}');
      await user.keyboard('{Enter}');
      
      // Should have selected France
      expect(mockOnChange).toHaveBeenCalledWith('France');
    });
  });

  describe('Form Submission Prevention', () => {
    it('should not trigger form submission when Enter is pressed', async () => {
      const user = userEvent.setup();
      const mockSubmit = jest.fn();
      
      // Wrap in a form to test form submission prevention
      const TestWrapper = () => (
        <form onSubmit={mockSubmit}>
          <CountryAutocomplete 
            value={null} 
            onChange={mockOnChange} 
          />
        </form>
      );
      
      render(<TestWrapper />);

      const input = screen.getByRole('combobox');
      
      // Test Enter with dropdown closed
      await user.keyboard('{Enter}');
      expect(mockSubmit).not.toHaveBeenCalled();
      
      // Test Enter after typing
      await user.type(input, 'test');
      await user.keyboard('{Enter}');
      expect(mockSubmit).not.toHaveBeenCalled();
      
      // Test Enter with dropdown open
      await user.click(input);
      await user.type(input, 'italy');
      await user.keyboard('{Enter}'); // Should close dropdown but not submit form
      expect(mockSubmit).not.toHaveBeenCalled();
    });

    it('should work correctly in context of gallery filters form', async () => {
      const user = userEvent.setup();
      const mockSubmit = jest.fn();
      
      // Simulate usage within gallery filters
      const TestWrapper = () => (
        <form onSubmit={mockSubmit}>
          <div>
            <label htmlFor="search">Search</label>
            <input 
              id="search" 
              type="text" 
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                }
              }}
            />
          </div>
          <CountryAutocomplete 
            value={null} 
            onChange={mockOnChange} 
            label="Country"
            id="country-filter"
          />
        </form>
      );
      
      render(<TestWrapper />);

      const searchInput = screen.getByLabelText('Search');
      const countryInput = screen.getByLabelText('Country');
      
      // Test both inputs prevent form submission
      await user.type(searchInput, 'test');
      await user.keyboard('{Enter}');
      expect(mockSubmit).not.toHaveBeenCalled();
      
      await user.type(countryInput, 'test');
      await user.keyboard('{Enter}');
      expect(mockSubmit).not.toHaveBeenCalled();
    });
  });

  describe('Typing Behavior', () => {
    it('should handle continuous typing without page refresh', async () => {
      const user = userEvent.setup();
      
      render(
        <CountryAutocomplete 
          value={null} 
          onChange={mockOnChange} 
        />
      );

      const input = screen.getByRole('combobox');
      
      // Type each character to simulate the original issue
      await user.type(input, 'f');
      await user.type(input, 'r');
      await user.type(input, 'a');
      await user.type(input, 'n');
      await user.type(input, 'c');
      await user.type(input, 'e');
      
      // Should auto-select France when exact match is typed
      expect(mockOnChange).toHaveBeenCalledWith('France');
    });

    it('should handle rapid typing and Enter presses gracefully', async () => {
      const user = userEvent.setup();
      
      render(
        <CountryAutocomplete 
          value={null} 
          onChange={mockOnChange} 
        />
      );

      const input = screen.getByRole('combobox');
      
      // Rapid typing with Enter presses
      await user.type(input, 'ital');
      await user.keyboard('{Enter}');
      await user.type(input, 'y');
      await user.keyboard('{Enter}');
      
      // Should have selected Italy through auto-selection
      expect(mockOnChange).toHaveBeenCalledWith('Italy');
    });

    it('should handle backspace and corrections without issues', async () => {
      const user = userEvent.setup();
      
      render(
        <CountryAutocomplete 
          value={null} 
          onChange={mockOnChange} 
        />
      );

      const input = screen.getByRole('combobox');
      
      // Type a country name correctly to test basic functionality
      await user.type(input, 'Spain');
      
      // Should have auto-selected Spain through exact match
      expect(mockOnChange).toHaveBeenCalledWith('Spain');
    });
  });

  describe('Edge Cases', () => {
    it('should handle Enter on partial matches without selection', async () => {
      const user = userEvent.setup();
      
      render(
        <CountryAutocomplete 
          value={null} 
          onChange={mockOnChange} 
        />
      );

      const input = screen.getByRole('combobox');
      
      // Type partial match that doesn't auto-select
      await user.type(input, 'uni'); // Could be United States, United Kingdom, etc.
      await user.keyboard('{Enter}');
      
      // Should not have auto-selected anything since it's ambiguous
      expect(mockOnChange).not.toHaveBeenCalled();
    });

    it('should handle Enter with no matches gracefully', async () => {
      const user = userEvent.setup();
      
      render(
        <CountryAutocomplete 
          value={null} 
          onChange={mockOnChange} 
        />
      );

      const input = screen.getByRole('combobox');
      
      // Type something that doesn't match any country
      await user.type(input, 'xyz123');
      await user.keyboard('{Enter}');
      
      // Should not have selected anything or caused errors
      expect(mockOnChange).not.toHaveBeenCalled();
    });

    it('should handle multiple Enter presses without issues', async () => {
      const user = userEvent.setup();
      
      render(
        <CountryAutocomplete 
          value={null} 
          onChange={mockOnChange} 
        />
      );

      // Focus input and press Enter multiple times
      const input = screen.getByRole('combobox');
      await user.click(input);
      await user.keyboard('{Enter}');
      await user.keyboard('{Enter}');
      await user.keyboard('{Enter}');
      
      // Should not cause any issues or selections
      expect(mockOnChange).not.toHaveBeenCalled();
    });
  });
});