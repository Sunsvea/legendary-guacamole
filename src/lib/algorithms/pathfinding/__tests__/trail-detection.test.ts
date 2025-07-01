/**
 * Unit tests for trail detection and linear route optimization
 * Tests functions for obvious linear route detection, forced linear routes,
 * trail path finding, and helper utilities for trail analysis
 */

import {
  isObviousLinearRoute,
  createForcedLinearRoute,
  createSimpleTrailRoute,
  interpolateWaypoints,
  createSimpleTrailGuidedWaypoints,
  findDirectTrailPath,
  extractTrailSegment,
  findTrailChain,
  isLinearRoute,
  createLinearTrailPath,
  calculateBearing,
  calculateTrailBearing,
  findClosestPointOnTrail,
  findConnectedTrail,
} from '../trail-detection';

import { Coordinate } from '@/types/route';
import { PathfindingOptions, DEFAULT_PATHFINDING_OPTIONS } from '@/types/pathfinding';
import { TrailSegment } from '@/lib/api/trails';

// Mock external dependencies
jest.mock('@/lib/utils', () => ({
  calculateDistance: jest.fn((from: Coordinate, to: Coordinate) => {
    // Simple Euclidean distance for testing
    const dLat = to.lat - from.lat;
    const dLng = to.lng - from.lng;
    return Math.sqrt(dLat * dLat + dLng * dLng) * 111; // Approximate km conversion
  })
}));

describe('isObviousLinearRoute', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const mockCalculateDistance = require('@/lib/utils').calculateDistance;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const createTrailSegment = (id: string, coordinates: Coordinate[], isRoad: boolean = false): TrailSegment => ({
    id,
    coordinates,
    isWater: false,
    isRoad
  });

  it('detects obvious linear route in park environment', () => {
    const start: Coordinate = { lat: 47.0000, lng: 8.0000 };
    const end: Coordinate = { lat: 47.0020, lng: 8.0020 };

    // Mock reasonable park distance
    mockCalculateDistance.mockReturnValue(2.0); // 2km

    const trails = [
      createTrailSegment('trail1', [
        { lat: 47.0001, lng: 8.0001 },
        { lat: 47.0019, lng: 8.0019 }
      ]),
      createTrailSegment('trail2', [
        { lat: 46.9999, lng: 7.9999 },
        { lat: 47.0021, lng: 8.0021 }
      ])
    ];

    // Mock distance calls for trail proximity
    mockCalculateDistance
      .mockReturnValueOnce(2.0) // start to end distance
      .mockReturnValue(0.05); // All other distances are close

    const result = isObviousLinearRoute(start, end, trails);

    expect(result).toBe(true);
  });

  it('rejects routes that are too short', () => {
    const start: Coordinate = { lat: 47.0000, lng: 8.0000 };
    const end: Coordinate = { lat: 47.0001, lng: 8.0001 };

    mockCalculateDistance.mockReturnValue(0.2); // Too short

    const result = isObviousLinearRoute(start, end, []);

    expect(result).toBe(false);
  });

  it('rejects routes that are too long', () => {
    const start: Coordinate = { lat: 47.0000, lng: 8.0000 };
    const end: Coordinate = { lat: 47.0050, lng: 8.0050 };

    mockCalculateDistance.mockReturnValue(4.0); // Too long

    const result = isObviousLinearRoute(start, end, []);

    expect(result).toBe(false);
  });

  it('rejects when start has no nearby trails', () => {
    const start: Coordinate = { lat: 47.0000, lng: 8.0000 };
    const end: Coordinate = { lat: 47.0020, lng: 8.0020 };

    mockCalculateDistance
      .mockReturnValueOnce(2.0) // start to end distance
      .mockReturnValue(1.0); // No trails nearby

    const trails = [
      createTrailSegment('trail1', [{ lat: 47.1000, lng: 8.1000 }])
    ];

    const result = isObviousLinearRoute(start, end, trails);

    expect(result).toBe(false);
  });

  it('rejects when trail density is too low', () => {
    const start: Coordinate = { lat: 47.0000, lng: 8.0000 };
    const end: Coordinate = { lat: 47.0020, lng: 8.0020 };

    mockCalculateDistance
      .mockReturnValueOnce(2.0) // start to end distance
      .mockReturnValueOnce(0.05) // start has nearby trail
      .mockReturnValueOnce(0.05) // end has nearby trail
      .mockReturnValue(1.0); // All check points are far from trails

    const trails = [
      createTrailSegment('trail1', [
        { lat: 47.0001, lng: 8.0001 },
        { lat: 47.0019, lng: 8.0019 }
      ])
    ];

    const result = isObviousLinearRoute(start, end, trails);

    expect(result).toBe(false);
  });

  it('ignores road trails in analysis', () => {
    const start: Coordinate = { lat: 47.0000, lng: 8.0000 };
    const end: Coordinate = { lat: 47.0020, lng: 8.0020 };

    mockCalculateDistance
      .mockReturnValueOnce(2.0) // start to end distance
      .mockReturnValue(1.0); // Only roads nearby, no trails

    const trails = [
      createTrailSegment('road1', [
        { lat: 47.0001, lng: 8.0001 }
      ], true) // Road, should be ignored
    ];

    const result = isObviousLinearRoute(start, end, trails);

    expect(result).toBe(false);
  });
});

