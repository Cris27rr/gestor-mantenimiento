import { createRoot } from "react-dom/client";

import App from "./App.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(<App />);

// ── PWA Service Worker with forced update ───────────────────────────
// Detects when a new SW version is installed and forces immediate
// activation + page reload so the user always sees the latest version.
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js", { scope: "/" })
      .then((reg) => {
        // Check for updates every 30 seconds
        setInterval(() => reg.update().catch(() => {}), 30_000);

        reg.addEventListener("updatefound", () => {
          const newWorker = reg.installing;
          if (!newWorker) return;
          newWorker.addEventListener("statechange", () => {
            if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
              // New version installed — force reload to pick it up
              console.info("[SW] Nueva versión disponible, recargando...");
              newWorker.postMessage?.({ type: "SKIP_WAITING" });
              navigator.serviceWorker.addEventListener("controllerchange", () => {
                window.location.reload();
              }, { once: true });
            }
          });
        });
      })
      .catch((err) => console.warn("[SW] Registro fallido:", err));

    // If no controller yet (first load), and a new SW takes control, reload
    if (!navigator.serviceWorker.controller) {
      navigator.serviceWorker.addEventListener("controllerchange", () => {
        window.location.reload();
      }, { once: true });
    }
  });
}
