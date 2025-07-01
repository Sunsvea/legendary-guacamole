/**
 * Terrain Analysis Module for Alpine Route Optimization
 * 
 * This module provides terrain analysis functionality including:
 * - Terrain type detection and classification
 * - Slope calculation and analysis
 * - Hiking speed estimation using Tobler's function
 * - Movement cost calculations for pathfinding algorithms
 * - Adaptive terrain analysis with elevation data
 */

import { Coordinate } from '@/types/route';
import { calculateDistance } from '@/lib/utils';

// =============================================================================
// CONSTANTS AND CONFIGURATION
// =============================================================================

/**
 * Terrain surface types with associated movement characteristics
 */
export enum TerrainType {
  TRAIL = 'trail',
  VEGETATION = 'vegetation', 
  ROCK = 'rock',
  SCREE = 'scree',
  UNKNOWN = 'unknown'
}

/**
 * Movement cost multipliers for different terrain surfaces.
 * Lower values indicate easier movement, higher values indicate more difficult terrain.
 */
export const TERRAIN_MULTIPLIERS = {
  [TerrainType.TRAIL]: 0.8,      // Easiest - established paths
  [TerrainType.VEGETATION]: 1.0,  // Normal - grass, forest
  [TerrainType.ROCK]: 1.3,       // Harder - solid rock faces
  [TerrainType.SCREE]: 1.8,      // Hardest - loose rock/debris
  [TerrainType.UNKNOWN]: 1.1     // Slight penalty for uncertainty
} as const;

/**
 * Slope analysis thresholds for terrain classification (in percentage)
 */
export const SLOPE_THRESHOLDS = {
  /** Very steep terrain threshold */
  VERY_STEEP: 40,
  /** Steep terrain threshold */
  STEEP: 35,
  /** Moderate slope threshold */
  MODERATE: 30,
  /** Gentle slope threshold */
  GENTLE: 20,
  /** Dangerous slope threshold */
  DANGEROUS: 100,
  /** Very steep slope threshold */
  VERY_STEEP_GRADE: 58
} as const;

/**
 * Slope variability thresholds for terrain type detection
 */
export const SLOPE_VARIABILITY_THRESHOLDS = {
  /** High variability indicating loose rock/scree */
  HIGH_VARIABILITY: 0.3,
  /** Low variability indicating solid surfaces */
  LOW_VARIABILITY: 0.15,
  /** Very low variability indicating established trails */
  VERY_LOW_VARIABILITY: 0.1
} as const;

/**
 * Hiking speed constants for Tobler's function
 */
export const TOBLER_CONSTANTS = {
  /** Base speed coefficient in km/h */
  BASE_SPEED: 6,
  /** Slope adjustment coefficient */
  SLOPE_COEFFICIENT: -3.5,
  /** Slope offset for optimal hiking pace */
  SLOPE_OFFSET: 0.05,
  /** Minimum safe speed in km/h */
  MIN_SPEED: 0.5
} as const;

/**
 * Terrain complexity analysis constants
 */
export const TERRAIN_COMPLEXITY = {
  /** Default complexity when insufficient data available */
  DEFAULT_COMPLEXITY: 0.5,
  /** Maximum elevation range factor for complexity calculation */
  ELEVATION_RANGE_FACTOR: 0.1,
  /** Minimum elevation for range calculation */
  MIN_ELEVATION_FOR_RANGE: 100
} as const;

/**
 * Distance and elevation conversion constants
 */
export const CONVERSION_CONSTANTS = {
  /** Convert kilometers to meters */
  KM_TO_METERS: 1000,
  /** Distance threshold for terrain analysis (km) */
  NEARBY_POINT_THRESHOLD: 0.01,
  /** Minimum distance to avoid division by zero */
  MIN_DISTANCE_THRESHOLD: 0.0001
} as const;

// =============================================================================
// CORE TERRAIN ANALYSIS INTERFACES
// =============================================================================

/**
 * Terrain analysis result
 */
export interface TerrainAnalysis {
  /** Detected terrain type */
  terrainType: TerrainType;
  /** Slope as rise/run ratio */
  slope: number;
  /** Slope percentage for easy interpretation */
  slopePercentage: number;
  /** Estimated slope variability (0-1 scale) */
  slopeVariability: number;
  /** Calculated hiking speed in km/h */
  hikingSpeed: number;
  /** Terrain difficulty multiplier */
  terrainMultiplier: number;
  /** Whether terrain is considered dangerous */
  isDangerous: boolean;
}

/**
 * Slope calculation parameters
 */
export interface SlopeCalculationParams {
  /** Elevation difference in meters */
  elevationDiff: number;
  /** Horizontal distance in kilometers */
  distance: number;
}

/**
 * Terrain complexity analysis parameters
 */
