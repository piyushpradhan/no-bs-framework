import type { TaskStatus, TaskPriority } from "../../types";
import { STATUSES, PRIORITIES } from "../../types";

export function StatusBadge({ status }: { status: TaskStatus }) {
  const label = STATUSES.find((s) => s.value === status)?.label ?? status;

  return (
    <span className={`status-badge status-${status}`}>
      <span className="status-dot" />
      {label}
    </span>
  );
}

export function PriorityIndicator({ priority }: { priority: TaskPriority }) {
  const info = PRIORITIES.find((p) => p.value === priority);

  return (
    <span className={`priority-indicator priority-${priority}`} title={info?.label}>
      {info?.icon ?? "-"}
    </span>
  );
}

export function LabelBadge({ name, color }: { name: string; color: string }) {
  return (
    <span
      className="label-badge"
      style={{
        color,
        borderColor: color + "40",
        background: color + "15",
      }}
    >
      {name}
    </span>
  );
}