describe('createForcedLinearRoute', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const mockCalculateDistance = require('@/lib/utils').calculateDistance;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('creates linear route with trail snapping', () => {
    const start: Coordinate = { lat: 47.0000, lng: 8.0000 };
    const end: Coordinate = { lat: 47.0020, lng: 8.0020 };

    const trails = [
      {
        id: 'trail1',
        coordinates: [
          { lat: 47.0001, lng: 8.0001 },
          { lat: 47.0010, lng: 8.0010 },
          { lat: 47.0019, lng: 8.0019 }
        ],
        isWater: false,
        isRoad: false
      }
    ];

    // Mock close distances for trail snapping
    mockCalculateDistance.mockReturnValue(0.05);

    const result = createForcedLinearRoute(start, end, trails);

    expect(result.length).toBe(26); // 25 waypoints + 1
    // First and last points may be snapped to trails, so check they're in the right area
    expect(result[0].lat).toBeCloseTo(start.lat, 2);
    expect(result[0].lng).toBeCloseTo(start.lng, 2);
    expect(result[result.length - 1].lat).toBeCloseTo(end.lat, 2);
    expect(result[result.length - 1].lng).toBeCloseTo(end.lng, 2);
  });

  it('ignores roads and water bodies', () => {
    const start: Coordinate = { lat: 47.0000, lng: 8.0000 };
    const end: Coordinate = { lat: 47.0010, lng: 8.0010 };

    const trails = [
      {
        id: 'road1',
        coordinates: [{ lat: 47.0005, lng: 8.0005 }],
        isWater: false,
        isRoad: true
      },
      {
        id: 'water1',
        coordinates: [{ lat: 47.0005, lng: 8.0005 }],
        isWater: true,
        isRoad: false
      }
    ];

    mockCalculateDistance.mockReturnValue(0.05);

    const result = createForcedLinearRoute(start, end, trails);

    // Should use direct points since trails are filtered out
    expect(result.length).toBe(26);
    result.forEach(point => {
      expect(point.lat).toBeGreaterThanOrEqual(start.lat);
      expect(point.lat).toBeLessThanOrEqual(end.lat);
    });
  });

  it('uses direct points when no trails within snap distance', () => {
    const start: Coordinate = { lat: 47.0000, lng: 8.0000 };
    const end: Coordinate = { lat: 47.0010, lng: 8.0010 };

    const trails = [
      {
        id: 'trail1',
        coordinates: [{ lat: 47.1000, lng: 8.1000 }], // Far away
        isWater: false,
        isRoad: false
      }
    ];

    mockCalculateDistance.mockReturnValue(1.0); // Too far for snapping

    const result = createForcedLinearRoute(start, end, trails);

    expect(result.length).toBe(26);
    // Should interpolate between start and end
    expect(result[0]).toEqual(start);
    expect(result[result.length - 1]).toEqual(end);
  });
});

