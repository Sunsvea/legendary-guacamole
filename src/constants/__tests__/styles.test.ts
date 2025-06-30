import { STYLES } from '../styles';

describe('STYLES', () => {
  describe('structure and categories', () => {
    it('should have all main style categories', () => {
      expect(STYLES).toHaveProperty('CONTAINER');
      expect(STYLES).toHaveProperty('CARD');
      expect(STYLES).toHaveProperty('HEADING_XL');
      expect(STYLES).toHaveProperty('BUTTON_SECONDARY');
      expect(STYLES).toHaveProperty('FLEX_CENTER');
    });

    it('should have container and layout styles', () => {
      expect(STYLES).toHaveProperty('CONTAINER');
      expect(STYLES).toHaveProperty('MAX_WIDTH_4XL');
      expect(STYLES).toHaveProperty('MAX_WIDTH_2XL');
    });

    it('should have spacing utilities', () => {
      expect(STYLES).toHaveProperty('SPACE_Y_4');
      expect(STYLES).toHaveProperty('SPACE_Y_8');
      expect(STYLES).toHaveProperty('SPACE_X_2');
      expect(STYLES).toHaveProperty('SPACE_X_4');
    });

    it('should have grid layout options', () => {
      expect(STYLES).toHaveProperty('GRID_2_MD_4');
      expect(STYLES).toHaveProperty('GRID_1_MD_2');
      expect(STYLES).toHaveProperty('GRID_1_LG_2');
    });
  });

  describe('Tailwind class format validation', () => {
    it('should have valid Tailwind CSS classes', () => {
      Object.values(STYLES).forEach(styleClass => {
        expect(typeof styleClass).toBe('string');
        expect(styleClass.length).toBeGreaterThan(0);
        
        if (styleClass.includes(' ')) {
          styleClass.split(' ').forEach(cls => {
            expect(cls).toMatch(/^[a-z][\w:-]*$/);
          });
        } else {
          expect(styleClass).toMatch(/^[a-z][\w:-]*$/);
        }
      });
    });

    it('should use consistent spacing patterns', () => {
      expect(STYLES.SPACE_Y_4).toBe('space-y-4');
      expect(STYLES.SPACE_Y_8).toBe('space-y-8');
      expect(STYLES.SPACE_X_2).toBe('space-x-2');
      expect(STYLES.SPACE_X_4).toBe('space-x-4');
    });

    it('should have proper grid class format', () => {
      expect(STYLES.GRID_2_MD_4).toContain('grid');
      expect(STYLES.GRID_2_MD_4).toContain('grid-cols');
      expect(STYLES.GRID_2_MD_4).toContain('gap');
    });
  });

  describe('typography styles', () => {
    it('should have heading styles with proper hierarchy', () => {
      expect(STYLES.HEADING_3XL).toContain('text-3xl');
      expect(STYLES.HEADING_XL).toContain('text-xl');
      expect(STYLES.HEADING_LG).toContain('text-lg');
    });

    it('should have consistent text styling', () => {
      expect(STYLES.TEXT_SM_GRAY).toContain('text-sm');
      expect(STYLES.TEXT_SM_GRAY).toContain('text-gray');
      expect(STYLES.TEXT_LG_GRAY).toContain('text-lg');
    });

    it('should have metric display styles', () => {
      expect(STYLES.METRIC_VALUE).toContain('font-bold');
      expect(STYLES.METRIC_LABEL).toContain('text-sm');
    });
  });

  describe('component-specific styles', () => {
    it('should have card styles', () => {
      expect(STYLES.CARD).toContain('bg-white');
      expect(STYLES.CARD).toContain('rounded-lg');
      expect(STYLES.CARD).toContain('shadow');
      expect(STYLES.CARD_HOVER).toContain('hover:shadow');
    });

    it('should have button styles', () => {
      expect(STYLES.BUTTON_SECONDARY).toContain('px-4');
      expect(STYLES.BUTTON_SECONDARY).toContain('py-2');
      expect(STYLES.BUTTON_SECONDARY).toContain('bg-gray');
      expect(STYLES.BUTTON_SECONDARY).toContain('hover:bg');
    });

    it('should have form styles', () => {
      expect(STYLES.INPUT_GROUP).toBe('space-y-2');
      expect(STYLES.FORM_SECTION).toBe('space-y-4');
      expect(STYLES.TIP_BOX).toContain('bg-blue-50');
    });
  });

  describe('layout and positioning', () => {
    it('should have flexbox utilities', () => {
      expect(STYLES.FLEX_CENTER).toContain('flex');
      expect(STYLES.FLEX_CENTER).toContain('items-center');
      expect(STYLES.FLEX_CENTER).toContain('justify-center');
      
      expect(STYLES.FLEX_BETWEEN).toContain('justify-between');
      expect(STYLES.FLEX_ITEMS_CENTER).toContain('items-center');
    });

    it('should have positioning utilities', () => {
      expect(STYLES.ABSOLUTE_INSET).toBe('absolute inset-0');
      expect(STYLES.OVERFLOW_HIDDEN_ROUNDED).toContain('overflow-hidden');
      expect(STYLES.OVERFLOW_HIDDEN_ROUNDED).toContain('rounded');
    });

    it('should have responsive utilities', () => {
      expect(STYLES.HIDDEN_MD_FLEX).toContain('hidden');
      expect(STYLES.HIDDEN_MD_FLEX).toContain('md:flex');
    });
  });

  describe('color and theming', () => {
    it('should have semantic color classes', () => {
      expect(STYLES.COLOR_BLUE).toBe('text-blue-600');
      expect(STYLES.COLOR_GREEN).toBe('text-green-600');
      expect(STYLES.COLOR_RED).toBe('text-red-600');
      expect(STYLES.COLOR_ORANGE).toBe('text-orange-600');
      expect(STYLES.COLOR_PURPLE).toBe('text-purple-600');
    });

    it('should have background color utilities', () => {
      expect(STYLES.BG_GRAY_50).toBe('bg-gray-50');
      expect(STYLES.BG_GRAY_100).toBe('bg-gray-100');
      expect(STYLES.BG_BLUE_50).toBe('bg-blue-50');
    });
  });

  describe('icon and sizing utilities', () => {
    it('should have icon size variants', () => {
      expect(STYLES.ICON_SM).toBe('h-4 w-4');
      expect(STYLES.ICON_MD).toBe('h-5 w-5');
      expect(STYLES.ICON_LG).toBe('h-8 w-8');
    });

    it('should have consistent sizing format', () => {
      const iconSizes = [STYLES.ICON_SM, STYLES.ICON_MD, STYLES.ICON_LG];
      iconSizes.forEach(size => {
        expect(size).toMatch(/^h-\d+ w-\d+$/);
      });
    });
  });

  describe('naming conventions', () => {
    it('should use SCREAMING_SNAKE_CASE for constants', () => {
      Object.keys(STYLES).forEach(key => {
        expect(key).toMatch(/^[A-Z][A-Z0-9_]*$/);
      });
    });

    it('should have descriptive names', () => {
      expect(STYLES).toHaveProperty('CONTAINER');
      expect(STYLES).toHaveProperty('FLEX_CENTER');
      expect(STYLES).toHaveProperty('TEXT_CENTER');
      expect(STYLES).toHaveProperty('BUTTON_SECONDARY');
    });
  });
});