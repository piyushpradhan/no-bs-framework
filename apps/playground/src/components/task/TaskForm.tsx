import { useState } from "react";
import { useStore } from "@no-bs-framework/state";
import type { AppStore, User, Label, TaskStatus, TaskPriority } from "../../types";
import { STATUSES, PRIORITIES } from "../../types";
import { Modal } from "../shared/Modal";
import { createTask } from "../../store/actions";

interface TaskFormProps {
  onClose: () => void;
}

export function TaskForm({ onClose }: TaskFormProps) {
  const $store = useStore<AppStore>();

  // FRAMEWORK GAP: No form abstractions. Must use manual useState for every field.
  // With @no-bs-framework/forms this would be: const form = useForm(taskSchema)
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<TaskStatus>("todo");
  const [priority, setPriority] = useState<TaskPriority>("medium");
  const [assigneeId, setAssigneeId] = useState("");
  const [selectedLabels, setSelectedLabels] = useState<string[]>([]);

  const users = Object.values($store.users) as User[];
  const labels = Object.values($store.labels) as Label[];

  const handleSubmit = () => {
    if (!title.trim()) return;

    createTask($store, {
      projectId: $store.root.selectedProjectId,
      title: title.trim(),
      description: description.trim(),
      status,
      priority,
      assigneeId: assigneeId || null,
      labelIds: selectedLabels,
    });

    onClose();
  };

  const handleLabelToggle = (labelId: string) => {
    setSelectedLabels((prev) =>
      prev.includes(labelId)
        ? prev.filter((id) => id !== labelId)
        : [...prev, labelId]
    );
  };

  return (
    <Modal
      title="New Task"
      onClose={onClose}
      footer={
        <>
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSubmit} disabled={!title.trim()}>
            Create Task
          </button>
        </>
      }
    >
      <div className="field">
        <label>Title</label>
        <input
          autoFocus
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="What needs to be done?"
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
        />
      </div>

      <div className="field">
        <label>Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Add details..."
          rows={3}
        />
      </div>

      <div style={{ display: "flex", gap: 12 }}>
        <div className="field" style={{ flex: 1 }}>
          <label>Status</label>
          <select value={status} onChange={(e) => setStatus(e.target.value as TaskStatus)}>
            {STATUSES.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>

        <div className="field" style={{ flex: 1 }}>
          <label>Priority</label>
          <select value={priority} onChange={(e) => setPriority(e.target.value as TaskPriority)}>
            {PRIORITIES.map((p) => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="field">
        <label>Assignee</label>
        <select value={assigneeId} onChange={(e) => setAssigneeId(e.target.value)}>
          <option value="">Unassigned</option>
          {users.map((u) => (
            <option key={u.id} value={u.id}>{u.name}</option>
          ))}
        </select>
      </div>

      <div className="field">
        <label>Labels</label>
        <div className="label-picker">
          {labels.map((label) => (
            <span
              key={label.id}
              className={`label-picker-item${selectedLabels.includes(label.id) ? " selected" : ""}`}
              style={{ color: label.color, background: label.color + "15" }}
              onClick={() => handleLabelToggle(label.id)}
            >
              {label.name}
            </span>
          ))}
        </div>
      </div>
    </Modal>
  );
}
