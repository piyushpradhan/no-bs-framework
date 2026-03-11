export { Store } from "./store";
export type { Selector, Subscriber } from "./store";

export {
  suggestDomains,
  restructureDataByDomains,
  cleanupEmptyDomains,
} from "./core/inference";

export { useStore, useBatch, StoreProvider } from "./store/useStore";
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

/**
 * Bring the values into a optimal structure before putting
 * them in store
 * @param value - the value that we want to store
 * @returns structured and normalized value that'll be stored
 */
export const formatState = (value: any) => {
  const domains = cleanupEmptyDomains(suggestDomains(value));

  console.log("Domains: ", domains);

  const restructured = restructureDataByDomains(value, domains);

  console.log("Structured: ", restructured);

  const optimizedStore: Record<string, any> = {};
  for (const [domainName, data] of Object.entries(restructured)) {
    if (Array.isArray(data) && data.length > 0) {
      optimizedStore[domainName] = normalizeArray(data);
    } else {
      optimizedStore[domainName] = data;
    }
  }

  console.log("Optimized: ", optimizedStore);

  return optimizedStore;
};

/**
 * Create store automatically from raw API response
 * @param apiResponse - raw data from API
 * @returns initialized Store instance
 */
export const createStore = <T extends Record<string, any>>(
  apiResponse: T,
): Store<any> => {
  const formattedStore = formatState(apiResponse);
  return new Store(formattedStore);
};
