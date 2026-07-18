import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { CommandCenterShell, ExceptionList } from "./shared/CommandCenterShell";
import { useClinicalFilters } from "./shared/useClinicalFilters";
import { buildFacets, matchesFilters } from "./shared/facets";
import { AssignActionDialog } from "./shared/AssignActionDialog";
import type { ExceptionRow } from "./shared/types";

export default function CaseloadRiskPage() {
  const { filters } = useClinicalFilters();
  const [pr, setPr] = useState<any[]>([]);
  const [utl, setUtl] = useState<any[]>([]);
  const [pt, setPt] = useState<any[]>([]);
  const [freshness, setFreshness] = useState<string | null>(null);
  const [assign, setAssign] = useState<ExceptionRow | null>(null);

  useEffect(() => {
    (async () => {
      const [{ data: prs }, { data: uts }, { data: pts }] = await Promise.all([
        supabase.from("bcba_progress_reports")
          .select("id, client_identifier, state, assigned_bcba_id, assigned_bcba_name, risk_status, status, due_date, updated_at")
          .in("risk_status", ["delayed", "at_risk", "critical"]).limit(500),
        supabase.from("bcba_service_utilization")
          .select("id, client_identifier, state, assigned_bcba_id, assigned_bcba_name, utilization_pct, cancelled_hours_total, on_hold, updated_at")
          .limit(500),
        supabase.from("bcba_parent_training_records")
          .select("id, client_identifier, state, assigned_bcba_id, assigned_bcba_name, status, barrier, updated_at")
          .in("status", ["behind", "at_risk", "missed"]).limit(500),
      ]);
      setPr(prs ?? []);
      setUtl(uts ?? []);
      setPt(pts ?? []);
      setFreshness((prs?.[0] as any)?.updated_at ?? null);
    })();
  }, []);

  const all = useMemo(() => [...pr, ...utl, ...pt], [pr, utl, pt]);
  const facets = useMemo(() => buildFacets(all), [all]);

  const prEx = useMemo(() => pr.filter((r) => matchesFilters(r, filters)).map<ExceptionRow>((r) => ({
    id: `pr-${r.id}`,
    title: `${r.client_identifier} · Progress report ${r.risk_status}`,
    subtitle: `Status: ${r.status}${r.due_date ? " · due " + new Date(r.due_date).toLocaleDateString() : ""}`,
    owner: r.assigned_bcba_name,
    ownerId: r.assigned_bcba_id,
    severity: r.risk_status === "critical" ? "critical" : r.risk_status === "at_risk" ? "high" : "medium",
    dueDate: r.due_date,
    sourceLabel: "progress reports",
    sourceDate: r.updated_at,
    detailPath: `/bcba/progress-reports?report=${r.id}`,
  })), [pr, filters]);

  const utlEx = useMemo(() => utl.filter((r) => matchesFilters(r, filters)).map<ExceptionRow>((r) => {
    const under = (r.utilization_pct ?? 100) < 70;
    const cancelled = (r.cancelled_hours_total ?? 0) >= 4;
    if (!under && !cancelled && !r.on_hold) return null as any;
    return {
      id: `utl-${r.id}`,
      title: `${r.client_identifier} · ${r.on_hold ? "On hold" : under ? `Under-utilizing (${r.utilization_pct}%)` : `${r.cancelled_hours_total}h cancelled`}`,
      owner: r.assigned_bcba_name,
      ownerId: r.assigned_bcba_id,
      severity: r.on_hold ? "critical" : under ? "high" : "medium",
      sourceLabel: "utilization",
      sourceDate: r.updated_at,
      detailPath: `/bcba/parent-training`,
    };
  }).filter(Boolean), [utl, filters]);

  const ptEx = useMemo(() => pt.filter((r) => matchesFilters(r, filters)).map<ExceptionRow>((r) => ({
    id: `pt-${r.id}`,
    title: `${r.client_identifier} · Parent training ${r.status}`,
    subtitle: r.barrier ?? undefined,
    owner: r.assigned_bcba_name,
    ownerId: r.assigned_bcba_id,
    severity: r.status === "missed" ? "critical" : "high",
    sourceLabel: "parent training",
    sourceDate: r.updated_at,
    detailPath: `/bcba/parent-training?record=${r.id}`,
  })), [pt, filters]);

  const exceptions = useMemo(() => [...prEx, ...utlEx, ...ptEx], [prEx, utlEx, ptEx]);

  const kpis = useMemo(() => ([
    { label: "Progress report risks", value: prEx.length, tone: prEx.length ? ("warn" as const) : undefined },
    { label: "Utilization risks", value: utlEx.length, tone: utlEx.length ? ("warn" as const) : undefined },
    { label: "Parent training risks", value: ptEx.length, tone: ptEx.length ? ("warn" as const) : undefined },
    { label: "On-hold cases", value: utl.filter((r) => matchesFilters(r, filters) && r.on_hold).length },
    { label: "Cancelled hours ≥4", value: utl.filter((r) => matchesFilters(r, filters) && (r.cancelled_hours_total ?? 0) >= 4).length },
  ]), [prEx, utlEx, ptEx, utl, filters]);

  return (
    <CommandCenterShell
      scopeKey="caseload-risk"
      title="Caseload Risk"
      description="Consolidated risk view across authorizations, utilization, progress reports, parent training and on-hold cases."
      kpis={kpis}
      exceptions={exceptions}
      facets={facets}
      auditPath="/bcba/progress-reports"
      freshness={{ source: "clinical workspace tables", lastSyncedAt: freshness }}
    >
      <ExceptionList title="Cases requiring attention" rows={exceptions} onAssign={setAssign} />
      <AssignActionDialog scopeKey="caseload-risk" row={assign} open={!!assign} onOpenChange={(v) => !v && setAssign(null)} />
    </CommandCenterShell>
  );
}