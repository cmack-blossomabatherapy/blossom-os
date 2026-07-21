import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useBcbaIdentity } from "../useBcbaIdentity";
import { BcbaMappingDiagnostic } from "../BcbaMappingDiagnostic";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import {
  Users, UserCheck, ShieldCheck, GraduationCap, Calendar, AlertTriangle,
  ChevronRight, CheckCircle2, Loader2, HeartHandshake, LifeBuoy,
} from "lucide-react";

/* -------------------------------------------------------------------------- */
/*  Types & helpers                                                           */
/* -------------------------------------------------------------------------- */

type AssignmentRow = {
  id: string;
  rbt_employee_id: string | null;
  client_id: string | null;
  client_name: string | null;
  start_date: string | null;
  end_date: string | null;
  status: string | null;
  first_session_date: string | null;
  lead_rbt_support_status: string | null;
  supervision_plan: string | null;
  training_recommendations: string | null;
  open_concerns_count: number | null;
  centralreach_sync_status: string | null;
  centralreach_last_synced_at: string | null;
};

type ChecklistItem = { key: string; label: string; description: string | null; order_index: number };
type ChecklistState = { item_key: string; done: boolean; done_at: string | null };
type Followup = {
  id: string; response: string | null; status: string; submitted_at: string;
  notes: string | null; followup_date: string | null;
};

type RbtView = {
  employeeId: string;
  name: string;
  experienceBucket: string | null;   // approved: readiness bucket only
  pathwayLabel: string | null;
  readinessStatus: string | null;    // approved readiness only — no BG-check detail
  skillMastered: number;
  skillInProgress: number;
  crAccessStatus: string | null;
  openTrainingCount: number;
  leadEvalRecommendation: string | null;
};

const RESPONSE_OPTIONS: Array<{
  key: string; label: string; needsFollowup: boolean; taskTitle: string;
  priority: "low" | "medium" | "high" | "critical";
}> = [
  { key: "ready_to_continue",       label: "Ready to continue",              needsFollowup: false, taskTitle: "",                                    priority: "low" },
  { key: "additional_supervision",  label: "Continue with additional supervision", needsFollowup: true, taskTitle: "Schedule additional supervision",   priority: "medium" },
  { key: "assign_refresher",        label: "Assign refresher",               needsFollowup: true,  taskTitle: "Assign refresher training",           priority: "medium" },
  { key: "request_lead_rbt",        label: "Request Lead RBT support",       needsFollowup: true,  taskTitle: "Request Lead RBT support",            priority: "medium" },
  { key: "request_staffing_review", label: "Request staffing review",        needsFollowup: true,  taskTitle: "Staffing review requested",           priority: "high" },
  { key: "case_fit_concern",        label: "Report case-fit concern",        needsFollowup: true,  taskTitle: "Case-fit concern — review pairing",   priority: "high" },
  { key: "escalate_safety",         label: "Escalate safety concern",        needsFollowup: true,  taskTitle: "SAFETY — immediate review required",  priority: "critical" },
];

function fmtDate(d?: string | null) {
  if (!d) return "—";
  try { return new Date(d).toLocaleDateString(); } catch { return "—"; }
}

/* -------------------------------------------------------------------------- */
/*  Data hook                                                                 */
/* -------------------------------------------------------------------------- */

