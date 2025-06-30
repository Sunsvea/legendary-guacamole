import { Coordinate, RoutePoint, Route, WeatherData, PathfindingNode } from '../route';

describe('Route Types', () => {
  describe('Coordinate interface', () => {
    it('should accept valid coordinate objects', () => {
      const coord: Coordinate = {
        lat: 47.6062,
        lng: -122.3321
      };

      expect(coord.lat).toBe(47.6062);
      expect(coord.lng).toBe(-122.3321);
      expect(coord.elevation).toBeUndefined();
    });

    it('should accept coordinate with optional elevation', () => {
      const coord: Coordinate = {
        lat: 47.6062,
        lng: -122.3321,
        elevation: 1500
      };

      expect(coord.elevation).toBe(1500);
    });

    it('should handle boundary latitude values', () => {
      const northPole: Coordinate = { lat: 90, lng: 0 };
      const southPole: Coordinate = { lat: -90, lng: 0 };

      expect(northPole.lat).toBe(90);
      expect(southPole.lat).toBe(-90);
    });

    it('should handle boundary longitude values', () => {
      const eastBoundary: Coordinate = { lat: 0, lng: 180 };
      const westBoundary: Coordinate = { lat: 0, lng: -180 };

      expect(eastBoundary.lng).toBe(180);
      expect(westBoundary.lng).toBe(-180);
    });
  });

  describe('RoutePoint interface', () => {
    it('should extend Coordinate with required elevation', () => {
      const routePoint: RoutePoint = {
        lat: 47.6062,
        lng: -122.3321,
        elevation: 1500
      };

      expect(routePoint.lat).toBe(47.6062);
      expect(routePoint.lng).toBe(-122.3321);
      expect(routePoint.elevation).toBe(1500);
    });

    it('should accept optional difficulty and weather risk', () => {
      const routePoint: RoutePoint = {
        lat: 47.6062,
        lng: -122.3321,
        elevation: 1500,
        difficulty: 3.5,
        weatherRisk: 0.2
      };

      expect(routePoint.difficulty).toBe(3.5);
      expect(routePoint.weatherRisk).toBe(0.2);
    });

    it('should work without optional properties', () => {
      const routePoint: RoutePoint = {
        lat: 47.6062,
        lng: -122.3321,
        elevation: 1500
      };

      expect(routePoint.difficulty).toBeUndefined();
      expect(routePoint.weatherRisk).toBeUndefined();
    });
  });

  describe('Route interface', () => {
    const mockRoutePoints: RoutePoint[] = [
      { lat: 47.6062, lng: -122.3321, elevation: 100 },
      { lat: 47.6205, lng: -122.3493, elevation: 200 }
    ];

    it('should accept complete route object', () => {
      const route: Route = {
        id: 'route-123',
        name: 'Test Route',
        start: { lat: 47.6062, lng: -122.3321 },
        end: { lat: 47.6205, lng: -122.3493 },
        points: mockRoutePoints,
        distance: 5.2,
        elevationGain: 100,
        difficulty: 'moderate',
        estimatedTime: 2.5,
        createdAt: new Date('2023-01-01')
      };

      expect(route.id).toBe('route-123');
      expect(route.name).toBe('Test Route');
      expect(route.difficulty).toBe('moderate');
      expect(route.points).toHaveLength(2);
    });

    it('should enforce difficulty enum values', () => {
      const difficulties: Route['difficulty'][] = ['easy', 'moderate', 'hard', 'extreme'];
      
      difficulties.forEach(difficulty => {
        const route: Route = {
          id: 'test',
          name: 'Test',
          start: { lat: 0, lng: 0 },
          end: { lat: 1, lng: 1 },
          points: [],
          distance: 0,
          elevationGain: 0,
          difficulty,
          estimatedTime: 0,
          createdAt: new Date()
        };

        expect(route.difficulty).toBe(difficulty);
      });
    });

    it('should accept optional weather data', () => {
      const weatherData: WeatherData = {
        temperature: 15,
        windSpeed: 10,
        windDirection: 180,
        precipitation: 0.1,
        visibility: 10000,
        conditions: 'partly cloudy',
        timestamp: new Date()
      };

      const route: Route = {
        id: 'route-123',
        name: 'Test Route',
        start: { lat: 47.6062, lng: -122.3321 },
        end: { lat: 47.6205, lng: -122.3493 },
        points: mockRoutePoints,
        distance: 5.2,
        elevationGain: 100,
        difficulty: 'moderate',
        estimatedTime: 2.5,
        createdAt: new Date(),
        weather: weatherData
      };

      expect(route.weather).toEqual(weatherData);
    });
  });

  describe('WeatherData interface', () => {
    it('should accept complete weather data', () => {
      const weather: WeatherData = {
        temperature: 15,
        windSpeed: 10,
        windDirection: 180,
        precipitation: 0.1,
        visibility: 10000,
        conditions: 'partly cloudy',
        timestamp: new Date('2023-01-01T12:00:00Z')
      };

      expect(weather.temperature).toBe(15);
      expect(weather.windSpeed).toBe(10);
      expect(weather.windDirection).toBe(180);
      expect(weather.precipitation).toBe(0.1);
      expect(weather.visibility).toBe(10000);
      expect(weather.conditions).toBe('partly cloudy');
      expect(weather.timestamp).toBeInstanceOf(Date);
    });

    it('should handle various weather conditions', () => {
      const conditions = ['sunny', 'cloudy', 'rainy', 'snowy', 'foggy'];
      
      conditions.forEach(condition => {
        const weather: WeatherData = {
          temperature: 20,
          windSpeed: 5,
          windDirection: 90,
          precipitation: 0,
          visibility: 10000,
          conditions: condition,
          timestamp: new Date()
        };

        expect(weather.conditions).toBe(condition);
      });
    });

    it('should handle extreme weather values', () => {
      const extremeWeather: WeatherData = {
        temperature: -40,
        windSpeed: 150,
        windDirection: 359,
        precipitation: 100,
        visibility: 0,
        conditions: 'blizzard',
        timestamp: new Date()
      };

      expect(extremeWeather.temperature).toBe(-40);
      expect(extremeWeather.windSpeed).toBe(150);
      expect(extremeWeather.precipitation).toBe(100);
      expect(extremeWeather.visibility).toBe(0);
    });
  });

  describe('PathfindingNode interface', () => {
    it('should accept pathfinding node without parent', () => {
      const startNode: PathfindingNode = {
        coordinate: { lat: 47.6062, lng: -122.3321 },
        gCost: 0,
        hCost: 10,
        fCost: 10
      };

      expect(startNode.coordinate.lat).toBe(47.6062);
      expect(startNode.gCost).toBe(0);
      expect(startNode.hCost).toBe(10);
      expect(startNode.fCost).toBe(10);
      expect(startNode.parent).toBeUndefined();
    });

    it('should accept pathfinding node with parent', () => {
      const parentNode: PathfindingNode = {
        coordinate: { lat: 47.6062, lng: -122.3321 },
        gCost: 0,
        hCost: 10,
        fCost: 10
      };

      const childNode: PathfindingNode = {
        coordinate: { lat: 47.6205, lng: -122.3493 },
        gCost: 5,
        hCost: 5,
        fCost: 10,
        parent: parentNode
      };

      expect(childNode.parent).toBe(parentNode);
      expect(childNode.parent?.gCost).toBe(0);
    });

    it('should handle cost calculations', () => {
      const node: PathfindingNode = {
        coordinate: { lat: 47.6062, lng: -122.3321 },
        gCost: 7.5,
        hCost: 12.3,
        fCost: 19.8
      };

      expect(node.gCost).toBe(7.5);
      expect(node.hCost).toBe(12.3);
      expect(node.fCost).toBe(19.8);
      expect(node.gCost + node.hCost).toBeCloseTo(node.fCost);
    });

    it('should create linked list structure', () => {
      const node1: PathfindingNode = {
        coordinate: { lat: 1, lng: 1 },
        gCost: 0,
        hCost: 10,
        fCost: 10
      };

      const node2: PathfindingNode = {
        coordinate: { lat: 2, lng: 2 },
        gCost: 5,
        hCost: 5,
        fCost: 10,
        parent: node1
      };

      const node3: PathfindingNode = {
        coordinate: { lat: 3, lng: 3 },
        gCost: 10,
        hCost: 0,
        fCost: 10,
        parent: node2
      };

      expect(node3.parent).toBe(node2);
      expect(node3.parent?.parent).toBe(node1);
      expect(node3.parent?.parent?.parent).toBeUndefined();
    });
  });
});