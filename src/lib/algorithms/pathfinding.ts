import { Coordinate, RoutePoint, PathfindingNode } from '@/types/route';
import { calculateDistance } from '@/lib/utils';
import { getElevationForRoute } from '@/lib/api/elevation';
import { fetchTrailData, isOnTrail, findNearestTrailPoint, getTrailsNearCoordinate, TrailSegment, TrailNetwork } from '@/lib/api/trails';

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
 * @param trailNetwork Available trail network with spatial index
 * @returns Movement cost considering terrain, slope, and trail availability
 */
function calculateMovementCost(from: Coordinate, to: Coordinate, trailNetwork?: TrailNetwork): number {
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
  
  // PERFORMANCE FIX: Use spatial index for fast nearby trail lookup
  let nearbyTrails: TrailSegment[] = [];
  if (trailNetwork && trailNetwork.spatialIndex) {
    nearbyTrails = getTrailsNearCoordinate(from, trailNetwork.spatialIndex, trailNetwork.bbox).slice(0, 20);
  } else if (trailNetwork) {
    // Fallback: limit to first 50 trails for performance
    nearbyTrails = trailNetwork.trails.slice(0, 50);
  }
  
  // Quick trail checking with limited trails
  const fromOnTrail = nearbyTrails.length > 0 ? isOnTrail(from, nearbyTrails, 0.15) : false;
  const toOnTrail = nearbyTrails.length > 0 ? isOnTrail(to, nearbyTrails, 0.15) : false;
  const onTrailMovement = fromOnTrail && toOnTrail;
  
  // Apply terrain-based cost multiplier
  const slopeVariability = calculateSlopeVariability(slope);
  const terrainType = detectTerrainType(slope, slopeVariability);
  const terrainMultiplier = TERRAIN_MULTIPLIERS[terrainType];
  
  // Simplified trail/road benefits
  if (onTrailMovement) {
    // Check if it's a road in our limited set
    const onRoad = nearbyTrails.some(trail => 
      trail.isRoad && isOnTrail(from, [trail], 0.1)
    );
    
    if (onRoad) {
      cost *= 0.3; // 70% cost reduction for roads
    } else {
      cost *= 0.4; // 60% cost reduction for trails
    }
  } else {
    cost *= terrainMultiplier;
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
  const baseStepSize = 0.005; // Increased to ~550m at equator for better trail finding
  const minStepSize = 0.001;  // ~110m for complex terrain
  const maxStepSize = 0.01;   // ~1100m for simple terrain
  
  // Reduce step size for complex terrain
  const complexityFactor = 1 - (terrainComplexity * 0.5); // Less reduction
  
  // Reduce step size at higher elevations (more dangerous terrain)
  const elevationFactor = Math.max(0.7, 1 - (elevation / 8000)); // Less reduction
  
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
/**
 * Create intermediate waypoints to guide route through trail network
 */
function createTrailGuidedWaypoints(start: Coordinate, end: Coordinate, trails: TrailSegment[]): Coordinate[] {
  const waypoints = [start];
  const maxWaypointDistance = 5.0; // Increased to 5km to reduce waypoints
  const trailSearchRadius = 2.0; // 2km search radius for trails
  
  // Filter usable trails (no water) and limit to first 20 for performance
  const usableTrails = trails.filter(t => !t.isWater).slice(0, 20);
  
  // Calculate total distance and number of waypoints needed
  const totalDistance = calculateDistance(start, end);
  const numWaypoints = Math.min(3, Math.max(1, Math.floor(totalDistance / maxWaypointDistance))); // Max 3 waypoints
  
  for (let i = 1; i < numWaypoints; i++) {
    const progress = i / numWaypoints;
    
    // Linear interpolation point
    const interpolatedPoint: Coordinate = {
      lat: start.lat + (end.lat - start.lat) * progress,
      lng: start.lng + (end.lng - start.lng) * progress,
    };
    
    // Find nearest trail to this interpolated point
    const nearestTrail = findNearestTrailPoint(interpolatedPoint, usableTrails, trailSearchRadius);
    
    if (nearestTrail) {
      waypoints.push(nearestTrail.point);
    } else {
      waypoints.push(interpolatedPoint);
    }
  }
  
  waypoints.push(end);
  return waypoints;
}

function optimizeRouteWithTrails(points: Coordinate[], trails: TrailSegment[]): RoutePoint[] {
  // If we have trail data, create guided waypoints first
  if (trails.length > 0) {
    const startPoint = points[0];
    const endPoint = points[points.length - 1];
    const guidedWaypoints = createTrailGuidedWaypoints(startPoint, endPoint, trails);
    
    // Use guided waypoints as our base route
    points = guidedWaypoints;
  }
  
  const optimizedPoints: RoutePoint[] = [];
  const maxSnapDistance = 1.0; // Increased to 1km maximum snap distance
  
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
    
    // Extremely aggressive snapping to trails/roads
    if (nearest && nearest.distance < maxSnapDistance) {
      optimizedPoints.push({
        lat: nearest.point.lat,
        lng: nearest.point.lng,
        elevation: nearest.point.elevation || point.elevation || 0,
      });
    } else {
      // Keep original point if no trail snap found
      optimizedPoints.push({
        lat: point.lat,
        lng: point.lng,
        elevation: point.elevation || 0,
      });
    }
  }
  
  return optimizedPoints;
}

export async function findOptimalRoute(
  start: Coordinate,
  end: Coordinate,
  maxIterations: number = 500
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

    while (!openSet.isEmpty() && iterations < maxIterations) {
      iterations++;
      
      const current = openSet.dequeue();
      if (!current) break;

      if (calculateDistance(current.coordinate, endWithElevation) < 0.01) {
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

        const costStart = performance.now();
        const gCost = current.gCost + calculateMovementCost(current.coordinate, neighbor, trailNetwork);
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
    const result = optimizeRouteWithTrails(elevationPoints, trailNetwork.trails);
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
      return optimizeRouteWithTrails(fallbackPoints, emergencyTrailNetwork.trails);
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