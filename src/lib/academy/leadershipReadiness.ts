import type {
  AcademyModule,
  AcademyProgress,
  AcademyShadowSession,
  AcademyCheckin,
  AcademyEnrollment,
} from "./types";

/**
 * State Director leadership readiness helpers.
 *
 * Pure, display-only derivations from existing academy data. No DB schema
 * changes — values are computed from modules / progress / shadow sessions
 * / mentor check-ins.
 */

export type ReadinessStatus =
  | "complete"
  | "in_progress"
  | "missing"
  | "blocked"
  | "not_started";

export interface ReadinessCategory {
  key: SDReadinessCategoryKey;
  label: string;
  completion: number; // 0-100 (display-only)
  status: ReadinessStatus;
  explanation: string;
}

export type SDReadinessCategoryKey =
  | "foundations"
  | "systems_client_flow"
  | "authorizations_utilization"
  | "staffing_recruiting_operations"
  | "state_ownership_leadership"
  | "shadowing"
  | "mentor_checkins"
  | "final_signoff";

export const SD_CATEGORY_LABELS: Record<SDReadinessCategoryKey, string> = {
  foundations: "Foundations",
  systems_client_flow: "Systems & Client Flow",
  authorizations_utilization: "Authorizations & Utilization",
  staffing_recruiting_operations: "Staffing / Recruiting / Operations",
  state_ownership_leadership: "State Ownership & Leadership",
  shadowing: "Shadowing",
  mentor_checkins: "Mentor Check-ins",
  final_signoff: "Final Sign-Off",
};

// Heuristic mapping of week_number -> SD category. The State Director journey
// is a 5-week structure (Pass 1). We split the weeks across the operational
// categories so display-only readiness can be derived without new schema.
const WEEK_CATEGORY: Record<number, SDReadinessCategoryKey> = {
  1: "foundations",
  2: "systems_client_flow",
  3: "authorizations_utilization",
  4: "staffing_recruiting_operations",
  5: "state_ownership_leadership",
};

export interface SDReadinessInput {
  modules: AcademyModule[];
  progress: AcademyProgress[];
  shadowSessions: AcademyShadowSession[];
  checkins: AcademyCheckin[];
  weeksByModuleId: Map<string, number>; // module_id -> week_number
}

function statusFromPct(pct: number, anyStarted: boolean): ReadinessStatus {
  if (pct >= 100) return "complete";
  if (pct > 0 || anyStarted) return "in_progress";
  return "not_started";
}

export function computeSDReadinessCategories(
  input: SDReadinessInput,
): ReadinessCategory[] {
  const completedSet = new Set(
    input.progress.filter((p) => p.status === "completed").map((p) => p.module_id),
  );
  const startedSet = new Set(
    input.progress
      .filter((p) => p.status !== "locked" && p.status !== "available")
      .map((p) => p.module_id),
  );

  const byCategory = new Map<SDReadinessCategoryKey, AcademyModule[]>();
  for (const m of input.modules) {
    const wk = input.weeksByModuleId.get(m.id);
    const cat = wk ? WEEK_CATEGORY[wk] : undefined;
    if (!cat) continue;
    const arr = byCategory.get(cat) ?? [];
    arr.push(m);
    byCategory.set(cat, arr);
  }

  const cats: ReadinessCategory[] = [];

  for (const key of [
    "foundations",
    "systems_client_flow",
    "authorizations_utilization",
    "staffing_recruiting_operations",
    "state_ownership_leadership",
  ] as SDReadinessCategoryKey[]) {
    const mods = byCategory.get(key) ?? [];
    const required = mods.filter((m) => m.is_required);
    const total = required.length;
    const done = required.filter((m) => completedSet.has(m.id)).length;
    const started = required.some((m) => startedSet.has(m.id));
    const pct = total === 0 ? 0 : Math.round((done / total) * 100);
    cats.push({
      key,
      label: SD_CATEGORY_LABELS[key],
      completion: pct,
      status: total === 0 ? "not_started" : statusFromPct(pct, started),
      explanation:
        total === 0
          ? "No modules linked yet for this category."
          : `${done} of ${total} required modules complete.`,
    });
  }

  // Shadowing — prefer shadowing-typed modules, fall back to shadow_sessions.
  const shadowMods = input.modules.filter(
    (m) => m.module_type === "shadowing" && m.is_required,
  );
  const shadowDone = shadowMods.filter((m) => completedSet.has(m.id)).length;
  const totalShadowHrs = input.shadowSessions.reduce(
    (a, x) => a + Number(x.hours || 0),
    0,
  );
  const shadowPct =
    shadowMods.length > 0
      ? Math.round((shadowDone / shadowMods.length) * 100)
      : Math.min(100, Math.round((totalShadowHrs / 8) * 100));
  cats.push({
    key: "shadowing",
    label: SD_CATEGORY_LABELS.shadowing,
    completion: shadowPct,
    status:
      shadowPct >= 100
        ? "complete"
        : shadowPct > 0
          ? "in_progress"
          : "missing",
    explanation:
      shadowMods.length > 0
        ? `${shadowDone} of ${shadowMods.length} shadow modules complete.`
        : `${totalShadowHrs.toFixed(1)} hours of shadowing logged (target 8h).`,
  });

  // Mentor check-ins — require at least 3 logged sessions for full credit.
  const checkinTarget = 3;
  const checkinPct = Math.min(
    100,
    Math.round((input.checkins.length / checkinTarget) * 100),
  );
  cats.push({
    key: "mentor_checkins",
    label: SD_CATEGORY_LABELS.mentor_checkins,
    completion: checkinPct,
    status:
      input.checkins.length === 0
        ? "missing"
        : checkinPct >= 100
          ? "complete"
          : "in_progress",
    explanation: `${input.checkins.length} of ${checkinTarget} mentor check-ins logged.`,
  });

  // Final sign-off — derived from any shadow session marked mentor_signoff.
  const signedOff = input.shadowSessions.some((s) => s.mentor_signoff);
  cats.push({
    key: "final_signoff",
    label: SD_CATEGORY_LABELS.final_signoff,
    completion: signedOff ? 100 : 0,
    status: signedOff ? "complete" : "not_started",
    explanation: signedOff
      ? "Mentor sign-off recorded."
      : "Awaiting leadership sign-off.",
  });

  return cats;
}