function useMyRbtData(scopedAuthUserId: string | null, forcedBcbaEmployeeId: string | null) {
  const userId = scopedAuthUserId;

  return useQuery({
    queryKey: ["bcba-my-rbts", userId, forcedBcbaEmployeeId],
    enabled: !!userId,
    queryFn: async () => {
      // Resolve BCBA's employee id (some tables key on employees.id, not auth uid)
      let bcbaEmployeeId = forcedBcbaEmployeeId;
      if (!bcbaEmployeeId) {
        const { data: emp } = await supabase
          .from("employees").select("id").eq("user_id", userId!).maybeSingle();
        bcbaEmployeeId = emp?.id ?? null;
      }

      // Shared assignment model — this is the single source of truth
      const { data: assignments, error: aErr } = await supabase
        .from("rbt_client_assignments")
        .select("id,rbt_employee_id,client_id,client_name,start_date,end_date,status,first_session_date,lead_rbt_support_status,supervision_plan,training_recommendations,open_concerns_count,centralreach_sync_status,centralreach_last_synced_at")
        .eq("assigned_bcba_id", userId!)
        .order("start_date", { ascending: false });
      if (aErr) throw aErr;

      const rows = (assignments ?? []) as AssignmentRow[];
      const rbtIds = Array.from(new Set(rows.map(r => r.rbt_employee_id).filter(Boolean))) as string[];
      const assignmentIds = rows.map(r => r.id);

      // Approved employee info only — no HR/payroll/medical fields
      const [empR, readinessR, pathwayR, skillR, firstCaseR, checklistItemsR, followupR, leadEvalR, checkinR] = await Promise.all([
        rbtIds.length
          ? supabase.from("employees").select("id,first_name,last_name").in("id", rbtIds)
          : Promise.resolve({ data: [], error: null } as any),
        rbtIds.length
          ? supabase.from("rbt_readiness_records")
              .select("employee_id,experience_bucket,status,ready")
              .in("employee_id", rbtIds)
          : Promise.resolve({ data: [], error: null } as any),
        rbtIds.length
          ? supabase.from("rbt_pathway_assignments")
              .select("employee_id,pathway_id,active")
              .in("employee_id", rbtIds).eq("active", true)
          : Promise.resolve({ data: [], error: null } as any),
        rbtIds.length
          ? supabase.from("rbt_skill_status")
              .select("employee_id,state")
              .in("employee_id", rbtIds)
          : Promise.resolve({ data: [], error: null } as any),
        assignmentIds.length
          ? supabase.from("rbt_first_case")
              .select("id,assignment_id,employee_id,bcba_id,cr_access_status,start_date,readiness_acknowledged_at,status")
              .in("assignment_id", assignmentIds)
          : Promise.resolve({ data: [], error: null } as any),
        supabase.from("rbt_first_session_checklist_items")
          .select("key,label,description,order_index,audience,is_active")
          .eq("audience", "bcba").eq("is_active", true).order("order_index"),
        assignmentIds.length
          ? supabase.from("rbt_first_session_bcba_followups")
              .select("id,first_case_id,response,status,submitted_at,notes,followup_date")
              .order("submitted_at", { ascending: false })
          : Promise.resolve({ data: [], error: null } as any),
        assignmentIds.length
          ? supabase.from("rbt_first_session_lead_evaluations")
              .select("id,first_case_id,support_recommendation,evaluated_at,notes")
              .order("evaluated_at", { ascending: false })
          : Promise.resolve({ data: [], error: null } as any),
        assignmentIds.length
          ? supabase.from("rbt_first_session_checkins")
              .select("first_case_id,confidence,support_received,family_concern,safety_concern,additional_support_requested,submitted_at")
              .order("submitted_at", { ascending: false })
          : Promise.resolve({ data: [], error: null } as any),
      ]);

      const empMap = new Map<string, any>((empR.data ?? []).map((e: any) => [e.id, e]));
      const readMap = new Map<string, any>((readinessR.data ?? []).map((r: any) => [r.employee_id, r]));
      const pathMap = new Map<string, any>((pathwayR.data ?? []).map((r: any) => [r.employee_id, r]));
      const skillsByEmp = new Map<string, { mastered: number; inProgress: number }>();
      (skillR.data ?? []).forEach((s: any) => {
        const cur = skillsByEmp.get(s.employee_id) ?? { mastered: 0, inProgress: 0 };
        if (s.state === "mastered" || s.state === "competent") cur.mastered += 1;
        else cur.inProgress += 1;
        skillsByEmp.set(s.employee_id, cur);
      });
      const firstCaseByAssignment = new Map<string, any>((firstCaseR.data ?? []).map((f: any) => [f.assignment_id, f]));

      // Load checklist state for all existing first_cases
      const firstCaseIds = (firstCaseR.data ?? []).map((f: any) => f.id);
      let checklistStateByCase = new Map<string, ChecklistState[]>();
      if (firstCaseIds.length) {
        const { data: state } = await supabase
          .from("rbt_first_session_checklist_state")
          .select("first_case_id,item_key,done,done_at")
          .in("first_case_id", firstCaseIds);
        (state ?? []).forEach((s: any) => {
          const arr = checklistStateByCase.get(s.first_case_id) ?? [];
          arr.push(s); checklistStateByCase.set(s.first_case_id, arr);
        });
      }

      const rowsEnriched = rows.map((a) => {
        const fc = firstCaseByAssignment.get(a.id);
        const emp = a.rbt_employee_id ? empMap.get(a.rbt_employee_id) : null;
        const r = a.rbt_employee_id ? readMap.get(a.rbt_employee_id) : null;
        const p = a.rbt_employee_id ? pathMap.get(a.rbt_employee_id) : null;
        const sk = a.rbt_employee_id ? skillsByEmp.get(a.rbt_employee_id) : null;

        const rbtView: RbtView = {
          employeeId: a.rbt_employee_id ?? "",
          name: emp ? `${emp.first_name ?? ""} ${emp.last_name ?? ""}`.trim() : "Unassigned RBT",
          experienceBucket: r?.experience_bucket ?? null,
          pathwayLabel: p?.pathway_id ?? null,
          readinessStatus: r ? (r.ready ? "Ready" : (r.status ?? "In progress")) : null,
          skillMastered: sk?.mastered ?? 0,
          skillInProgress: sk?.inProgress ?? 0,
          crAccessStatus: fc?.cr_access_status ?? a.centralreach_sync_status ?? null,
          openTrainingCount: sk?.inProgress ?? 0,
          leadEvalRecommendation: null, // filled below
        };

        const leadEval = fc ? (leadEvalR.data ?? []).find((e: any) => e.first_case_id === fc.id) : null;
        if (leadEval) rbtView.leadEvalRecommendation = leadEval.support_recommendation ?? leadEval.notes ?? null;

        const checkin = fc ? (checkinR.data ?? []).find((c: any) => c.first_case_id === fc.id) : null;
        const followups = fc ? (followupR.data ?? []).filter((f: any) => f.first_case_id === fc.id) as Followup[] : [];
        const checklistState = fc ? (checklistStateByCase.get(fc.id) ?? []) : [];

        return { assignment: a, rbt: rbtView, firstCase: fc, checklistState, followups, checkin, leadEval };
      });

      return {
        bcbaEmployeeId,
        checklistItems: ((checklistItemsR.data ?? []) as ChecklistItem[]),
        assignments: rowsEnriched,
      };
    },
  });
}

