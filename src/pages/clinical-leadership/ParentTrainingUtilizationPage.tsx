import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { CommandCenterShell, ExceptionList } from "./shared/CommandCenterShell";
import { useClinicalFilters } from "./shared/useClinicalFilters";
import { buildFacets, matchesFilters } from "./shared/facets";
import { AssignActionDialog } from "./shared/AssignActionDialog";
import type { ExceptionRow } from "./shared/types";

export default function ParentTrainingUtilizationPage() {
  const { filters } = useClinicalFilters();
  const [pt, setPt] = useState<any[]>([]);
  const [utl, setUtl] = useState<any[]>([]);
  const [freshness, setFreshness] = useState<string | null>(null);
  const [assign, setAssign] = useState<ExceptionRow | null>(null);

  useEffect(() => {
    (async () => {
      const sb = supabase as any;
      const [ptRes, utlRes] = await Promise.all([
        sb.from("bcba_parent_training_records").select("id, client_identifier, state, assigned_bcba_id, assigned_bcba_name, required_per_month, completed_sessions, scheduled_sessions, cancelled_sessions, status, barrier, updated_at, centralreach_source_date").limit(1000),
        sb.from("bcba_service_utilization").select("id, client_identifier, state, assigned_bcba_id, assigned_bcba_name, authorized_hours, delivered_hours, cancelled_hours, underutilization_risk, contributing_factors, updated_at").limit(1000),
      ]);
      setPt((ptRes.data ?? []) as any[]);
      setUtl((utlRes.data ?? []) as any[]);
      setFreshness((ptRes.data?.[0] as any)?.updated_at ?? null);
    })();
  }, []);

  const all = useMemo(() => [...pt, ...utl], [pt, utl]);
  const facets = useMemo(() => buildFacets(all), [all]);

  const ptEx: ExceptionRow[] = pt.filter((r) => matchesFilters(r, filters))
    .filter((r: any) => ["behind","at_risk","missed","on_hold"].includes(String(r.status).toLowerCase()) || (r.required_per_month && (r.completed_sessions ?? 0) < r.required_per_month))
    .map((r: any) => ({
      id: `pt-${r.id}`,
      title: `${r.client_identifier} · ${r.status ?? "behind"}`,
      subtitle: `${r.completed_sessions ?? 0}/${r.required_per_month ?? 0} sessions${r.barrier ? " · " + r.barrier : ""}`,
      owner: r.assigned_bcba_name,
      ownerId: r.assigned_bcba_id,
      severity: r.status === "missed" ? "critical" : "high",
      sourceLabel: "parent training",
      sourceDate: r.centralreach_source_date ?? r.updated_at,
      detailPath: `/bcba/parent-training?record=${r.id}`,
    }));

  const utlEx: ExceptionRow[] = utl.filter((r) => matchesFilters(r, filters))
    .filter((r: any) => {
      const pct = r.authorized_hours ? 100 * (r.delivered_hours ?? 0) / r.authorized_hours : 100;
      return pct < 75 || ["at_risk","high","critical"].includes(String(r.underutilization_risk).toLowerCase());
    })
    .map((r: any) => {
      const pct = r.authorized_hours ? Math.round(100 * (r.delivered_hours ?? 0) / r.authorized_hours) : 100;
      return {
        id: `utl-${r.id}`,
        title: `${r.client_identifier} · ${pct}% utilization`,
        subtitle: Array.isArray(r.contributing_factors) ? r.contributing_factors.join(" · ") : undefined,
        owner: r.assigned_bcba_name,
        ownerId: r.assigned_bcba_id,
        severity: pct < 50 ? "critical" : "high",
        sourceLabel: "utilization",
        sourceDate: r.updated_at,
        detailPath: `/bcba/parent-training`,
      } as ExceptionRow;
    });

  const exceptions = [...ptEx, ...utlEx];

  const kpis = useMemo(() => ([
    { label: "PT records", value: pt.filter((r) => matchesFilters(r, filters)).length },
    { label: "PT behind", value: ptEx.length, tone: ptEx.length ? ("warn" as const) : undefined },
    { label: "Under-utilized", value: utlEx.length, tone: utlEx.length ? ("warn" as const) : undefined },
    { label: "Utilization records", value: utl.filter((r) => matchesFilters(r, filters)).length },
  ]), [pt, utl, ptEx, utlEx, filters]);

  return (
    <CommandCenterShell
      scopeKey="parent-training-utilization"
      title="Parent Training & Utilization"
      description="Parent training delivery and service utilization with contributing factors."
      kpis={kpis}
      exceptions={exceptions}
      facets={facets}
      auditPath="/bcba/parent-training"
      freshness={{ source: "bcba_parent_training_records / bcba_service_utilization", lastSyncedAt: freshness }}
    >
      <ExceptionList title="Cases requiring attention" rows={exceptions} onAssign={setAssign} />
      <AssignActionDialog scopeKey="parent-training-utilization" row={assign} open={!!assign} onOpenChange={(v) => !v && setAssign(null)} />
    </CommandCenterShell>
  );
}