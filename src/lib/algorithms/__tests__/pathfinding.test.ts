import { findOptimalRoute } from '../pathfinding';
import { Coordinate, RoutePoint } from '@/types/route';
import { PathfindingOptions, DEFAULT_PATHFINDING_OPTIONS } from '@/types/pathfinding';
import { getElevationForRoute, getElevation } from '@/lib/api/elevation';
import { fetchTrailData } from '@/lib/api/trails';
import { findDirectTrailPath } from '../pathfinding/trail-detection';
import { optimizeRouteWithTrails, calculateHeuristic, calculateMovementCost, generateNeighbors, reconstructPath } from '../pathfinding/utilities';

jest.mock('@/lib/api/elevation');
jest.mock('@/lib/api/trails');
jest.mock('../pathfinding/trail-detection');
jest.mock('../pathfinding/utilities', () => ({
  ...jest.requireActual('../pathfinding/utilities'),
  optimizeRouteWithTrails: jest.fn(),
  calculateHeuristic: jest.fn(),
  calculateMovementCost: jest.fn(),
  generateNeighbors: jest.fn(),
  reconstructPath: jest.fn()
}));

const mockGetElevationForRoute = getElevationForRoute as jest.MockedFunction<typeof getElevationForRoute>;
const mockGetElevation = getElevation as jest.MockedFunction<typeof getElevation>;
const mockFetchTrailData = fetchTrailData as jest.MockedFunction<typeof fetchTrailData>;
const mockFindDirectTrailPath = findDirectTrailPath as jest.MockedFunction<typeof findDirectTrailPath>;
const mockOptimizeRouteWithTrails = optimizeRouteWithTrails as jest.MockedFunction<typeof optimizeRouteWithTrails>;
const mockCalculateHeuristic = calculateHeuristic as jest.MockedFunction<typeof calculateHeuristic>;
const mockCalculateMovementCost = calculateMovementCost as jest.MockedFunction<typeof calculateMovementCost>;
const mockGenerateNeighbors = generateNeighbors as jest.MockedFunction<typeof generateNeighbors>;
const mockReconstructPath = reconstructPath as jest.MockedFunction<typeof reconstructPath>;

