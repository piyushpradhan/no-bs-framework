import type { AppStore, Task, Comment, TaskStatus, TaskPriority } from "../types";

const STATUSES: TaskStatus[] = ["backlog", "todo", "in-progress", "done"];
const PRIORITIES: TaskPriority[] = ["low", "medium", "high", "urgent"];
const ADJECTIVES = ["Critical", "Broken", "Slow", "Missing", "Flaky", "Leaked", "Stale", "Bloated"];
const NOUNS = ["login flow", "cache layer", "render path", "API client", "form hook", "store proxy", "router guard", "type inference"];

let idCounter = 100;
function generateId(prefix: string) {
  return `${prefix}-${++idCounter}`;
}

// All actions take the proxy store ($store) and mutate via assignment.
// This is the only mutation API available from the framework.

export function createTask(
  $store: AppStore,
  data: Omit<Task, "id" | "createdAt" | "updatedAt" | "order">
) {
  const id = generateId("task");
  const now = new Date().toISOString().split("T")[0];
  const tasks = $store.tasks;
  const order = Object.keys(tasks).length;

  // FRAMEWORK GAP: We can't just push to a collection.
  // Must assign a new entity by key on the normalized store.
  // This works because proxy set handler calls setNestedValue at path ["tasks", id].
  (tasks as any)[id] = {
    ...data,
    id,
    order,
    createdAt: now,
    updatedAt: now,
  } satisfies Task;

  return id;
}

export function updateTask(
  $store: AppStore,
  taskId: string,
  updates: Partial<Task>
) {
  const task = $store.tasks[taskId];
  if (!task) return;

  const now = new Date().toISOString().split("T")[0];
  // FRAMEWORK GAP: Can't merge partial updates easily.
  // Must set each field individually because there's no $store.tasks[id].merge({...}).
  // Also can't spread and reassign because that replaces the whole object
  // and nested proxy wouldn't re-normalize it.
  for (const [key, value] of Object.entries(updates)) {
    if (key === "labelIds") {
      // FRAMEWORK GAP: Array mutations (push/splice) don't trigger re-renders.
      // Must replace the entire array.
      (task as any)[key] = [...(value as string[])];
    } else {
      (task as any)[key] = value;
    }
  }
  (task as any).updatedAt = now;
}

export function deleteTask($store: AppStore, taskId: string) {
  // FRAMEWORK GAP: No deleteProperty trap on proxy.
  // `delete $store.tasks[taskId]` silently fails or doesn't trigger re-render.
  // Workaround: rebuild the tasks object without the deleted task.
  const tasks = { ...(JSON.parse(JSON.stringify($store.tasks)) as Record<string, Task>) };
  delete tasks[taskId];

  // Also delete related comments
  const comments = { ...(JSON.parse(JSON.stringify($store.comments)) as Record<string, Comment>) };
  for (const [commentId, comment] of Object.entries(comments)) {
    if (comment.taskId === taskId) {
      delete comments[commentId];
    }
  }

  // FRAMEWORK GAP: Reassigning a domain-level key like $store.tasks = newObj
  // goes through setNestedValue at path ["tasks"], which does NOT re-normalize.
  // This is fine for objects (they don't need normalization), but if we assigned
  // an array here it would stay as an array, breaking the normalized structure.
  ($store as any).tasks = tasks;
  ($store as any).comments = comments;
}

export function changeTaskStatus(
  $store: AppStore,
  taskId: string,
  newStatus: TaskStatus
) {
  const task = $store.tasks[taskId];
  if (!task) return;
  (task as any).status = newStatus;
  (task as any).updatedAt = new Date().toISOString().split("T")[0];
}

export function addComment(
  $store: AppStore,
  taskId: string,
  userId: string,
  text: string
) {
  const id = generateId("comment");
  const now = new Date().toISOString();
  ($store.comments as any)[id] = {
    id,
    taskId,
    userId,
    text,
    createdAt: now,
  } satisfies Comment;
  return id;
}

