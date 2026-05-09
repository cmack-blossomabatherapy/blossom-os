import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { sanitizeDeepLink } from "@/lib/push/sanitizeDeepLink";

export function PushNavigationListener() {
  const navigate = useNavigate();
  useEffect(() => {
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;
    const handler = (event: MessageEvent) => {
      if (event.data?.type !== "PUSH_NAVIGATE") return;
      const safe = sanitizeDeepLink(event.data.url, event.data.category);
      const alertId = typeof event.data.alertId === "string" ? event.data.alertId : null;
      try { navigate(safe); } catch (_e) {}
      if (alertId) {
        // Best-effort: mark the alert as read for the current user.
        supabase.auth.getUser().then(({ data }) => {
          const uid = data.user?.id;
          if (!uid) return;
          supabase
            .from("alert_reads")
            .upsert(
              [{ user_id: uid, alert_id: alertId }],
              { onConflict: "user_id,alert_id", ignoreDuplicates: true },
            )
            .then(() => {});
        });
      }
    };
    navigator.serviceWorker.addEventListener("message", handler);
    return () => navigator.serviceWorker.removeEventListener("message", handler);
  }, [navigate]);
  return null;
}