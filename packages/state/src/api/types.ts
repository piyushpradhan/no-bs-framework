/**
 * API Integration Types
 *
 * Core TypeScript definitions for the API layer including:
 * - Error handling
 * - HTTP client configuration
 * - Cache management
 * - Hook options and return types
 */

// ============================================================================
// Error Handling
// ============================================================================

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public statusText: string,
    public url: string,
    public response?: any
  ) {
    super(message)
    this.name = "ApiError"

    // Maintains proper stack trace for where error was thrown (V8 only)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ApiError)
    }
  }
}

// ============================================================================
// HTTP Client Types
// ============================================================================

export interface ApiClientConfig {
  baseURL?: string
  headers?: Record<string, string>
  timeout?: number
  onRequest?: (url: string, options: RequestInit) => void | Promise<void>
  onResponse?: <T>(response: Response, data: T) => T | Promise<T>
  onError?: (error: ApiError) => void | Promise<void>
}

export type HttpMethod = "GET" | "POST" | "PATCH" | "PUT" | "DELETE"

// ============================================================================
// Cache Types
// ============================================================================

export interface CacheEntry<T> {
  data: T
  timestamp: number
  staleTime: number
  cacheTime: number
  promise?: Promise<T>  // For request deduplication
}

export interface CacheOptions {
  staleTime: number  // When data becomes stale (triggers refetch)
  cacheTime: number  // When data gets removed from cache
}

// ============================================================================
// Hook Option Types
// ============================================================================

export interface UseFetchOptions<TData> {
  initialData?: TData
  optimistic?: boolean
  optimisticData?: TData | ((current: any) => TData)
  onSuccess?: (data: TData) => void
  onError?: (error: ApiError) => void
  enabled?: boolean
  baseURL?: string  // Override global baseURL
}

export interface UseQueryOptions<TData> extends UseFetchOptions<TData> {
  staleTime?: number
  cacheTime?: number
  refetchOnWindowFocus?: boolean
  refetchInterval?: number | false
}

export interface UseMutationOptions<TData, TVariables> {
  optimistic?: boolean
  optimisticData?: TData | ((variables: TVariables, current: any) => TData)
  onSuccess?: (data: TData, variables: TVariables) => void
  onError?: (error: ApiError, variables: TVariables) => void
  onMutate?: (variables: TVariables) => void
  invalidateQueries?: string[]
  baseURL?: string
}

export interface UseInfiniteQueryOptions<TData> {
  pageSize?: number
  initialPage?: number
  getNextPageParam?: (lastPage: TData[], allPages: TData[][]) => number | undefined
  enabled?: boolean
  optimistic?: boolean
  onSuccess?: (data: TData[]) => void
  onError?: (error: ApiError) => void
}

// ============================================================================
// Hook Return Types
// ============================================================================

export interface UseFetchResult<TData> {
  data: TData | undefined
  loading: boolean
  error: ApiError | null
  refetch: () => Promise<void>
}

export interface UseQueryResult<TData> extends UseFetchResult<TData> {
  isFetching: boolean  // True during background refetch
}

export interface UseMutationResult<TData, TVariables> {
  mutate: (variables: TVariables) => Promise<TData>
  mutateAsync: (variables: TVariables) => Promise<TData>
  loading: boolean
  error: ApiError | null
  reset: () => void
}

export interface UseInfiniteQueryResult<TData> {
  data: TData[]
  loading: boolean
  error: ApiError | null
  hasMore: boolean
  fetchNextPage: () => Promise<void>
  isFetchingNextPage: boolean
}

// ============================================================================
// Store Integration Types
// ============================================================================

export interface ApiMetadata {
  data?: any  // IDs or primitive data
  loading: boolean
  error: ApiError | null
  timestamp?: number
  staleTime?: number
  cacheTime?: number
}

export interface StoreApiDomain {
  _api: Record<string, ApiMetadata>
  _optimistic: Record<string, any>
}

// ============================================================================
// Utility Types
// ============================================================================

export type MaybePromise<T> = T | Promise<T>

export type OptimisticDataFunction<TData, TVariables> = (
  variables: TVariables,
  current: any
) => TData
