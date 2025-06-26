import { Coordinate } from '@/types/route';
import { ElevationResponse } from '@/types/api';

const OPEN_ELEVATION_URL = 'https://api.open-elevation.com/api/v1/lookup';

export async function getElevation(coordinates: Coordinate[]): Promise<number[]> {
  try {
    const locations = coordinates.map(coord => ({
      latitude: coord.lat,
      longitude: coord.lng
    }));

    const response = await fetch(OPEN_ELEVATION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ locations }),
    });

    if (!response.ok) {
      throw new Error(`Elevation API error: ${response.status}`);
    }

    const data: ElevationResponse = await response.json();
    
    if (data.status !== 'OK') {
      throw new Error(`Elevation API status: ${data.status}`);
    }

    return data.results.map(result => result.elevation);
  } catch (error) {
    console.error('Error fetching elevation data:', error);
    throw new Error('Failed to fetch elevation data');
  }
}

export async function getElevationForRoute(
  start: Coordinate, 
  end: Coordinate, 
  resolution: number = 0.001
): Promise<Coordinate[]> {
  const points: Coordinate[] = [];
  
  const latDiff = end.lat - start.lat;
  const lngDiff = end.lng - start.lng;
  const distance = Math.sqrt(latDiff * latDiff + lngDiff * lngDiff);
  const steps = Math.ceil(distance / resolution);
  
  for (let i = 0; i <= steps; i++) {
    const ratio = i / steps;
    points.push({
      lat: start.lat + latDiff * ratio,
      lng: start.lng + lngDiff * ratio,
    });
  }

  try {
    const elevations = await getElevation(points);
    return points.map((point, index) => ({
      ...point,
      elevation: elevations[index],
    }));
  } catch (error) {
    console.error('Error getting elevation for route:', error);
    return points.map(point => ({ ...point, elevation: 0 }));
  }
}