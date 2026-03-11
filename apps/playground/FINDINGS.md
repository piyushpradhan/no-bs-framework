# Framework Stress Test Findings

Built a full project management app (TaskFlow) using `@no-bs-framework/state` to expose limits.
App has 5 entity types, 3 views, full CRUD, search/filtering, comments, and stress testing tools.

---

## Critical Issues

### 1. No Selective Re-Rendering

**Severity: Critical**

Every component using `useStore()` re-renders on every state mutation, regardless of whether
the component's data changed.

```tsx
// In useStore.tsx — subscribed to the entire state, no selector support:
const subscribe = useCallback((onStoreChange: () => void) => {
  return store.subscribe((state) => state, onStoreChange); // always (state) => state
}, [store]);
```

**Observed in playground:** Typing one character in the search box causes all 4 board columns,
the sidebar, and the header to re-render simultaneously. The `RenderCounter` on each column
increments on every keystroke, even for columns with zero task changes.

**Fix needed:**
```tsx
// Allow: useStore(selector)
const taskCount = useStore((state) => Object.keys(state.tasks).length);
// Only re-renders when taskCount changes, not on every state mutation
```

---

### 2. No Delete Trap on Proxy

**Severity: High**

The proxy handler has `get` and `set` traps but no `deleteProperty` trap. Deleting an entity
from a normalized collection silently fails.

```tsx
// This does NOT work — proxy ignores delete:
delete $store.tasks["task-1"];
```

**Workaround used in playground** (`deleteTask` in `store/actions.ts`):
```tsx
// Must snapshot, filter, and replace the entire domain:
const tasks = JSON.parse(JSON.stringify($store.tasks));
delete tasks[taskId];
($store as any).tasks = tasks; // replaces entire domain in one update
```

**Cost:** Two serialization passes (stringify+parse) to snapshot the state, plus replacing
the whole domain triggers re-renders of every subscriber.

**Fix needed:** Add `deleteProperty` trap to `createProxyHandler`.

---

### 3. Array Mutations Don't Trigger Re-Renders (or Corrupt Data)

**Severity: High**

`push`, `splice`, and `sort` on nested arrays inside proxy objects either:
- Don't trigger `store.setState` at all (mutation invisible to React), OR
- Corrupt the array into a plain object `{0: "a", 1: "b", length: 2}`

```tsx
// This silently fails:
$store.tasks["task-1"].labelIds.push("label-3");

// This corrupts data (push triggers set for "length" and index,
// setNestedValue spreads array as object: { ...["a","b"] } → {0:"a",1:"b"}):
```

**Workaround used in playground** (`toggleLabel`, `updateTask` in `store/actions.ts`):
```tsx
// Must replace the entire array:
(task as any).labelIds = [...task.labelIds, newLabel];
```

**Fix needed:** The proxy needs an array-aware mutation path, or setNestedValue needs to
detect arrays and use array spreading instead of object spreading.

---

### 4. No Re-Normalization on Domain Reassignment

**Severity: Medium**

`setNestedValue` only calls `formatState()` when `path.length === 0`. Assigning a raw array
to a domain-level key (e.g. `$store.tasks = [array]`) stores it as-is without normalization.

```tsx
// This stores an array, breaking the normalized structure:
$store.tasks = [task1, task2]; // becomes tasks: [{id: "task-1", ...}, ...]

// But this works (replaces with pre-normalized object):
($store as any).tasks = { "task-1": task1, "task-2": task2 };
```

**Observed in playground:** All CRUD workarounds pre-build the normalized Record and assign it
directly. If a developer forgets this and assigns a raw array, the app silently breaks.

---

## Moderate Issues

### 5. No Computed / Derived State

**Severity: Medium**

No mechanism for memoized derived values. All derived state is recomputed every render.

```tsx
// useFilteredTasks.ts — runs on every render of every consumer:
export function useFilteredTasks() {
  const $store = useStore<AppStore>();
  const allTasks = Object.values($store.tasks) as Task[];
  return allTasks.filter(...).sort(...); // recomputed every single render
}
```

