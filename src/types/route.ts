export interface Coordinate {
  lat: number;
  lng: number;
  elevation?: number;
}

export interface RoutePoint extends Coordinate {
  elevation: number;
  difficulty?: number;
  weatherRisk?: number;
}

export interface Route {
  id: string;
  name: string;
  start: Coordinate;
  end: Coordinate;
  points: RoutePoint[];
  distance: number;
  elevationGain: number;
  difficulty: 'easy' | 'moderate' | 'hard' | 'extreme';
  estimatedTime: number;
  createdAt: Date;
  weather?: WeatherData;
}

export interface WeatherData {
  temperature: number;
  windSpeed: number;
  windDirection: number;
  precipitation: number;
  visibility: number;
  conditions: string;
  timestamp: Date;
}

export interface PathfindingNode {
  coordinate: Coordinate;
  gCost: number;
  hCost: number;
  fCost: number;
  parent?: PathfindingNode;
}