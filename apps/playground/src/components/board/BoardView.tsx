import type { TaskStatus, Task } from "../../types";
import { STATUSES } from "../../types";
import { Column } from "./Column";
import { useFilteredTasks } from "../../hooks/useFilteredTasks";

interface BoardViewProps {
  onTaskClick: (taskId: string) => void;
}

export function BoardView({ onTaskClick }: BoardViewProps) {
  const tasks = useFilteredTasks();

  // Group tasks by status
  // FRAMEWORK GAP: No computed/derived state. This groups on every render.
  // With no selector support in useStore(), every state mutation triggers
  // this grouping to recompute even if the tasks haven't changed.
  const grouped: Record<TaskStatus, Task[]> = {
    backlog: [],
    todo: [],
    "in-progress": [],
    done: [],
  };

  for (const task of tasks) {
    grouped[task.status].push(task);
  }

  return (
    <div className="board-view">
      {STATUSES.map((s) => (
        <Column
          key={s.value}
          status={s.value}
          tasks={grouped[s.value]}
          onTaskClick={onTaskClick}
        />
      ))}
    </div>
  );
}
