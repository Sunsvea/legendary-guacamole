import { Coordinate } from '@/types/route';
import { PathfindingOptions, DEFAULT_PATHFINDING_OPTIONS } from '@/types/pathfinding';
import { calculateDistance } from '@/lib/utils';
import { TrailSegment } from '@/lib/api/trails';

/**
 * Constants for trail analysis and optimization
 */
export const TRAIL_CONSTANTS = {
  /** Maximum trails to consider for performance (with spatial index) */
  MAX_TRAILS_WITH_INDEX: 20,
  /** Maximum trails to consider for performance (fallback) */
  MAX_TRAILS_FALLBACK: 50,
  /** Trail detection radius in km */
  TRAIL_DETECTION_RADIUS: 0.15,
  /** Road detection radius in km */
  ROAD_DETECTION_RADIUS: 0.1
} as const;

/**
 * EMERGENCY LINEAR DETECTOR: Force linear route for obvious park/linear paths
 */
export function isObviousLinearRoute(start: Coordinate, end: Coordinate, trails: TrailSegment[]): boolean {
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
export function createForcedLinearRoute(start: Coordinate, end: Coordinate, trails: TrailSegment[]): Coordinate[] {
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
export function createSimpleTrailRoute(start: Coordinate, end: Coordinate, trails: TrailSegment[], options: PathfindingOptions = DEFAULT_PATHFINDING_OPTIONS): Coordinate[] {
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
export function interpolateWaypoints(waypoints: Coordinate[], targetDistance: number): Coordinate[] {
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
export function createSimpleTrailGuidedWaypoints(start: Coordinate, end: Coordinate, trails: TrailSegment[], options: PathfindingOptions = DEFAULT_PATHFINDING_OPTIONS): Coordinate[] {
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

/**
 * Check if start and end points can be connected by a linear trail path
 */
export function findDirectTrailPath(start: Coordinate, end: Coordinate, trails: TrailSegment[]): Coordinate[] | null {
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
export function extractTrailSegment(start: Coordinate, end: Coordinate, trail: TrailSegment): Coordinate[] {
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
export function findTrailChain(start: Coordinate, end: Coordinate, startTrails: TrailSegment[], endTrails: TrailSegment[], allTrails: TrailSegment[], targetBearing: number): Coordinate[] | null {
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
export function isLinearRoute(start: Coordinate, end: Coordinate, startTrails: TrailSegment[], endTrails: TrailSegment[]): boolean {
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
export function createLinearTrailPath(start: Coordinate, end: Coordinate, trails: TrailSegment[]): Coordinate[] {
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
export function calculateBearing(from: Coordinate, to: Coordinate): number {
  const dLng = (to.lng - from.lng) * Math.PI / 180;
  const lat1 = from.lat * Math.PI / 180;
  const lat2 = to.lat * Math.PI / 180;
  
  const y = Math.sin(dLng) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
  
  return (Math.atan2(y, x) * 180 / Math.PI + 360) % 360;
}

export function calculateTrailBearing(trail: TrailSegment): number {
  if (trail.coordinates.length < 2) return 0;
  const start = trail.coordinates[0];
  const end = trail.coordinates[trail.coordinates.length - 1];
  return calculateBearing(start, end);
}

export function findClosestPointOnTrail(point: Coordinate, trail: TrailSegment): Coordinate | null {
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

export function findConnectedTrail(currentTrail: TrailSegment, allTrails: TrailSegment[], usedTrails: Set<string>, target: Coordinate): TrailSegment | null {
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