export function toggleLabel(
  $store: AppStore,
  taskId: string,
  labelId: string
) {
  const task = $store.tasks[taskId];
  if (!task) return;

  const current = [...task.labelIds];
  const idx = current.indexOf(labelId);
  if (idx >= 0) {
    current.splice(idx, 1);
  } else {
    current.push(labelId);
  }
  // FRAMEWORK GAP: Must replace entire array - push/splice won't trigger re-render
  (task as any).labelIds = current;
}

export function setAssignee(
  $store: AppStore,
  taskId: string,
  assigneeId: string | null
) {
  const task = $store.tasks[taskId];
  if (!task) return;
  (task as any).assigneeId = assigneeId;
}

/**
 * Stress test: adds N tasks one by one via individual proxy mutations.
 *
 * FRAMEWORK GAP EXPOSED: Each createTask call fires store.setState once.
 * With N=100, that's 100 sequential state updates. React 18+ batches setState
 * calls in event handlers and transitions, but useSyncExternalStore's subscribe
 * callback fires synchronously outside React's batching. Result: each of the
 * 100 mutations triggers a synchronous re-render of EVERY component using
 * useStore(), before the next mutation runs.
 *
 * Expected behavior: 100 × (number of components) = potentially 1000+ renders
 * for a single "add 100 tasks" action.
 *
 * Proper fix would require: either batched updates in Store.setState, or
 * a bulk-add action that builds a new tasks object and sets it once.
 */
export function addStressTasks($store: AppStore, count: number = 100) {
  const projectId = $store.root.selectedProjectId;
  const now = new Date().toISOString().split("T")[0];

  // WORKAROUND: Build a single new tasks object to avoid N sequential state updates.
  // This is the only way to batch because we can't access store.setState directly.
  // We need to snapshot the current tasks, add N new ones, then replace the whole domain.
  const existingTasks = JSON.parse(JSON.stringify($store.tasks)) as Record<string, Task>;
  const newTasks = { ...existingTasks };

  for (let i = 0; i < count; i++) {
    const id = generateId("stress");
    const adj = ADJECTIVES[i % ADJECTIVES.length];
    const noun = NOUNS[Math.floor(i / ADJECTIVES.length) % NOUNS.length];
    newTasks[id] = {
      id,
      projectId,
      title: `[${i + 1}] ${adj} ${noun}`,
      description: "Auto-generated stress test task",
      status: STATUSES[i % STATUSES.length],
      priority: PRIORITIES[i % PRIORITIES.length],
      assigneeId: null,
      labelIds: [],
      order: Object.keys(existingTasks).length + i,
      createdAt: now,
      updatedAt: now,
    };
  }

  // Single state update - this is the batched workaround
  ($store as any).tasks = newTasks;
}

/**
 * Bulk status change: moves all tasks in a project to a new status in one shot.
 * Tests: multiple field mutations, proxy behavior, re-render cascade.
 */
export function bulkChangeStatus($store: AppStore, projectId: string, newStatus: TaskStatus) {
  const tasks = JSON.parse(JSON.stringify($store.tasks)) as Record<string, Task>;
  const updated: Record<string, Task> = {};
  const now = new Date().toISOString().split("T")[0];

  for (const [id, task] of Object.entries(tasks)) {
    if (task.projectId === projectId) {
      updated[id] = { ...task, status: newStatus, updatedAt: now };
    } else {
      updated[id] = task;
    }
  }

  ($store as any).tasks = updated;
}

/**
 * Clear all stress test tasks.
 */
export function clearStressTasks($store: AppStore) {
  const tasks = JSON.parse(JSON.stringify($store.tasks)) as Record<string, Task>;
  const filtered: Record<string, Task> = {};
  for (const [id, task] of Object.entries(tasks)) {
    if (!id.startsWith("stress-")) {
      filtered[id] = task;
    }
  }
  ($store as any).tasks = filtered;
}
