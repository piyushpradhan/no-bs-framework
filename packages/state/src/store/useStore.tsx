import React, { useContext, useSyncExternalStore, useCallback } from "react";
import { Store } from ".";
import { formatState } from "..";
import { normalizeArray } from "../core/normalization";

export const StoreContext = React.createContext<Store<any> | null>(null);

const proxyCache = new WeakMap<object, Map<string, any>>();

const getCachedProxy = <T extends Record<string, any>>(
  target: object,
  path: string[],
  store: Store<T>
): any => {
  const pathKey = path.join(".");

  let pathMap = proxyCache.get(target);
  if (!pathMap) {
    pathMap = new Map();
    proxyCache.set(target, pathMap);
  }

  let proxy = pathMap.get(pathKey);
  if (!proxy) {
    proxy = new Proxy(target, createProxyHandler(store, path));
    pathMap.set(pathKey, proxy);
  }

  return proxy;
};

export const StoreProvider = ({
  store,
  children,
}: {
  store: Store<any>;
  children: React.ReactNode;
}) => {
  return (
    <StoreContext.Provider value={store}>{children}</StoreContext.Provider>
  );
};

export const setNestedValue = <T extends Record<string, any>>(
  obj: T,
  path: string[],
  value: any,
): any => {
  // Only format state for top-level assignments (path.length === 0)
  // For nested paths, use the value directly to preserve primitives
  if (path.length === 0) {
    return formatState(value);
  }

  const [head, ...rest] = path;
  const updatedChild =
    rest.length === 0 ? value : setNestedValue((obj as any)[head] ?? {}, rest, value);

  // Preserve arrays: { ...array, key: val } converts an array to a plain object.
  // Use array spread + index assignment instead.
  if (Array.isArray(obj)) {
    const copy = [...obj] as any[];
    copy[head as any] = updatedChild;
    return copy;
  }

  return { ...obj, [head]: updatedChild };
};

export const deleteNestedValue = <T extends Record<string, any>>(
  obj: T,
  path: string[],
): any => {
  if (path.length === 0) return obj;

  const [head, ...rest] = path;

  if (rest.length === 0) {
    // Remove the key at this level
    const { [head]: _removed, ...remaining } = obj as any;
    return remaining;
  }

  return {
    ...obj,
    [head]: deleteNestedValue(obj[head] ?? {}, rest),
  };
};

// Array methods that mutate in-place. These are intercepted to fire a single
// store update instead of triggering the set trap multiple times (once per
// index and once for "length"), which would corrupt arrays into plain objects.
const MUTATING_ARRAY_METHODS = new Set([
  "push", "pop", "shift", "unshift", "splice", "sort", "reverse", "fill",
]);

export const createProxyHandler = <T extends Record<string, any>>(
  store: Store<T>,
  path: Array<string> = [],
): ProxyHandler<any> => {
  return {
    get(target: any, prop: string): any {
      // Skip internal React/Symbol properties
      if (
        typeof prop === "symbol" ||
        prop === "$$typeof" ||
        prop === "toJSON"
      ) {
        return target[prop];
      }

      // Intercept mutating array methods: run on a copy, then sync to store
      // in one setState call instead of letting the method trigger multiple
      // individual set traps (which would corrupt arrays into plain objects).
      if (Array.isArray(target) && typeof prop === "string" && MUTATING_ARRAY_METHODS.has(prop)) {
        return (...args: any[]) => {
          const copy = [...target];
          const result = (copy as any)[prop](...args);
          store.setState((state) => setNestedValue(state, path, copy));
          return result;
        };
      }

      const value = target[prop];

      // For nested objects, return cached proxy (or create and cache one)
      if (value !== null && typeof value === "object") {
        return getCachedProxy(value, [...path, prop], store);
      }

      return value;
    },
    set(target: any, prop: string, value: any): boolean {
      const fullPath = [...path, prop];
      const currentValue = target[prop];

      if (currentValue !== value) {
        // Auto-normalize raw arrays of objects assigned to a top-level domain.
        // Assigning $store.tasks = [...rawArray] would otherwise bypass the
        // normalization that createStore applied on init, leaving a raw array
        // where components expect a Record<id, entity>.
        let processedValue = value;
        if (
          path.length === 0 &&
          Array.isArray(value) &&
          value.length > 0 &&
          typeof value[0] === "object" &&
          value[0] !== null &&
          "id" in value[0]
        ) {
          processedValue = normalizeArray(value);
        }
        store.setState((state) => setNestedValue(state, fullPath, processedValue));
      }

      return true;
    },
    deleteProperty(target: any, prop: string): boolean {
      if (!(prop in target)) return true;

      const fullPath = [...path, prop];
      store.setState((state) => deleteNestedValue(state, fullPath));
      return true;
    },
  };
};

export const getNestedValue = (obj: any, path: string) => {
  const keys = path.split(".");
  let current = obj;

  for (const key of keys) {
    if (current === null) {
      return undefined;
    }
    current = current[key];
  }

  return current;
};

/**
 * Returns a stable batch function that groups multiple mutations into a
 * single subscriber notification, preventing cascade re-renders.
 *
 * @example
 * const batch = useBatch();
 * batch(() => {
 *   $store.tasks[id1].status = "done";
 *   $store.tasks[id2].priority = "low";
 * }); // triggers exactly one re-render for all subscribers
 */
export const useBatch = () => {
  const store = useContext(StoreContext);
  if (!store) throw new Error("useBatch must be used within a StoreProvider");
  return useCallback((fn: () => void) => store.batch(fn), [store]);
};

export const useStore = <T = any,>() => {
  const store = useContext(StoreContext);

  if (!store) {
    throw new Error("useStore must be used within a StoreProvider");
  }

  const subscribe = useCallback(
    (onStoreChange: () => void) => {
      // Subscribe to all state changes
      return store.subscribe((state) => state, onStoreChange);
    },
    [store],
  );

  const getSnapshot = useCallback(() => store.getState(), [store]);

  // This triggers re-render when store changes
  const state = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  // Return cached proxy for mutations (root level, empty path)
  return getCachedProxy(state, [], store) as T;
};
