import { useMemo } from "react";
import {
  useRecruitingCandidates,
  useRecruitingInterviews,
  useRecruitingOffers,
  useRecruitingBackgroundChecks,
  useRecruitingOrientation,
  useRecruitingOnboarding,
  useRecruitingFollowups,
  daysInStage,
  fullName,
  type RecruitingCandidate as DbCandidate,
  type PipelineStage,
} from "./useRecruitingCandidates";
import type {
  RecruitingCandidate as LegacyCandidate,
  CandidateStage,
  InterviewStatus,
  OfferStatus,
  OnboardingStatus,
  ReadinessStatus,
  RecruitingRole as LegacyRole,
  RecruitingState as LegacyState,
  RecruitingSource as LegacySource,
} from "@/data/recruitingDashboard";

const STAGE_TO_LEGACY: Record<PipelineStage, CandidateStage> = {
  "New Applicant": "New Applicant",
  "Phone Screen": "Screening",
  "Interview Scheduled": "Interview Scheduled",
  "Interview Complete": "Interview Completed",
  "Offer Sent": "Offer Sent",
  "Offer Accepted": "Offer Accepted",
  "Background Check": "Background Check",
  "Orientation Scheduled": "Orientation",
  "Onboarding": "Onboarding Handoff",
  "Ready to Staff": "Ready for Staffing",
  "Staffed": "Ready for Staffing",
  "Withdrawn": "Not Qualified",
  "Rejected": "Not Qualified",
  "On Hold": "Screening",
};

function deriveInterview(scheduledAt: string | null | undefined, status: string | undefined, outcome: string | null | undefined, noShow: boolean): InterviewStatus {
  if (noShow) return "No-Show";
  if (!scheduledAt && !status) return "Not Scheduled";
  if (status === "Completed" && !outcome) return "Needs Outcome";
  if (status === "Completed") return "Completed";
  if (status === "No-Show") return "No-Show";
  if (scheduledAt) {
    const t = new Date(scheduledAt);
    const now = new Date();
    if (t.toDateString() === now.toDateString()) return "Today";
    return "Scheduled";
  }
  return status === "Cancelled" ? "Not Scheduled" : "Scheduled";
}

function deriveOffer(status: string | undefined): OfferStatus {
  switch (status) {
    case "Sent": return "Sent";
    case "Unsigned": return "Unsigned";
    case "Pending": return "Sent";
    case "Accepted": return "Accepted";
    case "Signed": return "Accepted";
    case "Declined": return "Declined";
    default: return "Not Sent";
  }
}

function deriveOnboarding(stage: PipelineStage, tasksDone: number, tasksTotal: number): OnboardingStatus {
  if (stage === "Onboarding" && tasksTotal > 0 && tasksDone === tasksTotal) return "Complete";
  if (stage === "Ready to Staff" || stage === "Staffed") return "Complete";
  if (stage === "Orientation Scheduled") return "Orientation Scheduled";
  if (stage === "Background Check") return "Background Pending";
  if (stage === "Onboarding") return "Training Assigned";
  if (stage === "Offer Accepted") return "Handoff Needed";
  return "Not Started";
}

function deriveReadiness(stage: PipelineStage): ReadinessStatus {
  if (stage === "Ready to Staff" || stage === "Staffed") return "Ready for Staffing";
  if (["Background Check", "Orientation Scheduled", "Onboarding"].includes(stage)) return "Onboarding";
  if (stage === "Offer Accepted") return "Ready This Week";
  if (stage === "On Hold" || stage === "Withdrawn" || stage === "Rejected") return "Blocked";
  return "Not Ready";
}

function deriveBg(status: string | undefined): LegacyCandidate["backgroundCheck"] {
  switch (status) {
    case "Clear":
    case "Passed":
    case "Cleared": return "Clear";
    case "Sent":
    case "Initiated": return "Sent";
    case "Pending":
    case "In Progress": return "Pending";
    case "Delayed":
    case "Flagged": return "Delayed";
    default: return "Not Sent";
  }
}

function deriveOrientation(status: string | undefined): LegacyCandidate["orientation"] {
  switch (status) {
    case "Scheduled": return "Scheduled";
    case "Completed":
    case "Attended": return "Complete";
    default: return "Not Scheduled";
  }
}

const STATES: LegacyState[] = ["GA", "NC", "VA", "TN", "MD", "NJ"];
const ROLES: LegacyRole[] = ["RBT", "BCBA"];

function coerceState(s: string): LegacyState {
  return (STATES.includes(s as LegacyState) ? s : "GA") as LegacyState;
}
function coerceRole(r: string): LegacyRole {
  return (ROLES.includes(r as LegacyRole) ? r : "RBT") as LegacyRole;
}
function coerceSource(s: string | null): LegacySource {
  const map: Record<string, LegacySource> = {
    Apploi: "Apploi", Indeed: "Indeed", Website: "Website",
    Email: "Email", Phone: "Phone", Referral: "Referral",
  };
  return map[s ?? ""] ?? "Apploi";
}

