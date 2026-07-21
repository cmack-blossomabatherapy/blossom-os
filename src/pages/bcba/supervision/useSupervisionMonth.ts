import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
// Auth is provided by the caller via `scopedAuthUserId` so preview mode scopes
// to the previewed BCBA rather than the admin session.
import {
  computeStatus, escalationLevelFor, monthKey, monthBounds,
  requiredSupervisionMinutes, daysLeftInMonth,
  type SupervisionStatus, type EscalationLevel,
} from "./supervisionLogic";

export interface SupervisionRow {
  rbtEmployeeId: string;
  rbtName: string;
  assignedClientCount: number;
  clientNames: string[];
  serviceHoursThisMonth: number;
  requiredMinutes: number;
  completedMinutes: number;
  individualContacts: number;
  groupContacts: number;
  observationCompleted: boolean;
  lastSupervisionDate: string | null;
  nextSupervisionDate: string | null;
  remainingMinutes: number;
  status: SupervisionStatus;
  missingDocumentation: string[];
  actionRequired: string;
  hasSupervisionPlan: boolean;
  openEscalationLevel: EscalationLevel | null;
}

/**
 * Loads this month's supervision picture for every RBT assigned to the
 * current BCBA. Combines rbt_client_assignments (source of truth),
 * rbt_sessions (RBT-facing hours) and bcba_supervision_logs (BCBA records).
 */
