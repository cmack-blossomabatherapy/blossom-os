import { supabase } from "@/integrations/supabase/client";

export type JourneyEventType =
  | "phase_view"
  | "module_complete"
  | "graduation_view";

interface TrackArgs {
  type: JourneyEventType;
  phaseId?: string | null;
  path?: string;
  metadata?: Record<string, unknown>;
}

/** Fire-and-forget analytics event. Silently no-ops if not authenticated. */
export async function trackJourneyEvent({ type, phaseId, path, metadata }: TrackArgs): Promise<void> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("journey_events").insert({
      user_id: user.id,
      event_type: type,
      phase_id: phaseId ?? null,
      path: path ?? (typeof window !== "undefined" ? window.location.pathname : null),
      metadata: metadata ?? {},
    });
  } catch {
    // analytics never blocks UX
  }
}