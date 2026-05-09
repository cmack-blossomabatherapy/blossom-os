import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export function PushNavigationListener() {
  const navigate = useNavigate();
  useEffect(() => {
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;
    const handler = (event: MessageEvent) => {
      if (event.data?.type === "PUSH_NAVIGATE" && typeof event.data.url === "string") {
        try { navigate(event.data.url); } catch (_e) {}
      }
    };
    navigator.serviceWorker.addEventListener("message", handler);
    return () => navigator.serviceWorker.removeEventListener("message", handler);
  }, [navigate]);
  return null;
}