export interface TerrainComplexityParams {
  /** Current coordinate for analysis */
  coordinate: Coordinate;
  /** Available elevation points for analysis */
  elevationPoints: Coordinate[];
  /** Analysis radius in kilometers */
  analysisRadius?: number;
}

// =============================================================================
// SLOPE CALCULATION AND ANALYSIS
// =============================================================================

/**
 * Calculate slope percentage from elevation change and distance using rise/run formula.
 * 
 * @param elevationDiff - Elevation change in meters (positive for uphill)
 * @param distance - Horizontal distance in kilometers
 * @returns Slope as rise/run ratio (not percentage)
 * 
 * @example
 * ```typescript
 * const slope = calculateSlope(100, 1); // 100m elevation gain over 1km
 * console.log(slope); // 0.1 (10% grade)
 * ```
 */
export function calculateSlope(elevationDiff: number, distance: number): number {
  if (distance === 0 || distance < CONVERSION_CONSTANTS.MIN_DISTANCE_THRESHOLD) {
    return 0;
  }
  
  // Convert distance from km to meters for consistent units
  const distanceMeters = distance * CONVERSION_CONSTANTS.KM_TO_METERS;
  return elevationDiff / distanceMeters;
}

/**
 * Calculate slope percentage for easier interpretation.
 * 
 * @param slope - Slope as rise/run ratio
 * @returns Slope as percentage
 */
export function calculateSlopePercentage(slope: number): number {
  return Math.abs(slope * 100);
}

/**
 * Determine if a slope is considered dangerous for hiking.
 * 
 * @param slopePercentage - Slope as percentage
 * @returns True if slope is considered dangerous
 */
export function isDangerousSlope(slopePercentage: number): boolean {
  return slopePercentage > SLOPE_THRESHOLDS.DANGEROUS;
}

/**
 * Determine if a slope is very steep (requiring technical skills).
 * 
 * @param slopePercentage - Slope as percentage
 * @returns True if slope is very steep
 */
export function isVerySteepSlope(slopePercentage: number): boolean {
  return slopePercentage > SLOPE_THRESHOLDS.VERY_STEEP_GRADE;
}

// =============================================================================
// HIKING SPEED CALCULATION
// =============================================================================

/**
 * Calculate hiking speed using Tobler's hiking function.
 * 
 * Tobler's hiking function: Speed = 6 * exp(-3.5 * |slope + 0.05|) km/h
 * This function models how hiking speed varies with terrain slope, accounting for
 * the fact that both uphill and steep downhill terrain reduce hiking speed.
 * 
 * @param slope - Grade as rise/run ratio (not percentage)
 * @returns Speed in km/h with minimum safety threshold applied
 * 
 * @example
 * ```typescript
 * const flatSpeed = calculateHikingSpeed(0); // ~5.4 km/h on flat terrain
 * const uphillSpeed = calculateHikingSpeed(0.1); // ~3.2 km/h on 10% grade
 * const steepSpeed = calculateHikingSpeed(0.3); // ~1.8 km/h on 30% grade
 * ```
 */
export function calculateHikingSpeed(slope: number): number {
  // Apply Tobler's hiking function
  const speed = TOBLER_CONSTANTS.BASE_SPEED * Math.exp(
    TOBLER_CONSTANTS.SLOPE_COEFFICIENT * Math.abs(slope + TOBLER_CONSTANTS.SLOPE_OFFSET)
  );
  
  // Ensure minimum speed for safety calculations
  return Math.max(speed, TOBLER_CONSTANTS.MIN_SPEED);
}

/**
 * Calculate time required to traverse a segment based on Tobler's function.
 * 
 * @param distance - Distance in kilometers
 * @param slope - Slope as rise/run ratio
 * @returns Time in hours
 */
export function calculateSegmentTime(distance: number, slope: number): number {
  const hikingSpeed = calculateHikingSpeed(slope);
  return distance / hikingSpeed;
}

// =============================================================================
// SLOPE VARIABILITY ANALYSIS
// =============================================================================

/**
 * Calculate slope variability in nearby area for terrain type detection.
 * 
 * This is a simplified version - in a full implementation, this would analyze
 * multiple nearby elevation points to determine terrain roughness and consistency.
 * 
 * @param slope - Current slope as rise/run ratio
 * @param elevationPoints - Optional elevation points for enhanced analysis
 * @param coordinate - Optional coordinate for spatial analysis
 * @returns Estimated slope variability (0-1 scale, where 1 is highly variable)
 * 
 * @example
 * ```typescript
 * const variability = calculateSlopeVariability(0.2); // For 20% slope
 * console.log(variability); // ~0.4 (moderate variability)
 * ```
 */