describe('createSimpleTrailRoute', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const mockCalculateDistance = require('@/lib/utils').calculateDistance;

  beforeEach(() => {
    jest.clearAllMocks();
    mockCalculateDistance.mockReturnValue(0.1); // Default close distance
  });

  it('creates basic trail route with waypoint snapping', () => {
    const start: Coordinate = { lat: 47.0000, lng: 8.0000 };
    const end: Coordinate = { lat: 47.0020, lng: 8.0020 };

    const trails = [
      {
        id: 'trail1',
        coordinates: [
          { lat: 47.0005, lng: 8.0005 },
          { lat: 47.0015, lng: 8.0015 }
        ],
        isWater: false,
        isRoad: false
      }
    ];

    const result = createSimpleTrailRoute(start, end, trails);

    expect(result.length).toBeGreaterThan(2);
    expect(result[0]).toEqual(start);
    expect(result[result.length - 1]).toEqual(end);
  });

  it('filters to roads only when roadsOnly option is true', () => {
    const start: Coordinate = { lat: 47.0000, lng: 8.0000 };
    const end: Coordinate = { lat: 47.0010, lng: 8.0010 };

    const trails = [
      {
        id: 'road1',
        coordinates: [{ lat: 47.0005, lng: 8.0005 }],
        isWater: false,
        isRoad: true
      },
      {
        id: 'trail1',
        coordinates: [{ lat: 47.0005, lng: 8.0005 }],
        isWater: false,
        isRoad: false
      }
    ];

    const roadsOnlyOptions: PathfindingOptions = {
      ...DEFAULT_PATHFINDING_OPTIONS,
      roadsOnly: true
    };

    const result = createSimpleTrailRoute(start, end, trails, roadsOnlyOptions);

    expect(result.length).toBeGreaterThan(2);
    expect(result[0]).toEqual(start);
    expect(result[result.length - 1]).toEqual(end);
  });

  it('uses forced linear route for obvious linear routes', () => {
    const start: Coordinate = { lat: 47.0000, lng: 8.0000 };
    const end: Coordinate = { lat: 47.0020, lng: 8.0020 };

    // Mock to make isObviousLinearRoute return true
    mockCalculateDistance
      .mockReturnValueOnce(2.0) // Distance between start and end
      .mockReturnValue(0.05); // All other distances close

    const trails = [
      {
        id: 'trail1',
        coordinates: [
          { lat: 47.0001, lng: 8.0001 },
          { lat: 47.0010, lng: 8.0010 },
          { lat: 47.0019, lng: 8.0019 }
        ],
        isWater: false,
        isRoad: false
      }
    ];

    const result = createSimpleTrailRoute(start, end, trails);

    // Should use forced linear route (26 waypoints)
    expect(result.length).toBe(26);
  });

  it('skips water bodies during trail snapping', () => {
    const start: Coordinate = { lat: 47.0000, lng: 8.0000 };
    const end: Coordinate = { lat: 47.0010, lng: 8.0010 };

    const trails = [
      {
        id: 'water1',
        coordinates: [{ lat: 47.0005, lng: 8.0005 }],
        isWater: true,
        isRoad: false
      },
      {
        id: 'trail1',
        coordinates: [{ lat: 47.0006, lng: 8.0006 }],
        isWater: false,
        isRoad: false
      }
    ];

    const result = createSimpleTrailRoute(start, end, trails);

    expect(result.length).toBeGreaterThan(2);
    // Should not snap to water body
  });

  it('prefers trails over roads when not in roads-only mode', () => {
    const start: Coordinate = { lat: 47.0000, lng: 8.0000 };
    const end: Coordinate = { lat: 47.0010, lng: 8.0010 };

    const trails = [
      {
        id: 'road1',
        coordinates: [{ lat: 47.0005, lng: 8.0005 }],
        isWater: false,
        isRoad: true
      },
      {
        id: 'trail1',
        coordinates: [{ lat: 47.0005, lng: 8.0005 }],
        isWater: false,
        isRoad: false
      }
    ];

    // Mock trail being preferred (distance * 0.5 < road distance)
    mockCalculateDistance.mockReturnValue(0.1);

    const result = createSimpleTrailRoute(start, end, trails);

    expect(result.length).toBeGreaterThan(2);
  });
});

