import { MAPBOX_ACCESS_TOKEN } from '../mapbox-config';

describe('mapbox-config', () => {
  let originalEnv: string | undefined;

  beforeEach(() => {
    originalEnv = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;
  });

  afterEach(() => {
    if (originalEnv === undefined) {
      delete process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;
    } else {
      process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN = originalEnv;
    }
  });

  describe('MAPBOX_ACCESS_TOKEN', () => {
    it('should use environment variable when available', () => {
      const testToken = 'pk.test123';
      process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN = testToken;
      
      jest.resetModules();
      const { MAPBOX_ACCESS_TOKEN } = require('../mapbox-config');
      
      expect(MAPBOX_ACCESS_TOKEN).toBe(testToken);
    });

    it('should use default token when environment variable is not set', () => {
      delete process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;
      
      jest.resetModules();
      const { MAPBOX_ACCESS_TOKEN } = require('../mapbox-config');
      
      expect(MAPBOX_ACCESS_TOKEN).toBe('pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4M3VycTA2emYycXBndHRqcmZ3N3gifQ.rJcFIG214AriISLbB6B5aw');
    });

    it('should use default token when environment variable is empty string', () => {
      process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN = '';
      
      jest.resetModules();
      const { MAPBOX_ACCESS_TOKEN } = require('../mapbox-config');
      
      expect(MAPBOX_ACCESS_TOKEN).toBe('pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4M3VycTA2emYycXBndHRqcmZ3N3gifQ.rJcFIG214AriISLbB6B5aw');
    });

    it('should export a valid mapbox token format', () => {
      expect(MAPBOX_ACCESS_TOKEN).toMatch(/^pk\./);
      expect(typeof MAPBOX_ACCESS_TOKEN).toBe('string');
      expect(MAPBOX_ACCESS_TOKEN.length).toBeGreaterThan(10);
    });
  });
});