import { useState } from "react";
import { useStore } from "@no-bs-framework/state";
import type { AppStore, Task, User, Label, Comment } from "../../types";
import { STATUSES, PRIORITIES } from "../../types";
import { Avatar } from "../shared/Avatar";
import { CommentList } from "./CommentList";
import { CommentForm } from "./CommentForm";
import { updateTask, deleteTask, toggleLabel, setAssignee } from "../../store/actions";

interface TaskDetailViewProps {
  taskId: string;
  onBack: () => void;
}

export function TaskDetailView({ taskId, onBack }: TaskDetailViewProps) {
  const $store = useStore<AppStore>();
  const task = $store.tasks[taskId] as Task | undefined;

  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState("");
  const [editingDesc, setEditingDesc] = useState(false);
  const [descDraft, setDescDraft] = useState("");

  if (!task) {
    return (
      <div className="detail-view">
        <button className="btn btn-ghost detail-back" onClick={onBack}>
          &larr; Back
        </button>
        <div className="empty-state">
          <div className="empty-state-title">Task not found</div>
        </div>
      </div>
    );
  }

  const assignee = task.assigneeId
    ? ($store.users[task.assigneeId] as User | undefined)
    : null;
  const allUsers = Object.values($store.users) as User[];
  const allLabels = Object.values($store.labels) as Label[];
  // Get comments for this task
  const comments = (Object.values($store.comments) as Comment[])
    .filter((c) => c.taskId === taskId)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));

  const startEditTitle = () => {
    setTitleDraft(task.title);
    setEditingTitle(true);
  };

  const saveTitle = () => {
    if (titleDraft.trim()) {
      updateTask($store, taskId, { title: titleDraft.trim() });
    }
    setEditingTitle(false);
  };

  const startEditDesc = () => {
    setDescDraft(task.description);
    setEditingDesc(true);
  };

  const saveDesc = () => {
    updateTask($store, taskId, { description: descDraft });
    setEditingDesc(false);
  };

  const handleDelete = () => {
    if (confirm("Delete this task?")) {
      deleteTask($store, taskId);
      onBack();
    }
  };

  return (
    <div className="detail-view">
      <button className="btn btn-ghost btn-sm detail-back" onClick={onBack}>
        &larr; Back
      </button>

      <div className="detail-header">
        <div className="detail-title">
          {editingTitle ? (
            <input
              autoFocus
              value={titleDraft}
              onChange={(e) => setTitleDraft(e.target.value)}
              onBlur={saveTitle}
              onKeyDown={(e) => e.key === "Enter" && saveTitle()}
            />
          ) : (
            <span onClick={startEditTitle} style={{ cursor: "pointer" }}>
              {task.title}
            </span>
          )}
        </div>

        <div className="detail-description">
          {editingDesc ? (
            <textarea
              autoFocus
              value={descDraft}
              onChange={(e) => setDescDraft(e.target.value)}
              onBlur={saveDesc}
            />
          ) : (
            <p onClick={startEditDesc} style={{ cursor: "pointer" }}>
              {task.description || "Add a description..."}
            </p>
          )}
        </div>
      </div>

      <div className="detail-meta">
        <span className="detail-meta-label">Status</span>
        <span className="detail-meta-value">
          <select
            value={task.status}
            onChange={(e) =>
              updateTask($store, taskId, { status: e.target.value as Task["status"] })
            }
          >
            {STATUSES.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </span>

        <span className="detail-meta-label">Priority</span>
        <span className="detail-meta-value">
          <select
            value={task.priority}
            onChange={(e) =>
              updateTask($store, taskId, { priority: e.target.value as Task["priority"] })
            }
          >
            {PRIORITIES.map((p) => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </select>
        </span>

        <span className="detail-meta-label">Assignee</span>
        <span className="detail-meta-value">
          <select
            value={task.assigneeId || ""}
            onChange={(e) => setAssignee($store, taskId, e.target.value || null)}
          >
            <option value="">Unassigned</option>
            {allUsers.map((u) => (
              <option key={u.id} value={u.id}>{u.name}</option>
            ))}
          </select>
          {assignee && <Avatar initials={assignee.avatar} size="sm" />}
        </span>

        <span className="detail-meta-label">Labels</span>
        <span className="detail-meta-value">
          <div className="label-picker">
            {allLabels.map((label) => {
              const selected = task.labelIds.includes(label.id);
              return (
                <span
                  key={label.id}
                  className={`label-picker-item${selected ? " selected" : ""}`}
                  style={{ color: label.color, background: label.color + "15" }}
                  onClick={() => toggleLabel($store, taskId, label.id)}
                >
                  {label.name}
                </span>
              );
            })}
          </div>
        </span>

        <span className="detail-meta-label">Created</span>
        <span className="detail-meta-value" style={{ color: "var(--color-text-secondary)" }}>
          {task.createdAt}
        </span>

        <span className="detail-meta-label">Updated</span>
        <span className="detail-meta-value" style={{ color: "var(--color-text-secondary)" }}>
          {task.updatedAt}
        </span>
      </div>

      <div className="detail-actions">
        <button className="btn btn-danger btn-sm" onClick={handleDelete}>
          Delete Task
        </button>
      </div>

      <div className="comments-section">
        <h4 className="comments-title">Comments ({comments.length})</h4>
        <CommentList comments={comments} />
        <CommentForm taskId={taskId} />
      </div>
    </div>
  );
}
