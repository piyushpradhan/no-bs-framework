/**
 * TypeScript utilities for inferring the normalized store shape from the
 * raw input data passed to createStore().
 *
 * The normalization pipeline transforms:
 *  - Arrays of objects  →  Record<string, Item>  (collection domain)
 *  - Primitive values   →  grouped into { root: { ...primitives } }
 *  - Nested objects     →  { [key]: NestedObject }  (own domain, no wrapping)
 *  - Arrays of primitives →  treated as primitives, end up in root
 */

/** Detect if T is an array of objects (a collection domain) */
type IsObjectArray<T> =
  NonNullable<T> extends Array<infer Item>
    ? Item extends object
      ? true
      : false
    : false;

/** Detect if T is a plain nested object (not an array, not a primitive) */
type IsNestedObject<T> =
  NonNullable<T> extends object
    ? NonNullable<T> extends any[]
      ? false
      : true
    : false;

/** Extract the item type from an array */
type ArrayItem<T> = T extends Array<infer Item> ? Item : never;

/**
 * The full normalized store shape inferred from the createStore input type T.
 *
 * @example
 * const store = createStore({ count: 0, users: [{ id: "1", name: "Alice" }] });
 * // Inferred as NormalizedStore<{ count: number; users: { id: string; name: string }[] }>
 * // Which resolves to:
 * // {
 * //   root: { count: number };
 * //   users: Record<string, { id: string; name: string }>;
 * // }
 */
export type NormalizedStore<T extends object> =
  // Primitive fields → root domain
  {
    root: {
      [K in keyof T as IsObjectArray<T[K]> extends true
        ? never
        : IsNestedObject<T[K]> extends true
          ? never
          : K]: T[K];
    };
  } &
  // Arrays of objects → normalized collection domains
  {
    [K in keyof T as IsObjectArray<T[K]> extends true ? K : never]:
      Record<string, ArrayItem<T[K]>>;
  } &
  // Nested objects → own domain (no double-nesting after fix #7)
  {
    [K in keyof T as IsNestedObject<T[K]> extends true ? K : never]: T[K];
  };
