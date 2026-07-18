import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { CommandCenterShell, ExceptionList } from "./shared/CommandCenterShell";
import { useClinicalFilters } from "./shared/useClinicalFilters";
import { buildFacets, matchesFilters } from "./shared/facets";
import { AssignActionDialog } from "./shared/AssignActionDialog";
import type { ExceptionRow } from "./shared/types";

const OPEN_STATES = ["assigned","parent_contact_needed","scheduled","in_progress","treatment_plan_in_progress","parent_input_needed","parent_signature_needed","submitted_to_qa","qa_changes_requested","resubmitted"];

export default function AssessmentQaPage() {
  const { filters } = useClinicalFilters();
  const [items, setItems] = useState<any[]>([]);
  const [qa, setQa] = useState<any[]>([]);
  const [freshness, setFreshness] = useState<string | null>(null);
  const [assign, setAssign] = useState<ExceptionRow | null>(null);

  useEffect(() => {
    (async () => {
      const sb = supabase as any;
      const [aRes, qaRes] = await Promise.all([
        sb.from("bcba_assessments")
          .select("id, client_identifier, assigned_bcba_id, assigned_bcba_name, status, assessment_date, due_date, missing_item, next_action, qa_reviewer_name, updated_at, status_entered_at")
          .limit(1000),
        sb.from("bcba_assessment_qa_feedback")
          .select("id, assessment_id, correction_category, reviewer_name, date_returned, due_date, resolution_status, is_repeat_issue, updated_at")
          .neq("resolution_status", "resolved")
          .limit(500),
      ]);
      setItems((aRes.data ?? []) as any[]);
      setQa((qaRes.data ?? []) as any[]);
      setFreshness((aRes.data?.[0] as any)?.updated_at ?? null);
    })();
  }, []);

  const filtered = useMemo(() => items.filter((r) => matchesFilters(r, filters)), [items, filters]);
  const facets = useMemo(() => buildFacets(items), [items]);

  const open = filtered.filter((r: any) => OPEN_STATES.includes(String(r.status)));
  const daysOpen = (r: any) => {
    const t = r.status_entered_at ?? r.assessment_date ?? r.updated_at;
    return t ? Math.max(0, Math.floor((Date.now() - new Date(t).getTime()) / 86400000)) : 0;
  };

  const exceptions: ExceptionRow[] = useMemo(() => {
    const overdueQaByAssessment = new Map<string, any>();
    for (const q of qa) if (q.due_date && new Date(q.due_date) < new Date()) overdueQaByAssessment.set(q.assessment_id, q);
    return open
      .map((a: any) => {
        const d = daysOpen(a);
        const overdueQa = overdueQaByAssessment.get(a.id);
        if (d < 14 && !overdueQa && String(a.status) !== "qa_changes_requested") return null;
        return {
          id: a.id,
          title: `${a.client_identifier} · ${a.status}`,
          subtitle: `${d}d in stage${a.missing_item ? " · missing: " + a.missing_item : ""}${overdueQa ? " · QA overdue" : ""}`,
          owner: a.assigned_bcba_name,
          ownerId: a.assigned_bcba_id,
          severity: overdueQa ? "critical" : d > 30 ? "high" : "medium",
          dueDate: a.due_date,
          sourceLabel: "assessments",
          sourceDate: a.updated_at,
          detailPath: `/bcba/assessments?assessment=${a.id}`,
        } as ExceptionRow;
      })
      .filter(Boolean) as ExceptionRow[];
  }, [open, qa]);

  const kpis = useMemo(() => ([
    { label: "Assessments open", value: open.length },
    { label: "Ready for auth", value: filtered.filter((r: any) => r.status === "ready_for_authorization").length, tone: "good" as const },
    { label: "QA changes requested", value: filtered.filter((r: any) => r.status === "qa_changes_requested").length, tone: "warn" as const },
    { label: "QA corrections overdue", value: qa.filter((q: any) => q.due_date && new Date(q.due_date) < new Date()).length, tone: "danger" as const },
    { label: "Repeat QA issues", value: qa.filter((q: any) => q.is_repeat_issue).length, tone: "warn" as const },
  ]), [open, filtered, qa]);

  return (
    <CommandCenterShell
      scopeKey="assessment-qa"
      title="Assessment & QA"
      description="Assessment pipeline aging, QA return rate and overdue corrections."
      kpis={kpis}
      exceptions={exceptions}
      facets={facets}
      auditPath="/bcba/assessments"
      freshness={{ source: "bcba_assessments", lastSyncedAt: freshness }}
    >
      <ExceptionList title="Assessments requiring attention" rows={exceptions} onAssign={setAssign} />
      <AssignActionDialog scopeKey="assessment-qa" row={assign} open={!!assign} onOpenChange={(v) => !v && setAssign(null)} />
    </CommandCenterShell>
  );
}