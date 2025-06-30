import {
  fetchTrailData,
  getTrailsNearCoordinate,
  findNearestTrailPoint,
  isOnTrail,
  calculateBoundingBox,
  buildOverpassQuery,
  getCacheKey,
  isCacheValid,
  parseTrailDifficulty,
  buildSpatialIndex,
  cachedCalculateDistance,
  calculateDistance,
  TrailSegment,
  TrailNetwork,
} from '../trails';
import { Coordinate } from '@/types/route';

// Mock fetch - will be reset per test
const mockFetch = jest.fn() as jest.MockedFunction<typeof fetch>;
global.fetch = mockFetch;

// Mock performance.now for timing tests
const mockPerformanceNow = jest.fn();
Object.defineProperty(global, 'performance', {
  value: { now: mockPerformanceNow },
  writable: true,
});

// Helper to clear all caches and reset module state
function clearAllCaches() {
  // Clear all module caches related to trails
  const modulesToClear = Object.keys(require.cache).filter(key => 
    key.includes('trails') || key.includes('/api/')
  );
  
  modulesToClear.forEach(moduleKey => {
    delete require.cache[moduleKey];
  });
}

describe('trails API', () => {
  beforeEach(() => {
    // Clear all mocks and reset fetch
    jest.clearAllMocks();
    mockFetch.mockReset();
    
    // Clear all caches to ensure test isolation
    clearAllCaches();
    
    // Mock console functions
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
    
    // Reset performance timer
    mockPerformanceNow.mockReturnValue(0);
  });

  afterEach(() => {
    jest.restoreAllMocks();
    clearAllCaches();
  });

  describe('fetchTrailData', () => {
    const start: Coordinate = { lat: 46.5503, lng: 7.9822 }; // Matterhorn area
    const end: Coordinate = { lat: 46.5197, lng: 7.9497 };   // Zermatt

    const mockOSMResponse = {
      version: 0.6,
      generator: 'Overpass API 0.7.59',
      elements: [
        {
          type: 'way',
          id: 12345,
          nodes: [1, 2, 3],
          tags: {
            highway: 'path',
            name: 'Matterhorn Trail',
            sac_scale: 'T2',
            surface: 'ground',
            trail_visibility: 'good',
          },
          geometry: [
            { lat: 46.5500, lon: 7.9820 },
            { lat: 46.5510, lon: 7.9830 },
            { lat: 46.5520, lon: 7.9840 },
          ],
        },
        {
          type: 'way',
          id: 12346,
          nodes: [4, 5, 6],
          tags: {
            highway: 'track',
            sac_scale: 'T3',
            surface: 'rock',
          },
          geometry: [
            { lat: 46.5200, lon: 7.9500 },
            { lat: 46.5210, lon: 7.9510 },
          ],
        },
        {
          type: 'way',
          id: 12347,
          nodes: [7, 8],
          tags: {
            natural: 'water',
          },
          geometry: [
            { lat: 46.5300, lon: 7.9600 },
            { lat: 46.5310, lon: 7.9610 },
          ],
        },
        {
          type: 'way',
          id: 12348,
          nodes: [9, 10],
          tags: {
            highway: 'secondary',
          },
          geometry: [
            { lat: 46.5400, lon: 7.9700 },
            { lat: 46.5410, lon: 7.9710 },
          ],
        },
      ],
    };

    it('should fetch and parse trail data successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockOSMResponse,
      });

      const result = await fetchTrailData(start, end);

      expect(mockFetch).toHaveBeenCalledWith(
        'https://overpass-api.de/api/interpreter',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: expect.stringContaining('data='),
        }
      );

      expect(result.trails).toHaveLength(4);
      expect(result.bbox).toEqual({
        minLat: expect.any(Number),
        maxLat: expect.any(Number),
        minLng: expect.any(Number),
        maxLng: expect.any(Number),
      });
      expect(result.cacheTime).toBeGreaterThan(0);
      expect(result.spatialIndex).toBeDefined();
    });

    it('should parse trail difficulty correctly', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockOSMResponse,
      });

      const result = await fetchTrailData(start, end);

      const matterHornTrail = result.trails.find(t => t.name === 'Matterhorn Trail');
      expect(matterHornTrail?.difficulty).toBe('moderate'); // T2 = moderate

      const difficultTrail = result.trails.find(t => t.id === '12346');
      expect(difficultTrail?.difficulty).toBe('difficult'); // T3 = difficult
    });

    it('should identify water bodies correctly', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockOSMResponse,
      });

      const result = await fetchTrailData(start, end);

      const waterFeature = result.trails.find(t => t.id === '12347');
      expect(waterFeature?.isWater).toBe(true);
    });

    it('should identify roads correctly', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockOSMResponse,
      });

      const result = await fetchTrailData(start, end);

      const roadFeature = result.trails.find(t => t.id === '12348');
      expect(roadFeature?.isRoad).toBe(true);
    });

    it('should use cached data when available and valid', async () => {
      // Use unique coordinates to avoid cache conflicts
      const uniqueStart: Coordinate = { lat: 47.0000, lng: 8.5000 };
      const uniqueEnd: Coordinate = { lat: 47.0100, lng: 8.5100 };
      
      // First call
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockOSMResponse,
      });

      const result1 = await fetchTrailData(uniqueStart, uniqueEnd);
      
      // Clear fetch mock but not the cache
      mockFetch.mockClear();
      
      // Second call (should use cache)
      const result2 = await fetchTrailData(uniqueStart, uniqueEnd);

      expect(mockFetch).not.toHaveBeenCalled(); // Should not call fetch again
      expect(result1.trails).toEqual(result2.trails);
    });

    it('should handle empty OSM response', async () => {
      const uniqueCoords = { lat: 48.0000, lng: 9.0000 };
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ elements: [] }),
      });

      const result = await fetchTrailData(uniqueCoords, { lat: 48.0100, lng: 9.0100 });

      expect(result.trails).toHaveLength(0);
      expect(result.bbox).toBeDefined();
    });

    it('should handle OSM API errors gracefully', async () => {
      const uniqueCoords = { lat: 49.0000, lng: 10.0000 };
      
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 429, // Rate limited
      });

      const result = await fetchTrailData(uniqueCoords, { lat: 49.0100, lng: 10.0100 });

      expect(result.trails).toHaveLength(0);
      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('❌ Error fetching trail data'),
        expect.any(Error)
      );
    });

    it('should handle network errors', async () => {
      const uniqueCoords = { lat: 52.0000, lng: 13.0000 };
      
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const result = await fetchTrailData(uniqueCoords, { lat: 52.0100, lng: 13.0100 });

      expect(result.trails).toHaveLength(0);
    });

    it('should handle malformed JSON response', async () => {
      const uniqueCoords = { lat: 53.0000, lng: 14.0000 };
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => { throw new Error('Invalid JSON'); },
      });

      const result = await fetchTrailData(uniqueCoords, { lat: 53.0100, lng: 14.0100 });

      expect(result.trails).toHaveLength(0);
    });

    it('should skip ways with insufficient coordinates', async () => {
      const uniqueCoords = { lat: 54.0000, lng: 15.0000 };
      
      const malformedResponse = {
        elements: [
          {
            type: 'way',
            id: 1,
            geometry: [{ lat: 54.0000, lon: 15.0000 }], // Only one point
          },
          {
            type: 'way',
            id: 2,
            geometry: [], // No points
          },
        ],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => malformedResponse,
      });

      const result = await fetchTrailData(uniqueCoords, { lat: 54.0100, lng: 15.0100 });

      expect(result.trails).toHaveLength(0);
    });

    it('should handle ways without geometry', async () => {
      const uniqueCoords = { lat: 55.0000, lng: 16.0000 };
      
      const responseWithoutGeometry = {
        elements: [
          {
            type: 'way',
            id: 1,
            tags: { highway: 'path' },
            // Missing geometry
          },
        ],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => responseWithoutGeometry,
      });

      const result = await fetchTrailData(uniqueCoords, { lat: 55.0100, lng: 16.0100 });

      expect(result.trails).toHaveLength(0);
    });

    it('should limit trails to prevent browser crashes', async () => {
      // Use unique coordinates to avoid cache conflicts
      const uniqueStart: Coordinate = { lat: 40.0000, lng: 9.0000 };
      const uniqueEnd: Coordinate = { lat: 40.0100, lng: 9.0100 };
      
      // Create response with many trails
      const manyTrails = {
        elements: Array.from({ length: 6000 }, (_, i) => ({
          type: 'way',
          id: i,
          geometry: [
            { lat: 40.0000 + (i * 0.0001), lon: 9.0000 + (i * 0.0001) },
            { lat: 40.0010 + (i * 0.0001), lon: 9.0010 + (i * 0.0001) },
          ],
        })),
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => manyTrails,
      });

      const result = await fetchTrailData(uniqueStart, uniqueEnd);

      expect(result.trails.length).toBeLessThanOrEqual(5000);
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('⚠️ Trail limit reached')
      );
    });

    it('should build spatial index correctly', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockOSMResponse,
      });

      const result = await fetchTrailData(start, end);

      expect(result.spatialIndex).toBeInstanceOf(Map);
      expect(result.spatialIndex!.size).toBeGreaterThan(0);
    });

    it('should handle different SAC scale formats', async () => {
      const uniqueCoords = { lat: 56.0000, lng: 17.0000 };
      
      const sacScaleResponse = {
        elements: [
          {
            type: 'way',
            id: 1,
            tags: { sac_scale: 'hiking' },
            geometry: [
              { lat: 56.0000, lon: 17.0000 },
              { lat: 56.0010, lon: 17.0010 },
            ],
          },
          {
            type: 'way',
            id: 2,
            tags: { sac_scale: 'alpine_hiking' },
            geometry: [
              { lat: 56.0020, lon: 17.0020 },
              { lat: 56.0030, lon: 17.0030 },
            ],
          },
        ],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => sacScaleResponse,
      });

      const result = await fetchTrailData(uniqueCoords, { lat: 56.0100, lng: 17.0100 });

      // Find trails by their SAC scale rather than assuming order
      const hikingTrail = result.trails.find(t => t.sac_scale === 'hiking');
      const alpineTrail = result.trails.find(t => t.sac_scale === 'alpine_hiking');
      
      expect(hikingTrail?.difficulty).toBe('easy');
      expect(alpineTrail?.difficulty).toBe('expert');
    });

    it('should handle trail visibility classifications', async () => {
      const uniqueCoords = { lat: 57.0000, lng: 18.0000 };
      
      const visibilityResponse = {
        elements: [
          {
            type: 'way',
            id: 1,
            tags: { trail_visibility: 'excellent' },
            geometry: [
              { lat: 57.0000, lon: 18.0000 },
              { lat: 57.0010, lon: 18.0010 },
            ],
          },
          {
            type: 'way',
            id: 2,
            tags: { trail_visibility: 'horrible' },
            geometry: [
              { lat: 57.0020, lon: 18.0020 },
              { lat: 57.0030, lon: 18.0030 },
            ],
          },
        ],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => visibilityResponse,
      });

      const result = await fetchTrailData(uniqueCoords, { lat: 57.0100, lng: 18.0100 });

      // Find trails by their visibility rather than assuming order
      const excellentTrail = result.trails.find(t => t.trail_visibility === 'excellent');
      const horribleTrail = result.trails.find(t => t.trail_visibility === 'horrible');
      
      expect(excellentTrail?.difficulty).toBe('easy');
      expect(horribleTrail?.difficulty).toBe('expert');
    });
  });

  describe('getTrailsNearCoordinate', () => {
    const coordinate: Coordinate = { lat: 46.5500, lng: 7.9820 };
    const bbox = {
      minLat: 46.54,
      maxLat: 46.56,
      minLng: 7.97,
      maxLng: 7.99,
    };

    const mockTrail: TrailSegment = {
      id: '1',
      coordinates: [
        { lat: 46.5500, lng: 7.9820 },
        { lat: 46.5510, lng: 7.9830 },
      ],
      difficulty: 'moderate',
    };

    it('should find trails in nearby grid cells', () => {
      const spatialIndex = new Map<string, TrailSegment[]>();
      
      // Calculate the correct grid coordinates for the test coordinate
      const gridSize = 0.01;
      const gridLat = Math.floor((coordinate.lat - bbox.minLat) / gridSize);
      const gridLng = Math.floor((coordinate.lng - bbox.minLng) / gridSize);
      const gridKey = `${gridLat}_${gridLng}`;
      
      // Add trail to the correct grid cell and surrounding cells
      spatialIndex.set(gridKey, [mockTrail]);
      spatialIndex.set(`${gridLat + 1}_${gridLng}`, [mockTrail]);
      spatialIndex.set(`${gridLat}_${gridLng + 1}`, [mockTrail]);

      const result = getTrailsNearCoordinate(coordinate, spatialIndex, bbox);

      expect(result).toContain(mockTrail);
      expect(result.length).toBeGreaterThan(0);
    });

    it('should return empty array when no trails nearby', () => {
      const spatialIndex = new Map<string, TrailSegment[]>();
      
      const result = getTrailsNearCoordinate(coordinate, spatialIndex, bbox);

      expect(result).toEqual([]);
    });

    it('should handle edge coordinates', () => {
      const edgeCoordinate: Coordinate = { lat: bbox.minLat, lng: bbox.minLng };
      const spatialIndex = new Map<string, TrailSegment[]>();
      spatialIndex.set('0_0', [mockTrail]);

      const result = getTrailsNearCoordinate(edgeCoordinate, spatialIndex, bbox);

      expect(result).toContain(mockTrail);
    });

    it('should deduplicate trails from multiple grid cells', () => {
      const spatialIndex = new Map<string, TrailSegment[]>();
      
      // Calculate the correct grid coordinates for the test coordinate
      const gridSize = 0.01;
      const gridLat = Math.floor((coordinate.lat - bbox.minLat) / gridSize);
      const gridLng = Math.floor((coordinate.lng - bbox.minLng) / gridSize);
      
      // Add same trail to multiple cells
      spatialIndex.set(`${gridLat}_${gridLng}`, [mockTrail]);
      spatialIndex.set(`${gridLat + 1}_${gridLng}`, [mockTrail]);
      spatialIndex.set(`${gridLat}_${gridLng + 1}`, [mockTrail]);
      spatialIndex.set(`${gridLat + 1}_${gridLng + 1}`, [mockTrail]);

      const result = getTrailsNearCoordinate(coordinate, spatialIndex, bbox);

      expect(result).toEqual([mockTrail]); // Should only appear once
    });
  });

  describe('findNearestTrailPoint', () => {
    const coordinate: Coordinate = { lat: 46.5500, lng: 7.9820 };

    const mockTrails: TrailSegment[] = [
      {
        id: '1',
        coordinates: [
          { lat: 46.5500, lng: 7.9820 }, // Exact match
          { lat: 46.5510, lng: 7.9830 },
        ],
      },
      {
        id: '2',
        coordinates: [
          { lat: 46.5600, lng: 7.9920 }, // Farther away
          { lat: 46.5610, lng: 7.9930 },
        ],
      },
    ];

    it('should find exact match', () => {
      const result = findNearestTrailPoint(coordinate, mockTrails);

      expect(result).toBeDefined();
      expect(result!.trail.id).toBe('1');
      expect(result!.point).toEqual(coordinate);
      expect(result!.distance).toBeCloseTo(0, 3);
    });

    it('should respect maximum distance', () => {
      const farCoordinate: Coordinate = { lat: 47.0, lng: 8.0 }; // Very far
      
      const result = findNearestTrailPoint(farCoordinate, mockTrails, 0.1);

      expect(result).toBeNull();
    });

    it('should return null for empty trails array', () => {
      const result = findNearestTrailPoint(coordinate, []);

      expect(result).toBeNull();
    });

    it('should handle trails with no coordinates', () => {
      const emptyTrails: TrailSegment[] = [
        { id: '1', coordinates: [] },
        { id: '2', coordinates: undefined as unknown as Coordinate[] },
      ];

      const result = findNearestTrailPoint(coordinate, emptyTrails);

      expect(result).toBeNull();
    });

    it('should sample coordinates for performance on long trails', () => {
      const longTrail: TrailSegment = {
        id: '1',
        coordinates: Array.from({ length: 1000 }, (_, i) => ({
          lat: 46.5500 + (i * 0.0001),
          lng: 7.9820 + (i * 0.0001),
        })),
      };

      const result = findNearestTrailPoint(coordinate, [longTrail]);

      expect(result).toBeDefined();
      expect(result!.trail.id).toBe('1');
    });

    it('should exit early on very close points', () => {
      const veryCloseTrail: TrailSegment = {
        id: '1',
        coordinates: [
          { lat: 46.5500001, lng: 7.9820001 }, // ~1cm away
        ],
      };

      const result = findNearestTrailPoint(coordinate, [veryCloseTrail]);

      expect(result).toBeDefined();
      expect(result!.distance).toBeLessThan(0.05);
    });

    it('should find closest point among multiple candidates', () => {
      const multipleTrails: TrailSegment[] = [
        {
          id: '1',
          coordinates: [{ lat: 46.5510, lng: 7.9830 }], // ~1.5km away
        },
        {
          id: '2',
          coordinates: [{ lat: 46.5501, lng: 7.9821 }], // ~100m away
        },
        {
          id: '3',
          coordinates: [{ lat: 46.5520, lng: 7.9840 }], // ~2.8km away
        },
      ];

      const result = findNearestTrailPoint(coordinate, multipleTrails);

      expect(result).toBeDefined();
      expect(result!.trail.id).toBe('2'); // Closest trail
    });
  });

  describe('isOnTrail', () => {
    const coordinate: Coordinate = { lat: 46.5500, lng: 7.9820 };

    const mockTrails: TrailSegment[] = [
      {
        id: '1',
        coordinates: [
          { lat: 46.5500, lng: 7.9820 }, // Exact match
          { lat: 46.5510, lng: 7.9830 },
        ],
      },
    ];

    it('should return true for coordinates on trail', () => {
      const result = isOnTrail(coordinate, mockTrails);

      expect(result).toBe(true);
    });

    it('should return false for coordinates far from trails', () => {
      const farCoordinate: Coordinate = { lat: 47.0, lng: 8.0 };
      
      const result = isOnTrail(farCoordinate, mockTrails);

      expect(result).toBe(false);
    });

    it('should use custom distance threshold', () => {
      // Use a coordinate that's farther away to test different thresholds
      const nearbyCoordinate: Coordinate = { lat: 46.5520, lng: 7.9840 };
      
      const result1 = isOnTrail(nearbyCoordinate, mockTrails, 0.05); // 50m
      const result2 = isOnTrail(nearbyCoordinate, mockTrails, 5.0);   // 5km

      expect(result1).toBe(false); // Too far for 50m threshold
      expect(result2).toBe(true);  // Within 5km threshold
    });

    it('should use caching for repeated calls', () => {
      // First call
      const result1 = isOnTrail(coordinate, mockTrails);
      
      // Second call with same parameters (should use cache)
      const result2 = isOnTrail(coordinate, mockTrails);

      expect(result1).toBe(result2);
    });

    it('should handle cache size limit', () => {
      // Make many calls to trigger cache size limit
      for (let i = 0; i < 600; i++) {
        const testCoord: Coordinate = { 
          lat: 46.5500 + (i * 0.0001), 
          lng: 7.9820 + (i * 0.0001) 
        };
        isOnTrail(testCoord, mockTrails);
      }

      // Should not throw error and should still work
      const result = isOnTrail(coordinate, mockTrails);
      expect(typeof result).toBe('boolean');
    });

    it('should handle empty trails array', () => {
      const result = isOnTrail(coordinate, []);

      expect(result).toBe(false);
    });

    it('should differentiate cache keys properly', () => {
      const coord1: Coordinate = { lat: 46.5500, lng: 7.9820 };
      const coord2: Coordinate = { lat: 47.0000, lng: 8.0000 }; // Much farther away

      const result1 = isOnTrail(coord1, mockTrails);
      const result2 = isOnTrail(coord2, mockTrails);

      // Results should be different (cached separately)
      expect(result1).toBe(true);  // Exact match with trail
      expect(result2).toBe(false); // Far from any trail
    });
  });

  describe('distance caching', () => {
    it('should cache distance calculations', () => {
      const coord1: Coordinate = { lat: 46.5500, lng: 7.9820 };
      const coord2: Coordinate = { lat: 46.5510, lng: 7.9830 };

      const trail: TrailSegment = {
        id: '1',
        coordinates: [coord1, coord2],
      };

      // First call - should calculate distance
      const result1 = findNearestTrailPoint(coord1, [trail]);
      
      // Second call - should use cached distance
      const result2 = findNearestTrailPoint(coord1, [trail]);

      expect(result1).toEqual(result2);
    });

    it('should limit distance cache size', () => {
      const baseCoord: Coordinate = { lat: 46.5500, lng: 7.9820 };
      
      // Create many different coordinate pairs to exceed cache limit
      for (let i = 0; i < 1200; i++) {
        const coord: Coordinate = { 
          lat: 46.5500 + (i * 0.0001), 
          lng: 7.9820 + (i * 0.0001) 
        };
        const trail: TrailSegment = {
          id: `trail-${i}`,
          coordinates: [baseCoord, coord],
        };
        
        findNearestTrailPoint(baseCoord, [trail]);
      }

      // Should not throw error due to cache management
      expect(() => {
        findNearestTrailPoint(baseCoord, [{
          id: 'final',
          coordinates: [baseCoord, { lat: 46.5600, lng: 7.9900 }],
        }]);
      }).not.toThrow();
    });
  });

  describe('bounding box calculation', () => {
    it('should calculate correct bounding box with default padding', async () => {
      const start: Coordinate = { lat: 46.5503, lng: 7.9822 };
      const end: Coordinate = { lat: 46.5197, lng: 7.9497 };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ elements: [] }),
      });

      const result = await fetchTrailData(start, end);

      expect(result.bbox.minLat).toBeLessThan(Math.min(start.lat, end.lat));
      expect(result.bbox.maxLat).toBeGreaterThan(Math.max(start.lat, end.lat));
      expect(result.bbox.minLng).toBeLessThan(Math.min(start.lng, end.lng));
      expect(result.bbox.maxLng).toBeGreaterThan(Math.max(start.lng, end.lng));
    });
  });

  describe('overpass query building', () => {
    it('should build valid overpass query', async () => {
      const uniqueCoords = { lat: 58.0000, lng: 19.0000 };
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ elements: [] }),
      });

      await fetchTrailData(uniqueCoords, { lat: 58.0100, lng: 19.0100 });

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const fetchCall = mockFetch.mock.calls[0];
      const requestBody = fetchCall[1].body;

      expect(requestBody).toContain('data=');
      expect(requestBody).toContain('highway');
      expect(requestBody).toContain('sac_scale');
      expect(requestBody).toContain('natural');
    });
  });

  describe('cache management', () => {
    it('should generate consistent cache keys', async () => {
      const start: Coordinate = { lat: 46.5503, lng: 7.9822 };
      const end: Coordinate = { lat: 46.5197, lng: 7.9497 };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ elements: [] }),
      });

      // First call
      await fetchTrailData(start, end);
      
      mockFetch.mockClear();

      // Second call with same coordinates should use cache
      await fetchTrailData(start, end);

      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should invalidate expired cache', async () => {
      // Use different coordinates to avoid cache conflicts with other tests
      const start: Coordinate = { lat: 46.6000, lng: 8.0000 };
      const end: Coordinate = { lat: 46.6100, lng: 8.0100 };

      jest.clearAllMocks();
      
      // Mock old timestamp for first call
      const oldTime = Date.now() - (35 * 60 * 1000); // 35 minutes ago
      const dateSpy = jest.spyOn(Date, 'now');
      dateSpy.mockReturnValueOnce(oldTime); // For cache timestamp
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ elements: [] }),
      });

      // First call with old timestamp
      await fetchTrailData(start, end);

      // Restore Date.now to current time for cache validation
      dateSpy.mockRestore();
      jest.spyOn(console, 'log').mockImplementation(() => {});
      jest.spyOn(console, 'error').mockImplementation(() => {});

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ elements: [] }),
      });

      // Second call should refetch due to expired cache
      await fetchTrailData(start, end);

      expect(mockFetch).toHaveBeenCalledTimes(2);
    });
  });

  describe('utility functions', () => {
    describe('calculateBoundingBox', () => {
      it('should calculate correct bounding box with default padding', () => {
        const start: Coordinate = { lat: 46.5503, lng: 7.9822 };
        const end: Coordinate = { lat: 46.5197, lng: 7.9497 };
        
        const bbox = calculateBoundingBox(start, end);
        
        expect(bbox.minLat).toBeLessThan(Math.min(start.lat, end.lat));
        expect(bbox.maxLat).toBeGreaterThan(Math.max(start.lat, end.lat));
        expect(bbox.minLng).toBeLessThan(Math.min(start.lng, end.lng));
        expect(bbox.maxLng).toBeGreaterThan(Math.max(start.lng, end.lng));
      });

      it('should handle custom padding', () => {
        const start: Coordinate = { lat: 46.5503, lng: 7.9822 };
        const end: Coordinate = { lat: 46.5197, lng: 7.9497 };
        
        const bbox1 = calculateBoundingBox(start, end, 1); // 1km padding
        const bbox2 = calculateBoundingBox(start, end, 5); // 5km padding
        
        // Larger padding should create larger bounding box
        expect(bbox2.maxLat - bbox2.minLat).toBeGreaterThan(bbox1.maxLat - bbox1.minLat);
        expect(bbox2.maxLng - bbox2.minLng).toBeGreaterThan(bbox1.maxLng - bbox1.minLng);
      });

      it('should handle same start and end coordinates', () => {
        const coord: Coordinate = { lat: 46.5503, lng: 7.9822 };
        
        const bbox = calculateBoundingBox(coord, coord);
        
        expect(bbox.minLat).toBeLessThan(coord.lat);
        expect(bbox.maxLat).toBeGreaterThan(coord.lat);
        expect(bbox.minLng).toBeLessThan(coord.lng);
        expect(bbox.maxLng).toBeGreaterThan(coord.lng);
      });
    });

    describe('buildOverpassQuery', () => {
      it('should build valid Overpass query string', () => {
        const bbox = {
          minLat: 46.5,
          maxLat: 46.6,
          minLng: 7.9,
          maxLng: 8.0,
        };
        
        const query = buildOverpassQuery(bbox);
        
        expect(query).toContain('[out:json]');
        expect(query).toContain('highway');
        expect(query).toContain('sac_scale');
        expect(query).toContain('natural');
        expect(query).toContain('waterway');
        expect(query).toContain('46.5,7.9,46.6,8'); // Bounding box coordinates
        expect(query).toContain('out geom');
      });

      it('should include all required trail types', () => {
        const bbox = { minLat: 46.5, maxLat: 46.6, minLng: 7.9, maxLng: 8.0 };
        const query = buildOverpassQuery(bbox);
        
        expect(query).toContain('path');
        expect(query).toContain('track');
        expect(query).toContain('footway');
        expect(query).toContain('cycleway');
        expect(query).toContain('bridleway');
        expect(query).toContain('steps');
        expect(query).toContain('route"="hiking');
      });
    });

    describe('getCacheKey', () => {
      it('should generate consistent cache keys', () => {
        const bbox = {
          minLat: 46.5503,
          maxLat: 46.5600,
          minLng: 7.9822,
          maxLng: 7.9900,
        };
        
        const key1 = getCacheKey(bbox);
        const key2 = getCacheKey(bbox);
        
        expect(key1).toBe(key2);
        expect(key1).toContain('46.550');
        expect(key1).toContain('7.982');
      });

      it('should generate different keys for different bounding boxes', () => {
        const bbox1 = { minLat: 46.5, maxLat: 46.6, minLng: 7.9, maxLng: 8.0 };
        const bbox2 = { minLat: 47.5, maxLat: 47.6, minLng: 8.9, maxLng: 9.0 };
        
        const key1 = getCacheKey(bbox1);
        const key2 = getCacheKey(bbox2);
        
        expect(key1).not.toBe(key2);
      });

      it('should round coordinates to 3 decimal places', () => {
        const bbox = {
          minLat: 46.55031234,
          maxLat: 46.56009876,
          minLng: 7.98221234,
          maxLng: 7.99009876,
        };
        
        const key = getCacheKey(bbox);
        
        expect(key).toBe('46.550_7.982_46.560_7.990');
      });
    });

    describe('isCacheValid', () => {
      it('should return true for fresh cache', () => {
        const network: TrailNetwork = {
          trails: [],
          bbox: { minLat: 46.5, maxLat: 46.6, minLng: 7.9, maxLng: 8.0 },
          cacheTime: Date.now(), // Fresh timestamp
        };
        
        expect(isCacheValid(network)).toBe(true);
      });

      it('should return false for expired cache', () => {
        const network: TrailNetwork = {
          trails: [],
          bbox: { minLat: 46.5, maxLat: 46.6, minLng: 7.9, maxLng: 8.0 },
          cacheTime: Date.now() - (35 * 60 * 1000), // 35 minutes ago
        };
        
        expect(isCacheValid(network)).toBe(false);
      });

      it('should return true for cache just under expiry limit', () => {
        const network: TrailNetwork = {
          trails: [],
          bbox: { minLat: 46.5, maxLat: 46.6, minLng: 7.9, maxLng: 8.0 },
          cacheTime: Date.now() - (29 * 60 * 1000), // 29 minutes ago
        };
        
        expect(isCacheValid(network)).toBe(true);
      });
    });

    describe('parseTrailDifficulty', () => {
      it('should parse SAC scale T1-T6', () => {
        expect(parseTrailDifficulty({ sac_scale: 'T1' })).toBe('easy');
        expect(parseTrailDifficulty({ sac_scale: 'T2' })).toBe('moderate');
        expect(parseTrailDifficulty({ sac_scale: 'T3' })).toBe('difficult');
        expect(parseTrailDifficulty({ sac_scale: 'T4' })).toBe('expert');
        expect(parseTrailDifficulty({ sac_scale: 'T5' })).toBe('expert');
        expect(parseTrailDifficulty({ sac_scale: 'T6' })).toBe('expert');
      });

      it('should parse SAC scale descriptive names', () => {
        expect(parseTrailDifficulty({ sac_scale: 'hiking' })).toBe('easy');
        expect(parseTrailDifficulty({ sac_scale: 'mountain_hiking' })).toBe('moderate');
        expect(parseTrailDifficulty({ sac_scale: 'demanding_mountain_hiking' })).toBe('difficult');
        expect(parseTrailDifficulty({ sac_scale: 'alpine_hiking' })).toBe('expert');
      });

      it('should parse trail visibility as fallback', () => {
        expect(parseTrailDifficulty({ trail_visibility: 'excellent' })).toBe('easy');
        expect(parseTrailDifficulty({ trail_visibility: 'good' })).toBe('easy');
        expect(parseTrailDifficulty({ trail_visibility: 'intermediate' })).toBe('moderate');
        expect(parseTrailDifficulty({ trail_visibility: 'bad' })).toBe('difficult');
        expect(parseTrailDifficulty({ trail_visibility: 'horrible' })).toBe('expert');
        expect(parseTrailDifficulty({ trail_visibility: 'no' })).toBe('expert');
      });

      it('should prioritize SAC scale over trail visibility', () => {
        const tags = {
          sac_scale: 'T1',
          trail_visibility: 'horrible',
        };
        
        expect(parseTrailDifficulty(tags)).toBe('easy'); // Should use SAC scale
      });

      it('should return undefined for unknown tags', () => {
        expect(parseTrailDifficulty({})).toBeUndefined();
        expect(parseTrailDifficulty({ sac_scale: 'unknown' })).toBeUndefined();
        expect(parseTrailDifficulty({ trail_visibility: 'unknown' })).toBeUndefined();
      });
    });

    describe('buildSpatialIndex', () => {
      it('should create spatial index for trails', () => {
        const trails: TrailSegment[] = [
          {
            id: '1',
            coordinates: [
              { lat: 46.5500, lng: 7.9820 },
              { lat: 46.5510, lng: 7.9830 },
            ],
          },
          {
            id: '2',
            coordinates: [
              { lat: 46.5600, lng: 7.9920 },
              { lat: 46.5610, lng: 7.9930 },
            ],
          },
        ];
        
        const bbox = {
          minLat: 46.5400,
          maxLat: 46.5700,
          minLng: 7.9700,
          maxLng: 8.0000,
        };
        
        const index = buildSpatialIndex(trails, bbox);
        
        expect(index).toBeInstanceOf(Map);
        expect(index.size).toBeGreaterThan(0);
        
        // Check that trails are indexed in grid cells
        const indexValues = Array.from(index.values()).flat();
        expect(indexValues).toContain(trails[0]);
        expect(indexValues).toContain(trails[1]);
      });

      it('should handle trails with multiple coordinates', () => {
        const trail: TrailSegment = {
          id: '1',
          coordinates: [
            { lat: 46.5500, lng: 7.9820 },
            { lat: 46.5510, lng: 7.9830 },
            { lat: 46.5520, lng: 7.9840 },
            { lat: 46.5530, lng: 7.9850 },
          ],
        };
        
        const bbox = {
          minLat: 46.5400,
          maxLat: 46.5600,
          minLng: 7.9700,
          maxLng: 8.0000,
        };
        
        const index = buildSpatialIndex([trail], bbox);
        
        // Trail should be indexed in multiple grid cells
        const indexedTrails = Array.from(index.values()).flat();
        const uniqueTrails = [...new Set(indexedTrails)];
        
        expect(uniqueTrails).toEqual([trail]);
        expect(index.size).toBeGreaterThan(1); // Multiple grid cells
      });

      it('should handle empty trails array', () => {
        const bbox = {
          minLat: 46.5400,
          maxLat: 46.5600,
          minLng: 7.9700,
          maxLng: 8.0000,
        };
        
        const index = buildSpatialIndex([], bbox);
        
        expect(index).toBeInstanceOf(Map);
        expect(index.size).toBe(0);
      });
    });

    describe('calculateDistance', () => {
      it('should calculate distance between coordinates', () => {
        const coord1: Coordinate = { lat: 46.5503, lng: 7.9822 };
        const coord2: Coordinate = { lat: 46.5197, lng: 7.9497 };
        
        const distance = calculateDistance(coord1, coord2);
        
        expect(distance).toBeGreaterThan(0);
        expect(distance).toBeCloseTo(4.5, 0); // Approximately 4.5km
      });

      it('should return zero for same coordinates', () => {
        const coord: Coordinate = { lat: 46.5503, lng: 7.9822 };
        
        const distance = calculateDistance(coord, coord);
        
        expect(distance).toBe(0);
      });

      it('should handle coordinates with different hemispheres', () => {
        const coord1: Coordinate = { lat: 46.5503, lng: 7.9822 };
        const coord2: Coordinate = { lat: -46.5503, lng: -7.9822 };
        
        const distance = calculateDistance(coord1, coord2);
        
        expect(distance).toBeGreaterThan(10000); // Should be very far
      });

      it('should handle edge cases near poles', () => {
        const northPole: Coordinate = { lat: 89.9, lng: 0 };
        const nearNorthPole: Coordinate = { lat: 89.8, lng: 0 };
        
        const distance = calculateDistance(northPole, nearNorthPole);
        
        expect(distance).toBeGreaterThan(0);
        expect(distance).toBeLessThan(20); // Should be relatively small
      });
    });

    describe('cachedCalculateDistance', () => {
      it('should cache distance calculations', () => {
        const coord1: Coordinate = { lat: 46.5503, lng: 7.9822 };
        const coord2: Coordinate = { lat: 46.5197, lng: 7.9497 };
        
        // Clear any existing cache
        jest.clearAllMocks();
        
        const distance1 = cachedCalculateDistance(coord1, coord2);
        const distance2 = cachedCalculateDistance(coord1, coord2);
        
        expect(distance1).toBe(distance2);
        expect(distance1).toBeGreaterThan(0);
      });

      it('should limit cache size', () => {
        // Create many different coordinate pairs to test cache size limit
        for (let i = 0; i < 1200; i++) {
          const coord1: Coordinate = { lat: 46.5 + (i * 0.0001), lng: 7.9 + (i * 0.0001) };
          const coord2: Coordinate = { lat: 46.6 + (i * 0.0001), lng: 8.0 + (i * 0.0001) };
          
          cachedCalculateDistance(coord1, coord2);
        }
        
        // Should not throw error due to cache management
        expect(() => {
          cachedCalculateDistance(
            { lat: 46.5503, lng: 7.9822 },
            { lat: 46.5197, lng: 7.9497 }
          );
        }).not.toThrow();
      });

      it('should handle coordinate precision correctly', () => {
        const coord1: Coordinate = { lat: 46.55031234, lng: 7.98221234 };
        const coord2: Coordinate = { lat: 46.55031235, lng: 7.98221235 }; // Very slightly different
        
        const distance1 = cachedCalculateDistance(coord1, coord2);
        
        // Due to rounding in cache key, these should be treated as the same
        const coord3: Coordinate = { lat: 46.55031236, lng: 7.98221236 };
        const distance2 = cachedCalculateDistance(coord1, coord3);
        
        expect(distance1).toBe(distance2); // Should use cached value
      });
    });
  });

  describe('error handling and edge cases', () => {
    it('should handle API timeout errors', async () => {
      const uniqueCoords = { lat: 59.0000, lng: 20.0000 };
      
      mockFetch.mockImplementationOnce(() => 
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Request timeout')), 100)
        )
      );

      const result = await fetchTrailData(uniqueCoords, { lat: 59.0100, lng: 20.0100 });

      expect(result.trails).toHaveLength(0);
      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('❌ Error fetching trail data'),
        expect.any(Error)
      );
    });

    it('should handle malformed OSM elements', async () => {
      const uniqueCoords = { lat: 60.0000, lng: 21.0000 };
      
      const malformedResponse = {
        elements: [
          { type: 'node', id: 1 }, // Wrong type
          { type: 'way', id: 2 }, // Missing geometry
          {
            type: 'way',
            id: 3,
            geometry: null, // Null geometry
          },
          {
            type: 'way',
            id: 4,
            geometry: [{ lat: 'invalid', lon: 'invalid' }], // Invalid coordinates
          },
        ],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => malformedResponse,
      });

      const result = await fetchTrailData(uniqueCoords, { lat: 60.0100, lng: 21.0100 });

      expect(result.trails).toHaveLength(0);
    });

    it('should handle API rate limiting with retry logic', async () => {
      const uniqueCoords = { lat: 61.0000, lng: 22.0000 };
      
      // First call returns rate limit error
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 429,
        statusText: 'Too Many Requests',
      });

      const result = await fetchTrailData(uniqueCoords, { lat: 61.0100, lng: 22.0100 });

      expect(result.trails).toHaveLength(0);
      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('❌ Error fetching trail data'),
        expect.any(Error)
      );
    });

    it('should handle coordinates at international date line', () => {
      const bbox = calculateBoundingBox(
        { lat: 60.0, lng: 179.5 },
        { lat: 61.0, lng: -179.5 }
      );
      
      // Should handle longitude wrapping correctly
      expect(bbox.minLng).toBeLessThan(bbox.maxLng);
      expect(bbox.minLat).toBeLessThan(bbox.maxLat);
    });

    it('should handle very large trail networks', async () => {
      const uniqueCoords = { lat: 62.0000, lng: 23.0000 };
      
      // Test with a response that would exceed the 5000 trail limit
      const largeResponse = {
        elements: Array.from({ length: 6000 }, (_, i) => ({
          type: 'way',
          id: i + 1,
          tags: { highway: 'path' },
          geometry: [
            { lat: 62.0000 + (i * 0.00001), lon: 23.0000 + (i * 0.00001) },
            { lat: 62.0001 + (i * 0.00001), lon: 23.0001 + (i * 0.00001) },
          ],
        })),
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => largeResponse,
      });

      const result = await fetchTrailData(uniqueCoords, { lat: 62.0100, lng: 23.0100 });

      expect(result.trails.length).toBeLessThanOrEqual(5000);
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('⚠️ Trail limit reached')
      );
    });

    it('should handle waterway and road classification correctly', async () => {
      const uniqueCoords = { lat: 51.0000, lng: 12.0000 };
      
      const mixedResponse = {
        elements: [
          {
            type: 'way',
            id: 1,
            tags: { waterway: 'river' },
            geometry: [
              { lat: 51.0000, lon: 12.0000 },
              { lat: 51.0010, lon: 12.0010 },
            ],
          },
          {
            type: 'way',
            id: 2,
            tags: { highway: 'primary' },
            geometry: [
              { lat: 51.0020, lon: 12.0020 },
              { lat: 51.0030, lon: 12.0030 },
            ],
          },
          {
            type: 'way',
            id: 3,
            tags: { highway: 'path' },
            geometry: [
              { lat: 51.0040, lon: 12.0040 },
              { lat: 51.0050, lon: 12.0050 },
            ],
          },
        ],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mixedResponse,
      });

      const result = await fetchTrailData(uniqueCoords, { lat: 51.0100, lng: 12.0100 });

      const waterFeature = result.trails.find(t => t.id === '1');
      const roadFeature = result.trails.find(t => t.id === '2');
      const pathFeature = result.trails.find(t => t.id === '3');

      expect(waterFeature?.isWater).toBe(true);
      expect(roadFeature?.isRoad).toBe(true);
      expect(pathFeature?.isWater).toBeFalsy();
      expect(pathFeature?.isRoad).toBeFalsy();
    });
  });
});