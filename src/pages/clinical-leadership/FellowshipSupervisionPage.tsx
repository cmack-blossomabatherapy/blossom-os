import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { CommandCenterShell, ExceptionList } from "./shared/CommandCenterShell";
import { useClinicalFilters } from "./shared/useClinicalFilters";
import { buildFacets, matchesFilters } from "./shared/facets";
import { AssignActionDialog } from "./shared/AssignActionDialog";
import type { ExceptionRow } from "./shared/types";

export default function FellowshipSupervisionPage() {
  const { filters } = useClinicalFilters();
  const [fellows, setFellows] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [freshness, setFreshness] = useState<string | null>(null);
  const [assign, setAssign] = useState<ExceptionRow | null>(null);

  useEffect(() => {
    (async () => {
      const sb = supabase as any;
      const [fRes, rRes] = await Promise.all([
        sb.from("bcba_fellowship_fellows").select("id, full_name, state, clinic, stage_key, supervision_status, monthly_documentation_status, readiness_status, support_need, next_meeting_at, updated_at").limit(1000),
        sb.from("bcba_fellowship_reviews").select("id, fellow_id, review_type, scheduled_at, completed_at, status, follow_up_date, updated_at").limit(1000),
      ]);
      setFellows((fRes.data ?? []) as any[]);
      setReviews((rRes.data ?? []) as any[]);
      setFreshness((fRes.data?.[0] as any)?.updated_at ?? null);
    })();
  }, []);

  const fellowRows = useMemo(() => fellows.map((f) => ({ ...f, assigned_bcba_name: f.full_name })), [fellows]);
  const filtered = useMemo(() => fellowRows.filter((r) => matchesFilters(r, filters)), [fellowRows, filters]);
  const facets = useMemo(() => buildFacets(fellowRows), [fellowRows]);

  const overdueByFellow = useMemo(() => {
    const m = new Map<string, number>();
    const now = Date.now();
    for (const r of reviews) {
      if (r.status !== "completed" && r.scheduled_at && new Date(r.scheduled_at).getTime() < now) {
        m.set(r.fellow_id, (m.get(r.fellow_id) ?? 0) + 1);
      }
    }
    return m;
  }, [reviews]);

  const exceptions: ExceptionRow[] = filtered
    .filter((f: any) => (overdueByFellow.get(f.id) ?? 0) > 0 || ["at_risk","critical"].includes(String(f.support_need).toLowerCase()) || f.supervision_status === "behind")
    .map((f: any) => ({
      id: f.id,
      title: `${f.full_name} · ${f.stage_key}`,
      subtitle: `Supervision: ${f.supervision_status ?? "-"} · Docs: ${f.monthly_documentation_status ?? "-"}${(overdueByFellow.get(f.id) ?? 0) > 0 ? ` · ${overdueByFellow.get(f.id)} overdue review(s)` : ""}`,
      severity: (overdueByFellow.get(f.id) ?? 0) > 0 ? "high" : "medium",
      sourceLabel: "fellows",
      sourceDate: f.updated_at,
      detailPath: `/bcba/fellowship?fellow=${f.id}`,
    }));

  const kpis = useMemo(() => ([
    { label: "Fellows", value: filtered.length },
    { label: "Support need", value: filtered.filter((f: any) => ["at_risk","critical"].includes(String(f.support_need).toLowerCase())).length, tone: "warn" as const },
    { label: "Overdue reviews", value: [...overdueByFellow.values()].reduce((a, b) => a + b, 0), tone: "warn" as const },
    { label: "Meetings this week", value: filtered.filter((f: any) => f.next_meeting_at && (new Date(f.next_meeting_at).getTime() - Date.now()) < 7 * 86400000).length },
  ]), [filtered, overdueByFellow]);

  return (
    <CommandCenterShell
      scopeKey="fellowship-supervision"
      title="Fellowship Supervision"
      description="Fellowship stage roll-up, supervision status and overdue reviews. Visible only to assigned supervisors and leadership."
      kpis={kpis}
      exceptions={exceptions}
      facets={facets}
      auditPath="/bcba/fellowship"
      freshness={{ source: "bcba_fellowship_fellows", lastSyncedAt: freshness }}
    >
      <ExceptionList title="Fellows requiring attention" rows={exceptions} onAssign={setAssign} />
      <AssignActionDialog scopeKey="fellowship-supervision" row={assign} open={!!assign} onOpenChange={(v) => !v && setAssign(null)} />
    </CommandCenterShell>
  );
}