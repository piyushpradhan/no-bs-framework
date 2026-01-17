# @no-bs-framework/state

A lightweight, TypeScript-first React state management library with automatic data normalization and pluggable persistence.

## Features

- **📝 Schema-First Design** - Define your data model once, get full type inference everywhere
- **🔄 Automatic Normalization** - Nested data structures automatically flattened for efficient storage
- **💾 Pluggable Storage** - localStorage, memory, or custom adapters (IndexedDB, AsyncStorage, etc.)
- **⚡ Performance Optimized** - Batching, debouncing, and smart caching built-in
- **🎯 Selective Subscriptions** - Components only re-render when relevant data changes
- **✨ Optimistic Updates** - Built-in support with automatic rollback
- **🪝 Auto-generated Hooks** - Type-safe React hooks generated from your schema
- **🌲 Tree-shakeable** - Import only what you need
- **0️⃣ Zero Dependencies** - Except React

## Installation

```bash
npm install @no-bs-framework/state
# or
pnpm add @no-bs-framework/state
```

## Quick Start

### 1. Define Your Schema

```typescript
import { defineSchema, field, collection, singleton } from '@no-bs-framework/state';

const schema = defineSchema({
  // Singleton - only one instance
  appSettings: singleton({
    theme: field.string(),
    sidebarOpen: field.boolean(),
  }),

  // Collection - multiple instances
  users: collection({
    id: field.string(),
    name: field.string(),
    email: field.string(),
  }),

  // Collection with relationships
  posts: collection({
    id: field.string(),
    title: field.string(),
    author: field.belongsTo('users', 'authorId'),
    comments: field.hasMany('comments'),
  }),

  comments: collection({
    id: field.string(),
    text: field.string(),
    postId: field.string(),
  }),
});

type AppSchema = typeof schema;
```

### 2. Create Store

```typescript
import { createStore } from '@no-bs-framework/state';

const store = createStore(schema, {
  // Optional configuration
  cache: { maxSize: 1000 },
  batch: { debounceMs: 100 },
});
```

### 3. Use in React

```typescript
import { StoreProvider, useEntity, useEntities } from '@no-bs-framework/state';

function App() {
  return (
    <StoreProvider store={store}>
      <SettingsPanel />
      <UsersList />
    </StoreProvider>
  );
}

function SettingsPanel() {
  const { data: settings, set } = useEntity<AppSchema, 'appSettings'>('appSettings');

  return (
    <div>
      <label>
        <input
          type="checkbox"
          checked={settings?.theme === 'dark'}
          onChange={(e) => set({ theme: e.target.checked ? 'dark' : 'light' })}
        />
        Dark Mode
      </label>
    </div>
  );
}

function UsersList() {
  const { data: users, add, remove } = useEntities<AppSchema, 'users'>('users');

  return (
    <ul>
      {users.map(user => (
        <li key={user.id}>
          {user.name}
          <button onClick={() => remove(user.id)}>Delete</button>
        </li>
      ))}
    </ul>
  );
}
```

## Core Concepts

### Schema Definition

Define entities as either **singletons** (one instance) or **collections** (multiple instances):

```typescript
const schema = defineSchema({
  // Singleton
  config: singleton({
    apiUrl: field.string(),
    timeout: field.number(),
  }),

  // Collection with timestamps
  todos: collection(
    {
      id: field.string(),
      text: field.string(),
      completed: field.boolean(),
    },
    {
      timestamps: {
        createdAt: 'createdAt',
        updatedAt: 'updatedAt',
      },
    }
  ),
});
```

### Field Types

- `field.string(optional?)` - String values
- `field.number(optional?)` - Numeric values
- `field.boolean(optional?)` - Boolean values
- `field.date(optional?)` - Date objects
- `field.json(optional?)` - Any JSON-serializable value
- `field.array(optional?)` - Array values
- `field.belongsTo(entity, foreignKey?)` - One-to-one/many-to-one relationship
- `field.hasMany(entity)` - One-to-many relationship

