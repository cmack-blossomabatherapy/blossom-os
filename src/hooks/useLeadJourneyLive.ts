import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type LeadCommunicationRow = {
  id: string;
  lead_id: string;
  communication_type: "call" | "sms" | "email" | "note";
  direction: string;
  subject: string | null;
  preview: string;
  duration_seconds: number | null;
  logged_by_name: string | null;
  created_at: string;
};

export type LeadTaskRow = {
  id: string;
  lead_id: string;
  task_type: string;
  title: string;
  owner: string | null;
  due_date: string | null;
  status: string;
  notes: string | null;
  created_at: string;
};

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const isUuid = (id: string | null | undefined) => !!id && UUID_RE.test(id);

/**
 * Phase C — live Patient Lifetime Journey data for a single lead.
 * Fetches and subscribes to `intake_communications` and `intake_tasks` for the
 * given lead id; exposes mutators that persist to Lovable Cloud. Non-UUID lead
 * ids (mock/Monday-imported) short-circuit gracefully.
 */
export function useLeadJourneyLive(leadId: string | null | undefined) {
  const [communications, setCommunications] = useState<LeadCommunicationRow[]>([]);
  const [tasks, setTasks] = useState<LeadTaskRow[]>([]);
  const [loading, setLoading] = useState(false);

  const refetch = useCallback(async () => {
    if (!isUuid(leadId)) {
      setCommunications([]);
      setTasks([]);
      return;
    }
    setLoading(true);
    const [{ data: c }, { data: t }] = await Promise.all([
      supabase.from("intake_communications").select("*").eq("lead_id", leadId!).order("created_at", { ascending: false }).limit(200),
      supabase.from("intake_tasks").select("*").eq("lead_id", leadId!).order("created_at", { ascending: false }).limit(200),
    ]);
    setCommunications((c ?? []) as LeadCommunicationRow[]);
    setTasks((t ?? []) as LeadTaskRow[]);
    setLoading(false);
  }, [leadId]);

  useEffect(() => { void refetch(); }, [refetch]);

  useEffect(() => {
    if (!isUuid(leadId)) return;
    const channel = supabase
      .channel(`lead-journey-${leadId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "intake_communications", filter: `lead_id=eq.${leadId}` }, () => { void refetch(); })
      .on("postgres_changes", { event: "*", schema: "public", table: "intake_tasks", filter: `lead_id=eq.${leadId}` }, () => { void refetch(); })
      .subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [leadId, refetch]);

  const logInteraction = useCallback(
    async (kind: "call" | "sms" | "email" | "note", preview: string, owner?: string, subject?: string) => {
      if (!isUuid(leadId)) throw new Error("This lead isn't synced to the database yet, so interactions can't be logged.");
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase.from("intake_communications").insert({
        lead_id: leadId!,
        communication_type: kind,
        direction: "outbound",
        subject: subject ?? null,
        preview,
        logged_by: user?.id ?? null,
        logged_by_name: owner ?? user?.email ?? "Blossom OS",
      } as never);
      if (error) throw error;
      await refetch();
    },
    [leadId, refetch],
  );

  const addFollowUp = useCallback(
    async (title: string, dueDate?: string, owner?: string, notes?: string) => {
      if (!isUuid(leadId)) throw new Error("This lead isn't synced to the database yet, so follow-ups can't be created.");
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase.from("intake_tasks").insert({
        lead_id: leadId!,
        task_type: "Follow-up",
        title,
        owner: owner ?? null,
        due_date: dueDate || null,
        status: "Open",
        notes: notes ?? null,
        created_by: user?.id ?? null,
      } as never);
      if (error) throw error;
      await refetch();
    },
    [leadId, refetch],
  );

  return { communications, tasks, loading, refetch, logInteraction, addFollowUp, isPersistable: isUuid(leadId) };
}