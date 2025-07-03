/**
 * Tests for geolocation utilities
 */

import { getCurrentLocation, isGeolocationSupported } from '../geolocation';

// Mock geolocation API
const mockGeolocation = {
  getCurrentPosition: jest.fn(),
  watchPosition: jest.fn(),
  clearWatch: jest.fn()
};

// Store original navigator
const originalNavigator = global.navigator;

describe('geolocation utilities', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Ensure navigator exists and mock geolocation
    if (!global.navigator) {
      Object.defineProperty(global, 'navigator', {
        value: {},
        configurable: true,
        writable: true
      });
    }
    Object.defineProperty(global.navigator, 'geolocation', {
      value: mockGeolocation,
      configurable: true,
      writable: true
    });
  });

  afterAll(() => {
    // Restore original navigator
    if (originalNavigator) {
      Object.defineProperty(global, 'navigator', {
        value: originalNavigator,
        configurable: true,
        writable: true
      });
    }
  });

  describe('isGeolocationSupported', () => {
    it('should return true when geolocation is available', () => {
      expect(isGeolocationSupported()).toBe(true);
    });

    it('should return false when geolocation is not available', () => {
      Object.defineProperty(global.navigator, 'geolocation', {
        value: undefined,
        configurable: true
      });
      
      expect(isGeolocationSupported()).toBe(false);
    });

    it('should return false when navigator is not available', () => {
      const originalNavigator = global.navigator;
      Object.defineProperty(global, 'navigator', {
        value: undefined,
        configurable: true
      });
      
      expect(isGeolocationSupported()).toBe(false);
      
      // Restore navigator
      Object.defineProperty(global, 'navigator', {
        value: originalNavigator,
        configurable: true
      });
    });
  });

  describe('getCurrentLocation', () => {
    it('should resolve with coordinates when geolocation succeeds', async () => {
      const mockPosition = {
        coords: {
          latitude: 46.624307431594055,
          longitude: 8.04745577358767,
          accuracy: 10
        },
        timestamp: Date.now()
      };

      mockGeolocation.getCurrentPosition.mockImplementation((success) => {
        success(mockPosition);
      });

      const result = await getCurrentLocation();
      
      expect(result.success).toBe(true);
      expect(result.data).toEqual({
        lat: 46.624307431594055,
        lng: 8.04745577358767
      });
      expect(mockGeolocation.getCurrentPosition).toHaveBeenCalledWith(
        expect.any(Function),
        expect.any(Function),
        expect.objectContaining({
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000
        })
      );
    });

    it('should reject with error when geolocation fails', async () => {
      const mockError = {
        code: 1,
        message: 'User denied the request for Geolocation.'
      };

      mockGeolocation.getCurrentPosition.mockImplementation((success, error) => {
        error(mockError);
      });

      const result = await getCurrentLocation();
      
      expect(result.success).toBe(false);
      expect(result.error).toEqual({
        message: 'User denied the request for Geolocation.',
        code: 'PERMISSION_DENIED'
      });
    });

    it('should handle timeout error', async () => {
      const mockError = {
        code: 3,
        message: 'The request to get user location timed out.'
      };

      mockGeolocation.getCurrentPosition.mockImplementation((success, error) => {
        error(mockError);
      });

      const result = await getCurrentLocation();
      
      expect(result.success).toBe(false);
      expect(result.error).toEqual({
        message: 'The request to get user location timed out.',
        code: 'TIMEOUT'
      });
    });

    it('should handle position unavailable error', async () => {
      const mockError = {
        code: 2,
        message: 'Location information is unavailable.'
      };

      mockGeolocation.getCurrentPosition.mockImplementation((success, error) => {
        error(mockError);
      });

      const result = await getCurrentLocation();
      
      expect(result.success).toBe(false);
      expect(result.error).toEqual({
        message: 'Location information is unavailable.',
        code: 'POSITION_UNAVAILABLE'
      });
    });

    it('should handle unknown error codes', async () => {
      const mockError = {
        code: 999,
        message: 'Unknown error occurred.'
      };

      mockGeolocation.getCurrentPosition.mockImplementation((success, error) => {
        error(mockError);
      });

      const result = await getCurrentLocation();
      
      expect(result.success).toBe(false);
      expect(result.error).toEqual({
        message: 'Unknown error occurred.',
        code: 'UNKNOWN_ERROR'
      });
    });

    it('should reject when geolocation is not supported', async () => {
      Object.defineProperty(global.navigator, 'geolocation', {
        value: undefined,
        configurable: true
      });

      const result = await getCurrentLocation();
      
      expect(result.success).toBe(false);
      expect(result.error).toEqual({
        message: 'Geolocation is not supported by this browser.',
        code: 'NOT_SUPPORTED'
      });
    });

    it('should use custom options when provided', async () => {
      const mockPosition = {
        coords: {
          latitude: 46.624307431594055,
          longitude: 8.04745577358767,
          accuracy: 10
        },
        timestamp: Date.now()
      };

      mockGeolocation.getCurrentPosition.mockImplementation((success) => {
        success(mockPosition);
      });

      const customOptions = {
        enableHighAccuracy: false,
        timeout: 5000,
        maximumAge: 30000
      };

      await getCurrentLocation(customOptions);
      
      expect(mockGeolocation.getCurrentPosition).toHaveBeenCalledWith(
        expect.any(Function),
        expect.any(Function),
        customOptions
      );
    });
  });
});