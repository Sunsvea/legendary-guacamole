
import { findOptimalRoute } from '@/lib/algorithms/pathfinding';
import { getElevationForRoute, getElevation } from '@/lib/api/elevation';
import { fetchTrailData } from '@/lib/api/trails';
import { Coordinate } from '@/types/route';
import { calculateDistance } from '@/lib/utils';

// Mock the API modules
jest.mock('@/lib/api/elevation');
jest.mock('@/lib/api/trails');

const mockedGetElevationForRoute = getElevationForRoute as jest.Mock;
const mockedFetchTrailData = fetchTrailData as jest.Mock;
const mockedGetElevation = getElevation as jest.Mock;

describe('findOptimalRoute', () => {
  beforeEach(() => {
    // Clear all instances and calls to constructor and all methods:
    mockedGetElevationForRoute.mockClear();
    mockedFetchTrailData.mockClear();
    mockedGetElevation.mockClear();
  });

  it('should return a path ending at the precise destination, even with a coarse elevation grid', async () => {
    const start: Coordinate = { lat: 46.5, lng: 8.5 };
    const end: Coordinate = { lat: 46.51, lng: 8.51 };

    // Mock a coarse elevation grid where the last point is not the same as the end coordinate
    const coarseElevationGrid: Coordinate[] = [
      { lat: 46.5, lng: 8.5, elevation: 1000 },
      { lat: 46.505, lng: 8.505, elevation: 1100 },
      { lat: 46.508, lng: 8.512, elevation: 1200 }, // Intentionally offset from the true 'end'
    ];

    mockedGetElevationForRoute.mockResolvedValue(coarseElevationGrid);
    mockedFetchTrailData.mockResolvedValue({ trails: [], spatialIndex: null, bbox: null });
    // Mock getElevation for the direct path check
    mockedGetElevation.mockResolvedValue([1000, 1100, 1200]);

    const route = await findOptimalRoute(start, end);

    // The test assertion
    expect(route).toBeDefined();
    expect(route.length).toBeGreaterThan(1);

    const finalPoint = route[route.length - 1];
    const distanceFromEnd = calculateDistance(finalPoint, end);

    // The final point of the route should be very close to the actual 'end' coordinate
    // The threshold is small because the A* search should get very close to the goal.
    expect(distanceFromEnd).toBeLessThan(0.02); // Less than 20 meters
  });
});
