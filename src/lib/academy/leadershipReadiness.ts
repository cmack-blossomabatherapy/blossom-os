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

/**
 * Context for the launch checklist. Optional gating fields default to
 * permissive values when not provided (back-compat), but the dashboard
 * should populate them to enforce the strict State Director rules:
 *
 *  - quiz scores ≥ 80% across required knowledge checks
 *  - all required shadow modules signed off
 *  - mentor check-ins logged (≥ requiredCheckinCount, default 3)
 *  - final knowledge review module complete
 *  - readiness assessment module complete
 *  - leadership sign-off recorded
 *  - State Director Certification module marked complete
 */
export interface LaunchChecklistContext {
  welcomeComplete: boolean;
  readinessPct: number;
  checkinCount: number;
  quizScores?: number[];
  requiredQuizCount?: number;
  quizPassThreshold?: number;
  requiredCheckinCount?: number;
  shadowSignoffComplete?: boolean;
  finalKnowledgeReviewComplete?: boolean;
  readinessAssessmentComplete?: boolean;
  leadershipSignoffComplete?: boolean;
  certificationModuleComplete?: boolean;
}

export function computeLaunchChecklist(
  cats: ReadinessCategory[],
  ctx: LaunchChecklistContext,
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
  // Final knowledge review uses the explicit module flag if provided,
  // otherwise falls back to "all Week 5 leadership modules complete".
  const finalReviewExplicit = ctx.finalKnowledgeReviewComplete;
  const knowledgeDone =
    finalReviewExplicit !== undefined
      ? finalReviewExplicit
      : finalKnowledge?.completion === 100;
  const knowledgeStatus: ReadinessStatus = knowledgeDone ? "complete" : "not_started";

  // Quiz pass rate
  const quizThreshold = ctx.quizPassThreshold ?? 80;
  const quizScores = ctx.quizScores ?? [];
  const requiredQuizCount = ctx.requiredQuizCount ?? quizScores.length;
  const passedScores = quizScores.filter((s) => s >= quizThreshold).length;
  const quizPassStatus: ReadinessStatus =
    requiredQuizCount === 0 && quizScores.length === 0
      ? "not_started"
      : passedScores >= requiredQuizCount && requiredQuizCount > 0
        ? "complete"
        : quizScores.length > 0
          ? "in_progress"
          : "missing";

  // Shadow sign-off rollup
  const shadowCat = byKey.get("shadowing");
  const shadowSignoffDone =
    ctx.shadowSignoffComplete !== undefined
      ? ctx.shadowSignoffComplete
      : shadowCat?.status === "complete";

  // Required mentor check-ins
  const requiredCheckinCount = ctx.requiredCheckinCount ?? 3;
  const checkinDone = ctx.checkinCount >= requiredCheckinCount;

  // Readiness assessment + leadership sign-off + certification module
  const readinessAssessmentDone =
    ctx.readinessAssessmentComplete !== undefined
      ? ctx.readinessAssessmentComplete
      : ctx.readinessPct >= 80;
  const leadershipSignoffDone =
    ctx.leadershipSignoffComplete !== undefined
      ? ctx.leadershipSignoffComplete
      : byKey.get("final_signoff")?.status === "complete";
  const certModuleDone = ctx.certificationModuleComplete ?? false;

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
    {
      key: "shadow_signoff",
      label: "Required shadow sign-offs complete",
      status: shadowSignoffDone ? "complete" : (shadowCat?.completion ?? 0) > 0 ? "in_progress" : "missing",
      explanation: shadowSignoffDone
        ? "Every required shadow module is signed off."
        : "One or more required shadow modules still need mentor sign-off.",
      source: "shadow",
    },
    {
      key: "mentor_checkins_strict",
      label: `Mentor check-ins logged (≥ ${requiredCheckinCount})`,
      status: checkinDone ? "complete" : ctx.checkinCount > 0 ? "in_progress" : "missing",
      explanation: `${ctx.checkinCount} of ${requiredCheckinCount} mentor check-ins logged.`,
      source: "checkin",
    },
    {
      key: "quiz_pass_rate",
      label: `Knowledge checks ≥ ${quizThreshold}%`,
      status: quizPassStatus,
      explanation:
        quizScores.length === 0
          ? "No knowledge check scores recorded yet."
          : `${passedScores} of ${requiredQuizCount || quizScores.length} required quizzes scored ≥ ${quizThreshold}%.`,
      source: "progress",
    },
    {
      key: "final_knowledge",
      label: "Final knowledge review complete",
      status: knowledgeStatus,
      explanation:
        knowledgeStatus === "complete"
          ? "Final knowledge review completed."
          : "Final knowledge review not yet completed.",
      source: "module",
    },
    {
      key: "readiness_assessment",
      label: "Readiness assessment complete",
      status: readinessAssessmentDone
        ? "complete"
        : ctx.readinessPct >= 50
          ? "in_progress"
          : "not_started",
      explanation: `Overall readiness ${ctx.readinessPct}% (target 80%).`,
      source: "progress",
    },
    {
      key: "leadership_signoff",
      label: "Leadership sign-off complete",
      status: leadershipSignoffDone ? "complete" : "not_started",
      explanation: leadershipSignoffDone
        ? "Leadership sign-off recorded."
        : "Awaiting leadership sign-off.",
      source: "manual",
    },
    {
      key: "certification_module",
      label: "State Director Certification module complete",
      status: certModuleDone ? "complete" : "not_started",
      explanation: certModuleDone
        ? "Certification module marked complete."
        : "Certification module not yet marked complete.",
      source: "module",
    },
    (() => {
      // State Director Certification is only ready when EVERY gate is true:
      //   1. Welcome to Blossom complete
      //   2. All required launch categories complete (5 weeks)
      //   3. Required shadow modules complete AND signed off
      //   4. Mentor check-ins logged (≥ requiredCheckinCount)
      //   5. All required knowledge checks ≥ threshold
      //   6. Final knowledge review complete
      //   7. Readiness assessment complete
      //   8. Leadership sign-off recorded
      //   9. State Director Certification module marked complete
      const allCatsComplete = (
        [
          "foundations",
          "systems_client_flow",
          "authorizations_utilization",
          "staffing_recruiting_operations",
          "state_ownership_leadership",
        ] as SDReadinessCategoryKey[]
      ).every((k) => byKey.get(k)?.status === "complete");
      const shadowCatDone = shadowCat?.status === "complete";
      const quizPassDone = quizPassStatus === "complete";
      const ready =
        ctx.welcomeComplete &&
        allCatsComplete &&
        shadowCatDone &&
        shadowSignoffDone &&
        checkinDone &&
        quizPassDone &&
        knowledgeDone &&
        readinessAssessmentDone &&
        leadershipSignoffDone &&
        certModuleDone;
      const missing: string[] = [];
      if (!ctx.welcomeComplete) missing.push("welcome module");
      if (!allCatsComplete) missing.push("required launch modules");
      if (!shadowCatDone) missing.push("required shadowing");
      if (!shadowSignoffDone) missing.push("shadow sign-offs");
      if (!checkinDone) missing.push(`mentor check-ins (≥ ${requiredCheckinCount})`);
      if (!quizPassDone) missing.push(`knowledge checks ≥ ${quizThreshold}%`);
      if (!knowledgeDone) missing.push("final knowledge review");
      if (!readinessAssessmentDone) missing.push("readiness assessment");
      if (!leadershipSignoffDone) missing.push("leadership sign-off");
      if (!certModuleDone) missing.push("certification module");
      return {
        key: "certification",
        label: "State Director certification complete",
        status: ready ? "complete" : "not_started",
        explanation: ready
          ? "Certified — ready to lead state."
          : `Pending: ${missing.join(", ")}.`,
        source: "manual",
      } as LaunchChecklistItem;
    })(),
  ];
}

