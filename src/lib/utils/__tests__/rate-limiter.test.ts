import {
  RateLimiter,
  debounce,
  mapRateLimiter,
  pathfindingRateLimiter,
  apiRateLimiter
} from '../rate-limiter';

// Mock timers for testing time-dependent functions
jest.useFakeTimers();

describe('RateLimiter class', () => {
  let rateLimiter: RateLimiter;

  beforeEach(() => {
    rateLimiter = new RateLimiter(3, 1000); // 3 requests per 1 second for testing
    jest.clearAllTimers();
  });

  afterEach(() => {
    jest.clearAllTimers();
  });

  describe('constructor', () => {
    it('should create with default parameters', () => {
      const defaultLimiter = new RateLimiter();
      expect(defaultLimiter.isAllowed('test')).toBe(true);
    });

    it('should create with custom parameters', () => {
      const customLimiter = new RateLimiter(5, 2000);
      expect(customLimiter.isAllowed('test')).toBe(true);
    });
  });

  describe('isAllowed', () => {
    it('should allow requests under the limit', () => {
      expect(rateLimiter.isAllowed('test')).toBe(true);
      expect(rateLimiter.isAllowed('test')).toBe(true);
      expect(rateLimiter.isAllowed('test')).toBe(true);
    });

    it('should reject requests over the limit', () => {
      expect(rateLimiter.isAllowed('test')).toBe(true);
      expect(rateLimiter.isAllowed('test')).toBe(true);
      expect(rateLimiter.isAllowed('test')).toBe(true);
      expect(rateLimiter.isAllowed('test')).toBe(false);
    });

    it('should handle different keys independently', () => {
      expect(rateLimiter.isAllowed('key1')).toBe(true);
      expect(rateLimiter.isAllowed('key1')).toBe(true);
      expect(rateLimiter.isAllowed('key1')).toBe(true);
      expect(rateLimiter.isAllowed('key1')).toBe(false);

      expect(rateLimiter.isAllowed('key2')).toBe(true);
      expect(rateLimiter.isAllowed('key2')).toBe(true);
      expect(rateLimiter.isAllowed('key2')).toBe(true);
      expect(rateLimiter.isAllowed('key2')).toBe(false);
    });

    it('should reset after time window expires', () => {
      // Use up all requests
      expect(rateLimiter.isAllowed('test')).toBe(true);
      expect(rateLimiter.isAllowed('test')).toBe(true);
      expect(rateLimiter.isAllowed('test')).toBe(true);
      expect(rateLimiter.isAllowed('test')).toBe(false);

      // Advance time past the window
      jest.advanceTimersByTime(1001);

      // Should be allowed again
      expect(rateLimiter.isAllowed('test')).toBe(true);
    });

    it('should handle partial window expiry', () => {
      // Make 2 requests
      expect(rateLimiter.isAllowed('test')).toBe(true);
      expect(rateLimiter.isAllowed('test')).toBe(true);

      // Advance time partially
      jest.advanceTimersByTime(500);

      // Make another request
      expect(rateLimiter.isAllowed('test')).toBe(true);
      expect(rateLimiter.isAllowed('test')).toBe(false);

      // Advance time to expire first two requests
      jest.advanceTimersByTime(501);

      // Should allow 2 more requests
      expect(rateLimiter.isAllowed('test')).toBe(true);
      expect(rateLimiter.isAllowed('test')).toBe(true);
      expect(rateLimiter.isAllowed('test')).toBe(false);
    });

    it('should handle empty key', () => {
      expect(rateLimiter.isAllowed('')).toBe(true);
      expect(rateLimiter.isAllowed('')).toBe(true);
      expect(rateLimiter.isAllowed('')).toBe(true);
      expect(rateLimiter.isAllowed('')).toBe(false);
    });

    it('should handle special characters in keys', () => {
      const specialKey = 'test-key_123.com/api?param=value';
      expect(rateLimiter.isAllowed(specialKey)).toBe(true);
      expect(rateLimiter.isAllowed(specialKey)).toBe(true);
      expect(rateLimiter.isAllowed(specialKey)).toBe(true);
      expect(rateLimiter.isAllowed(specialKey)).toBe(false);
    });
  });

  describe('getRemainingRequests', () => {
    it('should return max requests for new key', () => {
      expect(rateLimiter.getRemainingRequests('test')).toBe(3);
    });

    it('should decrease as requests are made', () => {
      expect(rateLimiter.getRemainingRequests('test')).toBe(3);
      rateLimiter.isAllowed('test');
      expect(rateLimiter.getRemainingRequests('test')).toBe(2);
      rateLimiter.isAllowed('test');
      expect(rateLimiter.getRemainingRequests('test')).toBe(1);
      rateLimiter.isAllowed('test');
      expect(rateLimiter.getRemainingRequests('test')).toBe(0);
    });

    it('should not go below zero', () => {
      rateLimiter.isAllowed('test');
      rateLimiter.isAllowed('test');
      rateLimiter.isAllowed('test');
      rateLimiter.isAllowed('test'); // This should be rejected
      expect(rateLimiter.getRemainingRequests('test')).toBe(0);
    });

    it('should reset after time window expires', () => {
      rateLimiter.isAllowed('test');
      rateLimiter.isAllowed('test');
      expect(rateLimiter.getRemainingRequests('test')).toBe(1);

      jest.advanceTimersByTime(1001);
      expect(rateLimiter.getRemainingRequests('test')).toBe(3);
    });

    it('should handle different keys independently', () => {
      rateLimiter.isAllowed('key1');
      rateLimiter.isAllowed('key2');
      rateLimiter.isAllowed('key2');

      expect(rateLimiter.getRemainingRequests('key1')).toBe(2);
      expect(rateLimiter.getRemainingRequests('key2')).toBe(1);
    });
  });

  describe('getTimeUntilReset', () => {
    it('should return 0 when requests are available', () => {
      expect(rateLimiter.getTimeUntilReset('test')).toBe(0);
      rateLimiter.isAllowed('test');
      expect(rateLimiter.getTimeUntilReset('test')).toBe(0);
    });

    it('should return time until oldest request expires when at limit', () => {
      rateLimiter.isAllowed('test');
      rateLimiter.isAllowed('test');
      rateLimiter.isAllowed('test');

      const timeUntilReset = rateLimiter.getTimeUntilReset('test');
      expect(timeUntilReset).toBeGreaterThan(0);
      expect(timeUntilReset).toBeLessThanOrEqual(1000);
    });

    it('should decrease as time passes', () => {
      rateLimiter.isAllowed('test');
      rateLimiter.isAllowed('test');
      rateLimiter.isAllowed('test');

      const initialTime = rateLimiter.getTimeUntilReset('test');
      
      jest.advanceTimersByTime(100);
      
      const laterTime = rateLimiter.getTimeUntilReset('test');
      expect(laterTime).toBeLessThan(initialTime);
    });

    it('should return 0 after reset', () => {
      rateLimiter.isAllowed('test');
      rateLimiter.isAllowed('test');
      rateLimiter.isAllowed('test');

      jest.advanceTimersByTime(1001);
      
      expect(rateLimiter.getTimeUntilReset('test')).toBe(0);
    });

    it('should handle partial window expiry correctly', () => {
      rateLimiter.isAllowed('test');
      jest.advanceTimersByTime(200);
      rateLimiter.isAllowed('test');
      jest.advanceTimersByTime(200);
      rateLimiter.isAllowed('test');

      const timeUntilReset = rateLimiter.getTimeUntilReset('test');
      expect(timeUntilReset).toBeCloseTo(600, -1); // Should be ~600ms until first request expires
    });
  });

  describe('clear', () => {
    it('should clear rate limiting data for a specific key', () => {
      rateLimiter.isAllowed('test');
      rateLimiter.isAllowed('test');
      rateLimiter.isAllowed('test');
      expect(rateLimiter.isAllowed('test')).toBe(false);

      rateLimiter.clear('test');
      expect(rateLimiter.isAllowed('test')).toBe(true);
    });

    it('should not affect other keys', () => {
      rateLimiter.isAllowed('key1');
      rateLimiter.isAllowed('key1');
      rateLimiter.isAllowed('key2');
      rateLimiter.isAllowed('key2');

      rateLimiter.clear('key1');

      expect(rateLimiter.getRemainingRequests('key1')).toBe(3);
      expect(rateLimiter.getRemainingRequests('key2')).toBe(1);
    });

    it('should handle clearing non-existent key', () => {
      expect(() => rateLimiter.clear('nonexistent')).not.toThrow();
    });
  });

  describe('clearAll', () => {
    it('should clear all rate limiting data', () => {
      rateLimiter.isAllowed('key1');
      rateLimiter.isAllowed('key1');
      rateLimiter.isAllowed('key2');
      rateLimiter.isAllowed('key2');
      rateLimiter.isAllowed('key2');

      expect(rateLimiter.getRemainingRequests('key1')).toBe(1);
      expect(rateLimiter.getRemainingRequests('key2')).toBe(0);

      rateLimiter.clearAll();

      expect(rateLimiter.getRemainingRequests('key1')).toBe(3);
      expect(rateLimiter.getRemainingRequests('key2')).toBe(3);
    });

    it('should handle clearing when no data exists', () => {
      expect(() => rateLimiter.clearAll()).not.toThrow();
    });
  });
});

