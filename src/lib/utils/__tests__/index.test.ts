import {
  cn,
  calculateDistance,
  toRadians,
  calculateElevationGain,
  formatDistance,
  formatElevation
} from '../index';
import { Coordinate } from '@/types/route';

describe('cn (CSS class merging)', () => {
  it('should merge tailwind classes correctly', () => {
    const result = cn('text-red-500', 'text-blue-500');
    expect(result).toBe('text-blue-500');
  });

  it('should handle conditional classes', () => {
    const result = cn('base-class', true && 'conditional-class', false && 'hidden-class');
    expect(result).toBe('base-class conditional-class');
  });

  it('should handle empty inputs', () => {
    const result = cn();
    expect(result).toBe('');
  });

  it('should handle undefined and null values', () => {
    const result = cn('base', undefined, null, 'final');
    expect(result).toBe('base final');
  });

  it('should handle arrays of classes', () => {
    const result = cn(['class1', 'class2'], 'class3');
    expect(result).toBe('class1 class2 class3');
  });

  it('should handle objects with boolean values', () => {
    const result = cn({
      'class1': true,
      'class2': false,
      'class3': true
    });
    expect(result).toBe('class1 class3');
  });

  it('should resolve conflicting tailwind classes', () => {
    const result = cn('p-4 p-2', 'm-4 m-8');
    expect(result).toBe('p-2 m-8');
  });
});

describe('calculateDistance (Haversine formula)', () => {
  it('should calculate distance between two nearby points correctly', () => {
    const point1: Coordinate = { lat: 40.7589, lng: -73.9851 }; // Times Square
    const point2: Coordinate = { lat: 40.7505, lng: -73.9934 }; // Empire State Building
    
    const distance = calculateDistance(point1, point2);
    
    // Distance should be approximately 1.17 km
    expect(distance).toBeCloseTo(1.17, 1);
  });

  it('should calculate distance between distant points correctly', () => {
    const point1: Coordinate = { lat: 40.7589, lng: -73.9851 }; // New York
    const point2: Coordinate = { lat: 51.5074, lng: -0.1278 }; // London
    
    const distance = calculateDistance(point1, point2);
    
    // Distance should be approximately 5566 km
    expect(distance).toBeCloseTo(5566, 0);
  });

  it('should return 0 for identical points', () => {
    const point: Coordinate = { lat: 40.7589, lng: -73.9851 };
    
    const distance = calculateDistance(point, point);
    
    expect(distance).toBe(0);
  });

  it('should handle points at the equator', () => {
    const point1: Coordinate = { lat: 0, lng: 0 };
    const point2: Coordinate = { lat: 0, lng: 1 };
    
    const distance = calculateDistance(point1, point2);
    
    // 1 degree at equator is approximately 111.19 km
    expect(distance).toBeCloseTo(111.19, 1);
  });

  it('should handle points at the poles', () => {
    const point1: Coordinate = { lat: 90, lng: 0 };
    const point2: Coordinate = { lat: 90, lng: 180 };
    
    const distance = calculateDistance(point1, point2);
    
    // Points at the north pole should be very close regardless of longitude
    expect(distance).toBeCloseTo(0, 1);
  });

  it('should handle negative coordinates', () => {
    const point1: Coordinate = { lat: -33.8688, lng: 151.2093 }; // Sydney
    const point2: Coordinate = { lat: -37.8136, lng: 144.9631 }; // Melbourne
    
    const distance = calculateDistance(point1, point2);
    
    // Distance should be approximately 713 km
    expect(distance).toBeCloseTo(713, 0);
  });

  it('should handle coordinates crossing the 180° meridian', () => {
    const point1: Coordinate = { lat: 35.6762, lng: 139.6503 }; // Tokyo
    const point2: Coordinate = { lat: 21.3099, lng: -157.8581 }; // Honolulu
    
    const distance = calculateDistance(point1, point2);
    
    // Distance should be approximately 6209 km
    expect(distance).toBeCloseTo(6209, 0);
  });

  it('should handle elevation in coordinates (should be ignored)', () => {
    const point1: Coordinate = { lat: 40.7589, lng: -73.9851, elevation: 100 };
    const point2: Coordinate = { lat: 40.7505, lng: -73.9934, elevation: 200 };
    
    const distance = calculateDistance(point1, point2);
    
    // Distance should be approximately 1.17 km (elevation ignored)
    expect(distance).toBeCloseTo(1.17, 1);
  });
});