/**
 * "Not ready because…" — display-ready blockers derived from the checklist.
 * Excludes the synthetic certification rollup (which only summarizes blockers).
 */
export function computeReadinessBlockers(
  checklist: LaunchChecklistItem[],
): { key: string; label: string; explanation: string }[] {
  return checklist
    .filter((c) => c.key !== "certification" && c.status !== "complete")
    .map((c) => ({ key: c.key, label: c.label, explanation: c.explanation }));
}

/** True when every gate (except the certification rollup) is complete. */
export function isCertificationReady(checklist: LaunchChecklistItem[]): boolean {
  return checklist.find((c) => c.key === "certification")?.status === "complete";
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
  weekNumber?: number;
  dayNumber?: number;
  shadowHours?: number;
  checkinCount?: number;
  certificationStatus?: ReadinessStatus;
  setupGaps?: string[];
}): string {
  const blockers = computeReadinessBlockers(opts.checklist);
  const missing = opts.checklist.filter((c) => c.status !== "complete");
  const positionLine =
    opts.weekNumber != null
      ? `Position: Week ${opts.weekNumber}${opts.dayNumber != null ? ` · Day ${opts.dayNumber}` : ""}`
      : null;
  const evidenceLine =
    opts.shadowHours != null || opts.checkinCount != null
      ? `Evidence: ${opts.shadowHours ?? 0}h shadowing · ${opts.checkinCount ?? 0} mentor check-ins`
      : null;
  const certLine =
    opts.certificationStatus
      ? `Certification: ${opts.certificationStatus.replace("_", " ")}`
      : null;
  const lines = [
    `State Director Readiness — ${opts.traineeName} (${opts.state || "state TBD"})`,
    `Readiness: ${opts.readinessPct}%`,
    ...(positionLine ? [positionLine] : []),
    ...(evidenceLine ? [evidenceLine] : []),
    ...(certLine ? [certLine] : []),
    ...(opts.setupGaps && opts.setupGaps.length
      ? [`Setup gaps: ${opts.setupGaps.join(", ")}`]
      : []),
    "",
    "Category completion:",
    ...opts.cats.map((c) => `  • ${c.label}: ${c.completion}%`),
    "",
    blockers.length
      ? `Not ready because (${blockers.length}):`
      : "All certification gates complete.",
    ...blockers.map((b) => `  • ${b.label} — ${b.explanation}`),
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