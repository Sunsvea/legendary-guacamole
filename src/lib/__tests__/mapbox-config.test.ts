import { MAPBOX_ACCESS_TOKEN } from '../mapbox-config';

describe('mapbox-config', () => {
  describe('MAPBOX_ACCESS_TOKEN', () => {
    it('should export a valid mapbox token format', () => {
      expect(MAPBOX_ACCESS_TOKEN).toMatch(/^pk\./);
      expect(typeof MAPBOX_ACCESS_TOKEN).toBe('string');
      expect(MAPBOX_ACCESS_TOKEN.length).toBeGreaterThan(10);
    });

    it('should be a non-empty string', () => {
      expect(MAPBOX_ACCESS_TOKEN).toBeTruthy();
      expect(MAPBOX_ACCESS_TOKEN.trim()).toBe(MAPBOX_ACCESS_TOKEN);
    });

    it('should follow Mapbox token format', () => {
      expect(MAPBOX_ACCESS_TOKEN).toMatch(/^pk\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/);
    });

    it('should be suitable for client-side use', () => {
      expect(MAPBOX_ACCESS_TOKEN).toMatch(/^pk\./);
    });
  });
});