export function calculateSlopeVariability(
  slope: number, 
  elevationPoints?: Coordinate[], 
  coordinate?: Coordinate
): number {
  // Enhanced analysis if elevation points and coordinate are provided
  if (elevationPoints && coordinate && elevationPoints.length > 2) {
    return calculateAdvancedSlopeVariability(coordinate, elevationPoints);
  }
  
  // Simplified heuristic - higher absolute slope tends to have higher variability
  const baseVariability = Math.min(Math.abs(slope) * 2, 0.5);
  
  // Add controlled randomness to simulate real terrain variation
  const randomFactor = (Math.random() - 0.5) * 0.2;
  
  return Math.max(0, Math.min(1, baseVariability + randomFactor));
}

/**
 * Advanced slope variability calculation using multiple elevation points.
 * 
 * @param coordinate - Center coordinate for analysis
 * @param elevationPoints - Available elevation data
 * @returns Calculated slope variability (0-1 scale)
 */
function calculateAdvancedSlopeVariability(
  coordinate: Coordinate, 
  elevationPoints: Coordinate[]
): number {
  // Find nearby points within analysis radius
  const nearbyPoints = elevationPoints.filter(point => 
    calculateDistance(coordinate, point) < CONVERSION_CONSTANTS.NEARBY_POINT_THRESHOLD
  );
  
  if (nearbyPoints.length < 3) {
    // Fall back to simplified calculation
    return TERRAIN_COMPLEXITY.DEFAULT_COMPLEXITY;
  }
  
  // Calculate elevation differences between nearby points
  const elevations = nearbyPoints.map(p => p.elevation || 0);
  const elevationDifferences: number[] = [];
  
  for (let i = 0; i < elevations.length - 1; i++) {
    for (let j = i + 1; j < elevations.length; j++) {
      elevationDifferences.push(Math.abs(elevations[i] - elevations[j]));
    }
  }
  
  if (elevationDifferences.length === 0) return TERRAIN_COMPLEXITY.DEFAULT_COMPLEXITY;
  
  // Calculate standard deviation of elevation differences
  const mean = elevationDifferences.reduce((sum, diff) => sum + diff, 0) / elevationDifferences.length;
  const variance = elevationDifferences.reduce((sum, diff) => sum + Math.pow(diff - mean, 2), 0) / elevationDifferences.length;
  const standardDeviation = Math.sqrt(variance);
  
  // Normalize to 0-1 scale based on expected mountain terrain variation
  return Math.min(1, standardDeviation / 50); // 50m elevation difference = high variability
}

// =============================================================================
// TERRAIN TYPE DETECTION
// =============================================================================

/**
 * Detect terrain type based on elevation gradient analysis and slope characteristics.
 * 
 * This function uses slope steepness and variability to classify terrain into
 * categories that affect movement difficulty and speed.
 * 
 * @param slope - Current slope as rise/run ratio
 * @param slopeVariability - Slope variability in nearby area (0-1 scale)
 * @returns Detected terrain type
 * 
 * @example
 * ```typescript
 * const terrain = detectTerrainType(0.4, 0.35); // Steep slope, high variability
 * console.log(terrain); // TerrainType.SCREE
 * 
 * const easyTerrain = detectTerrainType(0.15, 0.05); // Gentle, consistent
 * console.log(easyTerrain); // TerrainType.TRAIL
 * ```
 */
export function detectTerrainType(slope: number, slopeVariability: number): TerrainType {
  const slopePercentage = calculateSlopePercentage(slope);
  
  // Very steep with high variability = scree/loose rock
  if (slopePercentage > SLOPE_THRESHOLDS.VERY_STEEP && 
      slopeVariability > SLOPE_VARIABILITY_THRESHOLDS.HIGH_VARIABILITY) {
    return TerrainType.SCREE;
  }
  
  // Steep with low variability = solid rock
  if (slopePercentage > SLOPE_THRESHOLDS.STEEP && 
      slopeVariability < SLOPE_VARIABILITY_THRESHOLDS.LOW_VARIABILITY) {
    return TerrainType.ROCK;
  }
  
  // Gentle, consistent slope = likely trail
  if (slopePercentage < SLOPE_THRESHOLDS.GENTLE && 
      slopeVariability < SLOPE_VARIABILITY_THRESHOLDS.VERY_LOW_VARIABILITY) {
    return TerrainType.TRAIL;
  }
  
  // Moderate slope with moderate variability = vegetation
  if (slopePercentage < SLOPE_THRESHOLDS.MODERATE) {
    return TerrainType.VEGETATION;
  }
  
  return TerrainType.UNKNOWN;
}

/**
 * Get terrain difficulty multiplier for a given terrain type.
 * 
 * @param terrainType - The terrain type to get multiplier for
 * @returns Movement cost multiplier
 */
export function getTerrainMultiplier(terrainType: TerrainType): number {
  return TERRAIN_MULTIPLIERS[terrainType];
}

// =============================================================================
// TERRAIN ANALYSIS
// =============================================================================

