/**
 * Tests for enhanced route input form with interactive features
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { EnhancedRouteInputForm } from '../enhanced-route-input-form';

// Mock the components we depend on
jest.mock('@/components/ui/location-button', () => ({
  LocationButton: jest.fn(({ onLocationSelect }) => (
    <button
      data-testid="location-button"
      onClick={() => onLocationSelect({ lat: 46.5197, lng: 6.6323 })}
    >
      Use Current Location
    </button>
  ))
}));

jest.mock('@/components/ui/coordinate-selector-map', () => ({
  CoordinateSelectorMap: jest.fn(({ onCoordinateSelect, selectionMode, startCoordinate, endCoordinate }) => (
    <div
      data-testid="coordinate-selector-map"
      onClick={() => {
        if (selectionMode) {
          onCoordinateSelect({ lat: 46.8182, lng: 8.2275 }, selectionMode);
        }
      }}
    >
      Map Component - Mode: {selectionMode || 'none'}
      {startCoordinate && <span data-testid="start-marker">Start Marker</span>}
      {endCoordinate && <span data-testid="end-marker">End Marker</span>}
    </div>
  ))
}));

describe('EnhancedRouteInputForm', () => {
  const mockOnRouteSubmit = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    // Mock window.alert
    window.alert = jest.fn();
  });

  it('should render enhanced route input form', () => {
    render(
      <EnhancedRouteInputForm onRouteSubmit={mockOnRouteSubmit} />
    );

    expect(screen.getByText(/plan your route/i)).toBeInTheDocument();
    // In coordinate mode by default, no map should be visible
    expect(screen.queryByTestId('coordinate-selector-map')).not.toBeInTheDocument();
  });

  it('should show coordinate inputs by default', () => {
    render(
      <EnhancedRouteInputForm onRouteSubmit={mockOnRouteSubmit} />
    );

    expect(screen.getAllByPlaceholderText(/latitude/i)).toHaveLength(2);
    expect(screen.getAllByPlaceholderText(/longitude/i)).toHaveLength(2);
  });

  it('should toggle to map mode', () => {
    render(
      <EnhancedRouteInputForm onRouteSubmit={mockOnRouteSubmit} />
    );

    const mapModeButton = screen.getByText(/use map/i);
    fireEvent.click(mapModeButton);

    expect(screen.getByText(/click on map to select start point/i)).toBeInTheDocument();
    expect(screen.getByTestId('coordinate-selector-map')).toBeInTheDocument();
  });

  it('should handle location button click for start point', async () => {
    render(
      <EnhancedRouteInputForm onRouteSubmit={mockOnRouteSubmit} />
    );

    // Click start point location button
    const locationButtons = screen.getAllByTestId('location-button');
    fireEvent.click(locationButtons[0]);

    await waitFor(() => {
      expect(screen.getByDisplayValue('46.5197')).toBeInTheDocument();
      expect(screen.getByDisplayValue('6.6323')).toBeInTheDocument();
    });
  });

  it('should handle map coordinate selection in map mode', () => {
    render(
      <EnhancedRouteInputForm onRouteSubmit={mockOnRouteSubmit} />
    );

    // Switch to map mode
    const mapModeButton = screen.getByText(/use map/i);
    fireEvent.click(mapModeButton);

    // Click "Select Start Point" button (find the button specifically)
    const selectStartButton = screen.getByRole('button', { name: /select start point/i });
    fireEvent.click(selectStartButton);

    // Click on map
    const map = screen.getByTestId('coordinate-selector-map');
    fireEvent.click(map);

    // Should switch back to showing start point as selected
    expect(screen.getByText(/start point selected/i)).toBeInTheDocument();
  });

  it('should handle coordinate input changes', () => {
    render(
      <EnhancedRouteInputForm onRouteSubmit={mockOnRouteSubmit} />
    );

    const latInputs = screen.getAllByPlaceholderText(/latitude/i);
    const lngInputs = screen.getAllByPlaceholderText(/longitude/i);

    fireEvent.change(latInputs[0], { target: { value: '46.5197' } });
    fireEvent.change(lngInputs[0], { target: { value: '6.6323' } });

    expect(latInputs[0]).toHaveValue(46.5197);
    expect(lngInputs[0]).toHaveValue(6.6323);
  });

  it('should validate and submit route', async () => {
    render(
      <EnhancedRouteInputForm onRouteSubmit={mockOnRouteSubmit} />
    );

    // Fill in coordinates
    const latInputs = screen.getAllByPlaceholderText(/latitude/i);
    const lngInputs = screen.getAllByPlaceholderText(/longitude/i);

    fireEvent.change(latInputs[0], { target: { value: '46.5197' } });
    fireEvent.change(lngInputs[0], { target: { value: '6.6323' } });
    fireEvent.change(latInputs[1], { target: { value: '46.8182' } });
    fireEvent.change(lngInputs[1], { target: { value: '8.2275' } });

    // Submit form
    const submitButton = screen.getByText(/find optimal route/i);
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockOnRouteSubmit).toHaveBeenCalledWith(
        { lat: 46.5197, lng: 6.6323 },
        { lat: 46.8182, lng: 8.2275 }
      );
    });
  });

  it('should show validation error for incomplete coordinates', () => {
    render(
      <EnhancedRouteInputForm onRouteSubmit={mockOnRouteSubmit} />
    );

    // Submit without filling coordinates
    const submitButton = screen.getByText(/find optimal route/i);
    fireEvent.click(submitButton);

    expect(window.alert).toHaveBeenCalledWith(expect.stringContaining('fill'));
  });

  it('should be disabled when loading', () => {
    render(
      <EnhancedRouteInputForm onRouteSubmit={mockOnRouteSubmit} loading={true} />
    );

    const submitButton = screen.getByText(/finding route/i);
    expect(submitButton).toBeDisabled();

    const inputs = screen.getAllByRole('spinbutton');
    inputs.forEach(input => {
      expect(input).toBeDisabled();
    });

    // Mode toggle buttons should also be disabled
    const coordinateButton = screen.getByText(/use coordinates/i);
    expect(coordinateButton).toBeDisabled();
  });

  it('should switch between coordinate and map input modes', () => {
    render(
      <EnhancedRouteInputForm onRouteSubmit={mockOnRouteSubmit} />
    );

    // Start in coordinate mode
    expect(screen.getByText(/use map/i)).toBeInTheDocument();

    // Switch to map mode
    fireEvent.click(screen.getByText(/use map/i));
    expect(screen.getByText(/use coordinates/i)).toBeInTheDocument();

    // Switch back to coordinate mode
    fireEvent.click(screen.getByText(/use coordinates/i));
    expect(screen.getByText(/use map/i)).toBeInTheDocument();
  });
});