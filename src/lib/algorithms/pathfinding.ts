import { Coordinate, RoutePoint, PathfindingNode } from '@/types/route';
import { PathfindingOptions, DEFAULT_PATHFINDING_OPTIONS } from '@/types/pathfinding';
import { calculateDistance } from '@/lib/utils';
import { getElevationForRoute, getElevation } from '@/lib/api/elevation';
import { fetchTrailData } from '@/lib/api/trails';
import PriorityQueue from '@/lib/algorithms/pathfinding/data-structures/priority-queue';
import {
  PATHFINDING_CONSTANTS,
  calculateHeuristic,
  calculateMovementCost,
  generateNeighbors,
  reconstructPath,
  optimizeRouteWithTrails
} from './pathfinding/utilities';
import {
  findDirectTrailPath
} from './pathfinding/trail-detection';

export async function findOptimalRoute(
  start: Coordinate,
  end: Coordinate,
  options: PathfindingOptions = DEFAULT_PATHFINDING_OPTIONS
): Promise<RoutePoint[]> {
  try {
    const distance = calculateDistance(start, end);

    // For short routes, use a simple direct path with elevation data
    if (distance < 5) { // 5km threshold
      const points = [];
      const numPoints = Math.max(2, Math.floor(distance / 0.1)); // Add a point every 100m
      for (let i = 0; i <= numPoints; i++) {
        const lat = start.lat + (end.lat - start.lat) * (i / numPoints);
        const lng = start.lng + (end.lng - start.lng) * (i / numPoints);
        points.push({ lat, lng });
      }
      const elevations = await getElevation(points);
      return points.map((p, i) => ({ ...p, elevation: elevations[i] || 0 }));
    }

    // Fetch both elevation and trail data in parallel
    const [elevationPoints, trailNetwork] = await Promise.all([
      getElevationForRoute(start, end, 0.005),
      fetchTrailData(start, end)
    ]);

    // TRY DIRECT TRAIL PATH FIRST - for linear routes like parks
    const directPath = findDirectTrailPath(start, end, trailNetwork.trails);
    if (directPath && directPath.length > 2) {

      // Add elevation data to the direct path
      try {
        const elevations = await getElevation(directPath);
        const routePoints: RoutePoint[] = directPath.map((coord, index) => ({
          ...coord,
          elevation: elevations[index] || 0,
        }));

        return routePoints;
      } catch {
      }
    }

    if (elevationPoints.length === 0) {
      throw new Error('Failed to get elevation data');
    }

    const startWithElevation = elevationPoints[0];
    const endWithElevation: Coordinate = {
      ...end,
      elevation: elevationPoints.find(p => p.lat === end.lat && p.lng === end.lng)?.elevation || elevationPoints[elevationPoints.length - 1].elevation
    };

    const openSet = new PriorityQueue();
    const closedSet: Coordinate[] = [];

    const startNode: PathfindingNode = {
      coordinate: startWithElevation,
      gCost: 0,
      hCost: calculateHeuristic(startWithElevation, endWithElevation),
      fCost: 0,
    };
    startNode.fCost = startNode.gCost + startNode.hCost;

    openSet.enqueue(startNode);

    let iterations = 0;

    while (!openSet.isEmpty() && iterations < options.maxIterations) {
      iterations++;

      const current = openSet.dequeue();
      if (!current) break;

      if (calculateDistance(current.coordinate, end) < PATHFINDING_CONSTANTS.GOAL_DISTANCE_THRESHOLD) {
        const path = reconstructPath(current);
        // Ensure the final point is the exact end coordinate
        path.push({ ...end, elevation: current.coordinate.elevation || endWithElevation.elevation || 0 });
        return path;
      }

      closedSet.push(current.coordinate);

      const neighbors = generateNeighbors(current.coordinate, elevationPoints);


      for (const neighbor of neighbors) {
        if (closedSet.some(coord =>
          Math.abs(coord.lat - neighbor.lat) < PATHFINDING_CONSTANTS.COORDINATE_TOLERANCE &&
          Math.abs(coord.lng - neighbor.lng) < PATHFINDING_CONSTANTS.COORDINATE_TOLERANCE
        )) {
          continue;
        }

        const elevationPoint = elevationPoints.find(point =>
          Math.abs(point.lat - neighbor.lat) < PATHFINDING_CONSTANTS.GOAL_DISTANCE_THRESHOLD &&
          Math.abs(point.lng - neighbor.lng) < PATHFINDING_CONSTANTS.GOAL_DISTANCE_THRESHOLD
        );

        if (elevationPoint) {
          neighbor.elevation = elevationPoint.elevation;
        }

        const gCost = current.gCost + calculateMovementCost(current.coordinate, neighbor, trailNetwork, options);


        const hCost = calculateHeuristic(neighbor, end);

        if (!openSet.contains(neighbor)) {
          const neighborNode: PathfindingNode = {
            coordinate: neighbor,
            gCost,
            hCost,
            fCost: gCost + hCost,
            parent: current,
          };

          openSet.enqueue(neighborNode);
        }
      }
    }

    // ALWAYS use trail optimization for fallback routes
    const result = await optimizeRouteWithTrails(elevationPoints, trailNetwork.trails, options);
    return result;

  } catch (error) {
    console.error('Error in pathfinding:', error);

    // Even on error, try to use trail data
    const fallbackPoints = await getElevationForRoute(start, end, 0.01);

    try {
      const emergencyTrailNetwork = await fetchTrailData(start, end);
      return await optimizeRouteWithTrails(fallbackPoints, emergencyTrailNetwork.trails, options);
    } catch (trailError) {
      console.error('Trail fallback also failed:', trailError);
      return fallbackPoints.map(point => ({
        lat: point.lat,
        lng: point.lng,
        elevation: point.elevation || 0,
      }));
    }
  }
}