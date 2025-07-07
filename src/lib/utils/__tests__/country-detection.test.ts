import { 
  detectCountryFromCoordinate, 
  detectCountryFromRoute, 
  extractCountriesFromRoutes,
  getSupportedCountries 
} from '../country-detection';

describe('Country Detection', () => {
  describe('detectCountryFromCoordinate', () => {
    it('should detect Switzerland from Zurich coordinates', async () => {
      const zurich = { lat: 47.3769, lng: 8.5417 };
      const country = await detectCountryFromCoordinate(zurich);
      expect(country).toBe('Switzerland');
    });

    it('should detect Austria from Vienna coordinates', async () => {
      const vienna = { lat: 48.2082, lng: 16.3738 };
      const country = await detectCountryFromCoordinate(vienna);
      expect(country).toBe('Austria');
    });

    it('should detect France from Paris coordinates', async () => {
      const paris = { lat: 48.8566, lng: 2.3522 };
      const country = await detectCountryFromCoordinate(paris);
      expect(country).toBe('France');
    });

    it('should detect Italy from Rome coordinates', async () => {
      const rome = { lat: 41.9028, lng: 12.4964 };
      const country = await detectCountryFromCoordinate(rome);
      expect(country).toBe('Italy');
    });

    it('should detect Germany from Berlin coordinates', async () => {
      const berlin = { lat: 52.5200, lng: 13.4050 };
      const country = await detectCountryFromCoordinate(berlin);
      expect(country).toBe('Germany');
    });

    it('should return null for coordinates outside supported regions', async () => {
      const tokyo = { lat: 35.6762, lng: 139.6503 };
      const country = await detectCountryFromCoordinate(tokyo);
      expect(country).toBeNull();
    });
  });

  describe('detectCountryFromRoute', () => {
    it('should detect country from route start coordinate', async () => {
      const route = {
        start: { lat: 47.3769, lng: 8.5417 }
      };
      const country = await detectCountryFromRoute(route);
      expect(country).toBe('Switzerland');
    });
  });

  describe('extractCountriesFromRoutes', () => {
    it('should extract unique countries from multiple routes', async () => {
      const routes = [
        { start: { lat: 47.3769, lng: 8.5417 } }, // Switzerland
        { start: { lat: 48.2082, lng: 16.3738 } }, // Austria
        { start: { lat: 47.0502, lng: 8.3093 } },  // Switzerland (duplicate)
        { start: { lat: 48.8566, lng: 2.3522 } },  // France
      ];

      const countries = await extractCountriesFromRoutes(routes);
      expect(countries).toEqual(['Austria', 'France', 'Switzerland']);
    });

    it('should filter out null countries', async () => {
      const routes = [
        { start: { lat: 47.3769, lng: 8.5417 } }, // Switzerland
        { start: { lat: 35.6762, lng: 139.6503 } }, // Tokyo (null)
      ];

      const countries = await extractCountriesFromRoutes(routes);
      expect(countries).toEqual(['Switzerland']);
    });
  });

  describe('getSupportedCountries', () => {
    it('should return sorted list of supported countries', () => {
      const countries = getSupportedCountries();
      expect(countries).toEqual([
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
      ]);
    });

    it('should return countries in alphabetical order', () => {
      const countries = getSupportedCountries();
      const sorted = [...countries].sort();
      expect(countries).toEqual(sorted);
    });
  });
});