describe('toRadians', () => {
  it('should convert degrees to radians correctly', () => {
    expect(toRadians(0)).toBe(0);
    expect(toRadians(90)).toBeCloseTo(Math.PI / 2, 6);
    expect(toRadians(180)).toBeCloseTo(Math.PI, 6);
    expect(toRadians(270)).toBeCloseTo(3 * Math.PI / 2, 6);
    expect(toRadians(360)).toBeCloseTo(2 * Math.PI, 6);
  });

  it('should handle negative degrees', () => {
    expect(toRadians(-90)).toBeCloseTo(-Math.PI / 2, 6);
    expect(toRadians(-180)).toBeCloseTo(-Math.PI, 6);
  });

  it('should handle decimal degrees', () => {
    expect(toRadians(45)).toBeCloseTo(Math.PI / 4, 6);
    expect(toRadians(30)).toBeCloseTo(Math.PI / 6, 6);
    expect(toRadians(60)).toBeCloseTo(Math.PI / 3, 6);
  });

  it('should handle very small angles', () => {
    expect(toRadians(0.1)).toBeCloseTo(0.1 * Math.PI / 180, 10);
  });

  it('should handle very large angles', () => {
    expect(toRadians(720)).toBeCloseTo(4 * Math.PI, 6);
  });
});

describe('calculateElevationGain', () => {
  it('should calculate elevation gain for ascending points', () => {
    const points = [
      { elevation: 100 },
      { elevation: 150 },
      { elevation: 200 },
      { elevation: 300 }
    ];
    
    const gain = calculateElevationGain(points);
    
    expect(gain).toBe(200); // 50 + 50 + 100
  });

  it('should ignore elevation loss', () => {
    const points = [
      { elevation: 300 },
      { elevation: 200 },
      { elevation: 150 },
      { elevation: 100 }
    ];
    
    const gain = calculateElevationGain(points);
    
    expect(gain).toBe(0); // No positive elevation changes
  });

  it('should calculate gain for mixed elevation changes', () => {
    const points = [
      { elevation: 100 },
      { elevation: 200 }, // +100
      { elevation: 150 }, // -50 (ignored)
      { elevation: 250 }, // +100
      { elevation: 200 }, // -50 (ignored)
      { elevation: 300 }  // +100
    ];
    
    const gain = calculateElevationGain(points);
    
    expect(gain).toBe(300); // 100 + 100 + 100
  });

  it('should return 0 for empty array', () => {
    const gain = calculateElevationGain([]);
    expect(gain).toBe(0);
  });

  it('should return 0 for single point', () => {
    const points = [{ elevation: 100 }];
    const gain = calculateElevationGain(points);
    expect(gain).toBe(0);
  });

  it('should handle flat terrain', () => {
    const points = [
      { elevation: 100 },
      { elevation: 100 },
      { elevation: 100 }
    ];
    
    const gain = calculateElevationGain(points);
    
    expect(gain).toBe(0);
  });

  it('should handle zero elevation', () => {
    const points = [
      { elevation: 0 },
      { elevation: 50 },
      { elevation: 0 },
      { elevation: 25 }
    ];
    
    const gain = calculateElevationGain(points);
    
    expect(gain).toBe(75); // 50 + 25
  });

  it('should handle negative elevations', () => {
    const points = [
      { elevation: -100 },
      { elevation: -50 }, // +50
      { elevation: -75 }, // -25 (ignored)
      { elevation: 0 },   // +75
      { elevation: 50 }   // +50
    ];
    
    const gain = calculateElevationGain(points);
    
    expect(gain).toBe(175); // 50 + 75 + 50
  });

  it('should handle decimal elevations', () => {
    const points = [
      { elevation: 100.5 },
      { elevation: 150.7 }, // +50.2
      { elevation: 200.3 }  // +49.6
    ];
    
    const gain = calculateElevationGain(points);
    
    expect(gain).toBeCloseTo(99.8, 1);
  });
});

