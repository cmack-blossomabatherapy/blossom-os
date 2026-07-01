import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type ReputationContactWindow = "all" | "7" | "30" | "90";
export type ReputationContactSort = "recent" | "oldest";

export interface ReputationLeadRow {
  id: string;
  name: string;
  state: string | null;
  stage: string | null;
  source: string | null;
  lastContacted: string | null;
  createdAt: string;
}

interface UseReputationLeadsArgs {
  contactWindow: ReputationContactWindow;
  contactSort: ReputationContactSort;
  limit?: number;
}

function displayName(row: {
  parent_name: string | null;
  parent_first_name: string | null;
  parent_last_name: string | null;
  patient_first_name: string | null;
  patient_last_name: string | null;
  child_name: string | null;
}): string {
  if (row.parent_name?.trim()) return row.parent_name.trim();
  const parent = [row.parent_first_name, row.parent_last_name].filter(Boolean).join(" ").trim();
  if (parent) return parent;
  const patient = [row.patient_first_name, row.patient_last_name].filter(Boolean).join(" ").trim();
  if (patient) return patient;
  return row.child_name?.trim() || "Unnamed lead";
}

/**
 * Server-side filtered + sorted "last contacted" query for the Reputation
 * leads table. Filtering + sorting happen in Postgres so the list stays
 * responsive at scale.
 */
export function useReputationLeads({
  contactWindow,
  contactSort,
  limit = 100,
}: UseReputationLeadsArgs) {
  const [rows, setRows] = useState<ReputationLeadRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [marking, setMarking] = useState<string | null>(null);

  /**
   * Write an audit/activity log entry into intake_communications and emit an
   * automation event into journey_events so downstream automations (and the
   * lead timeline UI) see every last_contacted_at mutation from the
   * Reputation table.
   */
  const logContactAudit = useCallback(
    async (
      leadId: string,
      action: "marked_contacted" | "undo_marked_contacted",
      previous: string | null,
      next: string | null,
    ) => {
      try {
        const { data: userRes } = await supabase.auth.getUser();
        const user = userRes?.user ?? null;
        const actorName =
          (user?.user_metadata?.full_name as string | undefined) ??
          user?.email ??
          "System";
        const preview =
          action === "marked_contacted"
            ? `Marked as contacted from Reputation table (${new Date(next ?? Date.now()).toLocaleString("en-US", { timeZone: "America/New_York" })})`
            : `Reverted last contacted from Reputation table`;

        await Promise.all([
          supabase.from("intake_communications").insert({
            lead_id: leadId,
            communication_type: "note",
            direction: "outbound",
            subject:
              action === "marked_contacted"
                ? "Contact logged (Reputation)"
                : "Contact log reverted (Reputation)",
            preview,
            logged_by: user?.id ?? null,
            logged_by_name: actorName,
          }),
          user?.id
            ? supabase.from("journey_events").insert({
                user_id: user.id,
                event_type: `reputation.${action}`,
                path: "/os/marketing/reputation",
                metadata: {
                  lead_id: leadId,
                  previous_last_contacted_at: previous,
                  next_last_contacted_at: next,
                  source: "reputation_table",
                },
              })
            : Promise.resolve({ error: null } as const),
        ]);
      } catch (e) {
        // Non-blocking: never fail the user action because audit logging failed.
        console.warn("[reputation] audit log failed", e);
      }
    },
    [],
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let q = supabase
        .from("intake_leads")
        .select(
          "id, state, pipeline_stage, referral_source, created_at, last_contacted_at, last_contact_date, parent_name, parent_first_name, parent_last_name, patient_first_name, patient_last_name, child_name",
        )
        .limit(limit);

      if (contactWindow !== "all") {
        const days = Number(contactWindow);
        const since = new Date(Date.now() - days * 86_400_000).toISOString();
        q = q.gte("last_contacted_at", since);
      }

      q = q.order("last_contacted_at", {
        ascending: contactSort === "oldest",
        nullsFirst: false,
      });

      const { data, error: err } = await q;
      if (err) throw err;
      setRows(
        (data ?? []).map((r: any) => ({
          id: r.id,
          name: displayName(r),
          state: r.state ?? null,
          stage: r.pipeline_stage ?? null,
          source: r.referral_source ?? null,
          lastContacted: r.last_contacted_at ?? r.last_contact_date ?? null,
          createdAt: r.created_at,
        })),
      );
    } catch (e: any) {
      setError(e?.message ?? "Failed to load reputation leads");
    } finally {
      setLoading(false);
    }
  }, [contactWindow, contactSort, limit]);

  useEffect(() => {
    void load();
  }, [load]);

  const markContacted = useCallback(
    async (id: string) => {
      setMarking(id);
      const nowIso = new Date().toISOString();
      const prevRow = rows.find((r) => r.id === id);
      const prevLastContacted = prevRow?.lastContacted ?? null;
      const prevRows = rows;
      // Optimistic update
      setRows((rs) =>
        rs.map((r) => (r.id === id ? { ...r, lastContacted: nowIso } : r)),
      );
      try {
        const { error: err } = await supabase
          .from("intake_leads")
          .update({
            last_contacted_at: nowIso,
            last_contact_date: nowIso.slice(0, 10),
          })
          .eq("id", id);
        if (err) throw err;
        void logContactAudit(id, "marked_contacted", prevLastContacted, nowIso);
        toast.success("Marked as contacted", {
          action: {
            label: "Undo",
            onClick: () => {
              void (async () => {
                // Optimistically restore the row's previous value.
                setRows((rs) =>
                  rs.map((r) =>
                    r.id === id ? { ...r, lastContacted: prevLastContacted } : r,
                  ),
                );
                const { error: undoErr } = await supabase
                  .from("intake_leads")
                  .update({
                    last_contacted_at: prevLastContacted,
                    last_contact_date: prevLastContacted
                      ? prevLastContacted.slice(0, 10)
                      : null,
                  })
                  .eq("id", id);
                if (undoErr) {
                  toast.error(undoErr.message ?? "Could not undo");
                  // Reload to reconcile with server state.
                  void load();
                  return;
                }
                void logContactAudit(
                  id,
                  "undo_marked_contacted",
                  nowIso,
                  prevLastContacted,
                );
                toast.success("Reverted last contacted");
                void load();
              })();
            },
          },
        });
        // Re-sort/refilter to reflect server truth
        void load();
      } catch (e: any) {
        setRows(prevRows);
        toast.error(e?.message ?? "Could not mark contacted");
      } finally {
        setMarking(null);
      }
    },
    [rows, load, logContactAudit],
  );

  return { rows, loading, error, marking, refetch: load, markContacted };
}