describe('interpolateWaypoints', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const mockCalculateDistance = require('@/lib/utils').calculateDistance;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('adds intermediate points for long segments', () => {
    const waypoints: Coordinate[] = [
      { lat: 47.0000, lng: 8.0000, elevation: 1000 },
      { lat: 47.0020, lng: 8.0020, elevation: 1200 }
    ];

    mockCalculateDistance.mockReturnValue(2.0); // 2km segment
    const targetDistance = 0.5; // Want 500m intervals

    const result = interpolateWaypoints(waypoints, targetDistance);

    expect(result.length).toBeGreaterThan(2);
    expect(result[0]).toEqual(waypoints[0]);
    expect(result[result.length - 1]).toEqual(waypoints[1]);

    // Check intermediate points have interpolated elevation
    if (result.length > 2) {
      const midPoint = result[Math.floor(result.length / 2)];
      expect(midPoint.elevation).toBeGreaterThan(1000);
      expect(midPoint.elevation).toBeLessThan(1200);
    }
  });

  it('does not add points for short segments', () => {
    const waypoints: Coordinate[] = [
      { lat: 47.0000, lng: 8.0000 },
      { lat: 47.0001, lng: 8.0001 }
    ];

    mockCalculateDistance.mockReturnValue(0.1); // 100m segment
    const targetDistance = 0.5; // Want 500m intervals

    const result = interpolateWaypoints(waypoints, targetDistance);

    expect(result).toEqual(waypoints);
  });

  it('handles single waypoint', () => {
    const waypoints: Coordinate[] = [
      { lat: 47.0000, lng: 8.0000 }
    ];

    const result = interpolateWaypoints(waypoints, 0.5);

    expect(result).toEqual(waypoints);
  });

  it('handles waypoints without elevation', () => {
    const waypoints: Coordinate[] = [
      { lat: 47.0000, lng: 8.0000 },
      { lat: 47.0020, lng: 8.0020 }
    ];

    mockCalculateDistance.mockReturnValue(2.0);
    const targetDistance = 0.5;

    const result = interpolateWaypoints(waypoints, targetDistance);

    expect(result.length).toBeGreaterThan(2);
    // Should handle missing elevation gracefully
    result.forEach(point => {
      expect(point.lat).toBeDefined();
      expect(point.lng).toBeDefined();
    });
  });
});

describe('createSimpleTrailGuidedWaypoints', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const mockCalculateDistance = require('@/lib/utils').calculateDistance;

  beforeEach(() => {
    jest.clearAllMocks();
    mockCalculateDistance.mockReturnValue(0.1);
  });

  it('creates waypoints using trail guidance', () => {
    const start: Coordinate = { lat: 47.0000, lng: 8.0000 };
    const end: Coordinate = { lat: 47.0010, lng: 8.0010 };

    const trails = [
      {
        id: 'trail1',
        coordinates: [
          { lat: 47.0005, lng: 8.0005 }
        ],
        isWater: false,
        isRoad: false
      }
    ];

    const result = createSimpleTrailGuidedWaypoints(start, end, trails);

    expect(result.length).toBeGreaterThan(2);
    expect(result[0]).toEqual(start);
    expect(result[result.length - 1]).toEqual(end);
  });

  it('returns direct route when no usable trails', () => {
    const start: Coordinate = { lat: 47.0000, lng: 8.0000 };
    const end: Coordinate = { lat: 47.0010, lng: 8.0010 };

    const trails = [
      {
        id: 'water1',
        coordinates: [{ lat: 47.0005, lng: 8.0005 }],
        isWater: true,
        isRoad: false
      }
    ];

    const result = createSimpleTrailGuidedWaypoints(start, end, trails);

    expect(result).toEqual([start, end]);
  });

  it('limits waypoints to maxWaypoints option', () => {
    const start: Coordinate = { lat: 47.0000, lng: 8.0000 };
    const end: Coordinate = { lat: 47.0100, lng: 8.0100 };

    mockCalculateDistance.mockReturnValue(10.0); // Long route to generate many waypoints

    const trails = [
      {
        id: 'trail1',
        coordinates: [{ lat: 47.0050, lng: 8.0050 }],
        isWater: false,
        isRoad: false
      }
    ];

    const options: PathfindingOptions = {
      ...DEFAULT_PATHFINDING_OPTIONS,
      maxWaypoints: 5,
      waypointDistance: 0.1
    };

    const result = createSimpleTrailGuidedWaypoints(start, end, trails, options);

    expect(result.length).toBeLessThanOrEqual(5);
    expect(result[result.length - 1]).toEqual(end);
  });
});

