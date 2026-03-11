import { useState } from "react";
import { useStore } from "@no-bs-framework/state";
import type { AppStore } from "../../types";
import { addStressTasks, bulkChangeStatus, clearStressTasks } from "../../store/actions";

export function StressTestPanel() {
  const [open, setOpen] = useState(false);
  const [count, setCount] = useState(100);
  const $store = useStore<AppStore>();

  const taskCount = Object.keys($store.tasks).length;
  const stressCount = Object.keys($store.tasks).filter((id) => id.startsWith("stress-")).length;

  if (!open) {
    return (
      <button
        className="btn btn-ghost btn-sm"
        onClick={() => setOpen(true)}
        style={{ fontFamily: "monospace", fontSize: 11, color: "var(--color-warning)" }}
      >
        stress
      </button>
    );
  }

  return (
    <div
      style={{
        position: "fixed",
        top: "var(--header-height)",
        right: 0,
        width: 320,
        background: "var(--color-bg-raised)",
        border: "1px solid var(--color-border)",
        borderRadius: "0 0 0 var(--radius-lg)",
        zIndex: 200,
        padding: 16,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
        <span style={{ fontFamily: "monospace", fontSize: 12, color: "var(--color-warning)" }}>
          Stress Test
        </span>
        <button className="btn-icon" onClick={() => setOpen(false)}>×</button>
      </div>

      <div
        style={{
          fontSize: 12,
          color: "var(--color-text-secondary)",
          marginBottom: 12,
          fontFamily: "monospace",
        }}
      >
        <div>Total tasks: <span style={{ color: "var(--color-text)" }}>{taskCount}</span></div>
        <div>Stress tasks: <span style={{ color: "var(--color-warning)" }}>{stressCount}</span></div>
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
        <input
          type="number"
          value={count}
          min={10}
          max={500}
          step={10}
          onChange={(e) => setCount(Number(e.target.value))}
          style={{
            width: 70,
            padding: "4px 8px",
            background: "var(--color-bg-overlay)",
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-md)",
            color: "var(--color-text)",
            fontSize: 12,
            fontFamily: "monospace",
          }}
        />
        <button
          className="btn btn-sm"
          style={{ background: "var(--color-warning)", color: "#000", fontFamily: "monospace" }}
          onClick={() => addStressTasks($store, count)}
        >
          + Add {count} tasks
        </button>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <button
          className="btn btn-ghost btn-sm"
          onClick={() => bulkChangeStatus($store, $store.root.selectedProjectId, "done")}
          style={{ fontFamily: "monospace", fontSize: 11 }}
        >
          Mark all done (current project)
        </button>
        <button
          className="btn btn-ghost btn-sm"
          onClick={() => bulkChangeStatus($store, $store.root.selectedProjectId, "todo")}
          style={{ fontFamily: "monospace", fontSize: 11 }}
        >
          Reset all to todo
        </button>
        {stressCount > 0 && (
          <button
            className="btn btn-danger btn-sm"
            onClick={() => clearStressTasks($store)}
            style={{ fontFamily: "monospace", fontSize: 11 }}
          >
            Clear stress tasks ({stressCount})
          </button>
        )}
      </div>

      <div
        style={{
          marginTop: 12,
          padding: 8,
          background: "var(--color-bg-overlay)",
          borderRadius: "var(--radius-md)",
          fontSize: 10,
          fontFamily: "monospace",
          color: "var(--color-text-muted)",
          lineHeight: 1.5,
        }}
      >
        <strong style={{ color: "var(--color-warning)" }}>Gap exposed:</strong> No batched
        mutations in the store. Adding tasks individually would fire N state updates;
        this workaround rebuilds the tasks object first (single update).
      </div>
    </div>
  );
}
