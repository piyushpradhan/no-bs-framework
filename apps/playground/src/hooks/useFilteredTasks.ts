import { useStore } from "@no-bs-framework/state";
import type { AppStore, Task } from "../types";

export function useFilteredTasks() {
  const $store = useStore<AppStore>();

  // FRAMEWORK GAP: No computed/derived state support.
  // Must use useMemo, but since useStore() returns a proxy with no selector support,
  // every state change triggers this component to re-render and recompute.
  // The proxy also makes useMemo deps unreliable - we just recompute every render.

  const {
    selectedProjectId,
    searchQuery,
    filterStatus,
    filterAssignee,
    filterLabel,
    sortField,
    sortDirection,
  } = $store.root;

  // Convert normalized collection to array for filtering
  const allTasks = Object.values($store.tasks) as Task[];

  const filtered = allTasks.filter((task) => {
    // Project filter
    if (task.projectId !== selectedProjectId) return false;

    // Status filter
    if (filterStatus !== "all" && task.status !== filterStatus) return false;

    // Assignee filter
    if (filterAssignee !== "all" && task.assigneeId !== filterAssignee) return false;

    // Label filter
    if (filterLabel !== "all" && !task.labelIds.includes(filterLabel)) return false;

    // Search query
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        task.title.toLowerCase().includes(q) ||
        task.description.toLowerCase().includes(q)
      );
    }

    return true;
  });

  // Sort
  filtered.sort((a, b) => {
    const field = sortField as keyof Task;
    const aVal = a[field];
    const bVal = b[field];
    if (aVal == null && bVal == null) return 0;
    if (aVal == null) return 1;
    if (bVal == null) return -1;
    const cmp = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
    return sortDirection === "asc" ? cmp : -cmp;
  });

  return filtered;
}