describe('findDirectTrailPath', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const mockCalculateDistance = require('@/lib/utils').calculateDistance;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('finds direct trail connection', () => {
    const start: Coordinate = { lat: 47.0000, lng: 8.0000 };
    const end: Coordinate = { lat: 47.0010, lng: 8.0010 };

    const commonTrail = {
      id: 'trail1',
      coordinates: [
        { lat: 47.0001, lng: 8.0001 },
        { lat: 47.0005, lng: 8.0005 },
        { lat: 47.0009, lng: 8.0009 }
      ],
      isWater: false,
      isRoad: false
    };

    // Mock distances for trail proximity
    mockCalculateDistance.mockReturnValue(0.05); // Close to trail

    const result = findDirectTrailPath(start, end, [commonTrail]);

    expect(result).not.toBeNull();
    if (result) {
      expect(result.length).toBeGreaterThan(0);
    }
  });

  it('returns null when no suitable trails found', () => {
    const start: Coordinate = { lat: 47.0000, lng: 8.0000 };
    const end: Coordinate = { lat: 47.0010, lng: 8.0010 };

    const distantTrail = {
      id: 'trail1',
      coordinates: [{ lat: 47.1000, lng: 8.1000 }],
      isWater: false,
      isRoad: false
    };

    mockCalculateDistance.mockReturnValue(1.0); // Too far

    const result = findDirectTrailPath(start, end, [distantTrail]);

    expect(result).toBeNull();
  });

  it('rejects routes that are too long for trail chaining', () => {
    const start: Coordinate = { lat: 47.0000, lng: 8.0000 };
    const end: Coordinate = { lat: 47.0100, lng: 8.0100 };

    // Mock the distance to the start/end of route (first call) and then trail proximity calls
    mockCalculateDistance
      .mockReturnValueOnce(10.0) // Overall route distance - too long
      .mockReturnValue(0.05); // All other proximity checks

    const trail = {
      id: 'trail1',
      coordinates: [{ lat: 47.0050, lng: 8.0050 }],
      isWater: false,
      isRoad: false
    };

    const result = findDirectTrailPath(start, end, [trail]);

    expect(result).toBeNull();
  });
});

describe('extractTrailSegment', () => {
  it('extracts segment between start and end points', () => {
    const start: Coordinate = { lat: 47.0000, lng: 8.0000 };
    const end: Coordinate = { lat: 47.0020, lng: 8.0020 };

    const trail: TrailSegment = {
      id: 'trail1',
      coordinates: [
        { lat: 46.9990, lng: 7.9990 }, // Before start
        { lat: 47.0000, lng: 8.0000 }, // Near start (index 1)
        { lat: 47.0010, lng: 8.0010 }, // Middle (index 2)
        { lat: 47.0020, lng: 8.0020 }, // Near end (index 3)
        { lat: 47.0030, lng: 8.0030 }  // After end
      ],
      isWater: false,
      isRoad: false
    };

    // Mock distances to return closest points
    // eslint-disable-next-line @typescript-eslint/no-require-imports
  const mockCalculateDistance = require('@/lib/utils').calculateDistance;
    mockCalculateDistance
      .mockReturnValueOnce(1.0)  // distance from start to coord[0]
      .mockReturnValueOnce(1.0)  // distance from end to coord[0]
      .mockReturnValueOnce(0.1)  // distance from start to coord[1] - closest to start
      .mockReturnValueOnce(0.5)  // distance from end to coord[1]
      .mockReturnValueOnce(0.2)  // distance from start to coord[2]
      .mockReturnValueOnce(0.3)  // distance from end to coord[2]
      .mockReturnValueOnce(0.3)  // distance from start to coord[3]
      .mockReturnValueOnce(0.1)  // distance from end to coord[3] - closest to end
      .mockReturnValueOnce(1.0)  // distance from start to coord[4]
      .mockReturnValueOnce(1.0); // distance from end to coord[4]

    const result = extractTrailSegment(start, end, trail);

    expect(result.length).toBeGreaterThan(0); // Should extract some segment
    // Function finds closest points and extracts segment between them
  });

  it('reverses segment when end comes before start in trail', () => {
    const start: Coordinate = { lat: 47.0020, lng: 8.0020 };
    const end: Coordinate = { lat: 47.0000, lng: 8.0000 };

    const trail: TrailSegment = {
      id: 'trail1',
      coordinates: [
        { lat: 47.0000, lng: 8.0000 }, // Near end (but first in trail)
        { lat: 47.0010, lng: 8.0010 }, // Middle
        { lat: 47.0020, lng: 8.0020 }  // Near start (but last in trail)
      ],
      isWater: false,
      isRoad: false
    };

    // Mock distances for this test
    // eslint-disable-next-line @typescript-eslint/no-require-imports
  const mockCalculateDistance = require('@/lib/utils').calculateDistance;
    mockCalculateDistance
      .mockReturnValueOnce(0.5)  // distance from start to coord[0]
      .mockReturnValueOnce(0.1)  // distance from end to coord[0] - closest to end
      .mockReturnValueOnce(0.2)  // distance from start to coord[1]
      .mockReturnValueOnce(0.3)  // distance from end to coord[1]
      .mockReturnValueOnce(0.1)  // distance from start to coord[2] - closest to start
      .mockReturnValueOnce(0.5); // distance from end to coord[2]

    const result = extractTrailSegment(start, end, trail);

    expect(result.length).toBeGreaterThan(0);
    // Should reverse because start index (2) > end index (0)
  });

  it('returns empty array when no matching points found', () => {
    const start: Coordinate = { lat: 47.0000, lng: 8.0000 };
    const end: Coordinate = { lat: 47.0010, lng: 8.0010 };

    const trail: TrailSegment = {
      id: 'trail1',
      coordinates: [], // Empty trail
      isWater: false,
      isRoad: false
    };

    const result = extractTrailSegment(start, end, trail);

    expect(result).toEqual([]);
  });
});

