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
    it('should return direct trail path when available', async () => {
      const directPath = [startCoord, { lat: 47.6134, lng: -122.3407 }, endCoord];
      const elevations = [100, 150, 200];

      mockGetElevationForRoute.mockResolvedValue(mockElevationPoints);
      mockFetchTrailData.mockResolvedValue(mockTrailNetwork);
      mockFindDirectTrailPath.mockReturnValue(directPath);
      mockGetElevation.mockResolvedValue(elevations);

      const result = await findOptimalRoute(startCoord, endCoord);

      expect(result).toHaveLength(3);
      expect(result[0]).toEqual({ ...startCoord, elevation: 100 });
      expect(result[2]).toEqual({ ...endCoord, elevation: 200 });
      expect(mockFindDirectTrailPath).toHaveBeenCalledWith(startCoord, endCoord, mockTrailNetwork.trails);
    });

    it('should fall back to A* pathfinding when no direct trail path', async () => {
      mockGetElevationForRoute.mockResolvedValue(mockElevationPoints);
      mockFetchTrailData.mockResolvedValue(mockTrailNetwork);
      mockFindDirectTrailPath.mockReturnValue(null);
      mockGenerateNeighbors.mockReturnValue([endCoord]);

      const result = await findOptimalRoute(startCoord, endCoord);

      expect(mockGetElevationForRoute).toHaveBeenCalledWith(startCoord, endCoord, 0.005);
      expect(mockFetchTrailData).toHaveBeenCalledWith(startCoord, endCoord);
      expect(result).toBeDefined();
      expect(result).toEqual(mockElevationPoints);
    });

    it('should use custom pathfinding options', async () => {
      const customOptions: PathfindingOptions = {
        ...DEFAULT_PATHFINDING_OPTIONS,
        maxIterations: 500,
        trailPreference: 0.8
      };

      mockGetElevationForRoute.mockResolvedValue(mockElevationPoints);
      mockFetchTrailData.mockResolvedValue(mockTrailNetwork);
      mockFindDirectTrailPath.mockReturnValue(null);

      await findOptimalRoute(startCoord, endCoord, customOptions);

      expect(mockGetElevationForRoute).toHaveBeenCalled();
      expect(mockFetchTrailData).toHaveBeenCalled();
    });
  });

  describe('error handling', () => {
    it('should handle elevation data fetch failure', async () => {
      mockGetElevationForRoute
        .mockRejectedValueOnce(new Error('Elevation API error'))
        .mockResolvedValueOnce(mockElevationPoints);
      mockFetchTrailData.mockResolvedValue(mockTrailNetwork);
      mockOptimizeRouteWithTrails.mockResolvedValue(mockElevationPoints);

      const result = await findOptimalRoute(startCoord, endCoord);

      expect(mockOptimizeRouteWithTrails).toHaveBeenCalled();
      expect(result).toEqual(mockElevationPoints);
    });

    it('should handle trail data fetch failure', async () => {
      mockGetElevationForRoute.mockResolvedValue(mockElevationPoints);
      mockFetchTrailData.mockRejectedValue(new Error('Trail API error'));

      const result = await findOptimalRoute(startCoord, endCoord);

      expect(result).toBeDefined();
    });

    it('should return basic route when all fallbacks fail', async () => {
      mockGetElevationForRoute
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce(mockElevationPoints);
      mockFetchTrailData.mockRejectedValue(new Error('Trail API error'));

      const result = await findOptimalRoute(startCoord, endCoord);

      expect(result).toHaveLength(3);
      expect(result[0]).toEqual({ lat: 47.6062, lng: -122.3321, elevation: 100 });
    });

    it('should handle direct path elevation fetch failure', async () => {
      const directPath = [startCoord, endCoord, { lat: 47.6134, lng: -122.3407 }];

      mockGetElevationForRoute.mockResolvedValue(mockElevationPoints);
      mockFetchTrailData.mockResolvedValue(mockTrailNetwork);
      mockFindDirectTrailPath.mockReturnValue(directPath);
      mockGetElevation.mockRejectedValue(new Error('Elevation fetch failed'));
      mockGenerateNeighbors.mockReturnValue([endCoord]);

      const result = await findOptimalRoute(startCoord, endCoord);

      expect(result).toBeDefined();
    });
  });

  describe('performance and optimization', () => {
    it('should handle empty elevation points', async () => {
      mockGetElevationForRoute
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce(mockElevationPoints);
      mockFetchTrailData.mockResolvedValue(mockTrailNetwork);
      mockOptimizeRouteWithTrails.mockResolvedValue(mockElevationPoints);

      const result = await findOptimalRoute(startCoord, endCoord);

      expect(result).toEqual(mockElevationPoints);
    });

    it('should use trail optimization for fallback routes', async () => {
      mockGetElevationForRoute.mockResolvedValue(mockElevationPoints);
      mockFetchTrailData.mockResolvedValue(mockTrailNetwork);
      mockFindDirectTrailPath.mockReturnValue(null);
      mockOptimizeRouteWithTrails.mockResolvedValue(mockElevationPoints);

      await findOptimalRoute(startCoord, endCoord, {
        ...DEFAULT_PATHFINDING_OPTIONS,
        maxIterations: 1
      });

      expect(mockOptimizeRouteWithTrails).toHaveBeenCalledWith(
        mockElevationPoints,
        mockTrailNetwork.trails,
        expect.any(Object)
      );
    });
  });

  describe('data validation', () => {
    it('should handle coordinates with different precision', async () => {
      const preciseStart = { lat: 47.606200001, lng: -122.332100001 };
      const preciseEnd = { lat: 47.620500001, lng: -122.349300001 };

      mockGetElevationForRoute.mockResolvedValue(mockElevationPoints);
      mockFetchTrailData.mockResolvedValue(mockTrailNetwork);
      mockFindDirectTrailPath.mockReturnValue(null);

      const result = await findOptimalRoute(preciseStart, preciseEnd);

      expect(mockGetElevationForRoute).toHaveBeenCalledWith(preciseStart, preciseEnd, 0.005);
      expect(result).toBeDefined();
    });
  });
});