/**
 * Perform terrain analysis for a coordinate pair.
 * 
 * This function combines all terrain analysis components to provide a complete
 * assessment of terrain characteristics between two points.
 * 
 * @param from - Starting coordinate
 * @param to - Destination coordinate
 * @param elevationPoints - Optional elevation data for enhanced analysis
 * @returns Terrain analysis result
 * 
 * @example
 * ```typescript
 * const analysis = analyzeTerrainBetweenPoints(start, end, elevationData);
 * console.log(`Terrain: ${analysis.terrainType}, Speed: ${analysis.hikingSpeed} km/h`);
 * ```
 */
export function analyzeTerrainBetweenPoints(
  from: Coordinate, 
  to: Coordinate, 
  elevationPoints?: Coordinate[]
): TerrainAnalysis {
  const distance = calculateDistance(from, to);
  const elevationDiff = (to.elevation || 0) - (from.elevation || 0);
  
  // Calculate slope characteristics
  const slope = calculateSlope(elevationDiff, distance);
  const slopePercentage = calculateSlopePercentage(slope);
  const slopeVariability = calculateSlopeVariability(slope, elevationPoints, from);
  
  // Detect terrain type and characteristics
  const terrainType = detectTerrainType(slope, slopeVariability);
  const terrainMultiplier = getTerrainMultiplier(terrainType);
  const hikingSpeed = calculateHikingSpeed(slope);
  
  // Assess danger level
  const isDangerous = isDangerousSlope(slopePercentage);
  
  return {
    terrainType,
    slope,
    slopePercentage,
    slopeVariability,
    hikingSpeed,
    terrainMultiplier,
    isDangerous
  };
}

// =============================================================================
// TERRAIN COMPLEXITY ANALYSIS
// =============================================================================

/**
 * Calculate terrain complexity based on elevation variation in the area.
 * 
 * @param params - Terrain complexity analysis parameters
 * @returns Terrain complexity (0-1 scale, where 1 is most complex)
 */
export function calculateTerrainComplexity(params: TerrainComplexityParams): number {
  const { coordinate, elevationPoints, analysisRadius = CONVERSION_CONSTANTS.NEARBY_POINT_THRESHOLD } = params;
  
  if (elevationPoints.length === 0) {
    return TERRAIN_COMPLEXITY.DEFAULT_COMPLEXITY;
  }
  
  // Find nearby points for complexity analysis
  const nearbyPoints = elevationPoints.filter(point => 
    calculateDistance(coordinate, point) < analysisRadius
  );
  
  if (nearbyPoints.length < 2) {
    return TERRAIN_COMPLEXITY.DEFAULT_COMPLEXITY;
  }
  
  const elevations = nearbyPoints.map(p => p.elevation || 0);
  const elevationRange = Math.max(...elevations) - Math.min(...elevations);
  const avgElevation = elevations.reduce((sum, e) => sum + e, 0) / elevations.length;
  
  // Higher elevation variation relative to average elevation = higher complexity
  const complexityFactor = Math.max(
    TERRAIN_COMPLEXITY.MIN_ELEVATION_FOR_RANGE, 
    avgElevation * TERRAIN_COMPLEXITY.ELEVATION_RANGE_FACTOR
  );
  
  return Math.min(1, elevationRange / complexityFactor);
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Create a formatted terrain analysis summary for logging/debugging.
 * 
 * @param analysis - Terrain analysis result
 * @returns Formatted string summary
 */
export function formatTerrainAnalysis(analysis: TerrainAnalysis): string {
  return `Terrain: ${analysis.terrainType} | ` +
         `Slope: ${analysis.slopePercentage.toFixed(1)}% | ` +
         `Speed: ${analysis.hikingSpeed.toFixed(1)} km/h | ` +
         `Multiplier: ${analysis.terrainMultiplier}x | ` +
         `Dangerous: ${analysis.isDangerous ? 'Yes' : 'No'}`;
}

/**
 * Validate terrain analysis input parameters.
 * 
 * @param from - Starting coordinate
 * @param to - Destination coordinate
 * @throws Error if parameters are invalid
 */
export function validateTerrainAnalysisParams(from: Coordinate, to: Coordinate): void {
  if (!from || !to) {
    throw new Error('Both from and to coordinates are required for terrain analysis');
  }
  
  if (typeof from.lat !== 'number' || typeof from.lng !== 'number' ||
      typeof to.lat !== 'number' || typeof to.lng !== 'number') {
    throw new Error('Coordinates must have valid numeric lat/lng values');
  }
  
  if (Math.abs(from.lat) > 90 || Math.abs(to.lat) > 90) {
    throw new Error('Latitude values must be between -90 and 90 degrees');
  }
  
  if (Math.abs(from.lng) > 180 || Math.abs(to.lng) > 180) {
    throw new Error('Longitude values must be between -180 and 180 degrees');
  }
}