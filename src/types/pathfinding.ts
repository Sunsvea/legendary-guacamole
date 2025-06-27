export interface PathfindingOptions {
  maxIterations: number;
  offTrailPenalty: number;     // Multiplier for off-trail movement (1.0 = no penalty, 2.0 = double cost)
  trailBonus: number;          // Cost reduction for trails (0.4 = 60% reduction)
  roadBonus: number;           // Cost reduction for roads (0.3 = 70% reduction) 
  maxWaypoints: number;        // Maximum waypoints for trail guidance
  waypointDistance: number;    // Distance between waypoints in km
  roadsOnly: boolean;          // If true, only use roads, ignore all trails/paths
}

export const DEFAULT_PATHFINDING_OPTIONS: PathfindingOptions = {
  maxIterations: 500,
  offTrailPenalty: 2.0,
  trailBonus: 0.4,
  roadBonus: 0.3,
  maxWaypoints: 50,  // Reasonable default
  waypointDistance: 0.01,  // 10m intervals - reasonable performance
  roadsOnly: false,  // Default to using all available paths
};

// Preset configurations for common use cases
export const PATHFINDING_PRESETS = {
  FAVOR_TRAILS_HEAVILY: {
    maxIterations: 1500,
    offTrailPenalty: 5.0,
    trailBonus: 0.1,    // 90% cost reduction
    roadBonus: 0.05,    // 95% cost reduction
    maxWaypoints: 100,
    waypointDistance: 0.005,  // 5m intervals - very detailed
    roadsOnly: false,
  },
  FAVOR_TRAILS_MODERATELY: {
    maxIterations: 1000,
    offTrailPenalty: 3.0,
    trailBonus: 0.3,    // 70% cost reduction
    roadBonus: 0.2,     // 80% cost reduction
    maxWaypoints: 75,
    waypointDistance: 0.01,   // 10m intervals
    roadsOnly: false,
  },
  FAVOR_TRAILS_LITTLE: {
    maxIterations: 500,
    offTrailPenalty: 1.5,
    trailBonus: 0.7,    // 30% cost reduction
    roadBonus: 0.6,     // 40% cost reduction
    maxWaypoints: 50,
    waypointDistance: 0.02,    // 20m intervals
    roadsOnly: false,
  },
  DIRECT_ROUTE: {
    maxIterations: 300,
    offTrailPenalty: 1.0,
    trailBonus: 0.9,    // 10% cost reduction
    roadBonus: 0.8,     // 20% cost reduction
    maxWaypoints: 10,
    waypointDistance: 0.05,    // 50m intervals
    roadsOnly: false,
  },
  ROADS_ONLY: {
    maxIterations: 300,
    offTrailPenalty: 10.0,  // Heavily penalize off-road
    trailBonus: 1.0,        // No trail bonus
    roadBonus: 0.2,         // Strong road preference
    maxWaypoints: 20,
    waypointDistance: 0.02, // 20m intervals
    roadsOnly: true,
  },
} as const;