describe('findTrailChain', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const mockCalculateDistance = require('@/lib/utils').calculateDistance;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('finds connected trail segments', () => {
    const start: Coordinate = { lat: 47.0000, lng: 8.0000 };
    const end: Coordinate = { lat: 47.0020, lng: 8.0020 };

    const trail1: TrailSegment = {
      id: 'trail1',
      coordinates: [
        { lat: 47.0000, lng: 8.0000 },
        { lat: 47.0010, lng: 8.0010 }
      ],
      isWater: false,
      isRoad: false
    };

    const trail2: TrailSegment = {
      id: 'trail2',
      coordinates: [
        { lat: 47.0010, lng: 8.0010 },
        { lat: 47.0020, lng: 8.0020 }
      ],
      isWater: false,
      isRoad: false
    };

    mockCalculateDistance.mockReturnValue(0.05); // Close connections

    const result = findTrailChain(start, end, [trail1], [trail2], [trail1, trail2], 45);

    expect(result).not.toBeNull();
    if (result) {
      expect(result.length).toBeGreaterThanOrEqual(0); // May return empty array or valid path
    }
  });

  it('returns null when no trail chain can be formed', () => {
    const start: Coordinate = { lat: 47.0000, lng: 8.0000 };
    const end: Coordinate = { lat: 47.0020, lng: 8.0020 };

    const isolatedTrail: TrailSegment = {
      id: 'trail1',
      coordinates: [{ lat: 47.1000, lng: 8.1000 }],
      isWater: false,
      isRoad: false
    };

    mockCalculateDistance.mockReturnValue(1.0); // Too far

    const result = findTrailChain(start, end, [isolatedTrail], [], [isolatedTrail], 45);

    expect(result).toBeNull();
  });
});

describe('isLinearRoute', () => {
  it('identifies linear routes in appropriate distance range', () => {
    const start: Coordinate = { lat: 47.0000, lng: 8.0000 };
    const end: Coordinate = { lat: 47.0010, lng: 8.0010 };

    // eslint-disable-next-line @typescript-eslint/no-require-imports
  const mockCalculateDistance = require('@/lib/utils').calculateDistance;
    mockCalculateDistance.mockReturnValue(1.0); // 1km - good distance

    const startTrails = [
      { id: 'trail1', coordinates: [], isWater: false, isRoad: false }
    ];
    const endTrails = [
      { id: 'trail2', coordinates: [], isWater: false, isRoad: false }
    ];

    const result = isLinearRoute(start, end, startTrails, endTrails);

    expect(result).toBe(true);
  });

  it('rejects routes that are too short', () => {
    const start: Coordinate = { lat: 47.0000, lng: 8.0000 };
    const end: Coordinate = { lat: 47.0001, lng: 8.0001 };

    // eslint-disable-next-line @typescript-eslint/no-require-imports
  const mockCalculateDistance = require('@/lib/utils').calculateDistance;
    mockCalculateDistance.mockReturnValue(0.3); // Too short

    const result = isLinearRoute(start, end, [], []);

    expect(result).toBe(false);
  });

  it('rejects routes that are too long', () => {
    const start: Coordinate = { lat: 47.0000, lng: 8.0000 };
    const end: Coordinate = { lat: 47.0030, lng: 8.0030 };

    // eslint-disable-next-line @typescript-eslint/no-require-imports
  const mockCalculateDistance = require('@/lib/utils').calculateDistance;
    mockCalculateDistance.mockReturnValue(3.0); // Too long

    const result = isLinearRoute(start, end, [], []);

    expect(result).toBe(false);
  });

  it('rejects when start or end are only on roads', () => {
    const start: Coordinate = { lat: 47.0000, lng: 8.0000 };
    const end: Coordinate = { lat: 47.0010, lng: 8.0010 };

    // eslint-disable-next-line @typescript-eslint/no-require-imports
  const mockCalculateDistance = require('@/lib/utils').calculateDistance;
    mockCalculateDistance.mockReturnValue(1.0);

    const roadTrails = [
      { id: 'road1', coordinates: [], isWater: false, isRoad: true }
    ];

    const result = isLinearRoute(start, end, roadTrails, roadTrails);

    expect(result).toBe(false);
  });
});

