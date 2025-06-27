import { Coordinate, RoutePoint, PathfindingNode } from '@/types/route';
import { calculateDistance } from '@/lib/utils';
import { getElevationForRoute } from '@/lib/api/elevation';
import { fetchTrailData, isOnTrail, findNearestTrailPoint, TrailSegment } from '@/lib/api/trails';

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

/**
 * Calculate hiking speed using Tobler's hiking function
 * Speed = 6 * exp(-3.5 * |slope + 0.05|) km/h
 * @param slope Grade as rise/run ratio (not percentage)
 * @returns Speed in km/h
 */
function calculateHikingSpeed(slope: number): number {
  // Tobler's hiking function
  const speed = 6 * Math.exp(-3.5 * Math.abs(slope + 0.05));
  
  // Ensure minimum speed for safety calculations
  return Math.max(speed, 0.5);
}

/**
 * Calculate slope percentage from elevation change and distance
 * @param elevationDiff Elevation change in meters
 * @param distance Horizontal distance in kilometers
 * @returns Slope as rise/run ratio
 */
function calculateSlope(elevationDiff: number, distance: number): number {
  if (distance === 0) return 0;
  
  // Convert distance from km to meters for consistent units
  const distanceMeters = distance * 1000;
  return elevationDiff / distanceMeters;
}

/**
 * Terrain surface types with associated movement costs
 */
enum TerrainType {
  TRAIL = 'trail',
  VEGETATION = 'vegetation', 
  ROCK = 'rock',
  SCREE = 'scree',
  UNKNOWN = 'unknown'
}

/**
 * Terrain surface multipliers for movement cost
 */
const TERRAIN_MULTIPLIERS = {
  [TerrainType.TRAIL]: 0.8,      // Easiest - established paths
  [TerrainType.VEGETATION]: 1.0,  // Normal - grass, forest
  [TerrainType.ROCK]: 1.3,       // Harder - solid rock faces
  [TerrainType.SCREE]: 1.8,      // Hardest - loose rock/debris
  [TerrainType.UNKNOWN]: 1.1     // Slight penalty for uncertainty
};

/**
 * Detect terrain type based on elevation gradient analysis
 * @param slope Current slope ratio
 * @param slopeVariability How much slope changes in nearby area
 * @returns Detected terrain type
 */
function detectTerrainType(slope: number, slopeVariability: number): TerrainType {
  const slopePercentage = Math.abs(slope * 100);
  
  // Very steep with high variability = scree/loose rock
  if (slopePercentage > 40 && slopeVariability > 0.3) {
    return TerrainType.SCREE;
  }
  
  // Steep with low variability = solid rock
  if (slopePercentage > 35 && slopeVariability < 0.15) {
    return TerrainType.ROCK;
  }
  
  // Gentle, consistent slope = likely trail
  if (slopePercentage < 20 && slopeVariability < 0.1) {
    return TerrainType.TRAIL;
  }
  
  // Moderate slope with moderate variability = vegetation
  if (slopePercentage < 30) {
    return TerrainType.VEGETATION;
  }
  
  return TerrainType.UNKNOWN;
}

/**
 * Calculate slope variability in nearby area (simplified version)
 * In a full implementation, this would analyze multiple nearby elevation points
 * @param slope Current slope
 * @returns Estimated slope variability (0-1 scale)
 */
function calculateSlopeVariability(slope: number): number {
  // Simplified heuristic - in practice would need multiple elevation samples
  // Higher absolute slope tends to have higher variability in mountain terrain
  const baseVariability = Math.min(Math.abs(slope) * 2, 0.5);
  
  // Add some randomness to simulate real terrain variation
  const randomFactor = (Math.random() - 0.5) * 0.2;
  
  return Math.max(0, Math.min(1, baseVariability + randomFactor));
}

/**
 * Enhanced movement cost calculation using Tobler's hiking function and terrain analysis
 * @param from Starting coordinate
 * @param to Destination coordinate  
 * @param trails Available trail data for on-trail detection
 * @returns Movement cost considering terrain, slope, and trail availability
 */
