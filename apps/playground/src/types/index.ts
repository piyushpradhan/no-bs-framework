export type TaskStatus = "backlog" | "todo" | "in-progress" | "done";
export type TaskPriority = "low" | "medium" | "high" | "urgent";
export type ViewType = "board" | "list" | "detail";

export interface Project {
  id: string;
  name: string;
  description: string;
  color: string;
  createdAt: string;
}

export interface Task {
  id: string;
  projectId: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  assigneeId: string | null;
  labelIds: string[];
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
}

export interface Label {
  id: string;
  name: string;
  color: string;
}

export interface Comment {
  id: string;
  taskId: string;
  userId: string;
  text: string;
  createdAt: string;
}

// The store shape after normalization by createStore.
// Arrays of objects become Record<string, Entity>.
// Primitives go into a "root" domain.
// Nested objects get wrapped: { fieldName: value }.
export interface AppStore {
  root: {
    currentView: ViewType;
    selectedProjectId: string;
    selectedTaskId: string | null;
    searchQuery: string;
    filterStatus: string;
    filterAssignee: string;
    filterLabel: string;
    sidebarOpen: boolean;
    modalOpen: boolean;
    modalType: string | null;
    sortField: string;
    sortDirection: "asc" | "desc";
  };
  projects: Record<string, Project>;
  tasks: Record<string, Task>;
  users: Record<string, User>;
  labels: Record<string, Label>;
  comments: Record<string, Comment>;
}

export const STATUSES: { value: TaskStatus; label: string }[] = [
  { value: "backlog", label: "Backlog" },
  { value: "todo", label: "To Do" },
  { value: "in-progress", label: "In Progress" },
  { value: "done", label: "Done" },
];

export const PRIORITIES: { value: TaskPriority; label: string; icon: string }[] = [
  { value: "urgent", label: "Urgent", icon: "!!!" },
  { value: "high", label: "High", icon: "!!" },
  { value: "medium", label: "Medium", icon: "!" },
  { value: "low", label: "Low", icon: "-" },
];