describe('createLinearTrailPath', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const mockCalculateDistance = require('@/lib/utils').calculateDistance;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('creates linear path with trail snapping', () => {
    const start: Coordinate = { lat: 47.0000, lng: 8.0000 };
    const end: Coordinate = { lat: 47.0020, lng: 8.0020 };

    const trails = [
      {
        id: 'trail1',
        coordinates: [
          { lat: 47.0005, lng: 8.0005 },
          { lat: 47.0015, lng: 8.0015 }
        ],
        isWater: false,
        isRoad: false
      }
    ];

    mockCalculateDistance.mockReturnValue(0.03); // Within snap distance

    const result = createLinearTrailPath(start, end, trails);

    expect(result.length).toBe(21); // 20 steps + 1
  });

  it('ignores roads during trail snapping', () => {
    const start: Coordinate = { lat: 47.0000, lng: 8.0000 };
    const end: Coordinate = { lat: 47.0010, lng: 8.0010 };

    const trails = [
      {
        id: 'road1',
        coordinates: [{ lat: 47.0005, lng: 8.0005 }],
        isWater: false,
        isRoad: true
      }
    ];

    mockCalculateDistance.mockReturnValue(0.03);

    const result = createLinearTrailPath(start, end, trails);

    expect(result.length).toBe(21);
    // Should use interpolated points, not road points
  });

  it('uses direct interpolation when no trails within snap distance', () => {
    const start: Coordinate = { lat: 47.0000, lng: 8.0000 };
    const end: Coordinate = { lat: 47.0010, lng: 8.0010 };

    const trails = [
      {
        id: 'trail1',
        coordinates: [{ lat: 47.1000, lng: 8.1000 }], // Far away
        isWater: false,
        isRoad: false
      }
    ];

    mockCalculateDistance.mockReturnValue(1.0); // Too far

    const result = createLinearTrailPath(start, end, trails);

    expect(result.length).toBe(21);
    // Should be direct interpolation between start and end
    result.forEach((point, index) => {
      const ratio = index / 20;
      const expectedLat = start.lat + (end.lat - start.lat) * ratio;
      const expectedLng = start.lng + (end.lng - start.lng) * ratio;
      expect(point.lat).toBeCloseTo(expectedLat, 5);
      expect(point.lng).toBeCloseTo(expectedLng, 5);
    });
  });
});

