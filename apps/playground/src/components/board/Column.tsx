import type { Task, TaskStatus } from "../../types";
import { STATUSES } from "../../types";
import { TaskCard } from "./TaskCard";
import { EmptyState } from "../shared/EmptyState";
import { RenderCounter } from "../shared/RenderCounter";

interface ColumnProps {
  status: TaskStatus;
  tasks: Task[];
  onTaskClick: (taskId: string) => void;
}

export function Column({ status, tasks, onTaskClick }: ColumnProps) {
  const label = STATUSES.find((s) => s.value === status)?.label ?? status;

  return (
    <div className="board-column">
      <div className="column-header">
        <span className="column-title">
          {label}
          <span className="column-count">{tasks.length}</span>
        </span>
        <RenderCounter label={`${label} column`} />
      </div>

      <div className="column-cards">
        {tasks.length === 0 ? (
          <EmptyState title="No tasks" text="Drop tasks here" />
        ) : (
          tasks
            .sort((a, b) => a.order - b.order)
            .map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onClick={() => onTaskClick(task.id)}
              />
            ))
        )}
      </div>
    </div>
  );
}