function calculateMovementCost(from: Coordinate, to: Coordinate, trails: TrailSegment[] = []): number {
  const distance = calculateDistance(from, to); // in km
  const elevationDiff = (to.elevation || 0) - (from.elevation || 0); // in meters
  
  if (distance === 0) return 0;
  
  const slope = calculateSlope(elevationDiff, distance);
  const slopePercentage = Math.abs(slope * 100);
  
  // Calculate time cost using Tobler's function
  const hikingSpeed = calculateHikingSpeed(slope);
  const timeCost = distance / hikingSpeed; // hours
  
  // Base cost is time in hours converted to cost units
  let cost = timeCost * 10; // Scale factor for A* algorithm
  
  // Check for water bodies and apply massive penalty
  const nearWater = trails.some(trail => 
    trail.isWater && (
      isOnTrail(from, [trail], 0.1) || 
      isOnTrail(to, [trail], 0.1)
    )
  );
  
  if (nearWater) {
    cost *= 50; // Massive penalty for crossing water
  }
  
  // Check if movement is on established trails/roads
  const fromOnTrail = isOnTrail(from, trails, 0.15); // Increased to 150m tolerance
  const toOnTrail = isOnTrail(to, trails, 0.15);
  const onTrailMovement = fromOnTrail && toOnTrail;
  
  // Check if on roads specifically
  const onRoad = trails.some(trail => 
    trail.isRoad && (
      isOnTrail(from, [trail], 0.1) && 
      isOnTrail(to, [trail], 0.1)
    )
  );
  
  // Apply terrain-based cost multiplier
  const slopeVariability = calculateSlopeVariability(slope);
  const terrainType = detectTerrainType(slope, slopeVariability);
  let terrainMultiplier = TERRAIN_MULTIPLIERS[terrainType];
  
  // Aggressive trail/road preference
  if (onRoad) {
    // Roads get the biggest bonus
    cost *= 0.3; // 70% cost reduction for roads
  } else if (onTrailMovement) {
    terrainMultiplier = TERRAIN_MULTIPLIERS[TerrainType.TRAIL];
    
    // Very aggressive trail bonus
    cost *= 0.4; // 60% cost reduction for trails
  } else {
    cost *= terrainMultiplier;
    
    // Heavy penalty for off-trail movement
    cost *= 2.0; // Double cost for going off established paths
  }
  
  // Add exponential penalty for dangerous slopes (>45° ≈ 100% grade)
  if (slopePercentage > 100) {
    const dangerMultiplier = Math.exp((slopePercentage - 100) / 50);
    cost *= dangerMultiplier;
  }
  
  // Additional penalty for very steep terrain (>30° ≈ 58% grade)
  if (slopePercentage > 58) {
    cost *= 1.5;
  }
  
  return cost;
}

/**
 * Calculate appropriate step size based on terrain complexity
 * @param elevation Current elevation
 * @param terrainComplexity Estimated terrain complexity (0-1 scale)
 * @returns Adaptive step size
 */
function calculateAdaptiveStepSize(elevation: number, terrainComplexity: number): number {
  const baseStepSize = 0.002; // ~220m at equator
  const minStepSize = 0.0005; // ~55m for complex terrain
  const maxStepSize = 0.004;  // ~440m for simple terrain
  
  // Reduce step size for complex terrain
  const complexityFactor = 1 - (terrainComplexity * 0.75);
  
  // Reduce step size at higher elevations (more dangerous terrain)
  const elevationFactor = Math.max(0.5, 1 - (elevation / 8000)); // Normalize to 8000m max
  
  const adaptiveStepSize = baseStepSize * complexityFactor * elevationFactor;
  
  return Math.max(minStepSize, Math.min(maxStepSize, adaptiveStepSize));
}

/**
 * Generate neighbors with variable step sizes based on terrain complexity
 * @param current Current coordinate
 * @param elevationPoints Available elevation data for complexity analysis
 * @returns Array of neighbor coordinates
 */