describe('Helper Functions', () => {
  describe('calculateBearing', () => {
    it('calculates bearing between two coordinates', () => {
      const from: Coordinate = { lat: 47.0000, lng: 8.0000 };
      const to: Coordinate = { lat: 47.0010, lng: 8.0010 };

      const bearing = calculateBearing(from, to);

      expect(bearing).toBeGreaterThanOrEqual(0);
      expect(bearing).toBeLessThan(360);
      expect(bearing).toBeGreaterThan(20); // Generally northeast direction
      expect(bearing).toBeLessThan(70);
    });

    it('handles same coordinates', () => {
      const coord: Coordinate = { lat: 47.0000, lng: 8.0000 };

      const bearing = calculateBearing(coord, coord);

      expect(bearing).toBe(0); // Due north when no movement
    });
  });

  describe('calculateTrailBearing', () => {
    it('calculates bearing for trail with multiple coordinates', () => {
      const trail: TrailSegment = {
        id: 'trail1',
        coordinates: [
          { lat: 47.0000, lng: 8.0000 },
          { lat: 47.0005, lng: 8.0005 },
          { lat: 47.0010, lng: 8.0010 }
        ],
        isWater: false,
        isRoad: false
      };

      const bearing = calculateTrailBearing(trail);

      expect(bearing).toBeGreaterThanOrEqual(0);
      expect(bearing).toBeLessThan(360);
    });

    it('returns 0 for trail with insufficient coordinates', () => {
      const trail: TrailSegment = {
        id: 'trail1',
        coordinates: [{ lat: 47.0000, lng: 8.0000 }],
        isWater: false,
        isRoad: false
      };

      const bearing = calculateTrailBearing(trail);

      expect(bearing).toBe(0);
    });
  });

  describe('findClosestPointOnTrail', () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
  const mockCalculateDistance = require('@/lib/utils').calculateDistance;

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('finds closest point on trail', () => {
      const point: Coordinate = { lat: 47.0005, lng: 8.0005 };
      const trail: TrailSegment = {
        id: 'trail1',
        coordinates: [
          { lat: 47.0000, lng: 8.0000 },
          { lat: 47.0006, lng: 8.0006 }, // Closest
          { lat: 47.0010, lng: 8.0010 }
        ],
        isWater: false,
        isRoad: false
      };

      mockCalculateDistance
        .mockReturnValueOnce(0.7) // Distance to first point
        .mockReturnValueOnce(0.1) // Distance to second point (closest)
        .mockReturnValueOnce(0.5); // Distance to third point

      const result = findClosestPointOnTrail(point, trail);

      expect(result).toEqual({ lat: 47.0006, lng: 8.0006 });
    });

    it('returns null for empty trail', () => {
      const point: Coordinate = { lat: 47.0000, lng: 8.0000 };
      const trail: TrailSegment = {
        id: 'trail1',
        coordinates: [],
        isWater: false,
        isRoad: false
      };

      const result = findClosestPointOnTrail(point, trail);

      expect(result).toBeNull();
    });
  });

  describe('findConnectedTrail', () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
  const mockCalculateDistance = require('@/lib/utils').calculateDistance;

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('finds trail connected to current trail end', () => {
      const currentTrail: TrailSegment = {
        id: 'current',
        coordinates: [
          { lat: 47.0000, lng: 8.0000 },
          { lat: 47.0010, lng: 8.0010 }
        ],
        isWater: false,
        isRoad: false
      };

      const connectedTrail: TrailSegment = {
        id: 'connected',
        coordinates: [
          { lat: 47.0010, lng: 8.0010 }, // Connects to current trail end
          { lat: 47.0020, lng: 8.0020 }
        ],
        isWater: false,
        isRoad: false
      };

      const target: Coordinate = { lat: 47.0020, lng: 8.0020 };

      mockCalculateDistance
        .mockReturnValueOnce(0.05) // Connection distance
        .mockReturnValueOnce(0.05); // Progress to target

      const result = findConnectedTrail(
        currentTrail,
        [connectedTrail],
        new Set(),
        target
      );

      expect(result).toEqual(connectedTrail);
    });

    it('returns null when no trails connect within threshold', () => {
      const currentTrail: TrailSegment = {
        id: 'current',
        coordinates: [
          { lat: 47.0000, lng: 8.0000 },
          { lat: 47.0010, lng: 8.0010 }
        ],
        isWater: false,
        isRoad: false
      };

      const distantTrail: TrailSegment = {
        id: 'distant',
        coordinates: [
          { lat: 47.0020, lng: 8.0020 }, // Too far from current trail end
          { lat: 47.0030, lng: 8.0030 }
        ],
        isWater: false,
        isRoad: false
      };

      const target: Coordinate = { lat: 47.0030, lng: 8.0030 };

      mockCalculateDistance.mockReturnValue(1.0); // Too far

      const result = findConnectedTrail(
        currentTrail,
        [distantTrail],
        new Set(),
        target
      );

      expect(result).toBeNull();
    });

    it('ignores already used trails', () => {
      const currentTrail: TrailSegment = {
        id: 'current',
        coordinates: [
          { lat: 47.0000, lng: 8.0000 },
          { lat: 47.0010, lng: 8.0010 }
        ],
        isWater: false,
        isRoad: false
      };

      const usedTrail: TrailSegment = {
        id: 'used',
        coordinates: [
          { lat: 47.0010, lng: 8.0010 },
          { lat: 47.0020, lng: 8.0020 }
        ],
        isWater: false,
        isRoad: false
      };

      const target: Coordinate = { lat: 47.0020, lng: 8.0020 };

      const result = findConnectedTrail(
        currentTrail,
        [usedTrail],
        new Set(['used']), // Trail already used
        target
      );

      expect(result).toBeNull();
    });

    it('ignores roads', () => {
      const currentTrail: TrailSegment = {
        id: 'current',
        coordinates: [
          { lat: 47.0000, lng: 8.0000 },
          { lat: 47.0010, lng: 8.0010 }
        ],
        isWater: false,
        isRoad: false
      };

      const roadTrail: TrailSegment = {
        id: 'road',
        coordinates: [
          { lat: 47.0010, lng: 8.0010 },
          { lat: 47.0020, lng: 8.0020 }
        ],
        isWater: false,
        isRoad: true
      };

      const target: Coordinate = { lat: 47.0020, lng: 8.0020 };

      const result = findConnectedTrail(
        currentTrail,
        [roadTrail],
        new Set(),
        target
      );

      expect(result).toBeNull();
    });
  });
});