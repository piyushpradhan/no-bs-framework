/**
 * useInfiniteQuery Hook
 *
 * Pagination with automatic accumulation:
 * - Load more pattern
 * - Infinite scroll support
 * - Automatic page accumulation
 * - hasMore detection
 */

import { useState, useCallback } from "react"
import { apiClient } from "../api/client"
import { UseInfiniteQueryOptions, UseInfiniteQueryResult, ApiError } from "../api/types"
import { useStoreActions } from "../store/useStoreActions"

const DEFAULT_PAGE_SIZE = 10
const DEFAULT_INITIAL_PAGE = 1

export function useInfiniteQuery<TData = any>(
  getUrl: (pageParam: number) => string,
  options: UseInfiniteQueryOptions<TData> = {}
): UseInfiniteQueryResult<TData> {
  const {
    pageSize = DEFAULT_PAGE_SIZE,
    initialPage = DEFAULT_INITIAL_PAGE,
    getNextPageParam,
    enabled = true,
    optimistic: _optimistic = false,
    onSuccess,
    onError,
  } = options

  const [state, setState] = useState<{
    data: TData[]
    loading: boolean
    error: ApiError | null
    currentPage: number
    hasMore: boolean
    isFetchingNextPage: boolean
    allPages: TData[][]
  }>({
    data: [],
    loading: enabled,
    error: null,
    currentPage: initialPage,
    hasMore: true,
    isFetchingNextPage: false,
    allPages: [],
  })

  const { format } = useStoreActions<any>()

  const fetchPage = async (page: number, isNextPage: boolean = false) => {
    const url = getUrl(page)

    setState((prev) => ({
      ...prev,
      loading: !isNextPage,
      isFetchingNextPage: isNextPage,
      error: null,
    }))

    try {
      const response = await apiClient.get<TData[]>(url)

      // Normalize and format response
      void format(response) // normalize response (result stored via useStoreActions)

      setState((prev) => {
        const newPages = isNextPage ? [...prev.allPages, response] : [response]
        const flatData = newPages.flat()

        // Determine if there are more pages
        const hasMore = getNextPageParam
          ? getNextPageParam(response, newPages) !== undefined
          : response.length === pageSize

        return {
          ...prev,
          data: flatData,
          allPages: newPages,
          loading: false,
          isFetchingNextPage: false,
          currentPage: page,
          hasMore,
        }
      })

      if (onSuccess) {
        onSuccess(response)
      }
    } catch (error: any) {
      const apiError: ApiError =
        error instanceof Error
          ? (error as ApiError)
          : new ApiError("Fetch failed", 0, "Unknown Error", url)

      setState((prev) => ({
        ...prev,
        loading: false,
        isFetchingNextPage: false,
        error: apiError,
      }))

      if (onError) {
        onError(apiError)
      }
    }
  }

  const fetchNextPage = useCallback(async () => {
    if (!state.hasMore || state.isFetchingNextPage) {
      return
    }

    const nextPage = getNextPageParam
      ? getNextPageParam(
          state.allPages[state.allPages.length - 1],
          state.allPages
        )
      : state.currentPage + 1

    if (nextPage === undefined) {
      return
    }

    await fetchPage(nextPage, true)
  }, [state.hasMore, state.isFetchingNextPage, state.currentPage, state.allPages])

  // Initial fetch
  useState(() => {
    if (enabled) {
      fetchPage(initialPage, false)
    }
  })

  return {
    data: state.data,
    loading: state.loading,
    error: state.error,
    hasMore: state.hasMore,
    fetchNextPage,
    isFetchingNextPage: state.isFetchingNextPage,
  }
}
