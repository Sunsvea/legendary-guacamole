/**
 * Comprehensive unit tests for pathfinding utilities
 * Tests core A* algorithm functions including heuristics, movement costs, 
 * neighbor generation, path reconstruction, and trail optimization
 */

import {
  calculateHeuristic,
  calculateMovementCost,
  calculateAdaptiveStepSize,
  generateNeighbors,
  reconstructPath,
  optimizeRouteWithTrails,
  PATHFINDING_CONSTANTS,
  STEP_SIZE_CONSTANTS
} from '../utilities';

import { Coordinate, RoutePoint, PathfindingNode } from '@/types/route';
import { PathfindingOptions, DEFAULT_PATHFINDING_OPTIONS } from '@/types/pathfinding';
import { TrailSegment, TrailNetwork } from '@/lib/api/trails';

// Mock external dependencies
jest.mock('@/lib/utils', () => ({
  calculateDistance: jest.fn((from: Coordinate, to: Coordinate) => {
    // Haversine formula mock - simplified for testing
    const dLat = (to.lat - from.lat) * Math.PI / 180;
    const dLng = (to.lng - from.lng) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(from.lat * Math.PI / 180) * Math.cos(to.lat * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return 6371 * c; // Earth radius in km
  })
}));

jest.mock('@/lib/api/trails', () => ({
  isOnTrail: jest.fn((coord: Coordinate, trails: TrailSegment[], radius: number) => {
    return trails.some(trail => 
      trail.coordinates.some(tc => 
        Math.abs(tc.lat - coord.lat) < 0.001 && Math.abs(tc.lng - coord.lng) < 0.001
      )
    );
  }),
  findNearestTrailPoint: jest.fn((coord: Coordinate, trails: TrailSegment[], maxDistance: number) => {
    const closest = trails.reduce((best: any, trail) => {
      const closestPoint = trail.coordinates.reduce((closest, tc) => {
        const dist = Math.abs(tc.lat - coord.lat) + Math.abs(tc.lng - coord.lng);
        return dist < closest.distance ? { point: tc, distance: dist } : closest;
      }, { point: trail.coordinates[0], distance: Infinity });
      
      return closestPoint.distance < best.distance ? closestPoint : best;
    }, { point: null, distance: Infinity });
    
    return closest.distance < maxDistance ? closest : null;
  }),
  getTrailsNearCoordinate: jest.fn((coord: Coordinate, spatialIndex: any, bbox: any) => {
    return []; // Default empty for spatial index tests
  })
}));

jest.mock('@/lib/algorithms/pathfinding/terrain/terrain-analyzer', () => ({
  calculateSlope: jest.fn((elevDiff: number, distance: number) => elevDiff / (distance * 1000)),
  calculateHikingSpeed: jest.fn((slope: number) => 6 * Math.exp(-3.5 * Math.abs(slope + 0.05))),
  calculateSlopeVariability: jest.fn((slope: number) => Math.min(Math.abs(slope) * 2, 0.5)),
  detectTerrainType: jest.fn(() => 'vegetation'),
  calculateTerrainComplexity: jest.fn(() => 0.5),
  TERRAIN_MULTIPLIERS: { vegetation: 1.0, trail: 0.8, rock: 1.3, scree: 1.8, unknown: 1.1 },
  SLOPE_THRESHOLDS: { DANGEROUS: 100, VERY_STEEP_GRADE: 58 },
  CONVERSION_CONSTANTS: { NEARBY_POINT_THRESHOLD: 0.01 }
}));

jest.mock('@/lib/api/elevation', () => ({
  getElevationForRoute: jest.fn(() => Promise.resolve([
    { lat: 47.0000, lng: 8.0000, elevation: 1000 },
    { lat: 47.0010, lng: 8.0010, elevation: 1100 },
    { lat: 47.0020, lng: 8.0020, elevation: 1200 }
  ]))
}));

describe('calculateHeuristic', () => {
  const mockCalculateDistance = require('@/lib/utils').calculateDistance;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('calculates heuristic cost correctly with basic coordinates', () => {
    const start: Coordinate = { lat: 47.0000, lng: 8.0000, elevation: 1000 };
    const goal: Coordinate = { lat: 47.0010, lng: 8.0010, elevation: 1200 };
    
    mockCalculateDistance.mockReturnValue(1.0); // 1km distance
    
    const heuristic = calculateHeuristic(start, goal);
    const expectedElevationPenalty = 1000 * PATHFINDING_CONSTANTS.ELEVATION_PENALTY_FACTOR;
    const expectedHeuristic = 1.0 + expectedElevationPenalty;
    
    expect(heuristic).toBe(expectedHeuristic);
    expect(mockCalculateDistance).toHaveBeenCalledWith(start, goal);
  });

  it('handles coordinates without elevation', () => {
    const start: Coordinate = { lat: 47.0000, lng: 8.0000 };
    const goal: Coordinate = { lat: 47.0010, lng: 8.0010 };
    
    mockCalculateDistance.mockReturnValue(0.5);
    
    const heuristic = calculateHeuristic(start, goal);
    
    expect(heuristic).toBe(0.5); // Only distance, no elevation penalty
  });

  it('includes elevation penalty in calculation', () => {
    const highElevation: Coordinate = { lat: 47.0000, lng: 8.0000, elevation: 3000 };
    const goal: Coordinate = { lat: 47.0010, lng: 8.0010 };
    
    mockCalculateDistance.mockReturnValue(1.0);
    
    const heuristic = calculateHeuristic(highElevation, goal);
    const expectedPenalty = 3000 * PATHFINDING_CONSTANTS.ELEVATION_PENALTY_FACTOR;
    
    expect(heuristic).toBe(1.0 + expectedPenalty);
  });
});

describe('calculateMovementCost', () => {
  const mockCalculateDistance = require('@/lib/utils').calculateDistance;
  const mockCalculateSlope = require('@/lib/algorithms/pathfinding/terrain/terrain-analyzer').calculateSlope;
  const mockCalculateHikingSpeed = require('@/lib/algorithms/pathfinding/terrain/terrain-analyzer').calculateHikingSpeed;

  beforeEach(() => {
    jest.clearAllMocks();
    mockCalculateDistance.mockReturnValue(1.0); // Default 1km distance
    mockCalculateSlope.mockReturnValue(0.1); // Default 10% slope
    mockCalculateHikingSpeed.mockReturnValue(4.0); // Default 4 km/h speed
  });

  it('calculates basic movement cost without trails', () => {
    const from: Coordinate = { lat: 47.0000, lng: 8.0000, elevation: 1000 };
    const to: Coordinate = { lat: 47.0010, lng: 8.0010, elevation: 1100 };
    
    const cost = calculateMovementCost(from, to);
    
    const expectedTimeCost = 1.0 / 4.0; // 1km / 4km/h = 0.25 hours
    const expectedCost = expectedTimeCost * PATHFINDING_CONSTANTS.TIME_COST_SCALE_FACTOR;
    
    expect(cost).toBeCloseTo(expectedCost * 1.0 * DEFAULT_PATHFINDING_OPTIONS.offTrailPenalty, 2); // Including terrain multiplier and off-trail penalty
  });

  it('returns zero cost for zero distance', () => {
    const coord: Coordinate = { lat: 47.0000, lng: 8.0000, elevation: 1000 };
    
    mockCalculateDistance.mockReturnValue(0);
    
    const cost = calculateMovementCost(coord, coord);
    
    expect(cost).toBe(0);
  });

  it('applies trail bonus when on trail', () => {
    const from: Coordinate = { lat: 47.0000, lng: 8.0000, elevation: 1000 };
    const to: Coordinate = { lat: 47.0010, lng: 8.0010, elevation: 1100 };
    
    const trailSegment: TrailSegment = {
      id: 'trail1',
      coordinates: [from, to],
      isWater: false,
      isRoad: false
    };
    
    const trailNetwork: TrailNetwork = {
      trails: [trailSegment],
      bbox: { minLat: 46.9, maxLat: 47.1, minLng: 7.9, maxLng: 8.1 },
      cacheTime: Date.now()
    };
    
    const mockIsOnTrail = require('@/lib/api/trails').isOnTrail;
    mockIsOnTrail.mockReturnValue(true);
    
    const cost = calculateMovementCost(from, to, trailNetwork);
    
    // Should apply trail bonus
    expect(mockIsOnTrail).toHaveBeenCalled();
    expect(cost).toBeLessThan(calculateMovementCost(from, to)); // Should be less than off-trail cost
  });

  it('applies road bonus when on road', () => {
    const from: Coordinate = { lat: 47.0000, lng: 8.0000, elevation: 1000 };
    const to: Coordinate = { lat: 47.0010, lng: 8.0010, elevation: 1100 };
    
    const roadSegment: TrailSegment = {
      id: 'road1',
      coordinates: [from, to],
      isWater: false,
      isRoad: true
    };
    
    const trailNetwork: TrailNetwork = {
      trails: [roadSegment],
      bbox: { minLat: 46.9, maxLat: 47.1, minLng: 7.9, maxLng: 8.1 },
      cacheTime: Date.now()
    };
    
    const mockIsOnTrail = require('@/lib/api/trails').isOnTrail;
    mockIsOnTrail.mockReturnValue(true);
    
    const cost = calculateMovementCost(from, to, trailNetwork);
    
    expect(cost).toBeLessThan(calculateMovementCost(from, to)); // Should be less than off-trail cost
  });

  it('applies dangerous slope penalty', () => {
    const from: Coordinate = { lat: 47.0000, lng: 8.0000, elevation: 1000 };
    const to: Coordinate = { lat: 47.0010, lng: 8.0010, elevation: 2000 }; // 1000m elevation gain
    
    // First calculate normal cost
    mockCalculateSlope.mockReturnValue(0.05); // 5% slope - normal
    const normalCost = calculateMovementCost(
      { lat: 47.0000, lng: 8.0000, elevation: 1000 },
      { lat: 47.0010, lng: 8.0010, elevation: 1050 }
    );
    
    // Then calculate dangerous slope cost
    mockCalculateSlope.mockReturnValue(1.5); // 150% slope - very dangerous
    const cost = calculateMovementCost(from, to);
    
    expect(cost).toBeGreaterThan(normalCost);
  });

  it('uses custom pathfinding options', () => {
    const from: Coordinate = { lat: 47.0000, lng: 8.0000, elevation: 1000 };
    const to: Coordinate = { lat: 47.0010, lng: 8.0010, elevation: 1100 };
    
    const customOptions: PathfindingOptions = {
      ...DEFAULT_PATHFINDING_OPTIONS,
      offTrailPenalty: 5.0,
      trailBonus: 0.1
    };
    
    const cost = calculateMovementCost(from, to, undefined, customOptions);
    const defaultCost = calculateMovementCost(from, to);
    
    expect(cost).toBeGreaterThan(defaultCost); // Higher off-trail penalty
  });
});

describe('calculateAdaptiveStepSize', () => {
  it('calculates base step size for normal conditions', () => {
    const stepSize = calculateAdaptiveStepSize(1000, 0.3); // 1000m elevation, 30% complexity
    
    expect(stepSize).toBeGreaterThan(STEP_SIZE_CONSTANTS.MIN_STEP_SIZE);
    expect(stepSize).toBeLessThan(STEP_SIZE_CONSTANTS.MAX_STEP_SIZE);
  });

  it('reduces step size for high terrain complexity', () => {
    const normalComplexity = calculateAdaptiveStepSize(1000, 0.3);
    const highComplexity = calculateAdaptiveStepSize(1000, 0.8);
    
    expect(highComplexity).toBeLessThan(normalComplexity);
  });

  it('reduces step size for high elevation', () => {
    const lowElevation = calculateAdaptiveStepSize(500, 0.3);
    const highElevation = calculateAdaptiveStepSize(3000, 0.3);
    
    expect(highElevation).toBeLessThan(lowElevation);
  });

  it('enforces minimum step size', () => {
    const stepSize = calculateAdaptiveStepSize(8000, 1.0); // Extreme conditions
    
    expect(stepSize).toBeGreaterThanOrEqual(STEP_SIZE_CONSTANTS.MIN_STEP_SIZE);
  });

  it('enforces maximum step size', () => {
    const stepSize = calculateAdaptiveStepSize(0, 0.0); // Ideal conditions
    
    expect(stepSize).toBeLessThanOrEqual(STEP_SIZE_CONSTANTS.MAX_STEP_SIZE);
  });
});

describe('generateNeighbors', () => {
  const mockCalculateTerrainComplexity = require('@/lib/algorithms/pathfinding/terrain/terrain-analyzer').calculateTerrainComplexity;

  beforeEach(() => {
    mockCalculateTerrainComplexity.mockReturnValue(0.5);
  });

  it('generates 8 neighbors for basic coordinate', () => {
    const current: Coordinate = { lat: 47.0000, lng: 8.0000, elevation: 1000 };
    
    const neighbors = generateNeighbors(current);
    
    expect(neighbors).toHaveLength(8);
    
    // Check that all neighbors are around the current coordinate
    neighbors.forEach(neighbor => {
      expect(Math.abs(neighbor.lat - current.lat)).toBeLessThan(0.1);
      expect(Math.abs(neighbor.lng - current.lng)).toBeLessThan(0.1);
      expect(neighbor.elevation).toBe(current.elevation);
    });
  });

  it('uses terrain complexity for step size calculation', () => {
    const current: Coordinate = { lat: 47.0000, lng: 8.0000, elevation: 1000 };
    const elevationPoints: Coordinate[] = [
      { lat: 46.999, lng: 7.999, elevation: 1000 },
      { lat: 47.001, lng: 8.001, elevation: 1200 }
    ];
    
    generateNeighbors(current, elevationPoints);
    
    expect(mockCalculateTerrainComplexity).toHaveBeenCalledWith({
      coordinate: current,
      elevationPoints,
      analysisRadius: expect.any(Number)
    });
  });

  it('generates different step sizes based on complexity', () => {
    const current: Coordinate = { lat: 47.0000, lng: 8.0000, elevation: 1000 };
    
    // Low complexity
    mockCalculateTerrainComplexity.mockReturnValue(0.1);
    const lowComplexityNeighbors = generateNeighbors(current);
    
    // High complexity  
    mockCalculateTerrainComplexity.mockReturnValue(0.9);
    const highComplexityNeighbors = generateNeighbors(current);
    
    // High complexity should have smaller step sizes (neighbors closer to center)
    const lowAvgDistance = lowComplexityNeighbors.reduce((sum, neighbor) => 
      sum + Math.abs(neighbor.lat - current.lat), 0) / lowComplexityNeighbors.length;
    
    const highAvgDistance = highComplexityNeighbors.reduce((sum, neighbor) => 
      sum + Math.abs(neighbor.lat - current.lat), 0) / highComplexityNeighbors.length;
    
    expect(highAvgDistance).toBeLessThan(lowAvgDistance);
  });

  it('includes diagonal neighbors', () => {
    const current: Coordinate = { lat: 47.0000, lng: 8.0000, elevation: 1000 };
    
    const neighbors = generateNeighbors(current);
    
    // Should have 4 cardinal directions + 4 diagonal directions
    const cardinalCount = neighbors.filter(n => 
      (n.lat === current.lat && n.lng !== current.lng) ||
      (n.lat !== current.lat && n.lng === current.lng)
    ).length;
    
    const diagonalCount = neighbors.filter(n => 
      n.lat !== current.lat && n.lng !== current.lng
    ).length;
    
    expect(cardinalCount).toBe(4);
    expect(diagonalCount).toBe(4);
  });
});

describe('reconstructPath', () => {
  it('reconstructs simple path correctly', () => {
    // Build a simple path: A -> B -> C
    const nodeA: PathfindingNode = {
      coordinate: { lat: 47.0000, lng: 8.0000, elevation: 1000 },
      gCost: 0,
      hCost: 2,
      fCost: 2
    };
    
    const nodeB: PathfindingNode = {
      coordinate: { lat: 47.0005, lng: 8.0005, elevation: 1050 },
      gCost: 1,
      hCost: 1,
      fCost: 2,
      parent: nodeA
    };
    
    const nodeC: PathfindingNode = {
      coordinate: { lat: 47.0010, lng: 8.0010, elevation: 1100 },
      gCost: 2,
      hCost: 0,
      fCost: 2,
      parent: nodeB
    };
    
    const path = reconstructPath(nodeC);
    
    expect(path).toHaveLength(3);
    expect(path[0]).toEqual({
      lat: nodeA.coordinate.lat,
      lng: nodeA.coordinate.lng,
      elevation: nodeA.coordinate.elevation
    });
    expect(path[1]).toEqual({
      lat: nodeB.coordinate.lat,
      lng: nodeB.coordinate.lng,
      elevation: nodeB.coordinate.elevation
    });
    expect(path[2]).toEqual({
      lat: nodeC.coordinate.lat,
      lng: nodeC.coordinate.lng,
      elevation: nodeC.coordinate.elevation
    });
  });

  it('handles single node path', () => {
    const singleNode: PathfindingNode = {
      coordinate: { lat: 47.0000, lng: 8.0000, elevation: 1000 },
      gCost: 0,
      hCost: 0,
      fCost: 0
    };
    
    const path = reconstructPath(singleNode);
    
    expect(path).toHaveLength(1);
    expect(path[0].elevation).toBe(1000);
  });

  it('handles coordinate without elevation', () => {
    const node: PathfindingNode = {
      coordinate: { lat: 47.0000, lng: 8.0000 },
      gCost: 0,
      hCost: 0,
      fCost: 0
    };
    
    const path = reconstructPath(node);
    
    expect(path).toHaveLength(1);
    expect(path[0].elevation).toBe(0); // Should default to 0
  });
});

describe('optimizeRouteWithTrails', () => {
  const mockGetElevationForRoute = require('@/lib/api/elevation').getElevationForRoute;
  const mockFindNearestTrailPoint = require('@/lib/api/trails').findNearestTrailPoint;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default elevation data
    mockGetElevationForRoute.mockResolvedValue([
      { lat: 47.0000, lng: 8.0000, elevation: 1000 },
      { lat: 47.0010, lng: 8.0010, elevation: 1100 },
      { lat: 47.0020, lng: 8.0020, elevation: 1200 }
    ]);
  });

  it('optimizes route by snapping to nearby trails', async () => {
    const points: Coordinate[] = [
      { lat: 47.0000, lng: 8.0000, elevation: 1000 },
      { lat: 47.0010, lng: 8.0010, elevation: 1100 },
      { lat: 47.0020, lng: 8.0020, elevation: 1200 }
    ];
    
    const trailSegment: TrailSegment = {
      id: 'trail1',
      coordinates: [
        { lat: 47.0001, lng: 8.0001, elevation: 1000 },
        { lat: 47.0011, lng: 8.0011, elevation: 1100 }
      ],
      isWater: false,
      isRoad: false
    };
    
    // Mock trail snapping
    mockFindNearestTrailPoint.mockReturnValue({
      point: { lat: 47.0001, lng: 8.0001, elevation: 1000 },
      distance: 0.1 // Within snap distance
    });
    
    const optimizedRoute = await optimizeRouteWithTrails(points, [trailSegment]);
    
    expect(optimizedRoute).toHaveLength(3);
    expect(optimizedRoute[0].lat).toBeCloseTo(47.0001); // Should be snapped to trail
  });

  it('keeps original points when no trails nearby', async () => {
    const points: Coordinate[] = [
      { lat: 47.0000, lng: 8.0000, elevation: 1000 },
      { lat: 47.0010, lng: 8.0010, elevation: 1100 }
    ];
    
    // Mock no nearby trails
    mockFindNearestTrailPoint.mockReturnValue(null);
    
    const optimizedRoute = await optimizeRouteWithTrails(points, []);
    
    expect(optimizedRoute).toHaveLength(2);
    expect(optimizedRoute[0].lat).toBe(47.0000); // Should keep original coordinates
    expect(optimizedRoute[0].lng).toBe(8.0000);
  });

  it('filters out water bodies', async () => {
    const points: Coordinate[] = [
      { lat: 47.0000, lng: 8.0000, elevation: 1000 }
    ];
    
    const waterSegment: TrailSegment = {
      id: 'water1',
      coordinates: [{ lat: 47.0001, lng: 8.0001, elevation: 1000 }],
      isWater: true,
      isRoad: false
    };
    
    const trailSegment: TrailSegment = {
      id: 'trail1',
      coordinates: [{ lat: 47.0002, lng: 8.0002, elevation: 1000 }],
      isWater: false,
      isRoad: false
    };
    
    mockFindNearestTrailPoint
      .mockReturnValueOnce(null) // No road found
      .mockReturnValueOnce({
        point: { lat: 47.0002, lng: 8.0002, elevation: 1000 },
        distance: 0.1
      });
    
    const optimizedRoute = await optimizeRouteWithTrails(points, [waterSegment, trailSegment]);
    
    // Should snap to trail, not water
    expect(optimizedRoute[0].lat).toBeCloseTo(47.0002);
  });

  it('handles roads-only mode', async () => {
    const points: Coordinate[] = [
      { lat: 47.0000, lng: 8.0000, elevation: 1000 }
    ];
    
    const roadSegment: TrailSegment = {
      id: 'road1',
      coordinates: [{ lat: 47.0001, lng: 8.0001, elevation: 1000 }],
      isWater: false,
      isRoad: true
    };
    
    const trailSegment: TrailSegment = {
      id: 'trail1',
      coordinates: [{ lat: 47.0002, lng: 8.0002, elevation: 1000 }],
      isWater: false,
      isRoad: false
    };
    
    const roadsOnlyOptions: PathfindingOptions = {
      ...DEFAULT_PATHFINDING_OPTIONS,
      roadsOnly: true
    };
    
    mockFindNearestTrailPoint
      .mockReturnValueOnce({
        point: { lat: 47.0001, lng: 8.0001, elevation: 1000 },
        distance: 0.1
      })
      .mockReturnValueOnce(null); // No trails searched in roads-only mode
    
    const optimizedRoute = await optimizeRouteWithTrails(points, [roadSegment, trailSegment], roadsOnlyOptions);
    
    expect(optimizedRoute[0].lat).toBeCloseTo(47.0001); // Should snap to road
  });

  it('prioritizes roads over trails', async () => {
    const points: Coordinate[] = [
      { lat: 47.0000, lng: 8.0000, elevation: 1000 }
    ];
    
    const roadSegment: TrailSegment = {
      id: 'road1',
      coordinates: [{ lat: 47.0001, lng: 8.0001, elevation: 1000 }],
      isWater: false,
      isRoad: true
    };
    
    const trailSegment: TrailSegment = {
      id: 'trail1',
      coordinates: [{ lat: 47.0002, lng: 8.0002, elevation: 1000 }],
      isWater: false,
      isRoad: false
    };
    
    mockFindNearestTrailPoint
      .mockReturnValueOnce({
        point: { lat: 47.0001, lng: 8.0001, elevation: 1000 },
        distance: 0.2
      })
      .mockReturnValueOnce({
        point: { lat: 47.0002, lng: 8.0002, elevation: 1000 },
        distance: 0.1 // Closer trail
      });
    
    const optimizedRoute = await optimizeRouteWithTrails(points, [roadSegment, trailSegment]);
    
    // Should still prefer road even if trail is closer (roads get priority)
    expect(optimizedRoute[0].lat).toBeCloseTo(47.0001);
  });

  it('uses elevation data from API when available', async () => {
    const points: Coordinate[] = [
      { lat: 47.0000, lng: 8.0000 } // No elevation
    ];
    
    mockGetElevationForRoute.mockResolvedValue([
      { lat: 47.0000, lng: 8.0000, elevation: 1500 }
    ]);
    
    mockFindNearestTrailPoint.mockReturnValue(null); // No trail snapping
    
    const optimizedRoute = await optimizeRouteWithTrails(points, []);
    
    expect(optimizedRoute[0].elevation).toBeDefined(); // Should have elevation from API
    expect(optimizedRoute[0].lat).toBeCloseTo(47.0000, 3);
  });
});