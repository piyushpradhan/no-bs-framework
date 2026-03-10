import { useStore } from "@no-bs-framework/state";
import type { AppStore, User, Label } from "../../types";
import { useRouter } from "../../hooks/useRouter";
import { STATUSES } from "../../types";

export function Header({ onNewTask }: { onNewTask: () => void }) {
  const $store = useStore<AppStore>();
  const { currentView, navigate } = useRouter();

  const users = Object.values($store.users) as User[];
  const labels = Object.values($store.labels) as Label[];

  return (
    <header className="header">
      <div className="header-search">
        <input
          type="text"
          placeholder="Search tasks..."
          value={$store.root.searchQuery}
          onChange={(e) => {
            $store.root.searchQuery = e.target.value;
          }}
        />
      </div>

      <div className="header-filters">
        <select
          value={$store.root.filterStatus}
          onChange={(e) => {
            $store.root.filterStatus = e.target.value;
          }}
        >
          <option value="all">All statuses</option>
          {STATUSES.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>

        <select
          value={$store.root.filterAssignee}
          onChange={(e) => {
            $store.root.filterAssignee = e.target.value;
          }}
        >
          <option value="all">All assignees</option>
          {users.map((u) => (
            <option key={u.id} value={u.id}>{u.name}</option>
          ))}
        </select>

        <select
          value={$store.root.filterLabel}
          onChange={(e) => {
            $store.root.filterLabel = e.target.value;
          }}
        >
          <option value="all">All labels</option>
          {labels.map((l) => (
            <option key={l.id} value={l.id}>{l.name}</option>
          ))}
        </select>
      </div>

      <div className="view-toggle">
        <button
          className={currentView === "board" ? "active" : ""}
          onClick={() => navigate("board")}
        >
          Board
        </button>
        <button
          className={currentView === "list" ? "active" : ""}
          onClick={() => navigate("list")}
        >
          List
        </button>
      </div>

      <div className="header-actions">
        <button className="btn btn-primary" onClick={onNewTask}>
          + New Task
        </button>
      </div>
    </header>
  );
}
