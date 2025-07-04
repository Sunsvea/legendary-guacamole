import { Coordinate } from '@/types/route';

/**
 * Country detection utilities for routes
 */

/**
 * Detect country from coordinates using reverse geocoding
 * @param coordinate The coordinate to check
 * @returns Promise resolving to country name or null if not found
 */
export async function detectCountryFromCoordinate(coordinate: Coordinate): Promise<string | null> {
  try {
    // Use a simple coordinate-to-country mapping as fallback
    // This covers major alpine and European countries commonly used
    const country = getCountryFromCoordinates(coordinate);
    
    if (country) {
      return country;
    }
    
    // Could integrate with Mapbox reverse geocoding in the future
    // For now, return null for unknown regions
    return null;
  } catch (error) {
    console.warn('Country detection failed:', error);
    return null;
  }
}

/**
 * Get country from coordinates using geographic bounds
 * This is a simplified implementation covering major alpine and European regions
 * @param coordinate The coordinate to check
 * @returns Country name or null
 */
function getCountryFromCoordinates(coordinate: Coordinate): string | null {
  const { lat, lng } = coordinate;
  
  // Switzerland
  if (lat >= 45.8 && lat <= 47.8 && lng >= 5.9 && lng <= 10.5) {
    return 'Switzerland';
  }
  
  // Austria (rough bounds)
  if (lat >= 46.4 && lat <= 49.0 && lng >= 9.5 && lng <= 17.2) {
    return 'Austria';
  }
  
  // France (simplified bounds)
  if (lat >= 42.0 && lat <= 51.1 && lng >= -5.0 && lng <= 8.2) {
    return 'France';
  }
  
  // Italy (simplified bounds)
  if (lat >= 36.0 && lat <= 47.1 && lng >= 6.6 && lng <= 18.8) {
    return 'Italy';
  }
  
  // Germany (simplified bounds)
  if (lat >= 47.3 && lat <= 55.1 && lng >= 5.9 && lng <= 15.0) {
    return 'Germany';
  }
  
  // Slovenia
  if (lat >= 45.4 && lat <= 46.9 && lng >= 13.4 && lng <= 16.6) {
    return 'Slovenia';
  }
  
  // Norway (simplified bounds)
  if (lat >= 58.0 && lat <= 71.2 && lng >= 4.6 && lng <= 31.3) {
    return 'Norway';
  }
  
  // United Kingdom (simplified bounds)
  if (lat >= 49.9 && lat <= 60.9 && lng >= -8.6 && lng <= 2.0) {
    return 'United Kingdom';
  }
  
  // Spain (simplified bounds)
  if (lat >= 36.0 && lat <= 43.8 && lng >= -9.3 && lng <= 3.3) {
    return 'Spain';
  }
  
  // Add more countries as needed based on usage patterns
  
  return null;
}

/**
 * Detect country from a route (uses start coordinate)
 * @param route Route object with start coordinate
 * @returns Promise resolving to country name or null
 */
export async function detectCountryFromRoute(route: { start: Coordinate }): Promise<string | null> {
  return detectCountryFromCoordinate(route.start);
}

/**
 * Extract unique countries from multiple routes
 * @param routes Array of routes
 * @returns Promise resolving to array of unique country names
 */
export async function extractCountriesFromRoutes(routes: { start: Coordinate }[]): Promise<string[]> {
  const countryPromises = routes.map(route => detectCountryFromRoute(route));
  const countries = await Promise.all(countryPromises);
  
  // Filter out nulls and get unique countries
  const uniqueCountries = Array.from(new Set(countries.filter(Boolean))) as string[];
  
  return uniqueCountries.sort();
}

/**
 * Get all supported countries for the filter dropdown
 * @returns Array of supported country names
 */
export function getSupportedCountries(): string[] {
  return [
    'Austria',
    'France', 
    'Germany',
    'Italy',
    'Norway',
    'Slovenia',
    'Spain',
    'Switzerland',
    'United Kingdom'
  ].sort();
}