import { useStore } from "@no-bs-framework/state";
import type { AppStore, Task, Label, User } from "../../types";
import { Avatar } from "../shared/Avatar";
import { LabelBadge } from "../shared/Badge";
import { PriorityIndicator } from "../shared/Badge";

interface TaskCardProps {
  task: Task;
  onClick: () => void;
}

export function TaskCard({ task, onClick }: TaskCardProps) {
  const $store = useStore<AppStore>();

  // Cross-entity lookups: resolve assignee and labels from normalized store
  const assignee = task.assigneeId
    ? ($store.users[task.assigneeId] as User | undefined)
    : null;

  const taskLabels = task.labelIds
    .map((id) => $store.labels[id] as Label | undefined)
    .filter(Boolean) as Label[];

  return (
    <div className="task-card" onClick={onClick}>
      <div className="task-card-title">{task.title}</div>

      {taskLabels.length > 0 && (
        <div className="task-card-labels">
          {taskLabels.map((label) => (
            <LabelBadge key={label.id} name={label.name} color={label.color} />
          ))}
        </div>
      )}

      <div className="task-card-footer">
        <div className="task-card-meta">
          <PriorityIndicator priority={task.priority} />
          <span className="task-card-id">{task.id}</span>
        </div>
        {assignee && (
          <Avatar initials={assignee.avatar} size="sm" />
        )}
      </div>
    </div>
  );
}