export function useSupervisionMonth(
  scopedAuthUserId: string | null,
  date: Date = new Date(),
) {
  const uid = scopedAuthUserId ?? null;
  const mKey = monthKey(date);
  const { start, end } = useMemo(() => monthBounds(date), [date]);
  const daysLeft = daysLeftInMonth(date);

  return useQuery({
    queryKey: ["bcba-supervision-month", uid, mKey],
    enabled: !!uid,
    queryFn: async (): Promise<{ rows: SupervisionRow[]; monthKey: string }> => {
      const startIso = start.toISOString();
      const endIso   = end.toISOString();
      const startDate = start.toISOString().slice(0, 10);
      const endDate   = end.toISOString().slice(0, 10);

      const { data: assignments, error: aErr } = await supabase
        .from("rbt_client_assignments")
        .select("rbt_employee_id,client_name,client_id,supervision_plan,status")
        .eq("assigned_bcba_id", uid!)
        .neq("status", "ended");
      if (aErr) throw aErr;

      const rbtIds = Array.from(
        new Set((assignments ?? []).map(a => a.rbt_employee_id).filter(Boolean)),
      ) as string[];
      if (rbtIds.length === 0) return { rows: [], monthKey: mKey };

      const [empR, sessionsR, supR, escR] = await Promise.all([
        supabase.from("employees").select("id,first_name,last_name").in("id", rbtIds),
        supabase.from("rbt_sessions")
          .select("rbt_employee_id,session_date,start_time,end_time,session_status")
          .in("rbt_employee_id", rbtIds)
          .gte("session_date", startDate).lt("session_date", endDate),
        supabase.from("bcba_supervision_logs")
          .select("id,provider_id,occurred_at,minutes,individual_or_group,observation_completed,next_supervision_date,bcba_signed_at,rbt_acknowledged_at,feedback,cases_discussed")
          .in("provider_id", rbtIds)
          .gte("occurred_at", startIso).lt("occurred_at", endIso)
          .order("occurred_at", { ascending: false }),
        supabase.from("bcba_supervision_escalations")
          .select("rbt_employee_id,level,status")
          .eq("month_key", mKey).eq("status", "open")
          .in("rbt_employee_id", rbtIds),
      ]);

      const empMap = new Map(
        (empR.data ?? []).map((e: any) => [e.id, `${e.first_name ?? ""} ${e.last_name ?? ""}`.trim() || "Unnamed"]),
      );

      // Aggregate assignments per RBT
      const perRbt = new Map<string, {
        clientNames: Set<string>; hasPlan: boolean;
      }>();
      for (const a of (assignments ?? [])) {
        const id = a.rbt_employee_id as string;
        if (!id) continue;
        const bucket = perRbt.get(id) ?? { clientNames: new Set(), hasPlan: false };
        if (a.client_name) bucket.clientNames.add(a.client_name);
        if (a.supervision_plan && a.supervision_plan.trim().length > 0) bucket.hasPlan = true;
        perRbt.set(id, bucket);
      }

      // Service hours from RBT sessions
      const hoursMap = new Map<string, number>();
      for (const s of (sessionsR.data ?? [])) {
        if (s.session_status && String(s.session_status).toLowerCase().includes("cancel")) continue;
        const id = s.rbt_employee_id as string;
        // Derive minutes from start/end if present
        let mins = 0;
        if (s.start_time && s.end_time) {
          try {
            const [sh, sm] = String(s.start_time).split(":").map(Number);
            const [eh, em] = String(s.end_time).split(":").map(Number);
            mins = Math.max(0, (eh * 60 + em) - (sh * 60 + sm));
          } catch { mins = 0; }
        }
        hoursMap.set(id, (hoursMap.get(id) ?? 0) + mins);
      }

      // Supervision aggregates
      const supAgg = new Map<string, {
        minutes: number; individual: number; group: number; observation: boolean;
        last: string | null; next: string | null;
      }>();
      for (const s of (supR.data ?? [])) {
        const id = s.provider_id as string;
        if (!id) continue;
        const b = supAgg.get(id) ?? { minutes: 0, individual: 0, group: 0, observation: false, last: null, next: null };
        b.minutes += s.minutes ?? 0;
        if (s.individual_or_group === "group") b.group += 1; else b.individual += 1;
        if (s.observation_completed) b.observation = true;
        if (!b.last || (s.occurred_at && s.occurred_at > b.last)) b.last = s.occurred_at;
        if (s.next_supervision_date && (!b.next || s.next_supervision_date > b.next)) b.next = s.next_supervision_date;
        supAgg.set(id, b);
      }

      // Escalations by RBT
      const escMap = new Map<string, EscalationLevel>();
      for (const e of (escR.data ?? [])) {
        escMap.set(e.rbt_employee_id as string, e.level as EscalationLevel);
      }

      const rows: SupervisionRow[] = rbtIds.map(id => {
        const meta   = perRbt.get(id) ?? { clientNames: new Set<string>(), hasPlan: false };
        const totalMin = hoursMap.get(id) ?? 0;
        const hours    = totalMin / 60;
        const required = requiredSupervisionMinutes(hours);
        const sup      = supAgg.get(id) ?? { minutes: 0, individual: 0, group: 0, observation: false, last: null, next: null };
        const remaining = Math.max(0, required - sup.minutes);
        const lastDaysAgo = sup.last
          ? Math.floor((Date.now() - new Date(sup.last).getTime()) / 86_400_000)
          : null;

        const status = computeStatus({
          requiredMinutes: required,
          completedMinutes: sup.minutes,
          individualContacts: sup.individual,
          observationCompleted: sup.observation,
          lastSupervisionDaysAgo: lastDaysAgo,
          hasSupervisionPlan: meta.hasPlan,
          hasOpenLeadershipFlag: escMap.get(id) === "leadership_visible" || escMap.get(id) === "escalation_task",
          daysLeftInMonth: daysLeft,
        });

        const missing: string[] = [];
        if (sup.individual === 0)       missing.push("Individual contact");
        if (!sup.observation)           missing.push("Observation");
        if (remaining > 0)              missing.push(`${remaining} min remaining`);
        if (!meta.hasPlan)              missing.push("Supervision plan");

        let action = "None";
        if (status === "completed")          action = "None — logged";
        else if (status === "leadership_review") action = "Leadership review open";
        else if (status === "at_risk")       action = "Schedule supervision this week";
        else if (status === "due_soon")      action = "Book contact in the next few days";
        else if (status === "plan_needed")   action = "Create a supervision plan";
        else                                  action = "Continue plan";

        return {
          rbtEmployeeId: id,
          rbtName: empMap.get(id) ?? "Unnamed",
          assignedClientCount: meta.clientNames.size,
          clientNames: Array.from(meta.clientNames),
          serviceHoursThisMonth: Math.round(hours * 10) / 10,
          requiredMinutes: required,
          completedMinutes: sup.minutes,
          individualContacts: sup.individual,
          groupContacts: sup.group,
          observationCompleted: sup.observation,
          lastSupervisionDate: sup.last,
          nextSupervisionDate: sup.next,
          remainingMinutes: remaining,
          status,
          missingDocumentation: missing,
          actionRequired: action,
          hasSupervisionPlan: meta.hasPlan,
          openEscalationLevel: escMap.get(id) ?? null,
        };
      });

      // Best-effort escalation refresh — upsert the right level per row
      const upserts = rows
        .map(r => {
          const lvl = escalationLevelFor(r.status, daysLeft);
          if (!lvl) return null;
          return {
            rbt_employee_id: r.rbtEmployeeId,
            bcba_id: uid!,
            month_key: mKey,
            level: lvl,
            status: "open",
            reason: r.actionRequired,
          };
        })
        .filter(Boolean) as any[];
      if (upserts.length) {
        // Ignore failure — the dashboard still works if this write is denied
        await supabase
          .from("bcba_supervision_escalations")
          .upsert(upserts, { onConflict: "rbt_employee_id,month_key,level", ignoreDuplicates: true });
      }

      // Resolve escalations for completed rows
      const completedIds = rows.filter(r => r.status === "completed").map(r => r.rbtEmployeeId);
      if (completedIds.length) {
        await supabase
          .from("bcba_supervision_escalations")
          .update({ status: "resolved", resolved_at: new Date().toISOString() })
          .in("rbt_employee_id", completedIds)
          .eq("month_key", mKey)
          .eq("status", "open");
      }

      return { rows, monthKey: mKey };
    },
  });
}