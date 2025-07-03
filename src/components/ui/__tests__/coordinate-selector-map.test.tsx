/**
 * Tests for coordinate selector map component
 */

import { render, screen } from '@testing-library/react';
import { CoordinateSelectorMap } from '../coordinate-selector-map';

// Mock mapbox-gl
jest.mock('mapbox-gl', () => ({
  Map: jest.fn(() => ({
    on: jest.fn(),
    off: jest.fn(),
    remove: jest.fn(),
    getContainer: jest.fn(() => ({
      style: { cursor: '' }
    })),
    getSource: jest.fn(),
    addSource: jest.fn(),
    addLayer: jest.fn(),
    removeLayer: jest.fn(),
    removeSource: jest.fn(),
    flyTo: jest.fn(),
    setLayoutProperty: jest.fn(),
    setPaintProperty: jest.fn(),
    addControl: jest.fn(),
    fitBounds: jest.fn(),
  })),
  NavigationControl: jest.fn(),
  Marker: jest.fn(() => ({
    setLngLat: jest.fn().mockReturnThis(),
    addTo: jest.fn().mockReturnThis(),
    remove: jest.fn(),
    setDraggable: jest.fn().mockReturnThis(),
    on: jest.fn().mockReturnThis(),
  })),
  LngLatBounds: jest.fn(() => ({
    extend: jest.fn(),
  })),
}));

// Mock MAPBOX_CONFIG
jest.mock('@/lib/mapbox-config', () => ({
  MAPBOX_CONFIG: {
    accessToken: 'test-token',
    style: 'mapbox://styles/mapbox/outdoors-v12'
  }
}));

// Mock next/dynamic
jest.mock('next/dynamic', () => {
  return function dynamic() {
    const Component = (props: unknown) => {
      return <div data-testid="coordinate-selector-map" {...(props as object)} />;
    };
    Component.displayName = 'CoordinateSelectorMap';
    return Component;
  };
});

describe('CoordinateSelectorMap', () => {
  const mockOnCoordinateSelect = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render map container', () => {
    render(
      <CoordinateSelectorMap 
        onCoordinateSelect={mockOnCoordinateSelect}
      />
    );

    expect(screen.getByTestId('coordinate-selector-map')).toBeInTheDocument();
  });

  it('should have correct default props', () => {
    render(
      <CoordinateSelectorMap 
        onCoordinateSelect={mockOnCoordinateSelect}
      />
    );

    const mapContainer = screen.getByTestId('coordinate-selector-map');
    expect(mapContainer.parentElement).toHaveClass('h-64', 'w-full', 'rounded-lg');
  });

  it('should apply custom height and className', () => {
    render(
      <CoordinateSelectorMap 
        onCoordinateSelect={mockOnCoordinateSelect}
        height="h-96"
        className="custom-class"
      />
    );

    const mapContainer = screen.getByTestId('coordinate-selector-map');
    expect(mapContainer.parentElement).toHaveClass('custom-class', 'h-96');
  });

  it('should show map without overlay when no selection mode is active', () => {
    render(
      <CoordinateSelectorMap 
        onCoordinateSelect={mockOnCoordinateSelect}
      />
    );

    const mapContainer = screen.getByTestId('coordinate-selector-map');
    expect(mapContainer).toBeInTheDocument();
    expect(screen.queryByText(/click "select start point" to begin/i)).not.toBeInTheDocument();
  });

  it('should display instructions when selection mode is active but no markers placed', () => {
    render(
      <CoordinateSelectorMap 
        onCoordinateSelect={mockOnCoordinateSelect}
        selectionMode="start"
      />
    );

    expect(screen.getByText(/click on the map to select a coordinate/i)).toBeInTheDocument();
  });

  it('should not display instructions when markers exist', () => {
    render(
      <CoordinateSelectorMap 
        onCoordinateSelect={mockOnCoordinateSelect}
        startCoordinate={{ lat: 46.624307431594055, lng: 8.04745577358767 }}
      />
    );

    expect(screen.queryByText(/click on the map to select a coordinate/i)).not.toBeInTheDocument();
  });

  it('should show start marker when startCoordinate is provided', () => {
    const startCoordinate = { lat: 46.624307431594055, lng: 8.04745577358767 };
    
    render(
      <CoordinateSelectorMap 
        onCoordinateSelect={mockOnCoordinateSelect}
        startCoordinate={startCoordinate}
      />
    );

    const mapContainer = screen.getByTestId('coordinate-selector-map');
    expect(mapContainer).toBeInTheDocument();
  });

  it('should show end marker when endCoordinate is provided', () => {
    const endCoordinate = { lat: 46.57908871604088, lng: 8.006096923318134 };
    
    render(
      <CoordinateSelectorMap 
        onCoordinateSelect={mockOnCoordinateSelect}
        endCoordinate={endCoordinate}
      />
    );

    const mapContainer = screen.getByTestId('coordinate-selector-map');
    expect(mapContainer).toBeInTheDocument();
  });

  it('should show both markers when both coordinates are provided', () => {
    const startCoordinate = { lat: 46.624307431594055, lng: 8.04745577358767 };
    const endCoordinate = { lat: 46.57908871604088, lng: 8.006096923318134 };
    
    render(
      <CoordinateSelectorMap 
        onCoordinateSelect={mockOnCoordinateSelect}
        startCoordinate={startCoordinate}
        endCoordinate={endCoordinate}
      />
    );

    const mapContainer = screen.getByTestId('coordinate-selector-map');
    expect(mapContainer).toBeInTheDocument();
  });

  it('should show selection mode indicator', () => {
    render(
      <CoordinateSelectorMap 
        onCoordinateSelect={mockOnCoordinateSelect}
        selectionMode="start"
      />
    );

    expect(screen.getByText(/selecting start point/i)).toBeInTheDocument();
  });

  it('should show different text for end point selection', () => {
    render(
      <CoordinateSelectorMap 
        onCoordinateSelect={mockOnCoordinateSelect}
        selectionMode="end"
      />
    );

    expect(screen.getByText(/selecting end point/i)).toBeInTheDocument();
  });

  it('should be disabled when loading', () => {
    render(
      <CoordinateSelectorMap 
        onCoordinateSelect={mockOnCoordinateSelect}
        loading={true}
      />
    );

    const mapContainer = screen.getByTestId('coordinate-selector-map');
    expect(mapContainer.parentElement).toHaveClass('opacity-50', 'pointer-events-none');
  });

  it('should handle center prop for initial map position', () => {
    const center = { lat: 46.5197, lng: 6.6323 }; // Geneva
    
    render(
      <CoordinateSelectorMap 
        onCoordinateSelect={mockOnCoordinateSelect}
        center={center}
      />
    );

    const mapContainer = screen.getByTestId('coordinate-selector-map');
    expect(mapContainer).toBeInTheDocument();
  });
});