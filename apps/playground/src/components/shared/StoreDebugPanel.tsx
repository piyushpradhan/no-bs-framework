import { useState } from "react";
import { useStore } from "@no-bs-framework/state";
import type { AppStore } from "../../types";

/**
 * Shows the raw normalized store structure.
 * This directly exposes how the framework stores data after normalization.
 *
 * Key things to observe:
 * - Arrays of objects → flat Record<id, entity>
 * - Primitives → grouped into "root" domain
 * - The domain structure inferred automatically
 */
export function StoreDebugPanel() {
  const [open, setOpen] = useState(false);
  const $store = useStore<AppStore>();

  if (!open) {
    return (
      <button
        className="btn btn-ghost btn-sm"
        onClick={() => setOpen(true)}
        style={{ fontFamily: "monospace", fontSize: 11 }}
      >
        [debug]
      </button>
    );
  }

  // Serialize the store safely (proxy-aware)
  const snapshot = JSON.parse(JSON.stringify($store));
  const taskCount = Object.keys(snapshot.tasks ?? {}).length;
  const commentCount = Object.keys(snapshot.comments ?? {}).length;

  return (
    <div
      style={{
        position: "fixed",
        bottom: 0,
        right: 0,
        width: 480,
        maxHeight: "60vh",
        background: "var(--color-bg-raised)",
        border: "1px solid var(--color-border)",
        borderRadius: "var(--radius-lg) 0 0 0",
        zIndex: 200,
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "8px 12px",
          borderBottom: "1px solid var(--color-border)",
          fontFamily: "monospace",
          fontSize: 12,
        }}
      >
        <span style={{ color: "var(--color-accent)" }}>
          Store State ({taskCount} tasks, {commentCount} comments)
        </span>
        <button className="btn-icon" onClick={() => setOpen(false)}>×</button>
      </div>
      <pre
        style={{
          padding: 12,
          overflow: "auto",
          fontSize: 11,
          fontFamily: "monospace",
          color: "var(--color-text-secondary)",
          flex: 1,
          margin: 0,
        }}
      >
        {JSON.stringify(snapshot, null, 2)}
      </pre>
    </div>
  );
}
