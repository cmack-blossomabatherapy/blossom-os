import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { CommandCenterShell, ExceptionList } from "./shared/CommandCenterShell";
import { useClinicalFilters } from "./shared/useClinicalFilters";
import { buildFacets, matchesFilters } from "./shared/facets";
import { AssignActionDialog } from "./shared/AssignActionDialog";
import type { ExceptionRow } from "./shared/types";

const RISKY = ["delayed", "at_risk", "critical"];

export default function ProgressAuthPage() {
  const { filters } = useClinicalFilters();
  const [rows, setRows] = useState<any[]>([]);
  const [freshness, setFreshness] = useState<string | null>(null);
  const [assign, setAssign] = useState<ExceptionRow | null>(null);

  useEffect(() => {
    (async () => {
      const sb = supabase as any;
      const { data } = await sb
        .from("bcba_progress_reports")
        .select("id, client_identifier, state, assigned_bcba_id, assigned_bcba_name, authorization_period_end, authorization_expiration, progress_report_due_date, report_status, parent_input_status, parent_signature_status, qa_status, submission_status, authorization_status, current_risk, updated_at, last_update_at, centralreach_source_date")
        .limit(1000);
      setRows((data ?? []) as any[]);
      setFreshness((data?.[0] as any)?.updated_at ?? null);
    })();
  }, []);

  const filtered = useMemo(() => rows.filter((r) => matchesFilters(r, filters)), [rows, filters]);
  const facets = useMemo(() => buildFacets(rows), [rows]);

  const daysRemaining = (d?: string) => d ? Math.ceil((new Date(d).getTime() - Date.now()) / 86400000) : null;

  const exceptions: ExceptionRow[] = useMemo(() => filtered
    .filter((r: any) => {
      const dr = daysRemaining(r.progress_report_due_date);
      return RISKY.includes(String(r.current_risk)) || (dr !== null && dr <= 42);
    })
    .map((r: any) => {
      const dr = daysRemaining(r.progress_report_due_date);
      return {
        id: r.id,
        title: `${r.client_identifier} · ${r.current_risk ?? r.report_status}`,
        subtitle: `PR: ${r.report_status} · Parent: ${r.parent_input_status}/${r.parent_signature_status} · QA: ${r.qa_status} · Auth: ${r.authorization_status}${dr !== null ? ` · ${dr}d left` : ""}`,
        owner: r.assigned_bcba_name,
        ownerId: r.assigned_bcba_id,
        severity: r.current_risk === "critical" || (dr !== null && dr < 0) ? "critical" : r.current_risk === "at_risk" || (dr !== null && dr <= 21) ? "high" : "medium",
        dueDate: r.progress_report_due_date,
        sourceLabel: "progress reports",
        sourceDate: r.centralreach_source_date ?? r.updated_at,
        detailPath: `/bcba/progress-reports?report=${r.id}`,
      } as ExceptionRow;
    }), [filtered]);

  const kpis = useMemo(() => ([
    { label: "Total tracked", value: filtered.length },
    { label: "≤ 21 days", value: filtered.filter((r: any) => (daysRemaining(r.progress_report_due_date) ?? 999) <= 21).length, tone: "warn" as const },
    { label: "At risk / critical", value: filtered.filter((r: any) => ["at_risk","critical"].includes(String(r.current_risk))).length, tone: "danger" as const },
    { label: "Sent to authorization", value: filtered.filter((r: any) => r.authorization_status === "submitted" || r.authorization_status === "approved").length, tone: "good" as const },
  ]), [filtered]);

  return (
    <CommandCenterShell
      scopeKey="progress-auth"
      title="Progress Report & Authorization"
      description="Progress-report milestones, parent input/signature and authorization readiness."
      kpis={kpis}
      exceptions={exceptions}
      facets={facets}
      auditPath="/bcba/progress-reports"
      freshness={{ source: "bcba_progress_reports", lastSyncedAt: freshness }}
    >
      <ExceptionList title="Reports requiring attention" rows={exceptions} onAssign={setAssign} />
      <AssignActionDialog scopeKey="progress-auth" row={assign} open={!!assign} onOpenChange={(v) => !v && setAssign(null)} />
    </CommandCenterShell>
  );
}