import { Coordinate } from '@/types/route';

/**
 * Country detection utilities for routes using Mapbox reverse geocoding
 */

/**
 * Cache for country detection to avoid repeated API calls
 */
const countryCache = new Map<string, string | null>();

/**
 * Generate cache key for coordinates (rounded to reduce cache size)
 */
function getCacheKey(coordinate: Coordinate): string {
  const lat = Math.round(coordinate.lat * 100) / 100; // Round to 2 decimal places
  const lng = Math.round(coordinate.lng * 100) / 100;
  return `${lat},${lng}`;
}

/**
 * Detect country from coordinates using Mapbox reverse geocoding
 * @param coordinate The coordinate to check
 * @returns Promise resolving to country name or null if not found
 */
export async function detectCountryFromCoordinate(coordinate: Coordinate): Promise<string | null> {
  const cacheKey = getCacheKey(coordinate);
  
  // Check cache first
  if (countryCache.has(cacheKey)) {
    return countryCache.get(cacheKey) || null;
  }

  try {
    // Use our API endpoint that integrates with Mapbox
    const response = await fetch('/api/geocode/reverse', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        longitude: coordinate.lng,
        latitude: coordinate.lat,
        types: ['country'],
        limit: 1
      })
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }

    const data = await response.json();
    
    // Extract country name from response
    let country: string | null = null;
    if (data.features && data.features.length > 0) {
      country = data.features[0].properties.name;
    }
    
    countryCache.set(cacheKey, country);
    return country;
    
  } catch (error) {
    console.warn('Mapbox country detection failed, using fallback:', error);
    // Fallback to enhanced bounds if API fails
    const country = getCountryFromCoordinatesEnhanced(coordinate);
    countryCache.set(cacheKey, country);
    return country;
  }
}

/**
 * Enhanced country detection with better coverage
 * Used as primary method or fallback when Mapbox API is unavailable
 */
function getCountryFromCoordinatesEnhanced(coordinate: Coordinate): string | null {
  const { lat, lng } = coordinate;
  
  // Switzerland
  if (lat >= 45.8 && lat <= 47.8 && lng >= 5.9 && lng <= 10.5) {
    return 'Switzerland';
  }
  
  // Austria
  if (lat >= 46.4 && lat <= 49.0 && lng >= 9.5 && lng <= 17.2) {
    return 'Austria';
  }
  
  // France
  if (lat >= 42.0 && lat <= 51.1 && lng >= -5.0 && lng <= 8.2) {
    return 'France';
  }
  
  // Italy
  if (lat >= 36.0 && lat <= 47.1 && lng >= 6.6 && lng <= 18.8) {
    return 'Italy';
  }
  
  // Germany
  if (lat >= 47.3 && lat <= 55.1 && lng >= 5.9 && lng <= 15.0) {
    return 'Germany';
  }
  
  // Slovenia
  if (lat >= 45.4 && lat <= 46.9 && lng >= 13.4 && lng <= 16.6) {
    return 'Slovenia';
  }
  
  // Norway
  if (lat >= 58.0 && lat <= 71.2 && lng >= 4.6 && lng <= 31.3) {
    return 'Norway';
  }
  
  // United Kingdom
  if (lat >= 49.9 && lat <= 60.9 && lng >= -8.6 && lng <= 2.0) {
    return 'United Kingdom';
  }
  
  // Spain
  if (lat >= 36.0 && lat <= 43.8 && lng >= -9.3 && lng <= 3.3) {
    return 'Spain';
  }

  // Belgium
  if (lat >= 49.5 && lat <= 51.5 && lng >= 2.5 && lng <= 6.4) {
    return 'Belgium';
  }

  // Netherlands
  if (lat >= 50.8 && lat <= 53.6 && lng >= 3.4 && lng <= 7.2) {
    return 'Netherlands';
  }

  // Czech Republic
  if (lat >= 48.5 && lat <= 51.1 && lng >= 12.1 && lng <= 18.9) {
    return 'Czech Republic';
  }

  // Poland
  if (lat >= 49.0 && lat <= 54.8 && lng >= 14.1 && lng <= 24.2) {
    return 'Poland';
  }

  // Sweden
  if (lat >= 55.3 && lat <= 69.1 && lng >= 11.0 && lng <= 24.2) {
    return 'Sweden';
  }

  // Finland
  if (lat >= 59.8 && lat <= 70.1 && lng >= 20.5 && lng <= 31.6) {
    return 'Finland';
  }
  
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
    'Belgium',
    'Czech Republic',
    'Finland',
    'France', 
    'Germany',
    'Italy',
    'Netherlands',
    'Norway',
    'Poland',
    'Slovenia',
    'Spain',
    'Sweden',
    'Switzerland',
    'United Kingdom'
  ].sort();
}