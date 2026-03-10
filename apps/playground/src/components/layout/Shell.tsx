import type { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";

interface ShellProps {
  children: ReactNode;
  onNewTask: () => void;
}

export function Shell({ children, onNewTask }: ShellProps) {
  return (
    <div className="app-shell">
      <Sidebar />
      <div className="main-area">
        <Header onNewTask={onNewTask} />
        {children}
      </div>
    </div>
  );
}