### Data Normalization

The library automatically normalizes nested data:

```typescript
// You write:
store.set('posts', {
  id: '1',
  title: 'Hello',
  author: { id: 'user-1', name: 'Alice' },
  comments: [
    { id: 'c1', text: 'Nice!' }
  ]
});

// Stored as:
// 'posts:1' -> { id: '1', title: 'Hello', authorId: 'user-1', commentIds: ['c1'] }
// 'users:user-1' -> { id: 'user-1', name: 'Alice' }
// 'comments:c1' -> { id: 'c1', text: 'Nice!' }

// When reading, automatically denormalized back to nested structure
const post = store.get('posts', '1');
// { id: '1', title: 'Hello', author: { ... }, comments: [ ... ] }
```

### React Hooks

#### useEntity

Read/write a single entity:

```typescript
const { data, loading, error, set, delete: del, refresh } =
  useEntity<AppSchema, 'users'>('users', userId);

// Update
set({ name: 'New Name' });

// Delete
del();

// Force refresh
refresh();
```

#### useEntities

Read/write all entities of a type:

```typescript
const { data, loading, error, add, update, remove } =
  useEntities<AppSchema, 'posts'>('posts', {
    // Optional filters
    filter: (post) => post.published,
    sort: (a, b) => a.title.localeCompare(b.title),
  });

// Add new
add({ id: '2', title: 'New Post', published: true });

// Update existing
update('1', { title: 'Updated Title' });

// Remove
remove('1');
```

#### useOptimistic

Optimistic updates with automatic rollback:

```typescript
const { state, update } = useOptimistic<AppSchema, 'posts'>('posts');

await update(
  postId,
  { published: true }, // Optimistic update - applied immediately
  async () => {
    // Async operation (API call)
    await api.publishPost(postId);
    return { published: true };
  },
  {
    onSuccess: () => console.log('Published!'),
    onError: (error) => console.error('Failed, rolled back'),
  }
);
```

## Storage Adapters

### Built-in Adapters

```typescript
import {
  createLocalStorageAdapter,
  createMemoryStorageAdapter
} from '@no-bs-framework/state';

// localStorage (default)
const store = createStore(schema, {
  storage: createLocalStorageAdapter({
    namespace: 'myapp',
    maxValueSize: 5 * 1024 * 1024, // 5MB
  }),
});

// In-memory (for tests)
const testStore = createStore(schema, {
  storage: createMemoryStorageAdapter(),
});
```

### Custom Adapters

Implement the `StorageAdapter` interface:

```typescript
import { StorageAdapter } from '@no-bs-framework/state';

class CustomAdapter implements StorageAdapter {
  get<T>(key: string): T | null { /* ... */ }
  set<T>(key: string, value: T): void { /* ... */ }
  delete(key: string): void { /* ... */ }
  list(prefix?: string): string[] { /* ... */ }
  clear(): void { /* ... */ }
  size(): number { /* ... */ }
}

const store = createStore(schema, {
  storage: new CustomAdapter(),
});
```

## Performance Optimizations

### Batching

Multiple writes are automatically batched:

```typescript
// These are batched into a single storage operation
store.set('users', { id: '1', name: 'Alice' });
store.set('users', { id: '2', name: 'Bob' });
store.set('posts', { id: '1', title: 'Hello' });
```

### Debouncing

Writes are debounced to reduce storage thrashing:

```typescript
const store = createStore(schema, {
  batch: {
    debounceMs: 100, // Wait 100ms before flushing
    maxBatchSize: 50, // Force flush after 50 operations
  },
});
```

### Caching

In-memory cache reduces storage reads:

```typescript
const store = createStore(schema, {
  cache: {
    maxSize: 1000, // Max 1000 entries
    ttl: 5 * 60 * 1000, // 5 minute TTL
  },
});
```

## API Reference

See [example.tsx](./example.tsx) for comprehensive usage examples.

## License

MIT
