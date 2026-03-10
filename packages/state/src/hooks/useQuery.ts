/**
 * useQuery Hook
 *
 * Enhanced data fetching with:
 * - Automatic caching with TTL
 * - Request deduplication
 * - Stale-while-revalidate pattern
 * - Auto-refetch on window focus
 * - Polling support
 */

import { useEffect } from "react"
import { cache } from "../api/cache"
import { UseQueryOptions, UseQueryResult } from "../api/types"
import { useFetch } from "./useFetch"

const DEFAULT_STALE_TIME = 0 // Always stale by default
const DEFAULT_CACHE_TIME = 5 * 60 * 1000 // 5 minutes

export function useQuery<TData = any>(
  url: string | null,
  options: UseQueryOptions<TData> = {}
): UseQueryResult<TData> {
  const {
    staleTime = DEFAULT_STALE_TIME,
    cacheTime = DEFAULT_CACHE_TIME,
    refetchOnWindowFocus = true,
    refetchInterval = false,
    enabled = true,
    ...fetchOptions
  } = options

  const cacheKey = url ? `GET ${url}` : ""

  // Check cache
  const cachedData = url ? cache.get<TData>(cacheKey) : undefined
  const isStale = url ? cache.isStale(cacheKey) : true

  // Check for in-flight request (deduplication)
  const inFlightRequest = url ? cache.getInFlightRequest<TData>(cacheKey) : undefined

  // Only fetch if:
  // - enabled AND
  // - no cached data OR data is stale
  const shouldFetch = enabled && (!cachedData || isStale) && !inFlightRequest

  // Use useFetch for actual fetching
  const fetchResult = useFetch<TData>(url, {
    ...fetchOptions,
    enabled: shouldFetch,
  })

  // Store successful fetch in cache
  useEffect(() => {
    if (fetchResult.data && !fetchResult.loading && !fetchResult.error && url) {
      cache.set(cacheKey, fetchResult.data, { staleTime, cacheTime })
    }
  }, [fetchResult.data, fetchResult.loading, fetchResult.error, cacheKey, staleTime, cacheTime])

  // Auto-refetch on window focus
  useEffect(() => {
    if (!refetchOnWindowFocus || !url || !enabled) {
      return
    }

    const handleFocus = () => {
      if (cache.isStale(cacheKey)) {
        fetchResult.refetch()
      }
    }

    window.addEventListener("focus", handleFocus)
    return () => window.removeEventListener("focus", handleFocus)
  }, [refetchOnWindowFocus, url, enabled, cacheKey, fetchResult.refetch])

  // Polling (refetch interval)
  useEffect(() => {
    if (typeof refetchInterval !== "number" || !url || !enabled) {
      return
    }

    const interval = setInterval(() => {
      fetchResult.refetch()
    }, refetchInterval)

    return () => clearInterval(interval)
  }, [refetchInterval, url, enabled, fetchResult.refetch])

  // Request deduplication
  useEffect(() => {
    if (fetchResult.loading && url && !inFlightRequest) {
      // Create promise for deduplication
      const fetchPromise = fetchResult.refetch().then(() => fetchResult.data)
      cache.setInFlightRequest(cacheKey, fetchPromise as Promise<TData>)
    }
  }, [fetchResult.loading, url, inFlightRequest, cacheKey])

  // Use cached data if available, otherwise use fetch data
  const data = cachedData ?? fetchResult.data

  return {
    data,
    loading: fetchResult.loading && !cachedData, // Don't show loading if we have cached data
    isFetching: fetchResult.loading, // True during background refetch
    error: fetchResult.error,
    refetch: fetchResult.refetch,
  }
}
