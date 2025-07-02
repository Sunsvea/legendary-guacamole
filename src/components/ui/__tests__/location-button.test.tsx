/**
 * Tests for location button component
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { LocationButton } from '../location-button';
import * as geolocationUtils from '@/lib/utils/geolocation';

// Mock the geolocation utils
jest.mock('@/lib/utils/geolocation');
const mockGetCurrentLocation = geolocationUtils.getCurrentLocation as jest.MockedFunction<typeof geolocationUtils.getCurrentLocation>;
const mockIsGeolocationSupported = geolocationUtils.isGeolocationSupported as jest.MockedFunction<typeof geolocationUtils.isGeolocationSupported>;

describe('LocationButton', () => {
  const mockOnLocationSelect = jest.fn();
  const mockOnError = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockIsGeolocationSupported.mockReturnValue(true);
  });

  it('should render location button', () => {
    render(
      <LocationButton 
        onLocationSelect={mockOnLocationSelect}
        onError={mockOnError}
      />
    );

    expect(screen.getByLabelText(/use current location/i)).toBeInTheDocument();
    expect(screen.getByText(/use current location/i)).toBeInTheDocument();
  });

  it('should be disabled when geolocation is not supported', () => {
    mockIsGeolocationSupported.mockReturnValue(false);
    
    render(
      <LocationButton 
        onLocationSelect={mockOnLocationSelect}
        onError={mockOnError}
      />
    );

    const button = screen.getByLabelText(/use current location/i);
    expect(button).toBeDisabled();
    expect(screen.getByText(/not supported/i)).toBeInTheDocument();
  });

  it('should call onLocationSelect when location is successfully retrieved', async () => {
    const mockCoordinate = { lat: 46.624307431594055, lng: 8.04745577358767 };
    mockGetCurrentLocation.mockResolvedValue({
      success: true,
      data: mockCoordinate
    });

    render(
      <LocationButton 
        onLocationSelect={mockOnLocationSelect}
        onError={mockOnError}
      />
    );

    const button = screen.getByLabelText(/use current location/i);
    fireEvent.click(button);

    expect(screen.getByText(/getting location/i)).toBeInTheDocument();
    expect(button).toBeDisabled();

    await waitFor(() => {
      expect(mockOnLocationSelect).toHaveBeenCalledWith(mockCoordinate);
    });

    expect(mockOnError).not.toHaveBeenCalled();
  });

  it('should call onError when location retrieval fails', async () => {
    const mockError = {
      message: 'User denied the request for Geolocation.',
      code: 'PERMISSION_DENIED'
    };
    mockGetCurrentLocation.mockResolvedValue({
      success: false,
      error: mockError
    });

    render(
      <LocationButton 
        onLocationSelect={mockOnLocationSelect}
        onError={mockOnError}
      />
    );

    const button = screen.getByLabelText(/use current location/i);
    fireEvent.click(button);

    await waitFor(() => {
      expect(mockOnError).toHaveBeenCalledWith(mockError);
    });

    expect(mockOnLocationSelect).not.toHaveBeenCalled();
  });

  it('should be disabled when loading prop is true', () => {
    render(
      <LocationButton 
        onLocationSelect={mockOnLocationSelect}
        onError={mockOnError}
        loading={true}
      />
    );

    const button = screen.getByLabelText(/use current location/i);
    expect(button).toBeDisabled();
  });

  it('should show loading state while getting location', async () => {
    let resolveLocation: (value: any) => void;
    const locationPromise = new Promise((resolve) => {
      resolveLocation = resolve;
    });
    mockGetCurrentLocation.mockReturnValue(locationPromise);

    render(
      <LocationButton 
        onLocationSelect={mockOnLocationSelect}
        onError={mockOnError}
      />
    );

    const button = screen.getByLabelText(/use current location/i);
    fireEvent.click(button);

    expect(screen.getByText(/getting location/i)).toBeInTheDocument();
    expect(button).toBeDisabled();

    // Resolve the promise
    resolveLocation!({
      success: true,
      data: { lat: 46.624307431594055, lng: 8.04745577358767 }
    });

    await waitFor(() => {
      expect(screen.queryByText(/getting location/i)).not.toBeInTheDocument();
    });
  });

  it('should apply custom className', () => {
    render(
      <LocationButton 
        onLocationSelect={mockOnLocationSelect}
        onError={mockOnError}
        className="custom-class"
      />
    );

    const button = screen.getByLabelText(/use current location/i);
    expect(button).toHaveClass('custom-class');
  });

  it('should have correct accessibility attributes', () => {
    render(
      <LocationButton 
        onLocationSelect={mockOnLocationSelect}
        onError={mockOnError}
      />
    );

    const button = screen.getByLabelText(/use current location/i);
    expect(button).toHaveAttribute('type', 'button');
    expect(button).toHaveAttribute('aria-label', 'Use current location');
  });
});