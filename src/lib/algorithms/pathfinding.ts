import { Coordinate, RoutePoint, PathfindingNode } from '@/types/route';
import { calculateDistance } from '@/lib/utils';
import { getElevationForRoute } from '@/lib/api/elevation';

class PriorityQueue {
  private items: PathfindingNode[] = [];

  enqueue(item: PathfindingNode) {
    this.items.push(item);
    this.items.sort((a, b) => a.fCost - b.fCost);
  }

  dequeue(): PathfindingNode | undefined {
    return this.items.shift();
  }

  isEmpty(): boolean {
    return this.items.length === 0;
  }

  contains(coordinate: Coordinate): boolean {
    return this.items.some(item => 
      Math.abs(item.coordinate.lat - coordinate.lat) < 0.0001 &&
      Math.abs(item.coordinate.lng - coordinate.lng) < 0.0001
    );
  }
}

function calculateHeuristic(current: Coordinate, goal: Coordinate): number {
  const distance = calculateDistance(current, goal);
  const elevationPenalty = (current.elevation || 0) * 0.001;
  return distance + elevationPenalty;
}

function calculateMovementCost(from: Coordinate, to: Coordinate): number {
  const distance = calculateDistance(from, to);
  const elevationDiff = (to.elevation || 0) - (from.elevation || 0);
  
  let cost = distance;
  
  if (elevationDiff > 0) {
    cost += elevationDiff * 0.01;
  }
  
  const steepness = Math.abs(elevationDiff) / distance;
  if (steepness > 0.3) {
    cost *= 1.5;
  }
  
  return cost;
}

function generateNeighbors(current: Coordinate, stepSize: number = 0.002): Coordinate[] {
  const neighbors: Coordinate[] = [];
  const directions = [
    [-stepSize, 0], [stepSize, 0], [0, -stepSize], [0, stepSize],
    [-stepSize, -stepSize], [-stepSize, stepSize], [stepSize, -stepSize], [stepSize, stepSize]
  ];

  for (const [dLat, dLng] of directions) {
    neighbors.push({
      lat: current.lat + dLat,
      lng: current.lng + dLng,
      elevation: current.elevation
    });
  }

  return neighbors;
}

function reconstructPath(node: PathfindingNode): RoutePoint[] {
  const path: RoutePoint[] = [];
  let current: PathfindingNode | undefined = node;

  while (current) {
    path.unshift({
      lat: current.coordinate.lat,
      lng: current.coordinate.lng,
      elevation: current.coordinate.elevation || 0,
    });
    current = current.parent;
  }

  return path;
}

export async function findOptimalRoute(
  start: Coordinate,
  end: Coordinate,
  maxIterations: number = 1000
): Promise<RoutePoint[]> {
  try {
    console.log('Starting pathfinding from', start, 'to', end);
    
    const elevationPoints = await getElevationForRoute(start, end, 0.005);
    
    if (elevationPoints.length === 0) {
      throw new Error('Failed to get elevation data');
    }

    const startWithElevation = elevationPoints[0];
    const endWithElevation = elevationPoints[elevationPoints.length - 1];

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

    while (!openSet.isEmpty() && iterations < maxIterations) {
      iterations++;
      
      const current = openSet.dequeue();
      if (!current) break;

      if (calculateDistance(current.coordinate, endWithElevation) < 0.01) {
        console.log(`Path found in ${iterations} iterations`);
        return reconstructPath(current);
      }

      closedSet.push(current.coordinate);

      const neighbors = generateNeighbors(current.coordinate);

      for (const neighbor of neighbors) {
        if (closedSet.some(coord => 
          Math.abs(coord.lat - neighbor.lat) < 0.0001 && 
          Math.abs(coord.lng - neighbor.lng) < 0.0001
        )) {
          continue;
        }

        const elevationPoint = elevationPoints.find(point =>
          Math.abs(point.lat - neighbor.lat) < 0.01 &&
          Math.abs(point.lng - neighbor.lng) < 0.01
        );
        
        if (elevationPoint) {
          neighbor.elevation = elevationPoint.elevation;
        }

        const gCost = current.gCost + calculateMovementCost(current.coordinate, neighbor);
        const hCost = calculateHeuristic(neighbor, endWithElevation);

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

    console.log(`Pathfinding completed with ${iterations} iterations, using fallback route`);
    
    return elevationPoints.map(point => ({
      lat: point.lat,
      lng: point.lng,
      elevation: point.elevation || 0,
    }));

  } catch (error) {
    console.error('Error in pathfinding:', error);
    
    const fallbackPoints = await getElevationForRoute(start, end, 0.01);
    return fallbackPoints.map(point => ({
      lat: point.lat,
      lng: point.lng,
      elevation: point.elevation || 0,
    }));
  }
}