export { Store } from "./store";
export type { Selector, Subscriber } from "./store";

export {
  suggestDomains,
  restructureDataByDomains,
  cleanupEmptyDomains,
} from "./core/inference";

export { useStore, useBatch, StoreProvider } from "./store/useStore";
export { useComputed } from "./store/useComputed";
export { useStoreActions } from "./store/useStoreActions";

// API Integration Exports
export { apiClient, configureApi, ApiClient } from "./api/client";
export { cache, RequestCache } from "./api/cache";
export { optimisticManager, OptimisticUpdateManager } from "./api/optimistic";

// Hooks
export { useFetch } from "./hooks/useFetch";
export { useQuery } from "./hooks/useQuery";
export { useMutation } from "./hooks/useMutation";
export { useInfiniteQuery } from "./hooks/useInfiniteQuery";

// Types
export type {
  ApiError,
  ApiClientConfig,
  HttpMethod,
  CacheEntry,
  CacheOptions,
  UseFetchOptions,
  UseFetchResult,
  UseQueryOptions,
  UseQueryResult,
  UseMutationOptions,
  UseMutationResult,
  UseInfiniteQueryOptions,
  UseInfiniteQueryResult,
  ApiMetadata,
  StoreApiDomain,
} from "./api/types";

import { Store } from "./store";
import {
  cleanupEmptyDomains,
  restructureDataByDomains,
  suggestDomains,
} from "./core/inference";
import { normalizeArray } from "./core/normalization";
import type { NormalizedStore } from "./core/storeTypes";

/**
 * Bring the values into a optimal structure before putting
 * them in store
 * @param value - the value that we want to store
 * @returns structured and normalized value that'll be stored
 */
export const formatState = (value: any) => {
  const domains = cleanupEmptyDomains(suggestDomains(value));
  const restructured = restructureDataByDomains(value, domains);

  const optimizedStore: Record<string, any> = {};
  for (const [domainName, data] of Object.entries(restructured)) {
    if (Array.isArray(data) && data.length > 0) {
      optimizedStore[domainName] = normalizeArray(data);
    } else {
      optimizedStore[domainName] = data;
    }
  }

  return optimizedStore;
};

/**
 * Create store automatically from raw API response.
 *
 * The return type is inferred from the input shape — arrays of objects become
 * normalized collections (Record<string, Item>), primitives are grouped into
 * the root domain, and nested objects become their own domains.
 *
 * @example
 * const store = createStore({ count: 0, users: [{ id: "1", name: "Alice" }] });
 * // store is Store<{ root: { count: number }; users: Record<string, { id: string; name: string }> }>
 */
export const createStore = <T extends Record<string, any>>(
  apiResponse: T,
): Store<NormalizedStore<T>> => {
  const formattedStore = formatState(apiResponse) as NormalizedStore<T>;
  return new Store(formattedStore);
};
