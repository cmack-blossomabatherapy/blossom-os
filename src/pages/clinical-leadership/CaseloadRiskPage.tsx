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
      const sb = supabase as any;
      const [prsRes, utsRes, ptsRes] = await Promise.all([
        sb.from("bcba_progress_reports")
          .select("id, client_identifier, state, assigned_bcba_id, assigned_bcba_name, current_risk, report_status, progress_report_due_date, updated_at")
          .limit(500),
        sb.from("bcba_service_utilization")
          .select("id, client_identifier, state, assigned_bcba_id, assigned_bcba_name, delivered_hours, authorized_hours, cancelled_hours, underutilization_risk, staffing_gap_hours, updated_at")
          .limit(500),
        sb.from("bcba_parent_training_records")
          .select("id, client_identifier, state, assigned_bcba_id, assigned_bcba_name, status, barrier, updated_at")
          .limit(500),
      ]);
      setPr(((prsRes.data ?? []) as any[]).filter((r) => ["delayed", "at_risk", "critical"].includes(String(r.current_risk).toLowerCase())));
      setUtl((utsRes.data ?? []) as any[]);
      setPt(((ptsRes.data ?? []) as any[]).filter((r) => ["behind", "at_risk", "missed", "on_hold"].includes(String(r.status).toLowerCase())));
      setFreshness((prsRes.data?.[0] as any)?.updated_at ?? null);
    })();
  }, []);

  const all = useMemo(() => [...pr, ...utl, ...pt], [pr, utl, pt]);
  const facets = useMemo(() => buildFacets(all), [all]);

  const prEx = useMemo(() => pr.filter((r) => matchesFilters(r, filters)).map<ExceptionRow>((r) => ({
    id: `pr-${r.id}`,
    title: `${r.client_identifier} · Progress report ${r.current_risk}`,
    subtitle: `Report: ${r.report_status}${r.progress_report_due_date ? " · due " + new Date(r.progress_report_due_date).toLocaleDateString() : ""}`,
    owner: r.assigned_bcba_name,
    ownerId: r.assigned_bcba_id,
    severity: r.current_risk === "critical" ? "critical" : r.current_risk === "at_risk" ? "high" : "medium",
    dueDate: r.progress_report_due_date,
    sourceLabel: "progress reports",
    sourceDate: r.updated_at,
    detailPath: `/bcba/progress-reports?report=${r.id}`,
  })), [pr, filters]);

  const utlEx = useMemo(() => utl.filter((r) => matchesFilters(r, filters)).map<ExceptionRow>((r) => {
    const pct = r.authorized_hours ? Math.round(100 * (r.delivered_hours ?? 0) / r.authorized_hours) : 100;
    const under = pct < 70;
    const cancelled = (r.cancelled_hours ?? 0) >= 4;
    const risky = ["at_risk", "high", "critical"].includes(String(r.underutilization_risk).toLowerCase());
    if (!under && !cancelled && !risky) return null as any;
    return {
      id: `utl-${r.id}`,
      title: `${r.client_identifier} · ${under ? `Under-utilizing (${pct}%)` : cancelled ? `${r.cancelled_hours}h cancelled` : `Risk: ${r.underutilization_risk}`}`,
      owner: r.assigned_bcba_name,
      ownerId: r.assigned_bcba_id,
      severity: risky ? "critical" : under ? "high" : "medium",
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
    { label: "On-hold PT cases", value: pt.filter((r) => matchesFilters(r, filters) && String(r.status).toLowerCase() === "on_hold").length },
    { label: "Cancelled hours ≥4", value: utl.filter((r) => matchesFilters(r, filters) && (r.cancelled_hours ?? 0) >= 4).length },
  ]), [prEx, utlEx, ptEx, utl, pt, filters]);

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