import type { Project, Task, User, Label, Comment } from "../types";

export const seedProjects: Project[] = [
  {
    id: "proj-1",
    name: "Mobile App Redesign",
    description: "Complete redesign of the mobile application with new design system",
    color: "#4f46e5",
    createdAt: "2026-02-15",
  },
  {
    id: "proj-2",
    name: "API v2 Migration",
    description: "Migrate all endpoints to the new v2 API specification",
    color: "#059669",
    createdAt: "2026-03-01",
  },
];

export const seedUsers: User[] = [
  { id: "user-1", name: "Alice Chen", email: "alice@example.com", avatar: "AC" },
  { id: "user-2", name: "Bob Smith", email: "bob@example.com", avatar: "BS" },
  { id: "user-3", name: "Carol Davis", email: "carol@example.com", avatar: "CD" },
];

export const seedLabels: Label[] = [
  { id: "label-1", name: "bug", color: "#ef4444" },
  { id: "label-2", name: "feature", color: "#3b82f6" },
  { id: "label-3", name: "docs", color: "#8b5cf6" },
  { id: "label-4", name: "performance", color: "#f59e0b" },
  { id: "label-5", name: "design", color: "#ec4899" },
];

export const seedTasks: Task[] = [
  // Project 1 tasks
  {
    id: "task-1", projectId: "proj-1", title: "Design new navigation bar",
    description: "Create a new navigation component that supports nested menus and responsive breakpoints",
    status: "done", priority: "high", assigneeId: "user-1", labelIds: ["label-5", "label-2"],
    order: 0, createdAt: "2026-02-16", updatedAt: "2026-02-20",
  },
  {
    id: "task-2", projectId: "proj-1", title: "Implement dark mode toggle",
    description: "Add a theme switcher component with system preference detection",
    status: "in-progress", priority: "medium", assigneeId: "user-2", labelIds: ["label-2"],
    order: 1, createdAt: "2026-02-17", updatedAt: "2026-03-05",
  },
  {
    id: "task-3", projectId: "proj-1", title: "Fix iOS scroll bounce issue",
    description: "The list view has a rubber-banding issue on iOS Safari that causes visual glitches",
    status: "todo", priority: "high", assigneeId: "user-1", labelIds: ["label-1"],
    order: 2, createdAt: "2026-02-18", updatedAt: "2026-02-18",
  },
  {
    id: "task-4", projectId: "proj-1", title: "Add loading skeleton screens",
    description: "Replace spinners with skeleton placeholders for better perceived performance",
    status: "todo", priority: "low", assigneeId: null, labelIds: ["label-2", "label-4"],
    order: 3, createdAt: "2026-02-20", updatedAt: "2026-02-20",
  },
  {
    id: "task-5", projectId: "proj-1", title: "Redesign settings page",
    description: "Modernize the settings page with grouped sections and search functionality",
    status: "backlog", priority: "medium", assigneeId: "user-3", labelIds: ["label-5"],
    order: 4, createdAt: "2026-02-22", updatedAt: "2026-02-22",
  },
  {
    id: "task-6", projectId: "proj-1", title: "Add gesture-based navigation",
    description: "Implement swipe gestures for forward/back navigation on mobile",
    status: "backlog", priority: "low", assigneeId: null, labelIds: ["label-2"],
    order: 5, createdAt: "2026-02-25", updatedAt: "2026-02-25",
  },
  {
    id: "task-7", projectId: "proj-1", title: "Performance audit homepage",
    description: "Run Lighthouse and identify bottlenecks on the homepage load path",
    status: "in-progress", priority: "high", assigneeId: "user-3", labelIds: ["label-4"],
    order: 6, createdAt: "2026-03-01", updatedAt: "2026-03-08",
  },
  {
    id: "task-8", projectId: "proj-1", title: "Write component documentation",
    description: "Document all shared components with usage examples and prop tables",
    status: "backlog", priority: "low", assigneeId: null, labelIds: ["label-3"],
    order: 7, createdAt: "2026-03-02", updatedAt: "2026-03-02",
  },

  // Project 2 tasks
  {
    id: "task-9", projectId: "proj-2", title: "Define v2 API schema",
    description: "Create OpenAPI 3.1 spec for all v2 endpoints with proper typing",
    status: "done", priority: "urgent", assigneeId: "user-2", labelIds: ["label-3"],
    order: 0, createdAt: "2026-03-01", updatedAt: "2026-03-04",
  },
  {
    id: "task-10", projectId: "proj-2", title: "Migrate auth endpoints",
    description: "Move /auth/* endpoints to v2 with OAuth2 PKCE flow support",
    status: "in-progress", priority: "urgent", assigneeId: "user-1", labelIds: ["label-2"],
    order: 1, createdAt: "2026-03-02", updatedAt: "2026-03-09",
  },
  {
    id: "task-11", projectId: "proj-2", title: "Migrate user endpoints",
    description: "Move /users/* endpoints to v2 with pagination and field selection",
    status: "todo", priority: "high", assigneeId: "user-2", labelIds: ["label-2"],
    order: 2, createdAt: "2026-03-03", updatedAt: "2026-03-03",
  },
  {
    id: "task-12", projectId: "proj-2", title: "Add rate limiting",
    description: "Implement per-user and per-IP rate limiting with Redis sliding window",
    status: "todo", priority: "medium", assigneeId: null, labelIds: ["label-4", "label-2"],
    order: 3, createdAt: "2026-03-04", updatedAt: "2026-03-04",
  },
  {
    id: "task-13", projectId: "proj-2", title: "Write migration guide",
    description: "Create a step-by-step migration guide for API consumers moving from v1 to v2",
    status: "backlog", priority: "medium", assigneeId: "user-3", labelIds: ["label-3"],
    order: 4, createdAt: "2026-03-05", updatedAt: "2026-03-05",
  },
  {
    id: "task-14", projectId: "proj-2", title: "Fix N+1 query in /projects endpoint",
    description: "The projects listing endpoint makes a separate DB query per project member",
    status: "in-progress", priority: "high", assigneeId: "user-1", labelIds: ["label-1", "label-4"],
    order: 5, createdAt: "2026-03-06", updatedAt: "2026-03-10",
  },
  {
    id: "task-15", projectId: "proj-2", title: "Set up API monitoring dashboard",
    description: "Configure Grafana dashboards for v2 endpoint latency and error rates",
    status: "backlog", priority: "low", assigneeId: null, labelIds: ["label-4"],
    order: 6, createdAt: "2026-03-07", updatedAt: "2026-03-07",
  },
];

