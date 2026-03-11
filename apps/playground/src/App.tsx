import { useState } from "react";
import { useStore } from "@no-bs-framework/state";
import type { AppStore } from "./types";
import { useRouter } from "./hooks/useRouter";
import { Shell } from "./components/layout/Shell";
import { BoardView } from "./components/board/BoardView";
import { ListView } from "./components/list/ListView";
import { TaskDetailView } from "./components/task/TaskDetailView";
import { TaskForm } from "./components/task/TaskForm";
import { StoreDebugPanel } from "./components/shared/StoreDebugPanel";
import { StressTestPanel } from "./components/shared/StressTestPanel";

function App() {
  const $store = useStore<AppStore>();
  const { currentView, navigate } = useRouter();
  const [showNewTask, setShowNewTask] = useState(false);

  const handleTaskClick = (taskId: string) => {
    $store.root.selectedTaskId = taskId;
    navigate("detail");
  };

  const handleBack = () => {
    // Go back to whichever view was active before detail
    navigate("board");
  };

  return (
    <Shell onNewTask={() => setShowNewTask(true)}>
      {currentView === "board" && <BoardView onTaskClick={handleTaskClick} />}
      {currentView === "list" && <ListView onTaskClick={handleTaskClick} />}
      {currentView === "detail" && $store.root.selectedTaskId && (
        <TaskDetailView taskId={$store.root.selectedTaskId} onBack={handleBack} />
      )}

      {showNewTask && <TaskForm onClose={() => setShowNewTask(false)} />}

      <StressTestPanel />
      <StoreDebugPanel />
    </Shell>
  );
}

export default App;
