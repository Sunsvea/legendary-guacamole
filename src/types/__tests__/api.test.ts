import { ElevationResponse, WeatherResponse, ApiError } from '../api';

describe('API Types', () => {
  describe('ElevationResponse interface', () => {
    it('should accept valid elevation response', () => {
      const response: ElevationResponse = {
        results: [
          {
            latitude: 47.6062,
            longitude: -122.3321,
            elevation: 100
          },
          {
            latitude: 47.6205,
            longitude: -122.3493,
            elevation: 200
          }
        ],
        status: 'OK'
      };

      expect(response.results).toHaveLength(2);
      expect(response.status).toBe('OK');
      expect(response.results[0].latitude).toBe(47.6062);
      expect(response.results[0].longitude).toBe(-122.3321);
      expect(response.results[0].elevation).toBe(100);
    });

    it('should accept empty results array', () => {
      const response: ElevationResponse = {
        results: [],
        status: 'NO_DATA'
      };

      expect(response.results).toHaveLength(0);
      expect(response.status).toBe('NO_DATA');
    });

    it('should handle multiple elevation points', () => {
      const response: ElevationResponse = {
        results: Array.from({ length: 100 }, (_, i) => ({
          latitude: 47.6 + i * 0.001,
          longitude: -122.3 + i * 0.001,
          elevation: 100 + i * 10
        })),
        status: 'OK'
      };

      expect(response.results).toHaveLength(100);
      expect(response.results[99].elevation).toBe(100 + 99 * 10);
    });

    it('should handle negative elevations', () => {
      const response: ElevationResponse = {
        results: [
          {
            latitude: 35.0,
            longitude: -115.0,
            elevation: -86
          }
        ],
        status: 'OK'
      };

      expect(response.results[0].elevation).toBe(-86);
    });

    it('should handle various status values', () => {
      const statuses = ['OK', 'ERROR', 'NO_DATA', 'RATE_LIMITED'];
      
      statuses.forEach(status => {
        const response: ElevationResponse = {
          results: [],
          status
        };
        
        expect(response.status).toBe(status);
      });
    });
  });

  describe('WeatherResponse interface', () => {
    it('should accept complete weather response', () => {
      const response: WeatherResponse = {
        latitude: 47.6062,
        longitude: -122.3321,
        current_weather: {
          temperature: 15.5,
          windspeed: 12.3,
          winddirection: 180,
          weathercode: 3,
          time: '2023-01-01T12:00'
        },
        hourly: {
          time: ['2023-01-01T00:00', '2023-01-01T01:00'],
          temperature_2m: [12.0, 13.0],
          precipitation: [0.0, 0.1],
          windspeed_10m: [10.0, 15.0],
          winddirection_10m: [170, 180],
          visibility: [10000, 8000]
        }
      };

      expect(response.latitude).toBe(47.6062);
      expect(response.longitude).toBe(-122.3321);
      expect(response.current_weather.temperature).toBe(15.5);
      expect(response.hourly.time).toHaveLength(2);
    });

    it('should handle current weather data', () => {
      const currentWeather = {
        temperature: -10.5,
        windspeed: 25.7,
        winddirection: 359,
        weathercode: 95,
        time: '2023-12-01T15:30'
      };

      const response: WeatherResponse = {
        latitude: 47.6062,
        longitude: -122.3321,
        current_weather: currentWeather,
        hourly: {
          time: [],
          temperature_2m: [],
          precipitation: [],
          windspeed_10m: [],
          winddirection_10m: [],
          visibility: []
        }
      };

      expect(response.current_weather.temperature).toBe(-10.5);
      expect(response.current_weather.windspeed).toBe(25.7);
      expect(response.current_weather.winddirection).toBe(359);
      expect(response.current_weather.weathercode).toBe(95);
    });

    it('should handle hourly forecast arrays', () => {
      const response: WeatherResponse = {
        latitude: 47.6062,
        longitude: -122.3321,
        current_weather: {
          temperature: 15,
          windspeed: 10,
          winddirection: 180,
          weathercode: 1,
          time: '2023-01-01T12:00'
        },
        hourly: {
          time: ['2023-01-01T00:00', '2023-01-01T01:00', '2023-01-01T02:00'],
          temperature_2m: [10.0, 11.0, 12.0],
          precipitation: [0.0, 0.5, 1.2],
          windspeed_10m: [8.0, 12.0, 15.0],
          winddirection_10m: [170, 180, 190],
          visibility: [10000, 5000, 2000]
        }
      };

      expect(response.hourly.time).toHaveLength(3);
      expect(response.hourly.temperature_2m).toHaveLength(3);
      expect(response.hourly.precipitation[2]).toBe(1.2);
      expect(response.hourly.windspeed_10m[2]).toBe(15.0);
      expect(response.hourly.visibility[2]).toBe(2000);
    });

    it('should handle empty hourly arrays', () => {
      const response: WeatherResponse = {
        latitude: 47.6062,
        longitude: -122.3321,
        current_weather: {
          temperature: 20,
          windspeed: 5,
          winddirection: 90,
          weathercode: 0,
          time: '2023-01-01T12:00'
        },
        hourly: {
          time: [],
          temperature_2m: [],
          precipitation: [],
          windspeed_10m: [],
          winddirection_10m: [],
          visibility: []
        }
      };

      expect(response.hourly.time).toHaveLength(0);
      expect(response.hourly.temperature_2m).toHaveLength(0);
    });

    it('should handle extreme weather values', () => {
      const response: WeatherResponse = {
        latitude: 90, // North Pole
        longitude: 0,
        current_weather: {
          temperature: -50,
          windspeed: 150,
          winddirection: 0,
          weathercode: 99,
          time: '2023-01-01T00:00'
        },
        hourly: {
          time: ['2023-01-01T00:00'],
          temperature_2m: [-60],
          precipitation: [50.0],
          windspeed_10m: [200],
          winddirection_10m: [360],
          visibility: [0]
        }
      };

      expect(response.current_weather.temperature).toBe(-50);
      expect(response.current_weather.windspeed).toBe(150);
      expect(response.hourly.precipitation[0]).toBe(50.0);
      expect(response.hourly.windspeed_10m[0]).toBe(200);
    });
  });

  describe('ApiError interface', () => {
    it('should accept valid API error', () => {
      const error: ApiError = {
        message: 'Rate limit exceeded',
        status: 429
      };

      expect(error.message).toBe('Rate limit exceeded');
      expect(error.status).toBe(429);
    });

    it('should handle various HTTP status codes', () => {
      const statusCodes = [400, 401, 403, 404, 500, 502, 503];
      
      statusCodes.forEach(status => {
        const error: ApiError = {
          message: `HTTP Error ${status}`,
          status
        };
        
        expect(error.status).toBe(status);
        expect(error.message).toContain(status.toString());
      });
    });

    it('should handle various error messages', () => {
      const errorMessages = [
        'Invalid coordinates',
        'Service temporarily unavailable',
        'Authentication failed',
        'Request timeout',
        'Invalid API key'
      ];

      errorMessages.forEach(message => {
        const error: ApiError = {
          message,
          status: 400
        };
        
        expect(error.message).toBe(message);
      });
    });

    it('should handle empty error message', () => {
      const error: ApiError = {
        message: '',
        status: 500
      };

      expect(error.message).toBe('');
      expect(error.status).toBe(500);
    });

    it('should handle long error messages', () => {
      const longMessage = 'A'.repeat(1000);
      const error: ApiError = {
        message: longMessage,
        status: 400
      };

      expect(error.message).toHaveLength(1000);
      expect(error.message).toBe(longMessage);
    });
  });

  describe('type validation and edge cases', () => {
    it('should handle boundary coordinate values in elevation response', () => {
      const response: ElevationResponse = {
        results: [
          { latitude: -90, longitude: -180, elevation: 0 },
          { latitude: 90, longitude: 180, elevation: 8848 },
          { latitude: 0, longitude: 0, elevation: -11034 }
        ],
        status: 'OK'
      };

      expect(response.results[0].latitude).toBe(-90);
      expect(response.results[1].longitude).toBe(180);
      expect(response.results[2].elevation).toBe(-11034);
    });

    it('should handle large dataset in weather response', () => {
      const hourlyData = Array.from({ length: 168 }, (_, i) => ({
        time: `2023-01-${Math.floor(i / 24) + 1}T${i % 24}:00`,
        temp: 15 + Math.sin(i / 24) * 10,
        precip: Math.random() * 5,
        wind: 5 + Math.random() * 20,
        dir: (i * 15) % 360,
        vis: 1000 + Math.random() * 9000
      }));

      const response: WeatherResponse = {
        latitude: 47.6062,
        longitude: -122.3321,
        current_weather: {
          temperature: 15,
          windspeed: 10,
          winddirection: 180,
          weathercode: 1,
          time: '2023-01-01T12:00'
        },
        hourly: {
          time: hourlyData.map(d => d.time),
          temperature_2m: hourlyData.map(d => d.temp),
          precipitation: hourlyData.map(d => d.precip),
          windspeed_10m: hourlyData.map(d => d.wind),
          winddirection_10m: hourlyData.map(d => d.dir),
          visibility: hourlyData.map(d => d.vis)
        }
      };

      expect(response.hourly.time).toHaveLength(168);
      expect(response.hourly.temperature_2m).toHaveLength(168);
    });
  });
});