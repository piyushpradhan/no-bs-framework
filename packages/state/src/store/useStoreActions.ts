/**
 * useStoreActions Hook
 *
 * Provides programmatic/imperative store access for API hooks.
 * Unlike useStore (which returns a proxy for component consumption),
 * this hook provides direct methods to read and update the store.
 *
 * Used by API hooks (useFetch, useMutation, etc.) to update store
 * imperatively without going through the proxy system.
 */

import { useContext } from "react"
import { Store } from "."
import { formatState } from ".."
import { StoreContext, setNestedValue } from "./useStore"

export function useStoreActions<T = any>() {
  const store = useContext(StoreContext) as Store<T>

  if (!store) {
    throw new Error("useStoreActions must be used within a StoreProvider")
  }

  return {
    /**
     * Set a value at a specific path in the store
     *
     * @example
     * set(["posts", "1", "likes"], 42)
     * set(["root", "count"], 10)
     * set([], { ...newState }) // Replace entire state
     */
    set: (path: string[], value: any) => {
      store.setState((state) => setNestedValue(state as Record<string, any>, path, value))
    },

    /**
     * Merge a partial value at a specific path
     *
     * @example
     * merge(["posts", "1"], { likes: 42, views: 100 })
     */
    merge: (path: string[], value: Partial<any>) => {
      store.setState((state) => {
        // Get current value at path
        let current: any = state
        for (const key of path) {
          current = current?.[key]
        }

        // Merge with new value
        const merged = { ...current, ...value }

        // Set back
        return setNestedValue(state as Record<string, any>, path, merged)
      })
    },

    /**
     * Update the store using an updater function
     *
     * @example
     * update((state) => ({ ...state, root: { ...state.root, count: state.root.count + 1 } }))
     */
    update: (updater: (state: T) => T) => {
      store.setState(updater)
    },

    /**
     * Get the current store state
     *
     * @example
     * const state = get()
     * const postLikes = get().posts["1"].likes
     */
    get: (): T => {
      return store.getState()
    },

    /**
     * Format and normalize data before setting it in the store
     * Uses the existing formatState logic for normalization
     *
     * @example
     * format([{ id: 1, title: "Post 1" }]) // Returns normalized structure
     */
    format: (data: any) => {
      return formatState(data)
    },
  }
}
