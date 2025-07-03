import { COLORS } from '../colors';

describe('COLORS', () => {
  describe('structure and organization', () => {
    it('should have main color categories', () => {
      expect(COLORS).toHaveProperty('ELEVATION');
      expect(COLORS).toHaveProperty('START_POINT');
      expect(COLORS).toHaveProperty('END_POINT');
      expect(COLORS).toHaveProperty('TEXT');
    });

    it('should have nested elevation colors', () => {
      expect(COLORS.ELEVATION).toHaveProperty('LOW');
      expect(COLORS.ELEVATION).toHaveProperty('MED_LOW');
      expect(COLORS.ELEVATION).toHaveProperty('MEDIUM');
      expect(COLORS.ELEVATION).toHaveProperty('MED_HIGH');
      expect(COLORS.ELEVATION).toHaveProperty('HIGH');
    });

    it('should have text color categories', () => {
      expect(COLORS.TEXT).toHaveProperty('PRIMARY');
      expect(COLORS.TEXT).toHaveProperty('SECONDARY');
      expect(COLORS.TEXT).toHaveProperty('MUTED');
      expect(COLORS.TEXT).toHaveProperty('BLUE');
      expect(COLORS.TEXT).toHaveProperty('GREEN');
      expect(COLORS.TEXT).toHaveProperty('RED');
    });

  });

  describe('color format validation', () => {
    it('should have valid hex color format for direct colors', () => {
      expect(COLORS.START_POINT).toMatch(/^#[0-9a-f]{6}$/i);
      expect(COLORS.END_POINT).toMatch(/^#[0-9a-f]{6}$/i);
      expect(COLORS.WAYPOINT).toMatch(/^#[0-9a-f]{6}$/i);
    });

    it('should have valid hex colors for elevation palette', () => {
      Object.values(COLORS.ELEVATION).forEach(color => {
        expect(color).toMatch(/^#[0-9a-f]{6}$/i);
      });
    });

    it('should have valid Tailwind class format for text colors', () => {
      Object.values(COLORS.TEXT).forEach(className => {
        expect(className).toMatch(/^text-[\w-]+$/);
      });
    });

  });

  describe('color accessibility and contrast', () => {
    it('should use appropriate colors for start and end points', () => {
      expect(COLORS.START_POINT).toBe('#22c55e');
      expect(COLORS.END_POINT).toBe('#ef4444');
      expect(COLORS.START_POINT).not.toBe(COLORS.END_POINT);
    });

    it('should have progressive elevation color scheme', () => {
      const elevationColors = COLORS.ELEVATION;
      expect(elevationColors.LOW).toBe('#22c55e');
      expect(elevationColors.MED_LOW).toBe('#84cc16');
      expect(elevationColors.MEDIUM).toBe('#eab308');
      expect(elevationColors.MED_HIGH).toBe('#f97316');
      expect(elevationColors.HIGH).toBe('#dc2626');
    });

    it('should have consistent gray text hierarchy', () => {
      expect(COLORS.TEXT.PRIMARY).toBe('text-gray-900');
      expect(COLORS.TEXT.SECONDARY).toBe('text-gray-600');
      expect(COLORS.TEXT.MUTED).toBe('text-gray-500');
    });
  });

  describe('theme consistency', () => {
    it('should use consistent color naming convention', () => {
      const keys = Object.keys(COLORS);
      keys.forEach(key => {
        expect(key).toMatch(/^[A-Z_]+$/);
      });
    });

    it('should have semantic color names for UI elements', () => {
      expect(COLORS.TEXT.BLUE).toBe('text-blue-600');
      expect(COLORS.TEXT.GREEN).toBe('text-green-600');
      expect(COLORS.TEXT.RED).toBe('text-red-600');
      expect(COLORS.TEXT.ORANGE).toBe('text-orange-600');
    });

  });

  describe('elevation color progression', () => {
    it('should represent natural elevation progression', () => {
      expect(COLORS.ELEVATION.LOW).toMatch(/^#[2-4]/);
      expect(COLORS.ELEVATION.HIGH).toMatch(/^#[d-f]/);
    });

    it('should have all 5 elevation levels', () => {
      const elevationLevels = Object.keys(COLORS.ELEVATION);
      expect(elevationLevels).toHaveLength(5);
      expect(elevationLevels).toContain('LOW');
      expect(elevationLevels).toContain('HIGH');
    });
  });
});