/**
 * Authorization-team weekly event log.
 *
 * The Authorization Analysis report merges these manually logged workflow
 * events with CentralReach authorization data, because CR exports carry no
 * submission, denial, or progress-report events.
 */
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { fetchAuthorizationWeeklyEvents } from "@/lib/os/reports/crPrimary/source";
import type { AuthorizationWeeklyEventRow } from "@/lib/os/reports/crPrimary/types";

export interface AuthEventInput {
  event_type: string;
  event_date: string;
  client_name?: string | null;
  authorization_number?: string | null;
  payor?: string | null;
  state?: string | null;
  pause_reason?: string | null;
  pause_reason_detail?: string | null;
  notes?: string | null;
}

export function useAuthorizationWeeklyEvents() {
  const [events, setEvents] = useState<AuthorizationWeeklyEventRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    const result = await fetchAuthorizationWeeklyEvents();
    setEvents(result.rows);
    setErrorMessage(result.error);
    setLoading(false);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const logEvent = useCallback(
    async (input: AuthEventInput): Promise<string | null> => {
      const { data: auth } = await supabase.auth.getUser();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from("authorization_weekly_events")
        .insert({ ...input, logged_by: auth?.user?.id ?? null });
      if (error) return error.message;
      await refresh();
      return null;
    },
    [refresh],
  );

  const deleteEvent = useCallback(
    async (id: string): Promise<string | null> => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from("authorization_weekly_events")
        .delete()
        .eq("id", id);
      if (error) return error.message;
      await refresh();
      return null;
    },
    [refresh],
  );

  return { events, loading, errorMessage, refresh, logEvent, deleteEvent };
}