export interface LaunchChecklistItem {
  key: string;
  label: string;
  status: ReadinessStatus;
  explanation: string;
  source: "module" | "progress" | "shadow" | "checkin" | "manual";
}

export function computeLaunchChecklist(
  cats: ReadinessCategory[],
  ctx: {
    welcomeComplete: boolean;
    readinessPct: number;
    checkinCount: number;
  },
): LaunchChecklistItem[] {
  const byKey = new Map(cats.map((c) => [c.key, c]));
  const fromCat = (
    key: SDReadinessCategoryKey,
    label: string,
    source: LaunchChecklistItem["source"] = "module",
  ): LaunchChecklistItem => {
    const c = byKey.get(key);
    return {
      key,
      label,
      status: c?.status ?? "not_started",
      explanation: c?.explanation ?? "Not started.",
      source,
    };
  };

  const finalKnowledge = byKey.get("state_ownership_leadership");
  const knowledgeStatus: ReadinessStatus =
    finalKnowledge?.completion === 100 ? "complete" : "not_started";

  return [
    {
      key: "welcome",
      label: "Welcome to Blossom complete",
      status: ctx.welcomeComplete ? "complete" : "not_started",
      explanation: ctx.welcomeComplete
        ? "Welcome module reviewed."
        : "Welcome to Blossom not yet completed.",
      source: "progress",
    },
    fromCat("foundations", "Week 1 foundations complete"),
    fromCat("systems_client_flow", "Systems / client flow complete"),
    fromCat(
      "authorizations_utilization",
      "Authorizations / utilization complete",
    ),
    fromCat(
      "staffing_recruiting_operations",
      "Staffing / recruiting / operations complete",
    ),
    fromCat("state_ownership_leadership", "State ownership / leadership complete"),
    fromCat("shadowing", "Required shadowing complete", "shadow"),
    fromCat("mentor_checkins", "Required mentor check-ins complete", "checkin"),
    {
      key: "final_knowledge",
      label: "Final knowledge review complete",
      status: knowledgeStatus,
      explanation:
        knowledgeStatus === "complete"
          ? "Leadership modules complete — knowledge review ready."
          : "Pending completion of leadership modules.",
      source: "module",
    },
    {
      key: "readiness_assessment",
      label: "Readiness assessment complete",
      status:
        ctx.readinessPct >= 80
          ? "complete"
          : ctx.readinessPct >= 50
            ? "in_progress"
            : "not_started",
      explanation: `Overall readiness ${ctx.readinessPct}% (target 80%).`,
      source: "progress",
    },
    fromCat("final_signoff", "Leadership sign-off complete", "manual"),
    {
      key: "certification",
      label: "State Director certification complete",
      status:
        byKey.get("final_signoff")?.status === "complete" &&
        ctx.readinessPct >= 80
          ? "complete"
          : "not_started",
      explanation:
        byKey.get("final_signoff")?.status === "complete" &&
        ctx.readinessPct >= 80
          ? "Certified — ready to lead state."
          : "Pending readiness ≥ 80% and leadership sign-off.",
      source: "manual",
    },
  ];
}

