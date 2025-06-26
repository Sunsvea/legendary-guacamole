import { Coordinate } from '@/types/route';

const OPEN_METEO_ELEVATION_URL = 'https://api.open-meteo.com/v1/elevation';

export async function getElevation(coordinates: Coordinate[]): Promise<number[]> {
  try {
    const latitudes = coordinates.map(coord => coord.lat).join(',');
    const longitudes = coordinates.map(coord => coord.lng).join(',');

    const url = `${OPEN_METEO_ELEVATION_URL}?latitude=${latitudes}&longitude=${longitudes}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Elevation API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.elevation || !Array.isArray(data.elevation)) {
      throw new Error('Invalid elevation data format');
    }

    return data.elevation;
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