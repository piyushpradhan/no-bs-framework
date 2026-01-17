import { NormalizedCollection } from "./types";

/**
 * Normalize an array of objects into a keyed object
 *
 * Example:
 * Input:  [{ id: 1, title: "Post 1" }, { id: 2, title: "Post 2" }]
 * Output: { "1": { id: 1, title: "Post 1" }, "2": { id: 2, title: "Post 2" } }
 *
 * Benefits:
 * 1. O(1) lookup by ID instead of O(n) array search
 * 2. Easier to update single items
 * 3. Consistent structure for all domains
 */
export function normalizeArray(
  array: any[],
  idField: string = "id",
): Record<string, any> {
  if (!Array.isArray(array)) {
    throw new Error("Input must be an array");
  }

  const normalized: NormalizedCollection = {};

  array.forEach((item) => {
    if (typeof item !== "object" || item === null) {
      throw new Error("Array items must be objects");
    }

    const idFieldValue = item[idField];
    if (idFieldValue === undefined || idFieldValue === null) {
      throw new Error(
        `Item missing required ID field '${idField}': ${JSON.stringify(item)}`,
      );
    }

    normalized[idFieldValue] = item;
  });

  return normalized;
}
