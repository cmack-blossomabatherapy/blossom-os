import { supabase } from "@/integrations/supabase/client";

/**
 * Record a "dismissed" audit event for a critical alert.
 * Lifecycle events (generated/pushed/acknowledged/resolved) are written
 * automatically by a database trigger; only dismissals are user-initiated
 * outside of a status change.
 */
export async function recordAlertDismissed(alertId: string, notes?: string): Promise<void> {
  const { data: userData } = await supabase.auth.getUser();
  const user = userData?.user;
  if (!user) return;
  const displayName =
    (user.user_metadata?.display_name as string | undefined) ?? user.email ?? null;
  await supabase.from("critical_alert_audit").insert({
    alert_id: alertId,
    event: "dismissed",
    actor_user_id: user.id,
    actor_name: displayName,
    actor_email: user.email ?? null,
    notes: notes ?? null,
  });
}