import { useStore } from "@no-bs-framework/state";
import type { AppStore, Project } from "../../types";
import { useRouter } from "../../hooks/useRouter";

export function Sidebar() {
  const $store = useStore<AppStore>();
  const { navigate, currentView } = useRouter();

  const projects = Object.values($store.projects) as Project[];
  const selectedProjectId = $store.root.selectedProjectId;

  const selectProject = (projectId: string) => {
    $store.root.selectedProjectId = projectId;
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h1>TaskFlow</h1>
      </div>

      <div className="sidebar-section">
        <div className="sidebar-section-title">Projects</div>
        {projects.map((project) => (
          <button
            key={project.id}
            className={`sidebar-item${project.id === selectedProjectId ? " active" : ""}`}
            onClick={() => selectProject(project.id)}
          >
            <span className="project-dot" style={{ background: project.color }} />
            {project.name}
          </button>
        ))}
      </div>

      <nav className="sidebar-nav">
        <button
          className={`sidebar-item${currentView === "board" ? " active" : ""}`}
          onClick={() => navigate("board")}
        >
          Board
        </button>
        <button
          className={`sidebar-item${currentView === "list" ? " active" : ""}`}
          onClick={() => navigate("list")}
        >
          List
        </button>
      </nav>
    </aside>
  );
}