/* -------------------------------------------------------------------------- */
/*  Assignment card                                                           */
/* -------------------------------------------------------------------------- */

function AssignmentCard({
  data,
  checklistItems,
  bcbaEmployeeId,
  onChanged,
  readOnly,
}: {
  data: any;
  checklistItems: ChecklistItem[];
  bcbaEmployeeId: string | null;
  onChanged: () => void;
  readOnly?: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const { assignment, rbt, firstCase, checklistState, followups, checkin, leadEval } = data;
  const [busy, setBusy] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const doneKeys = new Set(checklistState.filter((c: ChecklistState) => c.done).map((c: ChecklistState) => c.item_key));
  const checklistDone = checklistItems.every((i) => doneKeys.has(i.key));

  async function ensureFirstCase(): Promise<string | null> {
    if (readOnly) { toast.info("Read-only in preview mode."); return null; }
    if (firstCase?.id) return firstCase.id;
    if (!bcbaEmployeeId || !assignment.rbt_employee_id) {
      toast.error("Missing BCBA or RBT identity for this case.");
      return null;
    }
    const { data, error } = await supabase.from("rbt_first_case").insert({
      assignment_id: assignment.id,
      employee_id: assignment.rbt_employee_id,
      bcba_id: bcbaEmployeeId,
      client_display: assignment.client_name,
      start_date: assignment.first_session_date ?? assignment.start_date,
      status: "in_progress",
    }).select("id").single();
    if (error) { toast.error(error.message); return null; }
    return data.id;
  }

  async function toggleChecklist(itemKey: string, next: boolean) {
    if (readOnly) { toast.info("Read-only in preview mode."); return; }
    setBusy(itemKey);
    const caseId = await ensureFirstCase();
    if (!caseId) { setBusy(null); return; }
    // Upsert by (first_case_id, item_key)
    const { error } = await supabase.from("rbt_first_session_checklist_state").upsert({
      first_case_id: caseId,
      employee_id: assignment.rbt_employee_id,
      item_key: itemKey,
      done: next,
      done_at: next ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    }, { onConflict: "first_case_id,item_key" });
    setBusy(null);
    if (error) { toast.error(error.message); return; }
    onChanged();
  }

  async function submitResponse(opt: typeof RESPONSE_OPTIONS[number]) {
    if (readOnly) { toast.info("Read-only in preview mode."); return; }
    setBusy(`resp-${opt.key}`);
    const caseId = await ensureFirstCase();
    if (!caseId) { setBusy(null); return; }

    const status = opt.needsFollowup ? "open" : "resolved";
    const { error: fErr } = await supabase.from("rbt_first_session_bcba_followups").insert({
      first_case_id: caseId,
      employee_id: assignment.rbt_employee_id,
      bcba_id: bcbaEmployeeId,
      response: opt.key,
      status,
      notes: notes || null,
      resolved_at: opt.needsFollowup ? null : new Date().toISOString(),
      rbt_readiness: opt.key === "ready_to_continue" ? "ready" : (opt.key === "escalate_safety" ? "not_ready" : "needs_support"),
      additional_supervision_required: opt.key === "additional_supervision",
      training_required: opt.key === "assign_refresher",
      case_fit_concern: opt.key === "case_fit_concern",
    });
    if (fErr) { toast.error(fErr.message); setBusy(null); return; }

    // Follow-up work is tracked so it cannot disappear
    if (opt.needsFollowup) {
      const { error: tErr } = await supabase.from("bcba_action_tasks").insert({
        client_id: assignment.client_id,
        client_name: assignment.client_name,
        assigned_bcba: bcbaEmployeeId,
        assigned_to: bcbaEmployeeId,
        source_area: "first_session_response",
        title: opt.taskTitle,
        description: `RBT: ${rbt.name} — ${opt.label}${notes ? `\n\n${notes}` : ""}`,
        status: "open",
        priority: opt.priority,
        source_system: "blossom_os",
      });
      if (tErr) toast.warning(`Response recorded; task creation warning: ${tErr.message}`);
    }

    // If safety escalation, bump open_concerns_count
    if (opt.key === "escalate_safety" || opt.key === "case_fit_concern") {
      await supabase.from("rbt_client_assignments").update({
        open_concerns_count: (assignment.open_concerns_count ?? 0) + 1,
      }).eq("id", assignment.id);
    }

    setNotes("");
    setBusy(null);
    toast.success("Response recorded.");
    onChanged();
  }

  const readinessAckd = !!firstCase?.readiness_acknowledged_at || checklistDone;

  return (
    <div className="rounded-2xl border border-border/60 bg-card shadow-sm overflow-hidden">
      {/* Header — always visible summary */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full text-left p-4 sm:p-5 flex items-start gap-3 hover:bg-muted/40 transition-colors"
      >
        <div className="h-10 w-10 rounded-full bg-primary/10 text-primary grid place-items-center shrink-0">
          <Users className="h-5 w-5" strokeWidth={1.75} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="font-semibold truncate">{rbt.name}</div>
            <Badge variant="secondary" className="text-[10px]">{assignment.status ?? "active"}</Badge>
            {rbt.readinessStatus && (
              <Badge variant={rbt.readinessStatus === "Ready" ? "default" : "outline"} className="text-[10px]">
                {rbt.readinessStatus}
              </Badge>
            )}
            {assignment.open_concerns_count ? (
              <Badge variant="destructive" className="text-[10px]">
                {assignment.open_concerns_count} open concern{assignment.open_concerns_count > 1 ? "s" : ""}
              </Badge>
            ) : null}
          </div>
          <div className="text-xs text-muted-foreground mt-0.5 truncate">
            {assignment.client_name ?? "Client"} · First session {fmtDate(assignment.first_session_date ?? assignment.start_date)}
          </div>
        </div>
        <ChevronRight className={`h-5 w-5 text-muted-foreground shrink-0 transition-transform ${expanded ? "rotate-90" : ""}`} />
      </button>

      {expanded && (
        <div className="border-t border-border/60 p-4 sm:p-5 space-y-6">
          {/* Approved employee info only */}
          <section>
            <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
              About this RBT
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
              <Fact icon={<GraduationCap className="h-4 w-4" />} label="Experience" value={rbt.experienceBucket ?? "—"} />
              <Fact icon={<BadgeIcon />} label="Pathway" value={rbt.pathwayLabel ?? "—"} />
              <Fact icon={<ShieldCheck className="h-4 w-4" />} label="Readiness" value={rbt.readinessStatus ?? "—"} />
              <Fact icon={<UserCheck className="h-4 w-4" />} label="Skills mastered" value={String(rbt.skillMastered)} />
              <Fact icon={<GraduationCap className="h-4 w-4" />} label="Open training" value={String(rbt.openTrainingCount)} />
              <Fact icon={<HeartHandshake className="h-4 w-4" />} label="CentralReach" value={rbt.crAccessStatus ?? "—"} />
            </div>
            {rbt.leadEvalRecommendation && (
              <div className="mt-3 rounded-lg border border-border/60 bg-muted/30 p-3 text-sm">
                <div className="text-xs font-semibold uppercase text-muted-foreground mb-1">Lead RBT recommendation</div>
                {rbt.leadEvalRecommendation}
              </div>
            )}
            <div className="mt-3 text-[11px] text-muted-foreground">
              HR, background-check details, salary, medical, and disciplinary records are not shown here by design.
            </div>
          </section>

          {/* Pre-start checklist */}
          <section>
            <div className="flex items-center justify-between mb-2">
              <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Pre-start checklist
              </div>
              <div className="text-[11px] text-muted-foreground">
                {[...doneKeys].filter((k) => checklistItems.some((i) => i.key === k)).length}/{checklistItems.length} complete
              </div>
            </div>
            <div className="space-y-1.5">
              {checklistItems.map((it) => {
                const done = doneKeys.has(it.key);
                return (
                  <label
                    key={it.key}
                    className={`flex items-start gap-3 rounded-lg border border-border/60 p-3 cursor-pointer transition-colors ${
                      done ? "bg-primary/5" : "hover:bg-muted/40"
                    }`}
                  >
                    <Checkbox
                      checked={done}
                      disabled={busy === it.key || readOnly}
                      onCheckedChange={(v) => toggleChecklist(it.key, !!v)}
                      className="mt-0.5"
                    />
                    <div className="min-w-0 flex-1">
                      <div className={`text-sm font-medium ${done ? "line-through text-muted-foreground" : ""}`}>
                        {it.label}
                      </div>
                      {it.description && (
                        <div className="text-xs text-muted-foreground mt-0.5">{it.description}</div>
                      )}
                    </div>
                    {busy === it.key && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                  </label>
                );
              })}
            </div>
          </section>

          {/* First-session summary */}
          <section>
            <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
              After first session
            </div>
            {!checkin && !leadEval ? (
              <div className="rounded-lg border border-dashed border-border/60 p-4 text-sm text-muted-foreground">
                No post-session data yet. The RBT and Lead RBT will submit their check-ins after the first session.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                {checkin && (
                  <div className="rounded-lg border border-border/60 p-3 space-y-1">
                    <div className="text-xs uppercase font-semibold text-muted-foreground">RBT confidence check</div>
                    <div>Confidence: <span className="font-medium">{checkin.confidence ?? "—"}</span></div>
                    <div>Support received: <span className="font-medium">{checkin.support_received ?? "—"}</span></div>
                    {checkin.safety_concern && <div className="text-destructive font-medium">⚠ Safety concern reported</div>}
                    {checkin.family_concern && <div className="text-amber-600 font-medium">Family concern reported</div>}
                    {checkin.additional_support_requested && <div className="text-amber-600">Training / support requested</div>}
                  </div>
                )}
                {leadEval && (
                  <div className="rounded-lg border border-border/60 p-3 space-y-1">
                    <div className="text-xs uppercase font-semibold text-muted-foreground">Lead RBT evaluation</div>
                    {leadEval.support_recommendation && (
                      <div>Recommendation: <span className="font-medium">{leadEval.support_recommendation}</span></div>
                    )}
                    {leadEval.notes && <div className="text-muted-foreground">{leadEval.notes}</div>}
                  </div>
                )}
              </div>
            )}
          </section>

          {/* Response options */}
          <section>
            <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
              BCBA response
            </div>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional notes for this response…"
              className="mb-3 min-h-[64px]"
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {RESPONSE_OPTIONS.map((opt) => (
                <Button
                  key={opt.key}
                  variant={opt.priority === "critical" ? "destructive" : opt.priority === "high" ? "default" : "outline"}
                  size="sm"
                  disabled={!!busy || readOnly}
                  onClick={() => submitResponse(opt)}
                  className="justify-start"
                >
                  {busy === `resp-${opt.key}` ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : opt.priority === "critical" ? (
                    <AlertTriangle className="h-4 w-4 mr-2" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                  )}
                  {opt.label}
                </Button>
              ))}
            </div>

            {followups.length > 0 && (
              <div className="mt-4">
                <div className="text-xs font-semibold uppercase text-muted-foreground mb-2">
                  Recent responses ({followups.length})
                </div>
                <div className="space-y-1.5">
                  {followups.slice(0, 4).map((f) => (
                    <div key={f.id} className="flex items-center gap-2 text-xs rounded-md border border-border/50 px-2.5 py-1.5">
                      <Badge variant={f.status === "resolved" ? "secondary" : "outline"} className="text-[10px]">
                        {f.status}
                      </Badge>
                      <span className="truncate flex-1">{f.response ?? "response"}</span>
                      <span className="text-muted-foreground">{fmtDate(f.submitted_at)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}

function Fact({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2">
      <div className="text-muted-foreground mt-0.5">{icon}</div>
      <div className="min-w-0">
        <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
        <div className="text-sm font-medium truncate">{value}</div>
      </div>
    </div>
  );
}

function BadgeIcon() {
  return <Calendar className="h-4 w-4" />;
}

/* -------------------------------------------------------------------------- */
/*  Page                                                                      */
/* -------------------------------------------------------------------------- */

export default function BcbaMyRbtsPage() {
  const qc = useQueryClient();
  const identity = useBcbaIdentity();
  const { data, isLoading, isError, error, refetch } = useMyRbtData(
    identity.scopedAuthUserId,
    identity.employeeId,
  );
  const [filter, setFilter] = useState<"all" | "new" | "concerns">("all");

  const rows = useMemo(() => {
    if (!data) return [];
    return data.assignments.filter((a: any) => {
      if (filter === "new") return !a.firstCase?.readiness_acknowledged_at;
      if (filter === "concerns") return (a.assignment.open_concerns_count ?? 0) > 0;
      return true;
    });
  }, [data, filter]);

  const invalidate = () => qc.invalidateQueries({ queryKey: ["bcba-my-rbts"] });

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
      <div className="mb-5">
        <h1 className="text-2xl font-semibold tracking-tight">My RBTs</h1>
        <p className="text-sm text-muted-foreground">
          New assignments, pre-start checklists, and post-session follow-ups.
        </p>
      </div>

      <div className="mb-4"><BcbaMappingDiagnostic onRetry={() => refetch()} /></div>

      <div className="flex items-center gap-2 mb-4">
        {(["all", "new", "concerns"] as const).map((f) => (
          <Button key={f} size="sm" variant={filter === f ? "default" : "outline"} onClick={() => setFilter(f)}>
            {f === "all" ? "All" : f === "new" ? "New RBT starting" : "Open concerns"}
          </Button>
        ))}
      </div>

      {isLoading && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground p-6">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading assignments…
        </div>
      )}
      {isError && (
        <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
          Failed to load: {(error as Error)?.message}
        </div>
      )}
      {!isLoading && !isError && rows.length === 0 && (
        <div className="rounded-2xl border border-dashed border-border/60 p-10 text-center">
          <LifeBuoy className="h-6 w-6 mx-auto text-muted-foreground mb-2" />
          <div className="font-medium">No RBTs match this view</div>
          <div className="text-sm text-muted-foreground">
            New assignments will appear here as soon as CentralReach syncs.
          </div>
        </div>
      )}

      <div className="space-y-3">
        {rows.map((row: any) => (
          <AssignmentCard
            key={row.assignment.id}
            data={row}
            checklistItems={data!.checklistItems}
            bcbaEmployeeId={data!.bcbaEmployeeId}
            onChanged={invalidate}
            readOnly={identity.readOnly}
          />
        ))}
      </div>
    </div>
  );
}