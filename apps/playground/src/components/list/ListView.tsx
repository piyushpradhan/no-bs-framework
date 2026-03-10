import { useStore } from "@no-bs-framework/state";
import type { AppStore, User } from "../../types";
import { useFilteredTasks } from "../../hooks/useFilteredTasks";
import { StatusBadge, PriorityIndicator } from "../shared/Badge";
import { Avatar } from "../shared/Avatar";
import { EmptyState } from "../shared/EmptyState";

interface ListViewProps {
  onTaskClick: (taskId: string) => void;
}

type SortField = "title" | "status" | "priority" | "assigneeId" | "updatedAt";

export function ListView({ onTaskClick }: ListViewProps) {
  const $store = useStore<AppStore>();
  const tasks = useFilteredTasks();

  const sortField = $store.root.sortField;
  const sortDir = $store.root.sortDirection;

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      $store.root.sortDirection = sortDir === "asc" ? "desc" : "asc";
    } else {
      $store.root.sortField = field;
      $store.root.sortDirection = "asc";
    }
  };

  const sortIndicator = (field: string) =>
    sortField === field ? (sortDir === "asc" ? " ^" : " v") : "";

  if (tasks.length === 0) {
    return (
      <div className="list-view">
        <EmptyState title="No tasks found" text="Try adjusting your filters" />
      </div>
    );
  }

  return (
    <div className="list-view">
      <table className="task-table">
        <thead>
          <tr>
            <th className={sortField === "title" ? "sorted" : ""} onClick={() => toggleSort("title")}>
              Title{sortIndicator("title")}
            </th>
            <th className={sortField === "status" ? "sorted" : ""} onClick={() => toggleSort("status")}>
              Status{sortIndicator("status")}
            </th>
            <th className={sortField === "priority" ? "sorted" : ""} onClick={() => toggleSort("priority")}>
              Priority{sortIndicator("priority")}
            </th>
            <th className={sortField === "assigneeId" ? "sorted" : ""} onClick={() => toggleSort("assigneeId")}>
              Assignee{sortIndicator("assigneeId")}
            </th>
            <th className={sortField === "updatedAt" ? "sorted" : ""} onClick={() => toggleSort("updatedAt")}>
              Updated{sortIndicator("updatedAt")}
            </th>
          </tr>
        </thead>
        <tbody>
          {tasks.map((task) => {
            const assignee = task.assigneeId
              ? ($store.users[task.assigneeId] as User | undefined)
              : null;
            return (
              <tr key={task.id} className="task-row" onClick={() => onTaskClick(task.id)}>
                <td>{task.title}</td>
                <td><StatusBadge status={task.status} /></td>
                <td><PriorityIndicator priority={task.priority} /></td>
                <td>
                  {assignee ? (
                    <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <Avatar initials={assignee.avatar} size="sm" />
                      {assignee.name}
                    </span>
                  ) : (
                    <span style={{ color: "var(--color-text-muted)" }}>Unassigned</span>
                  )}
                </td>
                <td style={{ color: "var(--color-text-secondary)" }}>{task.updatedAt}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
