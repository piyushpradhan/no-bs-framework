import { useContext, useCallback, useSyncExternalStore } from "react";
import { StoreContext } from "./useStore";

/**
 * Derive a memoized value from the store.
 *
 * Unlike useStore(selector) where the selector is called on every store
 * notification and React decides whether to re-render, useComputed lets you
 * compose multiple transformations with explicit memoization via the `equal`
 * comparator. The component only re-renders when the computed value changes
 * according to the provided equality check.
 *
 * For most use cases, useStore(selector) is sufficient. Use useComputed when:
 * - The selector produces a new array/object reference on every call
 *   (e.g. filter, map) and you need structural equality instead of reference
 *   equality to prevent unnecessary re-renders
 * - You need custom equality logic (e.g. deep compare, set membership)
 *
 * @example
 * // Only re-renders when the set of task IDs for a project actually changes
 * const taskIds = useComputed(
 *   (state) => Object.keys(state.tasks).filter(id => state.tasks[id].projectId === pid),
 *   (a, b) => a.length === b.length && a.every((id, i) => id === b[i])
 * );
 */
export function useComputed<T = any, S = any>(
  selector: (state: T) => S,
  equal: (a: S, b: S) => boolean = Object.is,
): S {
  const store = useContext(StoreContext);
  if (!store) throw new Error("useComputed must be used within a StoreProvider");

  let lastSelected: { value: S } | null = null;

  const subscribe = useCallback(
    (onStoreChange: () => void) => {
      return store.subscribe((state: T) => {
        const next = selector(state);
        if (lastSelected === null || !equal(lastSelected.value, next)) {
          return next; // changed — trigger
        }
        return lastSelected.value; // same — no trigger (shallowEqual in Store sees ===)
      }, onStoreChange);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [store, selector, equal],
  );

  const getSnapshot = useCallback(() => {
    const next = selector(store.getState() as T);
    if (lastSelected !== null && equal(lastSelected.value, next)) {
      return lastSelected.value; // stable reference → no re-render
    }
    lastSelected = { value: next };
    return next;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store, selector, equal]);

  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