describe('formatDistance', () => {
  it('should format distances under 1000m as meters', () => {
    expect(formatDistance(0)).toBe('0m');
    expect(formatDistance(50)).toBe('50m');
    expect(formatDistance(500)).toBe('500m');
    expect(formatDistance(999)).toBe('999m');
  });

  it('should format distances 1000m and above as kilometers', () => {
    expect(formatDistance(1000)).toBe('1.0km');
    expect(formatDistance(1500)).toBe('1.5km');
    expect(formatDistance(2000)).toBe('2.0km');
    expect(formatDistance(2500)).toBe('2.5km');
  });

  it('should round meters correctly', () => {
    expect(formatDistance(50.4)).toBe('50m');
    expect(formatDistance(50.5)).toBe('51m');
    expect(formatDistance(50.6)).toBe('51m');
  });

  it('should format kilometers to 1 decimal place', () => {
    expect(formatDistance(1234)).toBe('1.2km');
    expect(formatDistance(5678)).toBe('5.7km');
    expect(formatDistance(12345)).toBe('12.3km');
  });

  it('should handle edge case at 1000m boundary', () => {
    expect(formatDistance(999.9)).toBe('1000m');
    expect(formatDistance(1000.1)).toBe('1.0km');
  });

  it('should handle very small distances', () => {
    expect(formatDistance(0.1)).toBe('0m');
    expect(formatDistance(0.5)).toBe('1m');
    expect(formatDistance(0.9)).toBe('1m');
  });

  it('should handle very large distances', () => {
    expect(formatDistance(100000)).toBe('100.0km');
    expect(formatDistance(1000000)).toBe('1000.0km');
  });

  it('should handle negative distances', () => {
    expect(formatDistance(-500)).toBe('-500m');
    expect(formatDistance(-1500)).toBe('-1500m'); // Negative values < 1000 stay as meters
  });
});

describe('formatElevation', () => {
  it('should format positive elevations correctly', () => {
    expect(formatElevation(0)).toBe('0m');
    expect(formatElevation(100)).toBe('100m');
    expect(formatElevation(1500)).toBe('1500m');
    expect(formatElevation(8848)).toBe('8848m'); // Mount Everest
  });

  it('should format negative elevations correctly', () => {
    expect(formatElevation(-100)).toBe('-100m');
    expect(formatElevation(-400)).toBe('-400m'); // Dead Sea level
  });

  it('should round decimal elevations', () => {
    expect(formatElevation(100.4)).toBe('100m');
    expect(formatElevation(100.5)).toBe('101m');
    expect(formatElevation(100.6)).toBe('101m');
  });

  it('should handle very small elevations', () => {
    expect(formatElevation(0.1)).toBe('0m');
    expect(formatElevation(0.5)).toBe('1m');
    expect(formatElevation(0.9)).toBe('1m');
  });

  it('should handle zero elevation', () => {
    expect(formatElevation(0)).toBe('0m');
    expect(formatElevation(-0)).toBe('0m');
  });

  it('should handle very large elevations', () => {
    expect(formatElevation(10000)).toBe('10000m');
    expect(formatElevation(50000)).toBe('50000m');
  });

  it('should handle decimal precision edge cases', () => {
    expect(formatElevation(99.49)).toBe('99m');
    expect(formatElevation(99.51)).toBe('100m');
  });
});