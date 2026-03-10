/**
 * Request Cache
 *
 * In-memory cache with:
 * - TTL (staleTime & cacheTime)
 * - Request deduplication for simultaneous identical requests
 * - Manual invalidation (exact match & pattern matching)
 * - Stale-while-revalidate pattern
 */

import { CacheEntry, CacheOptions } from "./types"

class RequestCache {
  private cache = new Map<string, CacheEntry<any>>()
  private cleanupTimeouts = new Map<string, NodeJS.Timeout>()

  /**
   * Get cached data for a key
   */
  get<T>(key: string): T | undefined {
    const entry = this.cache.get(key)

    if (!entry) {
      return undefined
    }

    // Check if cache has expired
    if (this.isExpired(key)) {
      this.delete(key)
      return undefined
    }

    return entry.data
  }

  /**
   * Set cached data with TTL
   */
  set<T>(key: string, data: T, options: CacheOptions): void {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      staleTime: options.staleTime,
      cacheTime: options.cacheTime,
    }

    this.cache.set(key, entry)

    // Schedule cleanup when cacheTime expires
    this.scheduleCleanup(key, options.cacheTime)
  }

  /**
   * Check if cached data is stale (but not expired)
   */
  isStale(key: string): boolean {
    const entry = this.cache.get(key)

    if (!entry) {
      return true
    }

    const age = Date.now() - entry.timestamp
    return age > entry.staleTime
  }

  /**
   * Check if cached data has expired (should be removed)
   */
  private isExpired(key: string): boolean {
    const entry = this.cache.get(key)

    if (!entry) {
      return true
    }

    const age = Date.now() - entry.timestamp
    return age > entry.cacheTime
  }

  /**
   * Delete a cache entry
   */
  private delete(key: string): void {
    this.cache.delete(key)

    const timeout = this.cleanupTimeouts.get(key)
    if (timeout) {
      clearTimeout(timeout)
      this.cleanupTimeouts.delete(key)
    }
  }

  /**
   * Invalidate cache entries
   * - No argument: clear all
   * - String: exact match
   * - RegExp: pattern matching
   */
  invalidate(keyOrPattern?: string | RegExp): void {
    // Clear all
    if (keyOrPattern === undefined) {
      this.cache.clear()
      this.cleanupTimeouts.forEach((timeout) => clearTimeout(timeout))
      this.cleanupTimeouts.clear()
      return
    }

    // Exact match
    if (typeof keyOrPattern === "string") {
      this.delete(keyOrPattern)
      return
    }

    // Pattern matching
    const keysToDelete: string[] = []

    for (const key of this.cache.keys()) {
      if (keyOrPattern.test(key)) {
        keysToDelete.push(key)
      }
    }

    keysToDelete.forEach((key) => this.delete(key))
  }

  /**
   * Schedule cleanup when cache expires
   */
  private scheduleCleanup(key: string, cacheTime: number): void {
    // Clear existing timeout
    const existingTimeout = this.cleanupTimeouts.get(key)
    if (existingTimeout) {
      clearTimeout(existingTimeout)
    }

    // Schedule new cleanup
    const timeout = setTimeout(() => {
      this.delete(key)
    }, cacheTime)

    this.cleanupTimeouts.set(key, timeout)
  }

  // ==========================================================================
  // Request Deduplication
  // ==========================================================================

  /**
   * Get in-flight request promise for deduplication
   */
  getInFlightRequest<T>(key: string): Promise<T> | undefined {
    const entry = this.cache.get(key)
    return entry?.promise
  }

  /**
   * Set in-flight request promise
   */
  setInFlightRequest<T>(key: string, promise: Promise<T>): void {
    const entry = this.cache.get(key)

    if (entry) {
      entry.promise = promise
    } else {
      // Create temporary entry for promise
      this.cache.set(key, {
        data: undefined,
        timestamp: Date.now(),
        staleTime: 0,
        cacheTime: 60000, // 1 minute default for promise-only entries
        promise,
      })
    }

    // Clear promise when resolved/rejected
    promise
      .then(() => this.clearInFlightRequest(key))
      .catch(() => this.clearInFlightRequest(key))
  }

  /**
   * Clear in-flight request promise
   */
  clearInFlightRequest(key: string): void {
    const entry = this.cache.get(key)
    if (entry) {
      delete entry.promise
    }
  }

  // ==========================================================================
  // Utilities
  // ==========================================================================

  /**
   * Get all cache keys
   */
  keys(): string[] {
    return Array.from(this.cache.keys())
  }

  /**
   * Get cache size
   */
  size(): number {
    return this.cache.size
  }

  /**
   * Check if key exists in cache
   */
  has(key: string): boolean {
    return this.cache.has(key) && !this.isExpired(key)
  }
}

// ============================================================================
// Global Instance
// ============================================================================

export const cache = new RequestCache()

export { RequestCache }
