import { Coordinate, RoutePoint, PathfindingNode } from '@/types/route';
import { PathfindingOptions, DEFAULT_PATHFINDING_OPTIONS } from '@/types/pathfinding';
import { calculateDistance } from '@/lib/utils';
import { isOnTrail, findNearestTrailPoint, getTrailsNearCoordinate, TrailSegment, TrailNetwork } from '@/lib/api/trails';
import { 
  TERRAIN_MULTIPLIERS, 
  calculateSlope, 
  calculateHikingSpeed, 
  calculateSlopeVariability, 
  detectTerrainType,
  calculateTerrainComplexity,
  CONVERSION_CONSTANTS,
  SLOPE_THRESHOLDS
} from '@/lib/algorithms/pathfinding/terrain/terrain-analyzer';
import { TRAIL_CONSTANTS } from './trail-detection';

/**
 * Constants for A* pathfinding algorithm
 */
export const PATHFINDING_CONSTANTS = {
  /** Coordinate comparison tolerance for pathfinding nodes */
  COORDINATE_TOLERANCE: 0.0001,
  /** Elevation penalty factor for heuristic calculation */
  ELEVATION_PENALTY_FACTOR: 0.001,
  /** Time cost scaling factor for A* algorithm */
  TIME_COST_SCALE_FACTOR: 10,
  /** Goal distance threshold for pathfinding completion */
  GOAL_DISTANCE_THRESHOLD: 0.01,
  /** Danger slope penalty exponent divisor */
  DANGER_SLOPE_DIVISOR: 50,
  /** Very steep terrain penalty multiplier */
  STEEP_TERRAIN_PENALTY: 1.5
} as const;

/**
 * Step size calculation constants
 */
export const STEP_SIZE_CONSTANTS = {
  BASE_STEP_SIZE: 0.005,        // ~550m at equator for better trail finding
  MIN_STEP_SIZE: 0.001,         // ~110m for complex terrain
  MAX_STEP_SIZE: 0.01,          // ~1100m for simple terrain
  COMPLEXITY_REDUCTION: 0.5,    // Terrain complexity reduction factor
  MIN_ELEVATION_FACTOR: 0.7,    // Minimum elevation factor
  MAX_ELEVATION_THRESHOLD: 8000 // Maximum elevation for factor calculation
} as const;

/**
 * Calculate heuristic cost for A* pathfinding
 */
export function calculateHeuristic(current: Coordinate, goal: Coordinate): number {
  const distance = calculateDistance(current, goal);
  const elevationPenalty = (current.elevation || 0) * PATHFINDING_CONSTANTS.ELEVATION_PENALTY_FACTOR;
  return distance + elevationPenalty;
}

/**
 * Enhanced movement cost calculation using Tobler's hiking function and terrain analysis
 * @param from Starting coordinate
 * @param to Destination coordinate  
 * @param trailNetwork Available trail network with spatial index
 * @param options Pathfinding options for cost adjustments
 * @returns Movement cost considering terrain, slope, and trail availability
 */
export function calculateMovementCost(from: Coordinate, to: Coordinate, trailNetwork?: TrailNetwork, options: PathfindingOptions = DEFAULT_PATHFINDING_OPTIONS): number {
  const distance = calculateDistance(from, to); // in km
  const elevationDiff = (to.elevation || 0) - (from.elevation || 0); // in meters
  
  if (distance === 0) return 0;
  
  const slope = calculateSlope(elevationDiff, distance);
  const slopePercentage = Math.abs(slope * 100);
  
  // Calculate time cost using Tobler's function
  const hikingSpeed = calculateHikingSpeed(slope);
  const timeCost = distance / hikingSpeed; // hours
  
  // Base cost is time in hours converted to cost units
  let cost = timeCost * PATHFINDING_CONSTANTS.TIME_COST_SCALE_FACTOR;
  
  // PERFORMANCE FIX: Use spatial index for fast nearby trail lookup
  let nearbyTrails: TrailSegment[] = [];
  if (trailNetwork && trailNetwork.spatialIndex) {
    nearbyTrails = getTrailsNearCoordinate(from, trailNetwork.spatialIndex, trailNetwork.bbox).slice(0, TRAIL_CONSTANTS.MAX_TRAILS_WITH_INDEX);
  } else if (trailNetwork) {
    // Fallback: limit trails for performance
    nearbyTrails = trailNetwork.trails.slice(0, TRAIL_CONSTANTS.MAX_TRAILS_FALLBACK);
  }
  
  // Quick trail checking with limited trails
  const fromOnTrail = nearbyTrails.length > 0 ? isOnTrail(from, nearbyTrails, TRAIL_CONSTANTS.TRAIL_DETECTION_RADIUS) : false;
  const toOnTrail = nearbyTrails.length > 0 ? isOnTrail(to, nearbyTrails, TRAIL_CONSTANTS.TRAIL_DETECTION_RADIUS) : false;
  const onTrailMovement = fromOnTrail && toOnTrail;
  
  // Apply terrain-based cost multiplier
  const slopeVariability = calculateSlopeVariability(slope);
  const terrainType = detectTerrainType(slope, slopeVariability);
  const terrainMultiplier = TERRAIN_MULTIPLIERS[terrainType];
  
  // Apply configurable trail/road benefits
  if (onTrailMovement) {
    // Check if it's a road in our limited set
    const onRoad = nearbyTrails.some(trail => 
      trail.isRoad && isOnTrail(from, [trail], TRAIL_CONSTANTS.ROAD_DETECTION_RADIUS)
    );
    
    if (onRoad) {
      cost *= options.roadBonus; // Configurable road cost reduction
    } else {
      cost *= options.trailBonus; // Configurable trail cost reduction
    }
  } else {
    cost *= terrainMultiplier;
    cost *= options.offTrailPenalty; // Configurable off-trail penalty
  }
  
  // Add exponential penalty for dangerous slopes
  if (slopePercentage > SLOPE_THRESHOLDS.DANGEROUS) {
    const dangerMultiplier = Math.exp((slopePercentage - SLOPE_THRESHOLDS.DANGEROUS) / PATHFINDING_CONSTANTS.DANGER_SLOPE_DIVISOR);
    cost *= dangerMultiplier;
  }
  
  // Additional penalty for very steep terrain
  if (slopePercentage > SLOPE_THRESHOLDS.VERY_STEEP_GRADE) {
    cost *= PATHFINDING_CONSTANTS.STEEP_TERRAIN_PENALTY;
  }
  
  return cost;
}

