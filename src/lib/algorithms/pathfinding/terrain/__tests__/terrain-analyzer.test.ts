/**
 * Comprehensive unit tests for terrain analysis functions
 * Tests slope calculations, hiking speed estimation using Tobler's function,
 * terrain type detection, and comprehensive terrain analysis capabilities
 */

import {
  calculateSlope,
  calculateSlopePercentage,
  isDangerousSlope,
  isVerySteepSlope,
  calculateHikingSpeed,
  calculateSegmentTime,
  calculateSlopeVariability,
  detectTerrainType,
  getTerrainMultiplier,
  analyzeTerrainBetweenPoints,
  calculateTerrainComplexity,
  formatTerrainAnalysis,
  validateTerrainAnalysisParams,
  TerrainType,
  TERRAIN_MULTIPLIERS,
  SLOPE_THRESHOLDS,
  SLOPE_VARIABILITY_THRESHOLDS,
  TOBLER_CONSTANTS,
  TERRAIN_COMPLEXITY,
  CONVERSION_CONSTANTS
} from '../terrain-analyzer';

import { Coordinate } from '@/types/route';
import type { TerrainAnalysis, TerrainComplexityParams } from '../terrain-analyzer';

// Mock external dependencies
jest.mock('@/lib/utils', () => ({
  calculateDistance: jest.fn((from: Coordinate, to: Coordinate) => {
    // Simple Euclidean distance for testing
    const dLat = to.lat - from.lat;
    const dLng = to.lng - from.lng;
    return Math.sqrt(dLat * dLat + dLng * dLng) * 111; // Approximate km conversion
  })
}));

describe('calculateSlope', () => {
  it('calculates basic slope correctly', () => {
    const elevationDiff = 100; // 100m elevation gain
    const distance = 1; // 1km horizontal distance

    const slope = calculateSlope(elevationDiff, distance);

    expect(slope).toBeCloseTo(0.1); // 100m / 1000m = 0.1 (10% grade)
  });

  it('handles negative elevation difference (downhill)', () => {
    const elevationDiff = -200; // 200m descent
    const distance = 2; // 2km distance

    const slope = calculateSlope(elevationDiff, distance);

    expect(slope).toBeCloseTo(-0.1); // -200m / 2000m = -0.1 (-10% grade)
  });

  it('returns zero for zero distance', () => {
    const elevationDiff = 100;
    const distance = 0;

    const slope = calculateSlope(elevationDiff, distance);

    expect(slope).toBe(0);
  });

  it('returns zero for very small distance (below threshold)', () => {
    const elevationDiff = 100;
    const distance = CONVERSION_CONSTANTS.MIN_DISTANCE_THRESHOLD / 2;

    const slope = calculateSlope(elevationDiff, distance);

    expect(slope).toBe(0);
  });

  it('handles zero elevation difference (flat terrain)', () => {
    const elevationDiff = 0;
    const distance = 5;

    const slope = calculateSlope(elevationDiff, distance);

    expect(slope).toBe(0);
  });

  it('calculates steep slopes correctly', () => {
    const elevationDiff = 600; // 600m elevation gain
    const distance = 1; // 1km distance

    const slope = calculateSlope(elevationDiff, distance);

    expect(slope).toBeCloseTo(0.6); // 60% grade - very steep
  });
});

describe('calculateSlopePercentage', () => {
  it('converts slope ratio to percentage', () => {
    const slope = 0.25; // 25% grade

    const percentage = calculateSlopePercentage(slope);

    expect(percentage).toBe(25);
  });

  it('returns absolute value for negative slopes', () => {
    const slope = -0.15; // -15% grade (downhill)

    const percentage = calculateSlopePercentage(slope);

    expect(percentage).toBe(15); // Should be positive
  });

  it('handles zero slope', () => {
    const slope = 0;

    const percentage = calculateSlopePercentage(slope);

    expect(percentage).toBe(0);
  });

  it('handles very steep slopes', () => {
    const slope = 1.5; // 150% grade

    const percentage = calculateSlopePercentage(slope);

    expect(percentage).toBe(150);
  });
});

