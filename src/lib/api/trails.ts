import { Coordinate } from '@/types/route';

/**
 * Trail segment from OpenStreetMap data
 */
export interface TrailSegment {
  id: string;
  coordinates: Coordinate[];
  difficulty?: 'easy' | 'moderate' | 'difficult' | 'expert';
  surface?: string;
  trail_visibility?: string;
  sac_scale?: string; // Swiss Alpine Club scale
  name?: string;
  highway?: string; // OSM highway tag (path, track, footway, etc)
  isWater?: boolean; // Water bodies to avoid
  isRoad?: boolean; // Roads for faster travel
}

/**
 * Trail network for a given bounding box
 */
export interface TrailNetwork {
  trails: TrailSegment[];
  bbox: {
    minLat: number;
    maxLat: number;
    minLng: number;
    maxLng: number;
  };
  cacheTime: number;
}

/**
 * Calculate bounding box around a route with padding
 */
function calculateBoundingBox(start: Coordinate, end: Coordinate, paddingKm: number = 5): {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
} {
  // Convert km to approximate degrees (rough approximation)
  const latPadding = paddingKm / 111; // ~111km per degree latitude
  const lngPadding = paddingKm / (111 * Math.cos((start.lat + end.lat) / 2 * Math.PI / 180));
  
  return {
    minLat: Math.min(start.lat, end.lat) - latPadding,
    maxLat: Math.max(start.lat, end.lat) + latPadding,
    minLng: Math.min(start.lng, end.lng) - lngPadding,
    maxLng: Math.max(start.lng, end.lng) + lngPadding,
  };
}

/**
 * Build Overpass API query for hiking trails
 */
function buildOverpassQuery(bbox: { minLat: number; maxLat: number; minLng: number; maxLng: number }): string {
  const { minLat, minLng, maxLat, maxLng } = bbox;
  
  return `
    [out:json][timeout:25];
    (
      way["highway"~"^(path|track|footway|cycleway|bridleway|steps)$"](${minLat},${minLng},${maxLat},${maxLng});
      way["highway"~"^(tertiary|secondary|primary|trunk|residential|service)$"]["access"!="private"](${minLat},${minLng},${maxLat},${maxLng});
      way["route"="hiking"](${minLat},${minLng},${maxLat},${maxLng});
      way["sac_scale"](${minLat},${minLng},${maxLat},${maxLng});
      way["natural"="water"](${minLat},${minLng},${maxLat},${maxLng});
      way["waterway"~"^(river|stream|canal)$"](${minLat},${minLng},${maxLat},${maxLng});
      relation["natural"="water"](${minLat},${minLng},${maxLat},${maxLng});
    );
    out geom;
  `.trim();
}

/**
 * Cache for trail data to avoid repeated API calls
 */
const trailCache = new Map<string, TrailNetwork>();
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

/**
 * Generate cache key for bounding box
 */
function getCacheKey(bbox: { minLat: number; maxLat: number; minLng: number; maxLng: number }): string {
  return `${bbox.minLat.toFixed(3)}_${bbox.minLng.toFixed(3)}_${bbox.maxLat.toFixed(3)}_${bbox.maxLng.toFixed(3)}`;
}

/**
 * Check if cached data is still valid
 */
function isCacheValid(network: TrailNetwork): boolean {
  return Date.now() - network.cacheTime < CACHE_DURATION;
}

/**
 * Parse OSM difficulty tags to standardized difficulty levels
 */
function parseTrailDifficulty(tags: Record<string, string>): 'easy' | 'moderate' | 'difficult' | 'expert' | undefined {
  const sacScale = tags.sac_scale;
  const trailVisibility = tags.trail_visibility;
  
  // Swiss Alpine Club scale mapping
  if (sacScale) {
    switch (sacScale) {
      case 'hiking':
      case 'T1':
        return 'easy';
      case 'mountain_hiking':
      case 'T2':
        return 'moderate';
      case 'demanding_mountain_hiking':
      case 'T3':
        return 'difficult';
      case 'alpine_hiking':
      case 'T4':
      case 'T5':
      case 'T6':
        return 'expert';
    }
  }
  
  // Trail visibility fallback
  if (trailVisibility) {
    switch (trailVisibility) {
      case 'excellent':
      case 'good':
        return 'easy';
      case 'intermediate':
        return 'moderate';
      case 'bad':
        return 'difficult';
      case 'horrible':
      case 'no':
        return 'expert';
    }
  }
  
  return undefined;
}

/**
 * Fetch trail data from OpenStreetMap using Overpass API
 */
