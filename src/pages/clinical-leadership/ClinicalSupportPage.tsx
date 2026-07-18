import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { CommandCenterShell, ExceptionList } from "./shared/CommandCenterShell";
import { useClinicalFilters } from "./shared/useClinicalFilters";
import { buildFacets, matchesFilters } from "./shared/facets";
import { AssignActionDialog } from "./shared/AssignActionDialog";
import type { ExceptionRow } from "./shared/types";

export default function ClinicalSupportPage() {
  const { filters } = useClinicalFilters();
  const [rows, setRows] = useState<any[]>([]);
  const [freshness, setFreshness] = useState<string | null>(null);
  const [assign, setAssign] = useState<ExceptionRow | null>(null);

  useEffect(() => {
    (async () => {
      const sb = supabase as any;
      const { data } = await sb
        .from("bcba_support_requests")
        .select("id, bcba_id, bcba_name, category, subject, urgency, state, owner_id, owner_name, owner_team, status, sla_hours, due_at, first_response_at, resolved_at, updated_at")
        .neq("status", "closed")
        .limit(1000);
      setRows(((data ?? []) as any[]).map((r) => ({ ...r, assigned_bcba_id: r.bcba_id, assigned_bcba_name: r.bcba_name })));
      setFreshness((data?.[0] as any)?.updated_at ?? null);
    })();
  }, []);

  const filtered = useMemo(() => rows.filter((r) => matchesFilters(r, filters)), [rows, filters]);
  const facets = useMemo(() => buildFacets(rows), [rows]);

  const exceptions: ExceptionRow[] = filtered
    .filter((r: any) => r.status !== "resolved" && (r.urgency === "critical" || r.urgency === "high" || (r.due_at && new Date(r.due_at) < new Date())))
    .map((r: any) => ({
      id: r.id,
      title: `${r.category} · ${r.subject}`,
      subtitle: `Owner: ${r.owner_name ?? r.owner_team ?? "unassigned"} · SLA ${r.sla_hours ?? "-"}h${r.due_at && new Date(r.due_at) < new Date() ? " · overdue" : ""}`,
      owner: r.bcba_name,
      ownerId: r.bcba_id,
      severity: r.urgency === "critical" ? "critical" : (r.due_at && new Date(r.due_at) < new Date()) ? "high" : "medium",
      dueDate: r.due_at,
      sourceLabel: "support requests",
      sourceDate: r.updated_at,
      detailPath: `/bcba/support-center?request=${r.id}`,
    }));

  const kpis = useMemo(() => ([
    { label: "Open requests", value: filtered.length },
    { label: "Critical", value: filtered.filter((r: any) => r.urgency === "critical").length, tone: "danger" as const },
    { label: "Overdue SLA", value: filtered.filter((r: any) => r.due_at && new Date(r.due_at) < new Date()).length, tone: "warn" as const },
    { label: "Unassigned", value: filtered.filter((r: any) => !r.owner_id && !r.owner_team).length, tone: "warn" as const },
  ]), [filtered]);

  return (
    <CommandCenterShell
      scopeKey="clinical-support"
      title="Clinical Support"
      description="Open BCBA support requests with SLA, ownership and category health."
      kpis={kpis}
      exceptions={exceptions}
      facets={facets}
      auditPath="/bcba/support-center"
      freshness={{ source: "bcba_support_requests", lastSyncedAt: freshness }}
    >
      <ExceptionList title="Requests requiring attention" rows={exceptions} onAssign={setAssign} />
      <AssignActionDialog scopeKey="clinical-support" row={assign} open={!!assign} onOpenChange={(v) => !v && setAssign(null)} />
    </CommandCenterShell>
  );
}