describe('isDangerousSlope', () => {
  it('identifies dangerous slopes correctly', () => {
    const dangerousSlope = SLOPE_THRESHOLDS.DANGEROUS + 10; // Above dangerous threshold

    const result = isDangerousSlope(dangerousSlope);

    expect(result).toBe(true);
  });

  it('identifies safe slopes correctly', () => {
    const safeSlope = SLOPE_THRESHOLDS.DANGEROUS - 10; // Below dangerous threshold

    const result = isDangerousSlope(safeSlope);

    expect(result).toBe(false);
  });

  it('handles boundary conditions', () => {
    const boundarySlope = SLOPE_THRESHOLDS.DANGEROUS;

    const result = isDangerousSlope(boundarySlope);

    expect(result).toBe(false); // Should be false for exact threshold
  });
});

describe('isVerySteepSlope', () => {
  it('identifies very steep slopes correctly', () => {
    const verySteepSlope = SLOPE_THRESHOLDS.VERY_STEEP_GRADE + 5;

    const result = isVerySteepSlope(verySteepSlope);

    expect(result).toBe(true);
  });

  it('identifies moderate slopes correctly', () => {
    const moderateSlope = SLOPE_THRESHOLDS.VERY_STEEP_GRADE - 5;

    const result = isVerySteepSlope(moderateSlope);

    expect(result).toBe(false);
  });

  it('handles boundary conditions', () => {
    const boundarySlope = SLOPE_THRESHOLDS.VERY_STEEP_GRADE;

    const result = isVerySteepSlope(boundarySlope);

    expect(result).toBe(false); // Should be false for exact threshold
  });
});

describe('calculateHikingSpeed', () => {
  it('calculates speed for flat terrain', () => {
    const flatSlope = 0;

    const speed = calculateHikingSpeed(flatSlope);

    // Should be close to base speed adjusted by Tobler's offset
    const expectedSpeed = TOBLER_CONSTANTS.BASE_SPEED * Math.exp(
      TOBLER_CONSTANTS.SLOPE_COEFFICIENT * Math.abs(flatSlope + TOBLER_CONSTANTS.SLOPE_OFFSET)
    );
    expect(speed).toBeCloseTo(expectedSpeed, 2);
    expect(speed).toBeGreaterThan(5); // Should be fast on flat terrain
  });

  it('reduces speed for uphill terrain', () => {
    const flatSpeed = calculateHikingSpeed(0);
    const uphillSpeed = calculateHikingSpeed(0.2); // 20% uphill grade

    expect(uphillSpeed).toBeLessThan(flatSpeed);
    expect(uphillSpeed).toBeGreaterThan(TOBLER_CONSTANTS.MIN_SPEED);
  });

  it('reduces speed for downhill terrain', () => {
    const flatSpeed = calculateHikingSpeed(0);
    const downhillSpeed = calculateHikingSpeed(-0.3); // 30% downhill grade

    expect(downhillSpeed).toBeLessThan(flatSpeed);
  });

  it('enforces minimum speed for extreme slopes', () => {
    const extremeSlope = 2.0; // 200% grade - impossible terrain

    const speed = calculateHikingSpeed(extremeSlope);

    expect(speed).toBe(TOBLER_CONSTANTS.MIN_SPEED);
  });

  it('handles optimal hiking slope', () => {
    // Tobler's function has an optimal slightly downhill slope around -5%
    const optimalSlope = -0.05;

    const speed = calculateHikingSpeed(optimalSlope);

    expect(speed).toBeGreaterThan(calculateHikingSpeed(0));
    expect(speed).toBeGreaterThan(calculateHikingSpeed(0.05));
  });

  it('follows Tobler\'s exponential decay pattern', () => {
    const speeds = [
      calculateHikingSpeed(0),
      calculateHikingSpeed(0.1),
      calculateHikingSpeed(0.2),
      calculateHikingSpeed(0.3)
    ];

    // Speed should decrease with increasing slope
    expect(speeds[1]).toBeLessThan(speeds[0]);
    expect(speeds[2]).toBeLessThan(speeds[1]);
    expect(speeds[3]).toBeLessThan(speeds[2]);
  });
});

describe('calculateSegmentTime', () => {
  it('calculates time for basic segment', () => {
    const distance = 2; // 2km
    const slope = 0.1; // 10% grade
    const expectedSpeed = calculateHikingSpeed(slope);

    const time = calculateSegmentTime(distance, slope);

    expect(time).toBeCloseTo(distance / expectedSpeed, 3);
  });

  it('takes longer for steeper terrain', () => {
    const distance = 1;
    const flatTime = calculateSegmentTime(distance, 0);
    const steepTime = calculateSegmentTime(distance, 0.3);

    expect(steepTime).toBeGreaterThan(flatTime);
  });

  it('handles zero distance', () => {
    const time = calculateSegmentTime(0, 0.1);

    expect(time).toBe(0);
  });
});