export function useLegacyRecruitingCandidates(): LegacyCandidate[] {
  const { candidates } = useRecruitingCandidates();
  const { items: interviews } = useRecruitingInterviews();
  const { items: offers } = useRecruitingOffers();
  const { items: bgChecks } = useRecruitingBackgroundChecks();
  const { items: orientation } = useRecruitingOrientation();
  const { items: onbTasks } = useRecruitingOnboarding();
  const { items: followups } = useRecruitingFollowups();

  return useMemo(() => {
    const ivByCand = new Map<string, typeof interviews[number]>();
    interviews.forEach((iv) => {
      const cur = ivByCand.get(iv.candidate_id);
      if (!cur) { ivByCand.set(iv.candidate_id, iv); return; }
      const a = iv.scheduled_at ? new Date(iv.scheduled_at).getTime() : 0;
      const b = cur.scheduled_at ? new Date(cur.scheduled_at).getTime() : 0;
      if (a > b) ivByCand.set(iv.candidate_id, iv);
    });
    const offerByCand = new Map<string, typeof offers[number]>();
    offers.forEach((o) => {
      const cur = offerByCand.get(o.candidate_id);
      if (!cur) { offerByCand.set(o.candidate_id, o); return; }
      const a = o.sent_at ? new Date(o.sent_at).getTime() : 0;
      const b = cur.sent_at ? new Date(cur.sent_at).getTime() : 0;
      if (a > b) offerByCand.set(o.candidate_id, o);
    });
    const bgByCand = new Map<string, typeof bgChecks[number]>();
    bgChecks.forEach((b) => bgByCand.set(b.candidate_id, b));
    const oriByCand = new Map<string, typeof orientation[number]>();
    orientation.forEach((o) => oriByCand.set(o.candidate_id, o));
    const tasksByCand = new Map<string, typeof onbTasks>();
    onbTasks.forEach((t) => {
      const arr = tasksByCand.get(t.candidate_id) ?? [];
      arr.push(t);
      tasksByCand.set(t.candidate_id, arr);
    });
    const followsByCand = new Map<string, typeof followups>();
    followups.forEach((f) => {
      if (!f.candidate_id) return;
      const arr = followsByCand.get(f.candidate_id) ?? [];
      arr.push(f);
      followsByCand.set(f.candidate_id, arr);
    });

    return candidates.map<LegacyCandidate | null>((c: DbCandidate) => {
      try {
      const iv = ivByCand.get(c.id);
      const off = offerByCand.get(c.id);
      const bg = bgByCand.get(c.id);
      const ori = oriByCand.get(c.id);
      const tasks = tasksByCand.get(c.id) ?? [];
      const fups = followsByCand.get(c.id) ?? [];
      const tasksDone = tasks.filter((t) => t.completed).length;
      const noShow = iv?.status === "No-Show";
      const stage = c.pipeline_stage;

      const onbStatus = deriveOnboarding(stage, tasksDone, tasks.length);
      const trainingDone = tasks.filter((t) => (t.category ?? "").toLowerCase().includes("train"));
      const training: LegacyCandidate["training"] =
        trainingDone.length === 0 ? "Not Assigned"
        : trainingDone.every((t) => t.completed) ? "Complete"
        : trainingDone.some((t) => t.completed) ? "Incomplete"
        : "Assigned";

      const i9Task = tasks.find((t) => t.task_key === "i9" || /i-?9/i.test(t.title));
      const everifyTask = tasks.find((t) => t.task_key === "everify" || /verify/i.test(t.title));
      const viventiumTask = tasks.find((t) => t.task_key === "viventium" || /viventium/i.test(t.title));
      const crTask = tasks.find((t) => t.task_key === "centralreach" || /central.?reach/i.test(t.title));

      const viventium: LegacyCandidate["viventium"] = viventiumTask
        ? (viventiumTask.completed ? "Complete" : "Sent")
        : (["Onboarding", "Ready to Staff", "Staffed"].includes(stage) ? "Sent" : "Not Started");

      const i9: LegacyCandidate["i9"] = i9Task ? (i9Task.completed ? "Complete" : "Incomplete") : "Not Started";
      const everify: LegacyCandidate["everify"] = everifyTask ? (everifyTask.completed ? "Complete" : "Incomplete") : "Not Started";
      const centralReach: LegacyCandidate["centralReach"] = crTask
        ? (crTask.completed ? "Active" : "Requested")
        : (["Ready to Staff", "Staffed"].includes(stage) ? "Active" : "Needed");

      const days = daysInStage(c);
      const tags = Array.isArray(c.tags) ? c.tags : [];
      const blockers: string[] = [];
      fups.filter((f) => f.status !== "Done").forEach((f) => blockers.push(f.title));
      if (off?.status === "Unsigned" && days >= 2) blockers.push("Offer unsigned");
      if (bg?.status === "Delayed" || bg?.status === "Flagged") blockers.push(`Background ${bg.status}${bg.blocker ? `: ${bg.blocker}` : ""}`);
      if (stage === "On Hold") blockers.push("Candidate on hold");
      if (noShow) blockers.push("Interview no-show");
      if (days >= 10) blockers.push(`Stalled ${days}d in ${stage}`);

      const role = coerceRole(c.role);
      const eligibility: LegacyCandidate["eligibility"] =
        stage === "Rejected" || stage === "Withdrawn" ? "Not Eligible"
        : stage === "New Applicant" || stage === "Phone Screen" || stage === "On Hold" ? "Review"
        : "Eligible";

      const screening: LegacyCandidate["screeningOutcome"] =
        stage === "Rejected" ? "Fail"
        : ["New Applicant", "Phone Screen"].includes(stage) ? "Pending"
        : "Pass";

      const certification: LegacyCandidate["certification"] =
        role === "BCBA" ? "Verified"
        : role === "RBT" ? (["Ready to Staff", "Staffed"].includes(stage) ? "Verified" : "Pending")
        : "Not Required";

      const bacb: LegacyCandidate["bacbCheck"] =
        role === "BCBA" ? (["Ready to Staff", "Staffed", "Onboarding"].includes(stage) ? "Clear" : "Pending")
        : "N/A";

      return {
        id: c.id,
        name: fullName(c),
        role,
        state: coerceState(c.state),
        region: c.city ?? c.state,
        city: c.city ?? "",
        source: coerceSource(c.source),
        recruiter: c.recruiter ?? "Unassigned",
        interviewer: iv?.panel ?? "TBD",
        candidateStatus: STAGE_TO_LEGACY[stage] ?? "Screening",
        interviewStatus: deriveInterview(iv?.scheduled_at, iv?.status, iv?.outcome, noShow),
        offerStatus: deriveOffer(off?.status),
        onboardingStatus: onbStatus,
        readinessStatus: deriveReadiness(stage),
        appliedDate: c.applied_date,
        daysInStage: days,
        nextAction: c.next_action ?? `Continue ${stage}`,
        resume: c.resume_url ? "Received" : "Missing",
        certification,
        bacbCheck: bacb,
        kidsExperience: tags.includes("High") ? "High" : tags.includes("Entry") ? "Entry" : "Moderate",
        screeningOutcome: screening,
        eligibility,
        notQualifiedReason: stage === "Rejected" || stage === "Withdrawn" ? (c.notes ?? undefined) : undefined,
        interviewAt: iv?.scheduled_at ?? undefined,
        interviewNotes: iv?.notes ?? (iv ? "Notes pending." : "No interview yet."),
        noShow,
        offerSentAt: off?.sent_at ?? undefined,
        payRate: off?.hourly_rate ?? undefined,
        followUps: fups.map((f) => f.title),
        viventium,
        backgroundCheck: deriveBg(bg?.status),
        orientation: deriveOrientation(ori?.status),
        training,
        i9,
        everify,
        centralReach,
        availability: tags.find((t) => /hrs|hours|week|day|am|pm/i.test(t)) ?? "Flexible",
        travelRadius: 20,
        preferredHours: tags.find((t) => /\d+\s*hrs?/i.test(t)) ?? "25 hrs/week",
        blockers: blockers ?? [],
        tasks: tasks.map((t) => ({
          id: t.id,
          title: t.title,
          owner: c.recruiter ?? "Recruiter",
          due: t.due_date ?? "—",
          completed: t.completed,
        })),
        timeline: [
          { id: `${c.id}-applied`, date: c.applied_date, title: "Applied", detail: `Application received from ${c.source ?? "Apploi"}.`, actor: "Intake", type: "system" as const },
          ...(iv?.scheduled_at ? [{ id: `${c.id}-iv`, date: iv.scheduled_at, title: "Interview", detail: `Status: ${iv.status}.`, actor: iv.panel ?? "Interviewer", type: "milestone" as const }] : []),
          ...(off?.sent_at ? [{ id: `${c.id}-off`, date: off.sent_at, title: "Offer", detail: `Status: ${off.status}.`, actor: c.recruiter ?? "Recruiter", type: "milestone" as const }] : []),
          ...(bg?.initiated_at ? [{ id: `${c.id}-bg`, date: bg.initiated_at, title: "Background check", detail: `Status: ${bg.status}.`, actor: bg.vendor ?? "Vendor", type: bg.status === "Delayed" || bg.status === "Flagged" ? "alert" as const : "system" as const }] : []),
        ],
      };
      } catch (err) {
        // Never let one malformed candidate blank the whole page.
        // eslint-disable-next-line no-console
        console.error("[useLegacyRecruitingCandidates] skipping candidate", c?.id, err);
        return null;
      }
    }).filter((x): x is LegacyCandidate => x !== null);
  }, [candidates, interviews, offers, bgChecks, orientation, onbTasks, followups]);
}
