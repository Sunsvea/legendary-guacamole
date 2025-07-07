/**
 * Country autocomplete input component
 * Provides a text input with dropdown autocomplete for country selection
 */

import { useState, useRef, useEffect } from 'react';
import { X, Globe } from 'lucide-react';
import { STYLES } from '@/constants/styles';

// Comprehensive list of countries for autocomplete
const ALL_COUNTRIES = [
  'Afghanistan', 'Albania', 'Algeria', 'Argentina', 'Armenia', 'Australia', 'Austria',
  'Azerbaijan', 'Bangladesh', 'Belarus', 'Belgium', 'Bolivia', 'Bosnia and Herzegovina',
  'Brazil', 'Bulgaria', 'Cambodia', 'Canada', 'Chile', 'China', 'Colombia', 'Croatia',
  'Czech Republic', 'Denmark', 'Ecuador', 'Egypt', 'Estonia', 'Finland', 'France',
  'Georgia', 'Germany', 'Greece', 'Hungary', 'Iceland', 'India', 'Indonesia', 'Iran',
  'Iraq', 'Ireland', 'Israel', 'Italy', 'Japan', 'Jordan', 'Kazakhstan', 'Kenya',
  'Latvia', 'Lebanon', 'Lithuania', 'Luxembourg', 'Malaysia', 'Mexico', 'Mongolia',
  'Morocco', 'Nepal', 'Netherlands', 'New Zealand', 'Norway', 'Pakistan', 'Peru',
  'Philippines', 'Poland', 'Portugal', 'Romania', 'Russia', 'Slovakia', 'Slovenia',
  'South Africa', 'South Korea', 'Spain', 'Sweden', 'Switzerland', 'Thailand', 'Turkey',
  'Ukraine', 'United Arab Emirates', 'United Kingdom', 'United States', 'Vietnam'
].sort();

interface CountryAutocompleteProps {
  value: string | null;
  onChange: (country: string | null) => void;
  placeholder?: string;
  label?: string;
  id?: string;
  className?: string;
}

export function CountryAutocomplete({
  value,
  onChange,
  placeholder = "Type to search countries...",
  label = "Country",
  id = "country-autocomplete",
  className = ""
}: CountryAutocompleteProps) {
  const [inputValue, setInputValue] = useState(value || '');
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Filter countries based on input
  const filteredCountries = inputValue.trim() 
    ? ALL_COUNTRIES.filter(country =>
        country.toLowerCase().includes(inputValue.toLowerCase())
      ).slice(0, 10) // Limit to 10 results for performance
    : ALL_COUNTRIES.slice(0, 10); // Show first 10 countries when empty

  // Update input value when prop changes
  useEffect(() => {
    setInputValue(value || '');
  }, [value]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setHighlightedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
      e.preventDefault();
      setIsOpen(true);
      setHighlightedIndex(0);
      return;
    }

    if (!isOpen) {
      // Prevent form submission when Enter is pressed and dropdown is closed
      if (e.key === 'Enter') {
        e.preventDefault();
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev < filteredCountries.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev > 0 ? prev - 1 : filteredCountries.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && filteredCountries[highlightedIndex]) {
          selectCountry(filteredCountries[highlightedIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setHighlightedIndex(-1);
        inputRef.current?.blur();
        break;
    }
  };

  // Scroll highlighted item into view
  useEffect(() => {
    if (highlightedIndex >= 0 && listRef.current) {
      const highlightedElement = listRef.current.children[highlightedIndex] as HTMLElement;
      if (highlightedElement && highlightedElement.scrollIntoView) {
        highlightedElement.scrollIntoView({
          block: 'nearest',
          behavior: 'smooth'
        });
      }
    }
  }, [highlightedIndex]);

  const selectCountry = (country: string) => {
    setInputValue(country);
    onChange(country);
    setIsOpen(false);
    setHighlightedIndex(-1);
  };

  const clearSelection = () => {
    setInputValue('');
    onChange(null);
    setIsOpen(false);
    setHighlightedIndex(-1);
    inputRef.current?.focus();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    setIsOpen(true);
    setHighlightedIndex(-1);
    
    // If input exactly matches a country, select it
    const exactMatch = ALL_COUNTRIES.find(
      country => country.toLowerCase() === newValue.toLowerCase()
    );
    
    if (exactMatch) {
      onChange(exactMatch);
    } else if (newValue === '') {
      onChange(null);
    }
  };

  const handleInputFocus = () => {
    setIsOpen(true);
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {label && (
        <label htmlFor={id} className={STYLES.LABEL}>
          {label}
        </label>
      )}
      
      <div className="relative">
        <Globe className={`${STYLES.ICON_SM} absolute left-3 top-3 text-gray-400`} />
        
        <input
          ref={inputRef}
          id={id}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          autoComplete="off"
          className={`${STYLES.INPUT} pl-10 ${value ? 'pr-10' : ''} text-gray-900 placeholder-gray-500`}
          role="combobox"
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          aria-autocomplete="list"
          aria-controls={isOpen ? `${id}-listbox` : undefined}
        />
        
        {value && (
          <button
            onClick={clearSelection}
            className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 transition-colors"
            title="Clear selection"
            tabIndex={-1}
          >
            <X className={STYLES.ICON_SM} />
          </button>
        )}
      </div>

      {/* Dropdown */}
      {isOpen && filteredCountries.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
          <ul
            ref={listRef}
            id={`${id}-listbox`}
            role="listbox"
            className="py-1"
          >
            {filteredCountries.map((country, index) => (
              <li
                key={country}
                role="option"
                aria-selected={highlightedIndex === index}
                className={`px-3 py-2 cursor-pointer text-sm transition-colors ${
                  highlightedIndex === index
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-900 hover:bg-gray-50'
                }`}
                onClick={() => selectCountry(country)}
                onMouseEnter={() => setHighlightedIndex(index)}
              >
                {country}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* No results message */}
      {isOpen && inputValue && filteredCountries.length === 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg">
          <div className="px-3 py-2 text-sm text-gray-500">
            No countries found matching &ldquo;{inputValue}&rdquo;
          </div>
        </div>
      )}
    </div>
  );
}