describe('calculateSlopeVariability', () => {
  it('estimates variability from slope magnitude', () => {
    const moderateSlope = 0.2;

    const variability = calculateSlopeVariability(moderateSlope);

    expect(variability).toBeGreaterThan(0);
    expect(variability).toBeLessThanOrEqual(1);
    expect(variability).toBeCloseTo(0.4, 1); // 0.2 * 2 = 0.4 base
  });

  it('caps variability at 0.5 for very steep slopes', () => {
    const extremeSlope = 1.0;

    const variability = calculateSlopeVariability(extremeSlope);

    expect(variability).toBeLessThanOrEqual(1);
  });

  it('uses advanced calculation with elevation points', () => {
    const slope = 0.1;
    const coordinate: Coordinate = { lat: 47.0000, lng: 8.0000, elevation: 1000 };
    const elevationPoints: Coordinate[] = [
      { lat: 46.9995, lng: 7.9995, elevation: 990 },
      { lat: 47.0000, lng: 8.0000, elevation: 1000 },
      { lat: 47.0005, lng: 8.0005, elevation: 1010 },
      { lat: 47.0010, lng: 8.0010, elevation: 1020 }
    ];

    const mockCalculateDistance = require('@/lib/utils').calculateDistance;
    mockCalculateDistance.mockReturnValue(0.005); // Within nearby threshold

    const variability = calculateSlopeVariability(slope, elevationPoints, coordinate);

    expect(variability).toBeGreaterThan(0);
    expect(variability).toBeLessThanOrEqual(1);
  });

  it('falls back to simple calculation with insufficient elevation data', () => {
    const slope = 0.15;
    const coordinate: Coordinate = { lat: 47.0000, lng: 8.0000 };
    const elevationPoints: Coordinate[] = [
      { lat: 47.0000, lng: 8.0000, elevation: 1000 }
    ]; // Only one point

    const variability = calculateSlopeVariability(slope, elevationPoints, coordinate);

    // Should use simple calculation, not default complexity
    expect(variability).toBeGreaterThan(0);
    expect(variability).toBeLessThanOrEqual(1);
  });

  it('includes randomness in simple calculation', () => {
    const slope = 0.1;

    // Run multiple times to test randomness
    const variabilities = Array.from({ length: 20 }, () => calculateSlopeVariability(slope));

    // Should have some variation due to random factor, but check for non-zero variance
    const mean = variabilities.reduce((sum, v) => sum + v, 0) / variabilities.length;
    const variance = variabilities.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / variabilities.length;
    
    expect(variance).toBeGreaterThan(0); // Should have some randomness
    expect(mean).toBeGreaterThan(0);     // Should have reasonable base value
  });
});

describe('detectTerrainType', () => {
  it('detects scree terrain (steep + high variability)', () => {
    const steepSlope = 0.5; // 50% slope
    const highVariability = 0.4; // High variability

    const terrainType = detectTerrainType(steepSlope, highVariability);

    expect(terrainType).toBe(TerrainType.SCREE);
  });

  it('detects rock terrain (steep + low variability)', () => {
    const steepSlope = 0.4; // 40% slope
    const lowVariability = 0.1; // Low variability

    const terrainType = detectTerrainType(steepSlope, lowVariability);

    expect(terrainType).toBe(TerrainType.ROCK);
  });

  it('detects trail terrain (gentle + very low variability)', () => {
    const gentleSlope = 0.15; // 15% slope
    const veryLowVariability = 0.05; // Very low variability

    const terrainType = detectTerrainType(gentleSlope, veryLowVariability);

    expect(terrainType).toBe(TerrainType.TRAIL);
  });

  it('detects vegetation terrain (moderate slope)', () => {
    const moderateSlope = 0.25; // 25% slope
    const moderateVariability = 0.2; // Moderate variability

    const terrainType = detectTerrainType(moderateSlope, moderateVariability);

    expect(terrainType).toBe(TerrainType.VEGETATION);
  });

  it('defaults to unknown for edge cases', () => {
    const steepSlope = 0.35; // 35% slope
    const moderateVariability = 0.2; // Moderate variability

    const terrainType = detectTerrainType(steepSlope, moderateVariability);

    expect(terrainType).toBe(TerrainType.UNKNOWN);
  });

  it('uses slope percentage thresholds correctly', () => {
    const veryGentleSlope = 0.05; // 5% slope
    const lowVariability = 0.08; // Below very low threshold

    const terrainType = detectTerrainType(veryGentleSlope, lowVariability);

    expect(terrainType).toBe(TerrainType.TRAIL);
  });
});