describe('debounce function', () => {
  let mockFn: jest.Mock;

  beforeEach(() => {
    mockFn = jest.fn();
    jest.clearAllTimers();
  });

  afterEach(() => {
    jest.clearAllTimers();
  });

  it('should delay function execution', () => {
    const debouncedFn = debounce(mockFn, 100);
    
    debouncedFn();
    expect(mockFn).not.toHaveBeenCalled();
    
    jest.advanceTimersByTime(100);
    expect(mockFn).toHaveBeenCalledTimes(1);
  });

  it('should reset delay on subsequent calls', () => {
    const debouncedFn = debounce(mockFn, 100);
    
    debouncedFn();
    jest.advanceTimersByTime(50);
    debouncedFn();
    jest.advanceTimersByTime(50);
    expect(mockFn).not.toHaveBeenCalled();
    
    jest.advanceTimersByTime(50);
    expect(mockFn).toHaveBeenCalledTimes(1);
  });

  it('should pass arguments correctly', () => {
    const debouncedFn = debounce(mockFn, 100);
    
    debouncedFn('arg1', 'arg2', 123);
    jest.advanceTimersByTime(100);
    
    expect(mockFn).toHaveBeenCalledWith('arg1', 'arg2', 123);
  });

  it('should handle multiple rapid calls', () => {
    const debouncedFn = debounce(mockFn, 100);
    
    debouncedFn();
    debouncedFn();
    debouncedFn();
    debouncedFn();
    
    jest.advanceTimersByTime(100);
    expect(mockFn).toHaveBeenCalledTimes(1);
  });

  it('should use the latest arguments', () => {
    const debouncedFn = debounce(mockFn, 100);
    
    debouncedFn('first');
    debouncedFn('second');
    debouncedFn('third');
    
    jest.advanceTimersByTime(100);
    expect(mockFn).toHaveBeenCalledWith('third');
  });

  it('should handle zero delay', () => {
    const debouncedFn = debounce(mockFn, 0);
    
    debouncedFn();
    expect(mockFn).not.toHaveBeenCalled();
    
    jest.advanceTimersByTime(0);
    expect(mockFn).toHaveBeenCalledTimes(1);
  });

  it('should handle functions that throw errors', () => {
    const errorFn = jest.fn(() => {
      throw new Error('Test error');
    });
    const debouncedFn = debounce(errorFn, 100);
    
    debouncedFn();
    
    expect(() => {
      jest.advanceTimersByTime(100);
    }).toThrow('Test error');
  });

  it('should handle functions with return values', () => {
    const returnFn = jest.fn(() => 'result');
    const debouncedFn = debounce(returnFn, 100);
    
    debouncedFn();
    jest.advanceTimersByTime(100);
    
    expect(returnFn).toHaveBeenCalled();
  });
});


