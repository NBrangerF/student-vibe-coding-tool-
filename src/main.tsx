import React from "react";
import ReactDOM from "react-dom/client";
import { BuildCompanionWorkspace } from "@/components/build-companion-workspace";
import "@/app/globals.css";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <BuildCompanionWorkspace />
  </React.StrictMode>
);