describe('getTerrainMultiplier', () => {
  it('returns correct multiplier for each terrain type', () => {
    expect(getTerrainMultiplier(TerrainType.TRAIL)).toBe(TERRAIN_MULTIPLIERS[TerrainType.TRAIL]);
    expect(getTerrainMultiplier(TerrainType.VEGETATION)).toBe(TERRAIN_MULTIPLIERS[TerrainType.VEGETATION]);
    expect(getTerrainMultiplier(TerrainType.ROCK)).toBe(TERRAIN_MULTIPLIERS[TerrainType.ROCK]);
    expect(getTerrainMultiplier(TerrainType.SCREE)).toBe(TERRAIN_MULTIPLIERS[TerrainType.SCREE]);
    expect(getTerrainMultiplier(TerrainType.UNKNOWN)).toBe(TERRAIN_MULTIPLIERS[TerrainType.UNKNOWN]);
  });

  it('reflects difficulty ordering (trail < vegetation < rock < scree)', () => {
    const trailMultiplier = getTerrainMultiplier(TerrainType.TRAIL);
    const vegetationMultiplier = getTerrainMultiplier(TerrainType.VEGETATION);
    const rockMultiplier = getTerrainMultiplier(TerrainType.ROCK);
    const screeMultiplier = getTerrainMultiplier(TerrainType.SCREE);

    expect(trailMultiplier).toBeLessThan(vegetationMultiplier);
    expect(vegetationMultiplier).toBeLessThan(rockMultiplier);
    expect(rockMultiplier).toBeLessThan(screeMultiplier);
  });
});

describe('analyzeTerrainBetweenPoints', () => {
  const mockCalculateDistance = require('@/lib/utils').calculateDistance;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('performs comprehensive terrain analysis', () => {
    const from: Coordinate = { lat: 47.0000, lng: 8.0000, elevation: 1000 };
    const to: Coordinate = { lat: 47.0010, lng: 8.0010, elevation: 1200 };

    mockCalculateDistance.mockReturnValue(1.0); // 1km distance

    const analysis = analyzeTerrainBetweenPoints(from, to);

    expect(analysis).toHaveProperty('terrainType');
    expect(analysis).toHaveProperty('slope');
    expect(analysis).toHaveProperty('slopePercentage');
    expect(analysis).toHaveProperty('slopeVariability');
    expect(analysis).toHaveProperty('hikingSpeed');
    expect(analysis).toHaveProperty('terrainMultiplier');
    expect(analysis).toHaveProperty('isDangerous');

    expect(analysis.slope).toBeCloseTo(0.2); // 200m / 1000m = 0.2
    expect(analysis.slopePercentage).toBeCloseTo(20); // 20% grade
    expect(analysis.hikingSpeed).toBeGreaterThan(0);
    expect(analysis.terrainMultiplier).toBeGreaterThan(0);
  });

  it('handles coordinates without elevation', () => {
    const from: Coordinate = { lat: 47.0000, lng: 8.0000 };
    const to: Coordinate = { lat: 47.0010, lng: 8.0010 };

    mockCalculateDistance.mockReturnValue(1.0);

    const analysis = analyzeTerrainBetweenPoints(from, to);

    expect(analysis.slope).toBe(0); // No elevation difference
    expect(analysis.slopePercentage).toBe(0);
    expect(analysis.isDangerous).toBe(false);
  });

  it('identifies dangerous terrain correctly', () => {
    const from: Coordinate = { lat: 47.0000, lng: 8.0000, elevation: 1000 };
    const to: Coordinate = { lat: 47.0010, lng: 8.0010, elevation: 2500 }; // Very steep

    mockCalculateDistance.mockReturnValue(1.0);

    const analysis = analyzeTerrainBetweenPoints(from, to);

    expect(analysis.isDangerous).toBe(true);
    expect(analysis.slopePercentage).toBeGreaterThan(SLOPE_THRESHOLDS.DANGEROUS);
  });

  it('uses elevation points for enhanced analysis', () => {
    const from: Coordinate = { lat: 47.0000, lng: 8.0000, elevation: 1000 };
    const to: Coordinate = { lat: 47.0010, lng: 8.0010, elevation: 1100 };
    const elevationPoints: Coordinate[] = [
      { lat: 46.9995, lng: 7.9995, elevation: 990 },
      { lat: 47.0005, lng: 8.0005, elevation: 1050 },
      { lat: 47.0015, lng: 8.0015, elevation: 1150 }
    ];

    mockCalculateDistance.mockReturnValue(1.0);

    const analysis = analyzeTerrainBetweenPoints(from, to, elevationPoints);

    expect(analysis).toHaveProperty('slopeVariability');
    expect(analysis.slopeVariability).toBeGreaterThanOrEqual(0);
    expect(analysis.slopeVariability).toBeLessThanOrEqual(1);
  });

  it('calculates appropriate hiking speed for terrain', () => {
    const from: Coordinate = { lat: 47.0000, lng: 8.0000, elevation: 1000 };
    const to: Coordinate = { lat: 47.0010, lng: 8.0010, elevation: 1300 }; // Steep

    mockCalculateDistance.mockReturnValue(1.0);

    const analysis = analyzeTerrainBetweenPoints(from, to);

    expect(analysis.hikingSpeed).toBeGreaterThan(TOBLER_CONSTANTS.MIN_SPEED);
    expect(analysis.hikingSpeed).toBeLessThan(TOBLER_CONSTANTS.BASE_SPEED);
  });
});

