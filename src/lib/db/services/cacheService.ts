/**
 * Simple in-memory cache service
 * In production, consider using Redis or similar
 */
export class CacheService {
  private cache: Map<string, { value: any; expiresAt: number }> = new Map();
  private readonly defaultTtl = 300; // 5 minutes default

  /**
   * Set a value in cache with TTL
   */
  set<T>(key: string, value: T, ttlSeconds: number = this.defaultTtl): void {
    const expiresAt = Date.now() + (ttlSeconds * 1000);
    this.cache.set(key, { value, expiresAt });
    
    // Periodic cleanup (every 100 operations)
    if (this.cache.size % 100 === 0) {
      this.cleanup();
    }
  }

  /**
   * Get a value from cache if it exists and hasn't expired
   */
  get<T>(key: string): T | null {
    const item = this.cache.get(key);
    
    if (!item) {
      return null;
    }
    
    if (Date.now() > item.expiresAt) {
      // Expired, remove it
      this.cache.delete(key);
      return null;
    }
    
    return item.value as T;
  }

  /**
   * Delete a key from cache
   */
  delete(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Clean up expired entries
   */
  cleanup(): void {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now > item.expiresAt) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Invalidate cache entries matching a pattern
   */
  invalidate(pattern: string): void {
    for (const [key] of this.cache.entries()) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Get cache statistics
   */
  stats(): { size: number; expired: number } {
    const now = Date.now();
    let expired = 0;
    
    for (const [, item] of this.cache.entries()) {
      if (now > item.expiresAt) {
        expired++;
      }
    }
    
    return {
      size: this.cache.size,
      expired
    };
  }
}

// Export a singleton instance
export const cacheService = new CacheService();