export type RiskSignal =
  | "no_activity_3d"
  | "week_behind_schedule"
  | "missing_shadowing"
  | "missing_mentor_checkin"
  | "signoff_pending"
  | "low_readiness"
  | "required_modules_incomplete";

export const RISK_LABEL: Record<RiskSignal, string> = {
  no_activity_3d: "No activity 3+ days",
  week_behind_schedule: "Current week behind schedule",
  missing_shadowing: "Missing shadowing",
  missing_mentor_checkin: "Missing mentor check-in",
  signoff_pending: "Final sign-off pending",
  low_readiness: "Readiness below threshold",
  required_modules_incomplete: "Required modules incomplete",
};

export function computeRiskSignals(input: {
  progress: AcademyProgress[];
  shadowSessions: AcademyShadowSession[];
  checkins: AcademyCheckin[];
  cats: ReadinessCategory[];
  readinessPct: number;
  enrollment: AcademyEnrollment;
  weeksByModuleId: Map<string, number>;
  expectedWeekNumber: number;
}): RiskSignal[] {
  const risks: RiskSignal[] = [];

  const latest = input.progress
    .map((p) => p.completed_at ?? p.started_at)
    .filter(Boolean)
    .map((d) => new Date(d as string).getTime())
    .sort((a, b) => b - a)[0];
  const lastShadow = input.shadowSessions[0]?.session_date
    ? new Date(input.shadowSessions[0].session_date).getTime()
    : 0;
  const lastCheckin = input.checkins[0]?.meeting_date
    ? new Date(input.checkins[0].meeting_date).getTime()
    : 0;
  const lastActivity = Math.max(latest ?? 0, lastShadow, lastCheckin);
  if (lastActivity > 0 && Date.now() - lastActivity > 3 * 24 * 3600 * 1000) {
    risks.push("no_activity_3d");
  }

  const shadowCat = input.cats.find((c) => c.key === "shadowing");
  if (shadowCat && shadowCat.completion < 100) risks.push("missing_shadowing");

  if (input.checkins.length === 0) risks.push("missing_mentor_checkin");

  const signoff = input.cats.find((c) => c.key === "final_signoff");
  if (signoff && signoff.status !== "complete") risks.push("signoff_pending");

  if (input.readinessPct < 50) risks.push("low_readiness");

  const currentCatKey = WEEK_CATEGORY[input.expectedWeekNumber];
  if (currentCatKey) {
    const currentCat = input.cats.find((c) => c.key === currentCatKey);
    if (currentCat && currentCat.completion < 100) {
      risks.push("week_behind_schedule");
    }
  }

  const anyRequiredIncomplete = input.cats.some(
    (c) =>
      ["foundations", "systems_client_flow", "authorizations_utilization", "staffing_recruiting_operations", "state_ownership_leadership"].includes(
        c.key,
      ) && c.completion < 100,
  );
  if (anyRequiredIncomplete) risks.push("required_modules_incomplete");

  return risks;
}

export function buildReadinessSummaryText(opts: {
  traineeName: string;
  state: string;
  readinessPct: number;
  cats: ReadinessCategory[];
  checklist: LaunchChecklistItem[];
  risks: RiskSignal[];
  nextAction: string;
}): string {
  const missing = opts.checklist.filter((c) => c.status !== "complete");
  const lines = [
    `State Director Readiness — ${opts.traineeName} (${opts.state || "state TBD"})`,
    `Readiness: ${opts.readinessPct}%`,
    "",
    "Category completion:",
    ...opts.cats.map((c) => `  • ${c.label}: ${c.completion}%`),
    "",
    missing.length
      ? `Missing (${missing.length}):`
      : "All launch checklist items complete.",
    ...missing.map((m) => `  • ${m.label} — ${m.explanation}`),
    "",
    `Next action: ${opts.nextAction}`,
    opts.risks.length
      ? `Leadership decision needed: ${opts.risks.map((r) => RISK_LABEL[r]).join(", ")}`
      : "Leadership decision needed: none.",
  ];
  return lines.join("\n");
}