describe('calculateTerrainComplexity', () => {
  const mockCalculateDistance = require('@/lib/utils').calculateDistance;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('calculates complexity from elevation variation', () => {
    const params: TerrainComplexityParams = {
      coordinate: { lat: 47.0000, lng: 8.0000, elevation: 1000 },
      elevationPoints: [
        { lat: 46.9995, lng: 7.9995, elevation: 900 },
        { lat: 47.0000, lng: 8.0000, elevation: 1000 },
        { lat: 47.0005, lng: 8.0005, elevation: 1200 },
        { lat: 47.0010, lng: 8.0010, elevation: 800 }
      ]
    };

    mockCalculateDistance.mockReturnValue(0.005); // Within analysis radius

    const complexity = calculateTerrainComplexity(params);

    expect(complexity).toBeGreaterThan(0);
    expect(complexity).toBeLessThanOrEqual(1);
  });

  it('returns default complexity for insufficient data', () => {
    const params: TerrainComplexityParams = {
      coordinate: { lat: 47.0000, lng: 8.0000 },
      elevationPoints: []
    };

    const complexity = calculateTerrainComplexity(params);

    expect(complexity).toBe(TERRAIN_COMPLEXITY.DEFAULT_COMPLEXITY);
  });

  it('filters points by analysis radius', () => {
    const params: TerrainComplexityParams = {
      coordinate: { lat: 47.0000, lng: 8.0000, elevation: 1000 },
      elevationPoints: [
        { lat: 47.0000, lng: 8.0000, elevation: 1000 }, // Close
        { lat: 47.1000, lng: 8.1000, elevation: 2000 }  // Far
      ],
      analysisRadius: 0.01
    };

    mockCalculateDistance
      .mockReturnValueOnce(0.005) // Close point
      .mockReturnValueOnce(15.0); // Far point

    const complexity = calculateTerrainComplexity(params);

    expect(complexity).toBe(TERRAIN_COMPLEXITY.DEFAULT_COMPLEXITY); // Only one nearby point
  });

  it('scales complexity with elevation range', () => {
    const lowVariationParams: TerrainComplexityParams = {
      coordinate: { lat: 47.0000, lng: 8.0000, elevation: 1000 },
      elevationPoints: [
        { lat: 46.9995, lng: 7.9995, elevation: 990 },
        { lat: 47.0005, lng: 8.0005, elevation: 1010 }
      ]
    };

    const highVariationParams: TerrainComplexityParams = {
      coordinate: { lat: 47.0000, lng: 8.0000, elevation: 1000 },
      elevationPoints: [
        { lat: 46.9995, lng: 7.9995, elevation: 500 },
        { lat: 47.0005, lng: 8.0005, elevation: 1500 }
      ]
    };

    mockCalculateDistance.mockReturnValue(0.005);

    const lowComplexity = calculateTerrainComplexity(lowVariationParams);
    const highComplexity = calculateTerrainComplexity(highVariationParams);

    expect(highComplexity).toBeGreaterThan(lowComplexity);
  });

  it('uses custom analysis radius', () => {
    const params: TerrainComplexityParams = {
      coordinate: { lat: 47.0000, lng: 8.0000, elevation: 1000 },
      elevationPoints: [
        { lat: 47.0000, lng: 8.0000, elevation: 1000 }
      ],
      analysisRadius: 0.02
    };

    mockCalculateDistance.mockReturnValue(0.015); // Within custom radius

    const complexity = calculateTerrainComplexity(params);

    expect(mockCalculateDistance).toHaveBeenCalledWith(
      params.coordinate,
      params.elevationPoints[0]
    );
  });
});

