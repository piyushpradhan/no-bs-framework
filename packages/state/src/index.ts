export { Store } from "./store";
export type { Selector, Subscriber } from "./store";

export {
  suggestDomains,
  restructureDataByDomains,
  cleanupEmptyDomains,
} from "./core/inference";

export { useStore, StoreProvider } from "./store/useStore";

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