**Impact:** With 100+ tasks and the search filter active, every keystroke (already causing
all components to re-render per Gap #1) also reruns the full O(n log n) sort.

**Fix needed:** Either `useStore(selector)` (which doubles as computed state) or a
`useComputed(fn, deps)` hook.

---

### 6. No TypeScript Inference from Initial Data

**Severity: Medium**

`createStore(data)` returns `Store<any>`. There is no type flow from the initial data shape
to the store's runtime shape. Additionally, the normalized shape differs from the input shape
(arrays become Records), making it impossible to infer the type automatically.

```tsx
// The playground requires manual typing + many unsafe casts:
const $store = useStore<AppStore>(); // manual type annotation
(task as any).status = newStatus;   // cast needed for index-signed writes
($store as any).tasks = newTasks;   // cast needed for domain replacement
```

**Fix needed:** Typed `createStore<T>()` that infers the normalized output shape.

---

### 7. Double-Nesting of Nested Objects

**Severity: Low**

Nested objects in the initial data are wrapped under their field name:
`stats: { total: 15 }` → `$store.stats.stats.total` (not `$store.stats.total`).

```tsx
// Input:
createStore({ stats: { totalTasks: 15 } });

// Resulting store path (from restructureDataByDomains):
$store.stats         // → { stats: { totalTasks: 15 } }
$store.stats.stats   // → { totalTasks: 15 }
$store.stats.stats.totalTasks  // → 15
```

**Worked around in playground** by avoiding nested objects in the seed data entirely,
instead keeping all scalars flat in the `root` domain.

---

## Minor Issues

### 8. No Router

`@no-bs-framework/router` throws `Error: Not implemented yet`.

**Workaround used:** Hash-based routing implemented manually in `hooks/useRouter.ts`
using `window.location.hash` + `hashchange` events synced to `$store.root.currentView`.

**Cost:** 30-line manual implementation. Every component needing navigation imports
and calls the hook separately, resulting in multiple `hashchange` listeners.

---

### 9. No Form Abstractions

`@no-bs-framework/forms` throws `Error: Not implemented yet`.

**Workaround used:** Manual `useState` for every form field in `TaskForm.tsx`:
```tsx
const [title, setTitle] = useState("");
const [description, setDescription] = useState("");
const [status, setStatus] = useState<TaskStatus>("todo");
const [priority, setPriority] = useState<TaskPriority>("medium");
const [assigneeId, setAssigneeId] = useState("");
const [selectedLabels, setSelectedLabels] = useState<string[]>([]);
```

**Cost:** 6 useState calls for a single form. A form library would reduce this to
`useForm(schema)` + field registrations.

---

### 10. No Batched Writes API

**Severity: Low**

No way to batch multiple store mutations into a single state update. Each proxy assignment
fires `store.setState` independently.

**Workaround used in playground** (`addStressTasks` in `store/actions.ts`):
```tsx
// Build new state first, then assign once (single update):
const newTasks = { ...JSON.parse(JSON.stringify($store.tasks)) };
for (let i = 0; i < count; i++) { newTasks[id] = { ... }; }
($store as any).tasks = newTasks; // single assignment → single re-render
```

**Fix needed:** A `store.batch(fn)` or `$store.$batch(fn)` API that accumulates mutations
and fires `setState` once.

---

## What Works Well

- **Automatic normalization** works reliably for simple flat arrays of objects with an `id` field.
- **Proxy mutations** for simple scalar updates (`$store.root.currentView = "board"`) are
  clean and intuitive — much less ceremony than Redux or even Zustand's `set()`.
- **Cross-domain reads** work naturally: `$store.users[$store.tasks[id].assigneeId]` reads
  cleanly without boilerplate selectors.
- **`useStoreActions`** provides a clean imperative API (exported and works correctly).
- **API client** (`apiClient`, `configureApi`) is well-designed with interceptors,
  AbortController support, and proper error handling.
- **`useFetch` / `useMutation`** hooks are implemented and exported, though they require
  a real API endpoint (no mock/mock-mode support in the framework yet).
- **TypeScript with `skipLibCheck`** means the DTS build failure in `useFetch.ts` (a
  framework bug) doesn't block the playground.

---

## Summary Table

| Gap | Severity | Fix Effort |
|-----|----------|------------|
| No selective re-rendering | Critical | Medium (add selector param to useStore) |
| No delete trap on proxy | High | Low (add deleteProperty to ProxyHandler) |
| Array mutations corrupt/silent | High | Medium (array-aware setNestedValue) |
| No re-normalization on assignment | Medium | Low (call normalizeArray in setNestedValue) |
| No computed/derived state | Medium | Medium (depends on selectors being added) |
| No TypeScript inference | Medium | High (complex type gymnastics for normalized shape) |
| Double-nesting of objects | Low | Low (change restructureDataByDomains behavior) |
| No router | — | Planned |
| No forms | — | Planned |
| No batched writes | Low | Low (add store.batch(fn)) |
