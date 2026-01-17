import React, { useContext, useSyncExternalStore, useCallback } from "react";
import { Store } from ".";
import { formatState } from "..";

const StoreContext = React.createContext<Store<any> | null>(null);

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
  const formattedState = formatState(value, path);

  if (path.length === 0) return formattedState;

  const [head, ...rest] = path;

  return {
    ...obj,
    [head]:
      rest.length === 0
        ? value
        : setNestedValue(obj[head] ?? {}, rest, formattedState),
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

      // For nested objects, create another proxy
      if (value !== null && typeof value === "object") {
        return new Proxy(value, createProxyHandler(store, [...path, prop]));
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

  // Return proxied state for mutations
  return new Proxy(state, createProxyHandler(store)) as T;
};
