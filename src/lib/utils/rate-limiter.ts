/**
 * Rate limiting utilities for client-side operations
 * Prevents excessive API calls and protects against spam
 */

export class RateLimiter {
  private requests: Map<string, number[]> = new Map();
  private readonly maxRequests: number;
  private readonly windowMs: number;

  constructor(maxRequests: number = 10, windowMs: number = 60000) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }

  /**
   * Check if a request is allowed for the given key
   * @param key - Unique identifier for the request type
   * @returns true if request is allowed, false if rate limited
   */
  isAllowed(key: string): boolean {
    const now = Date.now();
    const requests = this.requests.get(key) || [];
    
    // Remove expired requests
    const validRequests = requests.filter(timestamp => now - timestamp < this.windowMs);
    
    if (validRequests.length >= this.maxRequests) {
      return false;
    }
    
    // Add current request
    validRequests.push(now);
    this.requests.set(key, validRequests);
    
    return true;
  }

  /**
   * Get remaining requests for a key
   * @param key - Unique identifier for the request type
   * @returns number of remaining requests
   */
  getRemainingRequests(key: string): number {
    const now = Date.now();
    const requests = this.requests.get(key) || [];
    const validRequests = requests.filter(timestamp => now - timestamp < this.windowMs);
    
    return Math.max(0, this.maxRequests - validRequests.length);
  }

  /**
   * Get time until next request is allowed
   * @param key - Unique identifier for the request type
   * @returns milliseconds until next request allowed, or 0 if allowed now
   */
  getTimeUntilReset(key: string): number {
    const now = Date.now();
    const requests = this.requests.get(key) || [];
    const validRequests = requests.filter(timestamp => now - timestamp < this.windowMs);
    
    if (validRequests.length < this.maxRequests) {
      return 0;
    }
    
    const oldestRequest = Math.min(...validRequests);
    return Math.max(0, this.windowMs - (now - oldestRequest));
  }

  /**
   * Clear all rate limiting data for a key
   * @param key - Unique identifier to clear
   */
  clear(key: string): void {
    this.requests.delete(key);
  }

  /**
   * Clear all rate limiting data
   */
  clearAll(): void {
    this.requests.clear();
  }
}

/**
 * Debounce function to limit rapid successive calls
 * @param func - Function to debounce
 * @param delay - Delay in milliseconds
 * @returns Debounced function
 */
export function debounce<T extends (...args: never[]) => void>(
  func: T,
  delay: number
): T {
  let timeoutId: NodeJS.Timeout;
  
  return ((...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  }) as T;
}

/**
 * Throttle function to limit execution rate
 * @param func - Function to throttle
 * @param limit - Minimum time between executions in milliseconds
 * @returns Throttled function
 */
export function throttle<T extends (...args: unknown[]) => unknown>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

// Global rate limiters for different operations
export const mapRateLimiter = new RateLimiter(5, 30000); // 5 map loads per 30 seconds
export const pathfindingRateLimiter = new RateLimiter(10, 60000); // 10 pathfinding requests per minute
export const apiRateLimiter = new RateLimiter(20, 60000); // 20 API calls per minute