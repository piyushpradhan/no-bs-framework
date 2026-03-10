/**
 * Optimistic Update Manager
 *
 * Manages optimistic updates with automatic rollback:
 * - Snapshot state before mutation
 * - Track pending optimistic updates
 * - Rollback on error
 * - LIFO stack for multiple simultaneous mutations
 */

class OptimisticUpdateManager<T = any> {
  private snapshots = new Map<string, T>()
  private pending = new Set<string>()

  /**
   * Create a snapshot of the current state before applying optimistic update
   */
  snapshot(key: string, state: T): void {
    // Only snapshot if not already pending
    // This preserves the original state for LIFO rollback
    if (!this.snapshots.has(key)) {
      this.snapshots.set(key, state)
      this.pending.add(key)
    }
  }

  /**
   * Rollback to the snapshot for a given key
   * Returns the snapshot state and removes it from tracking
   */
  rollback(key: string): T | undefined {
    const snapshot = this.snapshots.get(key)

    if (snapshot) {
      this.snapshots.delete(key)
      this.pending.delete(key)
      return snapshot
    }

    return undefined
  }

  /**
   * Commit the optimistic update (success case)
   * Removes the snapshot as it's no longer needed
   */
  commit(key: string): void {
    this.snapshots.delete(key)
    this.pending.delete(key)
  }

  /**
   * Check if an optimistic update is pending
   */
  isPending(key: string): boolean {
    return this.pending.has(key)
  }

  /**
   * Get all pending update keys
   */
  getPendingKeys(): string[] {
    return Array.from(this.pending)
  }

  /**
   * Clear all snapshots (use with caution)
   */
  clear(): void {
    this.snapshots.clear()
    this.pending.clear()
  }

  /**
   * Get count of pending updates
   */
  pendingCount(): number {
    return this.pending.size
  }

  /**
   * Check if there are any pending updates
   */
  hasPending(): boolean {
    return this.pending.size > 0
  }
}

// ============================================================================
// Global Instance
// ============================================================================

export const optimisticManager = new OptimisticUpdateManager()

export { OptimisticUpdateManager }
