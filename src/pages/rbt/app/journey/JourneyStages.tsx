import { Link } from "react-router-dom";
import { Check, Circle, Clock, ChevronRight } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useRbtIdentity } from "../useRbtIdentity";
import { useReadiness } from "../readiness/useReadiness";
import { isReadinessDone } from "../readiness/types";
import { useProgram } from "../training/useProgram";
import { useFirstCase } from "../firstcase/useFirstCase";

export type StageStatus = "complete" | "active" | "upcoming";

export interface JourneyStage {
  key: string;
  label: string;
  helper: string;
  to: string;
  status: StageStatus;
}

/** The nine stages of the Blossom RBT journey, in order. */
export const JOURNEY_STAGE_KEYS = [
  "hr_onboarding",
  "experience_path",
  "academy",
  "competency_readiness",
  "centralreach_setup",
  "field_readiness",
  "first_client_pairing",
  "first_two_weeks",
  "growth_30_60_90",
] as const;

/**
 * Derives the nine journey stages from the data that already governs them:
 * readiness gates (HR, training, clinical, CentralReach, scheduling), the
 * assigned pathway, the first case record and the 90-day check-ins.
 * Nothing here is decorative — every stage links to the page that moves it.
 *
 * Clinical documentation and session data stay in CentralReach; this rail only
 * reflects operational readiness.
 */
export function buildJourneyStages(input: {
  gateDone: (key: string) => boolean;
  pathwayName: string | null;
  programPercent: number;
  programComplete: boolean;
  hasFirstCase: boolean;
  firstSessionDone: boolean;
  checkinsDone: number;
  checkinsTotal: number;
}): JourneyStage[] {
  const {
    gateDone, pathwayName, programPercent, programComplete,
    hasFirstCase, firstSessionDone, checkinsDone, checkinsTotal,
  } = input;

  const hr = ["employment_onboarding_complete", "background_check_cleared", "required_documents_complete"].every(gateDone);
  const competency = ["competency_complete", "bcba_signoff_complete", "readiness_evaluation_complete"].every(gateDone);
  const cr = gateDone("centralreach_access_active");
  const field = gateDone("availability_confirmed") && gateDone("staffing_approval_complete");

  const raw: Array<Omit<JourneyStage, "status"> & { done: boolean; started: boolean }> = [
    { key: "hr_onboarding", label: "HR onboarding", helper: "Paperwork, background check and documents.", to: "/rbt/app/readiness", done: hr, started: true },
    { key: "experience_path", label: "Your experience path", helper: pathwayName ?? "Assigned from your certification and experience.", to: "/rbt/app/program", done: Boolean(pathwayName), started: true },
    { key: "academy", label: "Blossom Academy", helper: `Training progress ${programPercent}%.`, to: "/rbt/app/learn", done: programComplete, started: programPercent > 0 },
    { key: "competency_readiness", label: "Competency & readiness", helper: "Skills, documentation and BCBA signoff.", to: "/rbt/app/readiness", done: competency, started: programPercent > 0 },
    { key: "centralreach_setup", label: "CentralReach setup", helper: "Your clinical system access.", to: "/rbt/app/readiness", done: cr, started: hr },
    { key: "field_readiness", label: "Field readiness", helper: "Availability confirmed and approved to staff.", to: "/rbt/app/staffing", done: field, started: competency },
    { key: "first_client_pairing", label: "First client pairing", helper: "Your first case and first session.", to: "/rbt/app/first-case", done: firstSessionDone, started: hasFirstCase },
    { key: "first_two_weeks", label: "First two weeks", helper: "Early check-ins with your team.", to: "/rbt/app/journey", done: checkinsDone > 0 && checkinsDone >= Math.min(2, checkinsTotal), started: hasFirstCase },
    { key: "growth_30_60_90", label: "30 / 60 / 90 growth", helper: "Where you're heading next.", to: "/rbt/app/growth", done: checkinsTotal > 0 && checkinsDone >= checkinsTotal, started: checkinsDone > 0 },
  ];

  let activeAssigned = false;
  return raw.map((s) => {
    let status: StageStatus;
    if (s.done) status = "complete";
    else if (!activeAssigned && s.started) { status = "active"; activeAssigned = true; }
    else status = "upcoming";
    return { key: s.key, label: s.label, helper: s.helper, to: s.to, status };
  });
}

export function JourneyStages({ checkinsDone, checkinsTotal }: { checkinsDone: number; checkinsTotal: number }) {
  const { user } = useAuth();
  const { employeeId } = useRbtIdentity();
  const { rows: readinessRows } = useReadiness(user?.id ?? null);
  const { pathway, stats } = useProgram(employeeId);
  const { cases } = useFirstCase(employeeId);

  const doneKeys = new Set((readinessRows ?? []).filter((r) => isReadinessDone(r.state.status)).map((r) => r.gate.key));
  const stages = buildJourneyStages({
    gateDone: (k) => doneKeys.has(k),
    pathwayName: pathway?.name ?? null,
    programPercent: stats.percent,
    programComplete: stats.total > 0 && stats.complete === stats.total,
    hasFirstCase: Boolean(cases?.length),
    firstSessionDone: Boolean(cases?.some((c) => c.status === "first_session_done")),
    checkinsDone,
    checkinsTotal,
  });

  return (
    <section className="rounded-3xl border border-border/70 bg-card p-5">
      <p className="text-xs uppercase tracking-widest text-muted-foreground">Your Blossom journey</p>
      <p className="mt-1 text-sm text-muted-foreground">Every stage from your first day to your first 90 days.</p>
      <ol className="mt-3 divide-y divide-border/70">
        {stages.map((s) => (
          <li key={s.key}>
            <Link
              to={s.to}
              data-testid="rbt-journey-stage"
              data-stage={s.key}
              className="flex items-center gap-3 py-3 hover:bg-muted/40 rounded-xl px-1 transition"
            >
              <span className={`h-7 w-7 shrink-0 rounded-full border-2 flex items-center justify-center ${
                s.status === "complete" ? "bg-primary border-primary text-primary-foreground"
                : s.status === "active" ? "border-primary text-primary"
                : "border-border text-muted-foreground"}`}>
                {s.status === "complete" ? <Check className="h-3.5 w-3.5" />
                  : s.status === "active" ? <Clock className="h-3.5 w-3.5" />
                  : <Circle className="h-3 w-3" />}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate">{s.label}</p>
                <p className="text-xs text-muted-foreground truncate">{s.helper}</p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </Link>
          </li>
        ))}
      </ol>
      <p className="mt-2 text-xs text-muted-foreground">
        Session notes and clinical data stay in CentralReach.
      </p>
    </section>
  );
}