describe('findOptimalRoute', () => {
  const startCoord: Coordinate = { lat: 47.6062, lng: -122.3321 };
  const endCoord: Coordinate = { lat: 47.6205, lng: -122.3493 };
  
  // Long distance coordinates (> 5km) for testing full pathfinding logic
  const longStartCoord: Coordinate = { lat: 47.6062, lng: -122.3321 };
  const longEndCoord: Coordinate = { lat: 47.7062, lng: -122.4321 };

  const mockElevationPoints: RoutePoint[] = [
    { lat: 47.6062, lng: -122.3321, elevation: 100 },
    { lat: 47.6134, lng: -122.3407, elevation: 150 },
    { lat: 47.6205, lng: -122.3493, elevation: 200 }
  ];

  const mockTrailNetwork = {
    trails: [
      {
        id: 'trail1',
        coordinates: [startCoord, endCoord],
        type: 'hiking'
      }
    ]
  };

  beforeEach(() => {
    jest.clearAllMocks();
    console.log = jest.fn();
    console.warn = jest.fn();
    console.error = jest.fn();
    
    mockCalculateHeuristic.mockReturnValue(10);
    mockCalculateMovementCost.mockReturnValue(5);
    mockGenerateNeighbors.mockReturnValue([]);
    mockReconstructPath.mockReturnValue(mockElevationPoints);
  });

  describe('successful pathfinding', () => {
    it('should use direct path for short distances (< 5km)', async () => {
      const elevations = [100, 150, 200, 180, 190, 200, 185, 175, 165, 155, 145, 135, 125, 115, 105, 95, 85, 75, 65, 55, 45];

      mockGetElevation.mockResolvedValue(elevations);

      const result = await findOptimalRoute(startCoord, endCoord);

      expect(result.length).toBeGreaterThan(1);
      expect(result[0].lat).toBe(startCoord.lat);
      expect(result[0].lng).toBe(startCoord.lng);
      expect(result[result.length - 1].lat).toBe(endCoord.lat);
      expect(result[result.length - 1].lng).toBe(endCoord.lng);
      expect(mockGetElevation).toHaveBeenCalled();
      // For short distances, getElevationForRoute and fetchTrailData should NOT be called
      expect(mockGetElevationForRoute).not.toHaveBeenCalled();
      expect(mockFetchTrailData).not.toHaveBeenCalled();
    });

    it('should return direct trail path when available for long distances', async () => {
      const directPath = [longStartCoord, { lat: 47.6534, lng: -122.3807 }, longEndCoord];
      const elevations = [100, 150, 200];

      mockGetElevationForRoute.mockResolvedValue(mockElevationPoints);
      mockFetchTrailData.mockResolvedValue(mockTrailNetwork);
      mockFindDirectTrailPath.mockReturnValue(directPath);
      mockGetElevation.mockResolvedValue(elevations);

      const result = await findOptimalRoute(longStartCoord, longEndCoord);

      expect(result).toHaveLength(3);
      expect(result[0]).toEqual({ ...directPath[0], elevation: 100 });
      expect(result[2]).toEqual({ ...directPath[2], elevation: 200 });
      expect(mockFindDirectTrailPath).toHaveBeenCalledWith(longStartCoord, longEndCoord, mockTrailNetwork.trails);
    });

    it('should fall back to A* pathfinding when no direct trail path for long distances', async () => {
      mockGetElevationForRoute.mockResolvedValue(mockElevationPoints);
      mockFetchTrailData.mockResolvedValue(mockTrailNetwork);
      mockFindDirectTrailPath.mockReturnValue(null);
      mockGenerateNeighbors.mockReturnValue([longEndCoord]);

      const result = await findOptimalRoute(longStartCoord, longEndCoord);

      expect(mockGetElevationForRoute).toHaveBeenCalledWith(longStartCoord, longEndCoord, 0.005);
      expect(mockFetchTrailData).toHaveBeenCalledWith(longStartCoord, longEndCoord);
      expect(result).toBeDefined();
      expect(result).toEqual(mockElevationPoints);
    });

    it('should use custom pathfinding options for long distances', async () => {
      const customOptions: PathfindingOptions = {
        ...DEFAULT_PATHFINDING_OPTIONS,
        maxIterations: 500,
        trailPreference: 0.8
      };

      mockGetElevationForRoute.mockResolvedValue(mockElevationPoints);
      mockFetchTrailData.mockResolvedValue(mockTrailNetwork);
      mockFindDirectTrailPath.mockReturnValue(null);

      await findOptimalRoute(longStartCoord, longEndCoord, customOptions);

      expect(mockGetElevationForRoute).toHaveBeenCalled();
      expect(mockFetchTrailData).toHaveBeenCalled();
    });
  });

  describe('error handling', () => {
    it('should handle elevation data fetch failure for long distances', async () => {
      mockGetElevationForRoute
        .mockRejectedValueOnce(new Error('Elevation API error'))
        .mockResolvedValueOnce(mockElevationPoints);
      mockFetchTrailData.mockResolvedValue(mockTrailNetwork);
      mockOptimizeRouteWithTrails.mockResolvedValue(mockElevationPoints);

      const result = await findOptimalRoute(longStartCoord, longEndCoord);

      expect(mockOptimizeRouteWithTrails).toHaveBeenCalled();
      expect(result).toEqual(mockElevationPoints);
    });

    it('should handle trail data fetch failure for long distances', async () => {
      mockGetElevationForRoute.mockResolvedValue(mockElevationPoints);
      mockFetchTrailData.mockRejectedValue(new Error('Trail API error'));

      const result = await findOptimalRoute(longStartCoord, longEndCoord);

      expect(result).toBeDefined();
    });

    it('should handle direct path elevation fetch failure for short distances', async () => {
      mockGetElevation.mockRejectedValue(new Error('Elevation fetch failed'));
      mockGetElevationForRoute.mockResolvedValue(mockElevationPoints);
      mockFetchTrailData.mockRejectedValue(new Error('Trail API error'));

      const result = await findOptimalRoute(startCoord, endCoord);

      expect(result.length).toBeGreaterThan(1);
      expect(result[0]).toEqual({ lat: 47.6062, lng: -122.3321, elevation: 100 });
    });

    it('should return basic route when all fallbacks fail for long distances', async () => {
      mockGetElevationForRoute
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce(mockElevationPoints);
      mockFetchTrailData.mockRejectedValue(new Error('Trail API error'));

      const result = await findOptimalRoute(longStartCoord, longEndCoord);

      expect(result.length).toBeGreaterThanOrEqual(3);
      expect(result[0]).toEqual({ lat: 47.6062, lng: -122.3321, elevation: 100 });
    });

    it('should handle direct path elevation fetch failure for long distances', async () => {
      const directPath = [longStartCoord, longEndCoord, { lat: 47.6534, lng: -122.3807 }];

      mockGetElevationForRoute.mockResolvedValue(mockElevationPoints);
      mockFetchTrailData.mockResolvedValue(mockTrailNetwork);
      mockFindDirectTrailPath.mockReturnValue(directPath);
      mockGetElevation.mockRejectedValue(new Error('Elevation fetch failed'));
      mockGenerateNeighbors.mockReturnValue([longEndCoord]);

      const result = await findOptimalRoute(longStartCoord, longEndCoord);

      expect(result).toBeDefined();
    });
  });

  describe('performance and optimization', () => {
    it('should handle empty elevation points for long distances', async () => {
      mockGetElevationForRoute
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce(mockElevationPoints);
      mockFetchTrailData.mockResolvedValue(mockTrailNetwork);
      mockOptimizeRouteWithTrails.mockResolvedValue(mockElevationPoints);

      const result = await findOptimalRoute(longStartCoord, longEndCoord);

      expect(result).toEqual(mockElevationPoints);
    });

    it('should use trail optimization for fallback routes for long distances', async () => {
      mockGetElevationForRoute.mockResolvedValue([]);
      mockFetchTrailData.mockResolvedValue(mockTrailNetwork);
      mockFindDirectTrailPath.mockReturnValue(null);
      mockOptimizeRouteWithTrails.mockResolvedValue(mockElevationPoints);

      await findOptimalRoute(longStartCoord, longEndCoord, {
        ...DEFAULT_PATHFINDING_OPTIONS,
        maxIterations: 1
      });

      expect(mockOptimizeRouteWithTrails).toHaveBeenCalledWith(
        [],
        mockTrailNetwork.trails,
        expect.any(Object)
      );
    });
  });

  describe('data validation', () => {
    it('should handle coordinates with different precision for long distances', async () => {
      const preciseStart = { lat: 47.606200001, lng: -122.332100001 };
      const preciseEnd = { lat: 47.706200001, lng: -122.432100001 };

      mockGetElevationForRoute.mockResolvedValue(mockElevationPoints);
      mockFetchTrailData.mockResolvedValue(mockTrailNetwork);
      mockFindDirectTrailPath.mockReturnValue(null);

      const result = await findOptimalRoute(preciseStart, preciseEnd);

      expect(mockGetElevationForRoute).toHaveBeenCalledWith(preciseStart, preciseEnd, 0.005);
      expect(result).toBeDefined();
    });
  });
});