describe('global rate limiters', () => {
  it('should have mapRateLimiter with correct configuration', () => {
    expect(mapRateLimiter).toBeInstanceOf(RateLimiter);
    // Test that it follows expected limits (5 requests per 30 seconds)
    for (let i = 0; i < 5; i++) {
      expect(mapRateLimiter.isAllowed('test')).toBe(true);
    }
    expect(mapRateLimiter.isAllowed('test')).toBe(false);
  });

  it('should have pathfindingRateLimiter with correct configuration', () => {
    expect(pathfindingRateLimiter).toBeInstanceOf(RateLimiter);
    // Test that it follows expected limits (10 requests per minute)
    for (let i = 0; i < 10; i++) {
      expect(pathfindingRateLimiter.isAllowed('test')).toBe(true);
    }
    expect(pathfindingRateLimiter.isAllowed('test')).toBe(false);
  });

  it('should have apiRateLimiter with correct configuration', () => {
    expect(apiRateLimiter).toBeInstanceOf(RateLimiter);
    // Test that it follows expected limits (20 requests per minute)
    for (let i = 0; i < 20; i++) {
      expect(apiRateLimiter.isAllowed('test')).toBe(true);
    }
    expect(apiRateLimiter.isAllowed('test')).toBe(false);
  });

  it('should have independent rate limiters', () => {
    // Clear any previous test state
    mapRateLimiter.clear('independence-test');
    pathfindingRateLimiter.clear('independence-test');
    apiRateLimiter.clear('independence-test');
    
    // Use up mapRateLimiter
    for (let i = 0; i < 5; i++) {
      mapRateLimiter.isAllowed('independence-test');
    }
    expect(mapRateLimiter.isAllowed('independence-test')).toBe(false);

    // Other limiters should still work
    expect(pathfindingRateLimiter.isAllowed('independence-test')).toBe(true);
    expect(apiRateLimiter.isAllowed('independence-test')).toBe(true);
  });

  afterAll(() => {
    // Clean up global rate limiters
    mapRateLimiter.clearAll();
    pathfindingRateLimiter.clearAll();
    apiRateLimiter.clearAll();
  });
});