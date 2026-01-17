import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { StoreProvider } from "@no-bs-framework/state";

import "./index.css";
import App from "./App.tsx";

import store from "./store/index.ts";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <StoreProvider store={store}>
      <App />
    </StoreProvider>
  </StrictMode>,
);
