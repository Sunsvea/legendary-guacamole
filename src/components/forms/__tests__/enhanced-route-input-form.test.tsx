/**
 * Tests for enhanced route input form with map-only interface
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { EnhancedRouteInputForm } from '../enhanced-route-input-form';

// Mock the coordinate selector map
jest.mock('@/components/ui/coordinate-selector-map', () => ({
  CoordinateSelectorMap: ({ onCoordinateSelect, selectionMode }: any) => (
    <div 
      data-testid="coordinate-selector-map" 
      onClick={() => {
        if (selectionMode && onCoordinateSelect) {
          onCoordinateSelect(
            { lat: 46.5197, lng: 6.6323 }, 
            selectionMode
          );
        }
      }}
    >
      Map Component - Mode: {selectionMode || 'none'}
    </div>
  )
}));

describe('EnhancedRouteInputForm', () => {
  const mockOnRouteSubmit = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    // Mock window.alert
    window.alert = jest.fn();
  });

  it('should render enhanced route input form with map', () => {
    render(
      <EnhancedRouteInputForm onRouteSubmit={mockOnRouteSubmit} />
    );

    expect(screen.getByText(/plan your route/i)).toBeInTheDocument();
    expect(screen.getByTestId('coordinate-selector-map')).toBeInTheDocument();
  });

  it('should show selection buttons', () => {
    render(
      <EnhancedRouteInputForm onRouteSubmit={mockOnRouteSubmit} />
    );

    expect(screen.getByRole('button', { name: /select start point/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /select end point/i })).toBeInTheDocument();
  });

  it('should handle start point selection', () => {
    render(
      <EnhancedRouteInputForm onRouteSubmit={mockOnRouteSubmit} />
    );

    // Click "Select Start Point" button
    const selectStartButton = screen.getByRole('button', { name: /select start point/i });
    fireEvent.click(selectStartButton);

    // Click on map
    const map = screen.getByTestId('coordinate-selector-map');
    fireEvent.click(map);

    // Should show start point selected
    expect(screen.getByText(/start point selected/i)).toBeInTheDocument();
  });

  it('should handle end point selection', () => {
    render(
      <EnhancedRouteInputForm onRouteSubmit={mockOnRouteSubmit} />
    );

    // Click "Select End Point" button
    const selectEndButton = screen.getByRole('button', { name: /select end point/i });
    fireEvent.click(selectEndButton);

    // Click on map
    const map = screen.getByTestId('coordinate-selector-map');
    fireEvent.click(map);

    // Should show end point selected
    expect(screen.getByText(/end point selected/i)).toBeInTheDocument();
  });

  it('should validate and submit route', () => {
    render(
      <EnhancedRouteInputForm onRouteSubmit={mockOnRouteSubmit} />
    );

    // Select start point
    const selectStartButton = screen.getByRole('button', { name: /select start point/i });
    fireEvent.click(selectStartButton);
    
    const map = screen.getByTestId('coordinate-selector-map');
    fireEvent.click(map);

    // Select end point
    const selectEndButton = screen.getByRole('button', { name: /select end point/i });
    fireEvent.click(selectEndButton);
    fireEvent.click(map);

    // Submit form
    const submitButton = screen.getByText(/find optimal route/i);
    fireEvent.click(submitButton);

    expect(mockOnRouteSubmit).toHaveBeenCalledWith(
      { lat: 46.5197, lng: 6.6323 },
      { lat: 46.5197, lng: 6.6323 }
    );
  });

  it('should show validation error for incomplete coordinates', () => {
    render(
      <EnhancedRouteInputForm onRouteSubmit={mockOnRouteSubmit} />
    );

    // Submit without selecting coordinates
    const submitButton = screen.getByText(/find optimal route/i);
    fireEvent.click(submitButton);

    expect(window.alert).toHaveBeenCalledWith('Please select both start and end points on the map.');
  });

  it('should be disabled when loading', () => {
    render(
      <EnhancedRouteInputForm onRouteSubmit={mockOnRouteSubmit} loading={true} />
    );

    const submitButton = screen.getByText(/finding route/i);
    expect(submitButton).toBeDisabled();

    // Selection buttons should be disabled
    const startButton = screen.getByRole('button', { name: /select start point/i });
    const endButton = screen.getByRole('button', { name: /select end point/i });
    
    expect(startButton).toBeDisabled();
    expect(endButton).toBeDisabled();
  });

  it('should handle example route selection', () => {
    render(
      <EnhancedRouteInputForm onRouteSubmit={mockOnRouteSubmit} />
    );

    // Click example route dropdown
    const exampleButton = screen.getByText(/use example route/i);
    fireEvent.click(exampleButton);

    // Click first example route
    const firstExample = screen.getByText(/swiss alps, zermatt/i);
    fireEvent.click(firstExample);

    // Should show both points selected
    expect(screen.getByText(/start point selected/i)).toBeInTheDocument();
    expect(screen.getByText(/end point selected/i)).toBeInTheDocument();
  });
});