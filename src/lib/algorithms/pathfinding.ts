import { Coordinate, RoutePoint, PathfindingNode } from '@/types/route';
import { PathfindingOptions, DEFAULT_PATHFINDING_OPTIONS } from '@/types/pathfinding';
import { calculateDistance } from '@/lib/utils';
import { getElevationForRoute, getElevation } from '@/lib/api/elevation';
import { fetchTrailData, isOnTrail, findNearestTrailPoint, getTrailsNearCoordinate, TrailSegment, TrailNetwork } from '@/lib/api/trails';
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

// =============================================================================
// PATHFINDING ALGORITHM CONSTANTS
// =============================================================================

/**
 * Constants for A* pathfinding algorithm
 */
const PATHFINDING_CONSTANTS = {
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
 * Constants for trail analysis and optimization
 */
const TRAIL_CONSTANTS = {
  /** Maximum trails to consider for performance (with spatial index) */
  MAX_TRAILS_WITH_INDEX: 20,
  /** Maximum trails to consider for performance (fallback) */
  MAX_TRAILS_FALLBACK: 50,
  /** Trail detection radius in km */
  TRAIL_DETECTION_RADIUS: 0.15,
  /** Road detection radius in km */
  ROAD_DETECTION_RADIUS: 0.1
} as const;

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
      Math.abs(item.coordinate.lat - coordinate.lat) < PATHFINDING_CONSTANTS.COORDINATE_TOLERANCE &&
      Math.abs(item.coordinate.lng - coordinate.lng) < PATHFINDING_CONSTANTS.COORDINATE_TOLERANCE
    );
  }
}

