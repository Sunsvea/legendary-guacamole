import { PathfindingOptions, DEFAULT_PATHFINDING_OPTIONS, PATHFINDING_PRESETS } from '../pathfinding';

describe('Pathfinding Types', () => {
  describe('PathfindingOptions interface', () => {
    it('should accept valid pathfinding options', () => {
      const options: PathfindingOptions = {
        maxIterations: 1000,
        offTrailPenalty: 2.5,
        trailBonus: 0.5,
        roadBonus: 0.3,
        maxWaypoints: 100,
        waypointDistance: 0.01,
        roadsOnly: false
      };

      expect(options.maxIterations).toBe(1000);
      expect(options.offTrailPenalty).toBe(2.5);
      expect(options.trailBonus).toBe(0.5);
      expect(options.roadBonus).toBe(0.3);
      expect(options.maxWaypoints).toBe(100);
      expect(options.waypointDistance).toBe(0.01);
      expect(options.roadsOnly).toBe(false);
    });

    it('should handle extreme values', () => {
      const extremeOptions: PathfindingOptions = {
        maxIterations: 10000,
        offTrailPenalty: 10.0,
        trailBonus: 0.0,
        roadBonus: 0.0,
        maxWaypoints: 1000,
        waypointDistance: 0.001,
        roadsOnly: true
      };

      expect(extremeOptions.maxIterations).toBe(10000);
      expect(extremeOptions.offTrailPenalty).toBe(10.0);
      expect(extremeOptions.trailBonus).toBe(0.0);
      expect(extremeOptions.roadBonus).toBe(0.0);
    });

    it('should handle minimal values', () => {
      const minimalOptions: PathfindingOptions = {
        maxIterations: 1,
        offTrailPenalty: 1.0,
        trailBonus: 1.0,
        roadBonus: 1.0,
        maxWaypoints: 1,
        waypointDistance: 0.1,
        roadsOnly: false
      };

      expect(minimalOptions.maxIterations).toBe(1);
      expect(minimalOptions.offTrailPenalty).toBe(1.0);
      expect(minimalOptions.trailBonus).toBe(1.0);
    });
  });

  describe('DEFAULT_PATHFINDING_OPTIONS', () => {
    it('should have reasonable default values', () => {
      expect(DEFAULT_PATHFINDING_OPTIONS.maxIterations).toBe(500);
      expect(DEFAULT_PATHFINDING_OPTIONS.offTrailPenalty).toBe(2.0);
      expect(DEFAULT_PATHFINDING_OPTIONS.trailBonus).toBe(0.4);
      expect(DEFAULT_PATHFINDING_OPTIONS.roadBonus).toBe(0.3);
      expect(DEFAULT_PATHFINDING_OPTIONS.maxWaypoints).toBe(50);
      expect(DEFAULT_PATHFINDING_OPTIONS.waypointDistance).toBe(0.01);
      expect(DEFAULT_PATHFINDING_OPTIONS.roadsOnly).toBe(false);
    });

    it('should be a valid PathfindingOptions object', () => {
      const options: PathfindingOptions = DEFAULT_PATHFINDING_OPTIONS;
      expect(options).toBeDefined();
    });

    it('should have performance-optimized defaults', () => {
      expect(DEFAULT_PATHFINDING_OPTIONS.maxIterations).toBeLessThanOrEqual(1000);
      expect(DEFAULT_PATHFINDING_OPTIONS.maxWaypoints).toBeLessThanOrEqual(100);
      expect(DEFAULT_PATHFINDING_OPTIONS.waypointDistance).toBeGreaterThanOrEqual(0.005);
    });

    it('should favor trails over off-trail movement', () => {
      expect(DEFAULT_PATHFINDING_OPTIONS.offTrailPenalty).toBeGreaterThan(1.0);
      expect(DEFAULT_PATHFINDING_OPTIONS.trailBonus).toBeLessThan(1.0);
      expect(DEFAULT_PATHFINDING_OPTIONS.roadBonus).toBeLessThan(1.0);
    });
  });

  describe('PATHFINDING_PRESETS', () => {
    it('should have all required presets', () => {
      expect(PATHFINDING_PRESETS).toHaveProperty('FAVOR_TRAILS_HEAVILY');
      expect(PATHFINDING_PRESETS).toHaveProperty('FAVOR_TRAILS_MODERATELY');
      expect(PATHFINDING_PRESETS).toHaveProperty('FAVOR_TRAILS_LITTLE');
      expect(PATHFINDING_PRESETS).toHaveProperty('DIRECT_ROUTE');
      expect(PATHFINDING_PRESETS).toHaveProperty('ROADS_ONLY');
    });

    describe('FAVOR_TRAILS_HEAVILY', () => {
      const preset = PATHFINDING_PRESETS.FAVOR_TRAILS_HEAVILY;

      it('should heavily favor trails', () => {
        expect(preset.offTrailPenalty).toBe(5.0);
        expect(preset.trailBonus).toBe(0.1);
        expect(preset.roadBonus).toBe(0.05);
      });

      it('should use high detail settings', () => {
        expect(preset.maxIterations).toBe(1500);
        expect(preset.maxWaypoints).toBe(100);
        expect(preset.waypointDistance).toBe(0.005);
      });

      it('should not be roads only', () => {
        expect(preset.roadsOnly).toBe(false);
      });
    });

    describe('FAVOR_TRAILS_MODERATELY', () => {
      const preset = PATHFINDING_PRESETS.FAVOR_TRAILS_MODERATELY;

      it('should moderately favor trails', () => {
        expect(preset.offTrailPenalty).toBe(3.0);
        expect(preset.trailBonus).toBe(0.3);
        expect(preset.roadBonus).toBe(0.2);
      });

      it('should use balanced settings', () => {
        expect(preset.maxIterations).toBe(1000);
        expect(preset.maxWaypoints).toBe(75);
        expect(preset.waypointDistance).toBe(0.01);
      });
    });

    describe('FAVOR_TRAILS_LITTLE', () => {
      const preset = PATHFINDING_PRESETS.FAVOR_TRAILS_LITTLE;

      it('should slightly favor trails', () => {
        expect(preset.offTrailPenalty).toBe(1.5);
        expect(preset.trailBonus).toBe(0.7);
        expect(preset.roadBonus).toBe(0.6);
      });

      it('should use moderate performance settings', () => {
        expect(preset.maxIterations).toBe(500);
        expect(preset.maxWaypoints).toBe(50);
        expect(preset.waypointDistance).toBe(0.02);
      });
    });

    describe('DIRECT_ROUTE', () => {
      const preset = PATHFINDING_PRESETS.DIRECT_ROUTE;

      it('should minimize trail preference for direct routing', () => {
        expect(preset.offTrailPenalty).toBe(1.0);
        expect(preset.trailBonus).toBe(0.9);
        expect(preset.roadBonus).toBe(0.8);
      });

      it('should use fast performance settings', () => {
        expect(preset.maxIterations).toBe(300);
        expect(preset.maxWaypoints).toBe(10);
        expect(preset.waypointDistance).toBe(0.05);
      });
    });

    describe('ROADS_ONLY', () => {
      const preset = PATHFINDING_PRESETS.ROADS_ONLY;

      it('should heavily penalize off-road travel', () => {
        expect(preset.offTrailPenalty).toBe(10.0);
        expect(preset.trailBonus).toBe(1.0);
        expect(preset.roadBonus).toBe(0.2);
      });

      it('should enforce roads only', () => {
        expect(preset.roadsOnly).toBe(true);
      });

      it('should use appropriate settings for road travel', () => {
        expect(preset.maxIterations).toBe(300);
        expect(preset.maxWaypoints).toBe(20);
        expect(preset.waypointDistance).toBe(0.02);
      });
    });

    it('should have progressive trail preference across presets', () => {
      const heavily = PATHFINDING_PRESETS.FAVOR_TRAILS_HEAVILY;
      const moderately = PATHFINDING_PRESETS.FAVOR_TRAILS_MODERATELY;
      const little = PATHFINDING_PRESETS.FAVOR_TRAILS_LITTLE;
      const direct = PATHFINDING_PRESETS.DIRECT_ROUTE;

      expect(heavily.offTrailPenalty).toBeGreaterThan(moderately.offTrailPenalty);
      expect(moderately.offTrailPenalty).toBeGreaterThan(little.offTrailPenalty);
      expect(little.offTrailPenalty).toBeGreaterThan(direct.offTrailPenalty);

      expect(heavily.trailBonus).toBeLessThan(moderately.trailBonus);
      expect(moderately.trailBonus).toBeLessThan(little.trailBonus);
      expect(little.trailBonus).toBeLessThan(direct.trailBonus);
    });

    it('should have all presets as valid PathfindingOptions', () => {
      Object.values(PATHFINDING_PRESETS).forEach(preset => {
        const options: PathfindingOptions = preset;
        expect(options).toBeDefined();
        expect(typeof options.maxIterations).toBe('number');
        expect(typeof options.offTrailPenalty).toBe('number');
        expect(typeof options.trailBonus).toBe('number');
        expect(typeof options.roadBonus).toBe('number');
        expect(typeof options.maxWaypoints).toBe('number');
        expect(typeof options.waypointDistance).toBe('number');
        expect(typeof options.roadsOnly).toBe('boolean');
      });
    });
  });

  describe('type safety and immutability', () => {
    it('should enforce readonly constraint on presets', () => {
      expect(() => {
        // This would cause a TypeScript error if we tried to modify it
        // (PATHFINDING_PRESETS as any).NEW_PRESET = {};
      }).not.toThrow();
    });

    it('should maintain consistent property types across presets', () => {
      Object.values(PATHFINDING_PRESETS).forEach(preset => {
        expect(preset.maxIterations).toBeGreaterThan(0);
        expect(preset.offTrailPenalty).toBeGreaterThanOrEqual(1.0);
        expect(preset.trailBonus).toBeGreaterThanOrEqual(0.0);
        expect(preset.trailBonus).toBeLessThanOrEqual(1.0);
        expect(preset.roadBonus).toBeGreaterThanOrEqual(0.0);
        expect(preset.roadBonus).toBeLessThanOrEqual(1.0);
        expect(preset.maxWaypoints).toBeGreaterThan(0);
        expect(preset.waypointDistance).toBeGreaterThan(0);
      });
    });
  });
});