export async function fetchTrailData(start: Coordinate, end: Coordinate): Promise<TrailNetwork> {
  const bbox = calculateBoundingBox(start, end);
  const cacheKey = getCacheKey(bbox);
  
  // Check cache first
  const cached = trailCache.get(cacheKey);
  if (cached && isCacheValid(cached)) {
    console.log('Using cached trail data');
    return cached;
  }
  
  try {
    const query = buildOverpassQuery(bbox);
    const response = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `data=${encodeURIComponent(query)}`,
    });
    
    if (!response.ok) {
      throw new Error(`Overpass API error: ${response.status}`);
    }
    
    const data = await response.json();
    const trails: TrailSegment[] = [];
    
    // Process OSM ways into trail segments
    for (const element of data.elements) {
      if (element.type === 'way' && element.geometry) {
        const coordinates: Coordinate[] = element.geometry.map((node: { lat: number; lon: number }) => ({
          lat: node.lat,
          lng: node.lon,
        }));
        
        if (coordinates.length < 2) continue; // Skip invalid trails
        
        const tags = element.tags || {};
        
        // Identify water bodies
        const isWater = tags.natural === 'water' || 
                       tags.waterway === 'river' || 
                       tags.waterway === 'stream' || 
                       tags.waterway === 'canal';
        
        // Identify roads for faster travel
        const isRoad = tags.highway && 
                      ['tertiary', 'secondary', 'primary', 'trunk', 'residential', 'service'].includes(tags.highway);
        
        const trail: TrailSegment = {
          id: element.id.toString(),
          coordinates,
          difficulty: parseTrailDifficulty(tags),
          surface: tags.surface,
          trail_visibility: tags.trail_visibility,
          sac_scale: tags.sac_scale,
          name: tags.name,
          highway: tags.highway,
          isWater,
          isRoad,
        };
        
        trails.push(trail);
      }
    }
    
    const network: TrailNetwork = {
      trails,
      bbox,
      cacheTime: Date.now(),
    };
    
    // Cache the result
    trailCache.set(cacheKey, network);
    
    console.log(`Fetched ${trails.length} trail segments from OSM`);
    return network;
    
  } catch (error) {
    console.error('Error fetching trail data:', error);
    
    // Return empty network on error
    return {
      trails: [],
      bbox,
      cacheTime: Date.now(),
    };
  }
}

// Cache for distance calculations to avoid repeated work
const distanceCache = new Map<string, number>();

/**
 * Cached distance calculation
 */
function cachedCalculateDistance(coord1: Coordinate, coord2: Coordinate): number {
  const key = `${coord1.lat.toFixed(4)}_${coord1.lng.toFixed(4)}_${coord2.lat.toFixed(4)}_${coord2.lng.toFixed(4)}`;
  
  if (distanceCache.has(key)) {
    return distanceCache.get(key)!;
  }
  
  const distance = calculateDistance(coord1, coord2);
  distanceCache.set(key, distance);
  
  // Limit cache size
  if (distanceCache.size > 1000) {
    const firstKey = distanceCache.keys().next().value;
    if (firstKey) {
      distanceCache.delete(firstKey);
    }
  }
  
  return distance;
}

/**
 * Find the nearest trail point to a given coordinate (optimized)
 */
export function findNearestTrailPoint(
  coordinate: Coordinate, 
  trails: TrailSegment[], 
  maxDistanceKm: number = 0.5
): { trail: TrailSegment; point: Coordinate; distance: number } | null {
  let nearest: { trail: TrailSegment; point: Coordinate; distance: number } | null = null;
  
  // Early exit if no trails
  if (trails.length === 0) return null;
  
  for (const trail of trails) {
    // Skip trails with no coordinates
    if (!trail.coordinates || trail.coordinates.length === 0) continue;
    
    // Sample every few points for performance instead of checking every point
    const sampleRate = Math.max(1, Math.floor(trail.coordinates.length / 10));
    
    for (let i = 0; i < trail.coordinates.length; i += sampleRate) {
      const point = trail.coordinates[i];
      const distance = cachedCalculateDistance(coordinate, point);
      
      if (distance <= maxDistanceKm && (!nearest || distance < nearest.distance)) {
        nearest = { trail, point, distance };
        
        // Early exit if we find a very close point
        if (distance < 0.05) break; // 50m
      }
    }
    
    // If we found something very close, no need to check more trails
    if (nearest && nearest.distance < 0.05) break;
  }
  
  return nearest;
}

/**
 * Calculate distance between two coordinates (Haversine formula)
 * @param coord1 First coordinate
 * @param coord2 Second coordinate
 * @returns Distance in kilometers
 */
function calculateDistance(coord1: Coordinate, coord2: Coordinate): number {
  const R = 6371; // Earth's radius in km
  const dLat = (coord2.lat - coord1.lat) * Math.PI / 180;
  const dLng = (coord2.lng - coord1.lng) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(coord1.lat * Math.PI / 180) * Math.cos(coord2.lat * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Cache for trail proximity checks
const trailProximityCache = new Map<string, boolean>();

/**
 * Check if a coordinate is close to any trail (optimized with caching)
 */
export function isOnTrail(
  coordinate: Coordinate, 
  trails: TrailSegment[], 
  maxDistanceKm: number = 0.1
): boolean {
  // Create cache key
  const key = `${coordinate.lat.toFixed(4)}_${coordinate.lng.toFixed(4)}_${maxDistanceKm.toFixed(2)}_${trails.length}`;
  
  if (trailProximityCache.has(key)) {
    return trailProximityCache.get(key)!;
  }
  
  const result = findNearestTrailPoint(coordinate, trails, maxDistanceKm) !== null;
  
  // Cache the result
  trailProximityCache.set(key, result);
  
  // Limit cache size
  if (trailProximityCache.size > 500) {
    const firstKey = trailProximityCache.keys().next().value;
    if (firstKey) {
      trailProximityCache.delete(firstKey);
    }
  }
  
  return result;
}