function generateNeighbors(current: Coordinate, elevationPoints: Coordinate[] = []): Coordinate[] {
  const neighbors: Coordinate[] = [];
  
  // Estimate terrain complexity based on nearby elevation variation
  let terrainComplexity = 0.5; // Default moderate complexity
  
  if (elevationPoints.length > 0) {
    // Find nearby points for complexity analysis
    const nearbyPoints = elevationPoints.filter(point => 
      calculateDistance(current, point) < 0.01 // Within ~1km
    );
    
    if (nearbyPoints.length > 2) {
      const elevations = nearbyPoints.map(p => p.elevation || 0);
      const elevationRange = Math.max(...elevations) - Math.min(...elevations);
      const avgElevation = elevations.reduce((sum, e) => sum + e, 0) / elevations.length;
      
      // Higher elevation variation = higher complexity
      terrainComplexity = Math.min(1, elevationRange / Math.max(100, avgElevation * 0.1));
    }
  }
  
  const stepSize = calculateAdaptiveStepSize(current.elevation || 0, terrainComplexity);
  
  // 8-direction movement with adaptive step size
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

/**
 * Optimize a route by snapping points to nearby trails when beneficial
 * @param points Original route points
 * @param trails Available trail segments
 * @returns Optimized route points with trail snapping
 */
function optimizeRouteWithTrails(points: Coordinate[], trails: TrailSegment[]): RoutePoint[] {
  const optimizedPoints: RoutePoint[] = [];
  const maxSnapDistance = 0.5; // Increased to 500m maximum snap distance
  
  // Filter out water bodies for snapping
  const nonWaterTrails = trails.filter(trail => !trail.isWater);
  
  for (let i = 0; i < points.length; i++) {
    const point = points[i];
    
    // Prioritize roads, then trails
    const roadNearest = findNearestTrailPoint(point, trails.filter(t => t.isRoad), maxSnapDistance);
    const trailNearest = findNearestTrailPoint(point, nonWaterTrails.filter(t => !t.isRoad), maxSnapDistance);
    
    let nearest = roadNearest;
    if (!nearest || (trailNearest && trailNearest.distance < nearest.distance)) {
      nearest = trailNearest;
    }
    
    // Aggressively snap to trails/roads
    if (nearest && nearest.distance < maxSnapDistance) {
      // Allow up to 100% distance increase for trail/road benefits
      const originalDistance = i > 0 ? calculateDistance(points[i-1], point) : 0;
      const newDistance = i > 0 ? calculateDistance(points[i-1], nearest.point) : 0;
      
      // Much more aggressive snapping - allow 2x distance increase
      if (newDistance <= originalDistance * 2.0 || originalDistance < 0.1) {
        optimizedPoints.push({
          lat: nearest.point.lat,
          lng: nearest.point.lng,
          elevation: nearest.point.elevation || point.elevation || 0,
        });
        continue;
      }
    }
    
    // Keep original point if no beneficial trail snap found
    optimizedPoints.push({
      lat: point.lat,
      lng: point.lng,
      elevation: point.elevation || 0,
    });
  }
  
  return optimizedPoints;
}

export async function findOptimalRoute(
  start: Coordinate,
  end: Coordinate,
  maxIterations: number = 1000
): Promise<RoutePoint[]> {
  try {
    console.log('Starting pathfinding from', start, 'to', end);
    
    // Fetch both elevation and trail data in parallel
    const [elevationPoints, trailNetwork] = await Promise.all([
      getElevationForRoute(start, end, 0.005),
      fetchTrailData(start, end)
    ]);
    
    console.log(`Found ${trailNetwork.trails.length} trails in area`);
    
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

      const neighbors = generateNeighbors(current.coordinate, elevationPoints);

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

        const gCost = current.gCost + calculateMovementCost(current.coordinate, neighbor, trailNetwork.trails);
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
    
    // Return optimized fallback route with trail data if available
    if (trailNetwork.trails.length > 0) {
      return optimizeRouteWithTrails(elevationPoints, trailNetwork.trails);
    }
    
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