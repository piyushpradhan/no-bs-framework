/**
 * useMutation Hook
 *
 * CREATE/UPDATE/DELETE operations with:
 * - Optimistic updates enabled by default
 * - Automatic rollback on error
 * - Smart merge algorithm for server responses
 * - Cache invalidation
 * - Lifecycle callbacks
 */

import { useRef, useState } from "react"
import { apiClient } from "../api/client"
import { cache } from "../api/cache"
import { optimisticManager } from "../api/optimistic"
import { UseMutationOptions, UseMutationResult, ApiError } from "../api/types"
import { useStoreActions } from "../store/useStoreActions"

/**
 * Smart merge algorithm
 * Combines optimistic data with server response intelligently
 */
function smartMerge<T>(optimistic: T, serverResponse: T): T {
  // Primitive or null - server wins
  if (typeof serverResponse !== "object" || serverResponse === null) {
    return serverResponse
  }

  // Array - server wins (replace, don't merge)
  if (Array.isArray(serverResponse)) {
    return serverResponse
  }

  // Object - deep merge
  const merged: any = { ...optimistic }

  for (const key in serverResponse) {
    const serverValue = (serverResponse as any)[key]
    const optimisticValue = (optimistic as any)?.[key]

    if (
      typeof serverValue === "object" &&
      !Array.isArray(serverValue) &&
      serverValue !== null
    ) {
      // Recursive merge for nested objects
      merged[key] = smartMerge(optimisticValue, serverValue)
    } else {
      // Server value wins (primitives, arrays, null)
      merged[key] = serverValue
    }
  }

  return merged
}

export function useMutation<TData = any, TVariables = any>(
  url: string | ((variables: TVariables) => string),
  method: "POST" | "PATCH" | "PUT" | "DELETE",
  options: UseMutationOptions<TData, TVariables> = {}
): UseMutationResult<TData, TVariables> {
  const {
    optimistic = true,
    optimisticData,
    onSuccess,
    onError,
    onMutate,
    invalidateQueries = [],
    baseURL,
  } = options

  const [state, setState] = useState<{
    loading: boolean
    error: ApiError | null
  }>({
    loading: false,
    error: null,
  })

  const { set, get, format } = useStoreActions<any>()
  const mutationId = useRef(0)

  const mutate = async (variables: TVariables): Promise<TData> => {
    const id = `mutation-${++mutationId.current}`
    const finalUrl = typeof url === "function" ? url(variables) : url

    setState({ loading: true, error: null })

    // onMutate callback
    if (onMutate) {
      onMutate(variables)
    }

    // Snapshot for rollback
    const snapshot = get()
    optimisticManager.snapshot(id, snapshot)

    // Apply optimistic update
    if (optimistic !== false) {
      let optimisticValue: any

      if (optimisticData) {
        // Use provided optimisticData function or value
        optimisticValue =
          typeof optimisticData === "function"
            ? (optimisticData as (variables: TVariables, current: any) => TData)(
                variables,
                snapshot
              )
            : optimisticData
      } else {
        // Default: use request body as optimistic value
        optimisticValue = variables
      }

      // Format and merge optimistic data into store
      const formattedOptimistic = format(optimisticValue)
      set([], formattedOptimistic)

      // Store optimistic metadata
      set(["_optimistic", id], optimisticValue)
    }

    try {
      // Configure client if baseURL override provided
      let response: TData

      if (baseURL) {
        const originalConfig = (apiClient as any).config
        apiClient.configure({ baseURL })

        try {
          response = await (apiClient as any)[method.toLowerCase()](finalUrl, variables)
          apiClient.configure(originalConfig)
        } catch (error) {
          apiClient.configure(originalConfig)
          throw error
        }
      } else {
        response = await (apiClient as any)[method.toLowerCase()](finalUrl, variables)
      }

      // Success - apply smart merge if optimistic was used
      if (optimistic !== false && optimisticData) {
        const optimisticValue = get()._optimistic?.[id]
        if (optimisticValue) {
          const merged = smartMerge(optimisticValue, response)
          const formattedMerged = format(merged)
          set([], formattedMerged)
        }
      } else {
        // No optimistic update, just format and set
        const formatted = format(response)
        set([], formatted)
      }

      // Commit optimistic update (remove snapshot)
      optimisticManager.commit(id)

      // Clear optimistic metadata
      const currentState = get()
      if (currentState._optimistic?.[id]) {
        delete currentState._optimistic[id]
        set([], currentState)
      }

      // Invalidate related queries
      if (invalidateQueries.length > 0) {
        invalidateQueries.forEach((key) => {
          cache.invalidate(key)
        })
      }

      setState({ loading: false, error: null })

      if (onSuccess) {
        onSuccess(response, variables)
      }

      return response
    } catch (error: any) {
      // Error - rollback optimistic update
      const previousState = optimisticManager.rollback(id)
      if (previousState) {
        set([], previousState)
      }

      // Clear optimistic metadata
      const currentState = get()
      if (currentState._optimistic?.[id]) {
        delete currentState._optimistic[id]
        set([], currentState)
      }

      const apiError: ApiError =
        error instanceof Error
          ? (error as ApiError)
          : new ApiError("Mutation failed", 0, "Unknown Error", finalUrl)

      setState({ loading: false, error: apiError })

      if (onError) {
        onError(apiError, variables)
      }

      throw apiError
    }
  }

  return {
    mutate,
    mutateAsync: mutate,
    loading: state.loading,
    error: state.error,
    reset: () => setState({ loading: false, error: null }),
  }
}
