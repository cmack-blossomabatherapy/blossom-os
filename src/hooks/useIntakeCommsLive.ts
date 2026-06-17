import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type IntakeCommRow = {
  id: string;
  lead_id: string;
  communication_type: "call" | "sms" | "email" | "note";
  direction: string;
  subject: string | null;
  preview: string;
  logged_by_name: string | null;
  created_at: string;
};

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Sprint 04 Phase D — live recent intake communications across all leads.
 */
export function useIntakeCommsLive(limit = 100) {
  const [comms, setComms] = useState<IntakeCommRow[]>([]);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("intake_communications")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);
    setComms((data ?? []) as IntakeCommRow[]);
    setLoading(false);
  }, [limit]);

  useEffect(() => {
    void refetch();
    const channel = supabase
      .channel("intake-comms-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "intake_communications" }, () => { void refetch(); })
      .subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [refetch]);

  const logComm = useCallback(
    async (leadId: string, kind: "call" | "sms" | "email" | "note", preview: string, loggedByName?: string) => {
      if (!UUID_RE.test(leadId)) throw new Error("This lead isn't synced to the database yet.");
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase.from("intake_communications").insert({
        lead_id: leadId,
        communication_type: kind,
        direction: "outbound",
        preview,
        logged_by: user?.id ?? null,
        logged_by_name: loggedByName ?? user?.email ?? "Intake",
      } as never);
      if (error) throw error;
    },
    [],
  );

  return { comms, loading, refetch, logComm };
}