import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type StateDailyHealthNote =
  Database["public"]["Tables"]["state_daily_health_notes"]["Row"];
type StateDailyHealthNoteInsert =
  Database["public"]["Tables"]["state_daily_health_notes"]["Insert"];

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
      .from("state_daily_health_notes")
      .select("*")
      .eq("state_code", stateCode)
      .order("note_date", { ascending: false })
      .limit(limit);
    if (err) setError(err.message);
    else { setError(null); setNotes((data ?? []) as StateDailyHealthNote[]); }
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
    const row: StateDailyHealthNoteInsert = {
      state_code: stateCode,
      note_date: today,
      ...patch,
      created_by: uid,
      created_by_name: createdByName,
    };
    const { error: err } = await supabase
      .from("state_daily_health_notes")
      .upsert(row, { onConflict: "state_code,note_date" });
    if (err) return { error: err.message };
    await load();
    return { error: null };
  }, [stateCode, load]);

  return { notes, loading, error, reload: load, upsertToday };
}