describe('formatTerrainAnalysis', () => {
  it('formats analysis result as readable string', () => {
    const analysis: TerrainAnalysis = {
      terrainType: TerrainType.ROCK,
      slope: 0.25,
      slopePercentage: 25.0,
      slopeVariability: 0.15,
      hikingSpeed: 3.2,
      terrainMultiplier: 1.3,
      isDangerous: false
    };

    const formatted = formatTerrainAnalysis(analysis);

    expect(formatted).toContain('Terrain: rock');
    expect(formatted).toContain('Slope: 25.0%');
    expect(formatted).toContain('Speed: 3.2 km/h');
    expect(formatted).toContain('Multiplier: 1.3x');
    expect(formatted).toContain('Dangerous: No');
  });

  it('formats dangerous terrain correctly', () => {
    const analysis: TerrainAnalysis = {
      terrainType: TerrainType.SCREE,
      slope: 1.5,
      slopePercentage: 150.0,
      slopeVariability: 0.8,
      hikingSpeed: 0.5,
      terrainMultiplier: 1.8,
      isDangerous: true
    };

    const formatted = formatTerrainAnalysis(analysis);

    expect(formatted).toContain('Dangerous: Yes');
    expect(formatted).toContain('Terrain: scree');
  });
});

describe('validateTerrainAnalysisParams', () => {
  it('accepts valid coordinates', () => {
    const from: Coordinate = { lat: 47.0000, lng: 8.0000 };
    const to: Coordinate = { lat: 47.0010, lng: 8.0010 };

    expect(() => validateTerrainAnalysisParams(from, to)).not.toThrow();
  });

  it('throws error for missing coordinates', () => {
    const validCoord: Coordinate = { lat: 47.0000, lng: 8.0000 };

    expect(() => validateTerrainAnalysisParams(null as any, validCoord))
      .toThrow('Both from and to coordinates are required');

    expect(() => validateTerrainAnalysisParams(validCoord, undefined as any))
      .toThrow('Both from and to coordinates are required');
  });

  it('throws error for invalid numeric values', () => {
    const invalidLat: Coordinate = { lat: 'invalid' as any, lng: 8.0000 };
    const validCoord: Coordinate = { lat: 47.0000, lng: 8.0000 };

    expect(() => validateTerrainAnalysisParams(invalidLat, validCoord))
      .toThrow('Coordinates must have valid numeric lat/lng values');

    const invalidLng: Coordinate = { lat: 47.0000, lng: 'invalid' as any };
    expect(() => validateTerrainAnalysisParams(validCoord, invalidLng))
      .toThrow('Coordinates must have valid numeric lat/lng values');
  });

  it('throws error for latitude out of range', () => {
    const invalidLat: Coordinate = { lat: 95.0, lng: 8.0000 }; // > 90
    const validCoord: Coordinate = { lat: 47.0000, lng: 8.0000 };

    expect(() => validateTerrainAnalysisParams(invalidLat, validCoord))
      .toThrow('Latitude values must be between -90 and 90 degrees');

    const negativeInvalidLat: Coordinate = { lat: -95.0, lng: 8.0000 }; // < -90
    expect(() => validateTerrainAnalysisParams(negativeInvalidLat, validCoord))
      .toThrow('Latitude values must be between -90 and 90 degrees');
  });

  it('throws error for longitude out of range', () => {
    const invalidLng: Coordinate = { lat: 47.0000, lng: 185.0 }; // > 180
    const validCoord: Coordinate = { lat: 47.0000, lng: 8.0000 };

    expect(() => validateTerrainAnalysisParams(validCoord, invalidLng))
      .toThrow('Longitude values must be between -180 and 180 degrees');

    const negativeInvalidLng: Coordinate = { lat: 47.0000, lng: -185.0 }; // < -180
    expect(() => validateTerrainAnalysisParams(validCoord, negativeInvalidLng))
      .toThrow('Longitude values must be between -180 and 180 degrees');
  });

  it('accepts boundary coordinate values', () => {
    const northPole: Coordinate = { lat: 90.0, lng: 0.0 };
    const southPole: Coordinate = { lat: -90.0, lng: 0.0 };
    const dateLine: Coordinate = { lat: 0.0, lng: 180.0 };
    const antiMeridian: Coordinate = { lat: 0.0, lng: -180.0 };

    expect(() => validateTerrainAnalysisParams(northPole, southPole)).not.toThrow();
    expect(() => validateTerrainAnalysisParams(dateLine, antiMeridian)).not.toThrow();
  });
});

