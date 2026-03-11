import { useRef } from "react";

/**
 * Displays the render count for the component it's placed in.
 *
 * FRAMEWORK GAP DEMONSTRATED:
 * Without selector support on useStore(), every state mutation re-renders ALL
 * components using useStore(). This counter will visually show that:
 *
 * - Typing one character in search → all components re-render
 * - Changing a single task's status → all components re-render
 * - Adding 100 tasks (via bulk-add workaround) → all components re-render ONCE
 * - Adding 100 tasks individually would re-render all components 100 times
 *
 * With useStore(selector) support, only components whose selected slice
 * changed would re-render. That's the fix needed.
 */
export function RenderCounter({ label }: { label: string }) {
  const countRef = useRef(0);
  countRef.current += 1;

  return (
    <span
      title={`${label} has rendered ${countRef.current} times`}
      style={{
        fontFamily: "monospace",
        fontSize: 9,
        color: countRef.current > 20 ? "var(--color-danger)" : "var(--color-text-muted)",
        padding: "1px 4px",
        background: "var(--color-bg-overlay)",
        borderRadius: 3,
        cursor: "default",
      }}
    >
      renders: {countRef.current}
    </span>
  );
}
