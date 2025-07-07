import { NextRequest, NextResponse } from 'next/server';

/**
 * Reverse geocoding API endpoint using Mapbox MCP tools
 * POST /api/geocode/reverse
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { longitude, latitude } = body;

    // Validate required parameters
    if (typeof longitude !== 'number' || typeof latitude !== 'number') {
      return NextResponse.json(
        { error: 'Invalid coordinates provided' },
        { status: 400 }
      );
    }

    // Use coordinate-based country detection for now
    // In the future, this could be enhanced with proper Mapbox integration
    const country = getCountryFromCoordinatesSync({ lat: latitude, lng: longitude });
    
    if (country) {
      return NextResponse.json({ country });
    }

    // Return empty result if no country found
    return NextResponse.json({ country: null });

  } catch (error) {
    console.error('Reverse geocoding API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Synchronous country detection for API endpoint
 */
function getCountryFromCoordinatesSync(coordinate: { lat: number; lng: number }): string | null {
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