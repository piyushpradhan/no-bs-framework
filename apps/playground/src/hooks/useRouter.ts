import { useEffect } from "react";
import { useStore } from "@no-bs-framework/state";
import type { AppStore, ViewType } from "../types";

const VALID_VIEWS: ViewType[] = ["board", "list", "detail"];

export function useRouter() {
  const $store = useStore<AppStore>();

  // Sync hash → store on mount and hashchange
  useEffect(() => {
    const sync = () => {
      const hash = window.location.hash.slice(1) || "board";
      const view = VALID_VIEWS.includes(hash as ViewType) ? hash : "board";
      $store.root.currentView = view as ViewType;
    };

    window.addEventListener("hashchange", sync);
    sync();
    return () => window.removeEventListener("hashchange", sync);
  }, []);

  const navigate = (view: ViewType, taskId?: string) => {
    if (view === "detail" && taskId) {
      $store.root.selectedTaskId = taskId;
    }
    window.location.hash = view;
  };

  return {
    currentView: $store.root.currentView,
    navigate,
  };
}
