import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type CallStats = {
  today: number;
  week: number;
  missed: number;
  talkTimeSeconds: number;
  loading: boolean;
};

/** Simple per-user call totals from CTM. Filters by matched_agent_user_id. */
export function useCallStats(userId?: string | null): CallStats {
  const [state, setState] = useState<CallStats>({
    today: 0,
    week: 0,
    missed: 0,
    talkTimeSeconds: 0,
    loading: true,
  });

  useEffect(() => {
    let cancelled = false;
    async function run() {
      const uid = userId ?? (await supabase.auth.getUser()).data.user?.id;
      if (!uid) {
        if (!cancelled) setState((s) => ({ ...s, loading: false }));
        return;
      }
      const now = new Date();
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

      const { data } = await supabase
        .from("ctm_call_events")
        .select("called_at,status,talk_time_seconds")
        .eq("matched_agent_user_id", uid)
        .gte("called_at", weekAgo);

      if (cancelled) return;
      const rows = data ?? [];
      let today = 0;
      let missed = 0;
      let talk = 0;
      rows.forEach((r: { called_at: string | null; status: string | null; talk_time_seconds: number | null }) => {
        if (r.called_at && r.called_at >= startOfDay) today++;
        if (r.status?.toLowerCase().includes("miss") || r.status?.toLowerCase().includes("voicemail")) missed++;
        if (typeof r.talk_time_seconds === "number") talk += r.talk_time_seconds;
      });
      setState({ today, week: rows.length, missed, talkTimeSeconds: talk, loading: false });
    }
    void run();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  return state;
}
