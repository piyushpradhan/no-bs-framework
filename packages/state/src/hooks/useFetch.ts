/**
 * useFetch Hook
 *
 * Basic data fetching with:
 * - Automatic store updates via normalization
 * - Optimistic UX (optional)
 * - Loading and error states
 * - Automatic cleanup on unmount
 * - Request cancellation via AbortController
 */

import { useEffect, useRef, useState } from "react"
import { apiClient } from "../api/client"
import { optimisticManager } from "../api/optimistic"
import { UseFetchOptions, UseFetchResult } from "../api/types"
import { useStoreActions } from "../store/useStoreActions"

export function useFetch<TData = any>(
  url: string | null,
  options: UseFetchOptions<TData> = {}
): UseFetchResult<TData> {
  const {
    initialData,
    optimistic = true,
    optimisticData,
    onSuccess,
    onError,
    enabled = true,
    baseURL,
  } = options

  const [state, setState] = useState<{
    loading: boolean
    error: any
  }>({
    loading: enabled && url !== null,
    error: null,
  })

  const { set, get, format } = useStoreActions<any>()
  const abortControllerRef = useRef<AbortController>()
  const cacheKey = url ? `GET ${url}` : ""

  const fetchData = async () => {
    if (!url) return

    setState({ loading: true, error: null })

    // Create new AbortController for this request
    abortControllerRef.current = new AbortController()

    // Apply optimistic data if provided
    if (optimistic && optimisticData) {
      const currentState = get()
      const optimisticValue =
        typeof optimisticData === "function"
          ? (optimisticData as (current: any) => TData)(currentState)
          : optimisticData

      // Snapshot for rollback
      optimisticManager.snapshot(cacheKey, currentState)

      // Apply optimistic update to store
      const formattedOptimistic = format(optimisticValue)
      set([], formattedOptimistic)
    }

    try {
      // Configure client if baseURL override provided
      if (baseURL) {
        const originalConfig = (apiClient as any).config
        apiClient.configure({ baseURL })

        try {
          const response = await apiClient.get<TData>(url, {
            signal: abortControllerRef.current.signal,
          })

          // Restore original config
          apiClient.configure(originalConfig)

          // Normalize and update store
          const normalized = format(response)

          // Update store with normalized data
          set([], normalized)

          // Store API metadata
          set(["_api", cacheKey], {
            data: response,
            loading: false,
            error: null,
            timestamp: Date.now(),
          })

          // Commit optimistic update (if any)
          optimisticManager.commit(cacheKey)

          setState({ loading: false, error: null })
          onSuccess?.(response)
        } catch (error) {
          apiClient.configure(originalConfig)
          throw error
        }
      } else {
        const response = await apiClient.get<TData>(url, {
          signal: abortControllerRef.current.signal,
        })

        // Normalize and update store
        const normalized = format(response)

        // Update store with normalized data
        set([], normalized)

        // Store API metadata
        set(["_api", cacheKey], {
          data: response,
          loading: false,
          error: null,
          timestamp: Date.now(),
        })

        // Commit optimistic update (if any)
        optimisticManager.commit(cacheKey)

        setState({ loading: false, error: null })
        onSuccess?.(response)
      }
    } catch (error: any) {
      // Ignore abort errors (cleanup on unmount)
      if (error.name === "AbortError") {
        return
      }

      // Rollback optimistic update
      if (optimistic && optimisticData) {
        const snapshot = optimisticManager.rollback(cacheKey)
        if (snapshot) {
          set([], snapshot)
        }
      }

      // Update error state
      set(["_api", cacheKey, "error"], error)
      setState({ loading: false, error })
      onError?.(error)
    }
  }

  // Fetch on mount and when dependencies change
  useEffect(() => {
    if (!enabled || !url) {
      setState({ loading: false, error: null })
      return
    }

    fetchData()

    // Cleanup: abort request on unmount
    return () => {
      abortControllerRef.current?.abort()
    }
  }, [url, enabled])

  // Get data from store (or use initialData)
  const apiMetadata = get()._api?.[cacheKey]
  const data = apiMetadata?.data ?? initialData

  return {
    data,
    loading: state.loading,
    error: state.error,
    refetch: fetchData,
  }
}