function calculateHeuristic(current: Coordinate, goal: Coordinate): number {
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
function calculateMovementCost(from: Coordinate, to: Coordinate, trailNetwork?: TrailNetwork, options: PathfindingOptions = DEFAULT_PATHFINDING_OPTIONS): number {
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
 * Step size calculation constants
 */
const STEP_SIZE_CONSTANTS = {
  BASE_STEP_SIZE: 0.005,        // ~550m at equator for better trail finding
  MIN_STEP_SIZE: 0.001,         // ~110m for complex terrain
  MAX_STEP_SIZE: 0.01,          // ~1100m for simple terrain
  COMPLEXITY_REDUCTION: 0.5,    // Terrain complexity reduction factor
  MIN_ELEVATION_FACTOR: 0.7,    // Minimum elevation factor
  MAX_ELEVATION_THRESHOLD: 8000 // Maximum elevation for factor calculation
} as const;

/**
 * Calculate appropriate step size based on terrain complexity
 * @param elevation Current elevation
 * @param terrainComplexity Estimated terrain complexity (0-1 scale)
 * @returns Adaptive step size
 */
function calculateAdaptiveStepSize(elevation: number, terrainComplexity: number): number {
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
function generateNeighbors(current: Coordinate, elevationPoints: Coordinate[] = []): Coordinate[] {
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
/**
 * EMERGENCY LINEAR DETECTOR: Force linear route for obvious park/linear paths
 */
function isObviousLinearRoute(start: Coordinate, end: Coordinate, trails: TrailSegment[]): boolean {
  const distance = calculateDistance(start, end);
  
  // Check for typical park route characteristics
  if (distance < 0.3 || distance > 3.0) return false; // Must be reasonable park size
  
  // Check if both points are surrounded by trails (not roads)
  const startNearbyTrails = trails.filter(trail => 
    trail.coordinates.some(coord => calculateDistance(start, coord) <= 0.1) && !trail.isRoad
  );
  
  const endNearbyTrails = trails.filter(trail => 
    trail.coordinates.some(coord => calculateDistance(end, coord) <= 0.1) && !trail.isRoad
  );
  
  // Both points should be near trails (park environment)
  if (startNearbyTrails.length === 0 || endNearbyTrails.length === 0) return false;
  
  // Check trail density along direct line (high trail density = park environment)
  let trailPointsOnLine = 0;
  const checkPoints = 10;
  
  for (let i = 1; i < checkPoints; i++) {
    const ratio = i / checkPoints;
    const checkPoint: Coordinate = {
      lat: start.lat + (end.lat - start.lat) * ratio,
      lng: start.lng + (end.lng - start.lng) * ratio
    };
    
    const hasNearbyTrail = trails.some(trail => 
      !trail.isRoad && trail.coordinates.some(coord => 
        calculateDistance(checkPoint, coord) <= 0.08 // 80m
      )
    );
    
    if (hasNearbyTrail) trailPointsOnLine++;
  }
  
  // If most of the direct line has trails nearby, it's likely a linear park route
  const trailDensity = trailPointsOnLine / checkPoints;
  const isLinearParkRoute = trailDensity >= 0.6; // 60% of route has trails nearby
  
  console.log(`🔍 Linear route analysis: distance=${distance.toFixed(2)}km, trail density=${(trailDensity*100).toFixed(0)}%, linear=${isLinearParkRoute}`);
  
  return isLinearParkRoute;
}

/**
 * FORCE LINEAR ROUTE: Create a direct trail-following path
 */
function createForcedLinearRoute(start: Coordinate, end: Coordinate, trails: TrailSegment[]): Coordinate[] {
  console.log(`📍 FORCING linear route - direct trail path`);
  
  const waypoints = 25; // High density for smooth path
  const path: Coordinate[] = [];
  const snapDistance = 0.06; // 60m snap - aggressive trail following
  
  for (let i = 0; i <= waypoints; i++) {
    const ratio = i / waypoints;
    const directPoint: Coordinate = {
      lat: start.lat + (end.lat - start.lat) * ratio,
      lng: start.lng + (end.lng - start.lng) * ratio
    };
    
    // Find closest trail point (NO roads allowed)
    let closestTrailPoint: Coordinate | null = null;
    let closestDistance = Infinity;
    
    for (const trail of trails) {
      if (trail.isRoad || trail.isWater) continue; // ONLY trails
      
      for (const coord of trail.coordinates) {
        const distance = calculateDistance(directPoint, coord);
        if (distance < closestDistance && distance <= snapDistance) {
          closestDistance = distance;
          closestTrailPoint = coord;
        }
      }
    }
    
    // Use trail point if found, otherwise use direct point
    if (closestTrailPoint) {
      path.push(closestTrailPoint);
    } else {
      path.push(directPoint);
    }
  }
  
  console.log(`⚡ Forced linear route: ${path.length} waypoints, aggressive trail following`);
  return path;
}

/**
 * SIMPLIFIED FALLBACK: Create a simple waypoint-based route using trail sampling
 * This replaces the complex trail graph system with a direct sampling approach
 */
function createSimpleTrailRoute(start: Coordinate, end: Coordinate, trails: TrailSegment[], options: PathfindingOptions = DEFAULT_PATHFINDING_OPTIONS): Coordinate[] {
  console.log(`🔄 Using simplified trail algorithm with ${trails.length} trails`);
  
  // ROADS ONLY MODE: Filter to only roads if requested
  if (options.roadsOnly) {
    const roadTrails = trails.filter(t => t.isRoad && !t.isWater);
    console.log(`🛣️ ROADS ONLY MODE: Using ${roadTrails.length} roads only`);
    trails = roadTrails;
  } else {
    // EMERGENCY LINEAR OVERRIDE: Check if this should be forced linear (only when not roads-only)
    if (isObviousLinearRoute(start, end, trails)) {
      console.log(`⚡ EMERGENCY OVERRIDE: Detected obvious linear route, forcing direct path`);
      return createForcedLinearRoute(start, end, trails);
    }
  }
  
  const path: Coordinate[] = [start];
  const maxWaypoints = 15;
  const snapDistance = 0.15; // 150m snap distance
  
  // Create waypoints along direct line
  for (let i = 1; i < maxWaypoints; i++) {
    const ratio = i / maxWaypoints;
    const waypoint: Coordinate = {
      lat: start.lat + (end.lat - start.lat) * ratio,
      lng: start.lng + (end.lng - start.lng) * ratio
    };
    
    // Find best trail near this waypoint
    let bestSnap: Coordinate | null = null;
    let bestDistance = Infinity;
    let bestIsTrail = false;
    
    for (const trail of trails) {
      if (trail.isWater) continue; // Skip water
      
      // In roads-only mode, skip trails
      if (options.roadsOnly && !trail.isRoad) continue;
      
      for (const coord of trail.coordinates) {
        const distance = calculateDistance(waypoint, coord);
        if (distance <= snapDistance) {
          // In roads-only mode, prefer any road; otherwise prefer trails over roads
          const isTrail = !trail.isRoad;
          const adjustedDistance = options.roadsOnly ? distance : (isTrail ? distance * 0.5 : distance);
          
          if (adjustedDistance < bestDistance) {
            bestDistance = adjustedDistance;
            bestSnap = coord;
            bestIsTrail = isTrail;
          }
        }
      }
    }
    
    // Use snapped point if found, otherwise use direct waypoint
    if (bestSnap) {
      path.push(bestSnap);
      console.log(`📍 Waypoint ${i}: snapped to ${bestIsTrail ? 'trail' : 'road'} (${(bestDistance*1000).toFixed(0)}m)`);
    } else {
      path.push(waypoint);
      console.log(`📍 Waypoint ${i}: direct route (no trails within ${snapDistance*1000}m)`);
    }
  }
  
  path.push(end);
  console.log(`🛤️ Simple trail route created with ${path.length} waypoints`);
  return path;
}

/**
 * Interpolate additional waypoints between existing points for smoother paths
 */
function interpolateWaypoints(waypoints: Coordinate[], targetDistance: number): Coordinate[] {
  if (waypoints.length < 2) return waypoints;
  
  const interpolatedWaypoints: Coordinate[] = [waypoints[0]];
  
  for (let i = 0; i < waypoints.length - 1; i++) {
    const from = waypoints[i];
    const to = waypoints[i + 1];
    const segmentDistance = calculateDistance(from, to);
    
    // If segment is longer than target distance, add intermediate points
    if (segmentDistance > targetDistance) {
      const numIntermediatePoints = Math.ceil(segmentDistance / targetDistance) - 1;
      
      for (let j = 1; j <= numIntermediatePoints; j++) {
        const ratio = j / (numIntermediatePoints + 1);
        const interpolatedPoint: Coordinate = {
          lat: from.lat + (to.lat - from.lat) * ratio,
          lng: from.lng + (to.lng - from.lng) * ratio,
          elevation: from.elevation && to.elevation ? 
            from.elevation + (to.elevation - from.elevation) * ratio : 
            undefined
        };
        interpolatedWaypoints.push(interpolatedPoint);
      }
    }
    
    interpolatedWaypoints.push(to);
  }
  
  console.log(`🔗 Interpolated ${waypoints.length} waypoints to ${interpolatedWaypoints.length} waypoints`);
  return interpolatedWaypoints;
}

/**
 * SIMPLIFIED: Create waypoints using direct trail sampling instead of complex graph
 */
function createSimpleTrailGuidedWaypoints(start: Coordinate, end: Coordinate, trails: TrailSegment[], options: PathfindingOptions = DEFAULT_PATHFINDING_OPTIONS): Coordinate[] {
  // Filter usable trails (no water)
  const usableTrails = trails.filter(t => !t.isWater);
  
  console.log(`🗺️ Simplified routing with ${usableTrails.length} usable trails`);
  
  if (usableTrails.length === 0) {
    console.log(`❌ No usable trails found, using direct route`);
    return [start, end];
  }
  
  // Use simplified trail route instead of complex graph
  const simpleRoute = createSimpleTrailRoute(start, end, usableTrails, options);
  
  // Interpolate to create smoother path
  const interpolatedWaypoints = interpolateWaypoints(simpleRoute, options.waypointDistance);
  
  // Limit to maxWaypoints if specified
  if (interpolatedWaypoints.length > options.maxWaypoints) {
    console.log(`🔢 Limiting ${interpolatedWaypoints.length} waypoints to ${options.maxWaypoints} max`);
    const step = interpolatedWaypoints.length / options.maxWaypoints;
    const limitedWaypoints = [];
    for (let i = 0; i < options.maxWaypoints; i++) {
      const index = Math.floor(i * step);
      limitedWaypoints.push(interpolatedWaypoints[index]);
    }
    // Always include the end point
    if (limitedWaypoints[limitedWaypoints.length - 1] !== interpolatedWaypoints[interpolatedWaypoints.length - 1]) {
      limitedWaypoints[limitedWaypoints.length - 1] = interpolatedWaypoints[interpolatedWaypoints.length - 1];
    }
    return limitedWaypoints;
  }
  
  return interpolatedWaypoints;
}

async function optimizeRouteWithTrails(points: Coordinate[], trails: TrailSegment[], options: PathfindingOptions = DEFAULT_PATHFINDING_OPTIONS): Promise<RoutePoint[]> {
  // If we have trail data, create guided waypoints first using simplified approach
  if (trails.length > 0) {
    const startPoint = points[0];
    const endPoint = points[points.length - 1];
    const guidedWaypoints = createSimpleTrailGuidedWaypoints(startPoint, endPoint, trails, options);
    
    // Use guided waypoints as our base route
    points = guidedWaypoints;
  }
  
  // Get elevation data for all points to ensure accurate elevation chart
  const { getElevationForRoute } = await import('@/lib/api/elevation');
  const elevationPoints = await getElevationForRoute(points[0], points[points.length - 1], 0.005);
  
  const optimizedPoints: RoutePoint[] = [];
  const maxSnapDistance = 1.0; // Increased to 1km maximum snap distance
  
  // Filter out water bodies for snapping, and apply roads-only if requested
  let nonWaterTrails = trails.filter(trail => !trail.isWater);
  if (options.roadsOnly) {
    nonWaterTrails = nonWaterTrails.filter(trail => trail.isRoad);
    console.log(`🛣️ Roads-only mode: filtering to ${nonWaterTrails.length} roads`);
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

/**
 * Check if start and end points can be connected by a linear trail path
 */
function findDirectTrailPath(start: Coordinate, end: Coordinate, trails: TrailSegment[]): Coordinate[] | null {
  const maxSnapDistance = 0.08; // Increased to 80m snap distance
  
  // Find trails near start and end points
  const startTrails = trails.filter(trail => 
    trail.coordinates.some(coord => 
      calculateDistance(start, coord) <= maxSnapDistance
    )
  );
  
  const endTrails = trails.filter(trail => 
    trail.coordinates.some(coord => 
      calculateDistance(end, coord) <= maxSnapDistance
    )
  );
  
  console.log(`🔍 Enhanced path check: ${startTrails.length} start trails, ${endTrails.length} end trails`);
  
  // First try: direct common trails
  const commonTrails = startTrails.filter(startTrail => 
    endTrails.some(endTrail => endTrail.id === startTrail.id)
  );
  
  if (commonTrails.length > 0) {
    console.log(`✅ Found ${commonTrails.length} direct common trails`);
    const bestTrail = commonTrails.reduce((longest, trail) => 
      trail.coordinates.length > longest.coordinates.length ? trail : longest
    );
    
    return extractTrailSegment(start, end, bestTrail);
  }
  
  // Second try: Chain connected trail segments for linear paths
  console.log(`🔗 Attempting trail chaining for linear path...`);
  
  // Check if this looks like a linear route (start and end roughly aligned)
  const directDistance = calculateDistance(start, end);
  const bearing = calculateBearing(start, end);
  
  if (directDistance > 2.0) { // Only for routes > 2km
    console.log(`📏 Route too long (${directDistance.toFixed(2)}km) for trail chaining`);
    return null;
  }
  
  // Try to find a chain of trails that connects start to end
  const chainedPath = findTrailChain(start, end, startTrails, endTrails, trails, bearing);
  if (chainedPath && chainedPath.length > 2) {
    console.log(`🔗 Found chained trail path with ${chainedPath.length} waypoints`);
    return chainedPath;
  }
  
  // Third try: Linear interpolation with trail snapping for obvious linear routes
  if (isLinearRoute(start, end, startTrails, endTrails)) {
    console.log(`📐 Detected linear route, using trail-snapped interpolation`);
    return createLinearTrailPath(start, end, trails);
  }
  
  return null;
}

/**
 * Extract path segment from a single trail between start and end points
 */
function extractTrailSegment(start: Coordinate, end: Coordinate, trail: TrailSegment): Coordinate[] {
  let startIndex = -1;
  let endIndex = -1;
  let startDistance = Infinity;
  let endDistance = Infinity;
  
  trail.coordinates.forEach((coord, index) => {
    const distToStart = calculateDistance(start, coord);
    const distToEnd = calculateDistance(end, coord);
    
    if (distToStart < startDistance) {
      startDistance = distToStart;
      startIndex = index;
    }
    
    if (distToEnd < endDistance) {
      endDistance = distToEnd;
      endIndex = index;
    }
  });
  
  if (startIndex === -1 || endIndex === -1) return [];
  
  const minIndex = Math.min(startIndex, endIndex);
  const maxIndex = Math.max(startIndex, endIndex);
  const pathSegment = trail.coordinates.slice(minIndex, maxIndex + 1);
  
  if (startIndex > endIndex) {
    pathSegment.reverse();
  }
  
  console.log(`✂️ Extracted trail segment: ${pathSegment.length} waypoints from index ${minIndex} to ${maxIndex}`);
  return pathSegment;
}

/**
 * Find a chain of connected trail segments from start to end
 */
function findTrailChain(start: Coordinate, end: Coordinate, startTrails: TrailSegment[], endTrails: TrailSegment[], allTrails: TrailSegment[], targetBearing: number): Coordinate[] | null {
  // Start with the best start trail (closest to start point and aligned with target direction)
  let bestStartTrail = null;
  let bestStartScore = Infinity;
  
  for (const trail of startTrails) {
    const closestPoint = findClosestPointOnTrail(start, trail);
    if (!closestPoint) continue;
    
    const distance = calculateDistance(start, closestPoint);
    const trailBearing = calculateTrailBearing(trail);
    const bearingDiff = Math.abs(targetBearing - trailBearing);
    const score = distance + bearingDiff * 0.01; // Favor aligned trails
    
    if (score < bestStartScore) {
      bestStartScore = score;
      bestStartTrail = trail;
    }
  }
  
  if (!bestStartTrail) return null;
  
  // Try to build a path using connected trail segments
  const path: Coordinate[] = [];
  const usedTrails = new Set<string>();
  let currentTrail = bestStartTrail;
  const maxChainLength = 5; // Prevent infinite loops
  
  for (let i = 0; i < maxChainLength; i++) {
    if (usedTrails.has(currentTrail.id)) break;
    usedTrails.add(currentTrail.id);
    
    // Add this trail's coordinates to path
    const trailSegment = extractTrailSegment(i === 0 ? start : path[path.length - 1], end, currentTrail);
    if (trailSegment.length === 0) break;
    
    if (i === 0) {
      path.push(...trailSegment);
    } else {
      // Skip first point to avoid duplication
      path.push(...trailSegment.slice(1));
    }
    
    // Check if we're close enough to end
    const lastPoint = path[path.length - 1];
    if (calculateDistance(lastPoint, end) <= 0.1) {
      console.log(`🎯 Trail chain reached destination with ${path.length} total waypoints`);
      return path;
    }
    
    // Find next connected trail segment
    const nextTrail = findConnectedTrail(currentTrail, allTrails, usedTrails, end);
    if (!nextTrail) break;
    
    currentTrail = nextTrail;
  }
  
  return path.length > 2 ? path : null;
}

/**
 * Check if this looks like a linear route through a park
 */
function isLinearRoute(start: Coordinate, end: Coordinate, startTrails: TrailSegment[], endTrails: TrailSegment[]): boolean {
  const distance = calculateDistance(start, end);
  
  // Must be reasonable distance for linear path
  if (distance < 0.5 || distance > 2.0) return false;
  
  // Both points should be on trails (not roads)
  const startOnTrails = startTrails.some(t => !t.isRoad);
  const endOnTrails = endTrails.some(t => !t.isRoad);
  
  return startOnTrails && endOnTrails;
}

/**
 * Create a linear path with trail snapping for obvious linear routes
 */
function createLinearTrailPath(start: Coordinate, end: Coordinate, trails: TrailSegment[]): Coordinate[] {
  const steps = 20; // Create waypoints along direct line
  const path: Coordinate[] = [];
  const snapDistance = 0.05; // 50m snap distance
  
  for (let i = 0; i <= steps; i++) {
    const ratio = i / steps;
    const interpolated: Coordinate = {
      lat: start.lat + (end.lat - start.lat) * ratio,
      lng: start.lng + (end.lng - start.lng) * ratio
    };
    
    // Try to snap to nearby trail
    let snapped = false;
    for (const trail of trails) {
      if (trail.isRoad) continue; // Only snap to trails, not roads
      
      for (const coord of trail.coordinates) {
        if (calculateDistance(interpolated, coord) <= snapDistance) {
          path.push(coord);
          snapped = true;
          break;
        }
      }
      if (snapped) break;
    }
    
    if (!snapped) {
      path.push(interpolated);
    }
  }
  
  console.log(`📐 Created linear trail path with ${path.length} waypoints`);
  return path;
}

/**
 * Helper functions for trail analysis
 */
function calculateBearing(from: Coordinate, to: Coordinate): number {
  const dLng = (to.lng - from.lng) * Math.PI / 180;
  const lat1 = from.lat * Math.PI / 180;
  const lat2 = to.lat * Math.PI / 180;
  
  const y = Math.sin(dLng) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
  
  return (Math.atan2(y, x) * 180 / Math.PI + 360) % 360;
}

function calculateTrailBearing(trail: TrailSegment): number {
  if (trail.coordinates.length < 2) return 0;
  const start = trail.coordinates[0];
  const end = trail.coordinates[trail.coordinates.length - 1];
  return calculateBearing(start, end);
}

function findClosestPointOnTrail(point: Coordinate, trail: TrailSegment): Coordinate | null {
  let closest = null;
  let minDistance = Infinity;
  
  for (const coord of trail.coordinates) {
    const distance = calculateDistance(point, coord);
    if (distance < minDistance) {
      minDistance = distance;
      closest = coord;
    }
  }
  
  return closest;
}

function findConnectedTrail(currentTrail: TrailSegment, allTrails: TrailSegment[], usedTrails: Set<string>, target: Coordinate): TrailSegment | null {
  const currentEnd = currentTrail.coordinates[currentTrail.coordinates.length - 1];
  
  let bestTrail = null;
  let bestScore = Infinity;
  
  for (const trail of allTrails) {
    if (usedTrails.has(trail.id) || trail.isRoad) continue;
    
    // Check if this trail connects to current trail
    const trailStart = trail.coordinates[0];
    const connectionDist = calculateDistance(currentEnd, trailStart);
    
    if (connectionDist <= 0.1) { // 100m max connection distance
      // Score based on connection distance and progress toward target
      const progressScore = calculateDistance(trailStart, target);
      const score = connectionDist + progressScore * 0.1;
      
      if (score < bestScore) {
        bestScore = score;
        bestTrail = trail;
      }
    }
  }
  
  return bestTrail;
}

export async function findOptimalRoute(
  start: Coordinate,
  end: Coordinate,
  options: PathfindingOptions = DEFAULT_PATHFINDING_OPTIONS
): Promise<RoutePoint[]> {
  const startTime = performance.now();
  try {
    console.log('🚀 Starting pathfinding from', start, 'to', end);
    
    // Fetch both elevation and trail data in parallel
    const dataFetchStart = performance.now();
    const [elevationPoints, trailNetwork] = await Promise.all([
      getElevationForRoute(start, end, 0.005),
      fetchTrailData(start, end)
    ]);
    const dataFetchTime = performance.now() - dataFetchStart;
    console.log(`⏱️ Data fetch took ${dataFetchTime.toFixed(2)}ms`);
    console.log(`📍 Found ${elevationPoints.length} elevation points, ${trailNetwork.trails.length} trails in area`);
    
    // TRY DIRECT TRAIL PATH FIRST - for linear routes like parks
    const directPath = findDirectTrailPath(start, end, trailNetwork.trails);
    if (directPath && directPath.length > 2) {
      console.log(`🎯 Using direct trail path with ${directPath.length} waypoints`);
      
      // Add elevation data to the direct path
      try {
        const elevations = await getElevation(directPath);
        const routePoints: RoutePoint[] = directPath.map((coord, index) => ({
          ...coord,
          elevation: elevations[index] || 0,
        }));
        
        const totalTime = performance.now() - startTime;
        console.log(`🏁 Direct path completed in ${totalTime.toFixed(2)}ms`);
        return routePoints;
      } catch {
        console.warn('⚠️ Elevation fetch failed for direct path, using trail graph fallback');
      }
    }
    
    if (elevationPoints.length === 0) {
      throw new Error('Failed to get elevation data');
    }

    const pathfindingStart = performance.now();
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

    while (!openSet.isEmpty() && iterations < options.maxIterations) {
      iterations++;
      
      const current = openSet.dequeue();
      if (!current) break;

      if (calculateDistance(current.coordinate, endWithElevation) < PATHFINDING_CONSTANTS.GOAL_DISTANCE_THRESHOLD) {
        const pathfindingTime = performance.now() - pathfindingStart;
        console.log(`✅ Path found in ${iterations} iterations (${pathfindingTime.toFixed(2)}ms)`);
        const reconstructStart = performance.now();
        const result = reconstructPath(current);
        const reconstructTime = performance.now() - reconstructStart;
        console.log(`🔄 Path reconstruction took ${reconstructTime.toFixed(2)}ms`);
        const totalTime = performance.now() - startTime;
        console.log(`🏁 Total pathfinding time: ${totalTime.toFixed(2)}ms`);
        return result;
      }

      closedSet.push(current.coordinate);

      const neighborsStart = performance.now();
      const neighbors = generateNeighbors(current.coordinate, elevationPoints);
      const neighborsTime = performance.now() - neighborsStart;
      
      if (iterations % 100 === 0) {
        console.log(`⏳ Iteration ${iterations}, neighbors generation: ${neighborsTime.toFixed(2)}ms`);
      }

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

        const costStart = performance.now();
        const gCost = current.gCost + calculateMovementCost(current.coordinate, neighbor, trailNetwork, options);
        const costTime = performance.now() - costStart;
        
        if (iterations % 100 === 0 && costTime > 1) {
          console.log(`💰 Cost calculation took ${costTime.toFixed(2)}ms for iteration ${iterations}`);
        }
        
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

    const pathfindingTime = performance.now() - pathfindingStart;
    console.log(`❌ Pathfinding completed with ${iterations} iterations (${pathfindingTime.toFixed(2)}ms), using fallback route`);
    
    // ALWAYS use trail optimization for fallback routes
    const fallbackStart = performance.now();
    console.log('🔄 Using trail-optimized fallback route');
    const result = await optimizeRouteWithTrails(elevationPoints, trailNetwork.trails, options);
    const fallbackTime = performance.now() - fallbackStart;
    console.log(`🔄 Trail optimization took ${fallbackTime.toFixed(2)}ms`);
    const totalTime = performance.now() - startTime;
    console.log(`🏁 Total time (with fallback): ${totalTime.toFixed(2)}ms`);
    return result;

  } catch (error) {
    console.error('Error in pathfinding:', error);
    
    // Even on error, try to use trail data
    console.log('Error fallback: attempting trail optimization');
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