export const seedComments: Comment[] = [
  {
    id: "comment-1", taskId: "task-1", userId: "user-1",
    text: "Started with a few wireframe options. Will share by EOD.",
    createdAt: "2026-02-16T10:00:00Z",
  },
  {
    id: "comment-2", taskId: "task-1", userId: "user-2",
    text: "Option B looks great. Let's go with the collapsible sidebar approach.",
    createdAt: "2026-02-16T14:30:00Z",
  },
  {
    id: "comment-3", taskId: "task-2", userId: "user-2",
    text: "Using CSS custom properties for theming. Supports auto/light/dark.",
    createdAt: "2026-03-05T09:15:00Z",
  },
  {
    id: "comment-4", taskId: "task-7", userId: "user-3",
    text: "Lighthouse score is 62. Main issues: large JS bundle and render-blocking CSS.",
    createdAt: "2026-03-08T11:00:00Z",
  },
  {
    id: "comment-5", taskId: "task-7", userId: "user-1",
    text: "Can we try code splitting the chart library? It's 180kb uncompressed.",
    createdAt: "2026-03-08T11:45:00Z",
  },
  {
    id: "comment-6", taskId: "task-10", userId: "user-1",
    text: "PKCE flow is working. Need to test refresh token rotation next.",
    createdAt: "2026-03-09T16:00:00Z",
  },
  {
    id: "comment-7", taskId: "task-14", userId: "user-1",
    text: "Replaced with a single JOIN query. Response time dropped from 800ms to 45ms.",
    createdAt: "2026-03-10T09:30:00Z",
  },
  {
    id: "comment-8", taskId: "task-3", userId: "user-2",
    text: "This might be related to the overscroll-behavior CSS property. Worth testing.",
    createdAt: "2026-02-19T10:00:00Z",
  },
];

export const seedData = {
  // Primitives → "root" domain
  currentView: "board" as const,
  selectedProjectId: "proj-1",
  selectedTaskId: null as string | null,
  searchQuery: "",
  filterStatus: "all",
  filterAssignee: "all",
  filterLabel: "all",
  sidebarOpen: true,
  modalOpen: false,
  modalType: null as string | null,
  sortField: "order",
  sortDirection: "asc" as const,

  // Arrays of objects → normalized collections
  projects: seedProjects,
  tasks: seedTasks,
  users: seedUsers,
  labels: seedLabels,
  comments: seedComments,
};