/**
 * Calculate appropriate step size based on terrain complexity
 * @param elevation Current elevation
 * @param terrainComplexity Estimated terrain complexity (0-1 scale)
 * @returns Adaptive step size
 */
export function calculateAdaptiveStepSize(elevation: number, terrainComplexity: number): number {
  // Reduce step size for complex terrain
  const complexityFactor = 1 - (terrainComplexity * STEP_SIZE_CONSTANTS.COMPLEXITY_REDUCTION);
  
  // Reduce step size at higher elevations (more dangerous terrain)
  const elevationFactor = Math.max(
    STEP_SIZE_CONSTANTS.MIN_ELEVATION_FACTOR, 
    1 - (elevation / STEP_SIZE_CONSTANTS.MAX_ELEVATION_THRESHOLD)
  );
  
  const adaptiveStepSize = STEP_SIZE_CONSTANTS.BASE_STEP_SIZE * complexityFactor * elevationFactor;
  
  return Math.max(
    STEP_SIZE_CONSTANTS.MIN_STEP_SIZE, 
    Math.min(STEP_SIZE_CONSTANTS.MAX_STEP_SIZE, adaptiveStepSize)
  );
}

/**
 * Generate neighbors with variable step sizes based on terrain complexity
 * @param current Current coordinate
 * @param elevationPoints Available elevation data for complexity analysis
 * @returns Array of neighbor coordinates
 */
export function generateNeighbors(current: Coordinate, elevationPoints: Coordinate[] = []): Coordinate[] {
  const neighbors: Coordinate[] = [];
  
  // Calculate terrain complexity using the terrain analyzer
  const terrainComplexity = calculateTerrainComplexity({
    coordinate: current,
    elevationPoints,
    analysisRadius: CONVERSION_CONSTANTS.NEARBY_POINT_THRESHOLD
  });
  
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

/**
 * Reconstruct path from final pathfinding node
 */
export function reconstructPath(node: PathfindingNode): RoutePoint[] {
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
export async function optimizeRouteWithTrails(points: Coordinate[], trails: TrailSegment[], options: PathfindingOptions = DEFAULT_PATHFINDING_OPTIONS): Promise<RoutePoint[]> {
  // Get elevation data for all points to ensure accurate elevation chart
  const { getElevationForRoute } = await import('@/lib/api/elevation');
  const elevationPoints = await getElevationForRoute(points[0], points[points.length - 1], 0.005);
  
  const optimizedPoints: RoutePoint[] = [];
  const maxSnapDistance = 1.0; // Increased to 1km maximum snap distance
  
  // Filter out water bodies for snapping, and apply roads-only if requested
  let nonWaterTrails = trails.filter(trail => !trail.isWater);
  if (options.roadsOnly) {
    nonWaterTrails = nonWaterTrails.filter(trail => trail.isRoad);
  }
  
  for (let i = 0; i < points.length; i++) {
    const point = points[i];
    
    // Find elevation data for this point
    let elevation = point.elevation || 0;
    if (elevationPoints.length > 0) {
      const nearestElevationPoint = elevationPoints.reduce((closest, elevPoint) => {
        const currentDistance = calculateDistance(point, elevPoint);
        const closestDistance = calculateDistance(point, closest);
        return currentDistance < closestDistance ? elevPoint : closest;
      });
      elevation = nearestElevationPoint.elevation || elevation;
    }
    
    // Prioritize roads, then trails (unless roads-only mode)
    const roadNearest = findNearestTrailPoint(point, trails.filter(t => t.isRoad), maxSnapDistance);
    const trailNearest = options.roadsOnly ? null : findNearestTrailPoint(point, nonWaterTrails.filter(t => !t.isRoad), maxSnapDistance);
    
    let nearest = roadNearest;
    if (!nearest || (trailNearest && trailNearest.distance < nearest.distance)) {
      nearest = trailNearest;
    }
    
    // Extremely aggressive snapping to trails/roads
    if (nearest && nearest.distance < maxSnapDistance) {
      optimizedPoints.push({
        lat: nearest.point.lat,
        lng: nearest.point.lng,
        elevation: nearest.point.elevation || elevation,
      });
    } else {
      // Keep original point if no trail snap found
      optimizedPoints.push({
        lat: point.lat,
        lng: point.lng,
        elevation: elevation,
      });
    }
  }
  
  return optimizedPoints;
}