import React, { useContext, useSyncExternalStore, useCallback } from "react";
import { Store } from ".";
import { formatState } from "..";

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

  return {
    ...obj,
    [head]:
      rest.length === 0
        ? value
        : setNestedValue(obj[head] ?? {}, rest, value),
  };
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
        store.setState((state) => setNestedValue(state, fullPath, value));
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
