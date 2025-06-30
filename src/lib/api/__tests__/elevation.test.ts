import { getElevation, getElevationForRoute } from '../elevation';
import { Coordinate } from '@/types/route';

// Mock fetch globally
global.fetch = jest.fn();

describe('elevation API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Clear console.error mock if it exists
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('getElevation', () => {
    const mockCoordinates: Coordinate[] = [
      { lat: 46.5503, lng: 7.9822 }, // Matterhorn area
      { lat: 46.5197, lng: 7.9497 }, // Zermatt
      { lat: 46.5586, lng: 7.8789 }, // Gornergrat
    ];

    const mockElevationResponse = {
      elevation: [4478, 1608, 3135],
      generationtime_ms: 0.123,
    };

    it('should fetch elevation data successfully', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockElevationResponse,
      });

      const result = await getElevation(mockCoordinates);

      expect(fetch).toHaveBeenCalledWith(
        'https://api.open-meteo.com/v1/elevation?latitude=46.5503,46.5197,46.5586&longitude=7.9822,7.9497,7.8789',
        {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          },
        }
      );
      expect(result).toEqual([4478, 1608, 3135]);
    });

    it('should handle single coordinate', async () => {
      const singleCoord: Coordinate[] = [{ lat: 46.5503, lng: 7.9822 }];
      const singleResponse = { elevation: [4478] };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => singleResponse,
      });

      const result = await getElevation(singleCoord);

      expect(fetch).toHaveBeenCalledWith(
        'https://api.open-meteo.com/v1/elevation?latitude=46.5503&longitude=7.9822',
        expect.any(Object)
      );
      expect(result).toEqual([4478]);
    });

    it('should handle empty coordinates array', async () => {
      const emptyCoords: Coordinate[] = [];
      const emptyResponse = { elevation: [] };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => emptyResponse,
      });

      const result = await getElevation(emptyCoords);

      expect(fetch).toHaveBeenCalledWith(
        'https://api.open-meteo.com/v1/elevation?latitude=&longitude=',
        expect.any(Object)
      );
      expect(result).toEqual([]);
    });

    it('should handle HTTP error responses', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 429,
      });

      await expect(getElevation(mockCoordinates)).rejects.toThrow('Failed to fetch elevation data');
      expect(console.error).toHaveBeenCalledWith(
        'Error fetching elevation data:',
        expect.any(Error)
      );
    });

    it('should handle network errors', async () => {
      (fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      await expect(getElevation(mockCoordinates)).rejects.toThrow('Failed to fetch elevation data');
      expect(console.error).toHaveBeenCalledWith(
        'Error fetching elevation data:',
        expect.any(Error)
      );
    });

    it('should handle invalid JSON response', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => { throw new Error('Invalid JSON'); },
      });

      await expect(getElevation(mockCoordinates)).rejects.toThrow('Failed to fetch elevation data');
    });

    it('should handle missing elevation data in response', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ generationtime_ms: 0.123 }), // Missing elevation field
      });

      await expect(getElevation(mockCoordinates)).rejects.toThrow('Failed to fetch elevation data');
      expect(console.error).toHaveBeenCalledWith(
        'Error fetching elevation data:',
        expect.objectContaining({
          message: 'Invalid elevation data format'
        })
      );
    });

    it('should handle non-array elevation data', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ elevation: 'invalid' }),
      });

      await expect(getElevation(mockCoordinates)).rejects.toThrow('Failed to fetch elevation data');
    });

    it('should handle coordinates with extreme values', async () => {
      const extremeCoords: Coordinate[] = [
        { lat: 90, lng: 180 },   // North Pole, International Date Line
        { lat: -90, lng: -180 }, // South Pole, International Date Line
        { lat: 0, lng: 0 },      // Equator, Prime Meridian
      ];

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ elevation: [0, 0, 0] }),
      });

      const result = await getElevation(extremeCoords);
      expect(result).toEqual([0, 0, 0]);
      
      // Verify the API call was made with correct coordinates
      expect(fetch).toHaveBeenCalledWith(
        'https://api.open-meteo.com/v1/elevation?latitude=90,-90,0&longitude=180,-180,0',
        expect.any(Object)
      );
    });

    it('should handle large coordinate arrays', async () => {
      // Create array with 100 coordinates
      const largeCoordArray: Coordinate[] = Array.from({ length: 100 }, (_, i) => ({
        lat: 46.5 + (i * 0.001),
        lng: 7.9 + (i * 0.001),
      }));

      const largeElevationArray = Array.from({ length: 100 }, (_, i) => 1500 + i);

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ elevation: largeElevationArray }),
      });

      const result = await getElevation(largeCoordArray);
      expect(result).toHaveLength(100);
      expect(result[0]).toBe(1500);
      expect(result[99]).toBe(1599);
    });

    it('should handle API rate limiting', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 429,
      });

      await expect(getElevation(mockCoordinates)).rejects.toThrow('Failed to fetch elevation data');
    });

    it('should handle server errors', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      await expect(getElevation(mockCoordinates)).rejects.toThrow('Failed to fetch elevation data');
    });
  });

  describe('getElevationForRoute', () => {
    const start: Coordinate = { lat: 46.5503, lng: 7.9822 }; // Matterhorn
    const end: Coordinate = { lat: 46.5197, lng: 7.9497 };   // Zermatt

    it('should interpolate route points and fetch elevation data', async () => {
      // Calculate expected number of points based on distance and resolution
      const latDiff = end.lat - start.lat;
      const lngDiff = end.lng - start.lng;
      const distance = Math.sqrt(latDiff * latDiff + lngDiff * lngDiff);
      const expectedSteps = Math.ceil(distance / 0.01);
      const expectedPoints = expectedSteps + 1; // +1 for inclusive range
      
      const mockElevations = Array.from({ length: expectedPoints }, (_, i) => 
        4478 - (i * (4478 - 1608) / (expectedPoints - 1))
      );

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ elevation: mockElevations }),
      });

      const result = await getElevationForRoute(start, end, 0.01);

      // Should create interpolated points
      expect(result.length).toBeGreaterThan(2);
      expect(result[0]).toEqual({ ...start, elevation: mockElevations[0] });
      expect(result[result.length - 1]).toEqual({ ...end, elevation: mockElevations[mockElevations.length - 1] });

      // All points should have elevation data
      result.forEach(point => {
        expect(point.elevation).toBeDefined();
        expect(typeof point.elevation).toBe('number');
      });
    });

    it('should use default resolution when not specified', async () => {
      const mockElevations = [4478, 4000, 3500, 3000, 2500, 2000, 1608];

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ elevation: mockElevations }),
      });

      const result = await getElevationForRoute(start, end);

      expect(result.length).toBeGreaterThan(2);
      expect(fetch).toHaveBeenCalled();
    });

    it('should handle custom resolution values', async () => {
      const highResolution = 0.0001; // Very fine resolution
      const mockElevations = Array.from({ length: 50 }, (_, i) => 4478 - (i * 60));

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ elevation: mockElevations }),
      });

      const result = await getElevationForRoute(start, end, highResolution);

      expect(result.length).toBeGreaterThan(10);
      expect(result[0]).toEqual({ ...start, elevation: 4478 });
    });

    it('should handle same start and end coordinates', async () => {
      const samePoint: Coordinate = { lat: 46.5503, lng: 7.9822 };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ elevation: [4478] }),
      });

      const result = await getElevationForRoute(samePoint, samePoint);

      expect(result).toHaveLength(1);
      expect(result[0].lat).toBe(samePoint.lat);
      expect(result[0].lng).toBe(samePoint.lng);
      expect(result[0].elevation).toBe(4478);
    });

    it('should handle elevation API errors gracefully', async () => {
      (fetch as jest.Mock).mockRejectedValueOnce(new Error('API Error'));

      const result = await getElevationForRoute(start, end);

      // Should return points with zero elevation on error
      expect(result.length).toBeGreaterThan(0);
      result.forEach(point => {
        expect(point.elevation).toBe(0);
      });

      expect(console.error).toHaveBeenCalledWith(
        'Error getting elevation for route:',
        expect.any(Error)
      );
    });

    it('should interpolate points correctly with different coordinate scales', async () => {
      const longRoute: Coordinate = { lat: 46.0, lng: 7.0 }; // Much farther point
      const expectedPoints = 50; // Based on distance calculation
      const mockElevations = Array.from({ length: expectedPoints }, (_, i) => 1000 + i * 10);

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ elevation: mockElevations }),
      });

      const result = await getElevationForRoute(start, longRoute, 0.01);

      expect(result.length).toBeGreaterThan(10);
      
      // Check that interpolation is working
      const firstPoint = result[0];
      const lastPoint = result[result.length - 1];
      
      expect(firstPoint.lat).toBeCloseTo(start.lat, 4);
      expect(firstPoint.lng).toBeCloseTo(start.lng, 4);
      expect(lastPoint.lat).toBeCloseTo(longRoute.lat, 4);
      expect(lastPoint.lng).toBeCloseTo(longRoute.lng, 4);
    });

    it('should handle very short routes', async () => {
      const veryClose: Coordinate = { lat: 46.5504, lng: 7.9823 }; // Very close to start

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ elevation: [4478, 4477] }),
      });

      const result = await getElevationForRoute(start, veryClose, 0.001);

      expect(result.length).toBeGreaterThanOrEqual(2);
      expect(result[0].lat).toBeCloseTo(start.lat, 4);
      expect(result[result.length - 1].lat).toBeCloseTo(veryClose.lat, 4);
    });

    it('should handle HTTP errors in elevation API', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 503,
      });

      const result = await getElevationForRoute(start, end);

      // Should fallback to zero elevations
      result.forEach(point => {
        expect(point.elevation).toBe(0);
      });
    });

    it('should properly calculate step count based on distance and resolution', async () => {
      const resolution = 0.005;
      const latDiff = end.lat - start.lat;
      const lngDiff = end.lng - start.lng;
      const distance = Math.sqrt(latDiff * latDiff + lngDiff * lngDiff);
      const expectedSteps = Math.ceil(distance / resolution);
      const expectedPoints = expectedSteps + 1;
      
      const mockElevations = Array.from({ length: expectedPoints }, (_, i) => 
        4478 - (i * (4478 - 1608) / (expectedPoints - 1))
      );

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ elevation: mockElevations }),
      });

      const result = await getElevationForRoute(start, end, resolution);

      // Verify the number of points matches expected step calculation
      expect(result.length).toBe(expectedSteps + 1); // +1 because we include both start and end
    });
  });

  describe('API integration edge cases', () => {
    it('should handle API timeout gracefully', async () => {
      (fetch as jest.Mock).mockImplementationOnce(() => 
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Request timeout')), 100)
        )
      );

      await expect(getElevation([{ lat: 46.5503, lng: 7.9822 }])).rejects.toThrow('Failed to fetch elevation data');
    });

    it('should handle API returning null elevation values', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ elevation: [null, 1500, null] }),
      });

      await expect(getElevation([
        { lat: 46.5503, lng: 7.9822 },
        { lat: 46.5500, lng: 7.9820 },
        { lat: 46.5510, lng: 7.9830 }
      ])).resolves.toEqual([null, 1500, null]);
    });

    it('should handle API returning mixed number and null values', async () => {
      const mixedResponse = {
        elevation: [4478, null, 3000, undefined, 2500],
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mixedResponse,
      });

      const result = await getElevation([
        { lat: 46.5503, lng: 7.9822 },
        { lat: 46.5500, lng: 7.9820 },
        { lat: 46.5510, lng: 7.9830 },
        { lat: 46.5520, lng: 7.9840 },
        { lat: 46.5530, lng: 7.9850 },
      ]);

      expect(result).toEqual([4478, null, 3000, undefined, 2500]);
    });

    it('should handle API rate limiting with specific error code', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 429,
        statusText: 'Too Many Requests',
      });

      await expect(getElevation([{ lat: 46.5503, lng: 7.9822 }])).rejects.toThrow('Failed to fetch elevation data');
      expect(console.error).toHaveBeenCalledWith(
        'Error fetching elevation data:',
        expect.objectContaining({
          message: 'Elevation API error: 429'
        })
      );
    });

    it('should handle API returning elevation data with extra properties', async () => {
      const responseWithExtra = {
        elevation: [4478, 1608],
        generationtime_ms: 0.123,
        utc_offset_seconds: 0,
        timezone: 'GMT',
        extra_data: 'should be ignored',
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => responseWithExtra,
      });

      const result = await getElevation([
        { lat: 46.5503, lng: 7.9822 },
        { lat: 46.5197, lng: 7.9497 },
      ]);

      expect(result).toEqual([4478, 1608]);
    });

    it('should handle coordinates with high precision', async () => {
      const highPrecisionCoords = [
        { lat: 46.550312345678, lng: 7.982198765432 },
        { lat: 46.519734567890, lng: 7.949712345678 },
      ];

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ elevation: [4478, 1608] }),
      });

      const result = await getElevation(highPrecisionCoords);

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('latitude=46.550312345678,46.51973456789'),
        expect.any(Object)
      );
      expect(result).toEqual([4478, 1608]);
    });

    it('should handle very small resolution values', async () => {
      const verySmallResolution = 0.00001; // ~1 meter resolution
      const start: Coordinate = { lat: 46.5503, lng: 7.9822 };
      const end: Coordinate = { lat: 46.5504, lng: 7.9823 }; // Very close points
      
      const latDiff = end.lat - start.lat;
      const lngDiff = end.lng - start.lng;
      const distance = Math.sqrt(latDiff * latDiff + lngDiff * lngDiff);
      const expectedSteps = Math.ceil(distance / verySmallResolution);
      const expectedPoints = expectedSteps + 1;
      
      const mockElevations = Array.from({ length: expectedPoints }, () => 4478);

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ elevation: mockElevations }),
      });

      const result = await getElevationForRoute(start, end, verySmallResolution);

      expect(result.length).toBeGreaterThan(10); // Should create many interpolation points
      expect(result[0]).toEqual({ ...start, elevation: 4478 });
      expect(result[result.length - 1]).toEqual({ ...end, elevation: 4478 });
    });

    it('should handle API returning status 503 Service Unavailable', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 503,
        statusText: 'Service Unavailable',
      });

      await expect(getElevation([{ lat: 46.5503, lng: 7.9822 }])).rejects.toThrow('Failed to fetch elevation data');
    });

    it('should handle fetch being undefined/unavailable', async () => {
      const originalFetch = global.fetch;
      delete (global as unknown as { fetch?: unknown }).fetch;

      try {
        await expect(getElevation([{ lat: 46.5503, lng: 7.9822 }])).rejects.toThrow();
      } finally {
        global.fetch = originalFetch;
      }
    });

    it('should handle elevation array with mismatched length', async () => {
      const coords = [
        { lat: 46.5503, lng: 7.9822 },
        { lat: 46.5197, lng: 7.9497 },
        { lat: 46.5300, lng: 7.9600 },
      ];

      // API returns fewer elevation values than coordinates
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ elevation: [4478, 1608] }), // Missing one elevation
      });

      const result = await getElevation(coords);
      expect(result).toEqual([4478, 1608]); // Should return what API provided
    });

    it('should handle getElevationForRoute with network error in middle of processing', async () => {
      const start: Coordinate = { lat: 46.5503, lng: 7.9822 };
      const end: Coordinate = { lat: 46.5197, lng: 7.9497 };

      // Mock fetch to fail during getElevation call
      (fetch as jest.Mock).mockRejectedValueOnce(new Error('Network connection lost'));

      const result = await getElevationForRoute(start, end);

      // Should return points with zero elevation
      expect(result.length).toBeGreaterThan(0);
      result.forEach(point => {
        expect(point.elevation).toBe(0);
        expect(point.lat).toBeDefined();
        expect(point.lng).toBeDefined();
      });
      
      expect(console.error).toHaveBeenCalledWith(
        'Error getting elevation for route:',
        expect.any(Error)
      );
    });

    it('should handle coordinates at extreme latitudes near poles', async () => {
      const extremeCoords = [
        { lat: 89.99, lng: 0 },      // Very close to North Pole
        { lat: -89.99, lng: 180 },   // Very close to South Pole
      ];

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ elevation: [0, 0] }), // Poles are at sea level
      });

      const result = await getElevation(extremeCoords);
      expect(result).toEqual([0, 0]);
    });
  });

  describe('URL construction and parameter handling', () => {
    it('should properly encode special characters in coordinates', async () => {
      const coords = [
        { lat: 46.5503, lng: 7.9822 },
      ];

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ elevation: [4478] }),
      });

      await getElevation(coords);

      const expectedUrl = 'https://api.open-meteo.com/v1/elevation?latitude=46.5503&longitude=7.9822';
      expect(fetch).toHaveBeenCalledWith(expectedUrl, expect.any(Object));
    });

    it('should handle request headers correctly', async () => {
      const coords = [{ lat: 46.5503, lng: 7.9822 }];

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ elevation: [4478] }),
      });

      await getElevation(coords);

      expect(fetch).toHaveBeenCalledWith(
        expect.any(String),
        {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          },
        }
      );
    });

    it('should handle coordinates with negative values in URL', async () => {
      const coords = [
        { lat: -46.5503, lng: -7.9822 },
        { lat: 46.5197, lng: 7.9497 },
      ];

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ elevation: [100, 4478] }),
      });

      await getElevation(coords);

      expect(fetch).toHaveBeenCalledWith(
        'https://api.open-meteo.com/v1/elevation?latitude=-46.5503,46.5197&longitude=-7.9822,7.9497',
        expect.any(Object)
      );
    });
  });
});