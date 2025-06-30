import { UI_TEXT } from '../ui-text';

describe('UI_TEXT', () => {
  describe('structure and completeness', () => {
    it('should have all required sections', () => {
      expect(UI_TEXT).toHaveProperty('APP_TITLE');
      expect(UI_TEXT).toHaveProperty('HERO_TITLE');
      expect(UI_TEXT).toHaveProperty('PLAN_YOUR_ROUTE');
      expect(UI_TEXT).toHaveProperty('ROUTE_SUMMARY');
      expect(UI_TEXT).toHaveProperty('ROUTE_MAP');
      expect(UI_TEXT).toHaveProperty('ELEVATION_PROFILE');
    });

    it('should have navigation texts', () => {
      expect(UI_TEXT.NAV_ROUTES).toBe('Routes');
      expect(UI_TEXT.NAV_WEATHER).toBe('Weather');
      expect(UI_TEXT.NAV_ABOUT).toBe('About');
    });

    it('should have form field labels', () => {
      expect(UI_TEXT.START_POINT).toBe('Start Point');
      expect(UI_TEXT.END_POINT).toBe('End Point');
      expect(UI_TEXT.LATITUDE_PLACEHOLDER).toBe('Latitude');
      expect(UI_TEXT.LONGITUDE_PLACEHOLDER).toBe('Longitude');
    });

    it('should have error messages', () => {
      expect(UI_TEXT.FILL_ALL_COORDINATES).toContain('coordinates');
      expect(UI_TEXT.ENTER_VALID_COORDINATES).toContain('valid');
      expect(UI_TEXT.NO_ROUTE_FOUND).toContain('route');
      expect(UI_TEXT.ERROR_PLANNING_ROUTE).toContain('Error');
    });

    it('should have units for measurements', () => {
      expect(UI_TEXT.UNIT_KM).toBe('km');
      expect(UI_TEXT.UNIT_M).toBe('m');
      expect(UI_TEXT.UNIT_H).toBe('h');
      expect(UI_TEXT.UNIT_DEGREES).toBe('°');
    });
  });

  describe('text content validation', () => {
    it('should have non-empty string values', () => {
      Object.values(UI_TEXT).forEach(value => {
        expect(typeof value).toBe('string');
        expect(value.length).toBeGreaterThan(0);
        expect(value.trim()).toBe(value);
      });
    });

    it('should have consistent capitalization for labels', () => {
      const labels = [
        UI_TEXT.START_POINT,
        UI_TEXT.END_POINT,
        UI_TEXT.ROUTE_SUMMARY,
        UI_TEXT.ROUTE_MAP,
        UI_TEXT.ELEVATION_PROFILE
      ];

      labels.forEach(label => {
        expect(label[0]).toMatch(/[A-Z]/);
      });
    });

    it('should have proper app title', () => {
      expect(UI_TEXT.APP_TITLE).toBe('Alpine Route Optimizer');
      expect(UI_TEXT.APP_TITLE).toContain('Alpine');
      expect(UI_TEXT.APP_TITLE).toContain('Route');
      expect(UI_TEXT.APP_TITLE).toContain('Optimizer');
    });

    it('should have informative hero text', () => {
      expect(UI_TEXT.HERO_TITLE).toContain('Alpine');
      expect(UI_TEXT.HERO_DESCRIPTION).toContain('mountain');
      expect(UI_TEXT.HERO_DESCRIPTION).toContain('AI-powered');
    });
  });

  describe('internationalization readiness', () => {
    it('should be exported as const for type safety', () => {
      const keys = Object.keys(UI_TEXT);
      expect(keys.length).toBeGreaterThan(30);
    });

    it('should not contain template literals or dynamic content', () => {
      Object.values(UI_TEXT).forEach(value => {
        expect(value).not.toContain('$');
        expect(value).not.toContain('{{');
        expect(value).not.toContain('#{');
      });
    });

    it('should have coordinate tip with proper formatting', () => {
      expect(UI_TEXT.COORDINATE_TIP).toContain('decimal degrees');
      expect(UI_TEXT.COORDINATE_TIP).toContain('Positive');
      expect(UI_TEXT.COORDINATE_TIP).toContain('Example');
    });
  });

  describe('elevation and route specific texts', () => {
    it('should have elevation level descriptions', () => {
      expect(UI_TEXT.ELEVATION_LOW).toBe('Low');
      expect(UI_TEXT.ELEVATION_MED_LOW).toBe('Med-Low');
      expect(UI_TEXT.ELEVATION_MEDIUM).toBe('Medium');
      expect(UI_TEXT.ELEVATION_MED_HIGH).toBe('Med-High');
      expect(UI_TEXT.ELEVATION_HIGH).toBe('High');
    });

    it('should have chart and map labels', () => {
      expect(UI_TEXT.START_LABEL).toBe('START');
      expect(UI_TEXT.END_LABEL).toBe('END');
      expect(UI_TEXT.START_CHART_LABEL).toBe('Start');
      expect(UI_TEXT.END_CHART_LABEL).toBe('End');
    });

    it('should have metric labels', () => {
      expect(UI_TEXT.DISTANCE).toBe('Distance');
      expect(UI_TEXT.ELEVATION_GAIN).toBe('Elevation Gain');
      expect(UI_TEXT.DIFFICULTY).toBe('Difficulty');
      expect(UI_TEXT.ESTIMATED_TIME).toBe('Est. Time');
    });
  });
});