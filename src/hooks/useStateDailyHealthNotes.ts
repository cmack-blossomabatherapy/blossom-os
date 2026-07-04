import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface StateDailyHealthNote {
  id: string;
  state_code: string;
  note_date: string;
  summary?: string | null;
  wins?: string | null;
  blockers?: string | null;
  intake_status?: string | null;
  staffing_status?: string | null;
  scheduling_status?: string | null;
  authorizations_status?: string | null;
  recruiting_status?: string | null;
  created_by?: string | null;
  created_by_name?: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Loads the recent Daily State Health notes for a given state.
 * Realtime-subscribed so posting a note refreshes every open board.
 */
export function useStateDailyHealthNotes(stateCode: string | null, limit = 14) {
  const [notes, setNotes] = useState<StateDailyHealthNote[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!stateCode) { setNotes([]); return; }
    setLoading(true);
    const { data, error: err } = await supabase
      .from("state_daily_health_notes" as any)
      .select("*")
      .eq("state_code", stateCode)
      .order("note_date", { ascending: false })
      .limit(limit);
    if (err) setError(err.message);
    else { setError(null); setNotes((data ?? []) as any as StateDailyHealthNote[]); }
    setLoading(false);
  }, [stateCode, limit]);

  useEffect(() => {
    void load();
    if (!stateCode) return;
    const channel = supabase
      .channel(`state-health-${stateCode}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "state_daily_health_notes", filter: `state_code=eq.${stateCode}` },
        () => { void load(); },
      )
      .subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [stateCode, load]);

  const upsertToday = useCallback(async (patch: Partial<StateDailyHealthNote>, createdByName: string) => {
    if (!stateCode) return { error: "No state selected" };
    const today = new Date().toISOString().slice(0, 10);
    const { data: userData } = await supabase.auth.getUser();
    const uid = userData.user?.id ?? null;
    const { error: err } = await supabase
      .from("state_daily_health_notes" as any)
      .upsert({
        state_code: stateCode,
        note_date: today,
        ...patch,
        created_by: uid,
        created_by_name: createdByName,
      }, { onConflict: "state_code,note_date" });
    if (err) return { error: err.message };
    await load();
    return { error: null };
  }, [stateCode, load]);

  return { notes, loading, error, reload: load, upsertToday };
}