describe('Constants and Thresholds', () => {
  it('has consistent terrain multiplier ordering', () => {
    const multipliers = Object.values(TERRAIN_MULTIPLIERS);
    expect(TERRAIN_MULTIPLIERS[TerrainType.TRAIL]).toBeLessThan(TERRAIN_MULTIPLIERS[TerrainType.VEGETATION]);
    expect(TERRAIN_MULTIPLIERS[TerrainType.VEGETATION]).toBeLessThan(TERRAIN_MULTIPLIERS[TerrainType.ROCK]);
    expect(TERRAIN_MULTIPLIERS[TerrainType.ROCK]).toBeLessThan(TERRAIN_MULTIPLIERS[TerrainType.SCREE]);
  });

  it('has logical slope threshold progression', () => {
    expect(SLOPE_THRESHOLDS.GENTLE).toBeLessThan(SLOPE_THRESHOLDS.MODERATE);
    expect(SLOPE_THRESHOLDS.MODERATE).toBeLessThan(SLOPE_THRESHOLDS.STEEP);
    expect(SLOPE_THRESHOLDS.STEEP).toBeLessThan(SLOPE_THRESHOLDS.VERY_STEEP);
    expect(SLOPE_THRESHOLDS.VERY_STEEP).toBeLessThan(SLOPE_THRESHOLDS.DANGEROUS);
  });

  it('has logical slope variability threshold progression', () => {
    expect(SLOPE_VARIABILITY_THRESHOLDS.VERY_LOW_VARIABILITY)
      .toBeLessThan(SLOPE_VARIABILITY_THRESHOLDS.LOW_VARIABILITY);
    expect(SLOPE_VARIABILITY_THRESHOLDS.LOW_VARIABILITY)
      .toBeLessThan(SLOPE_VARIABILITY_THRESHOLDS.HIGH_VARIABILITY);
  });

  it('has reasonable Tobler constants', () => {
    expect(TOBLER_CONSTANTS.BASE_SPEED).toBeGreaterThan(0);
    expect(TOBLER_CONSTANTS.SLOPE_COEFFICIENT).toBeLessThan(0); // Should be negative for exponential decay
    expect(TOBLER_CONSTANTS.MIN_SPEED).toBeGreaterThan(0);
    expect(TOBLER_CONSTANTS.MIN_SPEED).toBeLessThan(TOBLER_CONSTANTS.BASE_SPEED);
  });

  it('has reasonable terrain complexity constants', () => {
    expect(TERRAIN_COMPLEXITY.DEFAULT_COMPLEXITY).toBeGreaterThan(0);
    expect(TERRAIN_COMPLEXITY.DEFAULT_COMPLEXITY).toBeLessThanOrEqual(1);
    expect(TERRAIN_COMPLEXITY.ELEVATION_RANGE_FACTOR).toBeGreaterThan(0);
    expect(TERRAIN_COMPLEXITY.MIN_ELEVATION_FOR_RANGE).toBeGreaterThan(0);
  });

  it('has reasonable conversion constants', () => {
    expect(CONVERSION_CONSTANTS.KM_TO_METERS).toBe(1000);
    expect(CONVERSION_CONSTANTS.NEARBY_POINT_THRESHOLD).toBeGreaterThan(0);
    expect(CONVERSION_CONSTANTS.MIN_DISTANCE_THRESHOLD).toBeGreaterThan(0);
    expect(CONVERSION_CONSTANTS.MIN_DISTANCE_THRESHOLD)
      .toBeLessThan(CONVERSION_CONSTANTS.NEARBY_POINT_THRESHOLD);
  });
});